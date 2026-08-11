# Start DMS with LOCAL PostgreSQL (no Docker) + desktop POS.
# Use when PostgreSQL runs as a Windows service (pgAdmin / PostgreSQL 18).
#
# Run from repo root:  .\scripts\start-local-and-pos.ps1
# Or double-click:     Start-DMS-Local.bat

param(
    [switch]$SkipPos,
    [switch]$SkipBackend,
    [int]$BackendPort = 5126
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

function Test-BackendHealthy([int]$Port) {
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/health" -UseBasicParsing -TimeoutSec 3
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Ensure-PostgreSQL {
    $svc = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue |
        Where-Object { $_.Status -eq "Running" } |
        Select-Object -First 1
    if ($svc) {
        Write-Host "PostgreSQL service running: $($svc.Name)" -ForegroundColor Green
        return
    }
    Write-Host "PostgreSQL service not running. Attempting to start..." -ForegroundColor Yellow
    $all = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
    if (-not $all) {
        throw "No PostgreSQL Windows service found. Install PostgreSQL 18 or start Docker stack instead (Start-DMS.bat)."
    }
    foreach ($s in $all) {
        try {
            if ($s.Status -ne "Running") {
                Start-Service $s.Name
                Write-Host "Started $($s.Name)" -ForegroundColor Green
            }
        } catch {
            Write-Host "Could not start $($s.Name): $_" -ForegroundColor Yellow
        }
    }
    $running = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue |
        Where-Object { $_.Status -eq "Running" }
    if (-not $running) {
        throw "PostgreSQL is not running. Start it from Services (services.msc) or use Docker (Start-DMS.bat)."
    }
}

Write-Host ""
Write-Host "=== Don & Sons DMS — Local PostgreSQL + POS ===" -ForegroundColor Green
Write-Host "Project: $Root"
Write-Host ""

$BackendPort = [int](Read-EnvValue "BACKEND_PORT" "$BackendPort")
$apiUrl = "http://127.0.0.1:$BackendPort"

Ensure-PostgreSQL

if (-not $SkipBackend) {
    if (Test-BackendHealthy $BackendPort) {
        Write-Host "Backend already running at $apiUrl" -ForegroundColor Green
    } else {
        $backendDir = Join-Path $Root "DMS-Backend"
        if (-not (Test-Path $backendDir)) {
            throw "DMS-Backend folder not found at $backendDir"
        }

        Write-Step "Starting backend API ($apiUrl) ..."
        $backendCommand = @"
Set-Location '$backendDir'
`$env:ASPNETCORE_ENVIRONMENT = 'Development'
Write-Host '=== DMS Backend (local PostgreSQL) ===' -ForegroundColor Cyan
Write-Host 'API: $apiUrl' -ForegroundColor DarkGray
Write-Host 'Close this window to stop the API server.' -ForegroundColor DarkGray
Write-Host ''
dotnet run --urls '$apiUrl'
"@

        Start-Process powershell -ArgumentList @("-NoExit", "-Command", $backendCommand)

        Write-Step "Waiting for backend health ($apiUrl/health) ..."
        $healthy = $false
        for ($i = 1; $i -le 45; $i++) {
            if (Test-BackendHealthy $BackendPort) {
                $healthy = $true
                break
            }
            Start-Sleep -Seconds 2
        }

        if ($healthy) {
            Write-Host "Backend is healthy." -ForegroundColor Green
        } else {
            Write-Host "Backend not healthy yet. Check the backend window for errors." -ForegroundColor Yellow
            Write-Host "Common fixes: run .\scripts\setup-local-db.ps1 or check appsettings.Development.json" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "Skipping backend start (-SkipBackend)." -ForegroundColor DarkGray
}

if (-not $SkipPos) {
    $posDir = Join-Path $Root "DMS-POS"
    if (-not (Test-Path $posDir)) {
        throw "DMS-POS folder not found at $posDir"
    }

  # Ensure POS .env points to local backend
    $posEnv = Join-Path $posDir ".env"
    if (-not (Test-Path $posEnv)) {
        "VITE_API_URL=$apiUrl" | Set-Content -Path $posEnv -Encoding ASCII
    }

    Write-Step "Launching desktop POS (Electron) ..."
    $posCommand = @"
Set-Location '$posDir'
Write-Host '=== Don & Sons POS (Desktop) ===' -ForegroundColor Yellow
Write-Host 'API: $apiUrl' -ForegroundColor DarkGray
Write-Host 'Close this window to stop the POS app.' -ForegroundColor DarkGray
Write-Host ''
if (-not (Test-Path node_modules)) { npm install }
npm run dev
"@

    Start-Process powershell -ArgumentList @("-NoExit", "-Command", $posCommand)
}

Write-Host ""
Write-Host "=== Ready ===" -ForegroundColor Green
Write-Host "  API:           $apiUrl/health"
Write-Host "  POS (desktop): opens from npm run dev window"
Write-Host ""
Write-Host "Tip: double-click Start-DMS-Local.bat for daily startup (no Docker)." -ForegroundColor DarkGray
Write-Host ""
