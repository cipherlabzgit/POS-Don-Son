# ===========================================================================
# Verify POS Build Configuration
# ===========================================================================
# Checks that all environment variables are correct before building installer
# ===========================================================================

$ErrorActionPreference = "Stop"

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "POS Build Configuration Verification" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$posPath = ".\DMS-POS"
$envProdPath = Join-Path $posPath ".env.production"

# Check if .env.production exists
Write-Host "[1/3] Checking .env.production file..." -ForegroundColor Yellow
if (-not (Test-Path $envProdPath)) {
    Write-Host "  ERROR: .env.production not found!" -ForegroundColor Red
    Write-Host "  Path: $envProdPath" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ File exists" -ForegroundColor Green

# Read and parse .env.production
Write-Host ""
Write-Host "[2/3] Reading configuration..." -ForegroundColor Yellow
$envContent = Get-Content $envProdPath -Raw
$apiUrlMatch = $envContent | Select-String -Pattern 'VITE_API_URL\s*=\s*(.+)' -AllMatches

if ($apiUrlMatch.Matches.Count -eq 0) {
    Write-Host "  ERROR: VITE_API_URL not found in .env.production!" -ForegroundColor Red
    exit 1
}

$apiUrl = $apiUrlMatch.Matches[0].Groups[1].Value.Trim()
Write-Host "  VITE_API_URL = $apiUrl" -ForegroundColor White

# Validate URL
Write-Host ""
Write-Host "[3/3] Validating configuration..." -ForegroundColor Yellow

if ($apiUrl -match "localhost|127\.0\.0\.1") {
    Write-Host ""
    Write-Host "  WARNING: API URL contains localhost!" -ForegroundColor Red
    Write-Host "  Current: $apiUrl" -ForegroundColor Red
    Write-Host ""
    Write-Host "  This means the installer will be built with localhost," -ForegroundColor Yellow
    Write-Host "  and it won't work on remote computers!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Expected format: http://123.231.10.22:5126" -ForegroundColor Green
    Write-Host ""
    
    $fix = Read-Host "  Would you like to fix this now? (Y/N)"
    if ($fix -eq "Y" -or $fix -eq "y") {
        $newUrl = Read-Host "  Enter correct server URL (e.g., http://123.231.10.22:5126)"
        
        # Update .env.production
        $newContent = $envContent -replace 'VITE_API_URL\s*=\s*.+', "VITE_API_URL=$newUrl"
        $newContent | Out-File -FilePath $envProdPath -Encoding UTF8 -NoNewline
        
        Write-Host ""
        Write-Host "  ✓ Updated .env.production" -ForegroundColor Green
        Write-Host "  New URL: $newUrl" -ForegroundColor Green
        $apiUrl = $newUrl
    } else {
        Write-Host "  Please fix .env.production manually before building." -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "  ✓ API URL looks correct" -ForegroundColor Green
}

# Test connectivity
Write-Host ""
Write-Host "Testing backend connectivity..." -ForegroundColor Yellow
try {
    $testUrl = "$apiUrl/health"
    Write-Host "  Testing: $testUrl" -ForegroundColor Gray
    
    $response = Invoke-WebRequest -Uri $testUrl -Method Get -TimeoutSec 5 -UseBasicParsing
    Write-Host "  ✓ Backend is reachable (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "  WARNING: Cannot reach backend at $apiUrl" -ForegroundColor Yellow
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  The installer will still be built, but it might not work" -ForegroundColor Yellow
    Write-Host "  until the backend is accessible." -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "Configuration Check Complete!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Build Configuration:" -ForegroundColor Cyan
Write-Host "  API URL: $apiUrl" -ForegroundColor White
Write-Host "  Config File: $envProdPath" -ForegroundColor White
Write-Host ""
Write-Host "Ready to build installer!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. cd DMS-POS" -ForegroundColor White
Write-Host "  2. npm run build" -ForegroundColor White
Write-Host "  3. Wait for build to complete (~5-10 minutes)" -ForegroundColor White
Write-Host "  4. Installer will be at: DMS-POS\release\Don & Sons POS Setup 2.0.0.exe" -ForegroundColor White
Write-Host ""
