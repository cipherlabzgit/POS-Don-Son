# 🔒 Complete RBAC Implementation Guide

## ✅ What's Already Done

### 1. Backend Setup
- ✅ Permission entity with DisplayOrder column (run the SQL fix)
- ✅ 250+ permissions seeded and organized by module
- ✅ Roles and permissions API endpoints
- ✅ Users with roles and permissions

### 2. Frontend Core Components
- ✅ `ProtectedPage` - Wrap entire pages
- ✅ `PermissionButton` - Control button visibility/access
- ✅ `PermissionGuard` - Hide/show sections
- ✅ `WorkflowButtons` - Approval workflow controls
- ✅ `RoleBasedContent` - Different views for different roles
- ✅ `usePermissions` hook - Access permission checks

### 3. Menu System
- ✅ All menu items have permissions defined
- ✅ `filterMenuByPermissions` function filters menu
- ✅ Users only see menu items they have access to

### 4. Example Pages (Already Protected)
- ✅ `/production/stock-adjustment` - Submitter page
- ✅ `/production/stock-adjustment-approval` - Approval page
- ✅ `/operation/delivery-approval` - Approval with workflow
- ✅ `/inventory/products` - List page with permission button
- ✅ `/operation/delivery` - Operation page
- ✅ `/production/daily-production` - Production page

## 📋 What You Need to Do

### Step 1: Run the Database Migration

Before anything else, add the DisplayOrder column:

1. **Open pgAdmin**
2. **Connect to `dms_erp_db`**
3. **Run the SQL script**: `FINAL_DISPLAYORDER_FIX.sql`
4. **Verify** it completed successfully

### Step 2: Test the Backend

```bash
cd "c:\Cipher Labz\DonandSons-DMS\DMS-Backend"
dotnet run
```

Test these endpoints:
```
GET http://localhost:5000/api/permissions
GET http://localhost:5000/api/permissions/grouped
GET http://localhost:5000/api/roles
GET http://localhost:5000/api/users/me
```

### Step 3: Apply RBAC to Remaining Pages

Use the helper script to see which pages need protection:

```powershell
cd "c:\Cipher Labz\DonandSons-DMS\DMS-Frontend"
.\apply-rbac.ps1
```

This will show you:
- ✅ Which pages are already protected
- ⚠️ Which pages need protection
- 📊 Overall progress

### Step 4: Protect Each Page

For each unprotected page, follow this pattern:

#### Pattern 1: Simple List Page

```tsx
'use client';

import { ProtectedPage, PermissionButton } from '@/components/auth';
// ... other imports

export default function YourPage() {
  return (
    <ProtectedPage permission="module.feature.view">
      <YourPageContent />
    </ProtectedPage>
  );
}

function YourPageContent() {
  // Your existing page code here
  
  return (
    <div>
      <PermissionButton 
        permission="module.feature.create"
        onClick={handleAdd}
      >
        Add New
      </PermissionButton>
      {/* Rest of your page */}
    </div>
  );
}
```

#### Pattern 2: Page with Edit/Delete Actions

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
  const columns = [
    // ... other columns
    {
      header: 'Actions',
      cell: (row: any) => (
        <div className="flex gap-2">
          <PermissionButton
            permission="module.feature.update"
            onClick={() => handleEdit(row.id)}
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
  
  return <DataTable columns={columns} data={data} />;
}
```

#### Pattern 3: Approval Page

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
      {/* Your approval content */}
      
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

## 🎯 Priority Order for Implementation

### Phase 1: Critical (Do First) ⚡
1. Administrator → Users, Roles, Permissions
2. Administrator → Security, Approvals
3. Operation → All delivery/disposal/transfer pages
4. Production → All production/stock pages

### Phase 2: Business Logic 📊
5. DMS → Order entry, delivery plan, production planner
6. Inventory → Products, categories, ingredients
7. Showroom pages

### Phase 3: Support Features 🛠️
8. Reports
9. Configuration and settings pages

## 📚 Permission Reference

Quick lookup for common permissions:

| Module | Feature | View | Create | Update | Delete | Approve |
|--------|---------|------|--------|--------|--------|---------|
| **Inventory** |
| Products | `inventory.products.view` | ✅ | `.create` | `.update` | `.delete` | - |
| Category | `inventory.category.view` | ✅ | `.create` | `.update` | `.delete` | - |
| **Operation** |
| Delivery | `operation.delivery.view` | ✅ | `.create` | `.update` | `.delete` | `.approve` |
| Disposal | `operation.disposal.view` | ✅ | `.create` | `.update` | `.delete` | - |
| Transfer | `operation.transfer.view` | ✅ | `.create` | `.update` | `.delete` | - |
| **Production** |
| Daily Production | `production.daily.view` | ✅ | `.create` | `.update` | `.delete` | - |
| Stock Adjustment | `production.adjustment.view` | ✅ | `.create` | `.update` | `.delete` | - |
| Adjustment Approval | `production.adjustment-approval.view` | ✅ | - | - | - | `.approve` |
| **DMS** |
| Order Entry | `dms.order-entry.view` | ✅ | `.create` | `.update` | `.delete` | - |
| Delivery Plan | `dms.delivery-plan.view` | ✅ | `.create` | `.update` | `.delete` | - |
| **Administrator** |
| Users | `administrator.users.view` | ✅ | `.create` | `.update` | `.delete` | - |
| Roles | `administrator.roles.view` | ✅ | `.create` | `.update` | `.delete` | - |
| Permissions | `administrator.permissions.view` | ✅ | - | `.update` | - | - |

## 🧪 Testing Your Implementation

### 1. Create Test Users

Create users with different permission sets:

**Test User 1: Submitter Only**
- Permissions: `production.adjustment.view`, `production.adjustment.create`
- Should: See stock adjustment page, create adjustments
- Should NOT: See approval page, approve adjustments

**Test User 2: Approver Only**
- Permissions: `production.adjustment-approval.view`, `production.adjustment-approval.approve`
- Should: See approval page, approve/reject adjustments
- Should NOT: See regular adjustment page

**Test User 3: Full Access**
- Permissions: All production permissions
- Should: Access all production pages and all actions

### 2. Test Checklist

For each protected page:

- [ ] SuperAdmin can access
- [ ] User with permission can access
- [ ] User without permission gets "Access Denied"
- [ ] Menu doesn't show item for users without permission
- [ ] Create button hidden for users without create permission
- [ ] Edit button hidden for users without update permission
- [ ] Delete button hidden for users without delete permission
- [ ] Approve button hidden for users without approve permission

### 3. Test Navigation

- [ ] Direct URL access blocked for unauthorized users
- [ ] Browser back/forward buttons work correctly
- [ ] Redirects go to dashboard or appropriate page
- [ ] No console errors or warnings

## 🐛 Common Issues and Solutions

### Issue 1: "Column DisplayOrder does not exist"
**Solution**: Run the `FINAL_DISPLAYORDER_FIX.sql` script in pgAdmin

### Issue 2: Menu items not filtering
**Check**: 
- Is `filterMenuByPermissions` being called in your layout?
- Are permissions loaded in `auth-store`?
- Check browser console for errors

### Issue 3: User has permission but can't access
**Check**:
- Permission code matches exactly (case-sensitive)
- User's role has the permission assigned
- Token is not expired (check `/api/users/me`)

### Issue 4: SuperAdmin can't access pages
**Check**:
- `isSuperAdmin` field is true in user object
- ProtectedPage checks for `isSuperAdmin`

### Issue 5: Buttons still show for unauthorized users
**Check**:
- Using `PermissionButton` not regular `Button`
- Permission code is correct
- User permissions are loaded

## 📖 Related Files

- **Backend Permission Seeder**: `DMS-Backend/Data/Seeders/ComprehensivePermissionSeeder.cs`
- **Menu Permissions**: `DMS-Frontend/src/lib/navigation/menu-items.ts`
- **Auth Store**: `DMS-Frontend/src/lib/stores/auth-store.ts`
- **RBAC Components**: `DMS-Frontend/src/components/auth/`
- **Example Pages**: 
  - `DMS-Frontend/src/app/(dashboard)/production/stock-adjustment/page.tsx`
  - `DMS-Frontend/src/app/(dashboard)/production/stock-adjustment-approval/page.tsx`
  - `DMS-Frontend/src/app/(dashboard)/operation/delivery-approval/page.tsx`

## 🎉 When You're Done

Once all pages are protected:

1. ✅ Run the helper script - should show 100% protected
2. ✅ Test with multiple user roles
3. ✅ Verify menu filtering works
4. ✅ Check all create/edit/delete/approve actions
5. ✅ Test direct URL access blocking
6. ✅ Verify no console errors

**You'll have a fully secure, role-based system!** 🔒

## 🆘 Need Help?

1. Check the examples in protected pages
2. Review `APPLY_RBAC_TO_ALL_PAGES.md` for detailed patterns
3. Use the helper script (`apply-rbac.ps1`) to track progress
4. Refer to `RBAC_IMPLEMENTATION_GUIDE.md` for component API reference

---

**Remember**: Each user should only see and access what their permissions allow. SuperAdmin sees everything!
