# Phase 7 - Production & Stock Backend Implementation Specification

## Overview
Implement production tracking, stock management, and stock adjustment entities with approval workflows. Create computed views for current stock calculations.

---

## Entities & Data Models

### 1. DailyProduction
**Purpose:** Track daily production activities

```csharp
public class DailyProduction : BaseEntity
{
    public string ProductionNo { get; set; } = string.Empty; // Auto: PRO#######
    public DateTime ProductionDate { get; set; }
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public decimal PlannedQty { get; set; }
    public decimal ProducedQty { get; set; }
    public ProductionShift Shift { get; set; } = ProductionShift.Morning;
    public DailyProductionStatus Status { get; set; } = DailyProductionStatus.Pending;
    public string? Notes { get; set; }
    public Guid? ApprovedById { get; set; }
    public User? ApprovedBy { get; set; }
    public DateTime? ApprovedDate { get; set; }
}

public enum ProductionShift
{
    Morning,
    Evening,
    Night
}

public enum DailyProductionStatus
{
    Pending,
    Approved,
    Rejected
}
```

### 2. ProductionCancel
**Purpose:** Track production cancellations

```csharp
public class ProductionCancel : BaseEntity
{
    public string CancelNo { get; set; } = string.Empty; // Auto: PCC#######
    public DateTime CancelDate { get; set; }
    public string ProductionNo { get; set; } = string.Empty; // Reference to DailyProduction
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public decimal CancelledQty { get; set; }
    public string Reason { get; set; } = string.Empty;
    public ProductionCancelStatus Status { get; set; } = ProductionCancelStatus.Pending;
    public Guid? ApprovedById { get; set; }
    public User? ApprovedBy { get; set; }
    public DateTime? ApprovedDate { get; set; }
}

public enum ProductionCancelStatus
{
    Pending,
    Approved,
    Rejected
}
```

### 3. StockAdjustment
**Purpose:** Track stock adjustments with approval workflow

```csharp
public class StockAdjustment : BaseEntity
{
    public string AdjustmentNo { get; set; } = string.Empty; // Auto: PSA#######
    public DateTime AdjustmentDate { get; set; }
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public StockAdjustmentType AdjustmentType { get; set; }
    public decimal Quantity { get; set; }
    public string Reason { get; set; } = string.Empty;
    public StockAdjustmentStatus Status { get; set; } = StockAdjustmentStatus.Draft;
    public string? Notes { get; set; }
    public Guid? ApprovedById { get; set; }
    public User? ApprovedBy { get; set; }
    public DateTime? ApprovedDate { get; set; }
}

public enum StockAdjustmentType
{
    Increase,
    Decrease
}

public enum StockAdjustmentStatus
{
    Draft,
    Pending,
    Approved,
    Rejected
}
```

### 4. ProductionPlan
**Purpose:** Track production planning

```csharp
public class ProductionPlan : BaseEntity
{
    public string PlanNo { get; set; } = string.Empty; // Auto: PRJ#######
    public DateTime PlanDate { get; set; }
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public decimal PlannedQty { get; set; }
    public ProductionPriority Priority { get; set; } = ProductionPriority.Medium;
    public ProductionPlanStatus Status { get; set; } = ProductionPlanStatus.Draft;
    public string? Reference { get; set; }
    public string? Comment { get; set; }
    public string? Notes { get; set; }
    public Guid? ApprovedById { get; set; }
    public User? ApprovedBy { get; set; }
    public DateTime? ApprovedDate { get; set; }
}

public enum ProductionPriority
{
    Low,
    Medium,
    High
}

public enum ProductionPlanStatus
{
    Draft,
    Approved,
    InProgress,
    Completed
}
```

### 5. StockMovement (Computed View)
**Purpose:** Track all stock movements for current stock calculation

```csharp
// This is a DTO for computed view, not a stored entity
public class CurrentStockDto
{
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal OpenBalance { get; set; }
    public decimal TodayProduction { get; set; }
    public decimal TodayProductionCancelled { get; set; }
    public decimal TodayDelivery { get; set; }
    public decimal DeliveryCancelled { get; set; }
    public decimal DeliveryReturned { get; set; }
    public decimal TodayBalance { get; set; }
}
```

---

## Implementation Requirements

### Auto-Generated Numbers
Implement in `ApplicationDbContext.SaveChangesAsync()`:
- `PRO#######` for DailyProduction (7-digit sequential)
- `PCC#######` for ProductionCancel (7-digit sequential)
- `PSA#######` for StockAdjustment (7-digit sequential)
- `PRJ#######` for ProductionPlan (7-digit sequential)

### Status Workflows

**DailyProduction:**
```
Pending → Approved/Rejected (approve/reject)
```

**ProductionCancel:**
```
Pending → Approved/Rejected (approve/reject)
```

**StockAdjustment:**
```
Draft → Pending (submit) → Approved/Rejected (approve/reject)
```

**ProductionPlan:**
```
Draft → Approved → InProgress → Completed
```

### Relationships
- All entities reference `Product`
- All entities reference `User` for approvals
- StockAdjustment routes through `ApprovalQueue` (from Phase 4)

---

## API Endpoints Pattern (per entity)

### DailyProduction Endpoints
```
GET    /api/daily-productions                - List with pagination, filter by date/status
GET    /api/daily-productions/{id}           - Get by ID
POST   /api/daily-productions                - Create (Pending status)
PUT    /api/daily-productions/{id}           - Update (only if Pending)
DELETE /api/daily-productions/{id}           - Soft delete (only if Pending)
POST   /api/daily-productions/{id}/approve   - Approve (Pending → Approved)
POST   /api/daily-productions/{id}/reject    - Reject (Pending → Rejected)
```

### ProductionCancel Endpoints
```
GET    /api/production-cancels               - List with pagination
GET    /api/production-cancels/{id}          - Get by ID
POST   /api/production-cancels               - Create (Pending status)
PUT    /api/production-cancels/{id}          - Update (only if Pending)
DELETE /api/production-cancels/{id}          - Soft delete (only if Pending)
POST   /api/production-cancels/{id}/approve  - Approve
POST   /api/production-cancels/{id}/reject   - Reject
```

### StockAdjustment Endpoints
```
GET    /api/stock-adjustments                - List with pagination
GET    /api/stock-adjustments/{id}           - Get by ID
POST   /api/stock-adjustments                - Create (Draft status)
PUT    /api/stock-adjustments/{id}           - Update (only if Draft)
DELETE /api/stock-adjustments/{id}           - Soft delete (only if Draft)
POST   /api/stock-adjustments/{id}/submit    - Submit (Draft → Pending)
POST   /api/stock-adjustments/{id}/approve   - Approve (Pending → Approved)
POST   /api/stock-adjustments/{id}/reject    - Reject (Pending → Rejected)
```

### ProductionPlan Endpoints
```
GET    /api/production-plans                 - List with pagination
GET    /api/production-plans/{id}            - Get by ID
POST   /api/production-plans                 - Create (Draft status)
PUT    /api/production-plans/{id}            - Update
DELETE /api/production-plans/{id}            - Soft delete
POST   /api/production-plans/{id}/approve    - Approve
POST   /api/production-plans/{id}/start      - Start (Approved → InProgress)
POST   /api/production-plans/{id}/complete   - Complete (InProgress → Completed)
```

### Current Stock Endpoint (Computed)
```
GET    /api/current-stock                    - Get current stock for all products
GET    /api/current-stock/{productId}        - Get current stock for specific product
```

**Current Stock Calculation Logic:**
```
Today Balance = 
  Open Balance (from StockBF for latest date)
  + Today Production (from DailyProduction where Status = Approved)
  - Today Production Cancelled (from ProductionCancel where Status = Approved)
  - Today Delivery (from Delivery where Status = Approved)
  + Delivery Cancelled (from Cancellation where Status = Approved)
  + Delivery Returned (from DeliveryReturn where Status = Approved)
  + Stock Adjustments (from StockAdjustment where Status = Approved)
```

---

## Validation Rules

### DailyProduction
- ProductionDate must not be in day-lock
- PlannedQty and ProducedQty must be > 0
- Only Pending status can be updated/deleted
- Shift is required

### ProductionCancel
- CancelDate must not be in day-lock
- CancelledQty must be > 0
- ProductionNo reference must be valid
- Only Pending status can be updated/deleted

### StockAdjustment
- AdjustmentDate must not be in day-lock
- Quantity must be > 0
- Reason is required
- Only Draft status can be updated/deleted
- Routes through ApprovalQueue when submitted

### ProductionPlan
- PlanDate can be future dates
- PlannedQty must be > 0
- Status transitions must follow workflow

### Current Stock
- Read-only computed view
- No CRUD operations
- Aggregates from multiple sources

---

## Permissions (use existing patterns)

**DailyProduction:**
- `production:daily:view`, `production:daily:create`, `production:daily:update`, `production:daily:delete`, `production:daily:approve`

**ProductionCancel:**
- `production:cancel:view`, `production:cancel:create`, `production:cancel:update`, `production:cancel:delete`, `production:cancel:approve`

**StockAdjustment:**
- `production:stock-adjustment:view`, `production:stock-adjustment:create`, `production:stock-adjustment:update`, `production:stock-adjustment:delete`, `production:stock-adjustment:approve`

**ProductionPlan:**
- `production:plan:view`, `production:plan:create`, `production:plan:update`, `production:plan:delete`, `production:plan:approve`

**CurrentStock:**
- `production:current-stock:view`

---

## DayLockGuard Application

Apply `[DayLockGuard]` to:
- All DailyProduction POST/PUT/DELETE endpoints
- All ProductionCancel POST/PUT/DELETE endpoints
- All StockAdjustment POST/PUT/DELETE endpoints
- All status change endpoints (approve, reject, submit)

ProductionPlan does NOT need day-lock (can plan for future dates).

---

## Integration with Existing System

### StockAdjustment → ApprovalQueue
When StockAdjustment is submitted:
1. Create entry in `ApprovalQueue` table
2. Set `ApprovalType = "StockAdjustment"`
3. Link `EntityId` to `StockAdjustment.Id`
4. Status changes sync between StockAdjustment and ApprovalQueue

### Current Stock Calculation
Queries the following tables:
- `stock_bf` (Phase 6) - for open balance
- `daily_productions` (Phase 7) - for today's production
- `production_cancels` (Phase 7) - for cancelled production
- `deliveries` (Phase 6) - for today's delivery
- `cancellations` (Phase 6) - for delivery cancellations
- `delivery_returns` (Phase 6) - for returns
- `stock_adjustments` (Phase 7) - for adjustments

---

## Implementation Checklist

For each entity (DailyProduction, ProductionCancel, StockAdjustment, ProductionPlan):
1. ✅ Create entity class in `Models/Entities/`
2. ✅ Create enum for status/shift/priority in same file
3. ✅ Create DTOs: `{Entity}ListItemDto`, `{Entity}DetailDto`, `Create{Entity}Dto`, `Update{Entity}Dto`
4. ✅ Create validators: `Create{Entity}DtoValidator`, `Update{Entity}DtoValidator`
5. ✅ Create AutoMapper profile: `{Entity}Profile`
6. ✅ Create service interface: `I{Entity}Service`
7. ✅ Create service implementation: `{Entity}Service`
   - Include workflow methods where applicable
8. ✅ Create controller: `{Entity}Controller`
   - Apply `[HasPermission]`, `[Audit]`, `[DayLockGuard]`
9. ✅ Add `DbSet` in `ApplicationDbContext`
10. ✅ Configure entity relationships in `OnModelCreating`
11. ✅ Register service in `Program.cs`

For CurrentStock (computed view):
1. ✅ Create `CurrentStockDto`
2. ✅ Create `ICurrentStockService`
3. ✅ Create `CurrentStockService` with computation logic
4. ✅ Create `CurrentStockController`
5. ✅ Register service in `Program.cs`

---

## Database Configuration

### Indexes
- Index on: `ProductionNo`, `CancelNo`, `AdjustmentNo`, `PlanNo`
- Index on: `ProductionDate`, `CancelDate`, `AdjustmentDate`, `PlanDate`
- Index on: `ProductId` for all entities
- Index on: `Status` for all entities

### Relationships
- Configure cascade behaviors appropriately
- Restrict delete for referenced entities (Product, User)

---

## Expected Deliverables

### Backend Files
- **5 Entities** (4 stored + 1 DTO for computed view)
- **16 DTOs** (4 entities × 4 DTOs each)
- **8 Validators** (4 entities × 2 validators each)
- **5 AutoMapper Profiles** (4 entities + 1 computed view)
- **5 Service Interfaces**
- **5 Service Implementations**
- **5 Controllers**
- **1 Migration** (4 tables created)
- **Program.cs** updated
- **ApplicationDbContext** updated with auto-number generation

### API Endpoints
- **DailyProduction:** 7 endpoints
- **ProductionCancel:** 7 endpoints
- **StockAdjustment:** 8 endpoints
- **ProductionPlan:** 9 endpoints
- **CurrentStock:** 2 endpoints
- **Total:** 33 endpoints

### Database Tables
- `daily_productions`
- `production_cancels`
- `stock_adjustments`
- `production_plans`

---

## Notes

- Follow Phase 6 patterns for: nullable returns, exception handling, Guid IDs, audit logging
- Use `decimal(18,4)` for quantities
- All responses use `ApiResponse<T>` envelope
- All services return DTOs or null, throw `InvalidOperationException` for errors
- Controllers use `try-catch` to convert exceptions to `ApiResponse` errors
- ApprovalQueue integration for StockAdjustment only
- Current Stock is computed on-demand, not stored

---

**Created:** April 29, 2026  
**Phase:** 7 - Production & Stock  
**Status:** Ready for Implementation
