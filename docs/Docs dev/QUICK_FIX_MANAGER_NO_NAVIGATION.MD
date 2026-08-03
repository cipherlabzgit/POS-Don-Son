# 🔧 QUICK FIX: Manager Can't See Navigation Items

## Issue
Manager user logged in but navigation items (Inventory, Operation, Production, etc.) are not showing in the sidebar.

## Root Cause
The Manager role only has 5 permissions assigned, but the system requires specific permissions for each navigation item to display.

---

## ⚡ FASTEST FIX (5 minutes)

### Option A: Use Admin UI

1. **Log out** from manager account

2. **Log in as Super Admin:**
   ```
   Email: admin@donandson.com
   Password: Admin@123
   ```

3. **Go to Administrator → Roles**

4. **Click "Edit" on Manager role**

5. **In Permissions section:**
   - Click **"Select All"** at the top
   - OR use **Module Filter** dropdown to select specific modules
   - OR use **Search** to find permissions
   
6. **Recommended: Select these modules fully:**
   - ✅ Inventory (all 4 permissions)
   - ✅ Operation (all permissions)
   - ✅ Production (most permissions)
   - ✅ DMS (view permissions)
   - ✅ Reports (view)

7. **Click "Save Changes"**

8. **Log out and log back in as Manager**
   - Email: manager@donandson.com
   - Password: Manager@123

9. **✅ Navigation should now show!**

---

### Option B: Run SQL Script (2 minutes)

1. **Open pgAdmin 4**

2. **Connect to your database**

3. **Open the SQL file:**
   ```
   c:\Cipher Labz\DonandSons-DMS\ASSIGN_MANAGER_PERMISSIONS.sql
   ```

4. **Execute it** (F5 or click Execute button)

5. **Check the output** - should say "Successfully assigned X permissions"

6. **Manager must log out and log back in**

---

## 🔍 Verify It's Fixed

After applying the fix:

### Check 1: Sidebar Navigation
- Should see at least these items:
  - ✅ Dashboard
  - ✅ Inventory (with submenu)
  - ✅ Operation (with submenu)
  - ✅ Production (with submenu)
  - ✅ DMS (with submenu)
  - ✅ Reports

### Check 2: Browser Console
1. Press F12
2. Go to Console tab
3. Type:
   ```javascript
   const auth = JSON.parse(localStorage.getItem('auth-storage'));
   console.log('Permission count:', auth.state.user.permissions.length);
   console.log('Sample permissions:', auth.state.user.permissions.slice(0, 10));
   ```
4. Should show many permissions (not just 5)

### Check 3: Database
Run this query in pgAdmin:
```sql
SELECT COUNT(*) as "Manager Permissions"
FROM "RolePermissions" rp
JOIN "Roles" r ON rp."RoleId" = r."Id"
WHERE r."Name" = 'Manager';
```
Should show 50+ permissions

---

## 🚨 Troubleshooting

### Problem: "Still no navigation after assigning permissions"

**Solution 1: Force logout/login**
1. Log out
2. Press F12 → Console
3. Type: `localStorage.clear()`
4. Press Enter
5. Close browser completely
6. Reopen and log in

**Solution 2: Check browser cache**
1. Press Ctrl+Shift+Delete
2. Clear cached images and files
3. Refresh page

### Problem: "Some items show, but not all"

**Check permission codes match:**
1. Open `VERIFY_PERMISSIONS_MATCH.sql`
2. Run it in pgAdmin
3. It will show which permissions are missing
4. Create missing permissions if needed

### Problem: "SQL script failed"

**Check if Manager role exists:**
```sql
SELECT * FROM "Roles" WHERE "Name" = 'Manager';
```

If not found, create it:
```sql
INSERT INTO "Roles" ("Id", "Name", "Description", "IsSystemRole", "IsActive", "CreatedAt", "UpdatedAt")
VALUES (
    gen_random_uuid(),
    'Manager',
    'Manager role with extended permissions',
    false,
    true,
    NOW(),
    NOW()
);
```

---

## 📋 Complete Guide

For detailed information, see:
- **`FIX_MANAGER_PERMISSIONS.md`** - Full guide with all options
- **`ASSIGN_MANAGER_PERMISSIONS.sql`** - SQL script
- **`VERIFY_PERMISSIONS_MATCH.sql`** - Verification script

---

## ⏱️ Expected Timeline

| Step | Time |
|------|------|
| Log in as admin | 30 sec |
| Navigate to Roles | 30 sec |
| Edit Manager role | 1 min |
| Select permissions | 2 min |
| Save and re-login | 1 min |
| **TOTAL** | **5 min** |

---

## ✅ Success Criteria

After fix is applied, manager should:
- ✅ See 5+ main navigation items
- ✅ Be able to expand menu items with children
- ✅ Access Inventory, Operation, Production, DMS pages
- ✅ See Dashboard with data
- ❌ NOT see Administrator section (unless explicitly granted)

---

## 🔐 Security Note

**Best Practice:**
- Don't give managers ALL permissions
- Review and grant only necessary permissions
- Follow principle of least privilege
- Regularly audit role permissions

**Manager should typically have:**
- ✅ View access to most modules
- ✅ Create/Update for operational tasks
- ✅ Limited approval permissions
- ❌ No delete permissions (mostly)
- ❌ No administrator access (mostly)

---

## 📞 Still Having Issues?

1. Check `FIX_MANAGER_PERMISSIONS.md` for detailed troubleshooting
2. Verify permissions in database match frontend codes
3. Check browser console for JavaScript errors
4. Review network tab for API errors
5. Check backend logs for permission validation errors

---

**Last Updated:** April 29, 2026  
**Estimated Fix Time:** 5 minutes  
**Difficulty:** Easy ⭐
