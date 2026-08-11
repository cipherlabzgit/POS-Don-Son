# Rebuild Windows POS installer pointed at the LIVE client server API.
# Run on client server (or any build PC with Node 22+):
#   cd D:\DMS\POS-Don-Son
#   git pull origin main
#   .\scripts\rebuild-pos-live.ps1
#
# Then copy release\*.exe + pos-config.json to each till PC, install, Clear and Re-sync.

param(
    [string]$ApiUrl = ""
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

if (-not $ApiUrl) {
    $ApiUrl = Get-EnvValue "VITE_API_URL" ""
}
if (-not $ApiUrl) {
    $ApiUrl = Get-EnvValue "NEXT_PUBLIC_API_URL" ""
}
if (-not $ApiUrl -or $ApiUrl -match 'localhost|127\.0\.0\.1') {
    $hostName = Get-EnvValue "CLIENT_HOST" "123.231.10.22"
    $port = Get-EnvValue "BACKEND_PORT" "5126"
    $ApiUrl = "http://${hostName}:$port"
}

$ApiUrl = $ApiUrl.TrimEnd('/')
Write-Host "Building POS for LIVE API: $ApiUrl" -ForegroundColor Green

# Force live URL into root .env for this build (build-pos-installer reads VITE_API_URL)
$envPath = Join-Path $Root ".env"
if (-not (Test-Path $envPath)) {
    if (Test-Path ".env.client-ready") {
        Copy-Item ".env.client-ready" ".env"
    } else {
        throw "No .env - copy .env.client-ready first."
    }
}

$originalEnv = Get-Content $envPath -Raw
$prevVite = Get-EnvValue "VITE_API_URL" ""
$content = $originalEnv
if ($content -match '(?m)^VITE_API_URL=') {
    $content = $content -replace '(?m)^VITE_API_URL=.*$', "VITE_API_URL=$ApiUrl"
} else {
    $content = $content.TrimEnd() + "`nVITE_API_URL=$ApiUrl`n"
}
Set-Content -Path $envPath -Value $content.TrimEnd() -Encoding ASCII -NoNewline
Add-Content -Path $envPath -Value "`n"

try {
    & "$Root\scripts\build-pos-installer.ps1" -NoPrompt
    if ($LASTEXITCODE -ne 0) { throw "build-pos-installer failed." }
} finally {
    # Restore previous VITE_API_URL so local .env is not left pointing at production
    if ($prevVite) {
        $restored = (Get-Content $envPath -Raw) -replace '(?m)^VITE_API_URL=.*$', "VITE_API_URL=$prevVite"
        Set-Content -Path $envPath -Value $restored.TrimEnd() -Encoding ASCII -NoNewline
        Add-Content -Path $envPath -Value "`n"
    }
}

$configPath = Join-Path $Root "DMS-POS\release\pos-config.json"
@{ apiBaseUrl = $ApiUrl } | ConvertTo-Json | Set-Content -Path $configPath -Encoding ASCII

Write-Host ""
Write-Host "=== LIVE POS BUILD READY ===" -ForegroundColor Green
Write-Host "  API:      $ApiUrl"
Write-Host "  Installer: DMS-POS\release\Don & Sons POS Setup 2.0.0.exe"
Write-Host "  Config:    $configPath"
Write-Host ""
Write-Host "On each POS PC:" -ForegroundColor Yellow
Write-Host "  1. Copy Setup.exe + pos-config.json"
Write-Host "  2. Install / reinstall"
Write-Host "  3. Confirm Server URL is $ApiUrl"
Write-Host "  4. Log in, wait for ONLINE"
Write-Host "  5. POS Diagnostic -> Clear and Re-sync (expect ~360 products)"
Write-Host ""
