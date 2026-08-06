# Start Don & Sons DMS Docker stack + desktop POS (Electron).
# Run from repo root:  .\scripts\start-docker-and-pos.ps1
# Or double-click:     Start-DMS.bat

param(
    [switch]$Rebuild,
    [switch]$SkipPos,
    [switch]$OpenBrowser
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Write-Step([string]$Message) {
    Write-Host $Message -ForegroundColor Cyan
}

function Read-EnvValue([string]$Name, [string]$Default) {
    if (-not (Test-Path ".env")) { return $Default }
    $line = Get-Content ".env" | Where-Object { $_ -match "^\s*$([regex]::Escape($Name))=" } | Select-Object -First 1
    if (-not $line) { return $Default }
    $value = ($line -split "=", 2)[1].Trim()
    if ([string]::IsNullOrWhiteSpace($value)) { return $Default }
    return $value
}

Write-Host ""
Write-Host "=== Don & Sons DMS — Start Docker + POS ===" -ForegroundColor Green
Write-Host "Project: $Root"
Write-Host ""

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "Docker is not installed or not in PATH. Install Docker Desktop first."
}

if (-not (Test-Path ".env")) {
    throw ".env not found. Copy .env.docker.example to .env and configure it first."
}

Write-Step "Starting Docker containers ..."
if ($Rebuild) {
    docker compose up -d --build
} else {
    docker compose up -d
}

$backendPort = Read-EnvValue "BACKEND_PORT" "5126"
$frontendPort = Read-EnvValue "FRONTEND_PORT" "3000"
$posPort = Read-EnvValue "POS_PORT" "5174"

Write-Step "Waiting for backend health (http://127.0.0.1:$backendPort/health) ..."
$healthy = $false
for ($i = 1; $i -le 30; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:$backendPort/health" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            $healthy = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 2
    }
}

if ($healthy) {
    Write-Host "Backend is healthy." -ForegroundColor Green
} else {
    Write-Host "Backend not healthy yet. Check: docker compose logs backend" -ForegroundColor Yellow
}

if (-not $SkipPos) {
    $posDir = Join-Path $Root "DMS-POS"
    if (-not (Test-Path $posDir)) {
        throw "DMS-POS folder not found at $posDir"
    }

    Write-Step "Launching desktop POS (Electron) in a new window ..."
    $posCommand = @"
Set-Location '$posDir'
Write-Host '=== Don & Sons POS (Desktop) ===' -ForegroundColor Yellow
Write-Host 'API: http://127.0.0.1:$backendPort' -ForegroundColor DarkGray
Write-Host 'Close this window to stop the POS app.' -ForegroundColor DarkGray
Write-Host ''
if (-not (Test-Path node_modules)) { npm install }
npm run dev
"@

    Start-Process powershell -ArgumentList @("-NoExit", "-Command", $posCommand)
}

Write-Host ""
Write-Host "=== Ready ===" -ForegroundColor Green
Write-Host "  DMS Web:       http://localhost:$frontendPort"
Write-Host "  POS (browser): http://localhost:$posPort"
Write-Host "  API:           http://localhost:$backendPort/health"
Write-Host "  POS (desktop): opens from npm run dev window"
Write-Host ""

docker compose ps

if ($OpenBrowser) {
    Start-Process "http://localhost:$frontendPort"
    Start-Process "http://localhost:$posPort"
}

Write-Host "Tip: double-click Start-DMS.bat on the Desktop for daily startup." -ForegroundColor DarkGray
Write-Host ""
