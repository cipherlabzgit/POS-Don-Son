# Docker — Don & Sons DMS + POS

Deploy the full stack on a client server with **one command**:

- **PostgreSQL 16** — database  
- **DMS Backend** — .NET 10 API  
- **DMS Frontend** — Next.js web app  
- **DMS POS** — browser-based POS (nginx)

---

## Prerequisites

| Tool | Notes |
|------|--------|
| [Docker Engine](https://docs.docker.com/engine/install/) 24+ | With Compose v2 |
| Free ports | **5432**, **5126**, **3000**, **5174** (or change in `.env`) |
| RAM | 4 GB minimum, 8 GB recommended for first build |

Verify:

```bash
docker --version
docker compose version
```

---

## Local PostgreSQL (pgAdmin) instead of Docker database

If the client uses **PostgreSQL 18 on Windows** (pgAdmin) and you do **not** want Docker postgres:

```powershell
.\scripts\deploy-client-local-pg.ps1
```

Full guide: **[PGADMIN-LOCAL.md](PGADMIN-LOCAL.md)**

---

## Quick start (client server)

### 1. Create folder and get the code

```bash
sudo mkdir -p /opt/dms
sudo chown $USER:$USER /opt/dms
cd /opt/dms
git clone https://github.com/cipherlabzgit/POS-Don-Son.git
cd POS-Don-Son
```

Or copy the project folder to the server (zip, SCP, etc.).

### 2. Configure environment

```bash
cp .env.docker.example .env
nano .env
```

**Replace `CLIENT_HOST`** with the server IP or domain (e.g. `192.168.1.100` or `dms.client.com`).

**Must change before production:**

| Variable | Purpose |
|----------|---------|
| `POSTGRES_PASSWORD` | Database password |
| `JWT_SECRET_KEY` | ≥ 32 random characters |
| `SUPERADMIN_PASSWORD` | Admin login password |
| `CLIENT_HOST` | Server IP or domain (used in all public URLs) |

Generate JWT secret:

```bash
openssl rand -base64 48
```

**First install:** set `DEV_SEED_ENABLED=true` to create demo products and showrooms.

### 3. Deploy

**Linux / macOS:**

```bash
chmod +x scripts/deploy-client.sh
./scripts/deploy-client.sh
```

**Or manually:**

```bash
docker compose up -d --build
```

**Windows PowerShell:**

```powershell
Copy-Item .env.docker.example .env   # edit first
.\scripts\deploy-client.ps1
```

First build takes **5–15 minutes**.

### 4. Verify

```bash
docker compose ps
docker compose logs -f backend
```

Wait for: `DMS Backend API started successfully`

---

## Access URLs

Replace `CLIENT_HOST` with your server address:

| App | URL | Default port |
|-----|-----|--------------|
| **DMS Web** | `http://CLIENT_HOST:3000` | 3000 |
| **POS (browser)** | `http://CLIENT_HOST:5174` | 5174 |
| **API** | `http://CLIENT_HOST:5126` | 5126 |
| **API docs** | `http://CLIENT_HOST:5126/scalar/v1` | 5126 |

### Default login

| Field | Default (change in `.env`) |
|-------|----------------------------|
| Email | `admin@donandson.com` |
| Password | value of `SUPERADMIN_PASSWORD` |

**POS:** select a **showroom** from the header after login, then products load.

---

## How services connect

```
Browser → frontend:3000  ──API calls──►  backend:5126
Browser → pos:5174       ──API calls──►  backend:5126
backend                  ──SQL────────►  postgres:5432
```

- `NEXT_PUBLIC_API_URL` and `VITE_API_URL` are **baked in at build time** — set them in `.env` **before** `docker compose up --build`.
- Use the **public URL** the user's browser can reach (server IP or domain), not `localhost`, on a remote server.

---

## Firewall (if enabled)

```bash
sudo ufw allow 3000/tcp
sudo ufw allow 5126/tcp
sudo ufw allow 5174/tcp
```

Do **not** expose Postgres (5432) to the public internet unless required.

---

## Useful commands

```bash
# Logs
docker compose logs -f
docker compose logs -f backend

# Stop (keeps database)
docker compose down

# Restart after code update
git pull
docker compose up -d --build

# Full reset (DELETES ALL DATA)
docker compose down -v
docker compose up -d --build
```

---

## Production with HTTPS (recommended)

1. Point domains to the server, e.g.:
   - `dms.client.com` → port 3000  
   - `pos.client.com` → port 5174  
   - `api.client.com` → port 5126  

2. Update `.env`:

```env
CLIENT_HOST=dms.client.com
FRONTEND_URL=https://dms.client.com
NEXT_PUBLIC_API_URL=https://api.client.com
POS_URL=https://pos.client.com
VITE_API_URL=https://api.client.com
```

3. Rebuild (URLs are baked into frontend/POS):

```bash
docker compose down
docker compose up -d --build
```

4. Put **Nginx** or **Caddy** in front for SSL (Let's Encrypt).

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `JWT_SECRET_KEY must be set` | Edit `.env`, set a long random string |
| `password authentication failed` | Run `scripts/Sync-DockerPostgresPassword.ps1` or `docker compose down -v` (wipes DB) |
| Frontend/POS can't reach API | Rebuild after fixing URLs: `docker compose up -d --build` |
| No products in POS | Set `DEV_SEED_ENABLED=true`, reset DB, select showroom in POS header |
| Port in use | Change `FRONTEND_PORT`, `BACKEND_PORT`, etc. in `.env` |

Full guide: [docs/DOCKER_GUIDE.md](docs/DOCKER_GUIDE.md)

Data safety: [DOCKER_DATA_SAFETY.md](DOCKER_DATA_SAFETY.md)

---

## File layout

```
POS-Don-Son/
├── docker-compose.yml
├── .env.docker.example    ← copy to .env
├── DOCKER.md              ← this file
├── scripts/
│   ├── deploy-client.sh
│   └── deploy-client.ps1
├── DMS-Backend/Dockerfile
├── DMS-Frontend/Dockerfile
└── DMS-POS/Dockerfile
```
