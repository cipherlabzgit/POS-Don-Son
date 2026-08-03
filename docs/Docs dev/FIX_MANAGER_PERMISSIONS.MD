# Fix Manager Permissions Issue

## Problem

The Manager role only has 5 random permissions assigned, which is why navigation items aren't showing up when logged in as a manager.

## Root Cause

In `DMS-Backend/Data/Seeders/DevDataSeeder.cs`, line 119-122:

```csharp
var viewPermissions = await _context.Permissions
    .Where(p => p.Code.Contains("view"))
    .Take(5)  // ← ONLY 5 PERMISSIONS!
    .ToListAsync();
```

This was meant for demo purposes only and needs to be fixed for actual use.

## Solutions

### Solution 1: Use the Admin UI (Easiest) ✅

1. **Log out** from the manager account

2. **Log in as Admin:**
   - Email: `admin@donandson.com`
   - Password: `Admin@123`

3. **Navigate to Roles:**
   - Go to **Administrator** → **Roles**
   - Click **Edit** on the "Manager" role

4. **Assign Permissions:**
   - Scroll to the **Permissions** section
   - You'll see the new organized permissions interface
   - Use **Module Filter** to select modules managers should access
   - OR use **Search** to find specific permissions
   - Select permissions like:
     - All "View" permissions in relevant modules
     - Create/Update permissions for operational tasks
     - No delete permissions (typically)

5. **Recommended Permissions for Manager:**
   - ✅ Dashboard (view)
   - ✅ Inventory → All View permissions
   - ✅ Operation → All View + Create permissions
   - ✅ Production → View permissions
   - ✅ DMS → Most View permissions
   - ✅ Reports → View
   - ❌ Administrator section (only specific items if needed)

6. **Save Changes:**
   - Click **Save Changes** button
   - Wait for success toast

7. **Test:**
   - Log out from admin
   - Log back in as manager
   - **Verify navigation items now appear**

### Solution 2: Run SQL Script (Faster for Multiple Roles)

If you want to quickly assign all VIEW permissions to managers:

1. **Open pgAdmin 4**

2. **Connect to your database**

3. **Open Query Tool**

4. **Run the SQL script:**
   ```bash
   # The script is located at:
   c:\Cipher Labz\DonandSons-DMS\ASSIGN_MANAGER_PERMISSIONS.sql
   ```

5. **Execute the script:**
   - This will assign ALL "view" permissions to Manager role
   - Check the output for confirmation

6. **Manager needs to log out and log back in**
   - Permissions are loaded at login time
   - Refresh token to get updated permissions

### Solution 3: Fix the DevDataSeeder (For Future)

Update the `DevDataSeeder.cs` to assign proper permissions:

```csharp
private async Task SeedDemoRolesAsync()
{
    // ... existing code ...

    // Get meaningful permissions for managers
    var managerPermissions = await _context.Permissions
        .Where(p => 
            // All view permissions
            p.Code.Contains(".view") ||
            // Common operational permissions
            p.Code.Contains("operation.delivery.create") ||
            p.Code.Contains("operation.disposal.create") ||
            p.Code.Contains("operation.transfer.create") ||
            p.Code.Contains("production.daily.create") ||
            // Reports
            p.Code.Contains("reports.view")
        )
        .ToListAsync();

    // Assign to manager role
    foreach (var permission in managerPermissions)
    {
        _context.RolePermissions.Add(new RolePermission
        {
            Id = Guid.NewGuid(),
            RoleId = managerRole.Id,
            PermissionId = permission.Id,
            GrantedAt = DateTime.UtcNow
        });
    }

    await _context.SaveChangesAsync();
}
```

## How Permissions Work

### Frontend (Navigation Filtering)

```typescript
// In sidebar.tsx
const visibleNavigation = filterMenuByPermissions(
    navigationMenu,
    hasPermission,
    user?.isSuperAdmin || false
);
```

Each menu item in `menu-items.ts` has a `permission` property:

```typescript
{
    name: 'Products',
    href: '/inventory/products',
    icon: Package,
    permission: 'inventory.products.view',  // ← Required permission
}
```

### Permission Check Logic

```typescript
hasPermission: (permission: string) => {
    const { user } = get();
    if (!user) return false;
    if (user.isSuperAdmin) return true;  // Admin sees everything
    return user.permissions.includes(permission);  // Check user's permissions array
}
```

### Backend (API Protection)

Controllers use `[RequirePermission]` attribute:

```csharp
[RequirePermission("inventory.products.view")]
public async Task<IActionResult> GetProducts()
{
    // ...
}
```

## Verification Steps

After assigning permissions:

1. **Check in Database:**
   ```sql
   SELECT 
       r."Name" as "Role",
       COUNT(rp."Id") as "Permissions"
   FROM "Roles" r
   LEFT JOIN "RolePermissions" rp ON r."Id" = rp."RoleId"
   WHERE r."Name" = 'Manager'
   GROUP BY r."Name";
   ```

2. **Check in UI:**
   - Log in as manager
   - Open browser DevTools (F12)
   - Go to Console tab
   - Type: `JSON.parse(localStorage.getItem('auth-storage'))`
   - Check `state.user.permissions` array

3. **Check Navigation:**
   - Count visible menu items in sidebar
   - Should see: Inventory, Operation, Production, DMS, Reports (at minimum)
   - Administrator section should be hidden (unless explicitly granted)

## Permission Naming Convention

Permissions follow this pattern:

```
{module}.{feature}.{action}

Examples:
- inventory.products.view
- operation.delivery.create
- production.daily.update
- administrator.users.delete
```

### Common Actions:
- `view` / `read` - See the page/data
- `create` - Add new records
- `update` / `edit` - Modify existing records
- `delete` - Remove records
- `approve` - Approve workflows
- `execute` - Run special operations

## Recommended Permission Sets

### Manager Role:
- ✅ All `.view` permissions (except Administrator)
- ✅ Operational `.create` and `.update` permissions
- ✅ Selected `.approve` permissions
- ❌ Most `.delete` permissions
- ❌ Administrator permissions (except reports)

### Operator Role:
- ✅ Specific `.view` permissions for their area
- ✅ Limited `.create` permissions
- ❌ `.update` permissions (mostly)
- ❌ `.delete` permissions
- ❌ `.approve` permissions
- ❌ Administrator permissions

### Admin/Super Admin:
- ✅ ALL permissions (automatic with `isSuperAdmin` flag)

## Troubleshooting

### "Still not seeing navigation items after assigning permissions"

1. **Clear browser cache:**
   - DevTools → Application → Storage → Clear site data

2. **Force logout/login:**
   - Click logout
   - Clear localStorage: `localStorage.clear()`
   - Log back in

3. **Check browser console for errors:**
   - F12 → Console tab
   - Look for permission-related errors

4. **Verify permissions in localStorage:**
   ```javascript
   const auth = JSON.parse(localStorage.getItem('auth-storage'));
   console.log('Permissions:', auth.state.user.permissions);
   console.log('Permission count:', auth.state.user.permissions.length);
   ```

5. **Check backend API response:**
   - Login API should return user with `permissions` array
   - Check network tab → Login request → Response

### "Permission codes don't match"

Check permission codes in database:
```sql
SELECT "Code", "Name", "Module" 
FROM "Permissions" 
WHERE "Code" LIKE '%view%'
ORDER BY "Module", "Code";
```

Compare with frontend `menu-items.ts` file permission strings.

## Next Steps

1. Choose **Solution 1** (UI) or **Solution 2** (SQL)
2. Assign permissions to Manager role
3. Manager logs out and logs back in
4. Verify navigation items appear
5. Test accessing different screens
6. Adjust permissions as needed based on business requirements

---

**Note:** Permissions are loaded at login time and cached in localStorage. Any permission changes require the user to log out and log back in to take effect.

**Last Updated:** April 29, 2026
