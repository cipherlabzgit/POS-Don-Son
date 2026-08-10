# ===========================================================================
# Build Don & Sons POS Installer
# ===========================================================================
# Creates a proper Windows installer (.exe) for the POS application
# ===========================================================================

$ErrorActionPreference = "Stop"

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Don & Sons POS Installer Builder" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to POS directory
$Root = Split-Path -Parent $PSScriptRoot
$posDir = Join-Path $Root "DMS-POS"
Set-Location $posDir

Write-Host "[1/5] Cleaning previous build..." -ForegroundColor Yellow
if (Test-Path "release") {
    Remove-Item -Path "release" -Recurse -Force
    Write-Host "      ✓ Removed old release folder" -ForegroundColor Green
}
if (Test-Path "dist") {
    Remove-Item -Path "dist" -Recurse -Force
    Write-Host "      ✓ Removed old dist folder" -ForegroundColor Green
}

Write-Host ""
Write-Host "[2/5] Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "      ✗ npm install failed!" -ForegroundColor Red
    exit 1
}
Write-Host "      ✓ Dependencies installed" -ForegroundColor Green

Write-Host ""
Write-Host "[3/5] Building React frontend..." -ForegroundColor Yellow
npm run vite:build
if ($LASTEXITCODE -ne 0) {
    Write-Host "      ✗ Frontend build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "      ✓ Frontend built successfully" -ForegroundColor Green

Write-Host ""
Write-Host "[4/5] Packaging Electron app..." -ForegroundColor Yellow
npx electron-builder build --win --x64
if ($LASTEXITCODE -ne 0) {
    Write-Host "      ✗ Electron packaging failed!" -ForegroundColor Red
    exit 1
}
Write-Host "      ✓ Electron app packaged" -ForegroundColor Green

Write-Host ""
Write-Host "[5/5] Locating installer..." -ForegroundColor Yellow

$installerPath = Get-ChildItem -Path "release" -Filter "*.exe" -Recurse | 
    Where-Object { $_.Name -like "*Setup*.exe" } | 
    Select-Object -First 1

if ($installerPath) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✓ Build completed successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Installer location:" -ForegroundColor Cyan
    Write-Host "  $($installerPath.FullName)" -ForegroundColor White
    Write-Host ""
    Write-Host "Installer size: $([math]::Round($installerPath.Length / 1MB, 2)) MB" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "You can now:" -ForegroundColor Yellow
    Write-Host "  1. Copy this installer to other computers" -ForegroundColor White
    Write-Host "  2. Run it to install the POS application" -ForegroundColor White
    Write-Host "  3. It will create Start Menu and Desktop shortcuts" -ForegroundColor White
    Write-Host ""
    
    # Open the release folder
    Start-Process "explorer.exe" -ArgumentList "/select,$($installerPath.FullName)"
} else {
    Write-Host "      ⚠ Warning: Installer .exe not found in release folder" -ForegroundColor Yellow
    Write-Host "      The win-unpacked folder was created instead." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Available files in release:" -ForegroundColor Cyan
    Get-ChildItem -Path "release" -Recurse | Select-Object FullName | Format-Table
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
