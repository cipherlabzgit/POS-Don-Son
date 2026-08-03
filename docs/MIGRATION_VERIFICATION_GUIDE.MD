# Migration Verification Guide

This guide helps you verify that Entity Framework migrations have been properly applied to your database.

## Quick Reference

### Command Summary

```bash
# Navigate to backend directory
cd DMS-Backend

# Check migration status
dotnet ef migrations list --project DMS-Backend.csproj

# Apply pending migrations
dotnet ef database update --project DMS-Backend.csproj

# Apply migrations with detailed output
dotnet ef database update --project DMS-Backend.csproj --verbose

# Check specific migration
dotnet ef database update <MigrationName> --project DMS-Backend.csproj
```

## Method 1: Using Entity Framework CLI

### Check Migration List

```bash
cd DMS-Backend
dotnet ef migrations list --project DMS-Backend.csproj
```

**Output Interpretation:**
- Migrations **WITHOUT** `(Pending)` → Already applied ✓
- Migrations **WITH** `(Pending)` → Not yet applied ⚠

**Example Output:**
```
20260515065200_AddCategoryColorsToPosThemeConfig
20260515053004_AddShowroomLabelRequestApprovalFields (Pending)
```

This means `AddCategoryColorsToPosThemeConfig` is applied, but `AddShowroomLabelRequestApprovalFields` is pending.

### Apply Pending Migrations

```bash
dotnet ef database update --project DMS-Backend.csproj
```

### Verify with Verbose Output

```bash
dotnet ef database update --project DMS-Backend.csproj --verbose
```

This shows:
- Connection string being used
- SQL commands being executed
- Which migrations are being applied

## Method 2: Check Database Directly

### Using PowerShell Script

Run the provided verification script:

```powershell
.\check-migrations.ps1
```

This script will:
1. List all EF migrations and their status
2. Query the database to show the last 10 applied migrations
3. Warn you if there are pending migrations

### Using SQL Query

Run the SQL file in pgAdmin, DBeaver, or any PostgreSQL client:

```sql
-- File: check-applied-migrations.sql

SELECT 
    migration_id,
    applied_at AT TIME ZONE 'Asia/Colombo' as applied_at_local
FROM "__EFMigrationsHistory"
ORDER BY applied_at DESC;
```

### Manual Query via psql

If you have PostgreSQL client tools installed:

```bash
psql -h localhost -p 5432 -U postgres -d dms_erp_db -c "SELECT migration_id, applied_at FROM \"__EFMigrationsHistory\" ORDER BY applied_at DESC LIMIT 10;"
```

## Method 3: Verify Actual Schema

Sometimes a migration is recorded in `__EFMigrationsHistory` but the actual schema change didn't apply (like we saw with `category_colors`). To verify:

### Check if Column Exists

```sql
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = current_schema() 
    AND table_name = 'your_table_name' 
    AND column_name = 'your_column_name'
) as column_exists;
```

**Example:**
```sql
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = current_schema() 
    AND table_name = 'pos_theme_configs' 
    AND column_name = 'category_colors'
) as column_exists;
```

Returns `true` if the column exists, `false` if it doesn't.

### Check Table Structure

```sql
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = current_schema()
AND table_name = 'your_table_name'
ORDER BY ordinal_position;
```

## Method 4: Application Startup Verification

Add this code to your `Program.cs` to verify migrations on startup:

```csharp
// After building the app, before app.Run()
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    
    // Check for pending migrations
    var pendingMigrations = await dbContext.Database.GetPendingMigrationsAsync();
    
    if (pendingMigrations.Any())
    {
        app.Logger.LogWarning("⚠ Pending migrations detected:");
        foreach (var migration in pendingMigrations)
        {
            app.Logger.LogWarning($"  - {migration}");
        }
        app.Logger.LogWarning("Run 'dotnet ef database update' to apply pending migrations.");
    }
    else
    {
        app.Logger.LogInformation("✓ Database is up to date. No pending migrations.");
    }
    
    // Show applied migrations
    var appliedMigrations = await dbContext.Database.GetAppliedMigrationsAsync();
    app.Logger.LogInformation($"Total applied migrations: {appliedMigrations.Count()}");
}
```

## Best Practices

### 1. **Always Check Before Running**

Before starting your application in production:

```bash
# Check for pending migrations
dotnet ef migrations list --project DMS-Backend.csproj

# If pending migrations exist, apply them
dotnet ef database update --project DMS-Backend.csproj
```

### 2. **Use Migration Scripts for Production**

For production deployments, generate SQL scripts instead of auto-applying:

```bash
# Generate SQL script for all pending migrations
dotnet ef migrations script --project DMS-Backend.csproj --idempotent --output migration.sql

# Review the script, then apply it manually
```

The `--idempotent` flag makes the script safe to run multiple times.

### 3. **Verify After Applying**

After applying migrations, verify:

```bash
# Check no pending migrations remain
dotnet ef migrations list --project DMS-Backend.csproj

# Run the verification script
.\check-migrations.ps1

# Test the application
dotnet run --project DMS-Backend
```

### 4. **Create Migration Checklist**

When creating a new migration:

- [ ] Create migration: `dotnet ef migrations add MigrationName`
- [ ] Review generated migration code in `Migrations/` folder
- [ ] Apply to development database: `dotnet ef database update`
- [ ] Verify migration applied: `.\check-migrations.ps1`
- [ ] Test the application
- [ ] Verify actual schema matches expected schema
- [ ] Commit migration files to git

### 5. **Handle Failed Migrations**

If a migration fails partway through:

1. Check the error message
2. Fix the issue in the database or migration code
3. If the migration is recorded but didn't complete:
   ```bash
   # Remove from history
   DELETE FROM "__EFMigrationsHistory" 
   WHERE migration_id = 'YourFailedMigration';
   
   # Then reapply
   dotnet ef database update
   ```

## Common Issues

### Issue 1: "No migrations were applied. Database is up to date" but column missing

**Cause:** Migration recorded in `__EFMigrationsHistory` but SQL didn't execute.

**Solution:**
1. Verify actual schema with SQL queries
2. Manually run the migration SQL
3. Or remove the migration from history and reapply

### Issue 2: "No project was found"

**Cause:** Running command from wrong directory or missing project file.

**Solution:**
```bash
cd DMS-Backend
dotnet ef database update --project DMS-Backend.csproj
```

### Issue 3: Migrations out of sync between environments

**Cause:** Different databases have different migration histories.

**Solution:**
```bash
# Generate idempotent script
dotnet ef migrations script --idempotent --output sync.sql

# Review and apply to target database
```

## Automated Verification Script

The provided `check-migrations.ps1` script performs a comprehensive check:

```powershell
# Run this anytime you want to verify migration status
.\check-migrations.ps1
```

**What it checks:**
1. ✅ EF migration status (pending vs applied)
2. ✅ Last 10 migrations from database
3. ✅ Warns about pending migrations
4. ✅ Shows timestamps of when migrations were applied

## Integration with CI/CD

Add to your deployment pipeline:

```yaml
# Example GitHub Actions / Azure DevOps step
- name: Apply Database Migrations
  run: |
    cd DMS-Backend
    dotnet ef database update --project DMS-Backend.csproj
    
- name: Verify Migrations
  run: |
    cd DMS-Backend
    dotnet ef migrations list --project DMS-Backend.csproj
```

## Summary

**Before each deployment:**
1. Run `.\check-migrations.ps1` to verify status
2. Apply pending migrations with `dotnet ef database update`
3. Verify application starts without errors
4. Check logs for migration warnings

**When in doubt:**
- Check `__EFMigrationsHistory` table directly
- Verify actual schema with `information_schema.columns`
- Use `--verbose` flag to see detailed execution

---

**Quick Commands Reference:**

```bash
# Check status
.\check-migrations.ps1

# Apply migrations
cd DMS-Backend && dotnet ef database update --project DMS-Backend.csproj

# Verify no pending
dotnet ef migrations list --project DMS-Backend.csproj | Select-String "Pending"
```
