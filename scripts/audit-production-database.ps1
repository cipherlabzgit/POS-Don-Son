# Audit dms_erp_db and optionally remove dev/demo seed data.
# Run on CLIENT SERVER from repo root:
#   .\scripts\audit-production-database.ps1
#   .\scripts\audit-production-database.ps1 -RemoveDemo
#   .\scripts\audit-production-database.ps1 -RemoveDemo -DisableDevSeed
#
param(
    [switch]$RemoveDemo,
    [switch]$DisableDevSeed,
    [switch]$NoBackup
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

$pgUser = Get-EnvValue "POSTGRES_USER" "postgres"
$pgPass = Get-EnvValue "POSTGRES_PASSWORD" "postgres"
$pgDb   = Get-EnvValue "POSTGRES_DB" "dms_erp_db"
$pgPort = Get-EnvValue "POSTGRES_PORT" "5432"

$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$pgDump = "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe"
if (-not (Test-Path $psql)) {
    $found = Get-ChildItem "C:\Program Files\PostgreSQL\*\bin\psql.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        $psql = $found.FullName
        $pgDump = Join-Path (Split-Path $found.FullName) "pg_dump.exe"
    } else {
        throw "psql not found. Install PostgreSQL 18."
    }
}

$demoProductCodes = @(
    'BR001','BR002','BR003',
    'PA001','PA002','PA003','PA004','PA005',
    'SV001','SV002','SV003','SV004'
)
$demoCategoryCodes = @('BREAD','PASTRY','SAVOURY')
$demoUserEmails = @('manager@donandson.com','operator@donandson.com')

$auditFile = Join-Path $env:TEMP "dms-db-audit.sql"
@'
\echo === DATABASE SUMMARY ===
SELECT current_database() AS database, current_user AS user;

\echo === PRODUCT TOTALS ===
SELECT COUNT(*) AS total_products FROM products;
SELECT COUNT(*) AS active_pos_products FROM products WHERE "IsActive" = true AND "DisplayInPOS" = true;

\echo === PRODUCTS BY CATEGORY ===
SELECT c.name AS category, c.code AS category_code, COUNT(p."Id") AS product_count
FROM categories c
LEFT JOIN products p ON p."CategoryId" = c."Id"
GROUP BY c."Id", c.name, c.code
ORDER BY product_count DESC, c.name;

\echo === SAMPLE PRODUCTS (first 15 by code) ===
SELECT p.code, p.name, c.name AS category
FROM products p
LEFT JOIN categories c ON c."Id" = p."CategoryId"
ORDER BY p.code
LIMIT 15;

\echo === DEMO BAKERY PRODUCTS (dev seed codes) ===
SELECT code, name FROM products
WHERE code IN ('BR001','BR002','BR003','PA001','PA002','PA003','PA004','PA005','SV001','SV002','SV003','SV004')
ORDER BY code;

\echo === ACTION CATEGORY PRODUCTS (sample) ===
SELECT p.code, p.name FROM products p
JOIN categories c ON c."Id" = p."CategoryId"
WHERE c.name = 'Action' OR c.code = 'Action'
ORDER BY p.code
LIMIT 10;
'@ | Set-Content -Path $auditFile -Encoding ASCII

Write-Host "=== DMS Production Database Audit ===" -ForegroundColor Cyan
Write-Host "Database: $pgDb on localhost:$pgPort (user: $pgUser)" -ForegroundColor DarkGray
Write-Host ""

$env:PGPASSWORD = $pgPass
& $psql -U $pgUser -h 127.0.0.1 -p $pgPort -d $pgDb -f $auditFile
if ($LASTEXITCODE -ne 0) { throw "Audit query failed." }

if ($DisableDevSeed -or $RemoveDemo) {
    if (-not (Test-Path ".env")) { throw ".env not found in $Root" }
    $envPath = Join-Path $Root ".env"
    $content = Get-Content $envPath -Raw
    if ($content -match '(?m)^DEV_SEED_ENABLED=') {
        $content = $content -replace '(?m)^DEV_SEED_ENABLED=.*$', 'DEV_SEED_ENABLED=false'
    } else {
        $content += "`nDEV_SEED_ENABLED=false`n"
    }
    Set-Content -Path $envPath -Value $content.TrimEnd() -Encoding ASCII -NoNewline
    Add-Content -Path $envPath -Value "`n"
    Write-Host "Set DEV_SEED_ENABLED=false in .env" -ForegroundColor Green
}

if ($RemoveDemo) {
    Write-Host ""
    Write-Host "=== Removing demo seed data ===" -ForegroundColor Yellow

    if (-not $NoBackup) {
        $backupDir = Join-Path $Root "backups"
        if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir | Out-Null }
        $backupFile = Join-Path $backupDir ("dms_erp_db_before_demo_cleanup_{0}.backup" -f (Get-Date -Format 'yyyyMMdd-HHmmss'))
        Write-Host "Backup to $backupFile ..." -ForegroundColor Cyan
        & $pgDump -U $pgUser -h 127.0.0.1 -p $pgPort -d $pgDb -F c -f $backupFile
        if ($LASTEXITCODE -ne 0) { throw "Backup failed." }
        Write-Host "Backup OK." -ForegroundColor Green
    }

    $codesSql = ($demoProductCodes | ForEach-Object { "'$_'" }) -join ','
    $catCodesSql = ($demoCategoryCodes | ForEach-Object { "'$_'" }) -join ','
    $emailsSql = ($demoUserEmails | ForEach-Object { "'$_'" }) -join ','

    $cleanupFile = Join-Path $env:TEMP "dms-db-cleanup-demo.sql"
    @"
BEGIN;
DELETE FROM products WHERE code IN ($codesSql);
DELETE FROM categories WHERE code IN ($catCodesSql)
  AND NOT EXISTS (SELECT 1 FROM products p WHERE p."CategoryId" = categories."Id");
DELETE FROM user_roles WHERE "UserId" IN (SELECT "Id" FROM users WHERE email IN ($emailsSql));
DELETE FROM users WHERE email IN ($emailsSql);
COMMIT;
SELECT COUNT(*) AS remaining_products FROM products;
"@ | Set-Content -Path $cleanupFile -Encoding ASCII

    & $psql -U $pgUser -h 127.0.0.1 -p $pgPort -d $pgDb -f $cleanupFile
    if ($LASTEXITCODE -ne 0) { throw "Demo cleanup failed." }

    Write-Host "Demo bakery products and demo users removed (outlets kept)." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next on client server:" -ForegroundColor Yellow
    Write-Host "  .\scripts\deploy-client-local-pg.ps1"
    Write-Host "  .\scripts\fix-pos-catalog.ps1"
    Write-Host "  On POS: log out, log in, Clear & Re-sync"
}

Write-Host ""
Write-Host "Done." -ForegroundColor Green
