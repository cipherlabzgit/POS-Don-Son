# Apply Sidebar Permissions Migration

## Quick Start (Recommended Method)

This migration adds 18 missing permissions needed for the sidebar RBAC system.

### Option 1: Using EF Core CLI (Simplest)

```bash
cd DMS-Backend

# Apply the migration
dotnet ef database update

# Verify migration was applied
dotnet ef migrations list
```

**That's it!** The migration will:
- Check if permissions already exist (safe to run multiple times)
- Add 18 new permissions
- Automatically assign DisplayOrder values
- Preserve all existing data

### Option 2: Using Visual Studio Package Manager Console

```powershell
# In Package Manager Console
Update-Database
```

### Option 3: Application Startup (Automatic)

The migration will run automatically when you start the application if you have auto-migration enabled in `Program.cs`:

```bash
cd DMS-Backend
dotnet run
```

---

## What This Migration Does

### Adds 18 New Permissions:

**Administrator Module:**
1. `administrator:view` - Access to Administrator module
2. `day-end:view` - View day-end process
3. `day-end:execute` - Execute day-end process
4. `cashier-balance:view` - View cashier balance
5. `cashier-balance:create` - Create cashier balance
6. `cashier-balance:edit` - Update cashier balance
7. `cashier-balance:delete` - Delete cashier balance
8. `admin-delivery-plan:view` - View admin delivery plan
9. `admin-delivery-plan:create` - Create admin delivery plan
10. `admin-delivery-plan:edit` - Update admin delivery plan
11. `admin-delivery-plan:delete` - Delete admin delivery plan

**DMS Module:**
12. `dms:view` - Access to DMS module
13. `anytime-recipe:view` - View anytime recipe generator
14. `anytime-recipe:generate` - Generate anytime recipes
15. `dough-generator:view` - View dough generator
16. `dough-generator:generate` - Generate dough recipes
17. `dms-recipe:export` - Export DMS recipes
18. `xlsm-importer:view` - View XLSM importer
19. `xlsm-importer:import` - Import XLSM files

---

## Verification

### Check if Migration Applied Successfully

```bash
cd DMS-Backend

# List all migrations (the new one should appear at the bottom)
dotnet ef migrations list
```

You should see:
```
...
20260429135308_AddShiftsTableAndUpdateDailyProduction
20260430040000_AddMissingPermissionsForSidebar (Pending) ← Before running
or
20260430040000_AddMissingPermissionsForSidebar ← After running
```

### Verify Permissions in Database

Connect to your database and run:

```sql
-- Check total permission count (should be increased by ~18)
SELECT COUNT(*) FROM "Permissions";

-- Check if new permissions exist
SELECT "Code", "Name", "Module" 
FROM "Permissions"
WHERE "Code" IN (
    'administrator:view',
    'dms:view',
    'day-end:view',
    'cashier-balance:view',
    'anytime-recipe:view',
    'dough-generator:view',
    'dms-recipe:export',
    'xlsm-importer:view'
)
ORDER BY "Code";
```

You should see 8 rows returned.

---

## Troubleshooting

### Error: "Build failed"

**Solution**: Make sure you're in the correct directory
```bash
cd DMS-Backend
dotnet build
dotnet ef database update
```

### Error: "No DbContext was found"

**Solution**: Ensure you're running from the DMS-Backend project directory
```bash
cd DMS-Backend
dotnet ef database update --project .
```

### Error: "The tools version is older than that of the runtime"

**Solution**: Update EF Core tools
```bash
dotnet tool update --global dotnet-ef
```

### Error: "Connection string not found"

**Solution**: Check your `appsettings.json` has the correct connection string
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=DMS;Username=postgres;Password=yourpassword"
  }
}
```

### Migration Already Applied?

If you get a message saying the migration is already applied, that's fine! The migration is idempotent (safe to run multiple times).

To verify:
```bash
dotnet ef migrations list
```

If you see the migration without "(Pending)", it's already applied.

---

## Rollback (If Needed)

If you need to rollback this migration:

```bash
cd DMS-Backend

# Rollback to previous migration
dotnet ef database update 20260429135308_AddShiftsTableAndUpdateDailyProduction
```

This will remove the 18 permissions that were added.

---

## Production Deployment

### Recommended Approach for Production:

1. **Backup database first** (CRITICAL!)
   ```bash
   pg_dump -U postgres -d DMS > backup_before_permissions_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Test on staging environment first**
   ```bash
   # On staging server
   cd DMS-Backend
   dotnet ef database update
   # Test the application
   ```

3. **Deploy to production during maintenance window**
   ```bash
   # On production server
   cd DMS-Backend
   dotnet ef database update
   ```

4. **Verify**
   ```sql
   SELECT COUNT(*) FROM "Permissions" WHERE "Code" LIKE '%:view';
   ```

5. **Restart application**
   ```bash
   sudo systemctl restart dms-backend
   ```

---

## Next Steps After Migration

1. **Users must logout and login** to get fresh JWT tokens with updated permissions

2. **Assign new permissions to roles**:
   ```sql
   -- Example: Give Manager role access to DMS module
   INSERT INTO "RolePermissions" ("RoleId", "PermissionId")
   SELECT 
       r."Id",
       p."Id"
   FROM "Roles" r
   CROSS JOIN "Permissions" p
   WHERE r."Name" = 'Manager'
   AND p."Code" = 'dms:view';
   ```

3. **Test sidebar filtering** with different user roles

4. **Verify RBAC works correctly**:
   - Login as SuperAdmin → Should see all menu items
   - Login as regular user → Should see filtered menu based on permissions

---

## Files Involved

- ✅ `Migrations/20260430040000_AddMissingPermissionsForSidebar.cs` - Main migration file
- ✅ `Migrations/20260430040000_AddMissingPermissionsForSidebar.Designer.cs` - Designer file
- ✅ `Data/Seeders/ComprehensivePermissionSeeder.cs` - Updated with new permissions
- ✅ `DMS-Frontend/src/lib/navigation/menu-items.ts` - Updated with correct permission codes

---

## FAQ

**Q: Will this affect existing permissions?**  
A: No, the migration only adds new permissions. Existing permissions and role assignments are not modified.

**Q: Will this affect existing users?**  
A: No, but users need to logout and login to get updated JWT tokens.

**Q: Is this safe to run in production?**  
A: Yes, the migration is idempotent and only inserts data, no schema changes.

**Q: How long does it take?**  
A: Usually < 1 second. It's just inserting 18 rows.

**Q: Can I run it multiple times?**  
A: Yes, it checks if permissions exist before inserting.

**Q: What if I already ran the old SQL script?**  
A: That's fine. The migration will skip permissions that already exist.

---

## Success Criteria

Migration is successful if:
- ✅ No errors during `dotnet ef database update`
- ✅ Migration appears in `dotnet ef migrations list` (not Pending)
- ✅ 18 new permissions exist in database
- ✅ Application starts without errors
- ✅ Sidebar shows/hides items based on permissions

---

## Support

If you encounter any issues:

1. Check application logs
2. Check database connection
3. Verify EF Core tools installed: `dotnet ef --version`
4. Try rebuilding: `dotnet clean && dotnet build`
5. Check this documentation: `RBAC_SIDEBAR_IMPLEMENTATION_SUMMARY.md`

---

**Created**: April 30, 2026  
**Migration ID**: 20260430040000_AddMissingPermissionsForSidebar  
**Purpose**: Add missing permissions for sidebar RBAC alignment
