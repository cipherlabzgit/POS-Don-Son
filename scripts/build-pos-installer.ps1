# Build Don and Sons POS Windows installer (.exe) for client server.
# Reads VITE_API_URL from repo root .env (or .env.client-ready).
#
# Usage (from repo root):
#   .\scripts\build-pos-installer.ps1
#
# Requires: Node.js 22+, npm, repo root .env with VITE_API_URL or CLIENT_HOST

param(
    [switch]$NoPrompt
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$posDir = Join-Path $Root "DMS-POS"

function Get-EnvValue {
    param(
        [string]$File,
        [string]$Name,
        [string]$Default = ""
    )
    if (-not (Test-Path $File)) { return $Default }
    $line = Select-String -Path $File -Pattern "^$Name=(.*)$" | Select-Object -First 1
    if ($line) { return $line.Matches.Groups[1].Value.Trim() }
    return $Default
}

function Resolve-ApiUrl {
    $envFile = Join-Path $Root ".env"
    if (-not (Test-Path $envFile)) {
        $fallback = Join-Path $Root ".env.client-ready"
        if (Test-Path $fallback) {
            Write-Host "No .env found - using .env.client-ready for API URL." -ForegroundColor Yellow
            $envFile = $fallback
        } else {
            throw "Create .env from .env.client-ready before building POS."
        }
    }

    $viteUrl = Get-EnvValue -File $envFile -Name "VITE_API_URL"
    if ($viteUrl) { return $viteUrl }

    $clientHost = Get-EnvValue -File $envFile -Name "CLIENT_HOST"
    $port = Get-EnvValue -File $envFile -Name "BACKEND_PORT" -Default "5126"
    if ($clientHost) { return "http://${clientHost}:$port" }

    throw "Set VITE_API_URL or CLIENT_HOST in .env before building POS."
}

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Don and Sons POS Installer Builder" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js is not installed. Install Node.js 22+ from https://nodejs.org"
}

$apiUrl = Resolve-ApiUrl
Write-Host "API URL for POS build: $apiUrl" -ForegroundColor Green
Write-Host ""

$posEnvFile = Join-Path $posDir ".env"
"VITE_API_URL=$apiUrl" | Set-Content -Path $posEnvFile -Encoding ASCII
Write-Host "Wrote $posEnvFile" -ForegroundColor Cyan

Set-Location $posDir

Write-Host "[1/5] Cleaning previous build..." -ForegroundColor Yellow
if (Test-Path "release") {
    Remove-Item -Path "release" -Recurse -Force
    Write-Host "      OK - removed release folder" -ForegroundColor Green
}
if (Test-Path "dist") {
    Remove-Item -Path "dist" -Recurse -Force
    Write-Host "      OK - removed dist folder" -ForegroundColor Green
}

Write-Host ""
Write-Host "[2/5] Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) { throw "npm install failed." }
Write-Host "      OK - dependencies installed" -ForegroundColor Green

Write-Host ""
Write-Host "[3/5] Building Vite frontend..." -ForegroundColor Yellow
npm run vite:build
if ($LASTEXITCODE -ne 0) { throw "vite build failed." }
Write-Host "      OK - frontend built" -ForegroundColor Green

Write-Host ""
Write-Host "[4/5] Packaging Electron installer..." -ForegroundColor Yellow
npx electron-builder build --win --x64
if ($LASTEXITCODE -ne 0) { throw "electron-builder failed." }
Write-Host "      OK - installer packaged" -ForegroundColor Green

Write-Host ""
Write-Host "[5/5] Locating installer..." -ForegroundColor Yellow

$installerPath = Get-ChildItem -Path "release" -Filter "*.exe" -Recurse |
    Where-Object { $_.Name -like "*Setup*.exe" } |
    Select-Object -First 1

if ($installerPath) {
    Write-Host ""
    Write-Host "Build completed successfully." -ForegroundColor Green
    Write-Host ""
    Write-Host "Installer:" -ForegroundColor Cyan
    Write-Host "  $($installerPath.FullName)" -ForegroundColor White
    Write-Host "  Size: $([math]::Round($installerPath.Length / 1MB, 2)) MB" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Copy this .exe to cashier PCs and run to install." -ForegroundColor Yellow
    Write-Host "Backend must be reachable at: $apiUrl" -ForegroundColor Yellow
} else {
    Write-Host "Setup .exe not found. Check DMS-POS\release folder." -ForegroundColor Yellow
    Get-ChildItem -Path "release" -Recurse | Select-Object FullName
}

if (-not $NoPrompt) {
    Write-Host ""
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
