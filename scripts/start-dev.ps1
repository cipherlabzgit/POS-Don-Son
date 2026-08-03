# Start DMS Backend, Frontend, and POS in separate windows.
# Run from repo root:  .\scripts\start-dev.ps1

param(
    [int]$FrontendPort = 3001,
    [int]$BackendPort = 5126
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Write-Host "Starting Don & Sons DMS dev stack..."
Write-Host "  Backend  -> http://localhost:$BackendPort"
Write-Host "  Frontend -> http://localhost:$FrontendPort"
Write-Host "  POS      -> http://localhost:5173"
Write-Host ""

# Backend
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "Set-Location '$root\DMS-Backend'; Write-Host '=== DMS Backend ===' -ForegroundColor Cyan; dotnet run --urls http://localhost:$BackendPort"
)

Start-Sleep -Seconds 2

# Frontend
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "Set-Location '$root\DMS-Frontend'; Write-Host '=== DMS Frontend ===' -ForegroundColor Green; if (-not (Test-Path node_modules)) { npm install }; npm run dev -- -p $FrontendPort"
)

Start-Sleep -Seconds 1

# POS (Vite web UI — use npm run dev for Electron)
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "Set-Location '$root\DMS-POS'; Write-Host '=== DMS POS ===' -ForegroundColor Yellow; if (-not (Test-Path node_modules)) { npm install }; npx vite --host"
)

Write-Host "All services launched in separate windows."
