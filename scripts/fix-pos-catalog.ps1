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

Write-Host ""
Write-Host "Done." -ForegroundColor Green
Write-Host "1. Open POS -> user menu -> Refresh cache" -ForegroundColor Yellow
Write-Host "2. Or close and reopen POS" -ForegroundColor Yellow
Write-Host "3. Login as admin@donandson.com or operator@donandson.com" -ForegroundColor Yellow
Write-Host "4. If still empty, rebuild POS installer: .\scripts\build-pos-installer.ps1 -NoPrompt" -ForegroundColor Yellow
