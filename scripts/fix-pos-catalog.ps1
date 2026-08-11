# Fix POS showing 0 products on client server.
# - Enables DisplayInPOS on all products/categories
# - Restarts backend so seeder applies POS role permissions
# - Rebuild instructions for POS desktop app
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

$sqlFile = Join-Path $env:TEMP "fix-pos-catalog.sql"
@'
UPDATE products SET "DisplayInPOS" = true WHERE "DisplayInPOS" = false OR "DisplayInPOS" IS NULL;
UPDATE categories SET "DisplayInPOS" = true WHERE "DisplayInPOS" = false OR "DisplayInPOS" IS NULL;
SELECT COUNT(*) AS pos_products FROM products WHERE "DisplayInPOS" = true AND "IsActive" = true;
'@ | Set-Content -Path $sqlFile -Encoding ASCII

Write-Host "Fixing DisplayInPOS in local PostgreSQL..." -ForegroundColor Cyan
$env:PGPASSWORD = $pgPass
& $psql -U $pgUser -h 127.0.0.1 -p $pgPort -d $pgDb -f $sqlFile
if ($LASTEXITCODE -ne 0) { throw "SQL fix failed." }

Write-Host "Rebuilding and restarting backend (applies POS permission fixes)..." -ForegroundColor Cyan
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
    Write-Host 'Backend not healthy yet. API test may fail - check docker compose logs backend' -ForegroundColor Yellow
}

$apiUrl = Get-EnvValue "VITE_API_URL" ""
if (-not $apiUrl) { $apiUrl = Get-EnvValue "NEXT_PUBLIC_API_URL" $localApi }
$apiUrl = $apiUrl.TrimEnd('/')
$adminEmail = Get-EnvValue "SUPERADMIN_EMAIL" "admin@donandson.com"
$adminPass = Get-EnvValue "SUPERADMIN_PASSWORD" "SuperAdmin@2026!Dev"

Write-Host ""
Write-Host "Testing POS products API at $apiUrl ..." -ForegroundColor Cyan
try {
    $loginBody = @{ email = $adminEmail; password = $adminPass } | ConvertTo-Json
    $login = Invoke-RestMethod -Uri "$apiUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -TimeoutSec 30
    $token = $login.accessToken
    if (-not $token) { throw "Login succeeded but no accessToken returned." }

    $headers = @{ Authorization = "Bearer $token"; Accept = "application/json" }
    $productsUrl = '{0}/api/products?page=1&pageSize=5&activeOnly=true&displayInPosOnly=true' -f $apiUrl
    $resp = Invoke-RestMethod -Uri $productsUrl -Method GET -Headers $headers -TimeoutSec 30

    $total = $resp.data.totalCount
    if ($null -eq $total) { $total = $resp.data.TotalCount }
    $count = 0
    if ($resp.data.products) { $count = @($resp.data.products).Count }
    elseif ($resp.data.Products) { $count = @($resp.data.Products).Count }

    Write-Host "  API totalCount (displayInPosOnly): $total" -ForegroundColor $(if ($total -gt 0) { "Green" } else { "Red" })
    if ($total -gt 0 -and $count -gt 0) {
        $sample = $resp.data.products[0]
        if (-not $sample) { $sample = $resp.data.Products[0] }
        Write-Host "  Sample: $($sample.code) - $($sample.name)" -ForegroundColor Green
    }
    if ($total -eq 0) {
        Write-Host "  WARNING: API returned 0 products. Check DB seed data and DisplayInPOS." -ForegroundColor Red
    }
} catch {
    Write-Host "  API test failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host '  Ensure backend is healthy: docker compose ps' -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Done." -ForegroundColor Green
Write-Host '1. In POS: log OUT then log IN again (fresh token with POS permissions)' -ForegroundColor Yellow
Write-Host '2. Open POS Diagnostic -> Clear and Re-sync' -ForegroundColor Yellow
Write-Host '3. If still empty, rebuild POS: scripts\build-pos-installer.ps1 -NoPrompt' -ForegroundColor Yellow
