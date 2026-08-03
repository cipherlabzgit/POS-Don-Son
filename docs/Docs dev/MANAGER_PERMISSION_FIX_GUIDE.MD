# Manager Permission Issue - Diagnosis & Fix

## Problem

Manager users can CREATE, UPDATE, and DELETE items (like deliveries) even though they should only have VIEW permissions.

## Root Cause

The Manager role has been assigned more permissions than just view permissions. This likely happened through:
1. Running scripts that assigned all permissions to Manager
2. Manually assigning permissions through the Security UI
3. Previous seeder configurations

## How Authorization Works

### 1. Permission Storage
- Permissions are stored in the database in the `Permissions` table
- Role-to-Permission mappings are in the `RolePermissions` table
- Each permission has a code like `operation:delivery:create`, `operation:delivery:view`, etc.

### 2. JWT Token Claims
When a user logs in:
1. The system looks up their role (e.g., "Manager")
2. Gets all permissions assigned to that role from the database
3. Adds those permissions as "permission" claims in the JWT token
4. Returns the token to the user

### 3. Controller Authorization
Each controller endpoint checks permissions using the `[HasPermission]` attribute:

```csharp
[HttpPost]
[HasPermission("operation:delivery:create")]  // ← Requires this permission
public async Task<ActionResult> Create(...)
{
    // Create delivery
}
```

### 4. Runtime Check
When a request comes in:
1. The `PermissionAuthorizationHandler` extracts permission claims from the JWT token
2. Checks if the required permission is in the claims
3. Allows or denies the request

## Why Old Tokens Still Work

**CRITICAL:** JWT tokens are self-contained! They include the permissions at the time of login.

Even if you remove permissions from the Manager role in the database:
- Users already logged in still have old JWT tokens
- Those tokens contain the OLD permissions
- The tokens remain valid until they expire (15 minutes by default)

## Solution

### Step 1: Check Current Permissions

First, check what permissions the Manager role actually has:

**Using PowerShell:**
```powershell
.\FIX_MANAGER_PERMISSIONS.ps1
```

**Using Command Prompt:**
```cmd
FIX_MANAGER_PERMISSIONS.bat
```

**Using SQL directly:**
```bash
psql -h localhost -p 5432 -d dms_erp_db -U postgres -f CHECK_MANAGER_PERMISSIONS.sql
```

This will show:
- Total permissions count
- Permissions grouped by type (VIEW, CREATE, UPDATE, DELETE)
- All non-view permissions (should be NONE)
- Delivery-specific permissions

### Step 2: Reset Manager to View-Only

The scripts will prompt you, then automatically:
1. Remove ALL permissions from Manager role
2. Assign ONLY view/read permissions
3. Verify the changes

### Step 3: Force User Re-login

**MOST IMPORTANT STEP:**

All Manager users MUST:
1. **Log out** of the application completely
2. **Log in** again to get a new JWT token with updated permissions

Until they do this, they will still be able to create/edit/delete because their old token has the old permissions!

### Alternative: Wait for Token Expiry

JWT tokens expire after 15 minutes (configured in `appsettings.Development.json`). If you can wait, the old permissions will stop working automatically after 15 minutes.

## Verification

After fixing and users have re-logged in:

1. **Login as a Manager user**
2. **Try to create a delivery**
3. **Expected result:**
   - The API should return **403 Forbidden**
   - The frontend should show "Insufficient permissions" or similar error

4. **Try to view deliveries**
5. **Expected result:**
   - Should work fine - view permission is allowed

## Permission Naming Convention

The system uses this pattern for permission codes:

- `{module}:{resource}:view` - View/Read access
- `{module}:{resource}:create` - Create new items
- `{module}:{resource}:update` - Edit existing items
- `{module}:{resource}:delete` - Delete items
- `{module}:{resource}:execute` - Special operations (approve, submit, etc.)

Examples:
- `operation:delivery:view` - View deliveries
- `operation:delivery:create` - Create deliveries
- `operation:delivery:update` - Edit deliveries
- `operation:delivery:delete` - Delete deliveries

## Files Included

1. **CHECK_MANAGER_PERMISSIONS.sql**
   - SQL script to check current Manager permissions
   - Shows detailed breakdown by type

2. **RESET_MANAGER_TO_VIEW_ONLY.sql**
   - SQL script to reset Manager to view-only
   - Removes all non-view permissions

3. **FIX_MANAGER_PERMISSIONS.bat**
   - Windows batch script to run both SQL files
   - User-friendly prompts and error handling

4. **FIX_MANAGER_PERMISSIONS.ps1**
   - PowerShell script (recommended for Windows)
   - Better error messages and colored output

## Troubleshooting

### "psql is not recognized"

PostgreSQL's `psql` command is not in your PATH.

**Fix:** Follow the guide in `ADD_POSTGRESQL_TO_PATH.md`

Or use pgAdmin to run the SQL scripts manually:
1. Open pgAdmin
2. Connect to the database
3. Open Query Tool
4. Copy and paste the SQL from the .sql files
5. Execute

### "Connection refused" or "Cannot connect"

PostgreSQL is not running.

**Fix:**
1. Open Services (Win+R, type `services.msc`)
2. Find "postgresql-x64-15" (or similar)
3. Start the service

### Manager can still create after running the fix

The Manager user hasn't logged out and logged in again.

**Fix:**
1. Tell the user to log out completely
2. Log in again
3. Try the operation again

### Want to give Manager specific create permissions

Edit the `RESET_MANAGER_TO_VIEW_ONLY.sql` script and add specific permissions:

```sql
-- Add specific create permissions
INSERT INTO "RolePermissions" ("Id", "RoleId", "PermissionId", "GrantedAt")
SELECT 
    gen_random_uuid(),
    manager_role_id,
    "Id",
    NOW()
FROM "Permissions"
WHERE "Code" IN (
    'operation:disposal:create',  -- Allow disposal creation
    'operation:transfer:create'   -- Allow transfer creation
);
```

## Prevention

To prevent this issue in the future:

1. **Use the Security UI** (`/administrator/security?tab=permissions`)
   - Visual interface to manage permissions
   - Shows exactly what each role has

2. **Test after changes**
   - Log in as a manager user
   - Try to perform restricted operations
   - Verify you get 403 Forbidden

3. **Document role permissions**
   - Keep a document of what each role should be able to do
   - Review regularly

4. **Be careful with SQL scripts**
   - Always review permission assignment scripts
   - Check they only assign intended permissions
   - Test on development database first

## Related Files

- `DMS-Backend/Authorization/PermissionAuthorizationHandler.cs` - Checks permissions
- `DMS-Backend/Common/HasPermissionAttribute.cs` - Permission attribute
- `DMS-Backend/Services/Implementations/JwtService.cs` - Creates JWT tokens with permissions
- `DMS-Backend/Data/Seeders/ComprehensivePermissionSeeder.cs` - Defines all permissions
- `ASSIGN_MANAGER_PERMISSIONS.sql` - Original script (view-only)
- `ADD_AUTHORIZATION_TO_CONTROLLERS.md` - Controller authorization guide

## Summary

✅ **The authorization system is working correctly**
✅ **Controllers have proper permission checks**
❌ **Manager role has too many permissions assigned**
❌ **Users are still using old JWT tokens**

**Fix:** Run the scripts, then **tell all Manager users to log out and log in again**.
