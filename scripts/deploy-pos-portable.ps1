# ===========================================================================
# Deploy Don & Sons POS (Portable Version)
# ===========================================================================
# Copies the POS application to a target location with all dependencies
# Creates desktop and start menu shortcuts
# ===========================================================================

param(
    [string]$SourcePath = "D:\New Volume (D:)\System\DonandSons-DMS\DMS-POS\release\win-unpacked",
    [string]$DestinationPath = "C:\Program Files\DonAndSons\DMS-POS",
    [switch]$CreateShortcuts = $true
)

$ErrorActionPreference = "Stop"

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Don & Sons POS Portable Deployer" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if source exists
if (-not (Test-Path $SourcePath)) {
    Write-Host "ERROR: Source path not found!" -ForegroundColor Red
    Write-Host "Path: $SourcePath" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please update the -SourcePath parameter with the correct location." -ForegroundColor Yellow
    exit 1
}

# Check if destination exists, create if needed
Write-Host "[1/4] Preparing destination folder..." -ForegroundColor Yellow
if (Test-Path $DestinationPath) {
    Write-Host "      Destination exists. Removing old files..." -ForegroundColor Yellow
    Remove-Item -Path $DestinationPath -Recurse -Force
}

$destParent = Split-Path $DestinationPath -Parent
if (-not (Test-Path $destParent)) {
    New-Item -Path $destParent -ItemType Directory -Force | Out-Null
}
Write-Host "      ✓ Destination prepared" -ForegroundColor Green

# Copy entire folder
Write-Host ""
Write-Host "[2/4] Copying POS application files..." -ForegroundColor Yellow
Write-Host "      From: $SourcePath" -ForegroundColor Gray
Write-Host "      To:   $DestinationPath" -ForegroundColor Gray

Copy-Item -Path $SourcePath -Destination $DestinationPath -Recurse -Force

Write-Host "      ✓ Files copied successfully" -ForegroundColor Green

# Verify critical files
Write-Host ""
Write-Host "[3/4] Verifying installation..." -ForegroundColor Yellow

$exePath = Join-Path $DestinationPath "Don & Sons POS.exe"
$criticalFiles = @(
    "Don & Sons POS.exe",
    "ffmpeg.dll",
    "resources.pak",
    "locales"
)

$allPresent = $true
foreach ($file in $criticalFiles) {
    $filePath = Join-Path $DestinationPath $file
    if (Test-Path $filePath) {
        Write-Host "      ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "      ✗ $file MISSING!" -ForegroundColor Red
        $allPresent = $false
    }
}

if (-not $allPresent) {
    Write-Host ""
    Write-Host "ERROR: Some critical files are missing!" -ForegroundColor Red
    exit 1
}

# Create shortcuts
if ($CreateShortcuts) {
    Write-Host ""
    Write-Host "[4/4] Creating shortcuts..." -ForegroundColor Yellow
    
    $WshShell = New-Object -comObject WScript.Shell
    
    # Desktop shortcut
    $desktopPath = [Environment]::GetFolderPath("Desktop")
    $shortcutPath = Join-Path $desktopPath "Don & Sons POS.lnk"
    $Shortcut = $WshShell.CreateShortcut($shortcutPath)
    $Shortcut.TargetPath = $exePath
    $Shortcut.WorkingDirectory = $DestinationPath
    $Shortcut.Description = "Don & Sons Point of Sale System"
    $Shortcut.Save()
    Write-Host "      ✓ Desktop shortcut created" -ForegroundColor Green
    
    # Start Menu shortcut
    $startMenuPath = Join-Path ([Environment]::GetFolderPath("StartMenu")) "Programs\Don & Sons"
    if (-not (Test-Path $startMenuPath)) {
        New-Item -Path $startMenuPath -ItemType Directory -Force | Out-Null
    }
    $shortcutPath = Join-Path $startMenuPath "Don & Sons POS.lnk"
    $Shortcut = $WshShell.CreateShortcut($shortcutPath)
    $Shortcut.TargetPath = $exePath
    $Shortcut.WorkingDirectory = $DestinationPath
    $Shortcut.Description = "Don & Sons Point of Sale System"
    $Shortcut.Save()
    Write-Host "      ✓ Start Menu shortcut created" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[4/4] Skipping shortcut creation" -ForegroundColor Yellow
}

# Calculate size
$folderSize = (Get-ChildItem -Path $DestinationPath -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ Deployment completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Installation Details:" -ForegroundColor Cyan
Write-Host "  Location: $DestinationPath" -ForegroundColor White
Write-Host "  Size: $([math]::Round($folderSize, 2)) MB" -ForegroundColor White
Write-Host ""
Write-Host "You can now:" -ForegroundColor Yellow
Write-Host "  1. Run the application from Desktop shortcut" -ForegroundColor White
Write-Host "  2. Run from Start Menu: Don & Sons > Don & Sons POS" -ForegroundColor White
Write-Host "  3. Run directly: $exePath" -ForegroundColor White
Write-Host ""
Write-Host "To deploy to other computers:" -ForegroundColor Yellow
Write-Host "  Copy the entire folder: $DestinationPath" -ForegroundColor White
Write-Host "  Then run this script on the target machine" -ForegroundColor White
Write-Host ""

# Ask to launch
$response = Read-Host "Launch Don & Sons POS now? (Y/N)"
if ($response -eq "Y" -or $response -eq "y") {
    Start-Process $exePath
    Write-Host "✓ Application launched" -ForegroundColor Green
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
