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
Write-Host "Ensures API uses the same dms_erp_db you see in pgAdmin (not Docker Postgres volume)." -ForegroundColor DarkGray
Write-Host ""

$pgUser = Get-EnvValue "POSTGRES_USER" "postgres"
$pgDb   = Get-EnvValue "POSTGRES_DB" "dms_erp_db"
$pgPort = Get-EnvValue "POSTGRES_PORT" "5432"
Write-Host "Host DB: $pgDb on 127.0.0.1:$pgPort (user: $pgUser)" -ForegroundColor Green
Write-Host ""

$prev = $ErrorActionPreference
$ErrorActionPreference = "Continue"
& docker compose -f docker-compose.yml -f docker-compose.local-pg.yml up -d --build backend frontend 2>&1 | ForEach-Object { Write-Host $_ }
$ErrorActionPreference = $prev
if ($LASTEXITCODE -ne 0) { throw "docker compose failed." }

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
    Write-Host "Backend not healthy yet — check: docker compose logs backend" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Next: verify product count ===" -ForegroundColor Yellow
Write-Host "  .\scripts\fix-pos-catalog.ps1"
Write-Host ""
Write-Host "DMS Web:  http://${hostName}:3000/inventory/products"
Write-Host "API:      http://${hostName}:$backendPort"
Write-Host ""
