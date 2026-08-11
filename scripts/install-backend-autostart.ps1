# Register DMS backend to start automatically on Windows boot (no Docker).
# Uses a Scheduled Task that runs dotnet against the published/development backend.
#
# Usage (run as Administrator for best results):
#   .\scripts\install-backend-autostart.ps1
#   .\scripts\install-backend-autostart.ps1 -Remove

param(
    [switch]$Remove,
    [int]$BackendPort = 5126
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$BackendDir = Join-Path $Root "DMS-Backend"
$TaskName = "DonAndSons-DMS-Backend"

function Read-EnvValue([string]$Name, [string]$Default) {
    $envFile = Join-Path $Root ".env"
    if (-not (Test-Path $envFile)) { return $Default }
    $line = Get-Content $envFile | Where-Object { $_ -match "^\s*$([regex]::Escape($Name))=" } | Select-Object -First 1
    if (-not $line) { return $Default }
    $value = ($line -split "=", 2)[1].Trim()
    if ([string]::IsNullOrWhiteSpace($value)) { return $Default }
    return $value
}

if ($Remove) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host "Removed scheduled task: $TaskName" -ForegroundColor Green
    exit 0
}

if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) {
    throw ".NET SDK not found. Install .NET 10 SDK."
}

if (-not (Test-Path $BackendDir)) {
    throw "DMS-Backend not found at $BackendDir"
}

# Ensure PostgreSQL Windows service is running (backend depends on it).
$pgSvc = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue |
    Where-Object { $_.Status -eq "Running" } |
    Select-Object -First 1
if (-not $pgSvc) {
    Write-Host "Starting PostgreSQL service..." -ForegroundColor Yellow
    foreach ($s in (Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue)) {
        try {
            if ($s.Status -ne "Running") { Start-Service $s.Name }
        } catch {
            Write-Host "  Could not start $($s.Name): $_" -ForegroundColor Yellow
        }
    }
}

$BackendPort = [int](Read-EnvValue "BACKEND_PORT" "$BackendPort")
$apiUrl = "http://127.0.0.1:$BackendPort"

$dotnet = (Get-Command dotnet).Source
$action = New-ScheduledTaskAction `
    -Execute $dotnet `
    -Argument "run --project `"$BackendDir`" --urls $apiUrl" `
    -WorkingDirectory $BackendDir

$trigger = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1)

$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Principal $principal `
    -Description "Don and Sons DMS API backend ($apiUrl)" `
    -Force

Write-Host "Scheduled task installed: $TaskName" -ForegroundColor Green
Write-Host "  Starts on boot: $apiUrl" -ForegroundColor Cyan
Write-Host "  Remove with: .\scripts\install-backend-autostart.ps1 -Remove" -ForegroundColor DarkGray
