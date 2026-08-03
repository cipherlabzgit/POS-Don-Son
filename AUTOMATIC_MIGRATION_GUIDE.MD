# Automatic Database Migration Guide | ස්වයංක්‍රීය Database Migration මාර්ගෝපදේශය

## සිංහල (Sinhala)

### ගැටලුව (Problem)

Development එකේ database schema changes කරද්දී (migrations add කරද්දී), ඒවා automatically apply වෙන්න ඕන - Development එකේත්, Docker server එකේත් - data loss එකක් නැතුව.

### විසඳුම (Solution)

මේ project එකේ දැනටමත් **automatic migration system එකක්** configure කරලා තියෙනවා. 

#### Development එකේ (`dotnet run`):
1. ✅ Backend start වෙද්දී migrations automatically run වෙනවා
2. ✅ Database එක update වෙනවා data loss එකක් නැතුව
3. ✅ Manual migration commands run කරන්න අවශ්‍ය නෑ

#### Docker Server එකේ (`docker compose up -d`):
1. ✅ Docker images automatically rebuild වෙනවා (නව migrations include කරගෙන)
2. ✅ Backend container start වෙද්දී migrations automatically run වෙනවා
3. ✅ Database එක update වෙනවා data loss එකක් නැතුව
4. ✅ Manual migration commands run කරන්න අවශ්‍ය නෑ

### හරියන්නේ කොහොමද? (How it Works)

#### 1. Development එකේ වැඩ කරන විට (Working in Development):

**Local Testing:**
```bash
# Development device එකේ
cd DMS-Backend

# Create migration
dotnet ef migrations add YourMigrationName

# Run backend - migrations auto-apply!
dotnet run
```

Backend start වෙද්දී:
- ✅ `Program.cs` line 276 execute වෙනවා
- ✅ Migration automatically apply වෙනවා
- ✅ Local database update වෙනවා
- ✅ Application ready to use!

#### 2. Development එකේ Migration හදන විට (Creating Migrations):

```bash
# Development device එකේ
cd DMS-Backend
dotnet ef migrations add YourMigrationName
```

මෙතන migration files හැදෙනවා `DMS-Backend/Migrations/` folder එකේ.

#### 3. Server එකට Deploy කරන විට (Deploying to Server):

```bash
# Server device එකේ
docker compose up -d
```

මේ command එක run කරද්දී:

1. **Build Phase**: Docker image rebuild වෙනවා නව migration files සමඟ
2. **Startup Phase**: Backend container start වෙද්දී:
   - `Program.cs` line 276: `await context.Database.MigrateAsync();` - මේක run වෙනවා
   - සියලුම pending migrations automatically apply වෙනවා
   - Data loss වෙන්නේ නෑ (migrations are additive)
3. **Ready**: Application start වෙනවා updated database එක සමඟ

### වැදගත් කරුණු (Important Notes)

#### ✅ මේවා දැනටමත් configure කරලා තියෙනවා:

1. **`docker-compose.yml`**:
   - `pull_policy: build` - Always rebuild on `up`
   - Services එකේ නව code/migrations automatically include වෙනවා

2. **`Program.cs`** (lines 262-322):
   - Migrations automatically run on startup
   - Seeders automatically run after migrations
   - Data consistency checks එකත් run වෙනවා

3. **`Dockerfile`**:
   - `COPY . .` - සියලුම migration files image එකට copy වෙනවා
   - Multi-stage build optimized performance එකට

#### 🔄 Workflow:

```
Development Device          →    Server Device
─────────────────               ──────────────
1. Schema change කරනවා         
2. Migration හදනවා              
   (dotnet ef migrations add)   
3. Git push/file transfer       →    4. docker compose up -d
                                     5. ✅ Automatic rebuild
                                     6. ✅ Automatic migration
                                     7. ✅ Database updated
```

#### ⚠️ Data Loss වෙනවද? (Will There Be Data Loss?)

**නැහැ!** Migrations additive වෙන නිසා:
- New columns/tables add වෙනවා
- Existing data retain වෙනවා
- DROP operations එක්කමයි data loss වෙන්නේ (rare, explicit migrations වලයි)

### විශේෂ අවස්ථා (Special Cases)

#### 1. Migration වැරදුනාම (If Migration Fails):

Container logs බලන්න:
```bash
docker logs dms-backend
```

Common issues:
- Connection string වැරදියි → `.env` file check කරන්න
- PostgreSQL down → `docker compose ps` check කරන්න
- Migration error → Migration file review කරන්න

#### 2. Fresh Start අවශ්‍ය නම්:

⚠️ **සියලුම data delete වෙනවා!**
```bash
docker compose down -v        # Volumes delete කරනවා
docker compose up -d          # Fresh start with all migrations
```

#### 3. Specific Migration Rollback:

Docker එකේ direct rollback නැහැ. විසඳුම:
```bash
# Development එකේ rollback කරලා
dotnet ef migrations remove

# නව migration එකක් හදලා
dotnet ef migrations add FixPreviousMigration

# Server එකේ deploy කරන්න
docker compose up -d
```

---

## English

### Problem

When database schema changes (adding migrations) in development, they need to automatically apply - both in Development and on the Docker server - without data loss.

### Solution

This project already has an **automatic migration system** configured.

#### In Development (`dotnet run`):
1. ✅ Migrations automatically run when backend starts
2. ✅ Database updates without data loss
3. ✅ No need to run manual migration commands

#### On Docker Server (`docker compose up -d`):
1. ✅ Docker images automatically rebuild (including new migrations)
2. ✅ Migrations automatically run when backend container starts
3. ✅ Database updates without data loss
4. ✅ No need to run manual migration commands

### How It Works

#### 1. Working in Development:

**Local Testing:**
```bash
# On development device
cd DMS-Backend

# Create migration
dotnet ef migrations add YourMigrationName

# Run backend - migrations auto-apply!
dotnet run
```

When backend starts:
- ✅ `Program.cs` line 276 executes
- ✅ Migration automatically applies
- ✅ Local database updates
- ✅ Application ready to use!

#### 2. Creating Migrations in Development:

```bash
# On development device
cd DMS-Backend
dotnet ef migrations add YourMigrationName
```

This creates migration files in `DMS-Backend/Migrations/` folder.

#### 3. Deploying to Server:

```bash
# On server device
docker compose up -d
```

When this command runs:

1. **Build Phase**: Docker image rebuilds with new migration files
2. **Startup Phase**: When backend container starts:
   - `Program.cs` line 276: `await context.Database.MigrateAsync();` - executes
   - All pending migrations automatically apply
   - No data loss (migrations are additive)
3. **Ready**: Application starts with updated database

### Important Notes

#### ✅ Already Configured:

1. **`docker-compose.yml`**:
   - `pull_policy: build` - Always rebuild on `up`
   - New code/migrations automatically included in services

2. **`Program.cs`** (lines 262-322):
   - Migrations automatically run on startup
   - Seeders automatically run after migrations
   - Data consistency checks also run

3. **`Dockerfile`**:
   - `COPY . .` - All migration files copied to image
   - Multi-stage build for optimized performance

#### 🔄 Workflow:

```
Development Device          →    Server Device
─────────────────               ──────────────
1. Make schema change         
2. Create migration              
   (dotnet ef migrations add)   
3. Git push/file transfer       →    4. docker compose up -d
                                     5. ✅ Automatic rebuild
                                     6. ✅ Automatic migration
                                     7. ✅ Database updated
```

#### ⚠️ Will There Be Data Loss?

**No!** Because migrations are additive:
- New columns/tables are added
- Existing data is retained
- Data loss only occurs with DROP operations (rare, explicit migrations only)

### Special Cases

#### 1. If Migration Fails:

Check container logs:
```bash
docker logs dms-backend
```

Common issues:
- Wrong connection string → Check `.env` file
- PostgreSQL down → Check `docker compose ps`
- Migration error → Review migration file

#### 2. Need Fresh Start:

⚠️ **All data will be deleted!**
```bash
docker compose down -v        # Delete volumes
docker compose up -d          # Fresh start with all migrations
```

#### 3. Rollback Specific Migration:

No direct rollback in Docker. Solution:
```bash
# Rollback in development
dotnet ef migrations remove

# Create new migration
dotnet ef migrations add FixPreviousMigration

# Deploy to server
docker compose up -d
```

---

## Configuration Details

### Modified Files

1. **`docker-compose.yml`**:
   - Added `pull_policy: build` to backend, frontend, and pos services
   - Ensures images rebuild on every `docker compose up -d`

2. **`Program.cs`** (Already configured):
   - Lines 262-322: Automatic migration and seeding logic
   - Fail-fast on migration errors
   - Comprehensive logging

3. **`Dockerfile`** (Already configured):
   - Multi-stage build includes all migration files
   - Non-root user for security
   - Health checks configured

### Environment Variables

In `.env` file:
```env
# Database connection (used by Docker backend)
POSTGRES_USER=dms_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=dms_erp_db

# Backend environment
ASPNETCORE_ENVIRONMENT=Production
DEV_SEED_ENABLED=false  # Set to true for test data
```

---

## Summary | සාරාංශය

### Sinhala
දැන් ඔබට `docker compose up -d` command එක run කරන එකමයි අවශ්‍ය. සියලු migrations automatically apply වෙනවා data loss එකක් නැතුව. Manual migration commands run කරන්න අවශ්‍ය නෑ!

### English
Now you only need to run `docker compose up -d`. All migrations will automatically apply without data loss. No need to run manual migration commands!

---

**Date**: 2026-05-28  
**Version**: 1.0  
**Status**: ✅ Implemented and Tested
