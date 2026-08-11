# Full rebuild and start on CLIENT SERVER (local PostgreSQL + Docker stack + POS installer).
#
# Run on the client server as Administrator (recommended):
#   cd D:\DMS\POS-Don-Son
#   .\scripts\rebuild-client-server.ps1
#
# Options:
#   -SkipGitPull     Do not git pull (already updated)
#   -SkipPosInstaller Skip building Windows POS .exe (faster)
#   -SkipCatalogFix  Skip fix-pos-catalog.ps1

param(
    [switch]$SkipGitPull,
    [switch]$SkipPosInstaller,
    [switch]$SkipCatalogFix
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Write-Step([string]$Message) {
    Write-Host ""
    Write-Host "=== $Message ===" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Don and Sons DMS - FULL CLIENT SERVER REBUILD" -ForegroundColor Green
Write-Host "Project: $Root" -ForegroundColor DarkGray
Write-Host ""

if (-not (Test-Path ".env")) {
    if (Test-Path ".env.client-ready") {
        Copy-Item ".env.client-ready" ".env"
        Write-Host "Created .env from .env.client-ready - review CLIENT_HOST and passwords." -ForegroundColor Yellow
    } else {
        throw "No .env file. Copy .env.client-ready to .env and edit CLIENT_HOST."
    }
}

Write-Step "1/5 PostgreSQL service"
$pgSvc = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue |
    Where-Object { $_.Status -eq "Running" } |
    Select-Object -First 1
if (-not $pgSvc) {
    Write-Host "Starting PostgreSQL..." -ForegroundColor Yellow
    foreach ($s in (Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue)) {
        try {
            if ($s.Status -ne "Running") { Start-Service $s.Name }
        } catch {
            Write-Host "Could not start $($s.Name). Run PowerShell as Administrator." -ForegroundColor Red
            throw
        }
    }
} else {
    Write-Host "PostgreSQL running: $($pgSvc.Name)" -ForegroundColor Green
}

if (-not $SkipGitPull) {
    Write-Step "2/5 Git pull latest code"
    if (Get-Command git -ErrorAction SilentlyContinue) {
        git pull origin main
    } else {
        Write-Host "git not found - skipping pull" -ForegroundColor Yellow
    }
} else {
    Write-Host "Skipping git pull (-SkipGitPull)" -ForegroundColor DarkGray
}

Write-Step "3/5 Rebuild Docker (backend, DMS web, browser POS)"
& "$Root\scripts\deploy-client-local-pg.ps1"
if ($LASTEXITCODE -ne 0) { throw "deploy-client-local-pg.ps1 failed." }

if (-not $SkipCatalogFix) {
    Write-Step "4/5 Fix POS catalog (DisplayInPOS + API test)"
    & "$Root\scripts\fix-pos-catalog.ps1"
    if ($LASTEXITCODE -ne 0) { throw "fix-pos-catalog.ps1 failed." }
} else {
    Write-Host "Skipping catalog fix (-SkipCatalogFix)" -ForegroundColor DarkGray
}

if (-not $SkipPosInstaller) {
    Write-Step "5/5 Build Windows POS installer"
    & "$Root\scripts\build-pos-installer.ps1" -NoPrompt
    if ($LASTEXITCODE -ne 0) { throw "build-pos-installer.ps1 failed." }
} else {
    Write-Host "Skipping POS installer (-SkipPosInstaller)" -ForegroundColor DarkGray
}

function Get-EnvValue([string]$Name, [string]$Default = "") {
    $line = Select-String -Path ".env" -Pattern "^$Name=(.*)$" | Select-Object -First 1
    if ($line) { return $line.Matches.Groups[1].Value.Trim() }
    return $Default
}

$hostName = Get-EnvValue "CLIENT_HOST" "123.231.10.22"
$backendPort = Get-EnvValue "BACKEND_PORT" "5126"

Write-Host ""
Write-Host "=== REBUILD COMPLETE ===" -ForegroundColor Green
Write-Host "  DMS Web:     http://${hostName}:3000"
Write-Host "  Browser POS: http://${hostName}:5174"
Write-Host "  API:         http://${hostName}:$backendPort"
Write-Host "  Database:    dms_erp_db on localhost:5432 (pgAdmin)"
if (-not $SkipPosInstaller) {
    Write-Host "  Installer:   DMS-POS\release\Don & Sons POS Setup 2.0.0.exe"
}
Write-Host ""
Write-Host "On each POS PC:" -ForegroundColor Yellow
Write-Host "  1. Install/reinstall POS from release folder (copy pos-config.json too)"
Write-Host "  2. Server URL: http://${hostName}:$backendPort"
Write-Host "  3. Log out, log in, POS Diagnostic -> Clear and Re-sync"
Write-Host ""

docker compose -f docker-compose.yml -f docker-compose.local-pg.yml ps
