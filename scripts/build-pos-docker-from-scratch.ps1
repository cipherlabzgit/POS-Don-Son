# Build browser POS Docker image FROM SCRATCH (no cache) and start it.
#
# Run ON the client server (Docker Desktop / Engine must be running):
#   cd D:\DMS\POS-Don-Son
#   git pull origin main
#   .\scripts\build-pos-docker-from-scratch.ps1
#
# Result:
#   http://123.231.10.22:5174  (browser POS)
#   API used by POS: http://123.231.10.22:5126

param(
    [string]$ApiUrl = ""
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Get-EnvValue([string]$Name, [string]$Default = "") {
    if (-not (Test-Path ".env")) { return $Default }
    $line = Select-String -Path ".env" -Pattern "^$Name=(.*)$" | Select-Object -First 1
    if ($line) { return $line.Matches.Groups[1].Value.Trim() }
    return $Default
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "Docker is not installed. Install Docker Desktop and start it."
}

try { docker info | Out-Null } catch {
    throw "Docker is not running. Start Docker Desktop, then re-run this script."
}

if (-not $ApiUrl) {
    $ApiUrl = Get-EnvValue "VITE_API_URL" ""
}
if (-not $ApiUrl -or $ApiUrl -match 'localhost|127\.0\.0\.1') {
    $hostName = Get-EnvValue "CLIENT_HOST" "123.231.10.22"
    $port = Get-EnvValue "BACKEND_PORT" "5126"
    $ApiUrl = "http://${hostName}:$port"
}
$ApiUrl = $ApiUrl.TrimEnd('/')
$hostName = Get-EnvValue "CLIENT_HOST" "123.231.10.22"

Write-Host ""
Write-Host "=== Build POS Docker FROM SCRATCH ===" -ForegroundColor Green
Write-Host "  API baked into POS: $ApiUrl" -ForegroundColor Cyan
Write-Host "  Browser URL:        http://${hostName}:5174" -ForegroundColor Cyan
Write-Host ""

# Keep VITE_API_URL correct in .env for compose
if (Test-Path ".env") {
    $content = Get-Content ".env" -Raw
    if ($content -match '(?m)^VITE_API_URL=') {
        $content = $content -replace '(?m)^VITE_API_URL=.*$', "VITE_API_URL=$ApiUrl"
    } else {
        $content = $content.TrimEnd() + "`nVITE_API_URL=$ApiUrl`n"
    }
    Set-Content -Path ".env" -Value $content.TrimEnd() -Encoding ASCII -NoNewline
    Add-Content -Path ".env" -Value "`n"
} else {
    "VITE_API_URL=$ApiUrl`nCLIENT_HOST=$hostName`nPOS_PORT=5174`n" | Set-Content ".env" -Encoding ASCII
}

$env:VITE_API_URL = $ApiUrl

# Ensure shared network exists (used by full DMS stack)
$net = docker network ls --format "{{.Name}}" | Where-Object { $_ -eq "dms-network" }
if (-not $net) {
    Write-Host "Creating docker network dms-network ..." -ForegroundColor Yellow
    docker network create dms-network | Out-Null
}

Write-Host "[1/4] Stop and remove old POS container..." -ForegroundColor Yellow
docker rm -f dms-pos 2>$null | Out-Null

Write-Host "[2/4] Remove old POS image..." -ForegroundColor Yellow
docker rmi -f dms-pos:latest 2>$null | Out-Null

Write-Host "[3/4] Build new POS image (no cache)..." -ForegroundColor Yellow
$prev = $ErrorActionPreference
$ErrorActionPreference = "Continue"
& docker compose -f docker-compose.pos.yml build --no-cache --pull 2>&1 | ForEach-Object { Write-Host $_ }
$code = $LASTEXITCODE
$ErrorActionPreference = $prev
if ($code -ne 0) {
    # Fallback: also try full-stack compose files if pos-only fails
    Write-Host "pos-only compose failed; trying full stack compose files..." -ForegroundColor Yellow
    $ErrorActionPreference = "Continue"
    & docker compose -f docker-compose.yml -f docker-compose.local-pg.yml build --no-cache --pull pos 2>&1 | ForEach-Object { Write-Host $_ }
    $code = $LASTEXITCODE
    $ErrorActionPreference = $prev
    if ($code -ne 0) { throw "Docker build failed (exit $code)" }
}

Write-Host "[4/4] Start POS container..." -ForegroundColor Yellow
$ErrorActionPreference = "Continue"
& docker compose -f docker-compose.pos.yml up -d 2>&1 | ForEach-Object { Write-Host $_ }
$code = $LASTEXITCODE
if ($code -ne 0) {
    & docker compose -f docker-compose.yml -f docker-compose.local-pg.yml up -d --force-recreate pos 2>&1 | ForEach-Object { Write-Host $_ }
    $code = $LASTEXITCODE
}
$ErrorActionPreference = $prev
if ($code -ne 0) { throw "Failed to start POS container (exit $code)" }

Start-Sleep -Seconds 6

Write-Host ""
Write-Host "Container status:" -ForegroundColor Cyan
docker ps --filter "name=dms-pos" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

Write-Host ""
Write-Host "Verifying new JS bundle..." -ForegroundColor Cyan
try {
    $html = (Invoke-WebRequest "http://127.0.0.1:5174/" -UseBasicParsing -TimeoutSec 20).Content
    if ($html -match 'assets/([^"]+\.js)') {
        $jsName = $Matches[1]
        $js = (Invoke-WebRequest "http://127.0.0.1:5174/assets/$jsName" -UseBasicParsing -TimeoutSec 60).Content
        Write-Host "  Bundle: $jsName"
        Write-Host "  Contains rawCount (good): $($js.Contains('rawCount'))"
        Write-Host "  Contains empty page (bad): $($js.Contains('empty page'))"
        if ($js.Contains('rawCount') -and -not $js.Contains('empty page')) {
            Write-Host "  POS Docker build looks CORRECT." -ForegroundColor Green
        } else {
            Write-Host "  WARNING: bundle may still be old. Check build logs." -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "  Verify later in browser: http://${hostName}:5174" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== DONE ===" -ForegroundColor Green
Write-Host "  Browser POS: http://${hostName}:5174"
Write-Host "  Server URL in login form: $ApiUrl"
Write-Host "  Then: hard refresh (Ctrl+Shift+R) -> Sign in -> Clear and Re-sync"
Write-Host "  Expect ~360 products from live database."
Write-Host ""
