# Fix POS / DMS showing wrong product count (e.g. 12 demo items instead of 360).
# - Compares host PostgreSQL product count vs API totalCount
# - Enables DisplayInPOS on all products/categories
# - Restarts backend (host PG via docker-compose.local-pg.yml)
#
# Run ON the client server:
#   cd D:\DMS\POS-Don-Son
#   .\scripts\fix-pos-catalog.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Get-EnvValue {
    param([string]$Name, [string]$Default = "")
    $line = Select-String -Path ".env" -Pattern "^$Name=(.*)$" | Select-Object -First 1
    if ($line) { return $line.Matches.Groups[1].Value.Trim() }
    return $Default
}

$pgUser = Get-EnvValue "POSTGRES_USER" "postgres"
$pgPass = Get-EnvValue "POSTGRES_PASSWORD" "postgres"
$pgDb   = Get-EnvValue "POSTGRES_DB" "dms_erp_db"
$pgPort = Get-EnvValue "POSTGRES_PORT" "5432"

$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
if (-not (Test-Path $psql)) {
    $found = Get-ChildItem "C:\Program Files\PostgreSQL\*\bin\psql.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) { $psql = $found.FullName } else { throw "psql not found." }
}

$demoCodes = @(
    'BR001','BR002','BR003',
    'PA001','PA002','PA003','PA004','PA005',
    'SV001','SV002','SV003','SV004'
)
$demoCodesSql = ($demoCodes | ForEach-Object { "'$_'" }) -join ','

Write-Host "=== DMS / POS catalog verification ===" -ForegroundColor Cyan
Write-Host "Host PostgreSQL: $pgDb @ 127.0.0.1:$pgPort" -ForegroundColor DarkGray
Write-Host ""

# --- 1) Host DB counts (what pgAdmin should show) ---
$env:PGPASSWORD = $pgPass
$dbTotal = [int](& $psql -U $pgUser -h 127.0.0.1 -p $pgPort -d $pgDb -tAc 'SELECT COUNT(*) FROM products;' 2>&1)
$demoInDb = [int](& $psql -U $pgUser -h 127.0.0.1 -p $pgPort -d $pgDb -tAc "SELECT COUNT(*) FROM products WHERE ""Code"" IN ($demoCodesSql);" 2>&1)

Write-Host "Host DB (pgAdmin) product count: $dbTotal" -ForegroundColor $(if ($dbTotal -gt 50) { "Green" } else { "Yellow" })
if ($demoInDb -gt 0) {
    Write-Host "  Demo seed codes in host DB: $demoInDb (BR001, PA001, etc.)" -ForegroundColor DarkGray
}

$sqlFile = Join-Path $env:TEMP "fix-pos-catalog.sql"
@'
UPDATE products SET "DisplayInPOS" = true WHERE "DisplayInPOS" = false OR "DisplayInPOS" IS NULL;
UPDATE categories SET "DisplayInPOS" = true WHERE "DisplayInPOS" = false OR "DisplayInPOS" IS NULL;
SELECT COUNT(*) AS pos_products FROM products WHERE "DisplayInPOS" = true AND "IsActive" = true;
'@ | Set-Content -Path $sqlFile -Encoding ASCII

Write-Host ""
Write-Host "Fixing DisplayInPOS in host PostgreSQL ..." -ForegroundColor Cyan
& $psql -U $pgUser -h 127.0.0.1 -p $pgPort -d $pgDb -f $sqlFile
if ($LASTEXITCODE -ne 0) { throw "SQL fix failed." }
Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Rebuilding backend (docker-compose.local-pg.yml -> host DB) ..." -ForegroundColor Cyan
$prev = $ErrorActionPreference
$ErrorActionPreference = "Continue"
& docker compose -f docker-compose.yml -f docker-compose.local-pg.yml up -d --build backend 2>&1 | ForEach-Object { Write-Host $_ }
$ErrorActionPreference = $prev

$backendPort = [int](Get-EnvValue "BACKEND_PORT" "5126")
$localApi = "http://127.0.0.1:$backendPort"
Write-Host "Waiting for backend health ($localApi/health) ..." -ForegroundColor Cyan
$healthy = $false
for ($i = 1; $i -le 30; $i++) {
    try {
        $r = Invoke-WebRequest -Uri "$localApi/health" -UseBasicParsing -TimeoutSec 5
        if ($r.StatusCode -eq 200) { $healthy = $true; break }
    } catch { Start-Sleep -Seconds 2 }
}
if ($healthy) {
    Write-Host "Backend is healthy." -ForegroundColor Green
} else {
    Write-Host "Backend not healthy yet - API test may fail." -ForegroundColor Yellow
}

$apiUrl = Get-EnvValue "VITE_API_URL" ""
if (-not $apiUrl) { $apiUrl = Get-EnvValue "NEXT_PUBLIC_API_URL" $localApi }
$apiUrl = $apiUrl.TrimEnd('/')
$testApiUrl = $localApi
$adminEmail = Get-EnvValue "SUPERADMIN_EMAIL" "admin@donandson.com"
$adminPass = Get-EnvValue "SUPERADMIN_PASSWORD" "SuperAdmin@2026!Dev"

Write-Host ""
Write-Host "Testing products API at $testApiUrl ..." -ForegroundColor Cyan
$apiTotal = $null
try {
    $loginBody = @{ email = $adminEmail; password = $adminPass } | ConvertTo-Json
    $login = Invoke-RestMethod -Uri "$testApiUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -TimeoutSec 30
    $token = $login.accessToken
    if (-not $token) { $token = $login.data.accessToken }
    if (-not $token) { throw "Login succeeded but no accessToken returned." }

    $headers = @{ Authorization = "Bearer $token"; Accept = "application/json" }
    $productsUrl = '{0}/api/products?page=1&pageSize=5' -f $testApiUrl
    $resp = Invoke-RestMethod -Uri $productsUrl -Method GET -Headers $headers -TimeoutSec 30

    $payload = $resp.data
    if (-not $payload) { $payload = $resp }
    $rawTotal = $payload.totalCount
    if ($null -eq $rawTotal) { $rawTotal = $payload.TotalCount }
    if ($null -eq $rawTotal) { $rawTotal = 0 }
    $apiTotal = [int]$rawTotal
    $sample = $payload.products[0]
    if (-not $sample) { $sample = $payload.Products[0] }

    Write-Host "  API totalCount: $apiTotal" -ForegroundColor $(if ($apiTotal -gt 50) { "Green" } elseif ($apiTotal -gt 0) { "Yellow" } else { "Red" })
    if ($sample) {
        Write-Host "  Sample from API: $($sample.code) - $($sample.name)" -ForegroundColor Green
    }
} catch {
    Write-Host "  API test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "  Host PostgreSQL (pgAdmin): $dbTotal products"
if ($null -ne $apiTotal) {
    Write-Host "  API (DMS / POS):           $apiTotal products"
}

$mismatch = ($null -ne $apiTotal) -and ($dbTotal -gt 0) -and ($apiTotal -ne $dbTotal)
$looksLikeDemoOnly = ($null -ne $apiTotal) -and ($apiTotal -le 15) -and ($apiTotal -ge 10)

if ($mismatch) {
    Write-Host ""
    Write-Host "MISMATCH: API sees $apiTotal products but host PostgreSQL has $dbTotal." -ForegroundColor Red
    Write-Host "The backend container is NOT using the same database as pgAdmin." -ForegroundColor Red
    Write-Host ""
    Write-Host "Fix:" -ForegroundColor Yellow
    Write-Host "  1. Ensure .env POSTGRES_* matches pgAdmin login" -ForegroundColor White
    Write-Host "  2. Redeploy with host PostgreSQL:" -ForegroundColor White
    Write-Host "     .\scripts\redeploy-dms-local-pg.ps1" -ForegroundColor Cyan
    Write-Host "  3. Re-run this script to verify counts match" -ForegroundColor White
    exit 1
}

if ($looksLikeDemoOnly -and $dbTotal -gt 50) {
    Write-Host ""
    Write-Host ('API still shows ~12 demo products (BR001, PA001, etc.) while host DB has {0}.' -f $dbTotal) -ForegroundColor Red
    Write-Host "Run: .\scripts\redeploy-dms-local-pg.ps1" -ForegroundColor Cyan
    exit 1
}

if ($null -ne $apiTotal -and $apiTotal -gt 50) {
    Write-Host ""
    Write-Host "OK - API and host DB align (~$apiTotal products)." -ForegroundColor Green
    Write-Host ""
    Write-Host "On each POS till:" -ForegroundColor Yellow
    Write-Host "  1. Log out / log in (Server URL: $apiUrl)" -ForegroundColor White
    Write-Host "  2. POS Diagnostic -> Clear and Re-sync" -ForegroundColor White
    Write-Host "  3. Hard refresh DMS Web (Ctrl+Shift+R)" -ForegroundColor White
} elseif ($apiTotal -eq 0) {
    Write-Host ""
    Write-Host "WARNING: API returned 0 products. Check backend logs: docker compose logs backend" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Done." -ForegroundColor Green
