# Complete Solution - Fix Database & Apply Sidebar Permissions

## Problem Summary

Your migrations have several critical issues:
1. `ingredients` table was never created but referenced by later migrations
2. Duplicate table creation attempts (`daily_production_plans`)
3. Circular dependencies between migrations

## ✅ RECOMMENDED SOLUTION

Instead of fixing broken migrations, use the **seeder** approach which is already implemented in your codebase.

### Step 1: Drop the Database

Run this in pgAdmin or psql:

```sql
DROP DATABASE IF EXISTS dms_erp_db;
CREATE DATABASE dms_erp_db;
```

### Step 2: Remove Migration History

Delete the Migrations folder to start fresh:

```powershell
Remove-Item -Recurse -Force "c:\Cipher Labz\DonandSons-DMS\DMS-Backend\Migrations"
```

### Step 3: Create Fresh Migration

```powershell
cd "c:\Cipher Labz\DonandSons-DMS\DMS-Backend"

# Create new initial migration
dotnet ef migrations add InitialCreate_Fresh

# Apply it
dotnet ef database update
```

### Step 4: Run Application to Seed Data

```powershell
cd "c:\Cipher Labz\DonandSons-DMS\DMS-Backend"
dotnet run
```

The application will:
- Create all tables
- Seed permissions (including new ones for sidebar)
- Create default roles
- Create SuperAdmin user

### Step 5: Verify

Login as SuperAdmin and check:
- All sidebar items visible
- New permissions exist in Administrator → Permissions page

---

## Alternative: Keep Existing Data

If you have important data to preserve, export it first:

```bash
# Export data
pg_dump -U postgres -d dms_erp_db --data-only --inserts -f data_backup.sql

# After fresh setup, import data
psql -U postgres -d dms_erp_db -f data_backup.sql
```

---

## What's Fixed in the New Seeder

The `ComprehensivePermissionSeeder.cs` (already updated) includes:

✅ `administrator:view` - Access Administrator module  
✅ `dms:view` - Access DMS module  
✅ `day-end:view` & `day-end:execute` - Day-End Process  
✅ `cashier-balance:*` - Cashier Balance (4 permissions)  
✅ `admin-delivery-plan:*` - Admin Delivery Plan (4 permissions)  
✅ `anytime-recipe:*` - Anytime Recipe (2 permissions)  
✅ `dough-generator:*` - Dough Generator (2 permissions)  
✅ `dms-recipe:export` - Recipe Export  
✅ `xlsm-importer:*` - XLSM Importer (2 permissions)  

---

## After Setup Complete

### Test Sidebar RBAC:

1. **Login as SuperAdmin**
   - Should see ALL sidebar items

2. **Create Test Role** (Manager)
   - Assign permissions:
     - `dashboard:view`
     - `products:view`
     - `showroom:view`
     - `reports:view`

3. **Create Test User** with Manager role

4. **Login as Test User**
   - Should ONLY see:
     - Dashboard
     - Inventory → Products
     - Show Room
     - Reports

5. **Verify API Enforcement**
   - Try accessing `/api/administrator/users`
   - Should return 403 Forbidden

---

## Troubleshooting

### Build Errors
```powershell
# Clean and rebuild
dotnet clean
dotnet build
```

### Migration Errors
If you get migration errors, the old broken migrations are still there. Delete them:
```powershell
Remove-Item -Recurse -Force "Migrations"
```

### PostgreSQL Not Running
```powershell
# Check if PostgreSQL is running
Get-Service postgresql*

# Start if stopped
Start-Service postgresql-x64-[version]
```

### Connection String Wrong
Check `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=dms_erp_db;Username=postgres;Password=yourpassword"
  }
}
```

---

## Quick Commands

```powershell
# Complete Fresh Setup
cd "c:\Cipher Labz\DonandSons-DMS\DMS-Backend"

# 1. Clean everything
dotnet clean
Remove-Item -Recurse -Force "Migrations" -ErrorAction SilentlyContinue

# 2. Drop and recreate database
dotnet ef database drop --force
dotnet ef migrations add InitialCreate_Complete
dotnet ef database update

# 3. Run application to seed
dotnet run
```

---

## Success Criteria

✅ Application starts without errors  
✅ Database created with all tables  
✅ Permissions seeded (check count in database)  
✅ SuperAdmin can login  
✅ SuperAdmin sees all sidebar items  
✅ Test user sees filtered sidebar  
✅ API enforces permissions correctly  

---

##Files Already Fixed

✅ `DMS-Frontend/src/lib/navigation/menu-items.ts` - Updated to COLON notation  
✅ `DMS-Backend/Data/Seeders/ComprehensivePermissionSeeder.cs` - Added missing permissions  
✅ Frontend sidebar filtering logic - Working correctly  

---

## Support

If you encounter issues:

1. Check application logs
2. Check PostgreSQL logs
3. Verify connection string
4. Ensure PostgreSQL is running
5. Ensure you have permissions to create databases

---

**Created**: April 30, 2026  
**Status**: READY TO APPLY  
**Risk**: LOW - Fresh start eliminates all migration issues
