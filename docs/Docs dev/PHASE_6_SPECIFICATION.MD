# Phase 6 - Operations Backend Implementation Specification

## Overview
Implement 8 document-based operation entities with workflow, status transitions, and label printing endpoints. Apply `[DayLockGuard]` to all operations that modify transactional data.

---

## Entities & Data Models

### 1. Delivery
**Purpose:** Track bakery product deliveries to showrooms

```csharp
public class Delivery : BaseEntity
{
    public string DeliveryNo { get; set; } = string.Empty; // Auto: DN-YYYY-XXXXXX
    public DateTime DeliveryDate { get; set; }
    public Guid OutletId { get; set; }
    public Outlet Outlet { get; set; } = null!;
    public DeliveryStatus Status { get; set; } = DeliveryStatus.Draft;
    public int TotalItems { get; set; }
    public decimal TotalValue { get; set; }
    public string? Notes { get; set; }
    public Guid? ApprovedById { get; set; }
    public User? ApprovedBy { get; set; }
    public DateTime? ApprovedDate { get; set; }
    
    public ICollection<DeliveryItem> Items { get; set; } = new List<DeliveryItem>();
}

public class DeliveryItem : BaseEntity
{
    public Guid DeliveryId { get; set; }
    public Delivery Delivery { get; set; } = null!;
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Total { get; set; }
}

public enum DeliveryStatus
{
    Draft,
    Pending,
    Approved,
    Rejected
}
```

### 2. Disposal
**Purpose:** Track disposal of bakery products at showrooms

```csharp
public class Disposal : BaseEntity
{
    public string DisposalNo { get; set; } = string.Empty; // Auto: DS-YYYY-XXXXXX
    public DateTime DisposalDate { get; set; }
    public Guid OutletId { get; set; }
    public Outlet Outlet { get; set; } = null!;
    public DateTime DeliveredDate { get; set; } // Reference to original delivery date
    public DisposalStatus Status { get; set; } = DisposalStatus.Draft;
    public int TotalItems { get; set; }
    public string? Notes { get; set; }
    public Guid? ApprovedById { get; set; }
    public User? ApprovedBy { get; set; }
    public DateTime? ApprovedDate { get; set; }
    
    public ICollection<DisposalItem> Items { get; set; } = new List<DisposalItem>();
}

public class DisposalItem : BaseEntity
{
    public Guid DisposalId { get; set; }
    public Disposal Disposal { get; set; } = null!;
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public decimal Quantity { get; set; }
    public string? Reason { get; set; }
}

public enum DisposalStatus
{
    Draft,
    Pending,
    Approved,
    Rejected
}
```

### 3. Transfer
**Purpose:** Track product transfers between showrooms

```csharp
public class Transfer : BaseEntity
{
    public string TransferNo { get; set; } = string.Empty; // Auto: TR-YYYY-XXXXXX
    public DateTime TransferDate { get; set; }
    public Guid FromOutletId { get; set; }
    public Outlet FromOutlet { get; set; } = null!;
    public Guid ToOutletId { get; set; }
    public Outlet ToOutlet { get; set; } = null!;
    public TransferStatus Status { get; set; } = TransferStatus.Draft;
    public int TotalItems { get; set; }
    public string? Notes { get; set; }
    public Guid? ApprovedById { get; set; }
    public User? ApprovedBy { get; set; }
    public DateTime? ApprovedDate { get; set; }
    
    public ICollection<TransferItem> Items { get; set; } = new List<TransferItem>();
}

public class TransferItem : BaseEntity
{
    public Guid TransferId { get; set; }
    public Transfer Transfer { get; set; } = null!;
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public decimal Quantity { get; set; }
}

public enum TransferStatus
{
    Draft,
    Pending,
    Approved,
    Rejected,
    Completed
}
```

### 4. Cancellation
**Purpose:** Track delivery cancellations with approval workflow

```csharp
public class Cancellation : BaseEntity
{
    public string CancellationNo { get; set; } = string.Empty; // Auto: DCN########
    public DateTime CancellationDate { get; set; }
    public string DeliveryNo { get; set; } = string.Empty; // Reference to delivery
    public DateTime DeliveredDate { get; set; } // Original delivery date
    public Guid OutletId { get; set; }
    public Outlet Outlet { get; set; } = null!;
    public string Reason { get; set; } = string.Empty;
    public CancellationStatus Status { get; set; } = CancellationStatus.Pending;
    public Guid? ApprovedById { get; set; }
    public User? ApprovedBy { get; set; }
    public DateTime? ApprovedDate { get; set; }
}

public enum CancellationStatus
{
    Pending,
    Approved,
    Rejected
}
```

### 5. DeliveryReturn
**Purpose:** Track product returns from showrooms

```csharp
public class DeliveryReturn : BaseEntity
{
    public string ReturnNo { get; set; } = string.Empty; // Auto: RET########
    public DateTime ReturnDate { get; set; }
    public string DeliveryNo { get; set; } = string.Empty; // Reference to delivery
    public DateTime DeliveredDate { get; set; } // Original delivery date
    public Guid OutletId { get; set; }
    public Outlet Outlet { get; set; } = null!;
    public string Reason { get; set; } = string.Empty;
    public int TotalItems { get; set; }
    public DeliveryReturnStatus Status { get; set; } = DeliveryReturnStatus.Draft;
    public Guid? ApprovedById { get; set; }
    public User? ApprovedBy { get; set; }
    public DateTime? ApprovedDate { get; set; }
    
    public ICollection<DeliveryReturnItem> Items { get; set; } = new List<DeliveryReturnItem>();
}

public class DeliveryReturnItem : BaseEntity
{
    public Guid DeliveryReturnId { get; set; }
    public DeliveryReturn DeliveryReturn { get; set; } = null!;
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public decimal Quantity { get; set; }
}

public enum DeliveryReturnStatus
{
    Draft,
    Pending,
    Approved,
    Processed
}
```

### 6. StockBF (Brought Forward)
**Purpose:** Track opening stock balances per showroom per product

```csharp
public class StockBF : BaseEntity
{
    public string BFNo { get; set; } = string.Empty; // Auto: SBF########
    public DateTime BFDate { get; set; }
    public Guid OutletId { get; set; }
    public Outlet Outlet { get; set; } = null!;
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public decimal Quantity { get; set; }
    public StockBFStatus Status { get; set; } = StockBFStatus.Active;
    public Guid? ApprovedById { get; set; }
    public User? ApprovedBy { get; set; }
    public DateTime? ApprovedDate { get; set; }
}

public enum StockBFStatus
{
    Active,
    Adjusted
}
```

### 7. ShowroomOpenStock
**Purpose:** Track opening stock date per showroom

```csharp
public class ShowroomOpenStock : BaseEntity
{
    public Guid OutletId { get; set; }
    public Outlet Outlet { get; set; } = null!;
    public DateTime StockAsAt { get; set; } // Last Stock BF Date
}
```

### 8. LabelPrintRequest
**Purpose:** Track label printing requests for products

```csharp
public class LabelPrintRequest : BaseEntity
{
    public string DisplayNo { get; set; } = string.Empty; // Auto: LBL########
    public DateTime Date { get; set; }
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public int LabelCount { get; set; }
    public DateTime StartDate { get; set; }
    public int ExpiryDays { get; set; }
    public decimal? PriceOverride { get; set; }
    public LabelPrintStatus Status { get; set; } = LabelPrintStatus.Pending;
    public Guid? ApprovedById { get; set; }
    public User? ApprovedBy { get; set; }
    public DateTime? ApprovedDate { get; set; }
}

public enum LabelPrintStatus
{
    Pending,
    Approved,
    Rejected
}
```

---

## Implementation Requirements

### Auto-Generated Numbers
Implement in `ApplicationDbContext.SaveChangesAsync()`:
- `DN-YYYY-XXXXXX` for Delivery (year-based, 6-digit sequential)
- `DS-YYYY-XXXXXX` for Disposal
- `TR-YYYY-XXXXXX` for Transfer
- `DCN########` for Cancellation (8-digit sequential)
- `RET########` for DeliveryReturn
- `SBF########` for StockBF
- `LBL########` for LabelPrintRequest

### Status Workflows
- **Submit**: Draft → Pending (where applicable)
- **Approve**: Pending → Approved
- **Reject**: Pending → Rejected
- **Cancel**: Approved → Cancelled (where applicable)

### Relationships
- All entities reference `Outlet` (showroom)
- Delivery, Disposal, Transfer, DeliveryReturn, StockBF reference `Product`
- All reference `User` for approvals

### API Endpoints Pattern (per entity)
```
GET    /api/{entity}                    - List with pagination, filter by date/outlet/status
GET    /api/{entity}/{id}               - Get by ID
POST   /api/{entity}                    - Create (Draft status)
PUT    /api/{entity}/{id}               - Update (only if Draft)
DELETE /api/{entity}/{id}               - Soft delete (only if Draft)
POST   /api/{entity}/{id}/submit        - Submit for approval (Draft → Pending)
POST   /api/{entity}/{id}/approve       - Approve (Pending → Approved)
POST   /api/{entity}/{id}/reject        - Reject (Pending → Rejected)
POST   /api/{entity}/{id}/cancel        - Cancel (Approved → Cancelled, where applicable)
```

### Special Endpoints
- `GET /api/labels/print` - Generate print-ready label data (respects product `enableLabelPrint`, `allowFutureLabelPrint`)
- `POST /api/labels/showroom` - Generate showroom label print data
- `GET /api/showroom-open-stock` - List all showroom opening stock dates
- `PUT /api/showroom-open-stock/{id}` - Update opening stock date (admin only)

### Validation Rules
- DeliveryDate, DisposalDate, etc. must respect day-lock
- Only Draft documents can be edited or deleted
- Approval actions require appropriate permissions
- Transfer: FromOutletId ≠ ToOutletId
- Label printing: Product must have `enableLabelPrint = true`

### Permissions (use existing patterns)
- `operation:delivery:view`, `operation:delivery:create`, `operation:delivery:update`, `operation:delivery:delete`, `operation:delivery:approve`
- Same pattern for disposal, transfer, cancellation, delivery-return, stock-bf, label-printing
- `operation:showroom-open-stock:view`, `operation:showroom-open-stock:update` (admin only)

### DayLockGuard Application
Apply `[DayLockGuard]` attribute to:
- All POST/PUT/DELETE endpoints for transactional documents
- All status change endpoints (submit, approve, reject, cancel)

---

## Implementation Checklist

For each entity:
1. ✅ Create entity class in `Models/Entities/`
2. ✅ Create enum for status in same file
3. ✅ Create DTOs: `{Entity}ListItemDto`, `{Entity}DetailDto`, `Create{Entity}Dto`, `Update{Entity}Dto`
4. ✅ For entities with items: `{Entity}ItemDto`, `Create{Entity}ItemDto`, `Update{Entity}ItemDto`
5. ✅ Create validators: `Create{Entity}DtoValidator`, `Update{Entity}DtoValidator`
6. ✅ Create AutoMapper profile: `{Entity}Profile`
7. ✅ Create service interface: `I{Entity}Service`
8. ✅ Create service implementation: `{Entity}Service`
   - Include workflow methods: `SubmitAsync`, `ApproveAsync`, `RejectAsync`, `CancelAsync` (where applicable)
9. ✅ Create controller: `{Entity}Controller`
   - Standard CRUD + workflow endpoints
   - Apply `[HasPermission]`, `[Audit]`, `[DayLockGuard]`
10. ✅ Add `DbSet` in `ApplicationDbContext`
11. ✅ Configure entity relationships in `OnModelCreating`
12. ✅ Register service in `Program.cs`

### Special Implementations
- **Auto-number generation** in `ApplicationDbContext.SaveChangesAsync()`
- **Label print endpoint** respects product flags and date rules
- **ShowroomOpenStock** admin-only update check

---

## Database Configuration

### Indexes
- Composite unique: `(OutletId, BFDate, ProductId)` for StockBF
- Unique: `OutletId` for ShowroomOpenStock
- Index on: `DeliveryNo`, `DisposalNo`, `TransferNo`, `ReturnNo`, `CancellationNo`, `BFNo`, `DisplayNo`
- Index on: `DeliveryDate`, `DisposalDate`, `TransferDate`, etc.

### Relationships
- Configure cascade behaviors appropriately
- Restrict delete for referenced entities (Outlet, Product, User)

---

## Notes
- Follow Phase 5 patterns for: nullable returns, exception handling, Guid IDs, audit logging
- All DTOs use `Guid` for IDs (represented as `string` in frontend)
- Use `decimal(18,4)` for quantities and prices
- All responses use `ApiResponse<T>` envelope
- All services return DTOs or null, throw `InvalidOperationException` for errors
- Controllers use `try-catch` to convert exceptions to `ApiResponse` errors
