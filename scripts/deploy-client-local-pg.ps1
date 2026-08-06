# Don and Sons DMS - deploy with LOCAL PostgreSQL (pgAdmin) + Docker app services
# Creates empty database on host PG if needed; backend migrations create all tables.
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "=== Don and Sons DMS - Local PostgreSQL (pgAdmin) + Docker ===" -ForegroundColor Cyan
Write-Host "Project: $Root"
Write-Host ""

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "Docker is not installed. Install Docker Desktop first."
}

try {
    docker compose version | Out-Null
} catch {
    throw "Docker Compose v2 is required (docker compose)."
}

if (-not (Test-Path ".env")) {
    if (Test-Path ".env.client-ready") {
        Copy-Item ".env.client-ready" ".env"
        Write-Host "Created .env from .env.client-ready - edit CLIENT_HOST, then re-run." -ForegroundColor Yellow
    } else {
        Copy-Item ".env.docker.example" ".env"
        Write-Host "Created .env - edit CLIENT_HOST, passwords, then re-run." -ForegroundColor Yellow
    }
    exit 1
}

function Get-EnvValue {
    param(
        [string]$Name,
        [string]$Default = ""
    )
    $line = Select-String -Path ".env" -Pattern "^$Name=(.*)$" | Select-Object -First 1
    if ($line) {
        return $line.Matches.Groups[1].Value.Trim()
    }
    return $Default
}

$pgUser = Get-EnvValue -Name "POSTGRES_USER" -Default "postgres"
$pgPass = Get-EnvValue -Name "POSTGRES_PASSWORD" -Default "postgres"
$pgDb = Get-EnvValue -Name "POSTGRES_DB" -Default "dms_erp_db"
$pgPort = [int](Get-EnvValue -Name "POSTGRES_PORT" -Default "5432")

$envContent = Get-Content ".env" -Raw
if ($envContent -match 'JWT_SECRET_KEY=REPLACE_WITH' -or $envContent -notmatch 'JWT_SECRET_KEY=.{32,}') {
    throw "Set JWT_SECRET_KEY in .env (at least 32 characters)."
}

$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
if (-not (Test-Path $psql)) {
    $found = Get-ChildItem "C:\Program Files\PostgreSQL\*\bin\psql.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        $psql = $found.FullName
    } else {
        throw "psql not found. Install PostgreSQL 18 and ensure the service is running."
    }
}

Write-Host "Checking local PostgreSQL on localhost:$pgPort ..." -ForegroundColor Cyan
$env:PGPASSWORD = $pgPass
& $psql -U $pgUser -h localhost -p $pgPort -d postgres -c "SELECT 1;" | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw "Cannot connect to local PostgreSQL. Check POSTGRES_USER and POSTGRES_PASSWORD in .env."
}

$dbExists = & $psql -U $pgUser -h localhost -p $pgPort -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$pgDb';"
if ($dbExists -ne "1") {
    Write-Host "Creating database '$pgDb' on local PostgreSQL ..." -ForegroundColor Yellow
    & $psql -U $pgUser -h localhost -p $pgPort -d postgres -c "CREATE DATABASE $pgDb;"
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to create database '$pgDb'."
    }
    Write-Host "Database '$pgDb' created." -ForegroundColor Green
} else {
    Write-Host "Database '$pgDb' already exists on local PostgreSQL." -ForegroundColor Green
}

Write-Host ""
Write-Host "Starting Docker (backend, frontend, pos) using HOST PostgreSQL ..." -ForegroundColor Cyan
docker compose -f docker-compose.yml -f docker-compose.local-pg.yml down 2>$null
docker compose -f docker-compose.yml -f docker-compose.local-pg.yml up -d --build backend frontend pos

$backendPort = 5126
if ($envContent -match 'BACKEND_PORT=(\d+)') {
    $backendPort = $Matches[1]
}

Write-Host "Waiting for backend (migrations create tables in pgAdmin database) ..." -ForegroundColor Cyan
$healthy = $false
for ($i = 1; $i -le 36; $i++) {
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:$backendPort/health" -UseBasicParsing -TimeoutSec 5
        if ($r.StatusCode -eq 200) {
            $healthy = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 5
    }
}

if ($healthy) {
    Write-Host "Backend is healthy." -ForegroundColor Green
    $tableCount = & $psql -U $pgUser -h localhost -p $pgPort -d $pgDb -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"
    Write-Host "Tables in local '$pgDb': $tableCount" -ForegroundColor Green
} else {
    Write-Host "Backend not healthy yet. Check docker compose logs backend" -ForegroundColor Yellow
}

$hostName = Get-EnvValue -Name "CLIENT_HOST" -Default "localhost"

Write-Host ""
Write-Host "=== Deploy complete (local PostgreSQL) ===" -ForegroundColor Green
Write-Host "  pgAdmin database: $pgDb on localhost:$pgPort (user: $pgUser)"
Write-Host "  DMS Web:  http://${hostName}:3000"
Write-Host "  POS:      http://${hostName}:5174"
Write-Host "  API:      http://${hostName}:$backendPort"
Write-Host "  Login:    admin@donandson.com / SUPERADMIN_PASSWORD in .env"
Write-Host ""
Write-Host "In pgAdmin: Databases -> $pgDb -> Schemas -> public -> Tables -> Refresh"
Write-Host ""
docker compose -f docker-compose.yml -f docker-compose.local-pg.yml ps
