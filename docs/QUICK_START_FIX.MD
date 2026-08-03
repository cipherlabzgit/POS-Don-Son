# ==============================================================================
# Quick Start Guide - Database Schema Fix
# ==============================================================================

## Problem
You're experiencing errors like:
- `column "status" does not exist`
- `column "category_colors" does not exist`
- Other similar column-related errors

## Solution
A comprehensive migration has been created that fixes ALL schema drift issues in one go.

## Quick Fix (Recommended)

### Step 1: Stop the Backend
```powershell
# Find and stop the running process
Get-Process -Name "DMS-Backend" -ErrorAction SilentlyContinue | Stop-Process -Force
```

### Step 2: Start the Backend
```powershell
cd "c:\Cipher Labz\DonandSons-New\DonandSons-DMS\DMS-Backend"
dotnet run
```

That's it! The new migration will apply automatically and fix all column issues.

## What Gets Fixed

The comprehensive migration `20260519141900_EnsureAllSchemaColumns` adds all missing columns to:

- **pos_theme_configs** - category_colors (jsonb)
- **showroom_label_requests** - status, display_no, approval fields
- **pos_sales** - status, approval workflow fields
- **products** - WeightGrams, StandardQuantity, DisplayInPOS, LabelTemplateId, production_section_id
- **ingredients** - stock alerts, extra quantity fields
- **delivery_plan_items** - extra_quantity, is_excluded, weight_variant_id
- **immediate_orders** - scheduling fields (8 columns)
- **delivery_plans** - recipe_plan_id
- **rounding_rules** - ratio columns
- **stock_bf** - client_mutation_id
- **day_types** - applicable_days
- **outlet_employees** - makes user_id nullable

Plus all required indexes and foreign keys!

## Verify Success

After starting the backend, look for these messages:
```
✓ Applying migration '20260519141900_EnsureAllSchemaColumns'
✓ Database migration completed successfully
✓ Database seeded successfully
✓ DMS Backend API started successfully
```

## Alternative: Use the Helper Script

```powershell
.\fix-database.ps1
# Choose option 1
```

## If You Still Have Issues

### Option 1: Check Connection String
Make sure `appsettings.json` has the correct database credentials:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=dms_erp_db;Username=postgres;Password=your_password"
  }
}
```

### Option 2: Reset Database (⚠ DELETES ALL DATA)
```powershell
# Connect to PostgreSQL
psql -U postgres -h localhost -p 5432

# Drop and recreate
DROP DATABASE IF EXISTS dms_erp_db;
CREATE DATABASE dms_erp_db;
\q

# Start backend (migrations will apply fresh)
cd "c:\Cipher Labz\DonandSons-New\DonandSons-DMS\DMS-Backend"
dotnet run
```

### Option 3: Apply Migration Manually
```powershell
cd "c:\Cipher Labz\DonandSons-New\DonandSons-DMS\DMS-Backend"
dotnet ef database update
```

## Documentation

For detailed information, see:
- **COMPREHENSIVE_SCHEMA_FIX.md** - Full technical details
- **MIGRATION_FIX_GUIDE.md** - Step-by-step guide
- **FIX_SUMMARY.md** - Summary of previous fixes

## Need Help?

1. Check logs: `DMS-Backend/logs/`
2. Verify PostgreSQL is running: `docker ps` or `Get-Service postgres*`
3. Check which migrations were applied: 
   ```sql
   SELECT * FROM "__EFMigrationsHistory" ORDER BY "MigrationId" DESC;
   ```

---

**TL;DR:** Stop the backend, run `dotnet run`, done!
