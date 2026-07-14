# Role-Based Access Control (RBAC) Implementation Guide

## Overview

This system implements comprehensive role-based access control throughout the DMS application. Different users see different screens, menu items, and actions based on their assigned roles and permissions.

## Core Components

### 1. usePermissions Hook

Custom hook that provides permission checking utilities.

```typescript
import { usePermissions } from '@/hooks/usePermissions';

function MyComponent() {
  const {
    isSuperAdmin,
    hasPermission,
    canCreate,
    canEdit,
    canApprove,
    canActOnStatus,
  } = usePermissions();

  // Check specific permission
  if (hasPermission('operation.delivery.view')) {
    // Show content
  }

  // Check module-level actions
  if (canCreate('operation.delivery')) {
    // Show create button
  }

  // Check status-based actions
  if (canActOnStatus('operation.delivery', 'Pending')) {
    // Show approval buttons
  }
}
```

### 2. PermissionGuard Component

Conditionally render content based on permissions.

```typescript
import PermissionGuard from '@/components/auth/PermissionGuard';

// Hide content without permission
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

// Require multiple permissions (any)
<PermissionGuard 
  permission={['admin.view', 'manager.view']} 
  mode="any"
>
  <AdminPanel />
</PermissionGuard>

// Require all permissions
<PermissionGuard 
  permission={['delivery.create', 'delivery.approve']} 
  mode="all"
>
  <FullAccessPanel />
</PermissionGuard>

// Check by role
<PermissionGuard role="Manager" fallback="message">
  <ManagerDashboard />
</PermissionGuard>
```

### 3. RoleBasedContent Component

Render different content based on user's role/permissions.

```typescript
import RoleBasedContent from '@/components/auth/RoleBasedContent';

<RoleBasedContent
  variants={[
    {
      // Approvers see approval interface
      permission: 'operation.delivery.approve',
      content: <ApprovalView deliveries={pendingDeliveries} />,
      priority: 10
    },
    {
      // Creators see submission interface
      permission: 'operation.delivery.create',
      content: <SubmissionView />,
      priority: 5
    }
  ]}
  fallback={<ReadOnlyView />}
/>
```

### 4. ProtectedPage Component

Protect entire pages with permission requirements.

```typescript
import ProtectedPage from '@/components/auth/ProtectedPage';

export default function ApprovalPage() {
  return (
    <ProtectedPage 
      permission="operation.delivery.approve"
      deniedMessage="Only supervisors and managers can access approvals."
    >
      <ApprovalPageContent />
    </ProtectedPage>
  );
}
```

### 5. PermissionButton Component

Buttons that automatically hide/disable based on permissions.

```typescript
import PermissionButton from '@/components/auth/PermissionButton';

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

Smart button group for approval workflows.

```typescript
import WorkflowButtons from '@/components/auth/WorkflowButtons';

<WorkflowButtons
  module="operation.delivery"
  status={delivery.status}
  onSubmit={() => handleSubmit(delivery.id)}
  onApprove={() => handleApprove(delivery.id)}
  onReject={() => handleReject(delivery.id)}
  isLoading={isSubmitting}
/>
```

## Common Patterns

### Pattern 1: Separate Screens for Submission vs Approval

```typescript
// pages/operation/delivery/page.tsx - Submission screen
export default function DeliveryPage() {
  return (
    <ProtectedPage permission="operation.delivery.view">
      <div>
        {/* List of all deliveries */}
        <DeliveryList />
        
        {/* Create button - only for users with create permission */}
        <PermissionButton
          permission="operation.delivery.create"
          onClick={() => router.push('/operation/delivery/add')}
        >
          Add New Delivery
        </PermissionButton>
      </div>
    </ProtectedPage>
  );
}

// pages/operation/delivery-approval/page.tsx - Approval screen
export default function DeliveryApprovalPage() {
  return (
    <ProtectedPage permission="operation.delivery.approve">
      <div>
        <h1>Pending Approvals</h1>
        {pendingDeliveries.map(delivery => (
          <DeliveryCard
            key={delivery.id}
            delivery={delivery}
            actions={
              <WorkflowButtons
                module="operation.delivery"
                status={delivery.status}
                onApprove={() => handleApprove(delivery.id)}
                onReject={() => handleReject(delivery.id)}
              />
            }
          />
        ))}
      </div>
    </ProtectedPage>
  );
}
```

### Pattern 2: Dynamic Page Content Based on User Role

```typescript
export default function StockAdjustmentPage() {
  const { canApprove } = usePermissions();
  
  return (
    <RoleBasedContent
      variants={[
        {
          // Approvers see pending adjustments
          permission: 'production.adjustment-approval.view',
          content: (
            <div>
              <h1>Stock Adjustments Pending Approval</h1>
              <PendingAdjustmentsList />
            </div>
          )
        },
        {
          // Regular users see their submissions
          permission: 'production.adjustment.view',
          content: (
            <div>
              <h1>Stock Adjustments</h1>
              <MyAdjustmentsList />
              <PermissionButton permission="production.adjustment.create">
                Create New Adjustment
              </PermissionButton>
            </div>
          )
        }
      ]}
    />
  );
}
```

### Pattern 3: Conditional Actions in Tables

```typescript
function DeliveryTable({ deliveries }: { deliveries: Delivery[] }) {
  const { canEdit, canDelete, canApprove } = usePermissions();
  
  return (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Date</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {deliveries.map(delivery => (
          <tr key={delivery.id}>
            <td>{delivery.id}</td>
            <td>{delivery.date}</td>
            <td>{delivery.status}</td>
            <td>
              <div className="flex gap-2">
                {/* View button - everyone can see */}
                <Button onClick={() => viewDelivery(delivery.id)}>
                  View
                </Button>
                
                {/* Edit button - only if status is Draft and user can edit */}
                <PermissionButton
                  permission="operation.delivery.edit"
                  onClick={() => editDelivery(delivery.id)}
                  disabled={delivery.status !== 'Draft'}
                >
                  Edit
                </PermissionButton>
                
                {/* Workflow buttons */}
                <WorkflowButtons
                  module="operation.delivery"
                  status={delivery.status}
                  onSubmit={() => submitForApproval(delivery.id)}
                  onApprove={() => approveDelivery(delivery.id)}
                  onReject={() => rejectDelivery(delivery.id)}
                />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Pattern 4: Multi-Level Approval Workflows

```typescript
function ApprovalPage() {
  const { hasPermission, primaryRole } = usePermissions();
  
  return (
    <RoleBasedContent
      variants={[
        {
          // Level 2 Approvers (Managers) see items approved by supervisors
          permission: 'operation.delivery.approve-level-2',
          content: (
            <div>
              <h1>Final Approval Required</h1>
              <DeliveryList 
                filter={{ status: 'Pending-Level-2' }}
                actions={(delivery) => (
                  <WorkflowButtons
                    module="operation.delivery"
                    status="Pending"
                    onApprove={() => finalApprove(delivery.id)}
                    onReject={() => rejectDelivery(delivery.id)}
                  />
                )}
              />
            </div>
          ),
          priority: 20
        },
        {
          // Level 1 Approvers (Supervisors)
          permission: 'operation.delivery.approve',
          content: (
            <div>
              <h1>First Level Approval</h1>
              <DeliveryList 
                filter={{ status: 'Pending' }}
                actions={(delivery) => (
                  <WorkflowButtons
                    module="operation.delivery"
                    status="Pending"
                    onApprove={() => firstLevelApprove(delivery.id)}
                    onReject={() => rejectDelivery(delivery.id)}
                  />
                )}
              />
            </div>
          ),
          priority: 10
        }
      ]}
      fallback={<AccessDenied />}
    />
  );
}
```

## Permission Naming Convention

Use dot notation for hierarchical permissions:

- `module.action` - Basic pattern
- `operation.delivery.view` - View deliveries
- `operation.delivery.create` - Create new deliveries
- `operation.delivery.edit` - Edit existing deliveries
- `operation.delivery.delete` - Delete deliveries
- `operation.delivery.approve` - Approve pending deliveries
- `operation.delivery.submit` - Submit for approval

## Best Practices

1. **Always use ProtectedPage for page-level protection**
   ```typescript
   export default function SensitivePage() {
     return (
       <ProtectedPage permission="admin.sensitive.view">
         <Content />
       </ProtectedPage>
     );
   }
   ```

2. **Use RoleBasedContent for different views, not conditional rendering**
   ```typescript
   // ❌ Don't do this
   {canApprove ? <ApprovalView /> : <SubmissionView />}
   
   // ✅ Do this
   <RoleBasedContent
     variants={[
       { permission: 'approve', content: <ApprovalView /> },
       { permission: 'submit', content: <SubmissionView /> }
     ]}
   />
   ```

3. **Use PermissionButton instead of manual permission checks**
   ```typescript
   // ❌ Don't do this
   {canDelete && <Button onClick={handleDelete}>Delete</Button>}
   
   // ✅ Do this
   <PermissionButton permission="delete" onClick={handleDelete}>
     Delete
   </PermissionButton>
   ```

4. **Use WorkflowButtons for standard approval workflows**
   - Automatically shows the right buttons based on status
   - Handles permission checks internally
   - Provides consistent UI across the app

5. **Separate screens for different roles**
   - Create `/operation/delivery` for submitters
   - Create `/operation/delivery-approval` for approvers
   - Add separate menu items with appropriate permissions

## Migration Guide

### Updating Existing Pages

1. **Wrap the page with ProtectedPage**
   ```typescript
   // Before
   export default function MyPage() {
     return <div>Content</div>;
   }
   
   // After
   export default function MyPage() {
     return (
       <ProtectedPage permission="module.view">
         <div>Content</div>
       </ProtectedPage>
     );
   }
   ```

2. **Replace conditional buttons with PermissionButton**
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

3. **Use WorkflowButtons for approval actions**
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

## Testing Permissions

1. Create test users with different roles
2. Verify menu items show/hide correctly
3. Verify pages redirect or show access denied
4. Verify buttons hide/disable correctly
5. Verify different users see appropriate screens

## Troubleshooting

**Issue**: Menu items not hiding
- Check that permissions are set in `menu-items.ts`
- Verify `filterMenuByPermissions` is called in Sidebar
- Check user's permissions in auth store

**Issue**: Buttons still visible without permission
- Ensure using `PermissionButton` instead of regular `Button`
- Check permission string matches exactly

**Issue**: Page not redirecting
- Verify `ProtectedPage` is wrapping the content
- Check `showDeniedMessage` prop
- Verify permission string is correct
