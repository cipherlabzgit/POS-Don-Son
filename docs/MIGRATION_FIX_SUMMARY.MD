# Database Migration Case Sensitivity Fix

## Issue Summary
The error `42P01: relation "Categories" does not exist` occurred because of a **PostgreSQL case sensitivity mismatch**:

- **ApplicationDbContext** defines table names as lowercase: `categories`, `products`
- **Migrations** were referencing uppercase names: `Categories`, `Products`
- PostgreSQL treats quoted identifiers as **case-sensitive**, so "Categories" ≠ "categories"

## Files Fixed

### 1. `20260520101500_AddDisplayInPOSToCategories.cs`
**Before:**
```csharp
table: "Categories"  // ❌ Wrong case
```

**After:**
```csharp
table: "categories"  // ✅ Matches ApplicationDbContext
```

Also made the migration **idempotent** using existence checks:
```csharp
migrationBuilder.Sql(@"
    DO $EF$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'categories' AND column_name = 'DisplayInPOS'
        ) THEN
            ALTER TABLE categories ADD COLUMN ""DisplayInPOS"" boolean NOT NULL DEFAULT true;
        END IF;
    END $EF$;
");
```

### 2. `20260513000000_AddDisplayInPOSToProducts.cs`
Same fixes applied - changed `"Products"` to `"products"` and added existence checks.

## How to Proceed

### Step 1: Check Migration History (Optional)
If you want to verify the state of your database, run the SQL script:
```bash
psql -h <host> -U <user> -d <database> -f fix_migration_history.sql
```

### Step 2: Run the Application
Simply start the backend application. The migrations will run automatically on startup:

```bash
cd "C:\Cipher Labz\DonandSons-New\DonandSons-DMS"
dotnet run --project DMS-Backend
```

The fixed migrations are now **idempotent** (safe to run multiple times), so they will:
- ✅ Add the column if it doesn't exist
- ✅ Skip if the column already exists
- ✅ Set all existing records to `DisplayInPOS = true`

### Step 3: Verify Success
After the application starts successfully, you should see in the logs:
```
info: Microsoft.EntityFrameworkCore.Migrations[20402]
      Applying migration '20260513000000_AddDisplayInPOSToProducts'.
info: Microsoft.EntityFrameworkCore.Migrations[20402]
      Applying migration '20260520101500_AddDisplayInPOSToCategories'.
```

## If Issues Persist

### Scenario 1: Migration Already Recorded But Column Doesn't Exist
If the migration appears in `__EFMigrationsHistory` but the column doesn't exist:

1. Connect to your PostgreSQL database
2. Run these commands:

```sql
-- Check if migration is recorded
SELECT "MigrationId" FROM "__EFMigrationsHistory" 
WHERE "MigrationId" IN (
    '20260513000000_AddDisplayInPOSToProducts',
    '20260520101500_AddDisplayInPOSToCategories'
);

-- If listed but columns don't exist, remove them:
DELETE FROM "__EFMigrationsHistory" 
WHERE "MigrationId" IN (
    '20260513000000_AddDisplayInPOSToProducts',
    '20260520101500_AddDisplayInPOSToCategories'
);
```

3. Restart the application

### Scenario 2: Column Already Exists
The migrations are now idempotent, so this won't cause an error. The migration will:
- Detect the column exists
- Skip the ADD COLUMN step
- Update existing records to ensure `DisplayInPOS = true`

## Prevention for Future Migrations

When creating new migrations, ensure table names match the configuration in `ApplicationDbContext.cs`:

```csharp
// Check ApplicationDbContext for the table name:
entity.ToTable("table_name");  // Use this EXACT name in migrations

// In migrations, use:
table: "table_name"  // Must match exactly (case-sensitive in PostgreSQL)
```

## Summary of Changes

| File | Issue | Fix |
|------|-------|-----|
| `AddDisplayInPOSToProducts.cs` | Referenced `"Products"` | Changed to `"products"` + added existence check |
| `AddDisplayInPOSToCategories.cs` | Referenced `"Categories"` | Changed to `"categories"` + added existence check |

Both migrations are now:
- ✅ Case-correct for PostgreSQL
- ✅ Idempotent (safe to run multiple times)
- ✅ Defensive (check before adding columns)

## Testing
Backend compiled successfully with 11 warnings (all nullability warnings, not critical).

You can now start the application and the migrations will apply correctly.
