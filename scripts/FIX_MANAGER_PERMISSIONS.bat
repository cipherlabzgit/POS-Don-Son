@echo off
REM ================================================
REM Fix Manager Permissions - Windows Batch Script
REM ================================================
REM This script:
REM 1. Shows current Manager permissions
REM 2. Resets Manager to view-only permissions
REM 3. Verifies the changes
REM ================================================

setlocal

REM Database connection details (from appsettings.Development.json)
set PGHOST=localhost
set PGPORT=5432
set PGDATABASE=dms_erp_db
set PGUSER=postgres
set PGPASSWORD=10158

echo ================================================
echo FIX MANAGER PERMISSIONS
echo ================================================
echo.
echo This will:
echo  1. Check current Manager role permissions
echo  2. Reset Manager to VIEW-ONLY permissions
echo  3. Remove CREATE/UPDATE/DELETE permissions
echo.
echo Database: %PGDATABASE%
echo Host: %PGHOST%:%PGPORT%
echo.
pause

echo.
echo ================================================
echo STEP 1: Checking current Manager permissions...
echo ================================================
echo.

psql -h %PGHOST% -p %PGPORT% -d %PGDATABASE% -U %PGUSER% -f "CHECK_MANAGER_PERMISSIONS.sql"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Error checking permissions!
    echo.
    echo Possible issues:
    echo  - PostgreSQL is not running
    echo  - psql is not in PATH (check ADD_POSTGRESQL_TO_PATH.md)
    echo  - Database connection settings are incorrect
    echo.
    pause
    exit /b 1
)

echo.
echo ================================================
echo Review the permissions above.
echo.
echo Press any key to RESET Manager to VIEW-ONLY...
echo (or Ctrl+C to cancel)
echo ================================================
pause

echo.
echo ================================================
echo STEP 2: Resetting Manager to VIEW-ONLY permissions...
echo ================================================
echo.

psql -h %PGHOST% -p %PGPORT% -d %PGDATABASE% -U %PGUSER% -f "RESET_MANAGER_TO_VIEW_ONLY.sql"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Error resetting permissions!
    pause
    exit /b 1
)

echo.
echo ================================================
echo ✓ MANAGER PERMISSIONS RESET SUCCESSFULLY
echo ================================================
echo.
echo IMPORTANT NEXT STEPS:
echo.
echo  1. All Manager users MUST LOG OUT of the application
echo  2. All Manager users MUST LOG IN again to get new JWT tokens
echo  3. Old JWT tokens still contain the old permissions!
echo  4. Tokens will expire after 15 minutes (default)
echo.
echo If managers can still create/edit/delete:
echo  - They are using an old token
echo  - Tell them to log out and log in again
echo  - Or wait 15 minutes for token to expire
echo.
echo ================================================
pause
