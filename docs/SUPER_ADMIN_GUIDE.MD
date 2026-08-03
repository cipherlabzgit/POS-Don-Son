# Super Admin Automatic Permissions Guide

## How It Works

Super admins in the DMS system **automatically have all permissions** without needing explicit permission assignments in the database. This is implemented at the code level.

## Implementation Details

### 1. Backend JWT Generation
**File**: `DMS-Backend/Services/Implementations/JwtService.cs`

When a super admin logs in, their JWT token includes a wildcard `"*"` permission:

```csharp
// Add permissions
if (user.IsSuperAdmin)
{
    claims.Add(new Claim("permission", "*"));  // Wildcard = all permissions
}
else
{
    foreach (var permission in permissions)
    {
        claims.Add(new Claim("permission", permission));
    }
}
```

### 2. Backend Authorization Check
**File**: `DMS-Backend/Authorization/PermissionAuthorizationHandler.cs`

The authorization handler checks for the `"*"` permission first:

```csharp
protected override Task HandleRequirementAsync(
    AuthorizationHandlerContext context,
    PermissionRequirement requirement)
{
    var permissions = context.User.FindAll("permission")
        .Select(c => c.Value)
        .ToList();

    // Super-admin has all permissions (marked with "*")
    if (permissions.Contains("*"))
    {
        context.Succeed(requirement);
        return Task.CompletedTask;
    }

    // Regular permission checks for non-super-admins...
}
```

### 3. Frontend Permission Checks
**File**: `DMS-Frontend/src/lib/stores/auth-store.ts`

All permission helper functions check `isSuperAdmin` first:

```typescript
hasPermission: (permission: string) => {
    const { user } = get();
    if (!user) return false;
    if (user.isSuperAdmin) return true;  // ⭐ Bypass all checks
    return user.permissions.includes(permission) || user.permissions.includes('*');
}
```

**File**: `DMS-Frontend/src/hooks/usePermissions.ts`

```typescript
const can = useCallback(
    (code: string): boolean => {
        if (!code) return false;
        if (isSuperAdmin) return true;  // ⭐ Super admin bypass
        return hasPermission(code);
    },
    [hasPermission, isSuperAdmin],
);
```

**File**: `DMS-Frontend/src/components/auth/ProtectedPage.tsx`

```typescript
const checkAccess = (): boolean => {
    if (isSuperAdmin) return true;  // ⭐ Super admin bypass
    
    // Regular permission checks for non-super-admins...
};
```

## Creating Super Admin Users

### In Database
Set the `IsSuperAdmin` column to `true` in the `users` table:

```sql
UPDATE users 
SET "IsSuperAdmin" = true 
WHERE "Email" = 'admin@example.com';
```

### Via Backend Code
When creating a user programmatically:

```csharp
var user = new User
{
    Email = "admin@example.com",
    FirstName = "System",
    LastName = "Administrator",
    IsSuperAdmin = true,  // ⭐ This is all you need
    // ... other fields
};
```

## Current Super Admin Users

According to the database, the following user is configured as a super admin:

- **Email**: `admin@donandson.com`
- **Name**: System Administrator
- **Status**: Active
- **Super Admin**: ✅ Yes

## Important Notes

1. **No Permission Assignments Needed**: Super admins do NOT need permissions assigned in the `role_permissions` table. They automatically have access to everything.

2. **Session Refresh Required**: After changing a user's `IsSuperAdmin` status, they must **log out and log back in** to get a fresh JWT token with the updated status.

3. **Security**: Use super admin status sparingly. It grants complete system access without any restrictions.

4. **Frontend and Backend Aligned**: Both the frontend and backend respect the `isSuperAdmin` flag, ensuring consistent behavior across the entire application.

## Troubleshooting

### "I'm a super admin but still seeing 'Access Denied'"

**Solution**: Log out and log back in. Your current JWT token was issued before you were made a super admin.

### "How do I check if my token has super admin status?"

Decode your JWT token (you can use jwt.io). Look for:
- `isSuperAdmin: true` claim
- `permission: *` claim

If these are present, you have super admin access.

### "I want to add new permissions for regular users"

1. Add the permission to the `permissions` table
2. Assign it to roles via `role_permissions` table
3. Super admins automatically have access without any updates

## Summary

✅ Super admins automatically have all permissions
✅ Implemented at code level (backend + frontend)
✅ No database permission assignments needed
✅ JWT token includes `"*"` wildcard permission
✅ All auth checks bypass for super admins
✅ Log out/in required after status changes
