# POS Auto-Approval Testing Guide

**Date:** May 15, 2026  
**Feature:** POS Sales Auto-Approval  
**Version:** 1.0

## Overview

This document provides comprehensive testing procedures for the POS auto-approval feature. All POS sales are now automatically approved upon payment, eliminating the manual approval workflow.

---

## Test Environment Setup

### Prerequisites
1. Backend API running with latest migration applied (`20260515090000_AutoApprovePosSales`)
2. POS application updated with latest code
3. Web frontend (DMS-Frontend) updated
4. Test database with at least:
   - 2 active outlets
   - 10+ active products
   - 2+ test users with POS permissions

### Test Accounts Required
- **POS User**: Has `pos:sale:create` and `pos:sale:view` permissions
- **Manager**: Has `pos:sale:approve`, `pos:sale:reject`, `pos:sale:void` permissions
- **Admin**: Has all permissions

---

## Test Cases

### 1. Normal POS Sale (Online Mode)

**Objective:** Verify that online POS sales are automatically approved immediately upon payment.

**Pre-conditions:**
- POS application is online
- User is logged in with `pos:sale:create` permission
- At least one outlet is selected

**Steps:**
1. Launch POS application
2. Log in with POS user credentials
3. Select an outlet from the header
4. Add 3 different products to the cart
5. Click "PAY" button
6. Select "Cash" payment method
7. Click "Complete sale"

**Expected Results:**
- ✅ Success toast displays: "Sale completed successfully."
- ✅ Cart is cleared
- ✅ Receipt can be printed immediately
- ✅ No "pending approval" message appears
- ✅ In Transaction History, sale shows status badge only if not "Approved"
- ✅ In backend database:
  ```sql
  SELECT id, sale_no, status, approved_by_id, approved_at, created_by_id, created_at
  FROM pos_sales
  WHERE sale_no = '<generated_sale_no>';
  ```
  - `status` = 'Approved'
  - `approved_by_id` = same as `created_by_id`
  - `approved_at` = approximately equal to `created_at`

**Acceptance Criteria:**
- Sale completes in under 3 seconds
- No approval workflow delay
- Cashier and customer can proceed immediately

---

### 2. Normal POS Sale with Card Payment

**Objective:** Verify card payments also auto-approve.

**Steps:**
1. Add products to cart
2. Click "PAY"
3. Select "Card" payment method
4. Click "Complete sale"

**Expected Results:**
- ✅ Same as Test Case #1
- ✅ Payment method shows "Card" in transaction history
- ✅ Status is "Approved" immediately

---

### 3. Offline Sale Queue Sync

**Objective:** Verify that sales made offline are auto-approved when synced online.

**Pre-conditions:**
- POS application starts online
- Then go offline (disconnect network or use offline mode)

**Steps:**
1. While offline, add products and complete 2 sales
2. Verify sales are queued locally (check sync status indicator)
3. Reconnect to network (or enable online mode)
4. Wait for automatic sync or manually trigger sync
5. Check Transaction History after sync completes

**Expected Results:**
- ✅ Offline sales show "Queued" badge in local Transaction History
- ✅ After sync, sales appear in backend with status "Approved"
- ✅ No manual approval required
- ✅ Sync success notification appears
- ✅ Transaction History updates to show synced sales as "Approved"

**Database Verification:**
```sql
SELECT sale_no, status, approved_at, created_at, client_mutation_id
FROM pos_sales
WHERE client_mutation_id IN ('<mutation_id_1>', '<mutation_id_2>');
```
- Both sales should have `status = 'Approved'`
- `approved_at` should be set to sync timestamp

---

### 4. Bulk Import via API

**Objective:** Verify bulk POS sale creation auto-approves all sales.

**Pre-conditions:**
- Backend API accessible
- Valid JWT token with `pos:sale:create` permission

**Steps:**
1. Prepare bulk sales payload:
   ```json
   {
     "sales": [
       {
         "outletId": "<outlet_uuid>",
         "paymentMethod": "Cash",
         "clientMutationId": "test-bulk-1",
         "lines": [
           { "productId": "<product_uuid>", "quantity": 2, "unitPrice": 150.00 }
         ]
       },
       {
         "outletId": "<outlet_uuid>",
         "paymentMethod": "Card",
         "clientMutationId": "test-bulk-2",
         "lines": [
           { "productId": "<product_uuid>", "quantity": 1, "unitPrice": 200.00 }
         ]
       }
     ]
   }
   ```
2. POST to `/api/pos-sales/bulk`
3. Verify response

**Expected Results:**
- ✅ HTTP 200 OK response
- ✅ Response contains:
  ```json
  {
    "success": true,
    "data": {
      "sales": [...],
      "totalProcessed": 2,
      "successCount": 2,
      "skippedCount": 0,
      "errors": null
    }
  }
  ```
- ✅ All sales in response have `status: "Approved"`
- ✅ Database verification shows `status = 'Approved'` for both records

---

### 5. Manual Void by Administrator

**Objective:** Verify that admins can still void approved sales when needed (for corrections, fraud, etc.).

**Pre-conditions:**
- At least one completed POS sale exists with status "Approved"
- Logged in as user with `pos:sale:void` permission

**Steps:**
1. Navigate to **Administrator → POS Sales** in web frontend
2. Find a completed sale
3. Click to view details
4. Click "Void" button (if available) or use API:
   ```http
   POST /api/pos-sales/{sale_id}/void
   Content-Type: application/json
   
   {
     "reason": "Customer dispute - returned all items"
   }
   ```

**Expected Results:**
- ✅ Sale status changes from "Approved" to "Voided"
- ✅ Rejection reason is recorded
- ✅ Operation approval audit log entry created
- ✅ In POS Transaction History, sale shows "Voided" badge (slate/gray color)
- ✅ Database:
  ```sql
  SELECT status, rejection_reason FROM pos_sales WHERE id = '<sale_id>';
  ```
  - `status = 'Voided'`
  - `rejection_reason = 'Customer dispute - returned all items'`

---

### 6. Receipt Generation

**Objective:** Verify receipts can be generated immediately after auto-approved sales.

**Pre-conditions:**
- POS application with auto-print enabled in settings

**Steps:**
1. Complete a sale (Cash or Card)
2. Observe auto-print behavior
3. Navigate to Transaction History
4. Select a completed sale
5. Click "Print receipt"

**Expected Results:**
- ✅ Receipt prints automatically after sale completion (if auto-print enabled)
- ✅ Receipt contains:
  - Sale number
  - Date/time
  - Cashier name
  - Line items with quantities and prices
  - Total amount
  - Payment method
- ✅ Manual reprint works from Transaction History
- ✅ PDF receipt can be downloaded via:
  ```http
  GET /api/pos-sales/{sale_id}/receipt
  ```
- ✅ Receipt does NOT show "Pending Approval" message
- ✅ Receipt shows sale as completed

---

### 7. Operations Module View

**Objective:** Verify Operations/Administrator POS sales view reflects auto-approval.

**Steps:**
1. Navigate to **Administrator → POS Sales** in web frontend
2. View the sales list
3. Check status column
4. Filter by status

**Expected Results:**
- ✅ Page subtitle shows: "Auto-approved on payment"
- ✅ Most/all sales show status badge as "Approved" (green)
- ✅ Status filter still works but defaults to showing all sales
- ✅ Exceptional cases (Voided, Rejected) show appropriate badges
- ✅ No sales stuck in "Pending" status from normal POS operations

---

### 8. Approvals Queue

**Objective:** Verify POS sales no longer appear in approvals queue.

**Steps:**
1. Navigate to **Administrator → Approvals** in web frontend
2. Check "POS Sales" subsection under "Operation" category
3. Complete 5 new POS sales
4. Refresh approvals page

**Expected Results:**
- ✅ "POS Sales" subsection shows 0 pending approvals
- ✅ Empty state message (if shown): "No pending sales requiring approval"
- ✅ Newly created sales do NOT appear in approval queue
- ✅ Other document types (Transfers, Deliveries, etc.) still show correctly

---

### 9. Idempotency Check

**Objective:** Verify that duplicate offline sync attempts don't create duplicate sales.

**Steps:**
1. Create a sale offline with `clientMutationId: "test-idempotent-123"`
2. Sync once - observe sale created with status "Approved"
3. Manually retry sync with same `clientMutationId`
4. Check database for duplicates

**Expected Results:**
- ✅ First sync creates sale with status "Approved"
- ✅ Second sync returns existing sale (idempotent behavior)
- ✅ No duplicate sales in database:
  ```sql
  SELECT COUNT(*) FROM pos_sales 
  WHERE client_mutation_id = 'test-idempotent-123' AND outlet_id = '<outlet_id>';
  ```
  - Count should be exactly 1

---

### 10. Performance Test

**Objective:** Verify auto-approval doesn't impact performance negatively.

**Steps:**
1. Create 50 sales in rapid succession (use bulk API or script)
2. Measure response times
3. Check database load

**Expected Results:**
- ✅ Each sale completes in < 500ms
- ✅ No database deadlocks or timeouts
- ✅ All 50 sales have status "Approved"
- ✅ No errors in backend logs

---

## Regression Testing

### Areas to Verify Haven't Broken

1. **Other Approval Workflows Still Work:**
   - Deliveries still require approval
   - Transfers still require approval
   - Stock BF still requires approval
   - Disposals still require approval

2. **Permissions Still Enforced:**
   - Users without `pos:sale:create` cannot create sales
   - `pos:sale:approve` permission still exists (for manual approval if needed)
   - `pos:sale:void` permission required to void sales

3. **Audit Trail Intact:**
   - `created_by_id` recorded correctly
   - `approved_by_id` set to creator (auto-approve)
   - `approved_at` timestamp recorded
   - Operation approvals table logs auto-approval transition

---

## Database Migration Verification

**Objective:** Verify migration ran successfully and updated existing records.

**Query 1 - Check Default Value:**
```sql
SELECT column_default
FROM information_schema.columns
WHERE table_name = 'pos_sales' AND column_name = 'status';
```
**Expected:** `'Approved'::character varying` or `'Approved'`

**Query 2 - Check Existing Sales Updated:**
```sql
SELECT 
  status,
  COUNT(*) as count,
  MIN(created_at) as oldest_sale,
  MAX(created_at) as newest_sale
FROM pos_sales
WHERE is_active = true
GROUP BY status;
```
**Expected:** 
- Most sales should be "Approved"
- No "Pending" sales from normal POS operations
- Any "Rejected" or "Voided" sales are from manual admin actions

**Query 3 - Verify Auto-Approval Fields:**
```sql
SELECT sale_no, status, approved_by_id, approved_at, created_by_id, created_at
FROM pos_sales
WHERE created_at > '2026-05-15 09:00:00'  -- After migration
  AND is_active = true
ORDER BY created_at DESC
LIMIT 10;
```
**Expected:**
- `status = 'Approved'` for all
- `approved_by_id = created_by_id`
- `approved_at ≈ created_at` (within seconds)

---

## Rollback Testing (Optional)

**Objective:** Verify system can be rolled back if issues arise.

**Steps:**
1. Run migration Down method:
   ```bash
   dotnet ef migrations remove --context ApplicationDbContext
   ```
2. Revert code changes in PosSaleService.cs
3. Restart backend
4. Create a test sale

**Expected Results:**
- Default status reverts to "Pending"
- Sales require manual approval again
- System functions as before

---

## Sign-off Checklist

- [ ] All 10 test cases pass
- [ ] No regressions detected in other workflows
- [ ] Database migration verified
- [ ] Performance acceptable (< 500ms per sale)
- [ ] Documentation updated
- [ ] User training materials updated
- [ ] Stakeholders notified of change
- [ ] Production deployment plan reviewed

---

## Known Issues / Notes

- **Note:** Existing "Pending" sales from before the migration will be automatically converted to "Approved" by the migration script
- **Future Enhancement:** Consider adding conditional approval rules for high-value transactions (see plan document)

---

## Contact

For issues or questions, contact:
- **Backend:** [Development Team]
- **Frontend:** [Development Team]
- **Database:** [DBA Team]
