# 🔒 Apply RBAC to All Pages - Implementation Guide

## Overview

This guide shows how to systematically protect every page in your application with Role-Based Access Control (RBAC). Users will only be able to access pages they have permissions for.

## Current Status

✅ **Menu Filtering**: Already implemented - users only see menu items they have access to  
✅ **RBAC Components**: All helper components created  
⚠️ **Page Protection**: Needs to be applied to all 185+ pages

## Step-by-Step Implementation

### 1. Page Protection Pattern

Every page should follow this pattern:

```tsx
'use client';

import { ProtectedPage } from '@/components/auth';
// ... other imports

export default function YourPage() {
  return (
    <ProtectedPage 
      permission="your.permission.code"
      fallbackPath="/dashboard"
    >
      {/* Your existing page content */}
    </ProtectedPage>
  );
}
```

### 2. Permission Mapping (From menu-items.ts)

Use these exact permission codes for each page:

#### Dashboard
- `/dashboard` → No permission needed (accessible to all logged-in users)

#### Inventory
- `/inventory/products` → `inventory.products.view`
- `/inventory/category` → `inventory.category.view`
- `/inventory/uom` → `inventory.uom.view`
- `/inventory/ingredient` → `inventory.ingredient.view`

#### Showroom
- `/showroom` → `showroom.view`

#### Operation
- `/operation/delivery` → `operation.delivery.view`
- `/operation/delivery-approval` → `operation.delivery.approve`
- `/operation/disposal` → `operation.disposal.view`
- `/operation/transfer` → `operation.transfer.view`
- `/operation/stock-bf` → `operation.stock-bf.view`
- `/operation/cancellation` → `operation.cancellation.view`
- `/operation/delivery-return` → `operation.delivery-return.view`
- `/operation/label-printing` → `operation.label-printing.view`
- `/operation/showroom-open-stock` → `operation.showroom-open-stock.view`
- `/operation/showroom-label-printing` → `operation.showroom-label-printing.view`

#### Production
- `/production/daily-production` → `production.daily.view`
- `/production/production-cancel` → `production.cancel.view`
- `/production/current-stock` → `production.stock.view`
- `/production/stock-adjustment` → `production.adjustment.view`
- `/production/stock-adjustment-approval` → `production.adjustment-approval.view`
- `/production/production-plan` → `production.plan.view`

#### DMS
- `/dms/order-entry-enhanced` → `dms.order-entry.view`
- `/dms/delivery-plan` → `dms.delivery-plan.view`
- `/dms/delivery-summary` → `dms.delivery-summary.view`
- `/dms/immediate-orders` → `dms.immediate-orders.view`
- `/dms/default-quantities` → `dms.default-quantities.view`
- `/dms/production-planner-enhanced` → `dms.production-planner.view`
- `/dms/stores-issue-note-enhanced` → `dms.stores-issue-note.view`
- `/dms/recipe-management` → `dms.recipe-management.view`
- `/dms/recipe-templates` → `dms.recipe-templates.view`
- `/dms/freezer-stock` → `dms.freezer-stock.view`
- `/dms/anytime-recipe-generator` → `dms.anytime-recipe.view`
- `/dms/dough-generator/patties` → `dms.dough.view`
- `/dms/dough-generator/rotty` → `dms.dough.view`
- `/dms/dashboard-pivot` → `dms.dashboard-pivot.view`
- `/dms/print-receipt-cards` → `dms.print.view`
- `/dms/section-print-bundle` → `dms.print.view`
- `/dms/dms-recipe-upload` → `dms.export.view`
- `/dms/reconciliation` → `dms.reconciliation.view`
- `/dms/importer` → `dms.importer.view`

#### Reports
- `/reports` → `reports.view`

#### Administrator
- `/administrator/day-end-process` → `administrator.day-end.view`
- `/administrator/cashier-balance` → `administrator.cashier-balance.view`
- `/administrator/system-settings` → `administrator.settings.view`
- `/administrator/label-settings` → `administrator.label-settings.view`
- `/administrator/delivery-plan` → `administrator.delivery-plan.view`
- `/administrator/security` → `administrator.security.view`
- `/administrator/users` → `administrator.users.view`
- `/administrator/roles` → `administrator.roles.view`
- `/administrator/permissions` → `administrator.permissions.view`
- `/administrator/day-lock` → `administrator.day-lock.view`
- `/administrator/approvals` → `administrator.approvals.view`
- `/administrator/showroom-employee` → `administrator.showroom-employee.view`
- `/administrator/price-manager` → `administrator.price-manager.view`
- `/administrator/workflow-config` → `administrator.workflow-config.view`
- `/administrator/grid-configuration` → `administrator.grid-config.view`
- `/administrator/day-types` → `administrator.day-types.view`
- `/administrator/delivery-turns` → `administrator.delivery-turns.view`
- `/administrator/rounding-rules` → `administrator.rounding.view`
- `/administrator/section-consumables` → `administrator.consumables.view`
- `/administrator/label-templates` → `administrator.label-templates.view`

### 3. Special Cases

#### Add/Edit Pages

For add/edit pages, use more specific permissions:

```tsx
// Add pages - require create permission
<ProtectedPage permission="inventory.products.create">

// Edit pages - require update permission  
<ProtectedPage permission="inventory.products.update">

// Approval pages - require approve permission
<ProtectedPage permission="operation.delivery.approve">
```

#### Public/Semi-Public Pages

Some pages might be accessible to all logged-in users:

```tsx
// No permission needed - just authentication check
<ProtectedPage permission={undefined} requireAuth={true}>
```

### 4. Implementation Priority

Implement RBAC in this order:

#### Phase 1: Critical Pages (Do First)
1. ✅ Administrator pages (Users, Roles, Permissions)
2. ✅ Approval pages (Delivery Approval, Stock Adjustment Approval)
3. Operation pages (Delivery, Disposal, Transfer)
4. Production pages (Daily Production, Stock Adjustment)

#### Phase 2: Business Logic Pages
5. DMS pages (Order Entry, Delivery Plan, etc.)
6. Inventory pages (Products, Category, UOM, Ingredient)
7. Showroom pages

#### Phase 3: Utility Pages
8. Reports
9. Settings and Configuration pages

### 5. Quick Implementation Script

Use this pattern to update each page:

```tsx
// BEFORE (unprotected)
export default function ProductsPage() {
  return (
    <div>
      {/* content */}
    </div>
  );
}

// AFTER (protected)
'use client';

import { ProtectedPage } from '@/components/auth';

export default function ProductsPage() {
  return (
    <ProtectedPage permission="inventory.products.view">
      <div>
        {/* content */}
      </div>
    </ProtectedPage>
  );
}
```

### 6. Button-Level Permissions

For buttons within pages, use `PermissionButton`:

```tsx
import { PermissionButton } from '@/components/auth';

// Create button
<PermissionButton 
  permission="inventory.products.create"
  onClick={handleCreate}
>
  Add New Product
</PermissionButton>

// Edit button
<PermissionButton 
  permission="inventory.products.update"
  onClick={() => router.push(`/inventory/products/edit/${id}`)}
>
  Edit
</PermissionButton>

// Delete button
<PermissionButton 
  permission="inventory.products.delete"
  onClick={handleDelete}
  variant="destructive"
>
  Delete
</PermissionButton>
```

### 7. Section-Level Permissions

Hide entire sections based on permissions:

```tsx
import { PermissionGuard } from '@/components/auth';

<PermissionGuard permission="inventory.products.update">
  <div className="edit-section">
    {/* Only visible to users with update permission */}
  </div>
</PermissionGuard>
```

### 8. Workflow-Based Permissions

For approval workflows:

```tsx
import { WorkflowButtons } from '@/components/auth';

<WorkflowButtons
  itemStatus={delivery.status}
  onSubmit={handleSubmit}
  onApprove={handleApprove}
  onReject={handleReject}
  submitPermission="operation.delivery.create"
  approvePermission="operation.delivery.approve"
/>
```

## Testing Checklist

After implementing RBAC on a page:

- [ ] SuperAdmin can access the page
- [ ] User without permission gets "Access Denied"
- [ ] User without permission doesn't see the page in menu
- [ ] Create/Edit/Delete buttons are hidden for users without those permissions
- [ ] Approval buttons only show for users with approve permission
- [ ] Page redirects to `/dashboard` or shows error message appropriately

## Common Patterns

### Pattern 1: List Page with Add Button
```tsx
'use client';

import { ProtectedPage, PermissionButton } from '@/components/auth';

export default function ProductsListPage() {
  return (
    <ProtectedPage permission="inventory.products.view">
      <div>
        <PermissionButton 
          permission="inventory.products.create"
          onClick={() => router.push('/inventory/products/add')}
        >
          Add New Product
        </PermissionButton>
        {/* List content */}
      </div>
    </ProtectedPage>
  );
}
```

### Pattern 2: Approval Page
```tsx
'use client';

import { ProtectedPage, WorkflowButtons } from '@/components/auth';

export default function DeliveryApprovalPage() {
  return (
    <ProtectedPage permission="operation.delivery.approve">
      <div>
        {/* Approval content */}
        <WorkflowButtons
          itemStatus={item.status}
          onApprove={handleApprove}
          onReject={handleReject}
          approvePermission="operation.delivery.approve"
        />
      </div>
    </ProtectedPage>
  );
}
```

### Pattern 3: Submitter vs Approver View
```tsx
'use client';

import { ProtectedPage, RoleBasedContent, usePermissions } from '@/components/auth';

export default function StockAdjustmentPage() {
  return (
    <ProtectedPage 
      requiredPermissions={['production.adjustment.view', 'production.adjustment-approval.view']}
      requireAll={false} // User needs at least ONE of these permissions
    >
      <RoleBasedContent
        submitterView={
          <div>Content for those who submit adjustments</div>
        }
        approverView={
          <div>Content for those who approve adjustments</div>
        }
        submitterPermission="production.adjustment.create"
        approverPermission="production.adjustment-approval.view"
      />
    </ProtectedPage>
  );
}
```

## Best Practices

1. **Always protect pages** - Every page except public pages should be wrapped in `ProtectedPage`

2. **Use correct permission codes** - Match permissions exactly with menu-items.ts

3. **Handle navigation** - Protected pages automatically redirect unauthorized users

4. **Granular controls** - Use `PermissionButton` and `PermissionGuard` for fine-grained control

5. **Test with different roles** - Create test users with different permission sets

6. **Document custom permissions** - If you add new permissions, document them

## Automated Approach

To speed up implementation, you can use a script to add RBAC to multiple pages:

```bash
# Example: Find all pages without ProtectedPage
grep -r "export default function" src/app/(dashboard) | grep -v "ProtectedPage"
```

## Need Help?

Refer to these files for complete examples:
- `/production/stock-adjustment/page.tsx` - Submitter page with RBAC
- `/production/stock-adjustment-approval/page.tsx` - Approval page with RBAC
- `/operation/delivery-approval/page.tsx` - Workflow-based approval

## Summary

✅ **Menu is filtered** - Users see only accessible items  
✅ **Pages are protected** - Unauthorized access is blocked  
✅ **Buttons are controlled** - Actions are permission-based  
✅ **Workflows are enforced** - Submit vs Approve roles are clear  

**Result**: A fully secure, role-based system where each user sees and can do only what their permissions allow!
