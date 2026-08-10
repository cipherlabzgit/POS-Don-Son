# Don & Sons DMS — Local PostgreSQL (pgAdmin) + Docker App

Use **PostgreSQL 18 on Windows** (visible in pgAdmin) for the database.  
Run **backend, frontend, and POS in Docker** — they connect to your local PostgreSQL.

---

## Architecture

```
pgAdmin  ──►  PostgreSQL 18 (localhost:5432, database: dms_erp_db)
                    ▲
                    │ SQL
              Docker backend
                    │
         Docker frontend + POS
                    │
              Users' browsers
```

Tables are **not** created manually in pgAdmin. The **backend** creates them on first start (EF migrations).

---

## Prerequisites

| Requirement | Notes |
|-------------|--------|
| PostgreSQL 18 | Windows service **postgresql-x64-18** running |
| pgAdmin | Connected to localhost:5432 |
| Docker Desktop | For backend, frontend, POS only |
| Free ports | 5126, 3000, 5174 (5432 = local PostgreSQL) |

---

## Step 1 — Configure `.env`

Copy and edit (use your server IP for remote access):

```powershell
cd D:\DMS\POS-Don-Son
Copy-Item .env.client-ready .env
notepad .env
```

Example for client server IP **192.168.8.128**:

```env
CLIENT_HOST=192.168.8.128
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=dms_erp_db
POSTGRES_PORT=5432
JWT_SECRET_KEY=DonAndSon-DMS-JWT-Secret-Key-2026-Minimum32Chars
SUPERADMIN_PASSWORD=SuperAdmin@2026!Dev
DEV_SEED_ENABLED=true
FRONTEND_URL=http://192.168.8.128:3000
NEXT_PUBLIC_API_URL=http://192.168.8.128:5126
POS_URL=http://192.168.8.128:5174
VITE_API_URL=http://192.168.8.128:5126
```

`POSTGRES_*` must match your **local** PostgreSQL login (pgAdmin).

---

## Step 2 — Deploy (one command)

```powershell
cd D:\DMS\POS-Don-Son
.\scripts\deploy-client-local-pg.ps1
```

This script:

1. Connects to local PostgreSQL
2. Creates empty database **`dms_erp_db`** if missing
3. Starts Docker **backend + frontend + POS** (no Docker postgres)
4. Backend runs migrations → **all tables appear in pgAdmin**

First build takes **5–15 minutes**.

---

## Step 3 — View tables in pgAdmin

1. Connect to **PostgreSQL 18** (localhost, port 5432, user `postgres`)
2. Expand **Databases → dms_erp_db** (not `postgres`)
3. **Schemas → public → Tables**
4. Right-click **Tables → Refresh**

You should see ~87 tables (`users`, `products`, `outlets`, …).

---

## Login

| Field | Value |
|-------|--------|
| DMS | `http://YOUR_SERVER_IP:3000` |
| POS | `http://YOUR_SERVER_IP:5174` |
| Email | `admin@donandson.com` |
| Password | value of `SUPERADMIN_PASSWORD` in `.env` |

---

## Useful commands

```powershell
# Status
docker compose -f docker-compose.yml -f docker-compose.local-pg.yml ps

# Backend logs (migrations / errors)
docker compose -f docker-compose.yml -f docker-compose.local-pg.yml logs backend --tail 50

# Stop app (database stays in local PostgreSQL)
docker compose -f docker-compose.yml -f docker-compose.local-pg.yml down

# Restart after code update
git pull
.\scripts\deploy-client-local-pg.ps1
```

---

## Build POS desktop installer (cashier PCs)

Requires **Node.js 22+** on the server. Uses **VITE_API_URL** from repo root `.env`.

```powershell
cd D:\DMS\POS-Don-Son
.\scripts\build-pos-installer.ps1 -NoPrompt
```

Installer: `DMS-POS\release\Don & Sons POS Setup 2.0.0.exe`

See **[CLIENT-SERVER.md](CLIENT-SERVER.md)** for the full client workflow.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| No tables in pgAdmin | Open **`dms_erp_db`**, not `postgres`. Refresh Tables. Check backend logs. |
| Backend cannot connect | Verify `POSTGRES_PASSWORD` in `.env` matches pgAdmin password. |
| Port 5432 in use | Stop Docker postgres: `docker compose down`. Keep only local PG18 running. |
| Login fails | Run deploy script again after setting `SUPERADMIN_PASSWORD`. If DB already had admin, password is the one from **first** backend run. |

---

## Switch back to Docker PostgreSQL

```powershell
docker compose -f docker-compose.yml -f docker-compose.local-pg.yml down
.\scripts\deploy-client.ps1
```
