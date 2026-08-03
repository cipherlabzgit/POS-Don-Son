# Don & Sons DMS — Docker Deployment Guide

A complete, from-scratch guide to running the **DMS-ERP** stack
(PostgreSQL 16 + .NET 10 backend + Next.js 16 frontend) with Docker Compose.

The setup is intentionally **production-shaped**: multi-stage builds, non-root
runtime users, healthchecks, named volumes for data and logs, secrets injected
via `.env`, and a private bridge network for inter-service traffic.

---

## Table of contents

1. [Prerequisites](#1-prerequisites)
2. [Project folder layout](#2-project-folder-layout)
3. [One-time setup](#3-one-time-setup)
4. [Build the images](#4-build-the-images)
5. [Start the stack](#5-start-the-stack)
6. [Verify everything works](#6-verify-everything-works)
7. [Day-to-day operations](#7-day-to-day-operations)
8. [Updating the application](#8-updating-the-application)
9. [Database management](#9-database-management)
10. [Troubleshooting](#10-troubleshooting)
11. [Production hardening checklist](#11-production-hardening-checklist)

---

## 1. Prerequisites

Install the latest stable versions:

| Tool                 | Minimum version | Notes                                                            |
|----------------------|-----------------|------------------------------------------------------------------|
| Docker Engine        | 24+             | Includes the BuildKit builder used by the Dockerfiles            |
| Docker Compose v2    | 2.20+           | Bundled with Docker Desktop and `docker-compose-plugin`          |
| Git                  | optional        | Only if you use Git to pull updates; not required for a single-server copy of the code |

**Windows users:** install **Docker Desktop** and enable the WSL 2 backend.
All commands in this guide work in PowerShell, Windows Terminal, or WSL.

You do **not** need GitHub or any remote host: put the project folder on the
machine that runs Docker (USB, zip, RDP copy, internal Git, etc.) and run the
commands from that folder.

Verify your install:

```bash
docker --version
docker compose version
docker run --rm hello-world
```

---

## 2. Project folder layout

Your project directory should contain (names may match your disk path):

```
DonandSons-DMS/
├─ docker-compose.yml              ← orchestrates the 3 services
├─ .env.docker.example             ← template for secrets / config
├─ .env                            ← YOUR copy (create locally; keep private)
├─ DOCKER_GUIDE.md                 ← this file
│
├─ DMS-Backend/
│  ├─ Dockerfile                   ← multi-stage .NET 10 build
│  ├─ .dockerignore
│  └─ ... (csproj, Program.cs, etc.)
│
└─ DMS-Frontend/
   ├─ Dockerfile                   ← multi-stage Next.js 16 standalone build
   ├─ .dockerignore
   └─ ... (package.json, next.config.ts, etc.)
```

---

## 3. One-time setup

### 3.1 Create your environment file

From the project folder root (the directory that contains `docker-compose.yml`):

```powershell
# Windows PowerShell
Copy-Item .env.docker.example .env
```

```bash
# macOS / Linux / WSL
cp .env.docker.example .env
```

### 3.2 Fill in real secrets

Open `.env` and replace **at minimum** these values:

| Key                  | Why                                                            |
|----------------------|----------------------------------------------------------------|
| `POSTGRES_PASSWORD`  | Database password (used inside the network and from your host) |
| `JWT_SECRET_KEY`     | Must be ≥ 32 characters of high-entropy text                   |
| `SUPERADMIN_PASSWORD`| Password of the bootstrap admin created on first run           |

Generate a strong JWT secret:

```bash
# macOS / Linux / WSL
openssl rand -base64 48
```

```powershell
# Windows PowerShell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 3.3 (Optional) change ports

Default host ports are:

| Service   | Container port | Host port (default) | Override via       |
|-----------|----------------|---------------------|--------------------|
| Postgres  | 5432           | 5432                | `POSTGRES_PORT`    |
| Backend   | 8080           | 5126                | `BACKEND_PORT`     |
| Frontend  | 3000           | 3000                | `FRONTEND_PORT`    |

If you change `BACKEND_PORT`, also update `NEXT_PUBLIC_API_URL` so the
**browser** can still reach the API (it is baked into the JS bundle at
build time).

---

## 4. Build the images

```bash
docker compose build
```

What this does:

* **Backend** – three stages: `restore` (NuGet cache), `build` (publish to
  `/app/publish`), `runtime` (ASP.NET 10 image, non-root `dms` user, ~220 MB).
* **Frontend** – three stages: `deps` (`npm ci` with cache mount), `builder`
  (`next build` with `output: 'standalone'`), `runner` (Node 22 Alpine,
  non-root `nextjs` user, ~180 MB).

To build **without using cache** (e.g. after dependency changes):

```bash
docker compose build --no-cache --pull
```

To build a single service:

```bash
docker compose build backend
docker compose build frontend
```

> ℹ️  The first build pulls the .NET SDK (~700 MB) and Node images.
> Subsequent builds reuse layers and finish in seconds for code-only changes.

---

## 5. Start the stack

```bash
docker compose up -d
```

`-d` runs in detached mode. Compose will:

1. Pull `postgres:16-alpine` if missing.
2. Start `postgres` and wait for `pg_isready` to succeed.
3. Start `backend`, which automatically:
   * applies all EF Core migrations (`Database.MigrateAsync()`),
   * seeds the permission catalog and the SuperAdmin user,
   * (only if `DEV_SEED_ENABLED=true`) seeds demo data.
4. Once `backend`'s healthcheck passes, start `frontend`.

Watch progress:

```bash
docker compose logs -f
```

Press `Ctrl-C` to stop tailing (containers keep running).

---

## 6. Verify everything works

### 6.1 Container health

```bash
docker compose ps
```

You should see all three services with `STATUS = healthy`:

```
NAME            STATUS                    PORTS
dms-postgres    Up X minutes (healthy)    0.0.0.0:5432->5432/tcp
dms-backend     Up X minutes (healthy)    0.0.0.0:5126->8080/tcp
dms-frontend    Up X minutes (healthy)    0.0.0.0:3000->3000/tcp
```

### 6.2 Backend API

* OpenAPI document: <http://localhost:5126/openapi/v1.json>
* Scalar UI:        <http://localhost:5126/scalar/v1>

### 6.3 Frontend

Open <http://localhost:3000>, log in with the credentials from `.env`:

* **Email:** `SUPERADMIN_EMAIL` (default `admin@donandson.com`)
* **Password:** `SUPERADMIN_PASSWORD`

### 6.4 Quick log check

```bash
docker compose logs backend  | tail -n 50
docker compose logs frontend | tail -n 50
docker compose logs postgres | tail -n 20
```

Backend Serilog output is **also** persisted to the `dms_backend_logs`
named volume at `/app/logs/dms-backend-YYYY-MM-DD.txt`.

---

## 7. Day-to-day operations

| Action                              | Command                                              |
|-------------------------------------|------------------------------------------------------|
| Stop everything (keep data)         | `docker compose stop`                                |
| Start again                         | `docker compose start`                               |
| Restart one service                 | `docker compose restart backend`                     |
| Tail logs of one service            | `docker compose logs -f backend`                     |
| Open a shell in the backend         | `docker compose exec backend /bin/bash`              |
| Open a `psql` shell                 | `docker compose exec postgres psql -U dms_user -d dms_erp_db` |
| Inspect a healthcheck               | `docker inspect --format='{{json .State.Health}}' dms-backend` |
| Stop and **remove** containers      | `docker compose down`                                |
| Stop, remove, **and wipe data**     | `docker compose down -v` ⚠️ destroys the database     |

---

## 8. Updating the application

After you replace the code on the server (copy an updated folder, `git pull`
if you use Git, etc.):

```bash
docker compose build           # rebuild changed images
docker compose up -d           # recreates only changed containers
```

Compose will leave Postgres alone (volume persists) and replace the
backend/frontend containers in place. EF Core migrations run automatically
on backend startup.

For **dependency** changes (`csproj` / `package.json`), force a clean build:

```bash
docker compose build --no-cache backend
docker compose build --no-cache frontend
docker compose up -d
```

---

## 9. Database management

### 9.1 Backup

```bash
docker compose exec -T postgres \
  pg_dump -U dms_user -d dms_erp_db --no-owner --clean --if-exists \
  > backup-$(date +%Y%m%d-%H%M%S).sql
```

On Windows PowerShell:

```powershell
docker compose exec -T postgres `
  pg_dump -U dms_user -d dms_erp_db --no-owner --clean --if-exists `
  > "backup-$(Get-Date -Format yyyyMMdd-HHmmss).sql"
```

### 9.2 Restore

```bash
docker compose exec -T postgres \
  psql -U dms_user -d dms_erp_db < backup-XXXX.sql
```

### 9.3 Reset the database completely

```bash
docker compose down -v        # removes the dms_postgres_data volume
docker compose up -d          # backend re-runs all migrations + seeders
```

---

## 10. Troubleshooting

### Backend exits immediately with a database error

* **`28P01: password authentication failed for user "dms_user"`** — The
  password in your `.env` does **not** match the password stored inside the
  existing Postgres volume. `POSTGRES_USER` / `POSTGRES_PASSWORD` in Compose
  only run when the data directory is **blank** (first-time init). After that,
  either:
  * Run **`scripts/Sync-DockerPostgresPassword.ps1`** from the project root
    (with Postgres already up: `docker compose up -d postgres`), then
    `docker compose up -d`, or
  * Put `POSTGRES_PASSWORD` back to whatever you used on that **first** run, or
  * Run `docker compose exec postgres psql -U "$POSTGRES_USER" -d postgres -c "ALTER USER dms_user WITH PASSWORD 'your_new_password';"` (match `.env`), or
  * Wipe and recreate (destroys all DB data): `docker compose down -v` then `docker compose up -d`

* Confirm Postgres is healthy: `docker compose ps postgres`.

### `JWT_SECRET_KEY must be set in .env`

Compose refuses to start the backend when the variable is empty (the `:?` in
`docker-compose.yml`). Edit `.env` and run `docker compose up -d` again.

### Frontend shows network errors when calling the API

The browser uses `NEXT_PUBLIC_API_URL` baked in at **build** time. If you
changed `BACKEND_PORT` after building, **rebuild** the frontend:

```bash
docker compose build --no-cache frontend
docker compose up -d frontend
```

### Port already in use (e.g. 3000 or 5432 occupied on the host)

Change the host-side port in `.env` (e.g. `FRONTEND_PORT=3001`) and re-run
`docker compose up -d`.

### "permission denied" writing to `/app/logs` (backend)

The backend runs as UID 1001 (`dms`). Logs go to a **named volume**, which
Docker creates with the right ownership. If you bind-mount a host directory
instead, `chown -R 1001:1001 ./logs` first.

### View live healthcheck status

```bash
docker inspect --format='{{json .State.Health}}' dms-backend  | jq
docker inspect --format='{{json .State.Health}}' dms-frontend | jq
```

---

## 11. Production hardening checklist

The supplied stack is production-**shaped** but not yet production-**deployed**.
Before going live, also do the following:

- [ ] Put both services behind a reverse proxy (Nginx / Traefik / Caddy) that
      terminates TLS, sets HSTS, and forwards `X-Forwarded-*` headers.
- [ ] Set `NEXT_PUBLIC_API_URL` to the **public HTTPS** API URL during build.
- [ ] Replace the in-memory CORS allow-list in
      `DMS-Backend/Program.cs` with a configurable list and add your real
      frontend origin.
- [ ] Swap `InMemoryRefreshTokenService` for a persistent store
      (Redis or Postgres) so refresh tokens survive backend restarts.
- [ ] Add a dedicated `MapHealthChecks("/health")` endpoint with a
      `DbContext` check and switch the Dockerfile `HEALTHCHECK` to it.
- [ ] Move secrets (`JWT_SECRET_KEY`, DB password, SuperAdmin password) from
      `.env` to your platform's secret store (Docker Secrets, AWS Secrets
      Manager, GCP Secret Manager, Azure Key Vault, Kubernetes Secrets…).
- [ ] Tag images with versions (`dms-backend:1.4.0`) and push them to a
      private registry instead of building on the production host.
- [ ] Set up off-host backups of the `dms_postgres_data` volume.
- [ ] Enable container resource limits (`deploy.resources.limits.cpus / memory`).
- [ ] Forward container logs to your central log aggregator
      (Loki / ELK / CloudWatch).
- [ ] Run regular `docker scout` or `trivy` scans of the built images.

---

### TL;DR — first run on your server

Use the directory that contains `docker-compose.yml` (however you got the files there).

**PowerShell (Windows):**

```powershell
cd C:\path\to\DonandSons-DMS
Copy-Item .env.docker.example .env   # then edit secrets
docker compose build
docker compose up -d
docker compose ps    # all "healthy"? → open http://localhost:3000
```

**Bash (Linux / macOS / WSL):**

```bash
cd /path/to/DonandSons-DMS
cp .env.docker.example .env   # then edit secrets
docker compose build
docker compose up -d
docker compose ps
```

That's it. Welcome to DMS-ERP on Docker.
