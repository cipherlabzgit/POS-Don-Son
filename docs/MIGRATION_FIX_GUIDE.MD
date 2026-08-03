# Migration Fix Guide - "Column Status Does Not Exist" Error

## Problem Summary
The error `42703: column "status" does not exist` occurs when migrations try to reference columns that haven't been created yet, typically due to database state inconsistencies or migrations running out of order.

## Fixes Applied

### 1. Fixed AddShowroomLabelRequestApprovalFields Migration
- Added column existence check before creating index on `status` column
- File: `DMS-Backend/Migrations/20260515053004_AddShowroomLabelRequestApprovalFields.cs`

### 2. Fixed AutoApprovePosSales Migration  
- Added column existence check before updating `status` column
- Converted AlterColumn to raw SQL with existence check
- File: `DMS-Backend/Migrations/20260515090000_AutoApprovePosSales.cs`

## Solution Options

### Option 1: Clean Database Reset (Recommended for Development)

**⚠️ WARNING: This will delete all data in your database!**

1. **Drop the existing database:**
   ```bash
   # Connect to PostgreSQL
   psql -U postgres -h localhost -p 5432
   
   # Drop and recreate the database
   DROP DATABASE IF EXISTS dms_erp_db;
   CREATE DATABASE dms_erp_db;
   \q
   ```

2. **Run the application** - migrations will apply cleanly on the fresh database:
   ```bash
   cd "c:\Cipher Labz\DonandSons-New\DonandSons-DMS\DMS-Backend"
   dotnet run
   ```

### Option 2: Manual Database Fix (Preserve Existing Data)

If you have data you need to keep, run this SQL script:

```sql
-- Connect to your database first
-- psql -U postgres -d dms_erp_db -h localhost -p 5432

-- Fix showroom_label_requests table
DO $EF$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = current_schema()
          AND table_name = 'showroom_label_requests'
    ) THEN
        -- Add status column if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'showroom_label_requests'
              AND column_name = 'status'
        ) THEN
            ALTER TABLE showroom_label_requests
              ADD COLUMN status character varying(20) NOT NULL DEFAULT 'Pending';
        END IF;
        
        -- Add other required columns
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'showroom_label_requests'
              AND column_name = 'display_no'
        ) THEN
            ALTER TABLE showroom_label_requests 
              ADD COLUMN display_no character varying(50) NOT NULL DEFAULT '';
        END IF;
    END IF;
END $EF$;

-- Fix pos_sales table
DO $EF$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = current_schema()
          AND table_name = 'pos_sales'
    ) THEN
        -- Add status column if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'pos_sales'
              AND column_name = 'status'
        ) THEN
            ALTER TABLE pos_sales
              ADD COLUMN status character varying(32) NOT NULL DEFAULT 'Approved';
        END IF;
        
        -- Add approval workflow columns if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'pos_sales'
              AND column_name = 'approved_by_id'
        ) THEN
            ALTER TABLE pos_sales ADD COLUMN approved_by_id uuid;
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'pos_sales'
              AND column_name = 'approved_at'
        ) THEN
            ALTER TABLE pos_sales ADD COLUMN approved_at timestamp with time zone;
        END IF;
    END IF;
END $EF$;

-- Clear migration history to allow re-running migrations
DELETE FROM "__EFMigrationsHistory" 
WHERE "MigrationId" >= '20260515053004_AddShowroomLabelRequestApprovalFields';
```

After running the SQL script, run your application again.

### Option 3: Reset Migrations (Nuclear Option)

**⚠️ WARNING: This will delete all migration history!**

```sql
-- Connect to database
-- psql -U postgres -d dms_erp_db -h localhost -p 5432

-- Drop all tables
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

Then run the application to apply all migrations fresh.

## Verification

After applying any of the above options, verify the fix:

```bash
cd "c:\Cipher Labz\DonandSons-New\DonandSons-DMS\DMS-Backend"
dotnet run
```

Look for these success messages in the console:
- ✅ `Database migration completed successfully`
- ✅ `Database seeded successfully`
- ✅ `DMS Backend API started successfully`

## Database Connection Details

From your `.env` file:
- Host: localhost
- Port: 5432
- Database: dms_erp_db
- User: postgres (from appsettings.json)

## What Caused This Issue?

1. **Migration ordering**: Some migrations referenced columns before they were created
2. **Partial migration application**: Database state got out of sync with migration history
3. **Missing existence checks**: Migrations didn't verify column existence before using them

## Prevention

All migrations have now been updated with proper existence checks, making them idempotent. This should prevent similar issues in the future.

## Need Help?

If you continue to experience issues:
1. Check PostgreSQL is running: `docker ps` or `systemctl status postgresql`
2. Verify connection details in appsettings.json match your database
3. Check logs in `DMS-Backend/logs/` folder for detailed error messages
