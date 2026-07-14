# ==============================================================================
# DMS Database Fix - PowerShell Helper Script
# ==============================================================================
# Purpose: Automate the database fix process for "column status does not exist"
# Usage: Run this script from PowerShell in the project root directory
# ==============================================================================

Write-Host "=============================================================================="  -ForegroundColor Cyan
Write-Host "  DMS Database Migration Fix Script"  -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

# Load environment variables from .env file
$envFile = ".\.env"
if (Test-Path $envFile) {
    Write-Host "Loading database credentials from .env..." -ForegroundColor Yellow
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*)\s*=\s*(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            Set-Variable -Name $name -Value $value -Scope Script
        }
    }
    Write-Host "✓ Credentials loaded" -ForegroundColor Green
} else {
    Write-Host "⚠ Warning: .env file not found, using defaults" -ForegroundColor Yellow
}

# Database connection parameters
$dbHost = if ($POSTGRES_HOST) { $POSTGRES_HOST } else { "localhost" }
$dbPort = if ($POSTGRES_PORT) { $POSTGRES_PORT } else { "5432" }
$dbName = if ($POSTGRES_DB) { $POSTGRES_DB } else { "dms_erp_db" }
$dbUser = if ($POSTGRES_USER) { $POSTGRES_USER } else { "postgres" }
$dbPassword = if ($POSTGRES_PASSWORD) { $POSTGRES_PASSWORD } else { "" }

Write-Host ""
Write-Host "Database Connection Details:" -ForegroundColor Cyan
Write-Host "  Host:     $dbHost" -ForegroundColor White
Write-Host "  Port:     $dbPort" -ForegroundColor White
Write-Host "  Database: $dbName" -ForegroundColor White
Write-Host "  User:     $dbUser" -ForegroundColor White
Write-Host ""

# Check if psql is available
$psqlAvailable = $false
try {
    $null = Get-Command psql -ErrorAction Stop
    $psqlAvailable = $true
    Write-Host "✓ PostgreSQL client (psql) found" -ForegroundColor Green
} catch {
    Write-Host "⚠ PostgreSQL client (psql) not found in PATH" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Choose an option:" -ForegroundColor Cyan
Write-Host "  1. Apply database fix using SQL script (Recommended)" -ForegroundColor White
Write-Host "  2. Drop and recreate database (⚠ DELETES ALL DATA!)" -ForegroundColor Red
Write-Host "  3. Show manual SQL commands" -ForegroundColor White
Write-Host "  4. Exit" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Applying database fix..." -ForegroundColor Yellow
        
        if (-not $psqlAvailable) {
            Write-Host "✗ Error: psql not available. Please install PostgreSQL client tools." -ForegroundColor Red
            Write-Host ""
            Write-Host "To install psql:" -ForegroundColor Cyan
            Write-Host "  1. Download PostgreSQL from https://www.postgresql.org/download/" -ForegroundColor White
            Write-Host "  2. Or use the SQL script manually (see option 3)" -ForegroundColor White
            exit 1
        }
        
        $sqlFile = ".\fix_status_columns.sql"
        if (-not (Test-Path $sqlFile)) {
            Write-Host "✗ Error: SQL fix script not found: $sqlFile" -ForegroundColor Red
            exit 1
        }
        
        # Set password environment variable for psql
        $env:PGPASSWORD = $dbPassword
        
        # Run the SQL script
        Write-Host "Executing SQL fix script..." -ForegroundColor Yellow
        & psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -f $sqlFile
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✓ Database fix applied successfully!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Next steps:" -ForegroundColor Cyan
            Write-Host "  1. Run your DMS Backend: dotnet run --project DMS-Backend" -ForegroundColor White
            Write-Host "  2. Check that migrations complete without errors" -ForegroundColor White
        } else {
            Write-Host ""
            Write-Host "✗ Error: SQL script execution failed" -ForegroundColor Red
            Write-Host "Please check the error messages above and try manual option (3)" -ForegroundColor Yellow
        }
        
        # Clear password
        Remove-Item env:PGPASSWORD
    }
    
    "2" {
        Write-Host ""
        Write-Host "⚠⚠⚠ WARNING ⚠⚠⚠" -ForegroundColor Red
        Write-Host "This will DELETE ALL DATA in database: $dbName" -ForegroundColor Red
        Write-Host ""
        $confirm = Read-Host "Type 'DELETE ALL DATA' to confirm"
        
        if ($confirm -eq "DELETE ALL DATA") {
            Write-Host ""
            Write-Host "Dropping and recreating database..." -ForegroundColor Yellow
            
            if (-not $psqlAvailable) {
                Write-Host "✗ Error: psql not available" -ForegroundColor Red
                exit 1
            }
            
            # Set password environment variable
            $env:PGPASSWORD = $dbPassword
            
            # Drop and recreate database
            $dropSql = "DROP DATABASE IF EXISTS $dbName; CREATE DATABASE $dbName;"
            Write-Host $dropSql | psql -h $dbHost -p $dbPort -U $dbUser -d postgres
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-Host "✓ Database recreated successfully!" -ForegroundColor Green
                Write-Host ""
                Write-Host "Next steps:" -ForegroundColor Cyan
                Write-Host "  1. Run your DMS Backend: dotnet run --project DMS-Backend" -ForegroundColor White
                Write-Host "  2. All migrations will be applied to the fresh database" -ForegroundColor White
            } else {
                Write-Host ""
                Write-Host "✗ Error: Database recreation failed" -ForegroundColor Red
            }
            
            # Clear password
            Remove-Item env:PGPASSWORD
        } else {
            Write-Host "Operation cancelled." -ForegroundColor Yellow
        }
    }
    
    "3" {
        Write-Host ""
        Write-Host "Manual SQL Commands:" -ForegroundColor Cyan
        Write-Host "====================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "1. Connect to your database:" -ForegroundColor Yellow
        Write-Host "   psql -h $dbHost -p $dbPort -U $dbUser -d $dbName" -ForegroundColor White
        Write-Host ""
        Write-Host "2. Run the fix SQL script:" -ForegroundColor Yellow
        Write-Host "   \i fix_status_columns.sql" -ForegroundColor White
        Write-Host ""
        Write-Host "Or execute the script from command line:" -ForegroundColor Yellow
        Write-Host "   psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -f fix_status_columns.sql" -ForegroundColor White
        Write-Host ""
        Write-Host "For database reset (⚠ DELETES ALL DATA):" -ForegroundColor Yellow
        Write-Host "   psql -h $dbHost -p $dbPort -U $dbUser -d postgres" -ForegroundColor White
        Write-Host "   DROP DATABASE IF EXISTS $dbName;" -ForegroundColor White
        Write-Host "   CREATE DATABASE $dbName;" -ForegroundColor White
        Write-Host ""
    }
    
    "4" {
        Write-Host "Exiting..." -ForegroundColor Yellow
        exit 0
    }
    
    default {
        Write-Host "Invalid choice. Exiting..." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "=============================================================================="  -ForegroundColor Cyan
Write-Host "For more information, see MIGRATION_FIX_GUIDE.md"  -ForegroundColor Cyan
Write-Host "=============================================================================="  -ForegroundColor Cyan
