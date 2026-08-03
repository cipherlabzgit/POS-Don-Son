# Development Workflow - Automatic Migrations | සංවර්ධන කාර්ය ප්‍රවාහය

## සිංහල (Sinhala)

### 🎯 ප්‍රධාන කරුණ (Key Point)

Backend run කරද්දී **automatically** migrations apply වෙනවා - Development සහ Production දෙකෙම!

---

## Development එකේ වැඩ කරන විදිහ (Development Workflow)

### 1️⃣ Database Schema Change කරන්න

Models හෝ DbContext edit කරන්න:

```csharp
// Example: Add new property to Product model
public class Product
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }  // ← New property
}
```

### 2️⃣ Migration හදන්න

```bash
cd DMS-Backend
dotnet ef migrations add AddProductDescription
```

**Output:**
```
Build started...
Build succeeded.
Done. To undo this action, use 'ef migrations remove'
```

Migration file එක create වෙනවා: `Migrations/20260528XXXXXX_AddProductDescription.cs`

### 3️⃣ Backend Run කරන්න

```bash
dotnet run
```

**මේක automatically වෙනවා:**

```
[INFO] Starting DMS Backend API
[INFO] Applying migration '20260528XXXXXX_AddProductDescription'
[INFO] Database seeded successfully
[INFO] DMS Backend API started successfully
[INFO] Now listening on: http://localhost:5126
```

✅ **Migration automatically apply වුණා!**  
✅ **Database updated වුණා!**  
✅ **Application ready to use!**

---

## How It Works | වැඩ කරන්නේ කොහොමද

### Program.cs Startup Sequence:

Backend start වෙද්දී මේ steps run වෙනවා:

```csharp
// 1. Database connection setup
services.AddDbContext<ApplicationDbContext>(...)

// 2. Build application
var app = builder.Build();

// 3. 🚀 AUTO-MIGRATION SECTION (lines 262-322)
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    
    // Apply ALL pending migrations
    await context.Database.MigrateAsync();  // ← මේක තමයි magic එක!
    
    // Run seeders
    await permissionSeeder.SeedAsync();
    await superAdminSeeder.SeedAsync();
    
    Log.Information("Database seeded successfully");
}

// 4. Start web server
app.Run();
```

**මේ code එක run වෙන්නේ:**
- ✅ Development environment එකේ (`dotnet run`)
- ✅ Production environment එකේ (`docker compose up -d`)
- ✅ හැම වාරයක්ම backend start වෙද්දී

---

## Complete Development Workflow Example

### Scenario: Add "Stock Alert Level" to Products

#### Step 1: Edit Model

```csharp
// DMS-Backend/Models/Product.cs
public class Product
{
    public int Id { get; set; }
    public string Name { get; set; }
    public decimal Price { get; set; }
    
    // New field
    public int StockAlertLevel { get; set; } = 10;  // Default: 10 units
}
```

#### Step 2: Create Migration

```bash
cd DMS-Backend
dotnet ef migrations add AddStockAlertLevelToProducts
```

**Output:**
```
Build started...
Build succeeded.
Done. To undo this action, use 'ef migrations remove'
```

#### Step 3: Run Backend

```bash
dotnet run
```

**Console Output:**
```
[15:30:22 INF] Starting DMS Backend API
[15:30:23 INF] Applying migration '20260528153022_AddStockAlertLevelToProducts'
[15:30:24 INF] Database seeded successfully
[15:30:25 INF] DMS Backend API started successfully
[15:30:25 INF] Now listening on: http://localhost:5126
```

#### Step 4: Verify in Database

```bash
# PostgreSQL CLI
psql -U dms_user -d dms_erp_db

# Check column added
\d+ products
```

**Output:**
```
Column            | Type    | Default
------------------+---------+---------
id                | integer |
name              | text    |
price             | numeric |
stock_alert_level | integer | 10      ← New column!
```

✅ **Done!** Column automatically added!

---

## අත්‍යවශ්‍ය Commands (Essential Commands)

### Create Migration
```bash
cd DMS-Backend
dotnet ef migrations add YourMigrationName
```

### Run Backend (Auto-migrates)
```bash
dotnet run
```

### Watch Mode (Auto-restart on code changes)
```bash
dotnet watch run
```
මේ mode එකේ:
- Code change කරද්දී automatically restart වෙනවා
- Restart වෙද්දී migrations automatically apply වෙනවා
- Hot reload සමඟ වැඩ කරන්න පුළුවන්

### Remove Last Migration (if mistake)
```bash
dotnet ef migrations remove
```

### View Migration List
```bash
dotnet ef migrations list
```

---

## Configuration එක වෙනස් කරන්නේ කොහොමද?

### Development Database Connection

`appsettings.Development.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=dms_dev;Username=dms_user;Password=dev_password"
  }
}
```

### Environment Variable තාක්ෂණය:

```bash
# PowerShell
$env:ConnectionStrings__DefaultConnection = "Host=localhost;..."
dotnet run

# Bash
export ConnectionStrings__DefaultConnection="Host=localhost;..."
dotnet run
```

---

## Common Development Scenarios | පොදු අවස්ථා

### Scenario 1: Multiple Migrations එකවර

```bash
# Create multiple migrations
dotnet ef migrations add AddProductCategory
dotnet ef migrations add AddProductSupplier
dotnet ef migrations add AddProductBarcode

# Run backend - ALL three apply automatically
dotnet run
```

### Scenario 2: Migration වැරදියි Remove කරන්න

```bash
# Remove last migration (before running backend)
dotnet ef migrations remove

# Fix and create new one
dotnet ef migrations add FixedMigration

# Run backend
dotnet run
```

### Scenario 3: Fresh Database

```bash
# Drop database
psql -U postgres -c "DROP DATABASE dms_dev;"

# Create database
psql -U postgres -c "CREATE DATABASE dms_dev OWNER dms_user;"

# Run backend - ALL migrations apply from scratch
dotnet run
```

### Scenario 4: Check Migration Status

Database එකේ applied migrations බලන්න:

```bash
# Connect to database
psql -U dms_user -d dms_dev

# List applied migrations
SELECT * FROM "__EFMigrationsHistory" ORDER BY "MigrationId";
```

---

## Troubleshooting | ගැටළු විසඳීම

### ❌ Migration අදාළ වෙන්නේ නැහැ

**Problem:** Backend run කළත් migration apply වෙන්නේ නැහැ

**Solution:**
```bash
# 1. Check migration created
ls Migrations/

# 2. Check database connection
dotnet run
# දෙස බලන්න: "Database migration or seeding failed" error එක

# 3. Verify connection string
cat appsettings.Development.json | grep ConnectionStrings
```

### ❌ "A migration is already applied"

**Problem:** Migration දැනටමත් apply වෙලා තියෙනවා

**Solution:**
```bash
# Remove and recreate migration with different name
dotnet ef migrations remove
dotnet ef migrations add NewUniqueMigrationName
dotnet run
```

### ❌ Database Connection Refused

**Problem:** PostgreSQL running නැහැ

**Solution:**
```bash
# Windows - Check PostgreSQL service
Get-Service postgresql*

# Start if stopped
Start-Service postgresql-x64-16

# Or use Docker PostgreSQL
docker run --name dev-postgres -e POSTGRES_PASSWORD=dev_password -p 5432:5432 -d postgres:16
```

### ❌ Permission Denied

**Problem:** User ට database modify කරන්න permission නැහැ

**Solution:**
```sql
-- Grant permissions
psql -U postgres
GRANT ALL PRIVILEGES ON DATABASE dms_dev TO dms_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO dms_user;
```

---

## Best Practices | හොඳම ක්‍රම

### ✅ DO (කරන්න)

1. **Descriptive migration names**
   ```bash
   # Good ✅
   dotnet ef migrations add AddProductImageUrl
   dotnet ef migrations add CreateCustomerTable
   dotnet ef migrations add UpdateOrderStatusEnum
   
   # Bad ❌
   dotnet ef migrations add Update
   dotnet ef migrations add Fix
   ```

2. **Test locally before committing**
   ```bash
   dotnet ef migrations add NewFeature
   dotnet run  # Test it works
   git add Migrations/
   git commit -m "Add migration: NewFeature"
   ```

3. **Review migration code**
   ```bash
   # Open and check the generated migration
   code Migrations/20260528_NewFeature.cs
   ```

4. **Keep migrations small**
   ```bash
   # Good ✅ - One change per migration
   dotnet ef migrations add AddEmailColumn
   
   # Bad ❌ - Too many changes
   dotnet ef migrations add UpdateEntireSchema
   ```

### ❌ DON'T (කරන්න එපා)

1. **Don't manually edit database**
   ```sql
   -- ❌ Don't do this
   ALTER TABLE products ADD COLUMN new_field TEXT;
   ```
   Use migrations instead!

2. **Don't modify applied migrations**
   ```bash
   # ❌ Don't edit files in Migrations/ after running backend
   ```

3. **Don't skip testing**
   ```bash
   # ❌ Bad workflow
   dotnet ef migrations add Feature
   git push  # Without testing!
   ```

---

## Development + Server Workflow | සම්පූර්ණ ක්‍රියාවලිය

### සම්පූර්ණ පින්තූරය:

```
┌─────────────────────────────────────────────────┐
│          DEVELOPMENT DEVICE                     │
│                                                 │
│  1. Edit Models/DbContext                       │
│     └─> Make schema changes                     │
│                                                 │
│  2. Create Migration                            │
│     └─> dotnet ef migrations add Feature       │
│                                                 │
│  3. Test Locally                                │
│     └─> dotnet run                              │
│     └─> ✅ Auto-migration applies              │
│     └─> Test API endpoints                      │
│                                                 │
│  4. Commit & Push                               │
│     └─> git add Migrations/                     │
│     └─> git commit -m "Add Feature"             │
│     └─> git push                                │
│                                                 │
└─────────────────────────────────────────────────┘
                      │
                      │ Transfer changes
                      ▼
┌─────────────────────────────────────────────────┐
│          SERVER DEVICE                          │
│                                                 │
│  5. Pull Changes                                │
│     └─> git pull                                │
│                                                 │
│  6. Deploy                                      │
│     └─> docker compose up -d                    │
│     └─> ✅ Auto-rebuild image                  │
│     └─> ✅ Auto-migration applies              │
│                                                 │
│  7. Verify                                      │
│     └─> docker logs dms-backend                 │
│     └─> Test API endpoints                      │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## විශේෂ Tips (Special Tips)

### 💡 Hot Reload with Watch Mode

```bash
# Start in watch mode
dotnet watch run

# Now edit code - auto restart!
# New migrations? Auto apply!
```

### 💡 Multiple Developers

```bash
# Pull latest changes
git pull

# Run backend - applies OTHER developers' migrations too!
dotnet run
```

### 💡 Database Backup Before Major Changes

```bash
# Backup before big migration
pg_dump -U dms_user dms_dev > backup_before_feature.sql

# Create migration
dotnet ef migrations add BigFeature

# Run and test
dotnet run

# If something wrong, restore
psql -U dms_user -d dms_dev < backup_before_feature.sql
```

---

## Summary | සාරාංශය

### ඔබට කරන්න ඕන දේ:

```bash
# 1. Schema වෙනස් කරන්න (Models edit කරන්න)

# 2. Migration හදන්න
dotnet ef migrations add YourFeature

# 3. Run කරන්න
dotnet run

# ✅ DONE! Migration automatically apply වෙනවා!
```

### Key Points:

✅ Auto-migration දැනටමත් configure කරලා තියෙනවා  
✅ Development සහ Production දෙකෙම වැඩ කරනවා  
✅ `dotnet run` කළාම automatically apply වෙනවා  
✅ `docker compose up -d` කළාම automatically apply වෙනවා  
✅ Manual commands අවශ්‍ය නැහැ!  
✅ Data loss වෙන්නේ නැහැ!  

---

**Happy Coding! 🚀**

Development එකේ වැඩ කරන්න easy, Server එකට deploy කරන්නත් easy!
