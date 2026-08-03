# Unified Operation Approval System

## Overview

A comprehensive approval page has been implemented in the Operations section to display all pending approvals from various operation modules in a single, unified interface. Authorized users can approve or reject requests directly from this page, with approvals organized by section/module.

## What Was Implemented

### Backend Components

1. **DTOs** (`DMS-Backend/Models/DTOs/OperationApprovals/`)
   - `OperationApprovalItemDto.cs` - Represents a single approval item
   - `OperationApprovalsSummaryDto.cs` - Contains all pending approvals grouped by type

2. **Service Interface** (`DMS-Backend/Services/Interfaces/`)
   - `IOperationApprovalService.cs` - Service contract for fetching pending approvals

3. **Service Implementation** (`DMS-Backend/Services/Implementations/`)
   - `OperationApprovalService.cs` - Aggregates pending approvals from all operation services
   - Fetches pending items from: Deliveries, Transfers, Disposals, Cancellations, Label Print Requests, Stock BF, Delivery Returns

4. **Controller** (`DMS-Backend/Controllers/`)
   - `OperationApprovalsController.cs` - Exposes `/api/operation-approvals/pending` endpoint
   - Requires `operation:approvals:view` permission

5. **Service Registration** (`DMS-Backend/Program.cs`)
   - Added `IOperationApprovalService` to DI container

6. **Permissions** (`DMS-Backend/Data/Seeders/ComprehensivePermissionSeeder.cs`)
   - Added `operation:approvals:view` permission for the unified approval page

### Frontend Components

1. **API Service** (`DMS-Frontend/src/lib/api/operation-approvals.ts`)
   - Type definitions for approval items and summary
   - `operationApprovalsApi.getPending()` method

2. **Page Component** (`DMS-Frontend/src/app/(dashboard)/operation/approvals/page.tsx`)
   - Unified approval page at `/operation/approvals`
   - Features:
     - Summary cards showing total pending and breakdown by type
     - Collapsible sections for each approval type (only non-empty sections shown)
     - Approve/Reject buttons for each item
     - Real-time refresh after approval/rejection
     - Protected by `operation.approvals.view` permission
     - Responsive design with theme support

3. **Navigation** (`DMS-Frontend/src/lib/navigation/menu-items.ts`)
   - Added "All Approvals" menu item to Operations section
   - Uses CheckSquare icon
   - Positioned after "Delivery Approval" in menu

## Features

### Approval Types Included

1. **Deliveries** - Pending delivery requests to outlets
2. **Transfers** - Stock transfers between outlets
3. **Disposals** - Product disposal requests
4. **Cancellations** - Delivery cancellation requests
5. **Label Print Requests** - Label printing approvals
6. **Stock BF** - Stock brought forward entries
7. **Delivery Returns** - Product return requests

### User Experience

- **Single Dashboard**: All pending approvals visible in one place
- **Section-wise Organization**: Grouped by approval type with collapsible sections
- **Summary Statistics**: Quick overview cards showing pending counts
- **One-Click Actions**: Approve or reject directly from the list
- **Confirmation Dialogs**: Reject actions require confirmation
- **Real-time Updates**: Page refreshes after each action
- **Permission-based Access**: Only users with appropriate permissions can access

### Security & Permissions

- Backend endpoint protected by `operation:approvals:view` permission
- Individual approve/reject operations use existing module-specific permissions:
  - `operation:delivery:approve`
  - `operation:transfer:approve`
  - `operation:disposal:approve`
  - `operation:cancellation:approve`
  - `operation:label-printing:approve`
  - `operation:stock-bf:approve`
  - `operation:delivery-return:approve`

## API Endpoints

### Get Pending Approvals
```
GET /api/operation-approvals/pending
```

**Permission Required**: `operation:approvals:view`

**Response**:
```json
{
  "success": true,
  "data": {
    "deliveries": [...],
    "transfers": [...],
    "disposals": [...],
    "cancellations": [...],
    "labelPrintRequests": [...],
    "stockBFs": [...],
    "deliveryReturns": [...],
    "totalPendingCount": 15
  }
}
```

## Testing Guide

### Prerequisites

1. Database must be seeded with the new permission:
   - Run migrations or clear permissions and re-seed
   - SQL: Delete from `permissions` and restart backend to trigger seeder

2. Assign permission to test user:
   ```sql
   -- Check if permission exists
   SELECT * FROM permissions WHERE code = 'operation:approvals:view';
   
   -- Assign to a role (example: Manager role)
   INSERT INTO role_permissions (role_id, permission_id, created_at)
   SELECT 
       r.id,
       p.id,
       CURRENT_TIMESTAMP
   FROM roles r
   CROSS JOIN permissions p
   WHERE r.name = 'Manager' 
     AND p.code = 'operation:approvals:view'
     AND NOT EXISTS (
         SELECT 1 FROM role_permissions rp 
         WHERE rp.role_id = r.id AND rp.permission_id = p.id
     );
   ```

### Test Scenarios

#### 1. Access Control Test
- [ ] User without `operation:approvals:view` permission sees access denied
- [ ] User with permission can access `/operation/approvals` page

#### 2. Empty State Test
- [ ] When no pending approvals exist, shows "No pending approvals" message
- [ ] Message indicates all operations have been processed

#### 3. Multi-Type Approval Test
1. Create pending items in multiple categories:
   - Create a delivery (submit for approval)
   - Create a transfer (submit for approval)
   - Create a disposal (submit for approval)
2. Navigate to "All Approvals" page
3. Verify:
   - [ ] All pending items are visible
   - [ ] Items are grouped by type
   - [ ] Summary cards show correct counts
   - [ ] First non-empty section is expanded by default

#### 4. Approval Workflow Test
1. From the unified page:
   - [ ] Click "Approve" on a delivery
   - [ ] Verify success toast message
   - [ ] Confirm item disappears from pending list
   - [ ] Confirm total count decreases
2. Verify approved item:
   - [ ] Go to Deliveries page
   - [ ] Filter by "Approved" status
   - [ ] Confirm delivery shows as approved

#### 5. Rejection Workflow Test
1. From the unified page:
   - [ ] Click "Reject" on a transfer
   - [ ] Verify confirmation dialog appears
   - [ ] Confirm rejection
   - [ ] Verify success toast message
   - [ ] Confirm item disappears from pending list
2. Verify rejected item:
   - [ ] Go to Transfers page
   - [ ] Filter by "Rejected" status
   - [ ] Confirm transfer shows as rejected

#### 6. Section Toggle Test
- [ ] Click on a section header to collapse it
- [ ] Click again to expand it
- [ ] Verify smooth animation

#### 7. Multiple Approvals Test
- [ ] Approve multiple items from different sections
- [ ] Verify each approval processes correctly
- [ ] Verify counts update after each action

#### 8. Permission-based Approval Test
- [ ] User must still have individual module permissions to approve/reject
- [ ] Test with user who has `operation:approvals:view` but NOT `operation:delivery:approve`
- [ ] Verify backend returns 403 when trying to approve delivery

#### 9. Stock BF Special Case Test
- [ ] Create a Stock BF entry
- [ ] Submit for approval
- [ ] Verify it appears in unified approvals
- [ ] Approve from unified page
- [ ] Verify approval succeeds (handles userId parameter correctly)

### Expected Behavior Summary

✅ **Should Work:**
- Viewing all pending approvals in one place
- Approving items from the unified page (if user has module-specific approve permission)
- Rejecting items from the unified page (if user has module-specific approve permission)
- Real-time list updates after actions
- Section collapsing/expanding
- Responsive layout on mobile/tablet

❌ **Should Fail Gracefully:**
- Access without `operation:approvals:view` permission
- Approving without module-specific approve permission (returns 403)
- Network errors (shows error toast)
- Invalid item IDs (shows error toast)

## Deployment Steps

### Backend Deployment

1. **Build & Migrate**:
   ```bash
   cd DMS-Backend
   dotnet build
   dotnet ef database update
   ```

2. **Restart Application**:
   - Service will auto-seed the new permission on startup

3. **Verify Seeding**:
   ```sql
   SELECT * FROM permissions WHERE code = 'operation:approvals:view';
   ```

### Frontend Deployment

1. **Build**:
   ```bash
   cd DMS-Frontend
   npm run build
   ```

2. **Deploy Build**:
   - Copy `.next` folder to production
   - Restart Next.js server

### Post-Deployment

1. **Assign Permissions**:
   - Use the admin interface or SQL to assign `operation:approvals:view` to appropriate roles
   - Typically: Managers, Supervisors, or approval-specific roles

2. **Verify Navigation**:
   - Check that "All Approvals" appears in Operations menu for authorized users
   - Click to verify page loads correctly

3. **Test Workflow**:
   - Create test pending items
   - Navigate to unified approvals page
   - Test approve/reject functionality

## File Changes Summary

### New Files
- `DMS-Backend/Models/DTOs/OperationApprovals/OperationApprovalItemDto.cs`
- `DMS-Backend/Models/DTOs/OperationApprovals/OperationApprovalsSummaryDto.cs`
- `DMS-Backend/Services/Interfaces/IOperationApprovalService.cs`
- `DMS-Backend/Services/Implementations/OperationApprovalService.cs`
- `DMS-Backend/Controllers/OperationApprovalsController.cs`
- `DMS-Frontend/src/lib/api/operation-approvals.ts`
- `DMS-Frontend/src/app/(dashboard)/operation/approvals/page.tsx`

### Modified Files
- `DMS-Backend/Program.cs` - Added service registration
- `DMS-Backend/Data/Seeders/ComprehensivePermissionSeeder.cs` - Added permission
- `DMS-Frontend/src/lib/navigation/menu-items.ts` - Added menu item

## Notes

- The unified approval page uses existing approve/reject APIs from each module
- No changes to database schema (uses existing approval columns)
- Stock BF approval requires special handling due to userId parameter
- Permission model follows existing RBAC patterns
- Page is fully responsive and theme-aware
- All approval actions include confirmation dialogs for reject operations
- Success/error messages use toast notifications

## Future Enhancements (Optional)

1. **Filtering & Search**: Add search/filter across all approval types
2. **Batch Operations**: Select multiple items for bulk approve/reject
3. **Detailed View**: Modal to view full details before approving
4. **Approval History**: Show recently approved/rejected items
5. **Notifications**: Real-time notifications for new pending approvals
6. **Comments**: Add optional comments when approving/rejecting
7. **Audit Trail**: Track who approved/rejected from unified page vs module page
8. **Export**: Export pending approvals to Excel/PDF
