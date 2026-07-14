# ============================================================================
# Don & Sons DMS - Get Outlet GUIDs via API
# ============================================================================
#
# Purpose: Fetch outlet GUIDs from the backend API (no database access needed)
# Usage: .\get-outlet-guids.ps1
#
# ============================================================================

param(
    [Parameter(Mandatory=$false)]
    [string]$ApiUrl = "http://123.231.10.22:5126",
    
    [Parameter(Mandatory=$false)]
    [string]$Email = "",
    
    [Parameter(Mandatory=$false)]
    [string]$Password = ""
)

$ErrorActionPreference = "Stop"

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Don & Sons - Get Outlet GUIDs" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Get credentials if not provided
if ([string]::IsNullOrWhiteSpace($Email)) {
    $Email = Read-Host "Enter your email"
}

if ([string]::IsNullOrWhiteSpace($Password)) {
    $securePassword = Read-Host "Enter your password" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $Password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

Write-Host "API URL: $ApiUrl" -ForegroundColor Yellow
Write-Host ""

# Step 1: Login to get JWT token
Write-Host "[1/2] Logging in..." -ForegroundColor Green

try {
    $loginBody = @{
        email = $Email
        password = $Password
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$ApiUrl/api/auth/login" `
        -Method Post `
        -Body $loginBody `
        -ContentType "application/json" `
        -TimeoutSec 10

    $token = $loginResponse.data.accessToken
    Write-Host "  ✓ Login successful" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "  ✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Fetch outlets
Write-Host "[2/2] Fetching outlets..." -ForegroundColor Green

try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }

    $outletsResponse = Invoke-RestMethod -Uri "$ApiUrl/api/outlets/paginated?page=1&pageSize=100" `
        -Method Get `
        -Headers $headers `
        -TimeoutSec 10

    $outlets = $outletsResponse.data.outlets
    Write-Host "  ✓ Found $($outlets.Count) outlet(s)" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "  ✗ Failed to fetch outlets: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Display outlets
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Outlet Information" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$outlets | ForEach-Object -Begin { $i = 1 } -Process {
    Write-Host "Outlet #$i" -ForegroundColor Yellow
    Write-Host "  Code:        $($_.code)" -ForegroundColor White
    Write-Host "  Name:        $($_.name)" -ForegroundColor White
    Write-Host "  GUID:        $($_.id)" -ForegroundColor Cyan
    Write-Host "  Address:     $($_.address)" -ForegroundColor Gray
    Write-Host "  Phone:       $($_.phone)" -ForegroundColor Gray
    Write-Host ""
    $i++
}

# Generate deployment reference table
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Deployment Reference Table" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "| Code  | Name                | Outlet GUID                          |" -ForegroundColor White
Write-Host "|-------|---------------------|--------------------------------------|" -ForegroundColor White

$outlets | ForEach-Object {
    $code = $_.code.PadRight(5)
    $name = $_.name.PadRight(19)
    Write-Host "| $code | $name | $($_.id) |" -ForegroundColor White
}
Write-Host ""

# Generate PowerShell deployment commands
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "PowerShell Deployment Commands" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Copy and run these commands to deploy POS:" -ForegroundColor Yellow
Write-Host ""

$outlets | ForEach-Object -Begin { $locNum = 1 } -Process {
    $locationId = "LOC-{0:D3}" -f $locNum
    
    Write-Host "# $($_.name)" -ForegroundColor Green
    Write-Host ".\deploy-pos-remote.ps1 ``" -ForegroundColor White
    Write-Host "  -LocationId `"$locationId`" ``" -ForegroundColor White
    Write-Host "  -OutletId `"$($_.id)`" ``" -ForegroundColor White
    Write-Host "  -OutletName `"$($_.name)`"" -ForegroundColor White
    Write-Host ""
    
    $locNum++
}

# Export to CSV
$csvPath = ".\outlet-guids-$(Get-Date -Format 'yyyyMMdd-HHmmss').csv"
$outlets | Select-Object @{N='LocationID';E={$i++}}, code, name, id, address, phone | Export-Csv -Path $csvPath -NoTypeInformation

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Export Complete" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "CSV file saved: $csvPath" -ForegroundColor White
Write-Host ""

# Export to JSON
$jsonPath = ".\outlet-guids-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
$outlets | ConvertTo-Json -Depth 10 | Out-File -FilePath $jsonPath -Encoding UTF8
Write-Host "JSON file saved: $jsonPath" -ForegroundColor White
Write-Host ""

Write-Host "Done!" -ForegroundColor Green
