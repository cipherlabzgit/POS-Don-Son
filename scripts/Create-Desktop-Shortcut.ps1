# Creates a Desktop shortcut to Start-DMS.bat
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$batPath = Join-Path $Root "Start-DMS.bat"
$desktop = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktop "Don and Sons DMS.lnk"

if (-not (Test-Path $batPath)) {
    throw "Start-DMS.bat not found at $batPath"
}

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $batPath
$shortcut.WorkingDirectory = $Root
$shortcut.WindowStyle = 1
$shortcut.Description = "Start Don and Sons DMS (Docker + POS)"
$shortcut.Save()

Write-Host "Desktop shortcut created:" -ForegroundColor Green
Write-Host "  $shortcutPath"
