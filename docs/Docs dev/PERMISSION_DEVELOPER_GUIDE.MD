# Permission System Developer Guide

## Overview

The DMS permission system uses a claim-based authorization model where:
1. Permissions are stored in the database with unique `Code` values
2. User permissions are loaded as JWT claims during login
3. Controllers check these claims using `[HasPermission("code")]` attributes
4. **CRITICAL**: Permission codes in database MUST exactly match controller attribute strings

## Permission Code Format

### Standard Format: `module:feature:action`

Examples:
- `inventory:view` - View inventory items
- `order:create` - Create orders
- `production:daily:approve` - Approve daily production
- `operation:delivery:update` - Update deliveries

### Naming Conventions

1. **Use colon notation** (`:`) not dots (`.`)
   - ✓ Correct: `production:daily:view`
   - ✗ Wrong: `production.daily.view`

2. **Use lowercase**
   - ✓ Correct: `users:create`
   - ✗ Wrong: `Users:Create`

3. **Use hyphens for multi-word features**
   - ✓ Correct: `operation:stock-bf:view`
   - ✓ Correct: `delivery-plan:create`
   - ✗ Wrong: `operation:stock_bf:view`

4. **Common action names**
   - `view` / `read` - Read/list operations
   - `create` - Create new records
   - `update` / `edit` - Modify existing records
   - `delete` - Remove records
   - `approve` - Approval operations (often includes reject)
   - `execute` / `perform` - Execute special operations

## Adding Permissions to a New Controller

### Step 1: Define Permission Codes

Decide on permission codes for your controller. Follow the pattern:

```
module:feature:action
```

Example for a new `InvoicesController`:

```
invoices:view      - List/view invoices
invoices:create    - Create new invoices
invoices:edit      - Edit existing invoices
invoices:delete    - Delete invoices
invoices:approve   - Approve/reject invoices
invoices:print     - Print invoices
```

### Step 2: Add Permissions to Seeder

Edit `ComprehensivePermissionSeeder.cs` and add your permissions:

```csharp
// In SeedAsync method, add new section:

// ============================================================
// DMS MODULE - Invoices
// ============================================================
permissions.AddRange(CreatePermissionsFromCodes("DMS", "Invoices", new[]
{
    ("invoices:view", "View", "View invoices and invoice details"),
    ("invoices:create", "Create", "Create new invoices"),
    ("invoices:edit", "Update", "Update existing invoices"),
    ("invoices:delete", "Delete", "Delete invoices"),
    ("invoices:approve", "Approve", "Approve/reject invoices"),
    ("invoices:print", "Print", "Print invoice documents")
}));
```

### Step 3: Add Attributes to Controller

Add `[HasPermission("code")]` to each endpoint:

```csharp
[ApiController]
[Route("api/invoices")]
[Authorize] // Always add Authorize at class level
public class InvoicesController : ControllerBase
{
    [HttpGet]
    [HasPermission("invoices:view")]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        // Implementation
    }

    [HttpGet("{id:guid}")]
    [HasPermission("invoices:view")]
    public async Task<ActionResult<ApiResponse<InvoiceDetailDto>>> GetById(Guid id)
    {
        // Implementation
    }

    [HttpPost]
    [HasPermission("invoices:create")]
    [Audit] // Add audit logging for write operations
    public async Task<ActionResult<ApiResponse<InvoiceDetailDto>>> Create(
        [FromBody] CreateInvoiceDto dto)
    {
        // Implementation
    }

    [HttpPut("{id:guid}")]
    [HasPermission("invoices:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<InvoiceDetailDto>>> Update(
        Guid id,
        [FromBody] UpdateInvoiceDto dto)
    {
        // Implementation
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("invoices:delete")]
    [Audit]
    public async Task<ActionResult<ApiResponse<object>>> Delete(Guid id)
    {
        // Implementation
    }

    [HttpPost("{id:guid}/approve")]
    [HasPermission("invoices:approve")]
    [Audit]
    public async Task<ActionResult<ApiResponse<InvoiceDetailDto>>> Approve(Guid id)
    {
        // Implementation
    }

    [HttpPost("{id:guid}/reject")]
    [HasPermission("invoices:approve")] // Same permission as approve
    [Audit]
    public async Task<ActionResult<ApiResponse<InvoiceDetailDto>>> Reject(
        Guid id,
        [FromBody] RejectDto dto)
    {
        // Implementation
    }

    [HttpGet("{id:guid}/print")]
    [HasPermission("invoices:print")]
    public async Task<IActionResult> Print(Guid id)
    {
        // Implementation
    }
}
```

### Step 4: Clear and Reseed Permissions

```bash
# In pgAdmin, run:
psql -h localhost -U your_user -d your_db -f clear_permissions.sql

# Then restart your application to seed new permissions
cd DMS-Backend
dotnet run
```

### Step 5: Verify Permissions

```bash
# In pgAdmin, run:
psql -h localhost -U your_user -d your_db -f verify_permissions.sql
```

### Step 6: Assign to Roles

Either use the admin UI or run SQL:

```sql
-- Assign invoice permissions to Manager role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'Manager'),
    id
FROM permissions
WHERE code LIKE 'invoices:%';
```

## Common Patterns

### Pattern 1: Standard CRUD

```csharp
[HttpGet] → [HasPermission("feature:view")]
[HttpGet("{id}")] → [HasPermission("feature:view")]
[HttpPost] → [HasPermission("feature:create")]
[HttpPut("{id}")] → [HasPermission("feature:edit")] or [HasPermission("feature:update")]
[HttpDelete("{id}")] → [HasPermission("feature:delete")]
```

### Pattern 2: Workflow Actions

```csharp
[HttpPost("{id}/submit")] → [HasPermission("feature:update")] // Use update permission
[HttpPost("{id}/approve")] → [HasPermission("feature:approve")]
[HttpPost("{id}/reject")] → [HasPermission("feature:approve")] // Reuse approve permission
```

### Pattern 3: Bulk Operations

```csharp
[HttpPost("bulk")] → [HasPermission("feature:create")]
[HttpPost("bulk-upsert")] → [HasPermission("feature:edit")]
[HttpDelete("bulk")] → [HasPermission("feature:delete")]
```

### Pattern 4: Special Operations

```csharp
[HttpPost("compute")] → [HasPermission("feature:create")] or dedicated compute permission
[HttpPost("{id}/process")] → [HasPermission("feature:execute")]
[HttpGet("export")] → [HasPermission("feature:export")]
[HttpPost("import")] → [HasPermission("feature:import")]
```

## Permission Reuse vs. Specific Permissions

### When to Reuse

Reuse permission codes when operations are logically grouped:

✓ **Good reuse examples:**
- `inventory:view` for Products, Categories, UoMs, Ingredients
- `system:view` for all system configuration screens
- `reports:view` for all report types

### When to Create Specific

Create specific permissions when you need fine-grained control:

✓ **Good specific examples:**
- `production:daily:approve` vs `production:plan:approve`
- `operation:delivery:approve` vs `operation:transfer:approve`
- `users:reset-password` vs `users:update`

## Testing Permissions

### 1. Unit Tests

```csharp
[Fact]
public void Controller_HasPermissionAttributes()
{
    // Verify all endpoints have HasPermission attributes
    var controller = typeof(InvoicesController);
    var methods = controller.GetMethods()
        .Where(m => m.GetCustomAttributes<HttpMethodAttribute>().Any());
    
    foreach (var method in methods)
    {
        var hasPermission = method.GetCustomAttribute<HasPermissionAttribute>();
        Assert.NotNull(hasPermission); // All endpoints should have permission
    }
}
```

### 2. Integration Tests

```csharp
[Fact]
public async Task CreateInvoice_WithoutPermission_Returns403()
{
    // Create user without invoices:create permission
    var token = await GetTokenForUserWithoutPermission("invoices:create");
    
    var response = await _client.PostAsync("/api/invoices", 
        new StringContent("{}", Encoding.UTF8, "application/json"),
        token);
    
    Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
}

[Fact]
public async Task CreateInvoice_WithPermission_Returns201()
{
    // Create user with invoices:create permission
    var token = await GetTokenForUserWithPermission("invoices:create");
    
    var response = await _client.PostAsync("/api/invoices", 
        new StringContent("{...}", Encoding.UTF8, "application/json"),
        token);
    
    Assert.Equal(HttpStatusCode.Created, response.StatusCode);
}
```

### 3. Manual Testing

```bash
# 1. Login as test user
POST /api/Auth/login
{
  "email": "test@example.com",
  "password": "password"
}

# 2. Decode JWT token (use jwt.io)
# Verify "permission" claims include expected codes

# 3. Test endpoint with token
GET /api/invoices
Authorization: Bearer {token}

# 4. Should return 200 if permission exists, 403 if not
```

## Troubleshooting

### Problem: Getting 403 Forbidden

**Check:**
1. Does permission exist in database?
   ```sql
   SELECT * FROM permissions WHERE code = 'your:permission:code';
   ```

2. Is permission assigned to user's role?
   ```sql
   SELECT p.code, r.name 
   FROM permissions p
   JOIN role_permissions rp ON p.id = rp.permission_id
   JOIN roles r ON rp.role_id = r.id
   WHERE p.code = 'your:permission:code';
   ```

3. Is user assigned to the role?
   ```sql
   SELECT u.email, r.name
   FROM users u
   JOIN user_roles ur ON u.id = ur.user_id
   JOIN roles r ON ur.role_id = r.id
   WHERE u.email = 'user@example.com';
   ```

4. Does permission code exactly match attribute?
   ```csharp
   // Controller
   [HasPermission("invoices:view")] ← must match exactly
   
   // Database
   code = 'invoices:view' ← must match exactly
   ```

### Problem: Permission exists but still 403

**Check:**
1. User needs to re-login to get updated permissions in JWT
2. Role must be active (`is_active = true`)
3. User must be active (`is_active = true`)

### Problem: All users getting 403

**Check:**
1. Permission codes use colon notation (`:`) not dots (`.`)
   ```sql
   -- Check for incorrect dot notation
   SELECT code FROM permissions WHERE code LIKE '%.%' AND code NOT LIKE '%:%';
   ```

2. If found, clear and reseed:
   ```bash
   psql -f clear_permissions.sql
   # Restart app
   psql -f verify_permissions.sql
   ```

## Best Practices

### 1. Always Add [Authorize] at Controller Level

```csharp
[ApiController]
[Route("api/feature")]
[Authorize] ← Always add this
public class FeatureController : ControllerBase
```

### 2. Use [AllowAnonymous] for Public Endpoints

```csharp
[HttpPost("login")]
[AllowAnonymous] ← Override authorization for public endpoints
public async Task<ActionResult> Login(...)
```

### 3. Group Related Permissions

```csharp
// Good: Related features use same base
operation:delivery:view
operation:delivery:create
operation:delivery:update
operation:delivery:approve

// Avoid: Inconsistent naming
delivery:view
create-delivery
update_delivery
delivery-approve
```

### 4. Document Permissions in Controller

```csharp
/// <summary>
/// Invoice management endpoints
/// Required permissions:
/// - invoices:view - View invoice list and details
/// - invoices:create - Create new invoices
/// - invoices:edit - Edit existing invoices
/// - invoices:delete - Delete invoices
/// - invoices:approve - Approve/reject invoices
/// </summary>
[ApiController]
[Route("api/invoices")]
public class InvoicesController : ControllerBase
```

### 5. Use Descriptive Permission Names

```csharp
// Good
CreatePermissionsFromCodes("DMS", "Invoices", new[]
{
    ("invoices:view", "View", "View invoices and invoice details"),
    ("invoices:create", "Create", "Create new invoices")
});

// Avoid
CreatePermissionsFromCodes("DMS", "Invoices", new[]
{
    ("invoices:view", "View", "View"), // Too generic
    ("invoices:create", "Create", "Create") // Too generic
});
```

## Quick Reference

### Permission Code Checklist
- [ ] Uses colon notation (`:`)
- [ ] All lowercase
- [ ] Follows `module:feature:action` pattern
- [ ] Unique and descriptive
- [ ] Added to seeder
- [ ] Controller has `[Authorize]`
- [ ] All endpoints have `[HasPermission("...")]`
- [ ] Codes match exactly between seeder and controller
- [ ] Permissions seeded to database
- [ ] Assigned to appropriate roles
- [ ] Tested with user login

### Common Commands

```bash
# Clear permissions
psql -f clear_permissions.sql

# Verify permissions
psql -f verify_permissions.sql

# Reassign permissions
psql -f reassign_permissions.sql

# Check specific permission
psql -c "SELECT * FROM permissions WHERE code = 'feature:action';"

# Check user permissions
psql -c "SELECT p.code FROM permissions p 
         JOIN role_permissions rp ON p.id = rp.permission_id
         JOIN user_roles ur ON rp.role_id = ur.role_id
         WHERE ur.user_id = 'user-guid-here';"
```

---

**Last Updated**: 2026-04-29  
**For questions**: Review `CRITICAL_PERMISSION_FIX.md`
