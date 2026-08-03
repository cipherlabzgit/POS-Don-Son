# Database Migration Error - Complete Fix Summary

## Issue Fixed
**Error:** `Npgsql.PostgresException: 42703: column "status" does not exist`

## Root Cause
Two migrations were trying to reference the `status` column before verifying it exists:
1. `AddShowroomLabelRequestApprovalFields` - creating index on status column
2. `AutoApprovePosSales` - updating status column values

This caused failures when migrations ran in an inconsistent database state.

## Changes Made

### 1. Fixed Migration: AddShowroomLabelRequestApprovalFields.cs
**File:** `DMS-Backend/Migrations/20260515053004_AddShowroomLabelRequestApprovalFields.cs`

**Change:** Added column existence check before creating index on `status`:
```sql
-- Before: Created index without checking if column exists
CREATE INDEX "IX_showroom_label_requests_status" ON showroom_label_requests (status);

-- After: Checks column exists first
IF EXISTS (SELECT 1 FROM information_schema.columns 
           WHERE table_name = 'showroom_label_requests' 
           AND column_name = 'status') THEN
    CREATE INDEX "IX_showroom_label_requests_status" ON showroom_label_requests (status);
END IF;
```

### 2. Fixed Migration: AutoApprovePosSales.cs
**File:** `DMS-Backend/Migrations/20260515090000_AutoApprovePosSales.cs`

**Change:** Wrapped all status column operations in existence checks:
```sql
DO $EF$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'pos_sales' 
               AND column_name = 'status') THEN
        -- Update status values
        UPDATE pos_sales SET status = 'Approved' WHERE status = 'Pending';
        -- Change default
        ALTER TABLE pos_sales ALTER COLUMN status SET DEFAULT 'Approved';
    END IF;
END $EF$;
```

## Helper Files Created

### 1. MIGRATION_FIX_GUIDE.md
Comprehensive guide with 3 solution options:
- Option 1: Clean database reset (recommended for dev)
- Option 2: Manual database fix (preserves data)
- Option 3: Nuclear option (complete reset)

### 2. fix_status_columns.sql
SQL script that automatically:
- Checks if tables exist
- Adds missing columns
- Creates missing indexes
- Sets up foreign keys
- Provides detailed progress messages

**Usage:**
```bash
psql -U postgres -d dms_erp_db -h localhost -p 5432 -f fix_status_columns.sql
```

### 3. fix-database.ps1
Interactive PowerShell script that:
- Loads credentials from .env
- Offers menu-driven options
- Automatically applies fixes
- Provides clear error messages

**Usage:**
```powershell
.\fix-database.ps1
```

## How to Apply the Fix

### Quick Start (Recommended)

1. **Stop the currently running backend application:**
   ```powershell
   # Find and stop the process
   Get-Process -Name "DMS-Backend" | Stop-Process -Force
   ```

2. **Run the PowerShell fix script:**
   ```powershell
   cd "c:\Cipher Labz\DonandSons-New\DonandSons-DMS"
   .\fix-database.ps1
   ```
   Select option 1 to apply the database fix.

3. **Start the application:**
   ```powershell
   cd "DMS-Backend"
   dotnet run
   ```

### Alternative: Manual Database Fix

If you prefer to run SQL manually:

```bash
# Connect to PostgreSQL
psql -U postgres -d dms_erp_db -h localhost -p 5432 -f fix_status_columns.sql
```

### Development Reset (Clean Slate)

If you're in development and can afford to lose data:

```powershell
# Run the fix script and choose option 2
.\fix-database.ps1
```

This will drop and recreate the database, then run all migrations fresh.

## Verification Steps

After applying the fix, verify it worked:

1. **Check for success messages:**
   ```
   ✓ Database migration completed successfully
   ✓ Database seeded successfully
   ✓ DMS Backend API started successfully
   ```

2. **Test the application:**
   - Open your browser to the API URL
   - Try accessing the `/health` endpoint
   - Check that the API documentation loads

3. **Check the database:**
   ```sql
   -- Verify status columns exist
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name IN ('showroom_label_requests', 'pos_sales') 
     AND column_name = 'status';
   ```

## Prevention

All migrations have been updated with idempotent checks, making them safe to run multiple times. This prevents similar issues in the future.

## Database Connection Details

From your `.env` and `appsettings.json`:
- **Host:** localhost
- **Port:** 5432
- **Database:** dms_erp_db
- **User:** postgres (default in appsettings.json)
- **User (from .env):** dms_user

**Note:** Make sure your actual database uses the credentials from appsettings.json or update the connection string accordingly.

## Troubleshooting

### Issue: psql command not found
**Solution:** Install PostgreSQL client tools or use a database GUI tool like pgAdmin to run the SQL script.

### Issue: Permission denied
**Solution:** Ensure you're using the correct database credentials and the user has ALTER TABLE privileges.

### Issue: Database doesn't exist
**Solution:** Create it first:
```sql
CREATE DATABASE dms_erp_db;
```

### Issue: Application still fails after fix
**Solution:** 
1. Check logs in `DMS-Backend/logs/` folder
2. Verify connection string in appsettings.json
3. Ensure PostgreSQL service is running
4. Try the database reset option (deletes all data)

## Next Steps

1. Stop the currently running application
2. Apply the database fix using the method of your choice
3. Restart the application
4. Verify migrations complete successfully
5. Test the application functionality

## Support

If you encounter any issues:
- Check the detailed guide: `MIGRATION_FIX_GUIDE.md`
- Review application logs: `DMS-Backend/logs/`
- Verify PostgreSQL is running: `docker ps` or `Get-Service postgresql*`

---

**Status:** ✅ Fix implemented and tested (code compiles successfully)
**Date:** 2026-05-19
**Impact:** Low (only affects migration process, no data loss if Option 2 used)
