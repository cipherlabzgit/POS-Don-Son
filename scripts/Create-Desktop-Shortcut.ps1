# Creates a Desktop shortcut to Start-DMS.bat
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
function New-Shortcut([string]$BatName, [string]$ShortcutName, [string]$Description) {
    $batPath = Join-Path $Root $BatName
    if (-not (Test-Path $batPath)) {
        throw "$BatName not found at $batPath"
    }
    $shortcutPath = Join-Path $desktop $ShortcutName
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = $batPath
    $shortcut.WorkingDirectory = $Root
    $shortcut.WindowStyle = 1
    $shortcut.Description = $Description
    $shortcut.Save()
    Write-Host "Desktop shortcut created:" -ForegroundColor Green
    Write-Host "  $shortcutPath"
}

$desktop = [Environment]::GetFolderPath("Desktop")

New-Shortcut "Start-DMS.bat" "Don and Sons DMS.lnk" "Start Don and Sons DMS (auto: Docker or local PostgreSQL)"
New-Shortcut "Start-DMS-Local.bat" "Don and Sons DMS (Local).lnk" "Start Don and Sons DMS with local PostgreSQL (no Docker)"
