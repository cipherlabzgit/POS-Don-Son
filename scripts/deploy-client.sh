#!/usr/bin/env bash
# Don & Sons DMS — client server deploy (Linux / macOS / WSL)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== Don & Sons DMS — Docker deploy ==="
echo "Project: $ROOT"
echo ""

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: Docker is not installed. See https://docs.docker.com/engine/install/"
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "ERROR: Docker Compose v2 is required (docker compose)."
  exit 1
fi

if [[ ! -f .env ]]; then
  echo "Creating .env from .env.docker.example ..."
  cp .env.docker.example .env
  echo ""
  echo "IMPORTANT: Edit .env before continuing:"
  echo "  - Set CLIENT_HOST to your server IP or domain"
  echo "  - Set POSTGRES_PASSWORD, JWT_SECRET_KEY, SUPERADMIN_PASSWORD"
  echo "  - Set DEV_SEED_ENABLED=true for first install (demo products)"
  echo ""
  echo "Then run:  ./scripts/deploy-client.sh"
  exit 1
fi

# shellcheck disable=SC1091
source .env 2>/dev/null || true

if [[ "${JWT_SECRET_KEY:-}" == *"REPLACE_WITH"* ]] || [[ ${#JWT_SECRET_KEY} -lt 32 ]]; then
  echo "ERROR: Set JWT_SECRET_KEY in .env (at least 32 characters)."
  echo "  Generate: openssl rand -base64 48"
  exit 1
fi

if [[ "${SUPERADMIN_PASSWORD:-}" == *"SuperAdmin@2026!Dev"* ]]; then
  echo "WARNING: Using default SUPERADMIN_PASSWORD — change it for production."
fi

if [[ "${CLIENT_HOST:-localhost}" == "localhost" ]]; then
  echo "WARNING: CLIENT_HOST is still localhost."
  echo "  On a remote server, set CLIENT_HOST to the server IP or domain in .env"
fi

echo "Building and starting containers (first run may take 10+ minutes) ..."
docker compose up -d --build

echo ""
echo "Waiting for backend health ..."
for i in $(seq 1 60); do
  if curl -fsS "http://127.0.0.1:${BACKEND_PORT:-5126}/health" >/dev/null 2>&1; then
    echo "Backend is healthy."
    break
  fi
  sleep 5
  if [[ $i -eq 60 ]]; then
    echo "Backend not ready yet — check: docker compose logs backend"
  fi
done

HOST="${CLIENT_HOST:-localhost}"
echo ""
echo "=== Deploy complete ==="
echo "  DMS Web:  http://${HOST}:${FRONTEND_PORT:-3000}"
echo "  POS:      http://${HOST}:${POS_PORT:-5174}"
echo "  API:      http://${HOST}:${BACKEND_PORT:-5126}"
echo "  Login:    ${SUPERADMIN_EMAIL:-admin@donandson.com}"
echo ""
docker compose ps
