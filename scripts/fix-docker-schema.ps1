# Fix Docker Database Schema
# Run this script on the Docker deployment computer

Write-Host "Fixing database schema..." -ForegroundColor Cyan

# SQL script content
$sql = @"
-- Create product_section_assignments table
CREATE TABLE IF NOT EXISTS product_section_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    production_section_id UUID NOT NULL REFERENCES production_sections(id) ON DELETE CASCADE,
    role VARCHAR(100) NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT uq_product_section UNIQUE (product_id, production_section_id)
);

CREATE INDEX IF NOT EXISTS ix_product_section_assignments_product_id
    ON product_section_assignments (product_id);

CREATE INDEX IF NOT EXISTS ix_product_section_assignments_section_id
    ON product_section_assignments (production_section_id);

-- Also add production_section_id column if missing
DO `$`$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'production_section_id'
    ) THEN
        ALTER TABLE products 
        ADD COLUMN production_section_id uuid NULL;
        
        ALTER TABLE products 
        ADD CONSTRAINT fk_products_production_section_id 
        FOREIGN KEY (production_section_id) 
        REFERENCES production_sections(id)
        ON DELETE SET NULL;
        
        RAISE NOTICE 'Added production_section_id column to products table';
    ELSE
        RAISE NOTICE 'production_section_id column already exists';
    END IF;
END `$`$;
"@

# Execute SQL
Write-Host "Executing SQL in Docker database..." -ForegroundColor Yellow
$sql | docker exec -i dms-postgres psql -U dms_user -d dms_erp_db

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Schema fix applied successfully!" -ForegroundColor Green
    
    Write-Host "`nRestarting backend..." -ForegroundColor Yellow
    docker compose restart backend
    
    Write-Host "`nWaiting for backend to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    Write-Host "`nBackend logs (last 30 lines):" -ForegroundColor Cyan
    docker logs dms-backend --tail 30
    
    Write-Host "`n✓ Fix complete! Try refreshing your browser." -ForegroundColor Green
} else {
    Write-Host "✗ Error applying schema fix. Check error messages above." -ForegroundColor Red
    exit 1
}
