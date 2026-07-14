#!/bin/bash

# =============================================================================
# PERMISSION SYSTEM FIX - DEPLOYMENT SCRIPT
# =============================================================================
# This script helps you apply the permission system fix
# Make sure PostgreSQL is running and you have database credentials ready
# =============================================================================

echo ""
echo "========================================"
echo " PERMISSION SYSTEM FIX - DEPLOYMENT"
echo "========================================"
echo ""
echo "This script will:"
echo " 1. Backup your database"
echo " 2. Clear old broken permissions"
echo " 3. Guide you to restart the app (to seed new permissions)"
echo " 4. Verify new permissions"
echo " 5. Reassign permissions to roles"
echo ""
read -p "Press Enter to continue (Ctrl+C to cancel)..."

# =============================================================================
# Get Database Connection Details
# =============================================================================

read -p "Enter database host (default: localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Enter database port (default: 5432): " DB_PORT
DB_PORT=${DB_PORT:-5432}

read -p "Enter database user (default: postgres): " DB_USER
DB_USER=${DB_USER:-postgres}

read -p "Enter database name: " DB_NAME
if [ -z "$DB_NAME" ]; then
    echo "ERROR: Database name is required!"
    exit 1
fi

echo ""
echo "Using connection:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  User: $DB_USER"
echo "  Database: $DB_NAME"
echo ""
read -p "Press Enter to continue..."

# =============================================================================
# Step 1: Backup Database
# =============================================================================

echo ""
echo "========================================"
echo " STEP 1: BACKING UP DATABASE"
echo "========================================"
echo ""

BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"

echo "Creating backup: $BACKUP_FILE"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$BACKUP_FILE"

if [ $? -ne 0 ]; then
    echo "ERROR: Backup failed!"
    echo "Please check your database connection and credentials."
    exit 1
fi

echo ""
echo "✓ Backup created successfully: $BACKUP_FILE"
echo ""
read -p "Press Enter to continue..."

# =============================================================================
# Step 2: Clear Old Permissions
# =============================================================================

echo ""
echo "========================================"
echo " STEP 2: CLEARING OLD PERMISSIONS"
echo "========================================"
echo ""
echo "WARNING: This will delete all existing permissions!"
echo "The backup was created at: $BACKUP_FILE"
echo ""
read -p "Type 'YES' to continue: " CONFIRM

if [ "$CONFIRM" != "YES" ]; then
    echo ""
    echo "Cancelled by user."
    exit 0
fi

echo ""
echo "Clearing old permissions..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f clear_permissions.sql

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to clear permissions!"
    echo "You can restore from backup: $BACKUP_FILE"
    exit 1
fi

echo ""
echo "✓ Old permissions cleared successfully"
echo ""
read -p "Press Enter to continue..."

# =============================================================================
# Step 3: Restart Application
# =============================================================================

echo ""
echo "========================================"
echo " STEP 3: RESTART APPLICATION"
echo "========================================"
echo ""
echo "Please follow these steps:"
echo ""
echo " 1. Stop your DMS-Backend application if it's running"
echo " 2. Navigate to DMS-Backend folder"
echo " 3. Run: dotnet run"
echo " 4. Wait for application to start (new permissions will be seeded)"
echo " 5. Check console for 'Database seeded successfully' message"
echo ""
echo "DO NOT continue to next step until the application has started!"
echo ""
read -p "Press Enter when application is running..."

# =============================================================================
# Step 4: Verify Permissions
# =============================================================================

echo ""
echo "========================================"
echo " STEP 4: VERIFYING PERMISSIONS"
echo "========================================"
echo ""
echo "Running verification script..."
echo ""

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f verify_permissions.sql

if [ $? -ne 0 ]; then
    echo "ERROR: Verification failed!"
    echo "Check the output above for details."
    exit 1
fi

echo ""
echo "Check the output above:"
echo " - Should show 170+ permissions"
echo " - All should use colon notation (:)"
echo " - Zero should use dot notation (.)"
echo ""
read -p "Does verification look correct? (Y/N): " VERIFY_OK

if [ "$VERIFY_OK" != "Y" ] && [ "$VERIFY_OK" != "y" ]; then
    echo ""
    echo "Please review the verification output and fix any issues."
    echo "You can restore from backup if needed: $BACKUP_FILE"
    exit 1
fi

# =============================================================================
# Step 5: Reassign Permissions
# =============================================================================

echo ""
echo "========================================"
echo " STEP 5: REASSIGNING PERMISSIONS"
echo "========================================"
echo ""
echo "This will create/update standard roles:"
echo " - Administrator (all permissions)"
echo " - Manager (most operations)"
echo " - Supervisor (operational access)"
echo " - User (basic access)"
echo " - Viewer (read-only)"
echo ""
read -p "Apply default role assignments? (Y/N): " REASSIGN

if [ "$REASSIGN" = "Y" ] || [ "$REASSIGN" = "y" ]; then
    echo ""
    echo "Assigning permissions to roles..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f reassign_permissions.sql
    
    if [ $? -ne 0 ]; then
        echo "WARNING: Some permission assignments may have failed."
        echo "Check the output above for details."
    else
        echo ""
        echo "✓ Permissions assigned successfully"
    fi
else
    echo ""
    echo "Skipped role assignment."
    echo "You can assign permissions manually through the admin UI."
fi

# =============================================================================
# Completion
# =============================================================================

echo ""
echo "========================================"
echo " DEPLOYMENT COMPLETE!"
echo "========================================"
echo ""
echo "Summary:"
echo " ✓ Database backed up to: $BACKUP_FILE"
echo " ✓ Old permissions cleared"
echo " ✓ New permissions seeded"
echo " ✓ Permissions verified"
if [ "$REASSIGN" = "Y" ] || [ "$REASSIGN" = "y" ]; then
    echo " ✓ Roles configured"
fi
echo ""
echo "Next steps:"
echo " 1. Test login with a non-super-admin user"
echo " 2. Verify user can access endpoints based on role"
echo " 3. Test the 6 previously unprotected controllers"
echo " 4. Monitor for any permission-related issues"
echo ""
echo "For detailed information, see:"
echo " - IMPLEMENTATION_COMPLETE.md"
echo " - README_PERMISSION_FIX.md"
echo ""
echo "If you encounter issues:"
echo " - Restore from backup: $BACKUP_FILE"
echo " - Review the documentation files"
echo " - Run verify_permissions.sql to check permission state"
echo ""
