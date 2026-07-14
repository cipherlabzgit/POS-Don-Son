# ============================================================
# Apply Sidebar Permissions Migration - PowerShell Version
# ============================================================
# This script applies the EF Core migration to add missing
# permissions needed for the sidebar RBAC system
# ============================================================

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Don & Sons DMS - Apply Sidebar Permissions Migration" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will add 18 missing permissions to your database." -ForegroundColor Yellow
Write-Host ""
Write-Host "WARNING: Make sure you have backed up your database first!" -ForegroundColor Red
Write-Host ""
$confirmation = Read-Host "Do you want to continue? (yes/no)"
if ($confirmation -ne "yes") {
    Write-Host "Migration cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Checking .NET SDK..." -ForegroundColor Cyan
try {
    $dotnetVersion = dotnet --version
    Write-Host "✓ .NET SDK version: $dotnetVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ ERROR: .NET SDK not found!" -ForegroundColor Red
    Write-Host "Please install .NET 10 SDK from https://dotnet.microsoft.com/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Checking EF Core tools..." -ForegroundColor Cyan
try {
    $efVersion = dotnet ef --version
    Write-Host "✓ EF Core tools version: $efVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠ WARNING: EF Core tools not installed." -ForegroundColor Yellow
    Write-Host "Installing dotnet-ef globally..." -ForegroundColor Cyan
    dotnet tool install --global dotnet-ef
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ ERROR: Failed to install dotnet-ef tools" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ EF Core tools installed successfully" -ForegroundColor Green
}

Write-Host ""
Write-Host "Navigating to backend directory..." -ForegroundColor Cyan
$backendPath = Join-Path $PSScriptRoot "DMS-Backend"
if (-not (Test-Path $backendPath)) {
    Write-Host "✗ ERROR: DMS-Backend directory not found at: $backendPath" -ForegroundColor Red
    exit 1
}
Set-Location $backendPath
Write-Host "✓ Backend directory: $backendPath" -ForegroundColor Green

Write-Host ""
Write-Host "Building project..." -ForegroundColor Cyan
try {
    dotnet build --configuration Release --no-incremental
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed"
    }
    Write-Host "✓ Build successful" -ForegroundColor Green
} catch {
    Write-Host "✗ ERROR: Build failed! Please fix build errors first." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Applying migration to database..." -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

try {
    dotnet ef database update
    if ($LASTEXITCODE -ne 0) {
        throw "Migration failed"
    }
    
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "✓ Migration applied successfully!" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
    
} catch {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Red
    Write-Host "✗ ERROR: Migration failed!" -ForegroundColor Red
    Write-Host "============================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible causes:" -ForegroundColor Yellow
    Write-Host "- Database connection failed" -ForegroundColor Yellow
    Write-Host "- Connection string not configured" -ForegroundColor Yellow
    Write-Host "- Database server not running" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please check:" -ForegroundColor Cyan
    Write-Host "1. appsettings.json has correct connection string" -ForegroundColor Cyan
    Write-Host "2. PostgreSQL server is running" -ForegroundColor Cyan
    Write-Host "3. Database exists" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "Listing all migrations..." -ForegroundColor Cyan
dotnet ef migrations list

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "SUCCESS! Next steps:" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "1. Restart your backend application" -ForegroundColor Yellow
Write-Host "2. Tell all users to logout and login again" -ForegroundColor Yellow
Write-Host "3. Test sidebar filtering with different user roles" -ForegroundColor Yellow
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "- APPLY_SIDEBAR_PERMISSIONS_MIGRATION.md" -ForegroundColor Cyan
Write-Host "- RBAC_SIDEBAR_IMPLEMENTATION_SUMMARY.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""

# Optional: Try to verify permissions in database
Write-Host "Would you like to verify the new permissions in the database? (yes/no)"
$verify = Read-Host
if ($verify -eq "yes") {
    Write-Host ""
    Write-Host "Attempting to verify permissions..." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Please run this SQL query in your database client:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host @"
SELECT "Code", "Name", "Module" 
FROM "Permissions"
WHERE "Code" IN (
    'administrator:view',
    'dms:view',
    'day-end:view',
    'cashier-balance:view',
    'admin-delivery-plan:view',
    'anytime-recipe:view',
    'dough-generator:view',
    'dms-recipe:export',
    'xlsm-importer:view'
)
ORDER BY "Code";
"@ -ForegroundColor White
    Write-Host ""
    Write-Host "You should see 9 rows returned." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
