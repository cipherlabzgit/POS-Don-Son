# Redeploy DMS Web + API only (uses HOST PostgreSQL via docker-compose.local-pg.yml).
# Run ON the client server after git pull:
#   cd D:\DMS\POS-Don-Son
#   git pull origin main
#   .\scripts\redeploy-dms-local-pg.ps1
#
# Does NOT rebuild browser POS or desktop POS installer.

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Get-EnvValue {
    param([string]$Name, [string]$Default = "")
    $line = Select-String -Path ".env" -Pattern "^$Name=(.*)$" | Select-Object -First 1
    if ($line) { return $line.Matches.Groups[1].Value.Trim() }
    return $Default
}

if (-not (Test-Path ".env")) {
    throw "No .env file. Copy .env.client-ready to .env and edit POSTGRES_* / CLIENT_HOST."
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "Docker is not installed."
}

Write-Host "=== Redeploy DMS (backend + frontend, host PostgreSQL) ===" -ForegroundColor Cyan
Write-Host "Ensures API uses the same dms_erp_db you see in pgAdmin (locked in docker-compose.override.yml)." -ForegroundColor DarkGray
Write-Host ""

$pgUser = Get-EnvValue "POSTGRES_USER" "postgres"
$pgDb   = Get-EnvValue "POSTGRES_DB" "dms_erp_db"
$pgPort = Get-EnvValue "POSTGRES_PORT" "5432"
Write-Host "Host DB: $pgDb on 127.0.0.1:$pgPort (user: $pgUser)" -ForegroundColor Green
Write-Host ""

Remove-Item Env:COMPOSE_FILE -ErrorAction SilentlyContinue
if (Test-Path ".env") {
    $envText = Get-Content ".env" -Raw
    if ($envText -match "(?m)^COMPOSE_FILE=") {
        $envText = [regex]::Replace($envText, "(?m)^COMPOSE_FILE=.*\r?\n?", "")
        Set-Content -Path ".env" -Value $envText.TrimEnd() -Encoding ASCII
        Add-Content -Path ".env" -Value "`n"
        Write-Host "Removed COMPOSE_FILE from .env (Windows path bug)." -ForegroundColor Yellow
    }
}

$sha = (git rev-parse --short HEAD 2>$null)
$labelFields = Test-Path "DMS-Frontend\src\components\products\ProductLabelPrintFields.tsx"
Write-Host "Git commit: $sha" -ForegroundColor Cyan
if ($labelFields) {
    Write-Host "Label-print UI file: present" -ForegroundColor Green
} else {
    throw "Latest code is missing on disk. Run: git pull origin main"
}

Write-Host "Rebuilding backend + frontend with --no-cache (old Next.js image is discarded) ..." -ForegroundColor Yellow
$prev = $ErrorActionPreference
$ErrorActionPreference = "Continue"
& docker compose -f docker-compose.yml -f docker-compose.override.yml build --no-cache backend frontend 2>&1 | ForEach-Object { Write-Host $_ }
if ($LASTEXITCODE -ne 0) { $ErrorActionPreference = $prev; throw "docker compose build failed." }
& docker compose -f docker-compose.yml -f docker-compose.override.yml up -d --force-recreate --no-deps backend 2>&1 | ForEach-Object { Write-Host $_ }
if ($LASTEXITCODE -ne 0) { $ErrorActionPreference = $prev; throw "backend recreate failed." }
& docker compose -f docker-compose.yml -f docker-compose.override.yml up -d --force-recreate --no-deps frontend 2>&1 | ForEach-Object { Write-Host $_ }
$ErrorActionPreference = $prev
if ($LASTEXITCODE -ne 0) { throw "frontend recreate failed." }

$backendPort = [int](Get-EnvValue "BACKEND_PORT" "5126")
$hostName = Get-EnvValue "CLIENT_HOST" "127.0.0.1"

Write-Host ""
Write-Host "Waiting for backend health ..." -ForegroundColor Cyan
$healthy = $false
for ($i = 1; $i -le 36; $i++) {
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:$backendPort/health" -UseBasicParsing -TimeoutSec 5
        if ($r.StatusCode -eq 200) { $healthy = $true; break }
    } catch { Start-Sleep -Seconds 3 }
}

if ($healthy) {
    Write-Host "Backend is healthy." -ForegroundColor Green
} else {
    Write-Host "Backend not healthy yet - check: docker compose logs backend" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Next: verify product count ===" -ForegroundColor Yellow
Write-Host "  .\scripts\fix-pos-catalog.ps1"
Write-Host ""
Write-Host "DMS Web:  http://${hostName}:3000/inventory/products"
Write-Host "API:      http://${hostName}:$backendPort"
Write-Host ""
