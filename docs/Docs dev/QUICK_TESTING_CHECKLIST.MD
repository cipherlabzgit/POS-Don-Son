# Quick Testing Checklist - DonandSons DMS

**Version:** 1.0  
**Date:** April 27, 2026

---

## ⚡ Quick Start

### 1. Start Servers
```bash
# Backend (Terminal 1)
cd "c:\Cipher Labz\DonandSons-DMS\DMS-Backend"
dotnet run

# Frontend (Terminal 2)
cd "c:\Cipher Labz\DonandSons-DMS\DMS-Frontend"
npm run dev
```

### 2. Test Credentials
- **Admin:** `admin` / `Admin@123`
- **Manager:** `manager` / `Manager@123`

### 3. URLs
- Frontend: http://localhost:3000
- Backend: https://localhost:5001
- Swagger: https://localhost:5001/swagger

---

## ✅ 18 Integrated Pages to Test (100% Complete)

### Authentication (1 page)
- [ ] `/login` - Login with admin credentials

### Administrator Module (15 pages)
- [ ] `/administrator/users` - User CRUD
- [ ] `/administrator/roles` - Role CRUD
- [ ] `/administrator/permissions` - Permission view (read-only)
- [ ] `/administrator/delivery-turns` - Delivery turn CRUD
- [ ] `/administrator/day-types` - Day type CRUD
- [ ] `/administrator/section-consumables` - Consumable CRUD
- [ ] `/administrator/showroom-employee` - Employee mapping
- [ ] `/administrator/system-settings` - System settings
- [ ] `/administrator/label-templates` - Label templates
- [ ] `/administrator/label-settings` - Label settings
- [ ] `/administrator/rounding-rules` - Rounding rules
- [ ] `/administrator/price-manager` - Price lists
- [ ] `/administrator/grid-configuration` - Grid config
- [ ] `/administrator/workflow-config` - Workflow config
- [ ] `/administrator/security` - Security policies
- [ ] `/administrator/day-lock` - Day locking
- [ ] `/administrator/approvals` - Approval queue

### Inventory Module (4 pages)
- [ ] `/inventory/category` - Category CRUD
- [ ] `/inventory/uom` - UOM CRUD
- [ ] `/inventory/products` - Product CRUD
- [ ] `/inventory/ingredient` - Ingredient CRUD

### Showroom Module (1 page)
- [ ] `/showroom` - Outlet/showroom CRUD

### DMS Recipes Module (3 pages)
- [ ] `/dms/recipe-templates` - Recipe template CRUD
- [ ] `/dms/recipe-management` - Multi-component recipe editing
- [ ] `/dms/anytime-recipe-generator` - Real-time calculations

---

## 🧪 Critical Test Flows

### Flow 1: Authentication (5 min)
1. Login as admin → Should redirect to dashboard
2. Check DevTools → auth-store has tokens
3. Navigate to Users page → Should load users from DB
4. Logout → Should redirect to login

### Flow 2: User Management (5 min)
1. Go to `/administrator/users`
2. Click "Add User" → Create `testuser`
3. Verify user appears in list (NOT mock data)
4. Assign "Manager" role
5. Reset password
6. Delete user (soft delete)

### Flow 3: Inventory Management (10 min)
1. Go to `/inventory/category`
2. Create category `TEST-CAT`
3. Go to `/inventory/products`
4. Create product in `TEST-CAT`
5. Go back to categories
6. Try to delete `TEST-CAT` → Should fail (has products)
7. Delete product first
8. Delete category → Should succeed

### Flow 4: Recipe System (10 min)
1. Go to `/dms/recipe-templates`
2. Create template "Test Template"
3. Go to `/dms/recipe-management`
4. Select a product
5. Add 2 components:
   - Dough with 3 ingredients
   - Filling with 2 ingredients
6. Save recipe
7. Check preview calculator → Should show calculations
8. Go to `/dms/anytime-recipe-generator`
9. Select same product, qty 100
10. Click Generate → Should show ingredient breakdown

### Flow 5: Permissions (5 min)
1. Create new user with limited permissions
2. Login as that user
3. Try to access restricted pages
4. Should see 403 or hidden buttons
5. Verify user can only perform allowed actions

---

## 🔍 Quick Verification Commands

### Check Database Data
```sql
-- Active users
SELECT username, email FROM users WHERE is_active = true;

-- Recent audit logs
SELECT entity_name, action, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 10;

-- Recent API calls
SELECT method, path, status_code FROM api_request_logs ORDER BY timestamp DESC LIMIT 10;

-- Categories with product count
SELECT c.name, COUNT(p.id) as product_count 
FROM categories c 
LEFT JOIN products p ON p.category_id = c.id 
WHERE c.is_active = true 
GROUP BY c.id, c.name;

-- Recipes with component count
SELECT r.id, p.name, COUNT(rc.id) as component_count
FROM recipes r
JOIN products p ON r.product_id = p.id
LEFT JOIN recipe_components rc ON rc.recipe_id = r.id
WHERE r.is_active = true
GROUP BY r.id, p.name;
```

### Check API Endpoints
```bash
# Login
curl -X POST https://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123"}'

# Get users (replace TOKEN)
curl https://localhost:5001/api/users?page=1&pageSize=10 \
  -H "Authorization: Bearer TOKEN"

# Calculate recipe (replace TOKEN and PRODUCT_ID)
curl -X POST "https://localhost:5001/api/recipes/PRODUCT_ID/calculate?qty=100" \
  -H "Authorization: Bearer TOKEN"
```

---

## 🚨 Common Issues & Solutions

### Issue 1: Backend won't start
**Error:** Port already in use  
**Solution:**
```powershell
# Find process using port 5001
Get-Process -Id (Get-NetTCPConnection -LocalPort 5001).OwningProcess

# Kill it
Stop-Process -Id <PID> -Force
```

### Issue 2: Frontend shows "Network Error"
**Check:**
1. Is backend running? (Check terminal)
2. Is backend on correct port? (Should be 5001)
3. CORS configured? (Should allow localhost:3000)

### Issue 3: Login fails
**Check:**
1. Database connection working?
2. Users seeded? (Check dev seed logs)
3. Correct credentials?

### Issue 4: "Cannot delete" errors
**Reason:** Referential integrity  
**Solution:** Delete child records first

### Issue 5: Token expired
**Solution:** Logout and login again (or wait for auto-refresh)

---

## 📊 Test Result Summary

After completing tests, fill this out:

**Date Tested:** ___________  
**Tester:** ___________

| Category | Passed | Failed | Notes |
|----------|--------|--------|-------|
| Authentication | ___ / 1 | ___ | |
| Administrator | ___ / 15 | ___ | |
| Inventory | ___ / 4 | ___ | |
| Showroom | ___ / 1 | ___ | |
| DMS Recipes | ___ / 3 | ___ | |
| **TOTAL** | **___ / 24** | **___** | |

**Overall Status:** ⬜ PASS  ⬜ FAIL  
**Ready for Next Phase:** ⬜ YES  ⬜ NO

---

## 📝 Notes

**Issues Found:**

**Performance Observations:**

**Recommendations:**

---

**For detailed testing guide, see:** `INTEGRATION_STATUS_AND_TESTING_GUIDE.md`
