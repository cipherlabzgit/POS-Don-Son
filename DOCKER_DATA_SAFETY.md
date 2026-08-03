# Docker Data Safety Guide | Docker Data ආරක්ෂාව

**Date:** 2026-05-28  
**Purpose:** Prevent accidental data loss in Docker

---

## සිංහල (Sinhala)

### ⚠️ වැදගත් අවවාදය!

**Database data clear වෙන්නේ කවදාද?**

ONLY when you use `-v` flag:
```bash
docker compose down -v  # ❌ මේක data delete කරනවා!
```

**සාමාන්‍ය භාවිතයේදී data clear වෙන්නේ නැහැ!**

---

## ✅ Safe Commands (Data තියෙනවා)

### දවස් ගණනේ භාවිතය:

```bash
# 1. Container restart කරන්න (data safe):
docker compose restart

# 2. Code වෙනස් කරලා rebuild කරන්න (data safe):
docker compose up -d --build

# 3. Backend පමණක් restart කරන්න (data safe):
docker compose restart backend

# 4. Services stop කරන්න (data save වෙනවා):
docker compose stop

# 5. Services start කරන්න (data එන්නේ):
docker compose start

# 6. Logs බලන්න:
docker compose logs -f backend

# 7. Container shell එකට යන්න:
docker exec -it dms-backend sh
```

**සියලු මේ commands data preserve කරනවා! ✅**

---

## 🔴 Dangerous Commands (Data Clear වෙනවා!)

### මේවා පරිස්සමෙන් use කරන්න:

```bash
# ❌ DANGER: Volumes delete - ALL data cleared!
docker compose down -v

# ❌ DANGER: Specific volume delete
docker volume rm dms_postgres_data

# ❌ DANGER: All unused volumes delete
docker volume prune

# ❌ DANGER: Force remove everything
docker compose down -v --rmi all
```

**මේ commands data permanently delete කරනවා! ⚠️**

---

## 🛡️ Data Protection Strategy

### 1. Regular Backups (නිතිපතා Backups)

#### Daily Backup Script (PowerShell):

```powershell
# backup-dms-db.ps1
$BackupDir = "C:\Backups\DMS"
$Date = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = "$BackupDir\dms_db_$Date.sql"

# Create backup directory
New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

# Backup database
Write-Host "Creating backup..."
docker exec dms-postgres pg_dump -U postgres dms_erp_db | Out-File -Encoding UTF8 $BackupFile

# Compress
Write-Host "Compressing..."
Compress-Archive -Path $BackupFile -DestinationPath "$BackupFile.zip" -Force
Remove-Item $BackupFile

# Cleanup old backups (keep 7 days)
Write-Host "Cleaning old backups..."
Get-ChildItem "$BackupDir\dms_db_*.zip" | 
    Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-7)} | 
    Remove-Item

$SizeMB = [math]::Round((Get-Item "$BackupFile.zip").Length / 1MB, 2)
Write-Host "✅ Backup completed: $BackupFile.zip ($SizeMB MB)"
```

**Run කරන විදිය:**
```powershell
.\backup-dms-db.ps1
```

**Schedule කරන්න (Task Scheduler):**
1. Open Task Scheduler
2. Create Basic Task
3. Trigger: Daily at 2:00 AM
4. Action: Start Program
   - Program: `powershell.exe`
   - Arguments: `-File "C:\path\to\backup-dms-db.ps1"`

---

### 2. Before Risky Operations (අවදානම් operations කරන්න කලින්)

```bash
# 1. Full backup කරන්න:
docker exec dms-postgres pg_dump -U postgres dms_erp_db > emergency_backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Verify backup එක:
head -n 20 emergency_backup_*.sql

# 3. දැන් risky operation එක කරන්න:
docker compose down -v  # Only if necessary!

# 4. Fresh start:
docker compose up -d

# 5. Restore if needed:
docker exec -i dms-postgres psql -U postgres -d dms_erp_db < emergency_backup_*.sql
```

---

### 3. Volume Inspection (තියෙන data check කරන්න)

```bash
# Volumes list කරන්න:
docker volume ls

# Volume details බලන්න:
docker volume inspect dms_postgres_data

# Volume size check කරන්න:
docker system df -v | grep dms_postgres_data

# Database size බලන්න:
docker exec dms-postgres psql -U postgres -d dms_erp_db -c "
  SELECT pg_size_pretty(pg_database_size('dms_erp_db')) as size;
"

# Tables count කරන්න:
docker exec dms-postgres psql -U postgres -d dms_erp_db -c "
  SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
"
```

---

## 🔄 Data Restore Process

### Full Database Restore:

```bash
# 1. Stop backend (database access නවත්වන්න):
docker compose stop backend

# 2. Drop existing database (optional - පරිස්සමෙන්!):
docker exec dms-postgres psql -U postgres -c "DROP DATABASE IF EXISTS dms_erp_db;"
docker exec dms-postgres psql -U postgres -c "CREATE DATABASE dms_erp_db OWNER postgres;"

# 3. Restore from backup:
docker exec -i dms-postgres psql -U postgres -d dms_erp_db < your_backup.sql

# 4. Start backend:
docker compose start backend

# 5. Verify:
docker exec dms-postgres psql -U postgres -d dms_erp_db -c "\dt"
docker exec dms-postgres psql -U postgres -d dms_erp_db -c "SELECT COUNT(*) FROM users;"
```

### Partial Data Restore (specific tables):

```bash
# Extract specific table from backup:
grep -A 1000 "CREATE TABLE products" backup.sql > products_only.sql

# Restore only that table:
docker exec -i dms-postgres psql -U postgres -d dms_erp_db < products_only.sql
```

---

## 📊 Monitoring Database Health

### Daily Health Check Script:

```powershell
# db-health-check.ps1
Write-Host "=== DMS Database Health Check ===" -ForegroundColor Cyan

# 1. Container status
Write-Host "`n1. Container Status:" -ForegroundColor Yellow
docker compose ps postgres

# 2. Database size
Write-Host "`n2. Database Size:" -ForegroundColor Yellow
docker exec dms-postgres psql -U postgres -d dms_erp_db -t -c "
  SELECT pg_size_pretty(pg_database_size('dms_erp_db'));
"

# 3. Table count
Write-Host "`n3. Tables Count:" -ForegroundColor Yellow
docker exec dms-postgres psql -U postgres -d dms_erp_db -t -c "
  SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
"

# 4. Record counts (key tables)
Write-Host "`n4. Key Table Records:" -ForegroundColor Yellow
$tables = @('users', 'products', 'orders', 'deliveries')
foreach ($table in $tables) {
    $count = docker exec dms-postgres psql -U postgres -d dms_erp_db -t -c "
      SELECT COUNT(*) FROM $table;
    " 2>$null
    if ($count) {
        Write-Host "  - ${table}: $($count.Trim())"
    }
}

# 5. Last migration
Write-Host "`n5. Last Migration:" -ForegroundColor Yellow
docker exec dms-postgres psql -U postgres -d dms_erp_db -t -c "
  SELECT ""MigrationId"" FROM ""__EFMigrationsHistory"" ORDER BY ""MigrationId"" DESC LIMIT 1;
"

# 6. Volume info
Write-Host "`n6. Volume Status:" -ForegroundColor Yellow
docker volume inspect dms_postgres_data --format "{{.Mountpoint}}"

Write-Host "`n✅ Health check complete" -ForegroundColor Green
```

---

## 🎯 Common Scenarios

### Scenario 1: Normal Development Work

```bash
# Edit code
# ...

# Rebuild and restart (data preserved):
docker compose up -d --build

# Check logs:
docker compose logs -f backend
```

**Result:** ✅ Data preserved, new code deployed

---

### Scenario 2: Add New Migration

```bash
# 1. Create migration (local):
cd DMS-Backend
dotnet ef migrations add YourMigrationName

# 2. Deploy to Docker (auto-applies, data safe):
docker compose up -d --build
```

**Result:** ✅ Migration applied, existing data preserved

---

### Scenario 3: Fix Critical Bug (Need Fresh DB)

```bash
# 1. BACKUP FIRST! (වැදගත්!):
docker exec dms-postgres pg_dump -U postgres dms_erp_db > emergency_backup.sql

# 2. Clear and restart:
docker compose down -v
docker compose up -d --build

# 3. If needed, restore important data:
docker exec -i dms-postgres psql -U postgres -d dms_erp_db < emergency_backup.sql
```

**Result:** ⚠️ Data cleared but backed up, fresh start

---

### Scenario 4: Server Maintenance

```bash
# 1. Create full backup:
docker exec dms-postgres pg_dump -U postgres dms_erp_db > maintenance_backup_$(date +%Y%m%d).sql

# 2. Stop services (data saved):
docker compose stop

# 3. Perform maintenance...

# 4. Start services (data restored):
docker compose start

# 5. Verify:
docker compose ps
```

**Result:** ✅ Data preserved through maintenance

---

## 📋 Quick Reference

### Check What Will Happen:

```bash
# Check volumes before operation:
docker volume ls | grep dms

# See what docker compose down will do:
docker compose down --help

# Dry run (see what would be removed):
docker compose down --dry-run  # Not a real flag, but good practice to check docs!
```

### Emergency Data Recovery:

```bash
# 1. Check if volume still exists:
docker volume ls | grep dms_postgres_data

# 2. If volume exists, data is still there!
docker compose up -d

# 3. If volume gone, restore from backup:
docker compose up -d
docker exec -i dms-postgres psql -U postgres -d dms_erp_db < latest_backup.sql
```

---

## 🚨 Warning Signs

### Signs data might be at risk:

1. ⚠️ Someone runs `docker compose down -v`
2. ⚠️ Volume gets manually deleted
3. ⚠️ Disk full errors
4. ⚠️ Docker daemon restart with volume cleanup
5. ⚠️ System crashes during write operations

### Prevention:

```bash
# Add to .env file:
COMPOSE_IGNORE_ORPHANS=true

# Never use -v in production unless explicitly needed!

# Set up automated backups (see script above)
```

---

## 📝 Best Practices Summary

### ✅ DO:

1. **Regular backups** (daily automated)
2. **Test restores** (monthly verification)
3. **Use `docker compose restart`** for normal operations
4. **Check volume exists** before down operations
5. **Document backup locations**
6. **Monitor database size** trends

### ❌ DON'T:

1. **Don't use `-v` flag** unless absolutely necessary
2. **Don't skip backups** before risky operations
3. **Don't manually delete volumes** without backup
4. **Don't ignore disk space** warnings
5. **Don't assume data is "just there"**

---

## Summary | සාරාංශය

### Key Points:

1. **`docker compose up -d`** - ✅ Data safe (සුරක්ෂිතයි)
2. **`docker compose restart`** - ✅ Data safe (සුරක්ෂිතයි)
3. **`docker compose down`** - ✅ Data safe (සුරක්ෂිතයි)
4. **`docker compose down -v`** - ❌ Data deleted! (මකා දමනවා!)

### Protection:

- 📅 Daily automated backups
- 🔍 Regular health checks
- ⚠️ Warning before dangerous operations
- 🔄 Tested restore procedures

---

**Remember:** Data එකට වඩා වටින දෙයක් නැහැ! Regular backups හදන්න!

**Remember:** Your data is precious! Always maintain regular backups!

---

**Date Created:** 2026-05-28  
**Last Updated:** 2026-05-28  
**Status:** ✅ Active
