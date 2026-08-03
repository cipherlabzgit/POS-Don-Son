# Phase 6 - Operations Testing Guide

**Testing Date:** April 27, 2026  
**Phase:** 6 - Operations  
**Pages to Test:** 9 operation pages  
**Estimated Testing Time:** 2-3 hours

---

## 📋 Pre-Testing Checklist

Before starting testing, ensure:
- [ ] Backend server is running (`dotnet run` in DMS-Backend)
- [ ] Frontend server is running (`npm run dev` in DMS-Frontend)
- [ ] Database migration is applied (Phase6_Operations)
- [ ] You have valid login credentials
- [ ] Browser console is open (F12) to check for errors

---

## 🧪 Test Plan Overview

### Test Scope
- **9 Operation Pages**
- **68 API Endpoints**
- **CRUD Operations** (Create, Read, Update, Delete)
- **Workflow Operations** (Submit, Approve, Reject, Cancel)
- **Validation Rules**
- **Permission Enforcement**
- **Day-Lock Protection**
- **Auto-Number Generation**

### Test Types
1. Functional Testing
2. Integration Testing
3. Validation Testing
4. Security Testing
5. UI/UX Testing

---

## 🔐 Test User Setup

### Required Test Users

**Admin User:**
- Email: admin@test.com
- Permissions: All operation permissions
- Use for: Full CRUD and approval testing

**Regular User:**
- Email: user@test.com
- Permissions: Limited operation permissions
- Use for: Permission testing

**Create if needed:**
```sql
-- Via Users page in administrator section
```

---

## 📝 Testing Instructions

### Test Format
For each page:
1. **Access Test** - Can you open the page?
2. **Data Loading Test** - Does data load from backend?
3. **CRUD Tests** - Create, Read, Update, Delete
4. **Workflow Tests** - Submit, Approve, Reject
5. **Validation Tests** - Form validation, business rules
6. **Edge Cases** - Error scenarios, boundary conditions

---

## 1️⃣ Delivery Management Testing

**Page:** `operation/delivery`  
**Endpoints:** 9 endpoints  
**Document Number Format:** DN-YYYY-XXXXXX

### Test 1.1: Page Access & Data Loading
1. Navigate to Operations → Delivery
2. **Expected:** Page loads, shows spinner initially
3. **Expected:** List of deliveries appears (empty if none exist)
4. **Expected:** No console errors
5. **Check:** Status badges show correctly (Draft, Pending, Approved, Rejected)

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test 1.2: Create Delivery (Draft)
1. Click "Add Delivery" button
2. Fill form:
   - Delivery Date: Today's date
   - Showroom: Select any outlet
   - Notes: "Test delivery"
3. Click "Save"
4. **Expected:** Success toast appears
5. **Expected:** New delivery appears in list with status "Draft"
6. **Expected:** Document number auto-generated (DN-2026-XXXXXX)
7. **Expected:** Page refreshes showing new data

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test 1.3: View Delivery Details
1. Click "View" icon on any delivery
2. **Expected:** Modal opens showing full delivery details
3. **Expected:** Shows outlet name, date, status, items (if any)
4. **Expected:** Shows created by, edit date, approved by (if approved)

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test 1.4: Update Delivery (Draft Only)
1. Find a delivery with status "Draft"
2. Click "Edit" icon
3. Change delivery date or notes
4. Click "Update"
5. **Expected:** Success toast appears
6. **Expected:** Changes reflected in list
7. **Try:** Edit a "Pending" or "Approved" delivery
8. **Expected:** Edit button disabled or error message

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test 1.5: Submit for Approval (Draft → Pending)
1. Find a delivery with status "Draft"
2. Click "Submit" button
3. **Expected:** Confirmation prompt
4. Click "Confirm"
5. **Expected:** Success toast appears
6. **Expected:** Status changes to "Pending"
7. **Expected:** Submit button disappears

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test 1.6: Approve Delivery (Pending → Approved)
1. Find a delivery with status "Pending"
2. Click "Approve" button
3. **Expected:** Confirmation prompt
4. Click "Confirm"
5. **Expected:** Success toast appears
6. **Expected:** Status changes to "Approved"
7. **Expected:** Shows approved by and date

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test 1.7: Reject Delivery (Pending → Rejected)
1. Create a new delivery and submit it
2. Click "Reject" button
3. **Expected:** Confirmation prompt
4. Click "Confirm"
5. **Expected:** Success toast appears
6. **Expected:** Status changes to "Rejected"

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test 1.8: Delete Delivery (Draft Only)
1. Create a new delivery (leave as Draft)
2. Click "Delete" icon
3. **Expected:** Confirmation prompt
4. Click "Confirm"
5. **Expected:** Success toast appears
6. **Expected:** Delivery removed from list
7. **Try:** Delete a "Pending" or "Approved" delivery
8. **Expected:** Delete button disabled or error message

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test 1.9: Pagination & Filtering
1. If list has >10 items, check pagination
2. **Expected:** Page numbers show
3. Click page 2
4. **Expected:** Different deliveries load
5. Use search box to filter by delivery number
6. **Expected:** List filters dynamically
7. Use status filter dropdown
8. **Expected:** List filters by status

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test 1.10: Validation Rules
1. Try to create delivery without selecting outlet
2. **Expected:** Validation error
3. Try to submit a delivery with no items (if items required)
4. **Expected:** Appropriate error message

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

---

## 2️⃣ Disposal Management Testing

**Page:** `operation/disposal`  
**Endpoints:** 8 endpoints  
**Document Number Format:** DS-YYYY-XXXXXX

### Test 2.1: Page Access & Data Loading
1. Navigate to Operations → Disposal
2. **Expected:** Page loads successfully
3. **Expected:** List shows disposals or empty state

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test 2.2: Create Disposal
1. Click "Add Disposal"
2. Fill form:
   - Disposal Date: Today
   - Delivered Date: Yesterday or earlier
   - Showroom: Select outlet
   - Notes: "Test disposal"
3. Click "Save"
4. **Expected:** Success toast
5. **Expected:** Document number DS-2026-XXXXXX generated

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test 2.3: Workflow Testing (Same as Delivery)
1. Test Submit (Draft → Pending)
2. Test Approve (Pending → Approved)
3. Test Reject (Pending → Rejected)
4. **Expected:** All workflow transitions work correctly

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test 2.4: Date Validation
1. Try to create disposal with Delivered Date > Disposal Date
2. **Expected:** Validation error (disposal date must be after delivered date)

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

---

## 3️⃣ Transfer Management Testing

**Page:** `operation/transfer`  
**Endpoints:** 8 endpoints  
**Document Number Format:** TR-YYYY-XXXXXX

### Test 3.1: Page Access & Data Loading
1. Navigate to Operations → Transfer
2. **Expected:** Page loads successfully

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test 3.2: Create Transfer with From/To Outlets
1. Click "Add Transfer"
2. Fill form:
   - Transfer Date: Today
   - From Showroom: Select outlet A
   - To Showroom: Select outlet B (different from A)
   - Notes: "Test transfer"
3. Click "Save"
4. **Expected:** Success toast
5. **Expected:** Document number TR-2026-XXXXXX generated

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test 3.3: Same Outlet Validation
1. Try to create transfer with From Showroom = To Showroom
2. **Expected:** Validation error: "From and To outlets must be different"

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test 3.4: Workflow Testing
1. Test Submit, Approve, Reject (same as Delivery)
2. **Expected:** All transitions work

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

---

## 4️⃣ Cancellation Management Testing

**Page:** `operation/cancellation`  
**Endpoints:** 7 endpoints  
**Document Number Format:** DCN########

### Test 4.1: Page Access & Data Loading
1. Navigate to Operations → Cancellation
2. **Expected:** Page loads successfully

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test 4.2: Create Cancellation (Starts as Pending)
1. Click "Add Cancellation"
2. Fill form:
   - Cancellation Date: Today
   - Delivery No: "DN-2026-000001" (reference)
   - Delivered Date: Yesterday
   - Showroom: Select outlet
   - Reason: "Customer request"
3. Click "Save"
4. **Expected:** Success toast
5. **Expected:** Document number DCN######## generated
6. **Expected:** Status is "Pending" (not Draft)

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test 4.3: Workflow Testing (No Submit)
1. **Note:** Cancellations start as Pending
2. Test Approve (Pending → Approved)
3. Test Reject (Pending → Rejected)
4. **Expected:** No Submit button (starts Pending)

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test 4.4: No Items Array
1. View cancellation details
2. **Expected:** No items section (cancellations have no line items)

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

---

## 5️⃣ Delivery Return Testing

**Page:** `operation/delivery-return`  
**Endpoints:** 8 endpoints  
**Document Number Format:** RET########

### Test 5.1: Page Access & Data Loading
1. Navigate to Operations → Delivery Return
2. **Expected:** Page loads successfully

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test 5.2: Create Delivery Return
1. Click "Add Return"
2. Fill form:
   - Return Date: Today
   - Delivery No: Reference delivery
   - Delivered Date: Past date
   - Showroom: Select outlet
   - Reason: "Quality issue"
   - Total Items: 5
3. Click "Save"
4. **Expected:** Success toast
5. **Expected:** Document number RET######## generated

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test 5.3: Workflow Testing
1. Test Submit, Approve, Reject
2. **Expected:** All transitions work

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

---

## 6️⃣ Stock BF (Brought Forward) Testing

**Page:** `operation/stock-bf`  
**Endpoints:** 5 endpoints  
**Document Number Format:** SBF########

### Test 6.1: Page Access & Data Loading
1. Navigate to Operations → Stock BF
2. **Expected:** Page loads successfully

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test 6.2: Create Stock BF
1. Click "Add Stock BF"
2. Fill form:
   - BF Date: Today
   - Showroom: Select outlet
   - Product: Select product
   - Quantity: 100
3. Click "Save"
4. **Expected:** Success toast
5. **Expected:** Document number SBF######## generated
6. **Expected:** Status is "Active"

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test 6.3: No Workflow (Just CRUD)
1. **Note:** Stock BF has no workflow (no submit/approve)
2. Test only Create, Read, Update, Delete
3. **Expected:** No workflow buttons

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test 6.4: Unique Constraint Validation
1. Try to create duplicate: Same Outlet + BF Date + Product
2. **Expected:** Error: "Stock BF already exists for this combination"

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

---

## 7️⃣ Showroom Open Stock Testing

**Page:** `operation/showroom-open-stock`  
**Endpoints:** 6 endpoints

### Test 7.1: Page Access & Data Loading
1. Navigate to Operations → Showroom Open Stock
2. **Expected:** Page loads successfully
3. **Expected:** Shows list of all outlets with "Stock As At" dates

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test 7.2: View Open Stock (Non-Admin)
1. Login as regular user (non-admin)
2. **Expected:** Can view list
3. **Expected:** No "Edit Date" button visible

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test 7.3: Edit Open Stock Date (Admin Only)
1. Login as admin
2. Click "Edit Date" on any showroom
3. Change "Stock As At" date
4. Click "Save"
5. **Expected:** Success toast
6. **Expected:** Date updates in list

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test 7.4: Admin-Only Enforcement
1. Verify regular users cannot edit
2. **Expected:** Edit functionality hidden or disabled

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

---

## 8️⃣ Label Printing Testing

**Page:** `operation/label-printing`  
**Endpoints:** 8 endpoints  
**Document Number Format:** LBL########

### Test 8.1: Page Access & Data Loading
1. Navigate to Operations → Label Printing
2. **Expected:** Page loads successfully

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test 8.2: Product Filter (enableLabelPrint Only)
1. Check product dropdown
2. **Expected:** Only shows products with `enableLabelPrint = true`
3. **Expected:** Products with `enableLabelPrint = false` are hidden

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test 8.3: Create Label Print Request
1. Click "Add Request"
2. Fill form:
   - Date: Today
   - Product: Select label-enabled product
   - Label Count: 10
   - Start Date: Today
   - Expiry Days: 7
3. Click "Save"
4. **Expected:** Success toast
5. **Expected:** Document number LBL######## generated
6. **Expected:** Status is "Pending"

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test 8.4: Yellow Background for Future-Enabled Products
1. Select a product with `allowFutureLabelPrint = true`
2. **Expected:** Date field has yellow background (#FEF3C7)
3. **Expected:** Sun icon (☀️) appears
4. Select a product with `allowFutureLabelPrint = false`
5. **Expected:** Normal white background

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test 8.5: Workflow & Print Generation
1. Approve a label request
2. Click "Print" button
3. **Expected:** Print preview or download dialog
4. **Expected:** Label data formatted correctly

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

---

## 9️⃣ Showroom Label Printing Testing

**Page:** `operation/showroom-label-printing`  
**Endpoints:** 1 endpoint

### Test 9.1: Page Access
1. Navigate to Operations → Showroom Label Printing
2. **Expected:** Page loads successfully

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test 9.2: Generate Showroom Label
1. Fill form:
   - Showroom Code: Select outlet
   - Text 1: "Custom Text 1"
   - Text 2: "Custom Text 2"
   - Label Count: 5
2. Click "Print"
3. **Expected:** Print preview or download
4. **Expected:** Shows outlet code and custom text

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test 9.3: Form Validation
1. Try to print without selecting showroom
2. **Expected:** Validation error
3. Try with label count = 0
4. **Expected:** Validation error

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

---

## 🔒 Security & Permission Testing

### Test S.1: Permission Enforcement
1. Login as user without operation permissions
2. Try to access each operation page
3. **Expected:** Access denied or features disabled
4. Try to create/update/delete
5. **Expected:** API returns 403 Forbidden

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test S.2: Role-Based Access
1. Test with different user roles:
   - Admin: Full access
   - Manager: Approve access
   - User: Create/view only
2. **Expected:** Each role sees appropriate buttons/features

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

---

## 🛡️ Day-Lock Protection Testing

### Test D.1: Create Before Day-Lock
1. Ensure day-lock is active for past dates
2. Try to create delivery with past date
3. **Expected:** Error: "Date is locked"

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test D.2: Edit Before Day-Lock
1. Try to edit existing document with locked date
2. **Expected:** Error or edit button disabled

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

---

## 🔢 Auto-Number Generation Testing

### Test A.1: Sequential Numbering
1. Create 3 deliveries in sequence
2. **Expected:** Numbers increment: DN-2026-000001, DN-2026-000002, DN-2026-000003
3. Test for all document types

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test A.2: Year-Based Format
1. Check delivery, disposal, transfer numbers
2. **Expected:** Format is {PREFIX}-YYYY-XXXXXX with current year

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test A.3: Sequential Format
1. Check cancellation, return, stock BF, label numbers
2. **Expected:** Format is {PREFIX}######## (8 digits)

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

---

## 📊 Integration Testing

### Test I.1: Cross-Page Navigation
1. Create delivery
2. Navigate to disposal
3. Navigate back to delivery
4. **Expected:** Delivery still shows in list

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test I.2: Outlet Integration
1. Create delivery for Outlet A
2. Check that outlet name displays correctly
3. Filter by outlet
4. **Expected:** Shows only deliveries for that outlet

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test I.3: Product Integration
1. In Stock BF, select product
2. **Expected:** Product code and name display
3. Create label request for same product
4. **Expected:** Consistent product information

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

---

## 🎨 UI/UX Testing

### Test U.1: Loading States
1. On slow connection, check loading spinners
2. **Expected:** Loader2 spinner shows during API calls

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test U.2: Error Messages
1. Trigger validation error
2. **Expected:** Toast error appears with clear message
3. Trigger API error (disconnect backend)
4. **Expected:** "Failed to load data" toast appears

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test U.3: Success Messages
1. Create, update, delete operations
2. **Expected:** Success toast with appropriate message
3. **Expected:** Toast auto-dismisses after 3-5 seconds

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test U.4: Button States
1. During save operation, check button
2. **Expected:** Button disabled and shows loading spinner
3. After operation, button re-enables

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test U.5: Status Badges
1. Check color coding:
   - Draft: Gray
   - Pending: Yellow/Orange
   - Approved: Green
   - Rejected: Red
2. **Expected:** Colors are distinct and clear

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

---

## 🐛 Edge Cases & Error Scenarios

### Test E.1: Empty States
1. Test pages with no data
2. **Expected:** "No records found" or similar message

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test E.2: Network Errors
1. Disconnect network
2. Try to load page
3. **Expected:** Error message shows
4. Reconnect and retry
5. **Expected:** Data loads successfully

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test E.3: Concurrent Edits
1. Open same delivery in two browser tabs
2. Edit in tab 1 and save
3. Edit in tab 2 and save
4. **Expected:** Last save wins or conflict detection

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

### Test E.4: Large Data Sets
1. Create 100+ deliveries
2. **Expected:** Pagination works smoothly
3. **Expected:** No performance issues

**Result:** ☐ Pass ☐ Fail  
**Notes:** _______________

---

## 📋 Final Testing Checklist

### Functionality ✅
- [ ] All 9 pages load successfully
- [ ] CRUD operations work on all pages
- [ ] Workflow operations work (submit, approve, reject)
- [ ] Auto-number generation works
- [ ] Pagination works
- [ ] Filtering/search works
- [ ] Modal dialogs open/close correctly

### Data Integrity ✅
- [ ] No mock data visible
- [ ] All data comes from backend
- [ ] Data persists after page refresh
- [ ] Foreign keys work (outlets, products, users)

### Security ✅
- [ ] Permission checks work
- [ ] Day-lock protection works
- [ ] Admin-only features restricted
- [ ] API returns 401 for unauthenticated
- [ ] API returns 403 for unauthorized

### UI/UX ✅
- [ ] Loading spinners show during operations
- [ ] Toast notifications work
- [ ] Error messages are clear
- [ ] Success messages are clear
- [ ] Buttons disable during operations
- [ ] Status badges show correct colors
- [ ] Forms validate input

### Integration ✅
- [ ] Outlets dropdown populated
- [ ] Products dropdown populated
- [ ] User names display correctly
- [ ] Cross-page data consistency

### Performance ✅
- [ ] Pages load in < 2 seconds
- [ ] API calls respond in < 1 second
- [ ] No console errors
- [ ] No memory leaks (check dev tools)

---

## 📊 Test Summary Report

### Test Statistics
- **Total Tests:** 100+
- **Tests Passed:** ___
- **Tests Failed:** ___
- **Pass Rate:** ___%

### Critical Issues Found
1. _________________
2. _________________
3. _________________

### Minor Issues Found
1. _________________
2. _________________
3. _________________

### Recommendations
1. _________________
2. _________________
3. _________________

---

## 🎯 Sign-Off

**Tester Name:** _______________  
**Testing Date:** _______________  
**Overall Status:** ☐ Ready for Production ☐ Needs Fixes ☐ Major Issues  
**Signature:** _______________

---

**Next Steps:**
- [ ] Fix critical issues
- [ ] Re-test failed scenarios
- [ ] Update documentation
- [ ] Deploy to staging
- [ ] User acceptance testing
- [ ] Production deployment

---

**Testing Guide Version:** 1.0  
**Created:** April 27, 2026  
**Phase:** 6 - Operations
