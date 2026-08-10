# Don & Sons DMS / POS

Delivery Management System and Point of Sale for Don & Sons (Pvt) Ltd.

**Official repository:** https://github.com/cipherlabzgit/POS-Don-Son.git

## Stack

| App | Tech | Default port |
|-----|------|--------------|
| **DMS-Backend** | .NET 10 / ASP.NET Core | `5126` |
| **DMS-Frontend** | Next.js 16 / React 19 | `3000` (or `3001`) |
| **DMS-POS** | Vite + Electron | `5173` (web), desktop via Electron |

## Client server deployment (Windows)

**Start here for Don & Sons production server:**

| Guide | Use |
|-------|-----|
| **[CLIENT-SERVER.md](CLIENT-SERVER.md)** | Full setup: pgAdmin DB + Docker + POS installer |
| **[PGADMIN-LOCAL.md](PGADMIN-LOCAL.md)** | PostgreSQL 18 + Docker (no Docker postgres) |
| **[DOCKER.md](DOCKER.md)** | Docker-only deploy |

Quick start:

```powershell
Copy-Item .env.client-ready .env   # edit if needed
.\scripts\deploy-client-local-pg.ps1
.\scripts\build-pos-installer.ps1 -NoPrompt
```

## Client server deployment (Docker)

**Deploy everything on the client's machine in one step:**

```bash
git clone https://github.com/cipherlabzgit/POS-Don-Son.git
cd POS-Don-Son
cp .env.docker.example .env    # edit CLIENT_HOST, passwords, JWT secret
./scripts/deploy-client.sh
```

| App | URL (replace host) |
|-----|---------------------|
| DMS Web | `http://SERVER:3000` |
| POS (browser) | `http://SERVER:5174` |
| API | `http://SERVER:5126` |

Full instructions: **[DOCKER.md](DOCKER.md)**

## Quick start (local dev)

### Prerequisites

- Node.js 20+
- .NET SDK 10 (`global.json` pins the version)
- PostgreSQL (local or Docker)

### 1. Database

```powershell
# Option A: use existing Postgres (see DMS-Backend/appsettings.Development.json)
.\scripts\setup-local-db.ps1

# Option B: full Docker stack (Postgres + backend + frontend + POS web)
copy .env.docker.example .env
# edit .env — set JWT_SECRET_KEY and SUPERADMIN_PASSWORD
docker compose up -d --build
```

### 2. Backend

```powershell
cd DMS-Backend
dotnet run
```

API: http://localhost:5126  
Health: http://localhost:5126/health

### 3. Frontend

```powershell
cd DMS-Frontend
npm install
npm run dev          # port 3000
npm run dev -- -p 3001   # alternate port
```

Uses Webpack by default (required on Windows when native SWC/Turbopack bindings are unavailable).

Create `DMS-Frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:5126
```

### 4. POS

```powershell
cd DMS-POS
npm install
npm run dev          # Vite on 5173 + Electron window
# or web-only:
npx vite --host
```

### Start all three (PowerShell)

```powershell
.\scripts\start-dev.ps1
```

## Default login

| Field | Value |
|-------|-------|
| Email | `admin@donandson.com` |
| Password | `SuperAdmin@2026!Dev` |

(Seeded on first run when `DevSeed:Enabled` is `true` in Development.)

## Project layout

```
DMS-Backend/     ASP.NET Core API
DMS-Frontend/    Next.js admin / operations UI
DMS-POS/         Electron POS (Vite + React)
docs/            Deployment, migration, and feature guides
scripts/         DB setup, Docker helpers, dev startup
docker-compose.yml   Full production-style local stack
```

## Documentation

- **[DOCKER.md](DOCKER.md)** — client server deploy (start here for production)
- [docs/DOCKER_GUIDE.md](docs/DOCKER_GUIDE.md) — detailed Docker reference
- [DEV_WORKFLOW.MD](DEV_WORKFLOW.MD) — day-to-day development
- [docs/DEPLOYMENT_GUIDE.MD](docs/DEPLOYMENT_GUIDE.MD) — field / remote POS (Electron)
- [MIGRATION_QUICKREF.MD](MIGRATION_QUICKREF.MD) — database migrations

## Notes

- **Canonical repo:** use `D:\DMS\POS-Don-Son` (this folder) — linked to `cipherlabzgit/POS-Don-Son`.
- The older `DonandSons-DMS` copy under `D:\System` has a corrupt `.git` history; treat this repo as the source of truth.
- Frontend page files must use lowercase extensions (`page.tsx`, not `page.TSX`) for Next.js routing on Windows.
