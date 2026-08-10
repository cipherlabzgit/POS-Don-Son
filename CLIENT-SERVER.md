# Don and Sons DMS - Client Server Guide

Complete setup for **Windows client server** with:

- **PostgreSQL 18** in pgAdmin (database)
- **Docker** for DMS web + browser POS + API
- **Windows POS installer** for cashier PCs

**Example public IP:** `123.231.10.22`  
**Example LAN IP:** `192.168.8.128`

---

## 1. One-time setup

### Install on server

| Software | Purpose |
|----------|---------|
| PostgreSQL 18 | Database (pgAdmin) |
| Docker Desktop | DMS app containers |
| Node.js 22+ | Build POS desktop installer |
| Git | Pull updates |

### Get code

```powershell
cd D:\DMS
git clone https://github.com/cipherlabzgit/POS-Don-Son.git
cd POS-Don-Son
```

### Create `.env`

```powershell
Copy-Item .env.client-ready .env
notepad .env
```

Edit `CLIENT_HOST`, passwords if needed. Save.

### Auto-start PostgreSQL

```powershell
Set-Service postgresql-x64-18 -StartupType Automatic
Start-Service postgresql-x64-18
```

---

## 2. Deploy DMS (database + web + browser POS)

```powershell
cd D:\DMS\POS-Don-Son
git pull origin main
Start-Service postgresql-x64-18
.\scripts\deploy-client-local-pg.ps1
```

### URLs

| App | URL |
|-----|-----|
| DMS Web | http://123.231.10.22:3000 |
| Browser POS | http://123.231.10.22:5174 |
| API | http://123.231.10.22:5126 |

### Login

| Email | Password |
|-------|----------|
| admin@donandson.com | SuperAdmin@2026!Dev (or SUPERADMIN_PASSWORD in .env) |

### pgAdmin

Database: **dms_erp_db** on localhost:5432 (not `postgres` database).

---

## 3. Build POS desktop installer (cashier PCs)

On the **client server** (needs Node.js):

```powershell
cd D:\DMS\POS-Don-Son
git pull origin main
.\scripts\build-pos-installer.ps1 -NoPrompt
```

Installer output:

```
D:\DMS\POS-Don-Son\DMS-POS\release\Don & Sons POS Setup 2.0.0.exe
```

Copy that `.exe` to each cashier PC and install.

The build reads **VITE_API_URL** from repo root `.env` automatically.

---

## 4. After server reboot

```powershell
Start-Service postgresql-x64-18
cd D:\DMS\POS-Don-Son
docker compose -f docker-compose.yml -f docker-compose.local-pg.yml up -d
```

---

## 5. Firewall (public access)

```powershell
New-NetFirewallRule -DisplayName "DMS Frontend" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
New-NetFirewallRule -DisplayName "DMS Backend" -Direction Inbound -Protocol TCP -LocalPort 5126 -Action Allow
New-NetFirewallRule -DisplayName "DMS POS" -Direction Inbound -Protocol TCP -LocalPort 5174 -Action Allow
```

Also forward ports **3000, 5126, 5174** on your router to this server.

---

## 6. Fix login password

```powershell
cd D:\DMS\POS-Don-Son
.\scripts\Reset-AdminPassword.ps1
```

---

## 7. Update after code changes

```powershell
cd D:\DMS\POS-Don-Son
git pull origin main
.\scripts\deploy-client-local-pg.ps1
.\scripts\build-pos-installer.ps1 -NoPrompt
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Login works on LAN IP only | Update `.env` to public IP, rebuild: `deploy-client-local-pg.ps1` |
| localhost login fails | Use http://127.0.0.1:3000 or public IP after rebuild |
| No tables in pgAdmin | Open database **dms_erp_db**, refresh Tables |
| POS desktop cannot connect | Rebuild installer after fixing VITE_API_URL in `.env` |

See also: [PGADMIN-LOCAL.md](PGADMIN-LOCAL.md), [DOCKER.md](DOCKER.md)
