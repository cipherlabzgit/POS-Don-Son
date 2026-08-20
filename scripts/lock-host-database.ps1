# Lock DMS backend to host PostgreSQL (pgAdmin) so future deploys cannot
# accidentally switch to the Docker postgres demo database.
#
# Run once on the client server (safe to re-run):
#   cd D:\DMS\POS-Don-Son
#   .\scripts\lock-host-database.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

if (-not (Test-Path ".env")) {
    if (Test-Path ".env.client-ready") {
        Copy-Item ".env.client-ready" ".env"
        Write-Host "Created .env from .env.client-ready" -ForegroundColor Green
    } else {
        throw ".env not found. Copy .env.client-ready to .env first."
    }
}

$content = Get-Content ".env" -Raw
$changed = $false

function Set-EnvLine {
    param([string]$Name, [string]$Value)
    $script:changed = $true
    if ($script:content -match "(?m)^$([regex]::Escape($Name))=") {
        $script:content = $script:content -replace "(?m)^$([regex]::Escape($Name))=.*$", "$Name=$Value"
    } else {
        $script:content += "`n$Name=$Value`n"
    }
}

# docker-compose.override.yml already forces host PG; this line documents the lock in .env
if ($content -notmatch '(?m)^COMPOSE_FILE=') {
    Set-EnvLine "COMPOSE_FILE" "docker-compose.yml:docker-compose.override.yml"
}

Set-EnvLine "POSTGRES_DB" "dms_erp_db"
Set-EnvLine "POSTGRES_USER" "postgres"
Set-EnvLine "POSTGRES_PORT" "5432"
Set-EnvLine "DEV_SEED_ENABLED" "false"

if ($changed) {
    Set-Content -Path ".env" -Value $content.TrimEnd() -Encoding ASCII
    Add-Content -Path ".env" -Value "`n"
    Write-Host "Updated .env with host PostgreSQL lock settings." -ForegroundColor Green
} else {
    Write-Host ".env already locked to host PostgreSQL." -ForegroundColor Green
}

Write-Host ""
Write-Host "Host DB target: dms_erp_db @ host.docker.internal:5432 (user: postgres)" -ForegroundColor Cyan
Write-Host "docker-compose.override.yml forces backend -> host PG on every deploy." -ForegroundColor DarkGray
Write-Host ""
Write-Host "Redeploy to apply:" -ForegroundColor Yellow
Write-Host "  docker compose up -d --build backend frontend"
Write-Host ""
Write-Host "Verify:" -ForegroundColor Yellow
Write-Host "  .\scripts\fix-pos-catalog.ps1"
Write-Host ""
