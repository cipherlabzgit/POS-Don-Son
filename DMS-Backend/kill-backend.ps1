# Kill all DMS-Backend processes
# Run this script before building if you get "file is locked" errors

Write-Host "Stopping all DMS-Backend processes..." -ForegroundColor Yellow

# Kill DMS-Backend.exe processes
$backendProcesses = Get-Process -Name "DMS-Backend" -ErrorAction SilentlyContinue
if ($backendProcesses) {
    $backendProcesses | ForEach-Object {
        Write-Host "  Killing DMS-Backend.exe (PID: $($_.Id))..." -ForegroundColor Cyan
        Stop-Process -Id $_.Id -Force
    }
    Write-Host "✓ Stopped $($backendProcesses.Count) DMS-Backend process(es)" -ForegroundColor Green
} else {
    Write-Host "  No DMS-Backend.exe processes found" -ForegroundColor Gray
}

# Kill dotnet processes running the backend
$dotnetProcesses = Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*DMS-Backend*" -or $_.Path -like "*DMS-Backend*"
}
if ($dotnetProcesses) {
    $dotnetProcesses | ForEach-Object {
        Write-Host "  Killing dotnet process (PID: $($_.Id))..." -ForegroundColor Cyan
        Stop-Process -Id $_.Id -Force
    }
    Write-Host "✓ Stopped $($dotnetProcesses.Count) dotnet process(es)" -ForegroundColor Green
}

Write-Host "`n✓ All backend processes stopped" -ForegroundColor Green
Write-Host "You can now build or run the backend safely." -ForegroundColor White
