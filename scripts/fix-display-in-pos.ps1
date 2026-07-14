# ==========================================================================
# Fix DisplayInPOS for all products in the database
# ==========================================================================

param(
    [string]$PostgresHost = "localhost",
    [int]$PostgresPort = 5432,
    [string]$PostgresUser = "dms_user",
    [string]$PostgresPassword = "10158",
    [string]$PostgresDB = "dms_erp_db"
)

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host " Fixing DisplayInPOS for Products" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# Check if psql is available
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlPath) {
    Write-Host "Error: psql (PostgreSQL client) not found in PATH" -ForegroundColor Red
    Write-Host "Please install PostgreSQL client tools or run the SQL script manually." -ForegroundColor Yellow
    exit 1
}

# Build connection string
$env:PGPASSWORD = $PostgresPassword
$connectionParams = @(
    "-h", $PostgresHost,
    "-p", $PostgresPort,
    "-U", $PostgresUser,
    "-d", $PostgresDB,
    "-f", "fix_display_in_pos_products.sql"
)

Write-Host "Connecting to database: $PostgresDB @ ${PostgresHost}:${PostgresPort}" -ForegroundColor Yellow
Write-Host ""

# Execute the SQL script
try {
    & psql @connectionParams
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Successfully updated DisplayInPOS for all products!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Restart the DMS-Backend if it's running" -ForegroundColor White
        Write-Host "2. In the POS, click 'Refresh cache' from the user menu" -ForegroundColor White
        Write-Host "3. All products should now appear in the POS" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "✗ Error executing SQL script" -ForegroundColor Red
        Write-Host "Please check the error messages above." -ForegroundColor Yellow
    }
} catch {
    Write-Host ""
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    # Clear password from environment
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
