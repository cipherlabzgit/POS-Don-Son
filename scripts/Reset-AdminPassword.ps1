# Reset DMS super admin login to match SUPERADMIN_PASSWORD in .env
# Deletes the existing super admin; backend recreates it on next start.
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Get-EnvValue {
    param([string]$Name, [string]$Default = "")
    $line = Select-String -Path ".env" -Pattern "^$Name=(.*)$" | Select-Object -First 1
    if ($line) { return $line.Matches.Groups[1].Value.Trim() }
    return $Default
}

if (-not (Test-Path ".env")) {
    throw ".env not found. Create it from .env.client-ready first."
}

$pgUser = Get-EnvValue "POSTGRES_USER" "postgres"
$pgPass = Get-EnvValue "POSTGRES_PASSWORD" "postgres"
$pgDb   = Get-EnvValue "POSTGRES_DB" "dms_erp_db"
$pgPort = Get-EnvValue "POSTGRES_PORT" "5432"
$adminEmail = Get-EnvValue "SUPERADMIN_EMAIL" "admin@donandson.com"
$adminPass  = Get-EnvValue "SUPERADMIN_PASSWORD" ""

if ([string]::IsNullOrWhiteSpace($adminPass)) {
    throw "SUPERADMIN_PASSWORD is empty in .env"
}

$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
if (-not (Test-Path $psql)) {
    $found = Get-ChildItem "C:\Program Files\PostgreSQL\*\bin\psql.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) { $psql = $found.FullName } else { throw "psql not found." }
}

Write-Host "Current admin user(s):" -ForegroundColor Cyan
$env:PGPASSWORD = $pgPass
& $psql -U $pgUser -h 127.0.0.1 -p $pgPort -d $pgDb -c "SELECT ""Email"", ""IsSuperAdmin"", ""IsActive"" FROM users WHERE ""IsSuperAdmin"" = true OR LOWER(""Email"") = LOWER('$adminEmail');"

Write-Host ""
Write-Host "Deleting super admin so backend can recreate with .env password ..." -ForegroundColor Yellow

$sql = "DELETE FROM users WHERE ""IsSuperAdmin"" = true OR LOWER(""Email"") = LOWER('$adminEmail');"

& $psql -U $pgUser -h 127.0.0.1 -p $pgPort -d $pgDb -c $sql
if ($LASTEXITCODE -ne 0) {
    throw "Failed to delete admin user. Check psql output above."
}

Write-Host "Restarting backend container ..." -ForegroundColor Cyan
$prev = $ErrorActionPreference
$ErrorActionPreference = "Continue"
& docker compose -f docker-compose.yml -f docker-compose.local-pg.yml restart backend 2>&1 | ForEach-Object { Write-Host $_ }
$ErrorActionPreference = $prev

Write-Host "Waiting for backend ..." -ForegroundColor Cyan
$backendPort = Get-EnvValue "BACKEND_PORT" "5126"
$healthy = $false
for ($i = 1; $i -le 24; $i++) {
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:$backendPort/health" -UseBasicParsing -TimeoutSec 5
        if ($r.StatusCode -eq 200) { $healthy = $true; break }
    } catch { Start-Sleep -Seconds 5 }
}

if (-not $healthy) {
    Write-Host "Backend not healthy yet. Check: docker compose -f docker-compose.yml -f docker-compose.local-pg.yml logs backend --tail 30" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Admin login reset complete." -ForegroundColor Green
Write-Host "  Email:    $adminEmail"
Write-Host "  Password: (value of SUPERADMIN_PASSWORD in .env)"
Write-Host ""
& $psql -U $pgUser -h 127.0.0.1 -p $pgPort -d $pgDb -c "SELECT ""Email"", ""IsSuperAdmin"", ""IsActive"" FROM users WHERE ""IsSuperAdmin"" = true;"
