@echo off
REM ============================================================
REM Apply Sidebar Permissions Migration
REM ============================================================
REM This script applies the EF Core migration to add missing
REM permissions needed for the sidebar RBAC system
REM ============================================================

echo.
echo ============================================================
echo  Don ^& Sons DMS - Apply Sidebar Permissions Migration
echo ============================================================
echo.
echo This will add 18 missing permissions to your database.
echo.
echo WARNING: Make sure you have backed up your database first!
echo.
pause

echo.
echo Checking .NET SDK...
dotnet --version
if errorlevel 1 (
    echo ERROR: .NET SDK not found!
    echo Please install .NET 10 SDK from https://dotnet.microsoft.com/
    pause
    exit /b 1
)

echo.
echo Checking EF Core tools...
dotnet ef --version
if errorlevel 1 (
    echo WARNING: EF Core tools not installed.
    echo Installing dotnet-ef globally...
    dotnet tool install --global dotnet-ef
    if errorlevel 1 (
        echo ERROR: Failed to install dotnet-ef tools
        pause
        exit /b 1
    )
)

echo.
echo Navigating to backend directory...
cd /d "%~dp0DMS-Backend"
if errorlevel 1 (
    echo ERROR: DMS-Backend directory not found!
    pause
    exit /b 1
)

echo.
echo Building project...
dotnet build --configuration Release --no-incremental
if errorlevel 1 (
    echo ERROR: Build failed! Please fix build errors first.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo Applying migration to database...
echo ============================================================
echo.
dotnet ef database update
if errorlevel 1 (
    echo.
    echo ============================================================
    echo ERROR: Migration failed!
    echo ============================================================
    echo.
    echo Possible causes:
    echo - Database connection failed
    echo - Connection string not configured
    echo - Database server not running
    echo.
    echo Please check:
    echo 1. appsettings.json has correct connection string
    echo 2. PostgreSQL server is running
    echo 3. Database exists
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo Migration applied successfully!
echo ============================================================
echo.
echo Verifying permissions...
echo.

REM Get connection string from appsettings.json (simplified - assumes default)
set PGPASSWORD=postgres
psql -U postgres -d DMS -c "SELECT COUNT(*) as new_permissions FROM \"Permissions\" WHERE \"Code\" IN ('administrator:view', 'dms:view', 'day-end:view', 'cashier-balance:view', 'admin-delivery-plan:view', 'anytime-recipe:view', 'dough-generator:view', 'dms-recipe:export', 'xlsm-importer:view');"

if errorlevel 1 (
    echo.
    echo Note: Could not verify with psql command.
    echo Migration was applied, but manual verification recommended.
    echo.
)

echo.
echo ============================================================
echo SUCCESS! Next steps:
echo ============================================================
echo.
echo 1. Restart your backend application
echo 2. Tell all users to logout and login again
echo 3. Test sidebar filtering with different user roles
echo.
echo Documentation:
echo - APPLY_SIDEBAR_PERMISSIONS_MIGRATION.md
echo - RBAC_SIDEBAR_IMPLEMENTATION_SUMMARY.md
echo.
echo ============================================================

pause
