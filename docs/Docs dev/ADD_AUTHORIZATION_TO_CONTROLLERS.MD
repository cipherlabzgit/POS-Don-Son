# Controllers Requiring Authorization

## ⚠️ SECURITY CRITICAL - UNPROTECTED ENDPOINTS

The following 6 controllers have **NO authorization** and are currently **publicly accessible**. This is a critical security vulnerability that must be fixed immediately.

All suggested permission codes have already been added to `ComprehensivePermissionSeeder.cs`.

---

## 1. ProductionPlannersController

**Location**: `DMS-Backend/Controllers/ProductionPlannersController.cs`

**Current Status**: ❌ No authorization  
**Risk Level**: HIGH - Exposes production planning data and operations

### Required Changes

```csharp
[ApiController]
[Route("api/production-planners")]
[Authorize] // ← ADD THIS
public class ProductionPlannersController : ControllerBase
{
    [HttpPost("compute")]
    [HasPermission("production-planner:create")] // ← ADD THIS
    [Audit]
    public async Task<ActionResult<ApiResponse<ProductionPlannerComputeResultDto>>> ComputePlan(
        [FromBody] ComputeProductionPlanDto dto,
        CancellationToken cancellationToken = default)
    {
        // ...
    }

    [HttpPost]
    [HasPermission("production-planner:create")] // ← ADD THIS
    [Audit]
    public async Task<ActionResult<ApiResponse<ProductionPlannerDetailDto>>> Create(
        [FromBody] CreateProductionPlannerDto dto,
        CancellationToken cancellationToken = default)
    {
        // ...
    }

    [HttpGet("{id:guid}")]
    [HasPermission("production-planner:view")] // ← ADD THIS
    public async Task<ActionResult<ApiResponse<ProductionPlannerDetailDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        // ...
    }

    [HttpGet("by-delivery-plan/{deliveryPlanId:guid}")]
    [HasPermission("production-planner:view")] // ← ADD THIS
    public async Task<ActionResult<ApiResponse<ProductionPlannerDetailDto>>> GetByDeliveryPlanId(
        Guid deliveryPlanId,
        CancellationToken cancellationToken = default)
    {
        // ...
    }

    [HttpGet]
    [HasPermission("production-planner:view")] // ← ADD THIS
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? searchTerm = null,
        CancellationToken cancellationToken = default)
    {
        // ...
    }

    [HttpPut("{id:guid}")]
    [HasPermission("production-planner:update")] // ← ADD THIS
    [Audit]
    public async Task<ActionResult<ApiResponse<ProductionPlannerDetailDto>>> Update(
        Guid id,
        [FromBody] UpdateProductionPlannerDto dto,
        CancellationToken cancellationToken = default)
    {
        // ...
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("production-planner:delete")] // ← ADD THIS
    [Audit]
    public async Task<ActionResult<ApiResponse<object>>> Delete(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        // ...
    }

    [HttpPost("adjustments")]
    [HasPermission("production-planner:update")] // ← ADD THIS (or create dedicated adjustment permission)
    [Audit]
    public async Task<ActionResult<ApiResponse<ProductionPlannerDetailDto>>> ApplyAdjustments(
        [FromBody] ApplyAdjustmentsDto dto,
        CancellationToken cancellationToken = default)
    {
        // ...
    }
}
```

### Permissions Already Added to Seeder
- `production-planner:view`
- `production-planner:create`
- `production-planner:update`
- `production-planner:delete`

---

## 2. StoresIssueNotesController

**Location**: `DMS-Backend/Controllers/StoresIssueNotesController.cs`

**Current Status**: ❌ No authorization  
**Risk Level**: HIGH - Exposes stores inventory operations

### Required Changes

```csharp
[ApiController]
[Route("api/stores-issue-notes")]
[Authorize] // ← ADD THIS
public class StoresIssueNotesController : ControllerBase
{
    [HttpPost("compute")]
    [HasPermission("stores-issue-note:create")] // ← ADD THIS
    [Audit]
    public async Task<ActionResult<ApiResponse<StoresIssueNoteComputeResultDto>>> ComputeNote(
        [FromBody] ComputeStoresIssueNoteDto dto,
        CancellationToken cancellationToken = default)
    {
        // ...
    }

    [HttpPost]
    [HasPermission("stores-issue-note:create")] // ← ADD THIS
    [Audit]
    [DayLockGuard] // If applicable
    public async Task<ActionResult<ApiResponse<StoresIssueNoteDetailDto>>> Create(
        [FromBody] CreateStoresIssueNoteDto dto,
        CancellationToken cancellationToken = default)
    {
        // ...
    }

    [HttpGet("{id:guid}")]
    [HasPermission("stores-issue-note:view")] // ← ADD THIS
    public async Task<ActionResult<ApiResponse<StoresIssueNoteDetailDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        // ...
    }

    [HttpGet("by-section")]
    [HasPermission("stores-issue-note:view")] // ← ADD THIS
    public async Task<ActionResult<ApiResponse<List<StoresIssueNoteListDto>>>> GetBySection(
        [FromQuery] Guid sectionId,
        [FromQuery] DateTime? forDate = null,
        CancellationToken cancellationToken = default)
    {
        // ...
    }

    [HttpGet]
    [HasPermission("stores-issue-note:view")] // ← ADD THIS
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? searchTerm = null,
        CancellationToken cancellationToken = default)
    {
        // ...
    }

    [HttpPut("{id:guid}")]
    [HasPermission("stores-issue-note:update")] // ← ADD THIS
    [Audit]
    [DayLockGuard] // If applicable
    public async Task<ActionResult<ApiResponse<StoresIssueNoteDetailDto>>> Update(
        Guid id,
        [FromBody] UpdateStoresIssueNoteDto dto,
        CancellationToken cancellationToken = default)
    {
        // ...
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("stores-issue-note:delete")] // ← ADD THIS
    [Audit]
    [DayLockGuard] // If applicable
    public async Task<ActionResult<ApiResponse<object>>> Delete(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        // ...
    }

    [HttpPost("{id:guid}/issue")]
    [HasPermission("stores-issue-note:execute")] // ← ADD THIS
    [Audit]
    [DayLockGuard] // If applicable
    public async Task<ActionResult<ApiResponse<StoresIssueNoteDetailDto>>> IssueNote(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        // ...
    }

    [HttpPost("{id:guid}/receive")]
    [HasPermission("stores-issue-note:execute")] // ← ADD THIS
    [Audit]
    [DayLockGuard] // If applicable
    public async Task<ActionResult<ApiResponse<StoresIssueNoteDetailDto>>> ReceiveNote(
        Guid id,
        [FromBody] ReceiveStoresIssueNoteDto dto,
        CancellationToken cancellationToken = default)
    {
        // ...
    }
}
```

### Permissions Already Added to Seeder
- `stores-issue-note:view`
- `stores-issue-note:create`
- `stores-issue-note:update`
- `stores-issue-note:delete`
- `stores-issue-note:execute`

---

## 3. ReconciliationsController

**Location**: `DMS-Backend/Controllers/ReconciliationsController.cs`

**Current Status**: ❌ No authorization  
**Risk Level**: HIGH - Exposes financial reconciliation data

### Required Changes

```csharp
[ApiController]
[Route("api/reconciliations")]
[Authorize] // ← ADD THIS
public class ReconciliationsController : ControllerBase
{
    [HttpPost]
    [HasPermission("reconciliation:perform")] // ← ADD THIS
    [Audit]
    public async Task<ActionResult<ApiResponse<ReconciliationDetailDto>>> Create(
        [FromBody] CreateReconciliationDto dto,
        CancellationToken cancellationToken = default)
    {
        // ...
    }

    [HttpGet("{id:guid}")]
    [HasPermission("reconciliation:view")] // ← ADD THIS
    public async Task<ActionResult<ApiResponse<ReconciliationDetailDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        // ...
    }

    [HttpGet("by-outlet")]
    [HasPermission("reconciliation:view")] // ← ADD THIS
    public async Task<ActionResult<ApiResponse<List<ReconciliationListDto>>>> GetByOutlet(
        [FromQuery] Guid outletId,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        // ...
    }

    [HttpGet]
    [HasPermission("reconciliation:view")] // ← ADD THIS
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? searchTerm = null,
        CancellationToken cancellationToken = default)
    {
        // ...
    }

    [HttpPut("{id:guid}")]
    [HasPermission("reconciliation:perform")] // ← ADD THIS
    [Audit]
    public async Task<ActionResult<ApiResponse<ReconciliationDetailDto>>> Update(
        Guid id,
        [FromBody] UpdateReconciliationDto dto,
        CancellationToken cancellationToken = default)
    {
        // ...
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("reconciliation:perform")] // ← ADD THIS
    [Audit]
    public async Task<ActionResult<ApiResponse<object>>> Delete(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        // ...
    }

    [HttpPut("{id:guid}/actual-quantities")]
    [HasPermission("reconciliation:perform")] // ← ADD THIS
    [Audit]
    public async Task<ActionResult<ApiResponse<ReconciliationDetailDto>>> UpdateActualQuantities(
        Guid id,
        [FromBody] UpdateActualQuantitiesDto dto,
        CancellationToken cancellationToken = default)
    {
        // ...
    }

    [HttpPost("{id:guid}/submit")]
    [HasPermission("reconciliation:perform")] // ← ADD THIS
    [Audit]
    public async Task<ActionResult<ApiResponse<ReconciliationDetailDto>>> Submit(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        // ...
    }
}
```

### Permissions Already Added to Seeder
- `reconciliation:view`
- `reconciliation:perform`

---

## 4. DashboardPivotController

**Location**: `DMS-Backend/Controllers/DashboardPivotController.cs`

**Current Status**: ❌ No authorization  
**Risk Level**: MEDIUM - Exposes business analytics data

### Required Changes

```csharp
[ApiController]
[Route("api/dashboard-pivot")]
[Authorize] // ← ADD THIS
public class DashboardPivotController : ControllerBase
{
    [HttpGet]
    [HasPermission("dashboard-pivot:view")] // ← ADD THIS
    public async Task<ActionResult<ApiResponse<DashboardPivotDto>>> GetDashboardData(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] Guid? outletId = null,
        CancellationToken cancellationToken = default)
    {
        // ...
    }
}
```

### Permissions Already Added to Seeder
- `dashboard-pivot:view`

---

## 5. DeliverySummaryController

**Location**: `DMS-Backend/Controllers/DeliverySummaryController.cs`

**Current Status**: ❌ No authorization  
**Risk Level**: MEDIUM - Exposes delivery summary reports

### Required Changes

```csharp
[ApiController]
[Route("api/delivery-summary")]
[Authorize] // ← ADD THIS
public class DeliverySummaryController : ControllerBase
{
    [HttpGet]
    [HasPermission("delivery-summary:view")] // ← ADD THIS
    public async Task<ActionResult<ApiResponse<DeliverySummaryDto>>> GetSummary(
        [FromQuery] DateTime? date = null,
        [FromQuery] Guid? deliveryTurnId = null,
        [FromQuery] Guid? outletId = null,
        CancellationToken cancellationToken = default)
    {
        // ...
    }
}
```

### Permissions Already Added to Seeder
- `delivery-summary:view`

---

## 6. PrintController

**Location**: `DMS-Backend/Controllers/PrintController.cs`

**Current Status**: ❌ No authorization  
**Risk Level**: MEDIUM - Exposes print functionality

### Required Changes

```csharp
[ApiController]
[Route("api/print")]
[Authorize] // ← ADD THIS
public class PrintController : ControllerBase
{
    [HttpGet("receipt-cards")]
    [HasPermission("print:receipt-cards")] // ← ADD THIS
    public async Task<IActionResult> GetReceiptCards(
        [FromQuery] DateTime? date = null,
        [FromQuery] Guid? deliveryTurnId = null,
        [FromQuery] Guid? outletId = null,
        CancellationToken cancellationToken = default)
    {
        // ...
    }

    [HttpGet("section-bundle")]
    [HasPermission("print:section-bundle")] // ← ADD THIS
    public async Task<IActionResult> GetSectionBundle(
        [FromQuery] DateTime? date = null,
        [FromQuery] Guid? sectionId = null,
        CancellationToken cancellationToken = default)
    {
        // ...
    }
}
```

### Permissions Already Added to Seeder
- `print:receipt-cards`
- `print:section-bundle`

---

## Implementation Checklist

For each controller above:

- [ ] Add `[Authorize]` attribute at class level
- [ ] Add `[HasPermission("code")]` to each endpoint
- [ ] Add `[Audit]` to write operations (POST, PUT, DELETE)
- [ ] Add `[DayLockGuard]` if operation should respect day lock
- [ ] Verify permission codes match seeder exactly
- [ ] Test with user without permission (should get 403)
- [ ] Test with user with permission (should work)
- [ ] Update API documentation if applicable

## Quick Apply Commands

### Option 1: Manual - Edit Each File

Use your IDE to open each controller and add the attributes as shown above.

### Option 2: Verify Missing Authorization

Run this to find controllers without authorization:

```bash
cd DMS-Backend/Controllers
grep -L "\[Authorize\]" *.cs
```

### Option 3: After Changes - Verify All Protected

```bash
cd DMS-Backend/Controllers
grep -L "HasPermission\|AllowAnonymous" *.cs | grep -v "AuthController.cs"
```

If any files are listed, they need permission attributes added (except AuthController which has AllowAnonymous).

## Testing After Implementation

### 1. Create Test User Without Permissions

```sql
INSERT INTO users (id, email, password_hash, is_active, created_at, updated_at)
VALUES (gen_random_uuid(), 'test-noperm@example.com', 'hash', true, NOW(), NOW());
```

### 2. Test Each Endpoint

```bash
# Login as test user
curl -X POST http://localhost:5000/api/Auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test-noperm@example.com","password":"password"}'

# Try accessing protected endpoint
curl -X GET http://localhost:5000/api/production-planners \
  -H "Authorization: Bearer {token}"

# Should return 403 Forbidden
```

### 3. Assign Permission and Retest

```sql
-- Create role with permission
INSERT INTO roles (id, name, is_active, created_at, updated_at)
VALUES (gen_random_uuid(), 'Test Role', true, NOW(), NOW());

-- Assign permission
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'Test Role'),
    id
FROM permissions
WHERE code = 'production-planner:view';

-- Assign role to user
INSERT INTO user_roles (user_id, role_id)
VALUES (
    (SELECT id FROM users WHERE email = 'test-noperm@example.com'),
    (SELECT id FROM roles WHERE name = 'Test Role')
);
```

```bash
# Login again to get new token with permissions
curl -X POST http://localhost:5000/api/Auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test-noperm@example.com","password":"password"}'

# Try accessing protected endpoint again
curl -X GET http://localhost:5000/api/production-planners \
  -H "Authorization: Bearer {new_token}"

# Should return 200 OK with data
```

## Priority Order

Fix in this order based on risk level:

1. **HIGH PRIORITY** (Security Critical):
   - ✓ ProductionPlannersController
   - ✓ StoresIssueNotesController
   - ✓ ReconciliationsController

2. **MEDIUM PRIORITY** (Data Exposure):
   - ✓ DashboardPivotController
   - ✓ DeliverySummaryController
   - ✓ PrintController

## Notes

- **All permissions have already been added to the seeder** - you just need to add the attributes to controllers
- Use the exact permission codes shown above to match the seeder
- After adding attributes, clear and reseed permissions, then reassign to roles
- Test thoroughly before deploying to production

---

**Created**: 2026-04-29  
**Status**: Requires Implementation  
**Estimated Time**: 30-60 minutes
