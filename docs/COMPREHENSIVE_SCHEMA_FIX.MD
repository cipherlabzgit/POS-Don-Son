# Comprehensive Database Schema Fix - All Missing Columns

## Problem Summary
The DMS Backend has experienced schema drift where Entity Framework entity properties exist in the code but corresponding database columns are missing. This causes errors like:
- `column "status" does not exist`
- `column "category_colors" does not exist`
- And potentially many others

## Root Cause
Multiple migrations over time have created schema drift due to:
1. Migrations running in inconsistent order
2. Empty `Up()` methods in some migrations
3. Database state not matching EF model state
4. Manual database changes outside of migrations

## Complete Solution

### New Comprehensive Migration Created
**File:** `20260519141900_EnsureAllSchemaColumns.cs`

This single, comprehensive migration ensures ALL known missing columns are added to the database. It includes:

### Tables and Columns Fixed

#### 1. **pos_theme_configs**
- `category_colors` (jsonb) - Category color palette

#### 2. **showroom_label_requests**
- `status` (varchar(20)) - Request status
- `display_no` (varchar(50)) - Display number
- `approved_by_id` (uuid) - Approver user ID
- `approved_date` (timestamp) - Approval timestamp
- `rejected_by_id` (uuid) - Rejector user ID
- `rejected_date` (timestamp) - Rejection timestamp

#### 3. **pos_sales**
- `status` (varchar(32)) - Sale status
- `approved_by_id` (uuid) - Approver user ID
- `approved_at` (timestamp) - Approval timestamp
- `rejected_by_id` (uuid) - Rejector user ID
- `rejected_at` (timestamp) - Rejection timestamp
- `rejection_reason` (varchar(500)) - Rejection reason

#### 4. **products**
- `WeightGrams` (numeric) - Product weight
- `StandardQuantity` (numeric) - Standard quantity
- `DisplayInPOS` (boolean) - Show in POS
- `LabelTemplateId` (uuid) - Label template FK
- `production_section_id` (uuid) - Production section FK

#### 5. **ingredients**
- `reorder_threshold` (numeric) - Reorder threshold
- `low_stock_alert_enabled` (boolean) - Alert enabled flag
- `low_stock_threshold` (numeric) - Low stock threshold
- `AllowExtraQty` (boolean) - Allow extra quantity
- `ExtraQtyNote` (varchar(500)) - Extra quantity note

#### 6. **delivery_plan_items**
- `extra_quantity` (numeric) - Extra quantity
- `is_excluded` (boolean) - Exclusion flag
- `weight_variant_id` (uuid) - Weight variant FK

#### 7. **immediate_orders**
- `delivery_date` (date) - Delivery date
- `delivery_time` (varchar(20)) - Delivery time
- `need_by_date` (timestamp) - Need by date
- `need_by_time` (varchar(20)) - Need by time
- `order_bill_no` (varchar(50)) - Bill number
- `production_start_date` (date) - Production start date
- `production_start_time` (varchar(20)) - Production start time
- `recipe_request_number` (varchar(100)) - Recipe request number

#### 8. **delivery_plans**
- `recipe_plan_id` (uuid) - Recipe plan FK

#### 9. **rounding_rules**
- `ratio_base_quantity` (numeric) - Base quantity for ratio
- `ratio_yield_quantity` (numeric) - Yield quantity for ratio

#### 10. **stock_bf**
- `client_mutation_id` (varchar(80)) - Client mutation ID

#### 11. **day_types**
- `applicable_days` (varchar(20)) - Applicable days

#### 12. **outlet_employees**
- Makes `user_id` nullable (was NOT NULL)

### Additionally Created
- All required indexes for foreign key columns
- All required foreign key constraints
- Proper ON DELETE behaviors

## How to Apply

### Step 1: Stop the Backend
```powershell
Get-Process -Name "DMS-Backend" | Stop-Process -Force
```

### Step 2: Run the Application
The new migration will apply automatically on startup:

```powershell
cd "c:\Cipher Labz\DonandSons-New\DonandSons-DMS\DMS-Backend"
dotnet run
```

### Step 3: Verify Success
Look for these log messages:
```
[INFO] Applying migration '20260519141900_EnsureAllSchemaColumns'
[INFO] Database migration completed successfully
[INFO] Database seeded successfully
[INFO] DMS Backend API started successfully
```

## Migration Features

### Idempotent & Safe
- ✅ Checks if each table exists before operating
- ✅ Checks if each column exists before adding
- ✅ Can be run multiple times safely
- ✅ No data loss - adds columns only
- ✅ Sets sensible defaults for new columns
- ✅ Preserves existing data

### Down Migration
The `Down()` method is intentionally empty to prevent accidental data loss. This is a repair migration meant to be permanent.

## Alternative: Manual Application

If you prefer to apply the fix manually via SQL:

```powershell
# Extract the SQL from the migration
cd "c:\Cipher Labz\DonandSons-New\DonandSons-DMS\DMS-Backend"

# Apply a specific migration
dotnet ef database update 20260519141900_EnsureAllSchemaColumns
```

## Troubleshooting

### Issue: Migration Already Applied
**Error:** `Migration '20260519141900_EnsureAllSchemaColumns' has already been applied`

**Solution:** This is fine! The migration is idempotent. If you still get column errors, check:
1. Connection string is correct
2. You're connected to the right database
3. Application is using the correct connection string

### Issue: Table Does Not Exist
**Error:** `relation "pos_theme_configs" does not exist`

**Solution:** Run all migrations from scratch:
```powershell
# Option 1: Reset database (⚠ DELETES ALL DATA)
dotnet ef database drop --force
dotnet run

# Option 2: Apply all migrations
dotnet ef database update
```

### Issue: Foreign Key Violation
**Error:** `insert or update on table violates foreign key constraint`

**Solution:** The migration creates FK constraints that might fail if referenced data doesn't exist. Check that:
1. `users` table exists and has data
2. `label_templates` table exists
3. `production_sections` table exists
4. `product_weight_variants` table exists
5. `recipe_plans` table exists

## Database Connection Verification

Verify your connection string in `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=dms_erp_db;Username=postgres;Password=your_password"
  }
}
```

Or check environment variables (docker/.env):
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`

## Testing the Fix

After applying the migration, test these endpoints:
1. `GET /api/pos-theme-configs/active` - Should return active theme with category colors
2. `GET /api/showroom-label-requests` - Should return label requests with status
3. `GET /api/pos-sales` - Should return sales with status
4. `GET /api/products` - Should return products with all fields

## Prevention

This migration addresses all currently known schema drift issues. To prevent future issues:

1. **Always use EF migrations** for schema changes
2. **Never manually ALTER tables** without creating a migration
3. **Test migrations** on a dev database before production
4. **Keep migrations in sync** across all environments
5. **Use the new comprehensive migration** as a template for future repairs

## Files Modified/Created

### New Files
- `DMS-Backend/Migrations/20260519141900_EnsureAllSchemaColumns.cs`
- `DMS-Backend/Migrations/20260519141900_EnsureAllSchemaColumns.Designer.cs`

### Previous Fixes
- `DMS-Backend/Migrations/20260515053004_AddShowroomLabelRequestApprovalFields.cs` (updated)
- `DMS-Backend/Migrations/20260515090000_AutoApprovePosSales.cs` (updated)

## Success Criteria

After applying this migration, you should:
- ✅ See no "column does not exist" errors
- ✅ See all API endpoints working
- ✅ See POS theme configuration loading correctly
- ✅ See approval workflows functioning
- ✅ See all product data displaying correctly

## Support

If you continue to experience issues:
1. Check application logs in `DMS-Backend/logs/`
2. Verify PostgreSQL version (should be 12+)
3. Check EF Core version compatibility
4. Review the `__EFMigrationsHistory` table to see which migrations were applied
5. Compare your database schema with the entity models

---

**Status:** ✅ Comprehensive migration created and ready to apply  
**Date:** 2026-05-19  
**Impact:** Low (additive changes only, no data loss)  
**Estimated Time:** 5-10 seconds to apply
