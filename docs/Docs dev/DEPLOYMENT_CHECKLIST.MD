# RBAC Sidebar - Deployment Checklist

## Pre-Deployment

### 1. Backup ⚠️ CRITICAL
- [ ] Backup production database
  ```bash
  pg_dump -U postgres -d DMS > backup_$(date +%Y%m%d_%H%M%S).sql
  ```
- [ ] Commit all changes to git
  ```bash
  git add .
  git commit -m "RBAC sidebar alignment implementation"
  git push origin main
  ```
- [ ] Tag release
  ```bash
  git tag -a v1.0-rbac-alignment -m "RBAC Sidebar Alignment"
  git push origin v1.0-rbac-alignment
  ```

### 2. Code Review
- [ ] Review frontend changes (`menu-items.ts`)
- [ ] Review backend changes (`ComprehensivePermissionSeeder.cs`)
- [ ] Review SQL migration script (`ADD_MISSING_PERMISSIONS.sql`)
- [ ] Verify no linter errors
- [ ] Code review approved by team lead

### 3. Documentation Review
- [ ] Read `PERMISSION_ALIGNMENT_COMPLETE.md`
- [ ] Read `RBAC_SIDEBAR_IMPLEMENTATION_SUMMARY.md`
- [ ] Read `PERMISSION_QUICK_REFERENCE.md`
- [ ] Understand rollback procedure

---

## Deployment Steps

### Phase 1: Backend Deployment

#### Development Environment
- [ ] Navigate to backend directory
  ```bash
  cd DMS-Backend
  ```
- [ ] Drop and recreate database
  ```bash
  dotnet ef database drop --force
  dotnet ef database update
  ```
- [ ] Run application to seed data
  ```bash
  dotnet run
  ```
- [ ] Verify permissions in database
  ```sql
  SELECT COUNT(*) FROM "Permissions";
  -- Should show increased count
  ```

#### Production Environment
- [ ] Navigate to backend directory
  ```bash
  cd DMS-Backend
  ```
- [ ] Run migration script
  ```bash
  psql -U postgres -d DMS -f ../ADD_MISSING_PERMISSIONS.sql
  ```
- [ ] Verify migration output (should show 18 new permissions)
- [ ] Check for errors in output
- [ ] Verify permissions added correctly
  ```sql
  SELECT "Code", "Name" FROM "Permissions" 
  WHERE "Code" IN ('administrator:view', 'dms:view', 'day-end:view')
  ORDER BY "Code";
  ```

#### Backend Build & Deploy
- [ ] Build backend application
  ```bash
  dotnet build --configuration Release
  ```
- [ ] Run tests (if available)
  ```bash
  dotnet test
  ```
- [ ] Deploy to application server
- [ ] Restart application service
- [ ] Verify application is running
- [ ] Check application logs for errors

### Phase 2: Frontend Deployment

#### Build Frontend
- [ ] Navigate to frontend directory
  ```bash
  cd DMS-Frontend
  ```
- [ ] Install dependencies (if needed)
  ```bash
  npm install
  ```
- [ ] Build production bundle
  ```bash
  npm run build
  ```
- [ ] Verify build output (no errors)

#### Deploy Frontend
- [ ] Copy build output to web server
- [ ] Clear CDN cache (if using CDN)
- [ ] Verify static files are accessible
- [ ] Check browser console for errors

### Phase 3: User Session Management

#### Option A: Force Logout All Users
- [ ] Run SQL to clear sessions
  ```sql
  -- If using session table
  DELETE FROM "UserSessions" WHERE "ExpiresAt" > NOW();
  ```
- [ ] Notify users via email/announcement

#### Option B: Manual Logout
- [ ] Send notification to all users
- [ ] Ask users to logout and login again
- [ ] Provide clear instructions

---

## Post-Deployment Testing

### Test 1: SuperAdmin Access ✅
- [ ] Login as SuperAdmin
- [ ] Verify Dashboard visible
- [ ] Verify Inventory menu visible with all sub-items
- [ ] Verify Show Room visible
- [ ] Verify Operation menu visible with all sub-items
- [ ] Verify Production menu visible with all sub-items
- [ ] Verify DMS menu visible with all sub-items
- [ ] Verify Reports visible
- [ ] Verify Administrator menu visible with all sub-items
- [ ] Click through each menu item to verify access
- [ ] Check browser console for errors

### Test 2: Manager Role ✅
**Setup**: Create test user with Manager role having:
- `dashboard:view`
- `products:view`
- `categories:view`
- `showroom:view`
- `operation:delivery:view`
- `reports:view`

**Test**:
- [ ] Login as Manager test user
- [ ] Verify Dashboard visible
- [ ] Verify Inventory → Products visible
- [ ] Verify Inventory → Category visible
- [ ] Verify Inventory → UOM NOT visible
- [ ] Verify Inventory → Ingredient NOT visible
- [ ] Verify Show Room visible
- [ ] Verify Operation → Delivery visible
- [ ] Verify Operation → other items NOT visible
- [ ] Verify Reports visible
- [ ] Verify Production menu NOT visible
- [ ] Verify DMS menu NOT visible
- [ ] Verify Administrator menu NOT visible
- [ ] Try accessing Products page (should work)
- [ ] Try accessing UOM page directly (should show access denied)

### Test 3: Production User ✅
**Setup**: Create test user with Production User role having:
- `dashboard:view`
- `production:view`
- `production:daily:view`
- `production:plan:view`

**Test**:
- [ ] Login as Production User
- [ ] Verify Dashboard visible
- [ ] Verify Production menu visible
- [ ] Verify Production → Daily Production visible
- [ ] Verify Production → Production Plan visible
- [ ] Verify Production → Production Cancel NOT visible
- [ ] Verify Production → Stock Adjustment NOT visible
- [ ] Verify all other modules NOT visible
- [ ] Access Daily Production page (should work)
- [ ] Try accessing Production Cancel directly (should show access denied)

### Test 4: Operator Role ✅
**Setup**: Create test user with Operator role having:
- `dashboard:view`
- `operation:delivery:view`
- `operation:delivery:create`

**Test**:
- [ ] Login as Operator
- [ ] Verify Dashboard visible
- [ ] Verify Operation → Delivery visible
- [ ] Verify Operation → other items NOT visible
- [ ] Verify all other modules NOT visible
- [ ] Access Delivery page (should work)
- [ ] Create a delivery (should work)
- [ ] Try accessing other Operation pages directly (should show access denied)

### Test 5: No Permissions ✅
**Setup**: Create test user with empty role (no permissions)

**Test**:
- [ ] Login as user with no permissions
- [ ] Verify sidebar is mostly empty
- [ ] Verify only items without permission requirements visible (if any)
- [ ] Try accessing any page directly (should show access denied)

### Test 6: API Permission Enforcement ✅
- [ ] Use Postman/curl to test API endpoints
- [ ] Verify endpoints without `[HasPermission]` still work
- [ ] Verify endpoints with `[HasPermission]` enforce correctly
- [ ] Test with valid permission (should succeed)
- [ ] Test without permission (should return 403 Forbidden)

### Test 7: JWT Token Verification ✅
- [ ] Login as test user
- [ ] Open browser DevTools → Application → Local Storage
- [ ] Find `auth-storage` key
- [ ] Copy JWT token
- [ ] Decode JWT at jwt.io
- [ ] Verify `permissions` array contains expected permissions
- [ ] Verify permissions use COLON notation (`:`)

---

## Smoke Tests

### Critical Paths
- [ ] User login flow works
- [ ] SuperAdmin can access everything
- [ ] Non-admin users see filtered sidebar
- [ ] Dashboard loads correctly
- [ ] Main workflows still function:
  - [ ] Create product
  - [ ] Create delivery
  - [ ] Create production entry
  - [ ] View reports
  - [ ] Manage users (admin)
  - [ ] Manage roles (admin)

### Performance
- [ ] Sidebar loads quickly (< 100ms)
- [ ] No performance degradation
- [ ] API response times normal
- [ ] Database query performance unchanged

---

## Monitoring

### Immediately After Deployment (First Hour)
- [ ] Monitor application logs for errors
- [ ] Monitor database logs for issues
- [ ] Check error tracking service (Sentry/etc)
- [ ] Monitor user feedback channels
- [ ] Check system resource usage (CPU, Memory)

### First Day
- [ ] Review error logs hourly
- [ ] Check user support tickets
- [ ] Monitor login success rate
- [ ] Verify no authentication issues
- [ ] Check permission-related errors

### First Week
- [ ] Daily log review
- [ ] Weekly user feedback review
- [ ] Monitor for permission-related support tickets
- [ ] Gather user satisfaction feedback

---

## Rollback Criteria

### Trigger Rollback If:
- [ ] Critical authentication failures
- [ ] Users unable to access any pages
- [ ] Database corruption
- [ ] More than 10% of users affected
- [ ] Security vulnerability discovered
- [ ] Application won't start

### Rollback Procedure
If any of the above occur:

1. **Stop Application**
   ```bash
   sudo systemctl stop dms-backend
   sudo systemctl stop dms-frontend
   ```

2. **Rollback Frontend**
   ```bash
   cd DMS-Frontend
   git checkout HEAD~1 -- src/lib/navigation/menu-items.ts
   npm run build
   # Deploy previous build
   ```

3. **Rollback Backend**
   ```bash
   cd DMS-Backend
   git checkout HEAD~1 -- Data/Seeders/ComprehensivePermissionSeeder.cs
   dotnet build
   # Deploy previous build
   ```

4. **Rollback Database**
   ```sql
   DELETE FROM "Permissions" 
   WHERE "Code" IN (
     'administrator:view', 'day-end:view', 'day-end:execute',
     'cashier-balance:view', 'cashier-balance:create', 
     'cashier-balance:edit', 'cashier-balance:delete',
     'admin-delivery-plan:view', 'admin-delivery-plan:create',
     'admin-delivery-plan:edit', 'admin-delivery-plan:delete',
     'dms:view', 'anytime-recipe:view', 'anytime-recipe:generate',
     'dough-generator:view', 'dough-generator:generate',
     'dms-recipe:export', 'xlsm-importer:view', 'xlsm-importer:import'
   );
   ```

5. **Restart Application**
   ```bash
   sudo systemctl start dms-backend
   sudo systemctl start dms-frontend
   ```

6. **Verify Rollback**
   - [ ] Application starts successfully
   - [ ] Users can login
   - [ ] Sidebar works (even if showing all items)
   - [ ] Main functionality restored

7. **Document Issue**
   - [ ] Record what went wrong
   - [ ] Document steps taken
   - [ ] Create post-mortem report
   - [ ] Plan fix for next attempt

---

## Communication

### Before Deployment
- [ ] Notify all stakeholders of deployment window
- [ ] Send email to all users about upcoming changes
- [ ] Schedule maintenance window (if needed)
- [ ] Prepare support team with FAQs

### During Deployment
- [ ] Post status updates
- [ ] Keep stakeholders informed of progress
- [ ] Report any issues immediately

### After Deployment
- [ ] Send success notification
- [ ] Provide user guide on new RBAC system
- [ ] Make support team available for questions
- [ ] Document any issues encountered

---

## Success Criteria

### Deployment is Successful If:
✅ All tests pass  
✅ No critical errors in logs  
✅ Users can login normally  
✅ SuperAdmin sees all menu items  
✅ Non-admin users see filtered menu  
✅ API permissions enforced correctly  
✅ No performance degradation  
✅ No data loss  
✅ Rollback procedure tested and ready

---

## Sign-Off

### Pre-Deployment
- [ ] Technical Lead Approval: ________________ Date: ________
- [ ] QA Approval: ________________ Date: ________
- [ ] Product Owner Approval: ________________ Date: ________

### Post-Deployment
- [ ] Deployment Successful: ________________ Date: ________
- [ ] Testing Complete: ________________ Date: ________
- [ ] Production Ready: ________________ Date: ________

---

## Notes

### Deployment Start Time: ________________
### Deployment End Time: ________________
### Issues Encountered:
- 
- 
- 

### Action Items:
- 
- 
- 

---

## Appendix

### Useful Commands

**Check Permission Count**:
```sql
SELECT COUNT(*) FROM "Permissions";
```

**List New Permissions**:
```sql
SELECT "Code", "Name", "Module" FROM "Permissions"
WHERE "Code" LIKE 'administrator:view' 
   OR "Code" LIKE 'dms:view'
   OR "Code" LIKE 'day-end:%'
   OR "Code" LIKE 'cashier-balance:%'
   OR "Code" LIKE 'admin-delivery-plan:%'
   OR "Code" LIKE 'anytime-recipe:%'
   OR "Code" LIKE 'dough-generator:%'
   OR "Code" LIKE 'dms-recipe:%'
   OR "Code" LIKE 'xlsm-importer:%'
ORDER BY "Code";
```

**Check User Permissions**:
```sql
SELECT u."Email", p."Code", p."Name"
FROM "Users" u
JOIN "UserRoles" ur ON u."Id" = ur."UserId"
JOIN "RolePermissions" rp ON ur."RoleId" = rp."RoleId"
JOIN "Permissions" p ON rp."PermissionId" = p."Id"
WHERE u."Email" = 'user@example.com'
ORDER BY p."Code";
```

**Verify Application Status**:
```bash
# Check backend
curl http://localhost:5000/health

# Check frontend
curl http://localhost:3000

# Check database
psql -U postgres -d DMS -c "SELECT COUNT(*) FROM \"Permissions\";"
```
