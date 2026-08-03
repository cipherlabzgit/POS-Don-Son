# DisplayInPOS Issue - Diagnostic & Fix Guide

## Problem
Products uploaded via CSV with `DisplayInPOS=true` are not appearing in the POS system.

## Root Cause Analysis

After deep investigation, I found that:

1. **POS is correctly configured** - The POS client requests products with `displayInPosOnly: true` filter (see `DMS-POS/src/lib/api.ts:71`)
2. **Backend filter is correct** - The backend correctly filters by `DisplayInPOS == true` (see `DMS-Backend/Services/Implementations/ProductService.cs:54-56`)
3. **CSV upload correctly sets the field** - The CSV mapper sets `displayInPOS: parseBool(row, 'displayInPOS', true)` (see `DMS-Frontend/src/app/(dashboard)/inventory/products/page.tsx:171`)

## The Actual Issue

The problem is that **products in the database don't have `DisplayInPOS` set to `true`**. This can happen if:

1. The CSV upload didn't properly save the `DisplayInPOS` field to the database
2. A migration didn't run correctly
3. The column exists but has `false` or `NULL` values

## Solution

### Quick Fix (Recommended)

Run the provided PowerShell script to fix all products at once:

```powershell
.\fix-display-in-pos.ps1
```

This script will:
- Connect to your PostgreSQL database
- Check the current state of DisplayInPOS for all products
- Update all products to have `DisplayInPOS = true`
- Verify the fix was applied

### Manual Fix (If PowerShell Script Doesn't Work)

If you don't have `psql` installed or the script fails, you can:

#### Option 1: Use pgAdmin or any PostgreSQL client

1. Open your PostgreSQL client (pgAdmin, DBeaver, etc.)
2. Connect to database: `dms_erp_db`
3. Run this query:

```sql
-- Update all products to display in POS
UPDATE "Products"
SET "DisplayInPOS" = true
WHERE "DisplayInPOS" = false OR "DisplayInPOS" IS NULL;

-- Verify the change
SELECT 
    COUNT(*) AS total_products,
    COUNT(CASE WHEN "DisplayInPOS" = true THEN 1 END) AS visible_in_pos
FROM "Products";
```

#### Option 2: Use Docker exec (if using Docker)

```bash
docker exec -it dms-backend-db psql -U dms_user -d dms_erp_db -c "UPDATE \"Products\" SET \"DisplayInPOS\" = true WHERE \"DisplayInPOS\" = false OR \"DisplayInPOS\" IS NULL;"
```

### After Applying the Fix

1. **Restart the backend** (if it's running):
   ```powershell
   # If running locally
   cd DMS-Backend
   # Stop with Ctrl+C and restart
   dotnet run
   
   # If using Docker
   docker-compose restart dms-backend
   ```

2. **Refresh the POS cache**:
   - Open the POS application
   - Click on the user dropdown (top right)
   - Click "Refresh cache" or press F5
   - Wait for the catalog to sync

3. **Verify products appear**:
   - You should now see all products in the POS catalog
   - Try searching for a product by name or code
   - Check different categories

## Verification Steps

### 1. Check Database

Run this query to see how many products are visible in POS:

```sql
SELECT 
    COUNT(*) AS total_products,
    COUNT(CASE WHEN "DisplayInPOS" = true THEN 1 END) AS visible_in_pos,
    COUNT(CASE WHEN "DisplayInPOS" = false THEN 1 END) AS hidden_from_pos,
    COUNT(CASE WHEN "IsActive" = true THEN 1 END) AS active_products
FROM "Products";
```

Expected result:
- `visible_in_pos` should equal or be close to `total_products`
- `active_products` should show your active products

### 2. Check Backend API

Test the products API endpoint:

```bash
# Replace with your backend URL
curl "http://localhost:5126/api/products?page=1&pageSize=10&displayInPosOnly=true" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

You should see products returned in the response.

### 3. Check POS Application

1. Open the POS
2. Go to "All" category
3. You should see your products listed
4. Search for a specific product code (e.g., "BI1")
5. It should appear in search results

## Prevention

To prevent this issue in the future:

### 1. Always verify CSV uploads

After uploading products via CSV:

```sql
-- Check if DisplayInPOS was set correctly
SELECT "Code", "Name", "DisplayInPOS", "IsActive"
FROM "Products"
WHERE "CreatedAt" > NOW() - INTERVAL '1 hour'
ORDER BY "CreatedAt" DESC;
```

### 2. Use the CSV template

When uploading products:
- Always use the CSV template from the products page
- Ensure the `displayInPOS` column is set to `true` (or `TRUE`, `1`, `yes`, `y`)
- Validate the CSV before uploading

### 3. Check migrations

Ensure all migrations are applied:

```powershell
cd DMS-Backend
dotnet ef database update
```

Look for these migrations:
- `20260513000000_AddDisplayInPOSToProducts` - Adds the column
- `20260519150000_SetDisplayInPOSTrueForAllProducts` - Sets all to true

### 4. Monitor the backend logs

When uploading CSV files, check the backend logs for any errors:

```powershell
# Windows
Get-Content DMS-Backend\Logs\*.log -Tail 50

# Linux/Mac
tail -f DMS-Backend/Logs/*.log
```

## Troubleshooting

### Products still not appearing after fix

1. **Clear browser cache**: Press Ctrl+Shift+Delete and clear cache
2. **Check if products are active**: Only active products with `IsActive=true` appear
3. **Verify API response**: Use browser DevTools Network tab to see API responses
4. **Check category assignment**: Products must have a valid category

### POS shows "No products in cache"

1. Check internet connection (POS needs to sync once when online)
2. Click "Refresh cache" in the POS user menu
3. Check the backend is running and accessible
4. Verify the API URL in POS settings (Technical settings in drawer menu)

### CSV upload fails with "displayInPOS" error

The CSV column name should be: `displayInPOS` (camelCase)
Accepted values: `true`, `false`, `yes`, `no`, `1`, `0`, `y`, `n`
Leave empty for default (true)

## Files Created

- `fix_display_in_pos_products.sql` - SQL script to fix the issue
- `fix-display-in-pos.ps1` - PowerShell script to run the SQL automatically
- `DISPLAY_IN_POS_FIX.md` - This diagnostic and fix guide

## Technical Details

### Database Schema

```sql
-- DisplayInPOS column definition
"DisplayInPOS" boolean NOT NULL DEFAULT false
```

### Backend Filter Logic

```csharp
// ProductService.cs line 54-56
if (displayInPosOnly == true)
{
    query = query.Where(p => p.DisplayInPOS == true);
}
```

### POS API Request

```typescript
// api.ts line 68-74
export async function fetchProductsPage(page: number, pageSize: number) {
  const { data } = await api.get<ApiEnvelope<{ products: unknown[]; totalCount: number }>>(
    '/api/products',
    { params: { page, pageSize, activeOnly: true, displayInPosOnly: true } },
  )
  return unwrap(data)
}
```

### CSV Field Mapping

```typescript
// products/page.tsx line 171
displayInPOS: parseBool(row, 'displayInPOS', true),
```

## Support

If you still have issues after following this guide:

1. Check the backend logs for errors
2. Verify database connectivity
3. Ensure migrations are up to date
4. Contact the development team with:
   - Error messages from logs
   - Number of products in database
   - Result of the verification SQL query
   - POS version and backend version
