@echo off
REM =============================================================================
REM PERMISSION SYSTEM FIX - DEPLOYMENT SCRIPT
REM =============================================================================
REM This script helps you apply the permission system fix
REM Make sure PostgreSQL is running and you have database credentials ready
REM =============================================================================

echo.
echo ========================================
echo  PERMISSION SYSTEM FIX - DEPLOYMENT
echo ========================================
echo.
echo This script will:
echo  1. Backup your database
echo  2. Clear old broken permissions
echo  3. Guide you to restart the app (to seed new permissions)
echo  4. Verify new permissions
echo  5. Reassign permissions to roles
echo.
echo Press Ctrl+C to cancel, or
pause

REM =============================================================================
REM Get Database Connection Details
REM =============================================================================

set /p DB_HOST="Enter database host (default: localhost): "
if "%DB_HOST%"=="" set DB_HOST=localhost

set /p DB_PORT="Enter database port (default: 5432): "
if "%DB_PORT%"=="" set DB_PORT=5432

set /p DB_USER="Enter database user (default: postgres): "
if "%DB_USER%"=="" set DB_USER=postgres

set /p DB_NAME="Enter database name: "
if "%DB_NAME%"=="" (
    echo ERROR: Database name is required!
    pause
    exit /b 1
)

echo.
echo Using connection:
echo   Host: %DB_HOST%
echo   Port: %DB_PORT%
echo   User: %DB_USER%
echo   Database: %DB_NAME%
echo.
pause

REM =============================================================================
REM Step 1: Backup Database
REM =============================================================================

echo.
echo ========================================
echo  STEP 1: BACKING UP DATABASE
echo ========================================
echo.

set BACKUP_FILE=backup_%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%.sql
set BACKUP_FILE=%BACKUP_FILE: =0%

echo Creating backup: %BACKUP_FILE%
pg_dump -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f %BACKUP_FILE%

if errorlevel 1 (
    echo ERROR: Backup failed!
    echo Please check your database connection and credentials.
    pause
    exit /b 1
)

echo.
echo ✓ Backup created successfully: %BACKUP_FILE%
echo.
pause

REM =============================================================================
REM Step 2: Clear Old Permissions
REM =============================================================================

echo.
echo ========================================
echo  STEP 2: CLEARING OLD PERMISSIONS
echo ========================================
echo.
echo WARNING: This will delete all existing permissions!
echo The backup was created at: %BACKUP_FILE%
echo.
set /p CONFIRM="Type 'YES' to continue: "

if not "%CONFIRM%"=="YES" (
    echo.
    echo Cancelled by user.
    pause
    exit /b 0
)

echo.
echo Clearing old permissions...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f clear_permissions.sql

if errorlevel 1 (
    echo ERROR: Failed to clear permissions!
    echo You can restore from backup: %BACKUP_FILE%
    pause
    exit /b 1
)

echo.
echo ✓ Old permissions cleared successfully
echo.
pause

REM =============================================================================
REM Step 3: Restart Application
REM =============================================================================

echo.
echo ========================================
echo  STEP 3: RESTART APPLICATION
echo ========================================
echo.
echo Please follow these steps:
echo.
echo  1. Stop your DMS-Backend application if it's running
echo  2. Navigate to DMS-Backend folder
echo  3. Run: dotnet run
echo  4. Wait for application to start (new permissions will be seeded)
echo  5. Check console for "Database seeded successfully" message
echo.
echo DO NOT continue to next step until the application has started!
echo.
pause

REM =============================================================================
REM Step 4: Verify Permissions
REM =============================================================================

echo.
echo ========================================
echo  STEP 4: VERIFYING PERMISSIONS
echo ========================================
echo.
echo Running verification script...
echo.

psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f verify_permissions.sql

if errorlevel 1 (
    echo ERROR: Verification failed!
    echo Check the output above for details.
    pause
    exit /b 1
)

echo.
echo Check the output above:
echo  - Should show 170+ permissions
echo  - All should use colon notation (:)
echo  - Zero should use dot notation (.)
echo.
set /p VERIFY_OK="Does verification look correct? (Y/N): "

if /i not "%VERIFY_OK%"=="Y" (
    echo.
    echo Please review the verification output and fix any issues.
    echo You can restore from backup if needed: %BACKUP_FILE%
    pause
    exit /b 1
)

REM =============================================================================
REM Step 5: Reassign Permissions
REM =============================================================================

echo.
echo ========================================
echo  STEP 5: REASSIGNING PERMISSIONS
echo ========================================
echo.
echo This will create/update standard roles:
echo  - Administrator (all permissions)
echo  - Manager (most operations)
echo  - Supervisor (operational access)
echo  - User (basic access)
echo  - Viewer (read-only)
echo.
set /p REASSIGN="Apply default role assignments? (Y/N): "

if /i "%REASSIGN%"=="Y" (
    echo.
    echo Assigning permissions to roles...
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f reassign_permissions.sql
    
    if errorlevel 1 (
        echo WARNING: Some permission assignments may have failed.
        echo Check the output above for details.
    ) else (
        echo.
        echo ✓ Permissions assigned successfully
    )
) else (
    echo.
    echo Skipped role assignment.
    echo You can assign permissions manually through the admin UI.
)

REM =============================================================================
REM Completion
REM =============================================================================

echo.
echo ========================================
echo  DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo Summary:
echo  ✓ Database backed up to: %BACKUP_FILE%
echo  ✓ Old permissions cleared
echo  ✓ New permissions seeded
echo  ✓ Permissions verified
if /i "%REASSIGN%"=="Y" echo  ✓ Roles configured
echo.
echo Next steps:
echo  1. Test login with a non-super-admin user
echo  2. Verify user can access endpoints based on role
echo  3. Test the 6 previously unprotected controllers
echo  4. Monitor for any permission-related issues
echo.
echo For detailed information, see:
echo  - IMPLEMENTATION_COMPLETE.md
echo  - README_PERMISSION_FIX.md
echo.
echo If you encounter issues:
echo  - Restore from backup: %BACKUP_FILE%
echo  - Review the documentation files
echo  - Run verify_permissions.sql to check permission state
echo.
pause
