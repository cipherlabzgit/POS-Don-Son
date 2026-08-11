# Force-rebuild browser POS (Docker :5174) with latest catalog-sync code.
# Run ON the client server:
#   cd D:\DMS\POS-Don-Son
#   git pull origin main
#   .\scripts\rebuild-browser-pos.ps1
#
# Why: the POS web UI is baked into the Docker image at build time.
# An old image still has the "empty page" sync bug even when the API is healthy.

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Get-EnvValue([string]$Name, [string]$Default = "") {
    if (-not (Test-Path ".env")) { return $Default }
    $line = Select-String -Path ".env" -Pattern "^$Name=(.*)$" | Select-Object -First 1
    if ($line) { return $line.Matches.Groups[1].Value.Trim() }
    return $Default
}

$apiUrl = Get-EnvValue "VITE_API_URL" ""
if (-not $apiUrl -or $apiUrl -match 'localhost|127\.0\.0\.1') {
    $hostName = Get-EnvValue "CLIENT_HOST" "123.231.10.22"
    $port = Get-EnvValue "BACKEND_PORT" "5126"
    $apiUrl = "http://${hostName}:$port"
}
$apiUrl = $apiUrl.TrimEnd('/')

Write-Host "=== Rebuild browser POS (live API: $apiUrl) ===" -ForegroundColor Cyan

# Ensure VITE_API_URL in .env is the public client IP for the Docker bake
$content = Get-Content ".env" -Raw
if ($content -match '(?m)^VITE_API_URL=') {
    $content = $content -replace '(?m)^VITE_API_URL=.*$', "VITE_API_URL=$apiUrl"
} else {
    $content = $content.TrimEnd() + "`nVITE_API_URL=$apiUrl`n"
}
Set-Content -Path ".env" -Value $content.TrimEnd() -Encoding ASCII -NoNewline
Add-Content -Path ".env" -Value "`n"

$ComposeFiles = @("-f", "docker-compose.yml", "-f", "docker-compose.local-pg.yml")

Write-Host "Building pos image with --no-cache (this may take several minutes)..." -ForegroundColor Yellow
$prev = $ErrorActionPreference
$ErrorActionPreference = "Continue"
& docker compose @ComposeFiles build --no-cache --pull pos 2>&1 | ForEach-Object { Write-Host $_ }
$code = $LASTEXITCODE
$ErrorActionPreference = $prev
if ($code -ne 0) { throw "docker compose build pos failed (exit $code)" }

Write-Host "Recreating pos container..." -ForegroundColor Yellow
$ErrorActionPreference = "Continue"
& docker compose @ComposeFiles up -d --force-recreate pos 2>&1 | ForEach-Object { Write-Host $_ }
$code = $LASTEXITCODE
$ErrorActionPreference = $prev
if ($code -ne 0) { throw "docker compose up pos failed (exit $code)" }

Start-Sleep -Seconds 5

Write-Host ""
Write-Host "Verifying deployed JS has the catalog sync fix..." -ForegroundColor Cyan
try {
    $html = (Invoke-WebRequest "http://127.0.0.1:5174/" -UseBasicParsing -TimeoutSec 15).Content
    if ($html -match 'assets/([^"]+\.js)') {
        $jsName = $Matches[1]
        $js = (Invoke-WebRequest "http://127.0.0.1:5174/assets/$jsName" -UseBasicParsing -TimeoutSec 30).Content
        $hasRaw = $js.Contains('rawCount')
        $hasOld = $js.Contains('empty page')
        Write-Host "  JS bundle: $jsName"
        Write-Host "  has rawCount (new fix): $hasRaw"
        Write-Host "  has empty page (old bug): $hasOld"
        if (-not $hasRaw) {
            Write-Host "WARNING: new fix not found in bundle. Check git pull / build context." -ForegroundColor Red
        } elseif ($hasOld) {
            Write-Host "WARNING: old error string still present; rebuild may have mixed layers." -ForegroundColor Yellow
        } else {
            Write-Host "  Browser POS build looks correct." -ForegroundColor Green
        }
    }
} catch {
    Write-Host "  Could not verify JS: $($_.Exception.Message)" -ForegroundColor Yellow
}

$hostName = Get-EnvValue "CLIENT_HOST" "123.231.10.22"
Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Green
Write-Host "  Open: http://${hostName}:5174"
Write-Host "  Hard-refresh browser (Ctrl+Shift+R) or use Incognito"
Write-Host "  Sign in -> Server URL http://${hostName}:5126"
Write-Host "  POS Diagnostic -> Clear and Re-sync (expect ~360 products)"
Write-Host ""
