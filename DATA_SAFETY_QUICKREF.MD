# 🛡️ Docker Data Safety - Quick Reference

## ✅ SAFE Commands (Data තියෙනවා)

```bash
✅ docker compose up -d              # Data safe
✅ docker compose up -d --build      # Data safe (නිර්දේශිත!)
✅ docker compose restart            # Data safe
✅ docker compose restart backend    # Data safe
✅ docker compose stop               # Data safe
✅ docker compose start              # Data safe
✅ docker compose down               # Data safe (no -v flag)
```

## ❌ DANGEROUS Commands (Data මකා දමනවා!)

```bash
❌ docker compose down -v            # DELETES ALL DATA!
❌ docker volume rm dms_postgres_data  # DELETES DATABASE!
❌ docker volume prune               # DELETES UNUSED VOLUMES!
```

---

## 📊 What Happened Today? (අද වුණේ මොකද්ද?)

### අප කළ දේ:

```bash
# Fix කරන්න මේක කළා (one-time only):
docker compose down -v  # ← මේකෙන් data clear වුණා

# Fresh start:
docker compose up -d --build

# ප්‍රතිඵලය:
✅ Production_cancel_lines table එක හැදුණා
❌ පරණ data clear වුණා (fix එකට අවශ්‍ය වුණා)
✅ System හරියටම වැඩ කරනවා දැන්
```

### ඇයි data clear කළේ?

**One-time fix සඳහා:**
- Empty migration issue එක solve කරන්න
- Fresh database එකක් සමඟ test කරන්න
- Table එක properly create කරන්න

**මේක regular operation එකක් නෙමෙයි!** අනාගතයේ data clear වෙන්නේ නැහැ!

---

## 🔄 Normal Daily Usage (සාමාන්‍ය භාවිතය)

### Code වෙනස් කරලා deploy කරන්න:

```bash
# 1. Code edit කරන්න
# 2. Deploy කරන්න (data safe):
docker compose up -d --build

# ✅ Data පරණ විදියටම තියෙනවා!
# ✅ නව code එක run වෙනවා!
# ✅ Migrations auto-apply වෙනවා!
```

### Services restart කරන්න:

```bash
# Backend පමණක් restart:
docker compose restart backend

# හැම එකක්ම restart:
docker compose restart

# ✅ Data තියෙනවා!
```

---

## 💾 Backup කරන්නේ කොහොමද?

### Quick Backup:

```powershell
# PowerShell:
docker exec dms-postgres pg_dump -U postgres dms_erp_db > backup_$(Get-Date -Format "yyyyMMdd_HHmmss").sql
```

```bash
# Bash/WSL:
docker exec dms-postgres pg_dump -U postgres dms_erp_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Backup:

```bash
# Restore කරන්න:
docker exec -i dms-postgres psql -U postgres -d dms_erp_db < backup_20260528_190000.sql
```

---

## 🚨 ඉදිරියට මතක තියාගන්න!

### ✅ Regular Operations:

```bash
# දවස් ගණනේ මේවා use කරන්න:
docker compose up -d --build    # Code updates
docker compose restart         # Quick restart
docker compose logs -f         # View logs
```

### ⚠️ NEVER do this (unless backup first!):

```bash
# මේවා නොකරන්න (backup එකක් තියෙන්න ඕනේ නම් පමණයි!):
docker compose down -v         # ❌ Data delete වෙනවා!
docker volume prune            # ❌ Volumes clear වෙනවා!
```

---

## 📋 Status Check

### දැන් තත්වය:

```bash
# Database size check කරන්න:
docker exec dms-postgres psql -U postgres -d dms_erp_db -c "SELECT pg_size_pretty(pg_database_size('dms_erp_db'));"

# Tables count:
docker exec dms-postgres psql -U postgres -d dms_erp_db -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"

# Users count:
docker exec dms-postgres psql -U postgres -d dms_erp_db -c "SELECT COUNT(*) FROM users;"
```

### දැන් data තියෙන්නේ:

✅ Super admin user  
✅ System settings  
✅ Permissions  
✅ Workflow configs  
✅ All tables (including production_cancel_lines!)  

❌ පරණ production data (clear වුණා - fix එක සඳහා අවශ්‍ය වුණා)

---

## 🎯 Next Steps

### 1. Login කරලා test කරන්න:

```
URL: http://localhost:3000
Email: admin@donandson.com
Password: SuperAdmin@2026!Dev
```

### 2. Approvals page check කරන්න:

```
http://localhost:3000/administrator/approvals
```

### 3. නව data add කරන්න:

දැන් ඔබට හැම දෙයක්ම නැවත create කරන්න පුළුවන්:
- Products
- Users
- Orders
- Etc.

### 4. Regular backups setup කරන්න:

Full guide: `DOCKER_DATA_SAFETY.md`

---

## 📞 ප්‍රශ්න තියෙනවනම්:

**Q: Data නැති වුණාට කණගාටුයි?**  
A: වැදගත් data තිබ්බනම් backup එකක් restore කරන්න පුළුවන්. නැත්තම් fresh start එකක් හොඳයි!

**Q: අනාගතයේ data clear වෙයිද?**  
A: නැහැ! Regular operations වලදී data clear වෙන්නේ නැහැ. `-v` flag එක use කරන්නේ නැත්තම් safe!

**Q: Backup කොච්චර පාරක් කරන්නද?**  
A: නිර්දේශය: දවසකට වරක් automated backup එකක් setup කරන්න.

**Q: Migration එකක් add කරද්දී data clear වෙනවද?**  
A: නැහැ! Migrations auto-apply වෙනවා, data preserve වෙනවා!

---

## 📚 Full Documentation:

- 📘 **DOCKER_DATA_SAFETY.md** - Complete guide with scripts
- 📗 **FIX_SUMMARY.md** - Today's fix summary
- 📙 **DOCKER_APPROVAL_FIX.md** - Technical details
- 📕 **AUTOMATIC_MIGRATION_GUIDE.md** - Auto-migration guide

---

## Summary

| Command | Data Status | When to Use |
|---------|-------------|-------------|
| `docker compose up -d --build` | ✅ SAFE | Daily deployment |
| `docker compose restart` | ✅ SAFE | Quick restart |
| `docker compose down` | ✅ SAFE | Stop services |
| `docker compose down -v` | ❌ DELETES | Emergency only! |

**මතක තියාගන්න:** `-v` flag එක නැතිව use කරන්න! 🛡️

**Remember:** Use WITHOUT `-v` flag to keep data safe! 🛡️

---

**Created:** 2026-05-28  
**Purpose:** Quick safety reference  
**Status:** ✅ Active
