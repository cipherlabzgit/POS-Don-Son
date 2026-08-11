# Helper: after installing the LIVE POS build, clear local cache and print re-sync steps.
# Run on the POS PC (cashier machine):
#   .\scripts\reinstall-pos-live.ps1
# Or after installing from release folder:
#   powershell -File D:\DMS\POS-Don-Son\scripts\reinstall-pos-live.ps1

param(
    [string]$ApiUrl = "http://123.231.10.22:5126"
)

$ErrorActionPreference = "Stop"
$ApiUrl = $ApiUrl.TrimEnd('/')

Write-Host "=== POS live-server reset ===" -ForegroundColor Cyan
Write-Host "Target API: $ApiUrl" -ForegroundColor Green
Write-Host ""

# Clear Electron offline SQLite / userData so stale 0/2-product cache is gone
$candidates = @(
    (Join-Path $env:APPDATA "Don & Sons POS"),
    (Join-Path $env:APPDATA "don-and-sons-pos"),
    (Join-Path $env:APPDATA "dms-pos")
)

$cleared = $false
foreach ($dir in $candidates) {
    if (-not (Test-Path $dir)) { continue }
    Write-Host "Found POS userData: $dir" -ForegroundColor Yellow
    Get-ChildItem $dir -Filter "*.sqlite*" -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Host "  Removing $($_.FullName)" -ForegroundColor DarkGray
        Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue
        $cleared = $true
    }
    # Also clear IndexedDB-style localStorage backup if present as files (best-effort)
    $leveldb = Join-Path $dir "Local Storage"
    if (Test-Path $leveldb) {
        Write-Host "  Tip: after reinstall, open POS Diagnostic and Clear and Re-sync" -ForegroundColor DarkGray
    }
}

if (-not $cleared) {
    Write-Host "No SQLite cache files found yet (OK if POS not installed or never synced)." -ForegroundColor DarkGray
}

# Ensure pos-config next to common install / release locations
$releaseConfig = Join-Path (Split-Path -Parent $PSScriptRoot) "DMS-POS\release\pos-config.json"
if (Test-Path $releaseConfig) {
    @{ apiBaseUrl = $ApiUrl } | ConvertTo-Json | Set-Content -Path $releaseConfig -Encoding ASCII
    Write-Host "Updated $releaseConfig" -ForegroundColor Green
}

Write-Host ""
Write-Host "Do this now on this PC:" -ForegroundColor Yellow
Write-Host "  1. Close Don and Sons POS completely"
Write-Host "  2. Install: DMS-POS\release\Don & Sons POS Setup 2.0.0.exe"
Write-Host "     (keep pos-config.json in the same folder as Setup.exe)"
Write-Host "  3. Open POS -> Server URL must be: $ApiUrl"
Write-Host "  4. Sign in with admin / cashier account"
Write-Host "  5. Wait until status badge is ONLINE"
Write-Host "  6. Menu -> POS Diagnostic -> Clear and Re-sync"
Write-Host "  7. Products in Cache should be ~360 (live dms_erp_db)"
Write-Host ""
Write-Host "Quick health check from this PC:" -ForegroundColor Cyan
Write-Host "  Invoke-WebRequest '$ApiUrl/health' -UseBasicParsing"
Write-Host ""

try {
    $r = Invoke-WebRequest -Uri "$ApiUrl/health" -UseBasicParsing -TimeoutSec 8
    Write-Host "Health: $($r.StatusCode) $($r.Content)" -ForegroundColor Green
} catch {
    Write-Host "Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Fix network/firewall before re-syncing POS." -ForegroundColor Yellow
}
