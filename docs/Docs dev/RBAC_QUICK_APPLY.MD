# 🚀 RBAC Quick Apply Reference Card

## Copy-Paste Templates

### Template 1: Simple Page Protection
```tsx
'use client';

import { ProtectedPage } from '@/components/auth';
// ... other imports

export default function YourPage() {
  return (
    <ProtectedPage permission="module.feature.view">
      <YourPageContent />
    </ProtectedPage>
  );
}

function YourPageContent() {
  // Your existing code stays here
  return (
    <div>
      {/* Your content */}
    </div>
  );
}
```

### Template 2: Page with Add Button
```tsx
'use client';

import { ProtectedPage, PermissionButton } from '@/components/auth';

export default function YourPage() {
  return (
    <ProtectedPage permission="module.feature.view">
      <YourPageContent />
    </ProtectedPage>
  );
}

function YourPageContent() {
  const router = useRouter();
  
  return (
    <div>
      <PermissionButton 
        permission="module.feature.create"
        onClick={() => router.push('/module/feature/add')}
      >
        Add New
      </PermissionButton>
      
      {/* Rest of your content */}
    </div>
  );
}
```

### Template 3: Data Table with Actions
```tsx
const columns = [
  // ... other columns
  {
    header: 'Actions',
    cell: (row: any) => (
      <div className="flex gap-2">
        <PermissionButton
          permission="module.feature.update"
          onClick={() => router.push(`/module/feature/edit/${row.id}`)}
          size="sm"
        >
          Edit
        </PermissionButton>
        
        <PermissionButton
          permission="module.feature.delete"
          onClick={() => handleDelete(row.id)}
          variant="destructive"
          size="sm"
        >
          Delete
        </PermissionButton>
      </div>
    )
  }
];
```

### Template 4: Approval Page
```tsx
'use client';

import { ProtectedPage, WorkflowButtons } from '@/components/auth';

export default function ApprovalPage() {
  return (
    <ProtectedPage permission="module.feature.approve">
      <ApprovalPageContent />
    </ProtectedPage>
  );
}

function ApprovalPageContent() {
  return (
    <div>
      {/* Approval content */}
      
      <WorkflowButtons
        itemStatus={item.status}
        onApprove={handleApprove}
        onReject={handleReject}
        approvePermission="module.feature.approve"
      />
    </div>
  );
}
```

## Permission Codes - Quick Lookup

### Inventory
- `inventory.products.view` | `.create` | `.update` | `.delete`
- `inventory.category.view` | `.create` | `.update` | `.delete`
- `inventory.uom.view` | `.create` | `.update` | `.delete`
- `inventory.ingredient.view` | `.create` | `.update` | `.delete`

### Operation
- `operation.delivery.view` | `.create` | `.update` | `.delete` | `.approve`
- `operation.disposal.view` | `.create` | `.update` | `.delete`
- `operation.transfer.view` | `.create` | `.update` | `.delete`
- `operation.stock-bf.view` | `.create` | `.update` | `.delete`
- `operation.cancellation.view` | `.create` | `.update` | `.delete`
- `operation.delivery-return.view` | `.create` | `.update` | `.delete`
- `operation.label-printing.view`
- `operation.showroom-open-stock.view` | `.create`
- `operation.showroom-label-printing.view`

### Production
- `production.daily.view` | `.create` | `.update` | `.delete`
- `production.cancel.view` | `.create` | `.update` | `.delete`
- `production.stock.view`
- `production.adjustment.view` | `.create` | `.update` | `.delete`
- `production.adjustment-approval.view` | `.approve`
- `production.plan.view` | `.create` | `.update` | `.delete`

### DMS
- `dms.order-entry.view` | `.create` | `.update` | `.delete`
- `dms.delivery-plan.view` | `.create` | `.update`
- `dms.delivery-summary.view`
- `dms.immediate-orders.view` | `.create`
- `dms.default-quantities.view` | `.update`
- `dms.production-planner.view`
- `dms.stores-issue-note.view` | `.create`
- `dms.recipe-management.view` | `.create` | `.update` | `.delete`
- `dms.recipe-templates.view` | `.create` | `.update` | `.delete`
- `dms.freezer-stock.view`
- `dms.anytime-recipe.view`
- `dms.dough.view`
- `dms.dashboard-pivot.view`
- `dms.print.view`
- `dms.export.view`
- `dms.reconciliation.view`
- `dms.importer.view`

### Administrator
- `administrator.users.view` | `.create` | `.update` | `.delete`
- `administrator.roles.view` | `.create` | `.update` | `.delete`
- `administrator.permissions.view` | `.update`
- `administrator.security.view` | `.update`
- `administrator.day-end.view` | `.execute`
- `administrator.cashier-balance.view`
- `administrator.settings.view` | `.update`
- `administrator.label-settings.view` | `.create` | `.update` | `.delete`
- `administrator.delivery-plan.view` | `.create` | `.update`
- `administrator.day-lock.view` | `.create` | `.delete`
- `administrator.approvals.view`
- `administrator.showroom-employee.view` | `.create` | `.update` | `.delete`
- `administrator.price-manager.view` | `.update`
- `administrator.workflow-config.view` | `.create` | `.update` | `.delete`
- `administrator.grid-config.view` | `.update`
- `administrator.day-types.view` | `.create` | `.update` | `.delete`
- `administrator.delivery-turns.view` | `.create` | `.update` | `.delete`
- `administrator.rounding.view` | `.create` | `.update` | `.delete`
- `administrator.consumables.view` | `.create` | `.update` | `.delete`
- `administrator.label-templates.view` | `.create` | `.update` | `.delete`

## 3-Step Process for Each Page

### Step 1: Add Imports
```tsx
'use client';

import { ProtectedPage, PermissionButton } from '@/components/auth';
```

### Step 2: Wrap Component
```tsx
export default function YourPage() {
  return (
    <ProtectedPage permission="your.permission">
      <YourPageContent />
    </ProtectedPage>
  );
}

function YourPageContent() {
  // Move existing code here
}
```

### Step 3: Update Buttons
```tsx
// Change this:
<Button onClick={handleCreate}>Add New</Button>

// To this:
<PermissionButton permission="module.feature.create" onClick={handleCreate}>
  Add New
</PermissionButton>
```

## File Paths Quick Reference

```
Protected Page Examples:
├─ src/app/(dashboard)/inventory/products/page.tsx ✅
├─ src/app/(dashboard)/operation/delivery/page.tsx ✅
├─ src/app/(dashboard)/production/daily-production/page.tsx ✅
├─ src/app/(dashboard)/production/stock-adjustment/page.tsx ✅
└─ src/app/(dashboard)/production/stock-adjustment-approval/page.tsx ✅

RBAC Components:
└─ src/components/auth/
   ├─ ProtectedPage.tsx
   ├─ PermissionButton.tsx
   ├─ PermissionGuard.tsx
   ├─ WorkflowButtons.tsx
   ├─ RoleBasedContent.tsx
   └─ index.ts

Helper Hook:
└─ src/hooks/usePermissions.ts

Auth Store:
└─ src/lib/stores/auth-store.ts

Menu Configuration:
└─ src/lib/navigation/menu-items.ts
```

## Progress Tracker

Run this to see your progress:
```powershell
cd "c:\Cipher Labz\DonandSons-DMS\DMS-Frontend"
.\apply-rbac.ps1
```

## Component Props Quick Reference

### ProtectedPage
```tsx
<ProtectedPage 
  permission="required.permission"              // Single permission
  requiredPermissions={['perm1', 'perm2']}     // Multiple permissions
  requireAll={true}                             // AND logic (default)
  requireAll={false}                            // OR logic
  fallbackPath="/dashboard"                     // Where to redirect
  showAccessDenied={true}                       // Show error message
  accessDeniedMessage="Custom message"          // Custom error text
/>
```

### PermissionButton
```tsx
<PermissionButton
  permission="required.permission"              // Single permission
  requiredPermissions={['perm1', 'perm2']}     // Multiple permissions
  requireAll={true}                             // AND logic
  hideWhenUnauthorized={true}                   // Hide (default)
  hideWhenUnauthorized={false}                  // Disable instead
  variant="primary"                             // Button style
  size="md"                                     // Button size
  onClick={handleClick}                         // Click handler
/>
```

### WorkflowButtons
```tsx
<WorkflowButtons
  itemStatus="pending"                          // Current status
  onSubmit={handleSubmit}                       // Submit handler
  onApprove={handleApprove}                     // Approve handler
  onReject={handleReject}                       // Reject handler
  submitPermission="module.feature.create"      // Who can submit
  approvePermission="module.feature.approve"    // Who can approve
/>
```

### PermissionGuard
```tsx
<PermissionGuard 
  permission="required.permission"
  fallback={<div>No access</div>}              // Optional fallback
>
  <div>Protected content</div>
</PermissionGuard>
```

## Common Mistakes to Avoid

❌ **Wrong**: Using regular `Button` component
```tsx
<Button onClick={handleCreate}>Add New</Button>
```

✅ **Correct**: Use `PermissionButton`
```tsx
<PermissionButton permission="..." onClick={handleCreate}>
  Add New
</PermissionButton>
```

---

❌ **Wrong**: Not wrapping in ProtectedPage
```tsx
export default function MyPage() {
  return <div>Content</div>;
}
```

✅ **Correct**: Always wrap protected pages
```tsx
export default function MyPage() {
  return (
    <ProtectedPage permission="...">
      <MyPageContent />
    </ProtectedPage>
  );
}
```

---

❌ **Wrong**: Wrong permission code
```tsx
<ProtectedPage permission="inventory.product.view">
```

✅ **Correct**: Match menu-items.ts exactly
```tsx
<ProtectedPage permission="inventory.products.view">
```

---

❌ **Wrong**: Forgetting 'use client' directive
```tsx
import { ProtectedPage } from '@/components/auth';
```

✅ **Correct**: Add 'use client' for client components
```tsx
'use client';

import { ProtectedPage } from '@/components/auth';
```

## Testing Checklist

For each page you protect:
- [ ] SuperAdmin can access ✅
- [ ] User with permission can access ✅
- [ ] User without permission redirected ✅
- [ ] Menu item hidden for unauthorized users ✅
- [ ] Create button hidden without create permission ✅
- [ ] Edit button hidden without update permission ✅
- [ ] Delete button hidden without delete permission ✅
- [ ] No console errors ✅

## Priority Order

1. ⚡ **Critical** (Do First)
   - Administrator pages (users, roles, permissions)
   - Operation approval pages
   
2. 📊 **Important** (Do Second)
   - Production pages
   - Operation pages
   - Inventory pages
   
3. 🛠️ **Nice to Have** (Do Last)
   - DMS utility pages
   - Reports
   - Settings pages

---

## 📌 Pin This Document!

Keep this file open while applying RBAC - it has everything you need in one place!

**File location**: `c:\Cipher Labz\DonandSons-DMS\DMS-Frontend\RBAC_QUICK_APPLY.md`
