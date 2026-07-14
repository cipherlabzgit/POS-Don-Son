# Don & Sons POS - Remote Location Deployment Script
# PowerShell script to automate POS deployment to remote locations

param(
    [Parameter(Mandatory=$true)]
    [string]$LocationId,
    
    [Parameter(Mandatory=$true)]
    [string]$OutletId,
    
    [Parameter(Mandatory=$true)]
    [string]$OutletName,
    
    [Parameter(Mandatory=$false)]
    [string]$ServerUrl = "http://123.231.10.22:5126",
    
    [Parameter(Mandatory=$false)]
    [string]$InstallerPath = ".\DMS-POS\release\Don & Sons POS Setup 2.0.0.exe"
)

$ErrorActionPreference = "Stop"

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Don & Sons POS Deployment Script" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Deployment configuration
$config = @{
    LocationId = $LocationId
    OutletId = $OutletId
    OutletName = $OutletName
    ServerUrl = $ServerUrl
    DeploymentDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    DeployedBy = $env:USERNAME
    ComputerName = $env:COMPUTERNAME
}

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Location ID: $($config.LocationId)"
Write-Host "  Outlet ID: $($config.OutletId)"
Write-Host "  Outlet Name: $($config.OutletName)"
Write-Host "  Server URL: $($config.ServerUrl)"
Write-Host "  Computer: $($config.ComputerName)"
Write-Host ""

# Check if installer exists
Write-Host "[1/6] Checking installer..." -ForegroundColor Green
if (-not (Test-Path $InstallerPath)) {
    Write-Host "  ERROR: Installer not found at: $InstallerPath" -ForegroundColor Red
    Write-Host "  Please build the installer first: cd DMS-POS && npm run build" -ForegroundColor Yellow
    exit 1
}
Write-Host "  Installer found: $InstallerPath" -ForegroundColor Green
$installerSize = (Get-Item $InstallerPath).Length / 1MB
Write-Host "  Size: $([math]::Round($installerSize, 2)) MB" -ForegroundColor Green
Write-Host ""

# Check internet connectivity
Write-Host "[2/6] Testing connectivity..." -ForegroundColor Green
try {
    $pingResult = Test-Connection -ComputerName "123.231.10.22" -Count 2 -Quiet
    if ($pingResult) {
        Write-Host "  Server is reachable" -ForegroundColor Green
    } else {
        Write-Host "  WARNING: Cannot ping server at 123.231.10.22" -ForegroundColor Yellow
        Write-Host "  Continuing anyway (might work with different routing)..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "  WARNING: Ping test failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Test API endpoint
try {
    $response = Invoke-WebRequest -Uri "$ServerUrl/health" -Method Get -TimeoutSec 5 -UseBasicParsing
    Write-Host "  API is healthy (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "  WARNING: Cannot reach API at $ServerUrl" -ForegroundColor Yellow
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Yellow
    
    $continue = Read-Host "  Continue anyway? (y/n)"
    if ($continue -ne "y") {
        Write-Host "  Deployment cancelled." -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# Create deployment package
Write-Host "[3/6] Creating deployment package..." -ForegroundColor Green
$tempDir = Join-Path $env:TEMP "DonAndSonsPOS_$LocationId"
if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

# Copy installer
Write-Host "  Copying installer..." -ForegroundColor Gray
Copy-Item -Path $InstallerPath -Destination $tempDir

# Create config file
Write-Host "  Creating configuration file..." -ForegroundColor Gray
$configJson = @{
    locationId = $config.LocationId
    outletId = $config.OutletId
    outletName = $config.OutletName
    serverUrl = $config.ServerUrl
    deploymentDate = $config.DeploymentDate
    deployedBy = $config.DeployedBy
    computerName = $config.ComputerName
} | ConvertTo-Json -Depth 10

$configPath = Join-Path $tempDir "deployment-config.json"
$configJson | Out-File -FilePath $configPath -Encoding UTF8

# Create quick reference guide
$quickGuide = @"
==================================================
Don & Sons POS - Installation Quick Guide
==================================================

Location: $($config.OutletName)
Outlet ID: $($config.OutletId)
Server: $($config.ServerUrl)
Deployed: $($config.DeploymentDate)

==================================================
Installation Steps:
==================================================

1. Run "Don & Sons POS Setup 2.0.0.exe" as Administrator
2. Follow installation wizard
3. Launch "Don & Sons POS" from desktop
4. Login with your credentials
5. Select outlet: $($config.OutletName)
6. Wait for initial sync (products download)

==================================================
Verification Steps:
==================================================

1. Create a test sale
2. Check if it syncs to server
3. Disconnect internet
4. Create offline sale
5. Reconnect internet
6. Verify offline sale syncs

==================================================
Troubleshooting:
==================================================

If connection fails:
- Press Ctrl+Shift+I to open DevTools
- Go to Console tab
- Look for error messages
- Check API URL in settings

If products don't load:
- Check internet connection
- Verify server is running
- Re-login to trigger sync

Support: info@cipherlabz.com

==================================================
"@

$guidePath = Join-Path $tempDir "INSTALLATION_GUIDE.txt"
$quickGuide | Out-File -FilePath $guidePath -Encoding UTF8

Write-Host "  Deployment package created at: $tempDir" -ForegroundColor Green
Write-Host ""

# Installation options
Write-Host "[4/6] Installation options:" -ForegroundColor Green
Write-Host "  1. Install on this computer now" -ForegroundColor White
Write-Host "  2. Copy package to USB drive" -ForegroundColor White
Write-Host "  3. Copy package to network location" -ForegroundColor White
Write-Host "  4. Skip installation (package ready)" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Select option (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "[5/6] Installing POS application..." -ForegroundColor Green
        
        $installerExe = Join-Path $tempDir "Don & Sons POS Setup 2.0.0.exe"
        
        # Check if running as admin
        $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
        
        if (-not $isAdmin) {
            Write-Host "  Requesting administrator privileges..." -ForegroundColor Yellow
            Start-Process -FilePath $installerExe -Verb RunAs -Wait
        } else {
            Start-Process -FilePath $installerExe -Wait
        }
        
        Write-Host "  Installation completed!" -ForegroundColor Green
        Write-Host ""
        
        # Configure registry or local storage (if needed)
        Write-Host "[6/6] Post-installation configuration..." -ForegroundColor Green
        Write-Host "  Manual configuration required:" -ForegroundColor Yellow
        Write-Host "    1. Launch 'Don & Sons POS' from desktop" -ForegroundColor White
        Write-Host "    2. Login with your credentials" -ForegroundColor White
        Write-Host "    3. Select outlet: $($config.OutletName)" -ForegroundColor White
        Write-Host ""
    }
    
    "2" {
        Write-Host ""
        Write-Host "[5/6] Copying to USB drive..." -ForegroundColor Green
        
        # List available drives
        $drives = Get-Volume | Where-Object { $_.DriveType -eq 'Removable' } | Select-Object DriveLetter, FileSystemLabel, Size
        
        if ($drives.Count -eq 0) {
            Write-Host "  No USB drives detected. Please insert a USB drive." -ForegroundColor Red
            exit 1
        }
        
        Write-Host "  Available USB drives:" -ForegroundColor White
        $drives | Format-Table -AutoSize
        
        $driveLetter = Read-Host "Enter drive letter (e.g., E)"
        $usbPath = "${driveLetter}:\DonAndSonsPOS_$LocationId"
        
        if (-not (Test-Path "${driveLetter}:")) {
            Write-Host "  Drive not found: ${driveLetter}:" -ForegroundColor Red
            exit 1
        }
        
        Copy-Item -Path $tempDir -Destination $usbPath -Recurse -Force
        Write-Host "  Copied to: $usbPath" -ForegroundColor Green
        Write-Host ""
        
        Write-Host "[6/6] Next steps:" -ForegroundColor Green
        Write-Host "  1. Take USB drive to remote location" -ForegroundColor White
        Write-Host "  2. Copy folder to remote PC" -ForegroundColor White
        Write-Host "  3. Run installer as Administrator" -ForegroundColor White
        Write-Host "  4. Follow INSTALLATION_GUIDE.txt" -ForegroundColor White
        Write-Host ""
    }
    
    "3" {
        Write-Host ""
        Write-Host "[5/6] Copying to network location..." -ForegroundColor Green
        
        $networkPath = Read-Host "Enter network path (e.g., \\server\deployments)"
        
        if (-not (Test-Path $networkPath)) {
            Write-Host "  ERROR: Network path not accessible: $networkPath" -ForegroundColor Red
            exit 1
        }
        
        $destPath = Join-Path $networkPath "DonAndSonsPOS_$LocationId"
        Copy-Item -Path $tempDir -Destination $destPath -Recurse -Force
        Write-Host "  Copied to: $destPath" -ForegroundColor Green
        Write-Host ""
        
        Write-Host "[6/6] Next steps:" -ForegroundColor Green
        Write-Host "  1. Access from remote PC: $destPath" -ForegroundColor White
        Write-Host "  2. Run installer as Administrator" -ForegroundColor White
        Write-Host "  3. Follow INSTALLATION_GUIDE.txt" -ForegroundColor White
        Write-Host ""
    }
    
    "4" {
        Write-Host ""
        Write-Host "[5/6] Package ready" -ForegroundColor Green
        Write-Host "  Location: $tempDir" -ForegroundColor White
        Write-Host ""
        
        Write-Host "[6/6] Next steps:" -ForegroundColor Green
        Write-Host "  1. Copy package to remote location" -ForegroundColor White
        Write-Host "  2. Run installer as Administrator" -ForegroundColor White
        Write-Host "  3. Follow INSTALLATION_GUIDE.txt" -ForegroundColor White
        Write-Host ""
    }
    
    default {
        Write-Host "  Invalid choice. Package ready at: $tempDir" -ForegroundColor Yellow
    }
}

# Create deployment log
Write-Host "Creating deployment log..." -ForegroundColor Green
$logContent = @{
    Config = $config
    InstallerPath = $InstallerPath
    PackagePath = $tempDir
    DeploymentComplete = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
} | ConvertTo-Json -Depth 10

$logPath = ".\deployment-log-$LocationId-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
$logContent | Out-File -FilePath $logPath -Encoding UTF8
Write-Host "Deployment log saved: $logPath" -ForegroundColor Green
Write-Host ""

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Deployment Summary:" -ForegroundColor Yellow
Write-Host "  Location: $($config.LocationId) - $($config.OutletName)"
Write-Host "  Package: $tempDir"
Write-Host "  Log: $logPath"
Write-Host ""
Write-Host "Don't forget to:" -ForegroundColor Yellow
Write-Host "  ✓ Test the installation" -ForegroundColor White
Write-Host "  ✓ Verify sync functionality" -ForegroundColor White
Write-Host "  ✓ Train the staff" -ForegroundColor White
Write-Host "  ✓ Update central deployment register" -ForegroundColor White
Write-Host ""
