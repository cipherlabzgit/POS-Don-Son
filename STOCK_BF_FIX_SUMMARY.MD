# Stock BF Grouping Fix - Summary

## Problem
When creating a StockBF with multiple items (products), the system was saving each item as a separate StockBF record with different BF numbers instead of grouping them under a single BF number. This caused issues in both the main list view and the administrator approval page.

## Root Causes Identified

### 1. Missing BFNo in Single Item Creation
**File:** `DMS-Backend/Services/Implementations/StockBFService.cs`
**Method:** `CreateAsync` (lines 262-334)

The single-item creation method was creating StockBF records **without setting the BFNo field**. This relied on the DbContext's auto-generation, which used a different prefix.

**Before:**
```csharp
var stockBF = new StockBF
{
    Id = Guid.NewGuid(),
    BFDate = bfDateUtc,
    OutletId = dto.OutletId,
    ProductId = dto.ProductId,
    Quantity = dto.Quantity,
    // BFNo was NOT set here!
    ...
};
```

**After:**
```csharp
// Generate BF Number for single item creation
var bfNo = await GenerateNextStockBFNoAsync(cancellationToken);

var stockBF = new StockBF
{
    Id = Guid.NewGuid(),
    BFNo = bfNo,  // Now properly set
    BFDate = bfDateUtc,
    ...
};
```

### 2. Prefix Mismatch Between Service and DbContext
**Files:** 
- `DMS-Backend/Services/Implementations/StockBFService.cs` - Used prefix **"SBFN"**
- `DMS-Backend/Data/ApplicationDbContext.cs` - Used prefix **"SBF"**

This caused two separate numbering sequences, leading to confusion and potential conflicts.

**Before (ApplicationDbContext.cs):**
```csharp
private async Task<string> GenerateStockBFNoAsync(CancellationToken cancellationToken)
{
    var prefix = "SBF";  // Wrong prefix!
    ...
}
```

**After:**
```csharp
private async Task<string> GenerateStockBFNoAsync(CancellationToken cancellationToken)
{
    // Use "SBFN" prefix to match StockBFService.GenerateNextStockBFNoAsync()
    var prefix = "SBFN";  // Now consistent!
    ...
}
```

## How It Should Work (After Fix)

### Creating StockBF with Multiple Items

1. **Frontend** calls `/api/stock-bf/bulk` with multiple items:
   ```json
   {
     "bfDate": "2024-05-28",
     "outletId": "xxx",
     "items": [
       { "productId": "product1", "quantity": 10 },
       { "productId": "product2", "quantity": 20 },
       { "productId": "product3", "quantity": 15 }
     ]
   }
   ```

2. **Backend** (`CreateBulkAsync`) generates **ONE shared BF number** (e.g., "SBFN00000001")

3. **All 3 items** get the **same BFNo**: "SBFN00000001"

4. **Database** saves 3 separate records:
   ```
   ID        | BFNo         | ProductId | Quantity | Status
   ----------|--------------|-----------|----------|--------
   guid-1    | SBFN00000001 | product1  | 10       | Pending
   guid-2    | SBFN00000001 | product2  | 20       | Pending
   guid-3    | SBFN00000001 | product3  | 15       | Pending
   ```

### Viewing StockBF Records

5. **Frontend** requests with `grouped=true` parameter

6. **Backend** (`GetAllGroupedAsync`) groups by BFNo and returns:
   ```json
   {
     "groups": [
       {
         "groupId": "guid-1",
         "bfNo": "SBFN00000001",
         "itemCount": 3,
         "totalQuantity": 45,
         "status": "Pending",
         "items": [/* all 3 items */]
       }
     ]
   }
   ```

7. **Frontend** displays **ONE grouped row** showing "3 products - Total Qty: 45"

### Approving/Rejecting StockBF

8. **Administrator** clicks approve on the group

9. **Backend** (`ApproveAsync`):
   - Finds the clicked item's BFNo
   - Finds **ALL items** with that BFNo
   - Approves **ALL items together**
   - Updates FreezerStock for each item

10. **Result:** All 3 items are approved as a single unit

## Files Modified

1. **DMS-Backend/Services/Implementations/StockBFService.cs**
   - Fixed `CreateAsync` to generate and set BFNo before saving

2. **DMS-Backend/Data/ApplicationDbContext.cs**
   - Fixed prefix from "SBF" to "SBFN" for consistency

## Testing Checklist

- [ ] Create StockBF with multiple items from Frontend
- [ ] Verify all items have the same BFNo in database
- [ ] Verify list view shows grouped record (not separate items)
- [ ] Verify approval page shows grouped record
- [ ] Approve one item and verify all items in group are approved
- [ ] Reject one item and verify all items in group are rejected
- [ ] Create single-item StockBF and verify it gets a proper BFNo
- [ ] Verify BFNo numbering is sequential and uses "SBFN" prefix

## Database Migration Note

The recent migration `20260528101732_RemoveStockBFNoUniqueConstraint` removed the UNIQUE constraint on `bf_no` to allow multiple records with the same BF number. This was necessary for the grouping functionality to work correctly.

## Additional Notes

- The `CreateBulkAsync` method was already working correctly - it was generating shared BFNos
- The `ApproveAsync` and `RejectAsync` methods were already working correctly - they group by BFNo
- The `GetAllGroupedAsync` method was already working correctly - it groups results by BFNo
- The frontend was already using `grouped=true` parameter
- The main issues were in the single-item creation and prefix inconsistency
