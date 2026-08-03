# Resets local postgres password to project dev default and creates dms_erp_db.
# Requires Administrator (modifies pg_hba.conf and restarts PostgreSQL service).
#Requires -RunAsAdministrator
param(
    [string]$NewPassword = "10158",
    [int]$Port = 5432,
    [string]$Database = "dms_erp_db",
    [string]$User = "postgres"
)

$ErrorActionPreference = "Stop"

$psql = Get-ChildItem "C:\Program Files\PostgreSQL\*\bin\psql.exe" -ErrorAction SilentlyContinue |
    Sort-Object { [int]($_.Directory.Parent.Name) } -Descending |
    Select-Object -First 1

if (-not $psql) { throw "PostgreSQL psql.exe not found." }
$psql = $psql.FullName
$pgVersion = Split-Path (Split-Path $psql -Parent) -Parent | Split-Path -Leaf
$dataDir = "C:\Program Files\PostgreSQL\$pgVersion\data"
$pgHba = Join-Path $dataDir "pg_hba.conf"
$serviceName = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Name
if (-not $serviceName) { throw "PostgreSQL Windows service not found." }

Write-Host "Using PostgreSQL $pgVersion, service: $serviceName" -ForegroundColor Cyan

$backup = "$pgHba.bak-dms-$(Get-Date -Format 'yyyyMMddHHmmss')"
Copy-Item $pgHba $backup -Force
Write-Host "Backed up pg_hba.conf to $backup" -ForegroundColor Yellow

$content = Get-Content $pgHba -Raw
$trustContent = $content -replace 'scram-sha-256', 'trust'
Set-Content $pgHba $trustContent -NoNewline

try {
    Restart-Service $serviceName -Force
    Start-Sleep -Seconds 3

    & $psql -U $User -h localhost -p $Port -d postgres -c "ALTER USER $User WITH PASSWORD '$NewPassword';"
    if ($LASTEXITCODE -ne 0) { throw "Failed to set postgres password." }

    $dbExists = & $psql -U $User -h localhost -p $Port -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$Database';"
    if ($dbExists.Trim() -ne "1") {
        & $psql -U $User -h localhost -p $Port -d postgres -c "CREATE DATABASE $Database;"
        Write-Host "Created database '$Database'." -ForegroundColor Green
    } else {
        Write-Host "Database '$Database' already exists." -ForegroundColor Yellow
    }
}
finally {
    Copy-Item $backup $pgHba -Force
    Restart-Service $serviceName -Force
    Write-Host "Restored pg_hba.conf and restarted PostgreSQL." -ForegroundColor Yellow
}

$appsettingsPath = Join-Path $PSScriptRoot "..\DMS-Backend\appsettings.Development.json"
$json = Get-Content $appsettingsPath -Raw | ConvertFrom-Json
$json.ConnectionStrings.DefaultConnection = "Host=localhost;Port=$Port;Database=$Database;Username=$User;Password=$NewPassword"
$json | ConvertTo-Json -Depth 10 | Set-Content $appsettingsPath -Encoding utf8

Write-Host "Password set to '$NewPassword' and appsettings updated." -ForegroundColor Green
