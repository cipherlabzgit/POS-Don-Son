# ================================================
# Fix Manager Permissions - PowerShell Script
# ================================================
# This script:
# 1. Shows current Manager permissions
# 2. Resets Manager to view-only permissions
# 3. Verifies the changes
# ================================================

# Database connection details (from appsettings.Development.json)
$env:PGHOST = "localhost"
$env:PGPORT = "5432"
$env:PGDATABASE = "dms_erp_db"
$env:PGUSER = "postgres"
$env:PGPASSWORD = "10158"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "FIX MANAGER PERMISSIONS" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will:"
Write-Host "  1. Check current Manager role permissions"
Write-Host "  2. Reset Manager to VIEW-ONLY permissions"
Write-Host "  3. Remove CREATE/UPDATE/DELETE permissions"
Write-Host ""
Write-Host "Database: $env:PGDATABASE" -ForegroundColor Yellow
Write-Host "Host: $env:PGHOST`:$env:PGPORT" -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to continue (Ctrl+C to cancel)"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "STEP 1: Checking current Manager permissions..." -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

try {
    & psql -h $env:PGHOST -p $env:PGPORT -d $env:PGDATABASE -U $env:PGUSER -f "CHECK_MANAGER_PERMISSIONS.sql"
    
    if ($LASTEXITCODE -ne 0) {
        throw "psql command failed"
    }
}
catch {
    Write-Host ""
    Write-Host "❌ Error checking permissions!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible issues:" -ForegroundColor Yellow
    Write-Host "  - PostgreSQL is not running" -ForegroundColor Yellow
    Write-Host "  - psql is not in PATH (check ADD_POSTGRESQL_TO_PATH.md)" -ForegroundColor Yellow
    Write-Host "  - Database connection settings are incorrect" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Yellow
Write-Host "Review the permissions above." -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Enter to RESET Manager to VIEW-ONLY..." -ForegroundColor Yellow
Write-Host "(or Ctrl+C to cancel)" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow
Read-Host

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "STEP 2: Resetting Manager to VIEW-ONLY permissions..." -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

try {
    & psql -h $env:PGHOST -p $env:PGPORT -d $env:PGDATABASE -U $env:PGUSER -f "RESET_MANAGER_TO_VIEW_ONLY.sql"
    
    if ($LASTEXITCODE -ne 0) {
        throw "psql command failed"
    }
}
catch {
    Write-Host ""
    Write-Host "❌ Error resetting permissions!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "✓ MANAGER PERMISSIONS RESET SUCCESSFULLY" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT NEXT STEPS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. All Manager users MUST LOG OUT of the application" -ForegroundColor White
Write-Host "  2. All Manager users MUST LOG IN again to get new JWT tokens" -ForegroundColor White
Write-Host "  3. Old JWT tokens still contain the old permissions!" -ForegroundColor Red
Write-Host "  4. Tokens will expire after 15 minutes (default)" -ForegroundColor White
Write-Host ""
Write-Host "If managers can still create/edit/delete:" -ForegroundColor Yellow
Write-Host "  - They are using an old token" -ForegroundColor White
Write-Host "  - Tell them to log out and log in again" -ForegroundColor White
Write-Host "  - Or wait 15 minutes for token to expire" -ForegroundColor White
Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Read-Host "Press Enter to exit"
