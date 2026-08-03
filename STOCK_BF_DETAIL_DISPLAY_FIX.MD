# StockBF Detail Display Fix - Summary

## Issues Fixed

### Issue 1: "Requested By" Showing as "-"
**Problem:** In the administrator approvals page, the "Requested By" field was showing "-" instead of the user who created the StockBF.

**Root Cause:** The backend was using `UpdatedByName` instead of `CreatedByName`.

**Fix:** Updated `OperationApprovalService.cs` line 157:
```csharp
// BEFORE
RequestedByName = first.UpdatedByName,

// AFTER  
RequestedByName = first.CreatedByName,
```

### Issue 2: Product List Not Showing
**Problem:** When viewing StockBF details in the approvals page, the product list was empty even though multiple products were added.

**Root Cause:** The frontend was fetching only a single StockBF record by ID, but we need ALL items with the same BFNo to show the complete list.

**Fixes:**

#### Backend Changes

1. **Added new service method** (`StockBFService.cs`):
   ```csharp
   public async Task<List<StockBFDetailDto>> GetAllByBFNoAsync(string bfNo, ...)
   {
       var stockBFs = await _context.StockBFs
           .Include(s => s.Outlet)
           .Include(s => s.Product)
           .Include(s => s.CreatedBy)
           .Include(s => s.UpdatedBy)
           .Include(s => s.ApprovedBy)
           .Include(s => s.RejectedBy)
           .Where(s => s.BFNo == bfNo && s.IsActive)
           .OrderBy(s => s.Product != null ? s.Product.Name : s.ProductId.ToString())
           .ToListAsync(cancellationToken);

       return _mapper.Map<List<StockBFDetailDto>>(stockBFs);
   }
   ```

2. **Added interface method** (`IStockBFService.cs`):
   ```csharp
   Task<List<StockBFDetailDto>> GetAllByBFNoAsync(string bfNo, CancellationToken cancellationToken = default);
   ```

3. **Added controller endpoint** (`StockBFController.cs`):
   ```csharp
   [HttpGet("by-bfno/{bfNo}")]
   [HasPermission("operation:stock-bf:view")]
   public async Task<ActionResult<ApiResponse<List<StockBFDetailDto>>>> GetAllByBFNo(string bfNo, ...)
   ```

4. **Added CreatedByName to DTO** (`StockBFListDto.cs`):
   ```csharp
   public string? CreatedByName { get; set; }
   public DateTime CreatedAt { get; set; }
   ```

5. **Updated AutoMapper** (`StockBFProfile.cs`):
   ```csharp
   .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedBy != null ? $"{src.CreatedBy.FirstName} {src.CreatedBy.LastName}".Trim() : null))
   ```

#### Frontend Changes

1. **Added API client method** (`stock-bf.ts`):
   ```typescript
   getAllByBFNo: async (bfNo: string) => {
     const response = await api.get<any>(`${BASE_URL}/by-bfno/${bfNo}`);
     return response.data?.data ?? response.data;
   },
   ```

2. **Updated approvals page** (`approvals/page.tsx`):
   ```typescript
   case 'Stock BF':
     // Fetch all items in the group by BFNo (referenceNo contains BFNo)
     const stockBFItems = await stockBfApi.getAllByBFNo(item.referenceNo);
     data = { items: stockBFItems };
     break;
   ```

## How It Works Now

1. **Administrator clicks on a StockBF** in the approvals list
2. **Frontend extracts BFNo** from `item.referenceNo` (e.g., "SBFN00000001")
3. **Frontend calls** `GET /api/stock-bf/by-bfno/SBFN00000001`
4. **Backend returns** ALL items with that BFNo (2 products in your example)
5. **Frontend displays**:
   - ✅ **Requested By**: Shows creator name (from CreatedByName)
   - ✅ **Product list**: Shows all 2 products with quantities

## Files Modified

### Backend
1. `DMS-Backend/Services/Implementations/OperationApprovalService.cs` - Fixed RequestedByName
2. `DMS-Backend/Services/Implementations/StockBFService.cs` - Added GetAllByBFNoAsync method
3. `DMS-Backend/Services/Interfaces/IStockBFService.cs` - Added interface method
4. `DMS-Backend/Controllers/StockBFController.cs` - Added API endpoint
5. `DMS-Backend/Models/DTOs/StockBF/StockBFListDto.cs` - Added CreatedByName property
6. `DMS-Backend/Mapping/StockBFProfile.cs` - Updated AutoMapper configuration

### Frontend
1. `DMS-Frontend/src/lib/api/stock-bf.ts` - Added getAllByBFNo API call
2. `DMS-Frontend/src/app/(dashboard)/administrator/approvals/page.tsx` - Updated to fetch all items by BFNo

## Testing Steps

1. ✅ Create a StockBF with 2 products
2. ✅ Go to Administrator → Approvals
3. ✅ Click on the StockBF to view details
4. ✅ Verify "Requested By" shows the creator's name
5. ✅ Verify product list shows all 2 products with their quantities

## API Endpoint

**New Endpoint:**
```
GET /api/stock-bf/by-bfno/{bfNo}
```

**Example:**
```
GET /api/stock-bf/by-bfno/SBFN00000001
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "guid1",
      "bfNo": "SBFN00000001",
      "productName": "Product 1",
      "quantity": 10,
      "createdByName": "John Doe",
      ...
    },
    {
      "id": "guid2",
      "bfNo": "SBFN00000001",
      "productName": "Product 2",
      "quantity": 3000,
      "createdByName": "John Doe",
      ...
    }
  ]
}
```
