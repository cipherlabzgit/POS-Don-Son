# RBAC Quick Reference Guide

## Quick Import

```typescript
// Import all RBAC components
import {
  ProtectedPage,
  PermissionGuard,
  RoleBasedContent,
  PermissionButton,
  WorkflowButtons,
} from '@/components/auth';

// Import permissions hook
import { usePermissions } from '@/hooks/usePermissions';
```

## Common Use Cases

### 1. Protect an Entire Page

```typescript
export default function MyPage() {
  return (
    <ProtectedPage permission="module.view">
      {/* Your page content */}
    </ProtectedPage>
  );
}
```

### 2. Hide a Button Based on Permission

```typescript
<PermissionButton
  permission="module.create"
  onClick={handleCreate}
  variant="primary"
>
  Create New
</PermissionButton>
```

### 3. Show Different Content for Different Roles

```typescript
<RoleBasedContent
  variants={[
    {
      permission: 'module.approve',
      content: <ApproverView />
    },
    {
      permission: 'module.view',
      content: <UserView />
    }
  ]}
/>
```

### 4. Workflow Buttons (Submit/Approve/Reject)

```typescript
<WorkflowButtons
  module="operation.delivery"
  status={item.status}
  onSubmit={() => handleSubmit(item.id)}
  onApprove={() => handleApprove(item.id)}
  onReject={() => handleReject(item.id)}
/>
```

### 5. Hide a Section Based on Permission

```typescript
<PermissionGuard permission="admin.view">
  <AdminSection />
</PermissionGuard>
```

### 6. Check Permission in Code

```typescript
const { hasPermission, canEdit, canApprove } = usePermissions();

if (hasPermission('module.edit')) {
  // Do something
}

if (canApprove('operation.delivery')) {
  // User can approve deliveries
}
```

## Permission Naming

Format: `module.action`

Common actions:
- `view` - View/list
- `create` - Create new
- `edit` / `update` - Edit existing
- `delete` - Delete
- `approve` - Approve pending
- `submit` - Submit for approval

Examples:
```
operation.delivery.view
operation.delivery.create
operation.delivery.approve
production.adjustment.view
production.adjustment-approval.view
```

## Page Update Checklist

When updating a page to use RBAC:

1. [ ] Wrap with `<ProtectedPage permission="...">`
2. [ ] Replace `Button` with `PermissionButton` for restricted actions
3. [ ] Use `WorkflowButtons` for submit/approve/reject actions
4. [ ] Replace manual permission checks with `<PermissionGuard>`
5. [ ] Remove `isAdminUser()` checks - use permissions instead
6. [ ] Test with different user roles

## Separate Screens Pattern

For workflows requiring approval, create two separate pages:

**Submission Screen** (`/module/item/page.tsx`)
- Permission: `module.item.view`
- Shows all items (draft, pending, approved, rejected)
- Create button (requires `module.item.create`)
- Edit button for drafts (requires `module.item.edit`)
- Submit button for drafts (requires `module.item.submit`)

**Approval Screen** (`/module/item-approval/page.tsx`)
- Permission: `module.item.approve`
- Shows only pending items
- Approve/Reject buttons (requires `module.item.approve`)
- Read-only view of item details

**Menu Items**
```typescript
{
  name: 'Module',
  children: [
    {
      name: 'Items',
      href: '/module/item',
      permission: 'module.item.view',
    },
    {
      name: 'Item Approval',
      href: '/module/item-approval',
      permission: 'module.item.approve',
    },
  ],
}
```

## Component API Reference

### ProtectedPage
| Prop | Type | Description |
|------|------|-------------|
| `permission` | `string \| string[]` | Required permission(s) |
| `role` | `string \| string[]` | Required role(s) |
| `mode` | `'any' \| 'all'` | Check mode (default: 'any') |
| `showDeniedMessage` | `boolean` | Show access denied vs redirect (default: true) |
| `deniedMessage` | `string` | Custom message |

### PermissionButton
| Prop | Type | Description |
|------|------|-------------|
| `permission` | `string \| string[]` | Required permission(s) |
| `role` | `string \| string[]` | Required role(s) |
| `showDisabled` | `boolean` | Show disabled vs hide (default: false) |
| `disabledTooltip` | `string` | Tooltip when disabled |
| ...rest | | All Button props |

### WorkflowButtons
| Prop | Type | Description |
|------|------|-------------|
| `module` | `string` | Module name (e.g., 'operation.delivery') |
| `status` | `'Draft' \| 'Pending' \| 'Approved' \| 'Rejected'` | Current status |
| `onSubmit` | `() => void` | Submit handler |
| `onApprove` | `() => void` | Approve handler |
| `onReject` | `() => void` | Reject handler |
| `isLoading` | `boolean` | Loading state |

### PermissionGuard
| Prop | Type | Description |
|------|------|-------------|
| `permission` | `string \| string[]` | Required permission(s) |
| `role` | `string \| string[]` | Required role(s) |
| `mode` | `'any' \| 'all'` | Check mode (default: 'any') |
| `fallback` | `'hide' \| 'message' \| ReactNode` | What to show if no permission |
| `deniedMessage` | `string` | Custom message |

### RoleBasedContent
| Prop | Type | Description |
|------|------|-------------|
| `variants` | `ContentVariant[]` | Array of content variants |
| `fallback` | `ReactNode` | Fallback content |

**ContentVariant**:
```typescript
{
  permission?: string | string[];
  role?: string | string[];
  content: ReactNode;
  priority?: number;  // Higher = checked first
}
```

## usePermissions Hook

```typescript
const {
  // Status
  isSuperAdmin,           // boolean
  user,                   // User | null
  userDisplayName,        // string
  primaryRole,            // string | null
  
  // Permission checks
  hasPermission,          // (permission: string) => boolean
  hasAnyPermission,       // (permissions: string[]) => boolean
  hasAllPermissions,      // (permissions: string[]) => boolean
  
  // Role checks
  hasRole,                // (role: string) => boolean
  hasAnyRole,             // (roles: string[]) => boolean
  
  // Action checks
  canCreate,              // (module: string) => boolean
  canEdit,                // (module: string) => boolean
  canDelete,              // (module: string) => boolean
  canView,                // (module: string) => boolean
  canApprove,             // (module: string) => boolean
  canSubmitForApproval,   // (module: string) => boolean
  
  // Status-based checks
  canActOnStatus,         // (module: string, status: string) => boolean
} = usePermissions();
```

## Testing Different Roles

1. **Super Admin** - See everything, all permissions
2. **Manager** - Approval permissions, can see approval screens
3. **Supervisor** - Some approval permissions
4. **Regular User** - View and create only
5. **Guest/Limited User** - View only

Test each role:
- Can they see the menu item?
- Can they access the page?
- Can they see create/edit/delete buttons?
- Can they see approve/reject buttons?
- Do they see the right screen (submission vs approval)?
