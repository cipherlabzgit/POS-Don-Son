# Role-Based Access Control (RBAC) Implementation Guide

## Overview

This document describes the comprehensive Role-Based Access Control (RBAC) system implemented for the Don & Sons DMS. The system ensures that different users see different screens, menu items, and available actions based on their assigned roles and permissions.

## Problem Statement

Previously, the system displayed the same interface to all users regardless of their role:
- A person who submitted something for approval would see the same screen as the person who approves it
- All users saw admin-level controls regardless of their permissions
- No differentiation between submitters and approvers

## Solution

The new RBAC system provides:
1. **Permission-Based Navigation** - Menu items automatically hide/show based on user permissions
2. **Page-Level Protection** - Entire pages can be restricted to specific permissions/roles
3. **Conditional UI Rendering** - Different views for different user roles on the same page
4. **Action-Level Control** - Buttons and actions automatically hide/disable based on permissions
5. **Workflow-Based Access** - Different screens for submission vs approval workflows

## Core Components

### 1. usePermissions Hook
Location: `DMS-Frontend/src/hooks/usePermissions.ts`

Custom hook providing comprehensive permission checking utilities.

```typescript
import { usePermissions } from '@/hooks/usePermissions';

function MyComponent() {
  const {
    isSuperAdmin,           // Is user a super admin?
    hasPermission,          // Check specific permission
    hasRole,                // Check specific role
    canCreate,              // Can user create in this module?
    canEdit,                // Can user edit in this module?
    canApprove,             // Can user approve in this module?
    canActOnStatus,         // Can user act on items with specific status?
    userDisplayName,        // User's full name
    primaryRole,            // User's primary role name
  } = usePermissions();
}
```

### 2. PermissionGuard Component
Location: `DMS-Frontend/src/components/auth/PermissionGuard.tsx`

Conditionally renders content based on permissions.

```typescript
// Hide content if no permission
<PermissionGuard permission="operation.delivery.approve">
  <ApprovalSection />
</PermissionGuard>

// Show access denied message
<PermissionGuard 
  permission="administrator.users.view"
  fallback="message"
>
  <UserManagement />
</PermissionGuard>

// Multiple permissions (any)
<PermissionGuard 
  permission={['admin.view', 'manager.view']} 
  mode="any"
>
  <AdminPanel />
</PermissionGuard>

// Check by role
<PermissionGuard role="Manager" fallback="message">
  <ManagerDashboard />
</PermissionGuard>
```

### 3. RoleBasedContent Component
Location: `DMS-Frontend/src/components/auth/RoleBasedContent.tsx`

Renders different content based on user's role/permissions.

```typescript
<RoleBasedContent
  variants={[
    {
      permission: 'operation.delivery.approve',
      content: <ApprovalView />,
      priority: 10
    },
    {
      permission: 'operation.delivery.create',
      content: <SubmissionView />,
      priority: 5
    }
  ]}
  fallback={<ReadOnlyView />}
/>
```

### 4. ProtectedPage Component
Location: `DMS-Frontend/src/components/auth/ProtectedPage.tsx`

Protects entire pages with permission requirements.

```typescript
export default function ApprovalPage() {
  return (
    <ProtectedPage 
      permission="operation.delivery.approve"
      deniedMessage="Only supervisors can access approvals."
    >
      <ApprovalPageContent />
    </ProtectedPage>
  );
}
```

### 5. PermissionButton Component
Location: `DMS-Frontend/src/components/auth/PermissionButton.tsx`

Buttons that automatically hide/disable based on permissions.

```typescript
// Hidden if no permission
<PermissionButton
  permission="operation.delivery.delete"
  onClick={handleDelete}
  variant="destructive"
>
  Delete
</PermissionButton>

// Disabled if no permission (shown but not clickable)
<PermissionButton
  permission="operation.delivery.approve"
  onClick={handleApprove}
  showDisabled
  disabledTooltip="You need approval permission"
>
  Approve
</PermissionButton>
```

### 6. WorkflowButtons Component
Location: `DMS-Frontend/src/components/auth/WorkflowButtons.tsx`

Smart button group for approval workflows. Automatically shows appropriate buttons based on status and permissions.

```typescript
<WorkflowButtons
  module="operation.delivery"
  status={delivery.status}
  onSubmit={() => handleSubmit(delivery.id)}
  onApprove={() => handleApprove(delivery.id)}
  onReject={() => handleReject(delivery.id)}
  isLoading={isSubmitting}
/>
```

## Implementation Patterns

### Pattern 1: Separate Screens for Submission vs Approval

This is the **recommended pattern** for workflows that require approval.

#### Submission Screen
`/operation/delivery/page.tsx` - For users who create and submit deliveries

```typescript
export default function DeliveryPage() {
  return (
    <ProtectedPage permission="operation.delivery.view">
      <div className="p-6 space-y-6">
        <div className="flex justify-between">
          <h1>Deliveries</h1>
          <PermissionButton
            permission="operation.delivery.create"
            onClick={() => router.push('/operation/delivery/add')}
          >
            Add New Delivery
          </PermissionButton>
        </div>

        <DeliveryTable 
          deliveries={deliveries}
          renderActions={(delivery) => (
            <WorkflowButtons
              module="operation.delivery"
              status={delivery.status}
              onSubmit={() => submitForApproval(delivery.id)}
            />
          )}
        />
      </div>
    </ProtectedPage>
  );
}
```

#### Approval Screen
`/operation/delivery-approval/page.tsx` - For supervisors/managers who approve

```typescript
export default function DeliveryApprovalPage() {
  return (
    <ProtectedPage permission="operation.delivery.approve">
      <div className="p-6 space-y-6">
        <h1>Pending Deliveries for Approval</h1>
        
        <PendingDeliveryTable 
          deliveries={pendingDeliveries}
          renderActions={(delivery) => (
            <WorkflowButtons
              module="operation.delivery"
              status="Pending"
              onApprove={() => approveDelivery(delivery.id)}
              onReject={() => rejectDelivery(delivery.id)}
            />
          )}
        />
      </div>
    </ProtectedPage>
  );
}
```

#### Add Separate Menu Items

In `menu-items.ts`:

```typescript
{
  name: 'Operation',
  icon: ClipboardList,
  children: [
    {
      name: 'Delivery',
      href: '/operation/delivery',
      icon: Truck,
      permission: 'operation.delivery.view',
    },
    {
      name: 'Delivery Approval',        // <-- Separate menu item
      href: '/operation/delivery-approval',
      icon: Clock,
      permission: 'operation.delivery.approve',  // <-- Different permission
    },
  ],
},
```

### Pattern 2: Single Page with Role-Based Views

Use when the same data needs different presentations.

```typescript
export default function StockPage() {
  return (
    <ProtectedPage permission={['production.stock.view', 'production.stock.approve']} mode="any">
      <RoleBasedContent
        variants={[
          {
            // Approvers see pending adjustments
            permission: 'production.stock.approve',
            content: <PendingAdjustmentsView />,
            priority: 10
          },
          {
            // Regular users see their submissions
            permission: 'production.stock.view',
            content: <MySubmissionsView />,
            priority: 5
          }
        ]}
        fallback={<ReadOnlyView />}
      />
    </ProtectedPage>
  );
}
```

### Pattern 3: Conditional Actions in Tables

```typescript
function DeliveryTable({ deliveries }) {
  const { canEdit } = usePermissions();
  
  return (
    <DataTable
      data={deliveries}
      columns={[
        // ... other columns
        {
          key: 'actions',
          label: 'Actions',
          render: (delivery) => (
            <div className="flex gap-2">
              {/* Everyone can view */}
              <Button onClick={() => viewDelivery(delivery.id)}>
                View
              </Button>
              
              {/* Only show edit if user can edit AND status is Draft */}
              {delivery.status === 'Draft' && (
                <PermissionButton
                  permission="operation.delivery.edit"
                  onClick={() => editDelivery(delivery.id)}
                >
                  Edit
                </PermissionButton>
              )}
              
              {/* Workflow buttons handle permission checks internally */}
              <WorkflowButtons
                module="operation.delivery"
                status={delivery.status}
                onSubmit={() => submitForApproval(delivery.id)}
                onApprove={() => approveDelivery(delivery.id)}
                onReject={() => rejectDelivery(delivery.id)}
              />
            </div>
          )
        }
      ]}
    />
  );
}
```

## Migration Guide for Existing Pages

### Step 1: Add Page Protection

Wrap your entire page with `ProtectedPage`:

```typescript
// Before
export default function MyPage() {
  return (
    <div className="p-6">
      <h1>My Page</h1>
      {/* content */}
    </div>
  );
}

// After
export default function MyPage() {
  return (
    <ProtectedPage permission="module.view">
      <div className="p-6">
        <h1>My Page</h1>
        {/* content */}
      </div>
    </ProtectedPage>
  );
}
```

### Step 2: Replace Conditional Buttons

```typescript
// Before
{hasPermission('edit') && (
  <Button onClick={handleEdit}>Edit</Button>
)}

// After
<PermissionButton permission="edit" onClick={handleEdit}>
  Edit
</PermissionButton>
```

### Step 3: Use WorkflowButtons for Approval Actions

```typescript
// Before
{status === 'Draft' && (
  <Button onClick={submitForApproval}>Submit</Button>
)}
{status === 'Pending' && canApprove && (
  <>
    <Button onClick={approve}>Approve</Button>
    <Button onClick={reject}>Reject</Button>
  </>
)}

// After
<WorkflowButtons
  module="operation.delivery"
  status={status}
  onSubmit={submitForApproval}
  onApprove={approve}
  onReject={reject}
/>
```

### Step 4: Remove Manual Permission Checks

```typescript
// Before
const user = useAuthStore((s) => s.user);
const isAdmin = isAdminUser(user);

// ... later
{isAdmin && <AdminControls />}

// After
import { usePermissions } from '@/hooks/usePermissions';

const { hasPermission } = usePermissions();

// ... later
<PermissionGuard permission="administrator.view">
  <AdminControls />
</PermissionGuard>
```

## Example: Complete Page Update

### Before (Old Approach)

```typescript
'use client';

import { useAuthStore } from '@/lib/stores/auth-store';
import { isAdminUser } from '@/lib/date-restrictions';
import Button from '@/components/ui/button';

export default function OldPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = isAdminUser(user);

  const handleApprove = () => { /* ... */ };
  const handleReject = () => { /* ... */ };

  return (
    <div className="p-6">
      <h1>Stock Adjustments</h1>
      
      <Button onClick={() => router.push('/add')}>
        Add New
      </Button>

      {items.map(item => (
        <div key={item.id}>
          {item.status === 'Draft' && (
            <Button onClick={() => submit(item.id)}>Submit</Button>
          )}
          {item.status === 'Pending' && isAdmin && (
            <>
              <Button onClick={() => handleApprove(item.id)}>Approve</Button>
              <Button onClick={() => handleReject(item.id)}>Reject</Button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
```

### After (New RBAC Approach)

```typescript
'use client';

import ProtectedPage from '@/components/auth/ProtectedPage';
import PermissionButton from '@/components/auth/PermissionButton';
import WorkflowButtons from '@/components/auth/WorkflowButtons';

export default function NewPage() {
  const handleApprove = () => { /* ... */ };
  const handleReject = () => { /* ... */ };

  return (
    <ProtectedPage permission="production.adjustment.view">
      <div className="p-6">
        <h1>Stock Adjustments</h1>
        
        <PermissionButton
          permission="production.adjustment.create"
          onClick={() => router.push('/add')}
        >
          Add New
        </PermissionButton>

        {items.map(item => (
          <div key={item.id}>
            <WorkflowButtons
              module="production.adjustment"
              status={item.status}
              onSubmit={() => submit(item.id)}
              onApprove={() => handleApprove(item.id)}
              onReject={() => handleReject(item.id)}
            />
          </div>
        ))}
      </div>
    </ProtectedPage>
  );
}
```

## Permission Naming Convention

Use hierarchical dot notation:

```
module.action
module.submodule.action
```

### Standard Actions
- `.view` - View/list items
- `.create` - Create new items
- `.edit` / `.update` - Edit existing items
- `.delete` - Delete items
- `.approve` - Approve pending items
- `.submit` - Submit for approval

### Examples
```
operation.delivery.view
operation.delivery.create
operation.delivery.edit
operation.delivery.approve
operation.delivery.submit

production.adjustment.view
production.adjustment-approval.view

administrator.users.view
administrator.users.create
administrator.users.edit
```

## Testing Checklist

When implementing RBAC, test the following scenarios:

### Menu Navigation
- [ ] Super admin sees all menu items
- [ ] Regular user sees only permitted menu items
- [ ] Menu items without permission are completely hidden
- [ ] Parent menu item is hidden if all children are hidden

### Page Access
- [ ] Users can access pages they have permission for
- [ ] Users without permission see access denied message or are redirected
- [ ] Direct URL access respects permissions

### Button Visibility
- [ ] Create buttons show only to users with create permission
- [ ] Edit buttons show only for editable items to users with edit permission
- [ ] Delete buttons show only to users with delete permission
- [ ] Workflow buttons show appropriate actions based on status and permission

### Approval Workflows
- [ ] Submitters see submit button on Draft items
- [ ] Submitters do NOT see approve/reject buttons on Pending items
- [ ] Approvers see approve/reject buttons on Pending items
- [ ] After submission, item moves to approval queue
- [ ] After approval/rejection, item no longer appears in approval queue

### Role Separation
- [ ] Person who submitted cannot approve their own submission
- [ ] Different users see different screens based on their role
- [ ] Super admin can perform all actions

## Architecture Decisions

### Why Separate Screens for Approvals?
1. **Clear Role Separation**: Submitters and approvers have distinct workflows
2. **Better UX**: Each role sees only relevant information
3. **Security**: Reduces chance of unauthorized actions
4. **Performance**: Approvers don't load all records, only pending ones
5. **Maintainability**: Easier to modify approval flow without affecting submission

### Why Not Use Route Middleware?
The permission checks are done at the component level rather than route middleware because:
1. **Next.js App Router**: Client-side permission checks work better with React Server Components
2. **Flexibility**: Can show different content on same route
3. **UX**: Can show access denied message instead of redirect
4. **Performance**: No additional round-trip to server

## Common Issues and Solutions

### Issue: Menu item not hiding
**Solution**: Ensure permission is set in `menu-items.ts` and `filterMenuByPermissions` is called in Sidebar

### Issue: Button still visible without permission
**Solution**: Use `PermissionButton` instead of regular `Button`

### Issue: Page accessible via direct URL
**Solution**: Wrap page content with `ProtectedPage` component

### Issue: User sees approve button on their own submission
**Solution**: Add additional check for `createdById !== currentUserId` or use separate approval screen

## Future Enhancements

1. **Audit Trail**: Log all permission checks and denials
2. **Dynamic Permissions**: Load permissions from API instead of static definitions
3. **Field-Level Permissions**: Hide/show specific fields based on permissions
4. **Time-Based Permissions**: Grant permissions for specific time periods
5. **Context-Based Permissions**: Permissions based on data ownership (e.g., can only edit own records)

## Summary

The RBAC system transforms the DMS from a single-view-for-all system to a truly role-aware application where:

- **Different users see different interfaces** based on their permissions
- **Submission and approval are separate workflows** with dedicated screens
- **Actions are automatically controlled** based on user permissions
- **Security is enforced at multiple levels** - navigation, pages, and actions

This ensures that each user has a tailored experience appropriate to their role, improving both security and usability.
