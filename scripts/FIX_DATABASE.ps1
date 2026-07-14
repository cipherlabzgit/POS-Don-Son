# Fix Database Migration Issues
# This script will drop and recreate the database with all migrations

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Fix Database - Drop and Recreate" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will:" -ForegroundColor Yellow
Write-Host "1. Drop the existing DMS database (if it exists)" -ForegroundColor Yellow
Write-Host "2. Recreate it fresh" -ForegroundColor Yellow
Write-Host "3. Apply all migrations in correct order" -ForegroundColor Yellow
Write-Host "4. Seed initial data" -ForegroundColor Yellow
Write-Host ""
Write-Host "WARNING: This will delete all data in the database!" -ForegroundColor Red
Write-Host ""
$confirmation = Read-Host "Do you want to continue? (yes/no)"

if ($confirmation -ne "yes") {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit 0
}

Set-Location "$PSScriptRoot\DMS-Backend"

Write-Host ""
Write-Host "Step 1: Dropping database..." -ForegroundColor Cyan
dotnet ef database drop --force

if ($LASTEXITCODE -ne 0) {
    Write-Host "Note: Database may not exist or already dropped" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 2: Applying all migrations..." -ForegroundColor Cyan
dotnet ef database update

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Migration failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "1. PostgreSQL is running" -ForegroundColor Yellow
    Write-Host "2. Connection string in appsettings.json is correct" -ForegroundColor Yellow
    Write-Host "3. User has permission to create databases" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "SUCCESS! Database created and migrations applied" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next step: Run the application to seed initial data" -ForegroundColor Cyan
Write-Host "Command: dotnet run" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
