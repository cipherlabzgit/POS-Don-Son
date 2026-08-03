# Creates the DMS database and syncs the postgres password into appsettings.Development.json
param(
    [string]$PostgresPassword,
    [int]$Port = 5432,
    [string]$Database = "dms_erp_db",
    [string]$User = "postgres"
)

$ErrorActionPreference = "Stop"
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

if (-not (Test-Path $psql)) {
    $found = Get-ChildItem "C:\Program Files\PostgreSQL\*\bin\psql.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) { $psql = $found.FullName } else { throw "psql not found. Install PostgreSQL or add its bin folder to PATH." }
}

if (-not $PostgresPassword) {
    $secure = Read-Host "Enter your local PostgreSQL password for user '$User'" -AsSecureString
    $PostgresPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    )
}

$env:PGPASSWORD = $PostgresPassword
& $psql -U $User -h localhost -p $Port -d postgres -c "SELECT 1;" | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Could not connect to PostgreSQL. Check password, port ($Port), and that the service is running." }

$dbExists = & $psql -U $User -h localhost -p $Port -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$Database';"
if ($dbExists -ne "1") {
    & $psql -U $User -h localhost -p $Port -d postgres -c "CREATE DATABASE $Database;"
    Write-Host "Created database '$Database'." -ForegroundColor Green
} else {
    Write-Host "Database '$Database' already exists." -ForegroundColor Yellow
}

$appsettingsPath = Join-Path $PSScriptRoot "..\DMS-Backend\appsettings.Development.json"
$json = Get-Content $appsettingsPath -Raw | ConvertFrom-Json
$json.ConnectionStrings.DefaultConnection = "Host=localhost;Port=$Port;Database=$Database;Username=$User;Password=$PostgresPassword"
$json | ConvertTo-Json -Depth 10 | Set-Content $appsettingsPath -Encoding utf8

Write-Host "Updated $appsettingsPath" -ForegroundColor Green
Write-Host "Next: cd DMS-Backend; dotnet run" -ForegroundColor Cyan
