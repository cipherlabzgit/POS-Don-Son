# Comprehensive Database Migration Guide | සම්පූර්ණ Migration මාර්ගෝපදේශය

**Date:** 2026-05-28  
**Purpose:** Complete guide for database migrations in Docker environment

---

## සිංහල (Sinhala)

### 🎯 මූලික අදහස (Key Concept)

**Code එකේ entity models වෙනස් කරද්දී, database එකත් automatically sync වෙන්න ඕන!**

මේක කරන්නේ **EF Core Migrations** use කරලා.

---

## 📋 Complete Workflow

### Step 1: Code Changes කරන්න

```csharp
// Example: New entity හෝ entity property add කරන්න
public class Product : BaseEntity
{
    public string Name { get; set; }
    public string NewProperty { get; set; }  // ← New!
}
```

### Step 2: Migration හදන්න

```bash
cd DMS-Backend
dotnet ef migrations add AddNewPropertyToProduct
```

**මේ command එක:**
- 🔍 Code එකේ changes detect කරනවා
- 📝 Migration file එකක් generate කරනවා
- 💾 `Migrations/` folder එකේ save කරනවා

### Step 3: Migration Review කරන්න (වැදගත්!)

```bash
# Generated migration file එක open කරන්න:
code Migrations/20260528XXXXXX_AddNewPropertyToProduct.cs
```

**Check කරන්න:**
- ✅ `Up()` method එකේ proper SQL තියෙනවද?
- ✅ Tables/columns create වෙනවද?
- ✅ Foreign keys සහ indexes තියෙනවද?
- ⚠️ **හිස් නැද්ද?** (Empty migrations issue)

### Step 4: Docker Deploy කරන්න

```bash
cd ..  # Back to repo root
docker compose up -d --build
```

**මේක automatically:**
1. ✅ Docker image rebuild කරනවා නව migrations සමඟ
2. ✅ Backend start වෙද්දී migrations apply කරනවා
3. ✅ Database එක update කරනවා
4. ✅ Application ready වෙනවා

---

## 🔍 Empty Migration Issue එකක් හම්බ වුණාම

### Symptoms (රෝග ලක්ෂණ):

```csharp
// Migration file එක open කළාම:
protected override void Up(MigrationBuilder migrationBuilder)
{
    // හිස්! කිසිම code එකක් නැහැ!
}
```

### Why This Happens (ඇයි මේක වෙන්නේ):

- EF Core හිතනවා database එක දැනටමත් up-to-date කියලා
- ModelSnapshot එක update වෙලා ඒත් database එක sync වෙලා නැහැ
- Manual database changes කර ඇති (migrations නැතුව)

### Solution (විසඳුම):

#### Option 1: Remove සහ Manually Create

```bash
# 1. Empty migration remove කරන්න:
dotnet ef migrations remove --force

# 2. Manual migration එකක් හදන්න:
# - Create new migration file manually
# - Add SQL commands with IF NOT EXISTS checks
# - Make it idempotent (safe to rerun)
```

#### Option 2: Update Existing Migration

```csharp
// Migration file එක edit කරලා proper SQL add කරන්න:
protected override void Up(MigrationBuilder migrationBuilder)
{
    migrationBuilder.Sql(@"
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT FROM information_schema.tables 
                         WHERE table_name = 'my_table') THEN
                CREATE TABLE my_table (
                    ""Id"" UUID PRIMARY KEY,
                    ""Name"" TEXT NOT NULL,
                    ""CreatedById"" UUID,
                    ""UpdatedById"" UUID
                );
            END IF;
            
            -- Add columns if missing (idempotent)
            ALTER TABLE my_table 
            ADD COLUMN IF NOT EXISTS ""CreatedById"" UUID,
            ADD COLUMN IF NOT EXISTS ""UpdatedById"" UUID;
        END $$;
    ");
}
```

---

## 🛡️ Best Practices

### 1. BaseEntity Inheritance

**සියලු entities BaseEntity inherit කරන්න:**

```csharp
public abstract class BaseEntity
{
    public Guid Id { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid? CreatedById { get; set; }
    public Guid? UpdatedById { get; set; }
}

// Your entity:
public class Product : BaseEntity  // ← Inherit!
{
    public string Name { get; set; }
    // ...
}
```

**Benefits:**
- ✅ සියලු tables වල audit fields ලැබෙනවා
- ✅ Consistent structure
- ✅ Automatic tracking

### 2. Idempotent Migrations

**Migrations rerun කළාම errors වෙන්නේ නැති වගේ හදන්න:**

```sql
-- ✅ Good (Idempotent):
CREATE TABLE IF NOT EXISTS my_table (...);
ALTER TABLE my_table ADD COLUMN IF NOT EXISTS new_column TEXT;

-- ❌ Bad (Not Idempotent):
CREATE TABLE my_table (...);  -- Fails if table exists
ALTER TABLE my_table ADD COLUMN new_column TEXT;  -- Fails if column exists
```

### 3. PostgreSQL Column Naming

**Case-sensitive column names:**

```sql
-- ✅ Correct (EF Core style):
"Id", "IsActive", "CreatedAt", "CreatedById"

-- ❌ Wrong:
id, is_active, created_at, created_by_id
```

**Foreign key references:**

```sql
-- ✅ Correct:
FOREIGN KEY ("CreatedById") REFERENCES users("Id")

-- ❌ Wrong:
FOREIGN KEY (created_by_id) REFERENCES users(id)
```

### 4. Testing

**Migration එකක් create කළාම local එකේ test කරන්න:**

```bash
# Local test:
cd DMS-Backend
dotnet run

# Check logs:
# [INFO] Applying migration '20260528_MyMigration'
# [INFO] Database seeded successfully

# Verify database:
# Connect to local PostgreSQL and check tables/columns
```

**Docker එකේත් test කරන්න:**

```bash
# Docker test:
docker compose up -d --build

# Check backend logs:
docker logs dms-backend | grep -i migration

# Verify database:
docker exec dms-postgres psql -U postgres -d dms_erp_db -c "\d my_table"
```

---

## 📊 Common Scenarios

### Scenario 1: Add New Table

**Step-by-step:**

```bash
# 1. Create entity:
# DMS-Backend/Models/Entities/MyNewEntity.cs
public class MyNewEntity : BaseEntity
{
    public string Name { get; set; }
    public string Description { get; set; }
}

# 2. Add DbSet to ApplicationDbContext:
public DbSet<MyNewEntity> MyNewEntities => Set<MyNewEntity>();

# 3. Configure entity (if needed):
// In ApplicationDbContext.OnModelCreating:
modelBuilder.Entity<MyNewEntity>(entity =>
{
    entity.ToTable("my_new_entities");
    entity.HasIndex(e => e.Name).IsUnique();
});

# 4. Create migration:
dotnet ef migrations add AddMyNewEntityTable

# 5. Review migration:
code Migrations/20260528XXXXXX_AddMyNewEntityTable.cs

# 6. Deploy:
docker compose up -d --build
```

### Scenario 2: Add New Column to Existing Table

```bash
# 1. Add property to entity:
public class Product : BaseEntity
{
    public string Name { get; set; }
    public string NewColumn { get; set; }  // ← New!
}

# 2. Create migration:
dotnet ef migrations add AddNewColumnToProduct

# 3. Review and deploy:
docker compose up -d --build
```

### Scenario 3: Rename Column

⚠️ **පරිස්සම්! මේක data loss කරන්න පුළුවන්!**

```bash
# 1. Don't just rename property! Create migration first.

# 2. Proper way - Two-step process:
#    a) Add new column with data migration
#    b) Remove old column

# Step A: Add new column
dotnet ef migrations add AddNewColumnName

# Manually edit migration:
protected override void Up(MigrationBuilder migrationBuilder)
{
    // Add new column
    migrationBuilder.AddColumn<string>(
        name: "NewColumnName",
        table: "products",
        nullable: true);
    
    // Copy data
    migrationBuilder.Sql(@"
        UPDATE products 
        SET ""NewColumnName"" = ""OldColumnName"";
    ");
}

# Step B: Remove old column (in separate deployment)
dotnet ef migrations add RemoveOldColumnName
```

### Scenario 4: Add Foreign Key Relationship

```bash
# 1. Add navigation property to entity:
public class Order : BaseEntity
{
    public Guid CustomerId { get; set; }  // ← Foreign key
    public Customer Customer { get; set; }  // ← Navigation
}

# 2. Configure relationship:
modelBuilder.Entity<Order>(entity =>
{
    entity.HasOne(e => e.Customer)
        .WithMany()
        .HasForeignKey(e => e.CustomerId)
        .OnDelete(DeleteBehavior.Restrict);
});

# 3. Create migration:
dotnet ef migrations add AddOrderCustomerRelationship

# 4. Deploy:
docker compose up -d --build
```

---

## 🐛 Troubleshooting

### Issue 1: "Table already exists" Error

**Problem:**
```
ERROR: relation "my_table" already exists
```

**Solution:**
```sql
-- Use IF NOT EXISTS:
CREATE TABLE IF NOT EXISTS my_table (...);
```

### Issue 2: "Column does not exist" Error

**Problem:**
```
ERROR: column "CreatedById" does not exist
```

**Solution:**
```bash
# 1. Check table structure:
docker exec dms-postgres psql -U postgres -d dms_erp_db -c "\d table_name"

# 2. Add missing column:
ALTER TABLE table_name 
ADD COLUMN IF NOT EXISTS "CreatedById" UUID;

# 3. Update migration to include column
```

### Issue 3: Empty Migration Generated

**Problem:**
```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    // Empty!
}
```

**Solution:**
```bash
# Remove empty migration:
dotnet ef migrations remove --force

# Create manual migration with proper SQL
# (See "Empty Migration Issue" section above)
```

### Issue 4: Migration Order Issues

**Problem:**
Migrations applying out of order or conflicting.

**Solution:**
```bash
# 1. Check migration history:
docker exec dms-postgres psql -U postgres -d dms_erp_db -c 'SELECT * FROM "__EFMigrationsHistory" ORDER BY "MigrationId";'

# 2. If needed, manually set migration as applied:
docker exec dms-postgres psql -U postgres -d dms_erp_db -c 'INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion") VALUES (''20260528XXXXXX_MyMigration'', ''10.0.6'');'

# 3. Or rollback last migration:
dotnet ef database update PreviousMigrationName
```

---

## 📝 Migration Template

**Use this template for manual migrations:**

```csharp
using Microsoft.EntityFrameworkCore.Migrations;

namespace DMS_Backend.Migrations
{
    public partial class MyCustomMigration : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                -- 1. Create table if not exists
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT FROM information_schema.tables 
                                 WHERE table_schema = 'public' 
                                 AND table_name = 'my_table') THEN
                        CREATE TABLE my_table (
                            ""Id"" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                            ""Name"" TEXT NOT NULL,
                            ""Description"" TEXT,
                            ""IsActive"" BOOLEAN NOT NULL DEFAULT true,
                            ""CreatedAt"" TIMESTAMP NOT NULL DEFAULT NOW(),
                            ""UpdatedAt"" TIMESTAMP NOT NULL DEFAULT NOW(),
                            ""CreatedById"" UUID,
                            ""UpdatedById"" UUID,
                            
                            CONSTRAINT ""FK_my_table_users_CreatedById""
                                FOREIGN KEY (""CreatedById"")
                                REFERENCES users(""Id""),
                            CONSTRAINT ""FK_my_table_users_UpdatedById""
                                FOREIGN KEY (""UpdatedById"")
                                REFERENCES users(""Id"")
                        );
                        
                        CREATE INDEX ""IX_my_table_Name"" ON my_table(""Name"");
                        CREATE INDEX ""IX_my_table_CreatedById"" ON my_table(""CreatedById"");
                        CREATE INDEX ""IX_my_table_UpdatedById"" ON my_table(""UpdatedById"");
                    END IF;
                END $$;
                
                -- 2. Add missing columns (idempotent)
                ALTER TABLE my_table 
                ADD COLUMN IF NOT EXISTS ""CreatedById"" UUID,
                ADD COLUMN IF NOT EXISTS ""UpdatedById"" UUID;
                
                -- 3. Add constraints if not exists
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.table_constraints 
                        WHERE constraint_name = 'FK_my_table_users_CreatedById'
                    ) THEN
                        ALTER TABLE my_table
                        ADD CONSTRAINT ""FK_my_table_users_CreatedById""
                        FOREIGN KEY (""CreatedById"") REFERENCES users(""Id"");
                    END IF;
                END $$;
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP TABLE IF EXISTS my_table;");
        }
    }
}
```

---

## ✅ Checklist Before Deployment

### Pre-Deployment:

- [ ] Migration එක generate කරලා review කළාද?
- [ ] Empty migration එකක් නෙද?
- [ ] BaseEntity columns include වෙලා තියෙනවද?
- [ ] Foreign keys properly configured ද?
- [ ] Indexes created වෙනවද?
- [ ] Idempotent ද? (IF NOT EXISTS checks)
- [ ] Local එකේ test කළාද?

### Deployment:

- [ ] `docker compose up -d --build` run කළාද?
- [ ] Backend start වුණාද?
- [ ] Migrations apply වුණාද?
- [ ] Errors නැද්ද logs වල?
- [ ] Database schema verify කළාද?

### Post-Deployment:

- [ ] Application healthy ද?
- [ ] API endpoints වැඩ කරනවද?
- [ ] Data preserved වෙලා තියෙනවද?
- [ ] Browser refresh කළාද?

---

## Summary | සාරාංශය

### Sinhala:

**සම්පූර්ණ Process එක:**

1. **Code වෙනස් කරන්න**: Entity models update කරන්න
2. **Migration හදන්න**: `dotnet ef migrations add`
3. **Review කරන්න**: Empty නැද්ද, proper SQL තියෙනවද check කරන්න
4. **Deploy කරන්න**: `docker compose up -d --build`
5. **Verify කරන්න**: Database schema සහ application check කරන්න

**Key Points:**
- ✅ Migrations automatically apply වෙනවා Docker එකේ
- ✅ Data preserve වෙනවා
- ✅ Empty migrations issue එකක් තියෙනවනම් manual එක්ක fix කරන්න
- ✅ Idempotent migrations හදන්න (safe to rerun)

### English:

**Complete Process:**

1. **Make code changes**: Update entity models
2. **Create migration**: `dotnet ef migrations add`
3. **Review**: Check not empty, has proper SQL
4. **Deploy**: `docker compose up -d --build`
5. **Verify**: Check database schema and application

**Key Points:**
- ✅ Migrations apply automatically in Docker
- ✅ Data is preserved
- ✅ Fix empty migrations manually if needed
- ✅ Make migrations idempotent (safe to rerun)

---

**Date:** 2026-05-28  
**Status:** ✅ Complete Guide  
**Tested:** ✅ Verified Working
