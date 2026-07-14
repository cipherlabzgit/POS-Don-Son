# ==========================================================================
# Diagnostic script to check DisplayInPOS status across the entire system
# ==========================================================================

param(
    [string]$PostgresHost = "localhost",
    [int]$PostgresPort = 5432,
    [string]$PostgresUser = "dms_user",
    [string]$PostgresPassword = "10158",
    [string]$PostgresDB = "dms_erp_db",
    [string]$BackendUrl = "http://localhost:5126"
)

Write-Host ""
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host " DisplayInPOS Diagnostic Tool" -ForegroundColor Cyan
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host ""

# Function to run SQL query
function Invoke-PostgresQuery {
    param([string]$Query)
    
    $env:PGPASSWORD = $PostgresPassword
    $result = & psql -h $PostgresHost -p $PostgresPort -U $PostgresUser -d $PostgresDB -t -A -F "|" -c $Query 2>&1
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    return $result
}

# 1. Check if psql is available
Write-Host "[1/5] Checking PostgreSQL client..." -ForegroundColor Yellow
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlPath) {
    Write-Host "  ✗ psql not found in PATH" -ForegroundColor Red
    Write-Host "  → Install PostgreSQL client tools or run queries manually" -ForegroundColor Yellow
    $canQueryDB = $false
} else {
    Write-Host "  ✓ psql found at: $($psqlPath.Source)" -ForegroundColor Green
    $canQueryDB = $true
}
Write-Host ""

# 2. Check database connection and DisplayInPOS status
if ($canQueryDB) {
    Write-Host "[2/5] Checking database products..." -ForegroundColor Yellow
    try {
        $query = @"
SELECT 
    COUNT(*) AS total,
    COUNT(CASE WHEN \"DisplayInPOS\" = true THEN 1 END) AS visible,
    COUNT(CASE WHEN \"DisplayInPOS\" = false THEN 1 END) AS hidden,
    COUNT(CASE WHEN \"DisplayInPOS\" IS NULL THEN 1 END) AS null_value,
    COUNT(CASE WHEN \"IsActive\" = true THEN 1 END) AS active
FROM \"Products\";
"@
        
        $result = Invoke-PostgresQuery -Query $query
        $fields = $result -split '\|'
        
        if ($fields.Count -ge 5) {
            $total = [int]$fields[0]
            $visible = [int]$fields[1]
            $hidden = [int]$fields[2]
            $null = [int]$fields[3]
            $active = [int]$fields[4]
            
            Write-Host "  Total products: $total" -ForegroundColor White
            Write-Host "  Visible in POS (DisplayInPOS=true): $visible" -ForegroundColor $(if ($visible -eq $total) { "Green" } else { "Yellow" })
            Write-Host "  Hidden from POS (DisplayInPOS=false): $hidden" -ForegroundColor $(if ($hidden -gt 0) { "Red" } else { "Green" })
            Write-Host "  NULL DisplayInPOS: $null" -ForegroundColor $(if ($null -gt 0) { "Red" } else { "Green" })
            Write-Host "  Active products: $active" -ForegroundColor White
            
            if ($hidden -gt 0 -or $null -gt 0) {
                Write-Host ""
                Write-Host "  ⚠ ISSUE DETECTED:" -ForegroundColor Red
                Write-Host "  → Some products have DisplayInPOS=false or NULL" -ForegroundColor Yellow
                Write-Host "  → Run: .\fix-display-in-pos.ps1 to fix this" -ForegroundColor Yellow
            } else {
                Write-Host "  ✓ All products are set to display in POS" -ForegroundColor Green
            }
        }
    } catch {
        Write-Host "  ✗ Error querying database: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "[2/5] Skipping database check (psql not available)" -ForegroundColor Gray
}
Write-Host ""

# 3. Check Backend API
Write-Host "[3/5] Checking Backend API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BackendUrl/health" -Method Get -TimeoutSec 5 -ErrorAction Stop
    Write-Host "  ✓ Backend is running at $BackendUrl" -ForegroundColor Green
    Write-Host "  Status: $($response.StatusCode)" -ForegroundColor White
} catch {
    Write-Host "  ✗ Backend is not accessible at $BackendUrl" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "  → Make sure the backend is running" -ForegroundColor Yellow
}
Write-Host ""

# 4. Check Products API endpoint
Write-Host "[4/5] Checking Products API..." -ForegroundColor Yellow
try {
    $headers = @{
        "Accept" = "application/json"
    }
    
    $apiUrl = "$BackendUrl/api/products?page=1&pageSize=5&activeOnly=true&displayInPosOnly=true"
    $response = Invoke-RestMethod -Uri $apiUrl -Method Get -Headers $headers -TimeoutSec 10 -ErrorAction Stop
    
    if ($response.success -and $response.data.products) {
        $productCount = $response.data.products.Count
        $totalCount = $response.data.totalCount
        
        Write-Host "  ✓ Products API is working" -ForegroundColor Green
        Write-Host "  Total products returned: $productCount (Total in DB: $totalCount)" -ForegroundColor White
        
        if ($totalCount -eq 0) {
            Write-Host ""
            Write-Host "  ⚠ WARNING: No products returned from API" -ForegroundColor Red
            Write-Host "  Possible reasons:" -ForegroundColor Yellow
            Write-Host "  1. All products have DisplayInPOS=false" -ForegroundColor Yellow
            Write-Host "  2. All products are inactive (IsActive=false)" -ForegroundColor Yellow
            Write-Host "  3. Database is empty" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "  → Run: .\fix-display-in-pos.ps1 to fix DisplayInPOS" -ForegroundColor Yellow
        } else {
            Write-Host ""
            Write-Host "  Sample products:" -ForegroundColor White
            foreach ($product in $response.data.products | Select-Object -First 3) {
                Write-Host "    - $($product.code): $($product.name)" -ForegroundColor Cyan
            }
        }
    } else {
        Write-Host "  ✗ API response invalid or empty" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ Products API request failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Yellow
    
    if ($_.Exception.Message -like "*401*" -or $_.Exception.Message -like "*Unauthorized*") {
        Write-Host "  → This is expected (API requires authentication)" -ForegroundColor Yellow
        Write-Host "  → Test from POS application instead" -ForegroundColor Yellow
    }
}
Write-Host ""

# 5. Show recent products from database
if ($canQueryDB) {
    Write-Host "[5/5] Recent products in database..." -ForegroundColor Yellow
    try {
        $query = @"
SELECT \"Code\", \"Name\", \"DisplayInPOS\", \"IsActive\"
FROM \"Products\"
ORDER BY \"CreatedAt\" DESC
LIMIT 10;
"@
        
        $result = Invoke-PostgresQuery -Query $query
        $lines = $result -split "`n" | Where-Object { $_.Trim() -ne "" }
        
        Write-Host "  Last 10 products:" -ForegroundColor White
        foreach ($line in $lines | Select-Object -First 10) {
            $fields = $line -split '\|'
            if ($fields.Count -ge 4) {
                $code = $fields[0]
                $name = $fields[1]
                $displayInPos = $fields[2]
                $isActive = $fields[3]
                
                $posIcon = if ($displayInPos -eq 't') { "✓" } else { "✗" }
                $activeIcon = if ($isActive -eq 't') { "✓" } else { "✗" }
                
                Write-Host "    $posIcon [$code] $name (Active: $activeIcon)" -ForegroundColor White
            }
        }
    } catch {
        Write-Host "  ✗ Error querying recent products: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "[5/5] Skipping recent products check (psql not available)" -ForegroundColor Gray
}
Write-Host ""

# Summary
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host " Diagnostic Summary" -ForegroundColor Cyan
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host ""

if ($canQueryDB -and ($hidden -gt 0 -or $null -gt 0)) {
    Write-Host "⚠ ACTION REQUIRED:" -ForegroundColor Red
    Write-Host ""
    Write-Host "Some products are not visible in POS. To fix this issue:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  1. Run the fix script:" -ForegroundColor White
    Write-Host "     .\fix-display-in-pos.ps1" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  2. Restart the backend (if running)" -ForegroundColor White
    Write-Host ""
    Write-Host "  3. In POS, click 'Refresh cache' from user menu" -ForegroundColor White
    Write-Host ""
} elseif ($canQueryDB -and $visible -eq $total -and $total -gt 0) {
    Write-Host "✓ All products are correctly configured for POS!" -ForegroundColor Green
    Write-Host ""
    Write-Host "If products still don't appear in POS:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  1. Restart the backend" -ForegroundColor White
    Write-Host "  2. In POS, click 'Refresh cache' from user menu" -ForegroundColor White
    Write-Host "  3. Check POS logs for sync errors" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "⚠ Could not fully diagnose the issue" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "  1. PostgreSQL is running and accessible" -ForegroundColor White
    Write-Host "  2. Backend is running and accessible" -ForegroundColor White
    Write-Host "  3. Database connection string is correct" -ForegroundColor White
    Write-Host ""
}

Write-Host "For detailed help, see: DISPLAY_IN_POS_FIX.md" -ForegroundColor Cyan
Write-Host ""
