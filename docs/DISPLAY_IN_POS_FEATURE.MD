# Display in POS Feature Implementation

**Date**: May 13, 2026  
**Feature**: Product Display Access Control for POS Terminals  
**Status**: ✅ Implemented

## Overview

This feature adds granular control over which products are displayed in POS terminals. Previously, the POS displayed all active products without any additional filtering. Now, administrators can control POS product visibility using a dedicated `DisplayInPOS` field.

## Problem Statement

The POS terminal was displaying all active products without any mechanism to control which products should be available for sale at the point of sale. This led to situations where:
- Products meant for internal use or production might appear in POS
- Products not ready for retail sale were displayed
- No way to hide products from POS without deactivating them entirely

## Solution

Added a new `DisplayInPOS` boolean field to the Product entity that:
- Defaults to `true` for all products (backward compatible)
- Can be toggled independently of the `IsActive` field
- Filters products in the POS API endpoint when requested
- Provides a clear UI checkbox in product management forms

## Implementation Details

### 1. Backend Changes

#### Database Schema
- **New Column**: `DisplayInPOS` (boolean, default: true)
- **Migration**: `20260513000000_AddDisplayInPOSToProducts.cs`
- **Table**: `Products`

#### Entity Model
**File**: `DMS-Backend/Models/Entities/Product.cs`
```csharp
/// <summary>
/// Controls whether this product should be displayed in POS terminals.
/// When false, product won't appear in POS catalog even if active.
/// </summary>
public bool DisplayInPOS { get; set; } = true;
```

#### DTOs Updated
- `ProductDetailDto.cs` - Added `DisplayInPOS` property
- `ProductListItemDto.cs` - Added `DisplayInPOS` property
- `CreateProductDto.cs` - Added `DisplayInPOS` property (default: true)
- `UpdateProductDto.cs` - Added `DisplayInPOS` property

#### API Changes
**File**: `DMS-Backend/Controllers/ProductsController.cs`
- Added new query parameter: `displayInPosOnly` (optional, boolean)
- When `displayInPosOnly=true`, only products with `DisplayInPOS=true` are returned

**File**: `DMS-Backend/Services/Implementations/ProductService.cs`
- Updated `GetAllAsync()` method to accept `displayInPosOnly` parameter
- Added filtering logic: `query = query.Where(p => p.DisplayInPOS == true)`
- Updated `UpdateAsync()` method to map the `DisplayInPOS` field

**File**: `DMS-Backend/Services/Interfaces/IProductService.cs`
- Updated interface signature to include `displayInPosOnly` parameter

### 2. Frontend Changes

#### Product Management Forms

**Add Product Form** (`DMS-Frontend/src/app/(dashboard)/inventory/products/add/page.tsx`)
- Added "Display in POS" checkbox in the form
- Default value: `true`
- Positioned after "Require Open Stock" checkbox

**Edit Product Form** (`DMS-Frontend/src/app/(dashboard)/inventory/products/edit/[id]/page.tsx`)
- Added "Display in POS" checkbox
- Loads existing value from product data
- Positioned after "Require Open Stock" checkbox

**Product List** (`DMS-Frontend/src/app/(dashboard)/inventory/products/page.tsx`)
- Added `DisplayInPOS` field to toggle active handler
- Added to CSV bulk upload columns
- Included in example CSV template

#### TypeScript Types
**File**: `DMS-Frontend/src/lib/api/products.ts`
- Added `displayInPOS: boolean` to `Product` interface
- Added `displayInPOS: boolean` to `CreateProductDto` interface
- Added `displayInPOS: boolean` to `UpdateProductDto` interface
- Updated `normalizeProduct()` function to map the field

### 3. POS Terminal Changes

**File**: `DMS-POS/src/lib/api.ts`
- Updated `fetchProductsPage()` function
- Added `displayInPosOnly: true` parameter to the API call
- Now fetches: `{ params: { page, pageSize, activeOnly: true, displayInPosOnly: true } }`

This ensures POS terminals only display products that:
1. Are active (`IsActive = true`)
2. Have POS display enabled (`DisplayInPOS = true`)

## Usage Guide

### For Administrators

#### 1. Set DisplayInPOS for New Products
When creating a new product:
1. Navigate to **Inventory → Products → Add Product**
2. Fill in product details
3. Find the "Display in POS" checkbox (enabled by default)
4. Uncheck if the product should NOT appear in POS terminals
5. Save the product

#### 2. Update Existing Products
To hide/show a product in POS:
1. Navigate to **Inventory → Products**
2. Click "Edit" on the desired product
3. Toggle the "Display in POS" checkbox
4. Save changes

#### 3. Bulk Import with CSV
Include the `displayInPOS` column in your CSV:
```csv
code,name,categoryCode,uomCode,unitPrice,requireOpenStock,displayInPOS,isActive
BR01,White Bread,BREAD,PCS,120.00,true,true,true
IC01,Internal Component,RAW,KG,50.00,true,false,true
```

### For POS Users

Products will automatically refresh based on the `DisplayInPOS` setting:
- When syncing the catalog, only products with `DisplayInPOS=true` appear
- Products hidden from POS won't show up even if active in inventory
- Existing POS transactions are not affected

## Database Migration

### Running the Migration

The migration will run automatically when you start the backend:

```bash
cd DMS-Backend
dotnet run
```

Or manually apply:

```bash
cd DMS-Backend
dotnet ef database update
```

### Migration Details

```sql
-- Add column with default value
ALTER TABLE "Products" ADD COLUMN "DisplayInPOS" boolean NOT NULL DEFAULT true;

-- Ensure all existing products have DisplayInPOS = true
UPDATE "Products" SET "DisplayInPOS" = true WHERE "DisplayInPOS" IS NULL;
```

## Testing Checklist

### Backend Testing
- [ ] Build succeeds without errors ✅
- [ ] Migration creates column successfully
- [ ] API returns all products when `displayInPosOnly` is not specified
- [ ] API filters products when `displayInPosOnly=true`
- [ ] Create product with `DisplayInPOS=false` works
- [ ] Update product `DisplayInPOS` value works

### Frontend Testing
- [ ] "Display in POS" checkbox appears in Add Product form
- [ ] "Display in POS" checkbox appears in Edit Product form
- [ ] Checkbox defaults to checked (true) for new products
- [ ] Checkbox loads correct value for existing products
- [ ] Saving product with DisplayInPOS=false succeeds
- [ ] CSV bulk upload with displayInPOS column works

### POS Terminal Testing
- [ ] POS catalog sync includes only DisplayInPOS=true products
- [ ] Products with DisplayInPOS=false don't appear in POS
- [ ] Active products with DisplayInPOS=false are hidden
- [ ] Inactive products don't appear regardless of DisplayInPOS
- [ ] Existing sales/transactions not affected

## Rollback Plan

If issues arise, rollback using migration:

```bash
cd DMS-Backend
dotnet ef database update 20260511123000_AddProductLabelTemplateIdToProducts
```

This will remove the `DisplayInPOS` column.

## Future Enhancements

Potential improvements:
1. **Outlet-Specific Display**: Control which products appear at specific outlets
2. **Time-Based Display**: Schedule when products appear in POS
3. **Batch Toggle**: Bulk enable/disable POS display for multiple products
4. **Display Analytics**: Track which products are hidden and why
5. **Permission Control**: Restrict who can change DisplayInPOS settings

## Files Changed

### Backend
- ✅ `DMS-Backend/Models/Entities/Product.cs`
- ✅ `DMS-Backend/Models/DTOs/Products/ProductDetailDto.cs`
- ✅ `DMS-Backend/Models/DTOs/Products/ProductListItemDto.cs`
- ✅ `DMS-Backend/Models/DTOs/Products/CreateProductDto.cs`
- ✅ `DMS-Backend/Models/DTOs/Products/UpdateProductDto.cs`
- ✅ `DMS-Backend/Controllers/ProductsController.cs`
- ✅ `DMS-Backend/Services/Implementations/ProductService.cs`
- ✅ `DMS-Backend/Services/Interfaces/IProductService.cs`
- ✅ `DMS-Backend/Migrations/20260513000000_AddDisplayInPOSToProducts.cs` (NEW)

### Frontend
- ✅ `DMS-Frontend/src/lib/api/products.ts`
- ✅ `DMS-Frontend/src/app/(dashboard)/inventory/products/page.tsx`
- ✅ `DMS-Frontend/src/app/(dashboard)/inventory/products/add/page.tsx`
- ✅ `DMS-Frontend/src/app/(dashboard)/inventory/products/edit/[id]/page.tsx`

### POS
- ✅ `DMS-POS/src/lib/api.ts`

## Summary

The `DisplayInPOS` feature provides fine-grained control over product visibility in POS terminals while maintaining backward compatibility. All existing products default to being displayed, and administrators can selectively hide products from POS without affecting other parts of the system.

**Total Files Modified**: 13  
**Total Lines Added**: ~150  
**Breaking Changes**: None (backward compatible)  
**Database Changes**: 1 new column
