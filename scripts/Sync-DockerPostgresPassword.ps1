#Requires -Version 5.1
<#
.SYNOPSIS
  Sets the Postgres role password to match POSTGRES_PASSWORD in repo-root .env.

.DESCRIPTION
  When you change POSTGRES_PASSWORD in .env after the database volume already
  exists, the backend gets 28P01 until Postgres and .env agree. This script
  runs ALTER USER via psql inside the postgres container (local Unix socket;
  typically no old password needed).

  Prerequisites: postgres container running (e.g. docker compose up -d postgres).

.EXAMPLE
  .\scripts\Sync-DockerPostgresPassword.ps1
  docker compose up -d
#>
param(
    [string] $RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

$ErrorActionPreference = 'Stop'
Set-Location $RepoRoot

$envFile = Join-Path $RepoRoot '.env'
if (-not (Test-Path $envFile)) {
    throw "Missing .env at $envFile"
}

$vars = @{}
Get-Content $envFile -Encoding UTF8 | ForEach-Object {
    $line = $_.TrimEnd("`r")
    if ($line -match '^\s*#' -or [string]::IsNullOrWhiteSpace($line)) { return }
    $idx = $line.IndexOf('=')
    if ($idx -lt 1) { return }
    $key = $line.Substring(0, $idx).Trim()
    $val = $line.Substring($idx + 1).Trim()
    if (
        ($val.Length -ge 2) -and (
            ($val.StartsWith('"') -and $val.EndsWith('"')) -or
            ($val.StartsWith("'") -and $val.EndsWith("'"))
        )
    ) {
        $val = $val.Substring(1, $val.Length - 2)
    }
    $vars[$key] = $val
}

$user = if ($vars.ContainsKey('POSTGRES_USER') -and $vars['POSTGRES_USER']) { $vars['POSTGRES_USER'] } else { 'dms_user' }
if (-not $vars.ContainsKey('POSTGRES_PASSWORD') -or [string]::IsNullOrEmpty($vars['POSTGRES_PASSWORD'])) {
    throw 'POSTGRES_PASSWORD is missing or empty in .env'
}
$pass = $vars['POSTGRES_PASSWORD']

# Dollar-quoting avoids breaking on quotes or semicolons inside the password.
$delim = 'pw_' + [guid]::NewGuid().ToString('N')
$sql = 'ALTER USER ' + $user + ' WITH PASSWORD $' + $delim + '$' + $pass + '$' + $delim + '$;'

Write-Host "Updating Postgres password for user '$user' to match .env ..."
docker compose exec -T postgres psql -U $user -d postgres -c $sql
if ($LASTEXITCODE -ne 0) {
    throw @'
psql failed. Try:
  docker compose up -d postgres
  docker compose logs postgres --tail 30
'@
}

Write-Host 'Done. Bring the stack up: docker compose up -d'
