# Fresh Start - Clean Database Setup with Sidebar Permissions
# This script completely resets your database and migrations

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Don & Sons DMS - Fresh Start Setup" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will:" -ForegroundColor Yellow
Write-Host "1. Delete all existing migrations" -ForegroundColor Yellow
Write-Host "2. Drop the database" -ForegroundColor Yellow
Write-Host "3. Create fresh migrations" -ForegroundColor Yellow
Write-Host "4. Apply migrations" -ForegroundColor Yellow
Write-Host "5. Seed all data including sidebar permissions" -ForegroundColor Yellow
Write-Host ""
Write-Host "WARNING: This will DELETE ALL DATA!" -ForegroundColor Red
Write-Host ""
$confirmation = Read-Host "Type 'YES' in capital letters to continue"

if ($confirmation -ne "YES") {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit 0
}

$ErrorActionPreference = "Stop"
Set-Location "$PSScriptRoot\DMS-Backend"

Write-Host ""
Write-Host "Step 1: Cleaning build artifacts..." -ForegroundColor Cyan
dotnet clean
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Clean failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Clean successful" -ForegroundColor Green

Write-Host ""
Write-Host "Step 2: Deleting old migrations..." -ForegroundColor Cyan
if (Test-Path "Migrations") {
    Remove-Item -Recurse -Force "Migrations"
    Write-Host "✓ Old migrations deleted" -ForegroundColor Green
} else {
    Write-Host "✓ No old migrations to delete" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 3: Dropping existing database..." -ForegroundColor Cyan
dotnet ef database drop --force
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠ Database drop failed (may not exist)" -ForegroundColor Yellow
} else {
    Write-Host "✓ Database dropped" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 4: Creating fresh migration..." -ForegroundColor Cyan
dotnet ef migrations add InitialCreate_Complete
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Migration creation failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check for build errors:" -ForegroundColor Yellow
    Write-Host "  dotnet build" -ForegroundColor White
    exit 1
}
Write-Host "✓ Fresh migration created" -ForegroundColor Green

Write-Host ""
Write-Host "Step 5: Applying migrations..." -ForegroundColor Cyan
dotnet ef database update
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Migration application failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "1. PostgreSQL is running" -ForegroundColor Yellow
    Write-Host "2. Connection string in appsettings.json is correct" -ForegroundColor Yellow
    Write-Host "3. You have permission to create databases" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Migrations applied successfully" -ForegroundColor Green

Write-Host ""
Write-Host "Step 6: Running application to seed data..." -ForegroundColor Cyan
Write-Host "(This will seed permissions, roles, and create SuperAdmin user)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Starting application..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C when you see 'DMS Backend API started successfully'" -ForegroundColor Yellow
Write-Host ""

# Run the application - it will seed data on startup
dotnet run

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host " ✓ Setup Complete!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Login as SuperAdmin" -ForegroundColor White
Write-Host "   Email: superadmin@dms.com" -ForegroundColor White
Write-Host "   Password: (check your seeder)" -ForegroundColor White
Write-Host ""
Write-Host "2. Verify sidebar shows all items" -ForegroundColor White
Write-Host ""
Write-Host "3. Check new permissions exist:" -ForegroundColor White
Write-Host "   - administrator:view" -ForegroundColor White
Write-Host "   - dms:view" -ForegroundColor White
Write-Host "   - day-end:view" -ForegroundColor White
Write-Host "   - cashier-balance:view" -ForegroundColor White
Write-Host "   - And 14 more..." -ForegroundColor White
Write-Host ""
Write-Host "4. Create test user with limited permissions" -ForegroundColor White
Write-Host "5. Verify sidebar filters correctly" -ForegroundColor White
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
