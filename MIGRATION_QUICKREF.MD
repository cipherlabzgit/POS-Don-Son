# Database Migration Quick Reference | ඉක්මන් යොමුව

## Development Device එකේ (Development Device)

### 1️⃣ Schema Change කරන්න (Make Schema Change)

Edit entity files in `DMS-Backend/Models/` or `DMS-Backend/Data/ApplicationDbContext.cs`

### 2️⃣ Migration හදන්න (Create Migration)

```bash
cd DMS-Backend
dotnet ef migrations add YourDescriptiveMigrationName
```

**Example names:**
- `AddProductImageColumn`
- `CreateOrderTable`
- `UpdateUserEmailUnique`

### 3️⃣ Review Migration (Optional but Recommended)

Check the generated file in `DMS-Backend/Migrations/YYYYMMDDHHMMSS_YourMigrationName.cs`

### 4️⃣ Test Locally (Optional)

```bash
dotnet run
```

Application will automatically apply migration to your local database.

---

## Server Device එකේ (Server Device)

### 🚀 Deploy Changes

#### Method 1: Git Pull (Recommended)
```bash
git pull origin main
docker compose up -d
```

#### Method 2: File Transfer
```bash
# After copying files to server
docker compose up -d
```

**That's it!** 🎉 Migrations will automatically:
1. ✅ Build into Docker image
2. ✅ Run on container startup
3. ✅ Update database schema
4. ✅ Preserve existing data

---

## Common Commands | පොදු විධාන

### Check Migration Status

```bash
# View backend logs
docker logs dms-backend

# Follow logs in real-time
docker logs -f dms-backend

# Check if containers are running
docker compose ps
```

### Restart Services

```bash
# Restart all services
docker compose restart

# Restart only backend
docker compose restart backend

# Stop and start
docker compose down
docker compose up -d
```

### Force Rebuild

```bash
# Rebuild all images
docker compose build --no-cache

# Rebuild and start
docker compose up -d --build --force-recreate
```

### Check Database

```bash
# Connect to PostgreSQL
docker exec -it dms-postgres psql -U dms_user -d dms_erp_db

# Inside psql:
\dt                    # List tables
\d+ table_name         # Describe table
SELECT * FROM "__EFMigrationsHistory";  # See applied migrations
\q                     # Exit
```

---

## Troubleshooting | ගැටළු විසඳීම

### ❌ Migration Fails

```bash
# 1. Check logs
docker logs dms-backend

# 2. Check PostgreSQL is running
docker compose ps

# 3. Check .env file
cat .env | grep POSTGRES

# 4. Restart with clean build
docker compose down
docker compose up -d --build
```

### ❌ "Column already exists" Error

This means migration was partially applied. Fix:

```bash
# Development එකේ
dotnet ef migrations remove

# Create new migration with proper checks
dotnet ef migrations add FixColumnIssue

# Deploy to server
docker compose up -d
```

### ❌ Connection Refused

```bash
# Check if PostgreSQL is healthy
docker compose ps postgres

# If not healthy, restart
docker compose restart postgres

# Wait 20 seconds, then restart backend
docker compose restart backend
```

### 🗑️ Nuclear Option: Fresh Start

⚠️ **ALL DATA WILL BE DELETED!**

```bash
# Stop everything and delete volumes
docker compose down -v

# Remove images
docker rmi dms-backend:latest dms-frontend:latest dms-pos:latest

# Fresh start
docker compose up -d
```

---

## What NOT to Do | මේවා කරන්න එපා

❌ **Don't** run manual migrations in Docker:
```bash
# ❌ DON'T DO THIS
docker exec dms-backend dotnet ef database update
```
→ Migrations run automatically on startup!

❌ **Don't** modify migration files after they're applied:
→ Create a new migration instead

❌ **Don't** delete `__EFMigrationsHistory` table:
→ EF Core uses this to track applied migrations

❌ **Don't** manually edit database schema:
→ Always use migrations

---

## Best Practices | හොඳම ක්‍රම

✅ **Use descriptive migration names**
```bash
# Good ✅
dotnet ef migrations add AddProductWeightColumn

# Bad ❌
dotnet ef migrations add Update1
```

✅ **Test migrations locally before deploying**
```bash
cd DMS-Backend
dotnet run
# Check if migration applies successfully
```

✅ **Commit migration files to Git**
```bash
git add DMS-Backend/Migrations/
git commit -m "Add migration: AddProductWeightColumn"
git push
```

✅ **Backup before major schema changes**
```bash
# On server
docker exec dms-postgres pg_dump -U dms_user dms_erp_db > backup_$(date +%Y%m%d).sql
```

✅ **Check logs after deployment**
```bash
docker logs dms-backend | grep -i migration
docker logs dms-backend | grep -i error
```

---

## One-Line Cheat Sheet

```bash
# Development: Create migration
cd DMS-Backend && dotnet ef migrations add YourMigrationName

# Server: Deploy and auto-migrate
docker compose up -d
```

**That's all you need!** 🎯

---

**Remember:** 
- Development එකේ migration හදනවා
- Server එකේ `docker compose up -d` run කරනවා
- Migrations automatically apply වෙනවා
- Manual commands අවශ්‍ය නෑ!

**මතක තියාගන්න:**
- Development device එකේ migration create කරන්න
- Server device එකේ `docker compose up -d` පමණයි
- Migrations ස්වයංක්‍රීයව run වෙනවා
- අතින් commands run කරන්න අවශ්‍ය නැහැ!
