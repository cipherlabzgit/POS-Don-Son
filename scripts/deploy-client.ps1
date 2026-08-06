# Don & Sons DMS — client server deploy (Windows PowerShell)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "=== Don & Sons DMS — Docker deploy ===" -ForegroundColor Cyan
Write-Host "Project: $Root"
Write-Host ""

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "Docker is not installed. Install Docker Desktop first."
}

try { docker compose version | Out-Null } catch {
    throw "Docker Compose v2 is required (docker compose)."
}

if (-not (Test-Path ".env")) {
    Copy-Item ".env.docker.example" ".env"
    Write-Host ""
    Write-Host "Created .env — edit these before re-running:" -ForegroundColor Yellow
    Write-Host "  CLIENT_HOST, POSTGRES_PASSWORD, JWT_SECRET_KEY, SUPERADMIN_PASSWORD"
    Write-Host "  DEV_SEED_ENABLED=true for first install (demo products)"
    Write-Host ""
    Write-Host "Then run:  .\scripts\deploy-client.ps1"
    exit 1
}

$envContent = Get-Content ".env" -Raw
if ($envContent -match 'JWT_SECRET_KEY=REPLACE_WITH' -or $envContent -notmatch 'JWT_SECRET_KEY=.{32,}') {
    throw "Set JWT_SECRET_KEY in .env (at least 32 characters). Generate: [Convert]::ToBase64String((1..48|%{Get-Random -Max 256}))"
}

if ($envContent -match 'CLIENT_HOST=localhost') {
    Write-Host "WARNING: CLIENT_HOST is localhost — use server IP/domain on a remote client server." -ForegroundColor Yellow
}

Write-Host "Building and starting containers ..."
docker compose up -d --build

$backendPort = 5126
if ($envContent -match 'BACKEND_PORT=(\d+)') { $backendPort = $Matches[1] }

Write-Host "Waiting for backend ..."
$healthy = $false
for ($i = 1; $i -le 24; $i++) {
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:$backendPort/health" -UseBasicParsing -TimeoutSec 5
        if ($r.StatusCode -eq 200) { $healthy = $true; break }
    } catch { Start-Sleep -Seconds 5 }
}
if ($healthy) { Write-Host "Backend is healthy." -ForegroundColor Green }
else { Write-Host "Check logs: docker compose logs backend" -ForegroundColor Yellow }

$hostName = "localhost"
if ($envContent -match 'CLIENT_HOST=(.+)') { $hostName = $Matches[1].Trim() }

Write-Host ""
Write-Host "=== Deploy complete ===" -ForegroundColor Green
Write-Host "  DMS Web:  http://${hostName}:3000"
Write-Host "  POS:      http://${hostName}:5174"
Write-Host "  API:      http://${hostName}:$backendPort"
Write-Host ""
docker compose ps
