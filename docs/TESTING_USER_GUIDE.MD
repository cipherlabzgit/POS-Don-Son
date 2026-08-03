# Don & Sons DMS - Testing & User Guide (Completed Features Only)

**Version:** 1.0  
**Last Updated:** May 13, 2026  
**Purpose:** Testing guide for implemented and integrated features only

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Access & Login](#2-system-access--login)
3. [User Management & Role Assignment](#3-user-management--role-assignment)
4. [Operations Module Testing](#4-operations-module-testing)
5. [Approvals System](#5-approvals-system)
6. [POS System Guide](#6-pos-system-guide)
7. [Supporting Modules](#7-supporting-modules)
8. [Testing Checklist](#8-testing-checklist)

---

## 1. Introduction

### 1.1 What's Covered in This Guide

This guide covers **only the completed and fully integrated features** of the Don & Sons DMS system:

✅ **Completed Features:**
- Authentication & Authorization
- User Management (Create, Edit, Assign Roles, Delete)
- Role & Permission Management
- **Operations Module** (9 pages - fully integrated):
  - Delivery
  - Disposal
  - Transfer
  - Stock BF
  - Cancellation
  - Delivery Return
  - Label Printing
  - Showroom Open Stock
  - Showroom Label Printing
- **Approval System** (Unified approval queue)
- **POS System** (Desktop application with offline mode)
- **Supporting Features**:
  - Inventory Management (Categories, UOM, Products, Ingredients)
  - Showroom Management
  - System Settings

❌ **NOT Covered** (Not Yet Implemented):
- DMS Planning (Delivery Plan, Order Entry, Default Quantities)
- Production Planner & Stores Issue Note
- Production Module (Daily Production, Stock Adjustment)
- Reports Module
- Day-End Process

### 1.2 Test Environment Requirements

**Backend:**
```bash
cd "C:\Cipher Labz\DonandSons-New\DonandSons-DMS\DMS-Backend"
dotnet run
```
- URL: `https://localhost:5001` or `http://localhost:5000`

**Frontend:**
```bash
cd "C:\Cipher Labz\DonandSons-New\DonandSons-DMS\DMS-Frontend"
npm run dev
```
- URL: `http://localhost:3000`

**Database:**
- PostgreSQL running
- Database: `dms_db` (or configured name)
- Migrations applied automatically on backend startup

---

## 2. System Access & Login

### 2.1 Login Process

**Test Credentials:**
- **Super Admin:**
  - Email: `admin@donandson.com`
  - Password: `Admin@123` (or your configured password)

**Steps:**
1. Open browser and navigate to `http://localhost:3000`
2. Should redirect to `/login` page
3. See Don & Sons branded login screen (red and gold theme)
4. Enter email address
5. Enter password
6. Click **"Sign In"** button

**Expected Result:**
- ✅ Success: Redirect to `/dashboard`
- ✅ Token stored in browser localStorage
- ✅ User menu appears in top-right corner

**Test Invalid Login:**
1. Enter: `admin@donandson.com` / `wrongpassword`
2. Click "Sign In"
3. **Expected:** Error toast showing "Invalid credentials"
4. Should remain on login page

### 2.2 Logout

**Steps:**
1. Click user menu (top-right corner)
2. Click **"Logout"**

**Expected Result:**
- ✅ Redirect to `/login`
- ✅ localStorage cleared
- ✅ Cannot access protected pages without logging in again

### 2.3 Super Admin Permissions

**Important:** Super Admin has **ALL permissions automatically**
- No need to assign permissions to super admin
- Super admin can access all pages and perform all actions
- Set via `IsSuperAdmin = true` in database

---

## 3. User Management & Role Assignment

### 3.1 View Users

**Location:** `/administrator/users`

**Steps:**
1. Login as admin
2. Navigate to **Administrator** → **Security** → **Users** tab
3. View user list

**Expected Result:**
- ✅ See list of users with pagination
- ✅ Columns: Username, Email, First Name, Last Name, Phone, Roles, Active status
- ✅ **NO MOCK DATA** - all data from database
- ✅ Search box functional
- ✅ Pagination working

**Screenshot Verification:**
- User list displays actual database data
- Pagination shows correct total count

### 3.2 Create New User

**Steps:**
1. On Users page, click **"Add User"** button
2. Fill in user form:
   - **Username:** `testuser1` (unique, required)
   - **Email:** `testuser1@test.com` (unique, required)
   - **First Name:** `Test` (required)
   - **Last Name:** `User` (required)
   - **Phone:** `0771234567` (optional)
   - **Password:** `Test@123` (required, min 8 characters)
   - **Confirm Password:** `Test@123` (must match)
   - **Active:** Check (to activate immediately)
3. Click **"Create User"** button

**Expected Result:**
- ✅ Success toast: "User created successfully"
- ✅ User appears in user list
- ✅ User can log in with credentials

**Verify in Database:**
```sql
SELECT * FROM users WHERE username = 'testuser1';
```
- ✅ User record exists
- ✅ Password is hashed
- ✅ `is_active = true`

**Test Validation:**
1. Try creating user with duplicate username → Should show error
2. Try creating user with invalid email format → Should show error
3. Try creating user with password < 8 characters → Should show error

### 3.3 Edit User

**Steps:**
1. Find `testuser1` in user list
2. Click **edit icon** (✏️) next to user
3. Modify details:
   - Change First Name to `Updated Test`
   - Change Phone to `0779876543`
4. Click **"Update User"** button

**Expected Result:**
- ✅ Success toast: "User updated successfully"
- ✅ Changes reflected in user list
- ✅ User can still log in with same credentials

**Verify in Database:**
```sql
SELECT first_name, phone FROM users WHERE username = 'testuser1';
```
- ✅ Values updated correctly

### 3.4 Assign Roles to User

**Steps:**
1. Find `testuser1` in user list
2. Click **"Assign Roles"** button
3. Role assignment modal opens
4. Select roles:
   - Check **"Manager"** role
   - Check **"Cashier"** role (can assign multiple)
5. Click **"Save"** button

**Expected Result:**
- ✅ Success toast: "Roles assigned successfully"
- ✅ User row shows "Manager, Cashier" in Roles column
- ✅ User inherits permissions from assigned roles

**Verify in Database:**
```sql
SELECT r.name 
FROM user_roles ur
JOIN roles r ON r.id = ur.role_id
JOIN users u ON u.id = ur.user_id
WHERE u.username = 'testuser1';
```
- ✅ Shows assigned roles

**Test Permission Effect:**
1. Logout from admin account
2. Login as `testuser1` / `Test@123`
3. Check accessible pages (should only see pages with Manager/Cashier permissions)
4. Logout and login back as admin

### 3.5 Reset User Password

**Steps:**
1. Find `testuser1` in user list
2. Click **"Reset Password"** button
3. Enter new password: `NewTest@123`
4. Confirm password: `NewTest@123`
5. Click **"Reset"** button

**Expected Result:**
- ✅ Success toast: "Password reset successfully"
- ✅ User can log in with new password
- ✅ Old password no longer works

**Verify:**
1. Logout
2. Try login with old password: `Test@123` → Should fail
3. Login with new password: `NewTest@123` → Should succeed
4. Logout and login back as admin

### 3.6 Deactivate User (Soft Delete)

**Steps:**
1. Find `testuser1` in user list
2. Click **edit icon**
3. Uncheck **"Active"** checkbox
4. Click **"Update User"** button

**Expected Result:**
- ✅ Success toast: "User updated successfully"
- ✅ User still appears in list but marked as inactive
- ✅ User **cannot** log in

**Verify:**
1. Logout
2. Try login as `testuser1` → Should show "Account is inactive" error
3. Login back as admin

**Verify in Database:**
```sql
SELECT is_active FROM users WHERE username = 'testuser1';
```
- ✅ `is_active = false` (soft deleted, not permanently removed)

### 3.7 Roles Management

**Location:** `/administrator/roles`

**View Roles:**
1. Navigate to **Administrator** → **Security** → **Roles** tab
2. View list of roles

**Expected:**
- ✅ See all system roles
- ✅ Columns: Role Name, Description, User Count, Permission Count
- ✅ Data from database (not mock)

**Create New Role:**
1. Click **"Add Role"** button
2. Fill form:
   - **Role Name:** `Test Manager`
   - **Description:** `Role for testing purposes`
3. Click **"Create Role"**
4. **Expected:** Success toast, role appears in list

**Assign Permissions to Role:**
1. Find `Test Manager` role in list
2. Click **"Assign Permissions"** button
3. Permission matrix opens
4. Select permissions:
   - Check `operation:delivery:view`
   - Check `operation:delivery:create`
   - Check `operation:delivery:submit`
   - Check `operation:disposal:view`
5. Click **"Save Permissions"**
6. **Expected:** Success toast

**Verify Permission Assignment:**
1. Create new user `testmanager1` (follow steps in 3.2)
2. Assign `Test Manager` role to user
3. Logout and login as `testmanager1`
4. Navigate to **Operation** → **Delivery**
5. **Expected:** Can view deliveries and create new delivery
6. Try accessing **Administrator** → **Users**
7. **Expected:** Access denied or page not shown in menu
8. Logout and login back as admin

### 3.8 Permissions Reference

**Location:** `/administrator/permissions`

**Steps:**
1. Navigate to **Administrator** → **Security** → **Permissions** tab
2. View permission list

**Expected:**
- ✅ See all system permissions grouped by module
- ✅ **Read-only view** (no add/edit/delete buttons)
- ✅ Shows permission code, name, module

**Common Permission Codes:**
```
# User Management
users:read
users:create
users:update
users:delete

# Operations
operation:delivery:view
operation:delivery:create
operation:delivery:update
operation:delivery:submit
operation:delivery:approve
operation:delivery:reject

operation:disposal:view
operation:disposal:create
operation:disposal:submit
operation:disposal:approve

operation:transfer:view
operation:transfer:create
operation:transfer:submit
operation:transfer:approve

# Approvals
approval:view
approval:approve
approval:reject

# POS
pos:sale:view
pos:sale:create
pos:sale:approve
pos:sale:reject
```

---

## 4. Operations Module Testing

### 4.1 Overview

The Operations module has **9 pages**, all **fully integrated** with backend APIs:

1. **Delivery** - Product deliveries to showrooms
2. **Disposal** - Record waste/disposals
3. **Transfer** - Inter-outlet stock transfers
4. **Stock BF** - Brought forward stock (opening stock)
5. **Cancellation** - Cancel orders/deliveries
6. **Delivery Return** - Process returns
7. **Label Printing** - Print product labels
8. **Showroom Open Stock** - View/update opening stock
9. **Showroom Label Printing** - Generate showroom labels

**Common Features (All 9 Pages):**
- ✅ Real backend API integration (zero mock data)
- ✅ Loading states with spinners
- ✅ Error handling with toast notifications
- ✅ Form validation
- ✅ Pagination
- ✅ Search and filtering
- ✅ Status badges with proper colors

### 4.2 Delivery Management

**Location:** `/operation/delivery`

**Prerequisites:**
- At least one showroom exists (see Section 7.2)
- At least one product exists (see Section 7.1)

#### 4.2.1 View Deliveries

**Steps:**
1. Navigate to **Operation** → **Delivery**
2. View delivery list

**Expected Result:**
- ✅ See list of deliveries (may be empty initially)
- ✅ Columns: Delivery No, Date, Showroom, Status, Total Items, Actions
- ✅ Pagination working
- ✅ Filter by status: Draft, Pending, Approved, Rejected
- ✅ Search by delivery number

#### 4.2.2 Create Delivery

**Steps:**
1. Click **"New Delivery"** button
2. Fill delivery header:
   - **Date:** Select today's date
   - **Showroom:** Select a showroom from dropdown (e.g., "Dalugama - DAL")
   - **Delivery Turn:** Optional - select if available
   - **Notes:** Optional - "Test delivery for training"
3. Add delivery items:
   - Click **"Add Item"** button
   - **Product:** Select from dropdown (e.g., "Fish Curry Bun")
   - **Variant:** If product has Full/Mini, select one
   - **Quantity:** Enter `10`
   - Click **"Add"** button
   - Repeat to add 2-3 more items
4. Review items in table (Product, Variant, Quantity, Actions)
5. Click **"Save as Draft"** button

**Expected Result:**
- ✅ Success toast: "Delivery saved as draft"
- ✅ Delivery appears in list with status **"Draft"**
- ✅ Auto-generated Delivery No: `DN-2026-XXXXXX`

**Verify in Database:**
```sql
SELECT * FROM deliveries ORDER BY created_at DESC LIMIT 1;
SELECT * FROM delivery_items WHERE delivery_id = '<delivery_id>';
```
- ✅ Delivery record exists
- ✅ Status = 'Draft'
- ✅ Items saved correctly

#### 4.2.3 Edit Delivery (Draft Only)

**Steps:**
1. Find draft delivery in list
2. Click **edit icon** (✏️)
3. Modify:
   - Change quantity of first item to `15`
   - Add new item
   - Remove one item (click × button)
4. Click **"Save Changes"**

**Expected Result:**
- ✅ Success toast: "Delivery updated successfully"
- ✅ Changes reflected in delivery list
- ✅ Can only edit **Draft** deliveries (edit button disabled for other statuses)

#### 4.2.4 Submit Delivery for Approval

**Steps:**
1. Open draft delivery (click edit)
2. Review all items
3. Click **"Submit for Approval"** button
4. Confirm submission

**Expected Result:**
- ✅ Success toast: "Delivery submitted for approval"
- ✅ Status changes to **"Pending"**
- ✅ Status badge shows yellow/orange color
- ✅ **Cannot edit anymore** (edit button disabled)
- ✅ Delivery appears in approval queue

**Status Workflow:**
```
Draft → Submit → Pending → Approve/Reject → Approved/Rejected
          ↓
       Cancel → Cancelled
```

#### 4.2.5 View Delivery Details

**Steps:**
1. Click on any delivery row (or click view icon 👁️)
2. View delivery details modal/page

**Expected Result:**
- ✅ Shows delivery header: No, Date, Showroom, Turn, Notes
- ✅ Shows all items with: Product name, Variant, Quantity
- ✅ Shows totals: Total items, Total quantity
- ✅ Shows audit info: Created by, Created at, Approved by, Approved at
- ✅ Shows status badge

#### 4.2.6 Cancel Delivery

**Steps:**
1. Find delivery with status Draft or Pending
2. Click **"Cancel"** button
3. Confirm cancellation

**Expected Result:**
- ✅ Success toast: "Delivery cancelled"
- ✅ Status changes to **"Cancelled"**
- ✅ Status badge shows gray color

**Note:** Cannot cancel Approved or Rejected deliveries

### 4.3 Disposal Management

**Location:** `/operation/disposal`

**Purpose:** Record product waste, expired items, damaged goods

#### 4.3.1 Create Disposal

**Steps:**
1. Navigate to **Operation** → **Disposal**
2. Click **"New Disposal"** button
3. Fill disposal header:
   - **Date:** Select today's date
   - **Showroom:** Select showroom
   - **Reason:** Select from dropdown:
     - Expired
     - Damaged
     - Quality Issue
     - Overproduction
     - Other
   - **Notes:** Optional - "Expired items from yesterday's stock"
4. Add disposal items:
   - Click **"Add Item"** button
   - Select **Product**
   - Select **Variant** (if applicable)
   - Enter **Quantity** (e.g., `5`)
   - Optional: Enter item-specific **Reason**
   - Click **"Add"**
   - Repeat for multiple items
5. Review disposal items
6. Click **"Save as Draft"** or **"Submit for Approval"**

**Expected Result:**
- ✅ Success toast: "Disposal saved"
- ✅ Disposal appears in list with status Draft or Pending
- ✅ Auto-generated Disposal No: `DS-2026-XXXXXX`

#### 4.3.2 Submit and Approve Disposal

**Steps:**
1. If saved as draft, submit disposal (click edit → Submit for Approval)
2. Disposal status changes to **Pending**
3. Navigate to **Administrator** → **Approvals** (see Section 5)
4. Find disposal in approval queue
5. Click **"Approve"** button
6. Confirm approval

**Expected Result:**
- ✅ Success toast: "Disposal approved"
- ✅ Status changes to **"Approved"**
- ✅ Status badge shows green color
- ✅ Stock quantity deducted (if inventory module integrated)

**Workflow:**
```
Draft → Submit → Pending → Approve → Approved
                           Reject → Rejected
```

#### 4.3.3 Reject Disposal

**Steps:**
1. Create another disposal and submit for approval
2. Navigate to **Administrator** → **Approvals**
3. Find disposal in queue
4. Click **"Reject"** button
5. Enter rejection reason: "Quantities incorrect, please resubmit"
6. Confirm rejection

**Expected Result:**
- ✅ Success toast: "Disposal rejected"
- ✅ Status changes to **"Rejected"**
- ✅ Status badge shows red color
- ✅ Rejection reason stored and visible
- ✅ Creator can view reason and create new disposal

### 4.4 Transfer Management

**Location:** `/operation/transfer`

**Purpose:** Transfer stock between outlets/showrooms

#### 4.4.1 Create Transfer

**Steps:**
1. Navigate to **Operation** → **Transfer**
2. Click **"New Transfer"** button
3. Fill transfer header:
   - **Date:** Select today's date
   - **From Showroom:** Select source outlet (e.g., "Dalugama")
   - **To Showroom:** Select destination outlet (e.g., "Kelaniya")
     - **Important:** Must be different from source
   - **Reason:** Select or enter reason:
     - Excess stock balancing
     - Emergency replenishment
     - Stock rebalancing
   - **Notes:** Optional
4. Add transfer items:
   - Click **"Add Item"** button
   - Select **Product**
   - Select **Variant**
   - Enter **Quantity** to transfer (e.g., `20`)
   - Click **"Add"**
   - Repeat for multiple items
5. Review items
6. Click **"Save as Draft"** or **"Submit for Approval"**

**Expected Result:**
- ✅ Success toast: "Transfer saved"
- ✅ Transfer appears in list with status Draft or Pending
- ✅ Auto-generated Transfer No: `TR-2026-XXXXXX`
- ✅ Shows both From and To showrooms

**Validation:**
- ✅ Cannot select same showroom for From and To
- ✅ Shows error if From = To

#### 4.4.2 Approve Transfer

**Steps:**
1. Submit transfer for approval
2. Navigate to **Administrator** → **Approvals**
3. Find transfer in queue
4. Review From/To showrooms and items
5. Click **"Approve"** button
6. Confirm approval

**Expected Result:**
- ✅ Success toast: "Transfer approved"
- ✅ Status changes to **"Approved"**
- ✅ Stock deducted from source showroom
- ✅ Stock added to destination showroom (if inventory integrated)
- ✅ Transfer appears in receiving showroom's POS "Pending Transfers"

**Note:** See Section 6.10 for receiving transfers in POS

#### 4.4.3 Workflow

```
Draft → Submit → Pending → Approve → Approved → Received (in POS)
                           Reject → Rejected
```

### 4.5 Stock BF (Brought Forward)

**Location:** `/operation/stock-bf`

**Purpose:** Record opening stock balances at start of day

#### 4.5.1 Create Stock BF

**Steps:**
1. Navigate to **Operation** → **Stock BF**
2. Click **"New Stock BF"** button
3. Fill header:
   - **BF Date:** Select date (typically today)
   - **Showroom:** Select outlet
   - **Notes:** Optional
4. Add stock items:
   - Click **"Add Item"** button
   - Select **Product**
   - Select **Variant**
   - Enter **Quantity** on hand (e.g., `50`)
   - Click **"Add"**
   - Repeat for all items in stock
5. Review items
6. Click **"Save"** button

**Expected Result:**
- ✅ Success toast: "Stock BF saved successfully"
- ✅ Stock BF appears in list
- ✅ Auto-generated Stock BF No: `SBF########`
- ✅ Status shows as **"Active"** or **"Recorded"**

**Important Notes:**
- Stock BF does **NOT** have approval workflow (immediate save)
- Unique per: Outlet + Date + Product
- Used for reconciliation and variance reports

**Verify in Database:**
```sql
SELECT * FROM stock_bf 
WHERE outlet_id = '<outlet_id>' AND bf_date = '2026-05-13'
ORDER BY created_at DESC;
```

#### 4.5.2 Edit Stock BF

**Steps:**
1. Find Stock BF in list
2. Click **edit icon**
3. Modify quantities as needed
4. Click **"Update"**

**Expected Result:**
- ✅ Success toast: "Stock BF updated"
- ✅ Changes saved to database

#### 4.5.3 Stock BF from POS

**Note:** Stock BF can also be created from POS terminal (see Section 6.9)
- POS users submit Stock BF via Operations drawer
- Appears in web app immediately
- Same data, different entry point

### 4.6 Cancellation

**Location:** `/operation/cancellation`

**Purpose:** Cancel orders or deliveries (header-only, no items)

#### 4.6.1 Create Cancellation

**Steps:**
1. Navigate to **Operation** → **Cancellation**
2. Click **"New Cancellation"** button
3. Fill cancellation form:
   - **Date:** Cancellation date
   - **Reference Type:** Select what's being cancelled:
     - Order
     - Delivery
     - Production
   - **Reference No:** Enter document number (e.g., "DN-2026-000123")
   - **Showroom:** Select affected outlet
   - **Reason:** Enter reason (required) - e.g., "Customer cancelled order"
   - **Notes:** Optional additional details
4. Click **"Submit Cancellation"**

**Expected Result:**
- ✅ Success toast: "Cancellation submitted"
- ✅ Status automatically set to **"Pending"** (no draft status)
- ✅ Auto-generated Cancellation No: `DCN########`
- ✅ Appears in approval queue

**Important:** Cancellations have no item-level details (header only)

#### 4.6.2 Approve/Reject Cancellation

**Steps:**
1. Navigate to **Administrator** → **Approvals**
2. Find cancellation in queue
3. Review reason and reference
4. **To Approve:**
   - Click **"Approve"** button
   - Confirm approval
   - Referenced document is cancelled
5. **To Reject:**
   - Click **"Reject"** button
   - Enter rejection reason
   - Confirm rejection
   - Original document remains active

**Workflow:**
```
Pending → Approve → Approved (reference document cancelled)
          Reject → Rejected (reference document unchanged)
```

### 4.7 Delivery Return

**Location:** `/operation/delivery-return`

**Purpose:** Process returns from customers or showrooms

#### 4.7.1 Create Delivery Return

**Steps:**
1. Navigate to **Operation** → **Delivery Return**
2. Click **"New Delivery Return"** button
3. Fill return header:
   - **Return Date:** Date of return
   - **Delivery Note No:** Original delivery reference (e.g., "DN-2026-000123")
   - **Showroom:** Outlet where return is happening
   - **Return Reason:** Select from dropdown:
     - Customer dissatisfaction
     - Quality issue
     - Overdelivery
     - Expiry concern
     - Damaged during delivery
   - **Notes:** Optional details
4. Add return items:
   - Click **"Add Item"** button
   - Select **Product**
   - Select **Variant**
   - Enter **Return Quantity** (e.g., `3`)
   - Select **Condition:**
     - Good (can resell)
     - Damaged (cannot resell)
     - Expired (cannot resell)
   - Click **"Add"**
   - Repeat for all returned items
5. Review items
6. Click **"Save as Draft"** or **"Submit for Approval"**

**Expected Result:**
- ✅ Success toast: "Delivery return saved"
- ✅ Return appears in list with status Draft or Pending
- ✅ Auto-generated Return No: `RET########`

#### 4.7.2 Approve Delivery Return

**Steps:**
1. Submit return for approval (if draft)
2. Navigate to **Administrator** → **Approvals**
3. Find return in queue
4. Review items, quantities, and conditions
5. Click **"Approve"** button
6. Confirm approval

**Expected Result:**
- ✅ Success toast: "Delivery return approved"
- ✅ Status changes to **"Approved"**
- ✅ Stock adjusted based on condition:
   - **Good:** Stock added back to inventory
   - **Damaged/Expired:** May be added to disposal or written off

**Workflow:**
```
Draft → Submit → Pending → Approve → Approved
                           Reject → Rejected
```

**Note:** Delivery returns can also be created from POS (see Section 6.11)

### 4.8 Label Printing

**Location:** `/operation/label-printing`

**Purpose:** Request and manage product label printing

#### 4.8.1 Create Label Print Request

**Steps:**
1. Navigate to **Operation** → **Label Printing**
2. Click **"New Label Request"** button
3. Fill request form:
   - **Print Date:** Date labels are needed
   - **Showroom:** Outlet requesting labels
   - **Label Type:** Select type:
     - Product label
     - Price label
     - Barcode label
     - Promotional label
   - **Notes:** Optional notes
4. Add products for labeling:
   - Click **"Add Product"** button
   - Select **Product**
   - Select **Variant** (if applicable)
   - Enter **Quantity** of labels needed (e.g., `100`)
   - Click **"Add"**
   - Repeat for multiple products
5. Review label list
6. Click **"Submit Request"**

**Expected Result:**
- ✅ Success toast: "Label request submitted"
- ✅ Status set to **"Pending"**
- ✅ Auto-generated Request No: `LBL########`
- ✅ Appears in approval queue

**Special Feature:**
- ✅ Products with `allowFutureLabelPrint = true` show **yellow background** (#FEF3C7)
- ✅ Indicates these products can have labels printed for future dates

#### 4.8.2 Approve Label Request

**Steps:**
1. Navigate to **Administrator** → **Approvals**
2. Find label request in queue
3. Review products and quantities
4. Check label settings compliance (future date rules, etc.)
5. Click **"Approve"** button
6. Confirm approval

**Expected Result:**
- ✅ Success toast: "Label request approved"
- ✅ Status changes to **"Approved"**
- ✅ Labels can now be printed

#### 4.8.3 Print Labels (After Approval)

**Steps:**
1. Find approved label request
2. Click **"Print Labels"** button
3. Select label template (if multiple available)
4. Preview labels
5. Click **"Print"**

**Expected Result:**
- ✅ Labels sent to printer
- ✅ Or download PDF of labels

**Workflow:**
```
Pending → Approve → Approved → Print
          Reject → Rejected
```

### 4.9 Showroom Open Stock

**Location:** `/operation/showroom-open-stock`

**Purpose:** View and update showroom opening stock (admin-only edit)

#### 4.9.1 View Open Stock

**Steps:**
1. Navigate to **Operation** → **Showroom Open Stock**
2. Select **Showroom** from dropdown
3. Select **Date**
4. Click **"Load Stock"** button

**Expected Result:**
- ✅ Shows all products with opening stock quantities
- ✅ Data from database (not mock)
- ✅ Columns: Product, Code, Variant, Opening Quantity, UOM

#### 4.9.2 Update Open Stock (Admin Only)

**Steps:**
1. Load open stock (as above)
2. Click **"Edit"** button
3. Modify quantities for products as needed
4. Click **"Save Changes"**

**Expected Result:**
- ✅ Success toast: "Open stock updated"
- ✅ Stock balances updated in database

**Permission Required:**
- Only users with `operation:showroom-open-stock:update` permission can edit

### 4.10 Showroom Label Printing

**Location:** `/operation/showroom-label-printing`

**Purpose:** Generate and print labels specifically for showroom use

#### 4.10.1 Generate Showroom Labels

**Steps:**
1. Navigate to **Operation** → **Showroom Label Printing**
2. Select **Showroom**
3. Select **Date**
4. Select **Label Type:**
   - Price labels
   - Product labels
   - Barcode labels
   - Promotional labels
5. Click **"Generate Labels"** button

**Expected Result:**
- ✅ System prepares label data
- ✅ Shows label preview
- ✅ Can adjust quantity per product

#### 4.10.2 Print Labels

**Steps:**
1. Review label preview
2. Select **Label Template** (if multiple available)
3. Click **"Print"** button

**Expected Result:**
- ✅ Labels sent to printer or download PDF

**Batch Print:**
1. Select multiple products using checkboxes
2. Set **Quantity per Product**
3. Click **"Batch Print"**
4. All labels print in sequence

---

## 5. Approvals System

### 5.1 Overview

**Location:** `/administrator/approvals`

The Approvals page is a **unified approval queue** for all workflow documents across the system.

**Document Types in Approval Queue:**
- Deliveries (status: Pending)
- Disposals (status: Pending)
- Transfers (status: Pending)
- Stock BF (if workflow enabled)
- Cancellations (status: Pending)
- Delivery Returns (status: Pending)
- Label Print Requests (status: Pending)
- POS Sales (status: Pending)
- Cash Submissions (status: Pending)

### 5.2 View Approval Queue

**Steps:**
1. Login as user with `approval:view` permission (or super admin)
2. Navigate to **Administrator** → **Approvals**
3. View approval queue

**Expected Result:**
- ✅ See list of all pending approval items
- ✅ Grouped or filtered by document type
- ✅ Shows: Document No, Type, Date, Showroom, Submitted by, Status
- ✅ Filter options:
  - By Document Type (Delivery, Disposal, Transfer, etc.)
  - By Date Range
  - By Showroom
  - By Status (Pending, Approved, Rejected)

### 5.3 Approve an Item

**Steps:**
1. Find pending item in approval queue
2. Click on item row to view details
3. Review document details:
   - Header information
   - Line items (if applicable)
   - Quantities and totals
   - Submitted by user
   - Submission date/time
4. Click **"Approve"** button
5. Optional: Add approval notes
6. Confirm approval

**Expected Result:**
- ✅ Success toast: "[Document Type] approved successfully"
- ✅ Status changes to **"Approved"**
- ✅ Status badge turns green
- ✅ Item removed from pending queue (or filtered to approved view)
- ✅ Approved by user and timestamp recorded
- ✅ Business logic executes (stock movements, etc.)

### 5.4 Reject an Item

**Steps:**
1. Find pending item in approval queue
2. Click on item row to view details
3. Review document
4. Click **"Reject"** button
5. **Enter rejection reason** (required) - e.g., "Quantities are incorrect. Please verify and resubmit."
6. Confirm rejection

**Expected Result:**
- ✅ Success toast: "[Document Type] rejected"
- ✅ Status changes to **"Rejected"**
- ✅ Status badge turns red
- ✅ Item removed from pending queue
- ✅ Rejection reason stored
- ✅ Creator notified and can view rejection reason
- ✅ No business logic executes (no stock movements)

### 5.5 Bulk Approve (If Available)

**Steps:**
1. Select multiple pending items using checkboxes
2. Click **"Bulk Approve"** button
3. Confirm bulk approval

**Expected Result:**
- ✅ All selected items approved
- ✅ Success toast showing count: "5 items approved successfully"

### 5.6 Filter and Search

**Filter by Type:**
1. Select document type filter: "Delivery"
2. **Expected:** Shows only delivery documents

**Filter by Date:**
1. Select date range: "Last 7 days"
2. **Expected:** Shows items from last 7 days only

**Filter by Showroom:**
1. Select showroom: "Dalugama"
2. **Expected:** Shows items for Dalugama outlet only

**Search:**
1. Enter document number in search box: "DN-2026-"
2. **Expected:** Shows matching deliveries

### 5.7 Permissions Required

**To view approvals:** `approval:view`  
**To approve:** `approval:approve`  
**To reject:** `approval:reject`

**Note:** Super admin has all permissions automatically

---

## 6. POS System Guide

### 6.1 POS Overview

The Don & Sons POS is a **desktop application** (Electron) for showroom cashiers to:
- Process sales
- Manage stock (Stock BF, Transfers, Returns)
- Submit cashier balance
- Work offline with automatic sync

**Key Features:**
- ✅ Offline-capable (works without internet)
- ✅ Automatic sync when online
- ✅ Touch-friendly interface
- ✅ Product catalog cached locally
- ✅ Receipt printing
- ✅ Theme customization (admin-controlled)

### 6.2 POS Installation

**System Requirements:**
- Windows 10 or later
- 4GB RAM (8GB recommended)
- 500MB free disk space

**Installation:**
1. Download installer: `Don & Sons POS Setup 2.0.0.exe`
2. Run installer (double-click)
3. Follow installation wizard
4. Click **"Install"**
5. Launch from desktop shortcut: "Don & Sons POS"

### 6.3 POS Login

**Steps:**
1. Launch POS application
2. See Don & Sons login screen
3. Enter **Email:** e.g., `cashier1@test.com`
4. Enter **Password:** e.g., `Cashier@123`
5. Click **"Sign In"**

**Expected Result:**
- ✅ If credentials valid: Main POS screen opens
- ✅ If online: Product catalog syncs automatically
- ✅ If offline: Uses cached catalog

**Network Status:**
- **Green badge** "Online": Connected to server
- **Gray badge** "Offline": No internet connection

### 6.4 POS Main Screen Layout

**Header:**
- Don & Sons logo (left)
- Online/Offline badge
- Sync status (shows pending items count)
- Showroom selector (dropdown)
- User menu (top-right)
- Zoom controls (+/-)

**Left Panel - Product Catalog:**
- Search bar (search products by name/code)
- Category pills (filter by category)
  - All Categories
  - Favourites (★)
  - Bread, Bun, Sandwich, etc.
- Product tiles (grid view):
  - Product image
  - Product name
  - Price
  - Star icon (mark as favorite)
  - Cart badge (if in cart)

**Right Panel - Bill/Cart:**
- Bill Number (auto-generated)
- Line items:
  - Product name
  - Variant (Full/Mini)
  - Unit price
  - Quantity (with +/- buttons)
  - Line total
  - Remove button (×)
- Total Amount (large, prominent)
- **Clear Bill** button
- **PAY** button (red, primary)

**Left Drawer - Operations:**
- Slide-out drawer (click ☰ menu icon)
- Contains:
  - Stock BF
  - Pending Transfers
  - New Transfer
  - Delivery Return
  - Cash Submission
  - Technical section (Refresh Cache, View Logs)

### 6.5 Process a Sale

#### 6.5.1 Add Products to Cart

**Method 1 - Click Product Tile:**
1. Browse or search for product
2. Click on product tile
3. If product has variants (Full/Mini):
   - Variant selector appears
   - Select **Full** or **Mini**
4. Product added to cart with quantity 1

**Method 2 - Search:**
1. Click search bar
2. Type product name: "Fish Bun"
3. Results filter instantly
4. Click on product to add

**Method 3 - Category Filter:**
1. Click category pill: "Bun"
2. See only bun products
3. Click product to add

**Expected Result:**
- ✅ Product appears in right panel (bill)
- ✅ Quantity shows as 1
- ✅ Price displayed
- ✅ Line total calculated
- ✅ Grand total updates

#### 6.5.2 Adjust Quantities

**Method 1 - Plus/Minus Buttons:**
1. Find product in bill
2. Click **+** button to increase quantity
3. Click **-** button to decrease quantity

**Method 2 - Touch Numpad:**
1. Click on **quantity number** itself
2. Touch numpad modal opens
3. Enter quantity: `15`
4. Click **OK**

**Expected Result:**
- ✅ Quantity updates
- ✅ Line total recalculates
- ✅ Grand total updates

#### 6.5.3 Remove Items

**Steps:**
1. Find item in bill
2. Click **× button** next to item
3. Item removed from cart

**Expected Result:**
- ✅ Item disappears from bill
- ✅ Grand total updates

#### 6.5.4 Complete Payment

**Steps:**
1. Review all items and total
2. Click **"PAY"** button (red, prominent)
3. Payment modal opens showing total amount
4. Select payment method:
   - **Cash** (green button)
   - **Card** (blue button)
5. **If Cash selected:**
   - Enter **Amount Tendered:** e.g., `1000.00`
   - System calculates **Change:** e.g., `150.00`
   - Shows change prominently
6. Click **"Complete Sale"** button

**Expected Result - Online Mode:**
- ✅ Sale saved to database immediately
- ✅ Server-generated Sale No: `PS-2026-XXXXXX`
- ✅ Status: **"Pending"** (awaiting approval)
- ✅ Print receipt dialog appears
- ✅ Success toast: "Sale processed successfully"
- ✅ Bill cleared, ready for next customer

**Expected Result - Offline Mode:**
- ✅ Sale saved to local database
- ✅ Temporary Sale No generated locally
- ✅ Queued for sync when online
- ✅ Print receipt dialog appears (with local data)
- ✅ Info toast: "Sale queued for sync (offline mode)"
- ✅ Bill cleared, ready for next customer

### 6.6 Receipt Printing

**After Sale:**
1. Print dialog appears automatically
2. Click **"Print Receipt"** to print
3. Or click **"Skip"** to skip printing

**Reprint Receipt:**
1. Click **User Menu** (top-right)
2. Select **"Transaction History"**
3. Find sale in list
4. Click **"Reprint"** button
5. Receipt prints

**Receipt Contents:**
- Don & Sons logo and branding
- Showroom name and address
- Sale Number
- Date and Time
- Cashier name
- Line items (product, qty, price, total)
- Grand Total
- Payment Method
- Change Given (if cash)
- Barcode (sale number)

### 6.7 Product Catalog Features

**Mark as Favorite:**
1. Find product tile
2. Click **star icon** (☆)
3. Star turns solid (★)
4. Product now in Favorites

**View Favorites:**
1. Click **"Favourites"** category pill (has ★ icon)
2. See only favorite products

**Search Products:**
1. Click search bar
2. Type product name or code
3. Results filter instantly

**Category Filtering:**
1. Click category pill (e.g., "Bread")
2. See only products in that category

### 6.8 Clear Bill

**Steps:**
1. Click **"Clear Bill"** button (below line items)
2. Confirm clearing

**Expected Result:**
- ✅ All items removed from cart
- ✅ Total resets to 0
- ✅ Ready for new sale

### 6.9 Stock BF from POS

**Purpose:** Record opening stock at start of day

**Steps:**
1. Open **Operations Drawer** (click ☰ menu)
2. Click **"Stock BF"**
3. Stock BF screen opens
4. Add stock items:
   - Click in **Product Search** field
   - Type product name
   - Select product from dropdown
   - If product has variants, select Full/Mini
   - Quantity modal appears
   - Enter **Quantity** on hand: e.g., `50`
   - Click **OK**
   - Product added to list
5. Repeat for all items in stock
6. Review stock list
7. Click **"Submit Stock BF"** button

**Expected Result - Online:**
- ✅ Stock BF sent to server
- ✅ Success toast: "Stock BF submitted successfully"
- ✅ Appears in web app: **Operation → Stock BF**

**Expected Result - Offline:**
- ✅ Stock BF saved to local queue
- ✅ Info toast: "Stock BF queued for sync"
- ✅ Will sync when online

### 6.10 Pending Transfers (Receive)

**Purpose:** View and receive incoming transfers from other showrooms

**Steps:**
1. Open **Operations Drawer**
2. Click **"Pending Transfers"**
3. See list of incoming transfers

**Expected Result:**
- ✅ Shows transfers with status "Approved" (from web app)
- ✅ Shows: Transfer No, Date, From Showroom, Total items

**View Transfer Details:**
1. Click on transfer row
2. See detail view:
   - Transfer header (from showroom, date, etc.)
   - List of items with quantities
   - Total items and quantity

**Receive Transfer:**
1. Open transfer details
2. Physically verify items received
3. Click **"Received"** button (green)
4. Confirm receipt

**Expected Result - Online:**
- ✅ Transfer marked as received on server
- ✅ Success toast: "Transfer received successfully"
- ✅ Stock added to current showroom

**Expected Result - Offline:**
- ✅ Receipt queued for sync
- ✅ Info toast: "Receipt queued for sync"

**Report Non-Receipt:**
1. If items not received or issue found
2. Click **"Not Received"** button (red)
3. Enter **Reason** for non-receipt
4. Confirm

### 6.11 New Transfer from POS

**Purpose:** Create transfer to another showroom (online only)

**Steps:**
1. Open **Operations Drawer**
2. Click **"New Transfer"**
3. **Offline Check:** If offline, shows "Transfer creation requires online connection"
4. If online, transfer screen opens
5. Fill transfer details:
   - **To Showroom:** Select destination (cannot select own showroom)
   - **Transfer Date:** Select date (defaults to today)
   - **Reason:** Select reason (excess stock, emergency request, etc.)
   - **Notes:** Optional
6. Add items:
   - Search and select **Product**
   - Select **Variant**
   - Enter **Quantity** to transfer
   - Click **Add**
   - Repeat for all items
7. Review transfer
8. Click **"Submit Transfer"** button

**Expected Result:**
- ✅ Transfer sent to server
- ✅ Success toast: "Transfer submitted for approval"
- ✅ Appears in web app for approval: **Operation → Transfer**
- ✅ After approval, receiving showroom sees in "Pending Transfers"

### 6.12 Delivery Return from POS

**Purpose:** Process customer returns (online only)

**Steps:**
1. Open **Operations Drawer**
2. Click **"Delivery Return"**
3. **Offline Check:** If offline, shows error
4. If online, return screen opens
5. Fill return details:
   - **Delivery Note No:** Enter original delivery number
   - **Return Date:** Select date (defaults to today)
   - **Delivery Date:** Select original delivery date
   - **Reason:** Select return reason
   - **Notes:** Optional
6. Add return items:
   - Search and select **Product**
   - Select **Variant**
   - Enter **Return Quantity**
   - Select **Condition:** Good, Damaged, or Expired
   - Click **Add**
   - Repeat for all returned items
7. Review return
8. Click **"Submit Return"** button

**Expected Result:**
- ✅ Return sent to server
- ✅ Success toast: "Delivery return submitted for approval"
- ✅ Appears in web app for approval: **Operation → Delivery Return**

### 6.13 Cash Submission

**Purpose:** Submit cashier balance at end of day (online only)

**Steps:**
1. Open **Operations Drawer**
2. Click **"Cash Submission"**
3. **Offline Check:** If offline, shows error
4. If online, cash submission screen opens
5. Fill submission details:
   - **Submission Date:** Select date (defaults to today)
   - **Shift:** Select shift (Morning, Afternoon, Evening, Full Day)
   - **Cashier:** Auto-filled with logged-in user
   - **Showroom:** Auto-filled with selected outlet
6. Enter cash counts:
   - **Cash Sales Total:** Enter total cash sales from POS
   - **Cash in Hand:** Enter actual cash counted
   - **Variance:** System calculates (Cash in Hand - Cash Sales)
   - **Variance Reason:** If variance, explain (required)
7. Enter payment method breakdown:
   - **Cash Amount:** Total cash payments
   - **Card Amount:** Total card payments
   - **Digital Payment:** Total digital payments (optional)
   - **Other:** Other payment methods
8. Add expenses (optional):
   - Click **"Add Expense"**
   - Enter **Expense Type** (e.g., Petty Cash, Supplies)
   - Enter **Amount**
   - Enter **Notes**
   - Click **Add**
9. Review all amounts
10. Click **"Submit Balance"** button

**Expected Result:**
- ✅ Balance sent to server
- ✅ Success toast: "Cashier balance submitted for approval"
- ✅ Appears in web app for approval: **Administrator → Cashier Balance**

### 6.14 Transaction History

**Purpose:** View past sales and reprint receipts

**Steps:**
1. Click **User Menu** (top-right)
2. Select **"Transaction History"**
3. Transaction history modal opens

**View Transactions:**
- ✅ Shows paginated list of sales
- ✅ Columns: Sale No, Date & Time, Total, Payment Method, Status
- ✅ **Online Mode:** Loads from server (all sales)
- ✅ **Offline Mode:** Shows local sales only

**Filter Transactions:**
- By date range
- By payment method
- By status (Approved/Pending/Rejected)

**View Sale Details:**
1. Click on sale row
2. See detailed view:
   - Sale header
   - All line items
   - Totals
   - Payment details

**Reprint Receipt:**
1. Find sale in list
2. Click **"Reprint"** button
3. Receipt prints

### 6.15 POS Offline Mode

**How it Works:**
- POS detects network status automatically
- When offline, uses local database (SQLite)
- All operations queue for sync when online
- Product catalog cached locally

**Offline Capabilities:**
- ✅ Process sales (queued for sync)
- ✅ Record Stock BF (queued for sync)
- ✅ View transaction history (local sales)
- ✅ Search products
- ✅ Mark favorites
- ✅ Print receipts (with local data)

**Offline Limitations:**
- ❌ Cannot create transfers (requires online)
- ❌ Cannot create delivery returns (requires online)
- ❌ Cannot submit cashier balance (requires online)
- ❌ Cannot view pending transfers (requires online)

**Sync When Online:**
1. POS detects internet connection
2. Badge changes to "Online" (green)
3. Queued items sync automatically
4. Sync status shows "Syncing..." then "Synced"
5. Sale numbers updated from server

**Manual Sync:**
1. Click **Sync badge** in header
2. Or click **"Refresh Cache"** in Operations drawer
3. Forces immediate sync

### 6.16 POS Theme Customization

**Admin-Controlled:**
- Themes configured in web app: **Administrator → POS Theme Configuration**
- Active theme automatically syncs to all POS terminals
- No action needed from POS users

**Theme Elements:**
- Primary Color: Headers, main buttons, category pill
- Accent Color: PAY button, highlights, favorites
- Colors update automatically when admin changes theme

**View Current Theme:**
1. Open **Settings** (User Menu → Settings)
2. See "Current Theme" section
3. Shows: Theme name, Primary color, Accent color

---

## 7. Supporting Modules

### 7.1 Inventory Management

**Purpose:** Prerequisite for Operations and POS

#### 7.1.1 Categories

**Location:** `/inventory/category`

**Quick Test:**
1. Navigate to Categories
2. Create category:
   - Code: `TEST`
   - Name: `Test Category`
3. **Expected:** Success toast, category in list

#### 7.1.2 Products

**Location:** `/inventory/products`

**Quick Test:**
1. Navigate to Products
2. Create product:
   - Code: `PROD-TEST-001`
   - Name: `Test Product`
   - Category: Select any
   - Unit Price: `150.00`
   - Product Type: Finished
   - Has Full: Check
3. **Expected:** Success toast, product in list

**Note:** Products are required for all operations (delivery, disposal, transfer, etc.) and POS sales

### 7.2 Showroom Management

**Location:** `/showroom`

**Quick Test:**
1. Navigate to Showroom
2. Create outlet:
   - Code: `TST`
   - Name: `Test Showroom`
   - City: `Test City`
   - Active: Check
3. **Expected:** Success toast, showroom in list

**Note:** Showrooms are required for all operations and POS

### 7.3 System Settings

**Location:** `/administrator/system-settings`

**Purpose:** Configure global system settings

**Quick View:**
1. Navigate to System Settings
2. See key-value configuration pairs
3. Can update as needed

---

## 8. Testing Checklist

### 8.1 Authentication & User Management

- [ ] Login with valid credentials → Success
- [ ] Login with invalid credentials → Error shown
- [ ] Logout → Redirect to login
- [ ] Create new user → Appears in list
- [ ] Edit user → Changes saved
- [ ] Assign roles to user → Roles shown
- [ ] Reset user password → User can login with new password
- [ ] Deactivate user → User cannot login
- [ ] Create role → Role appears in list
- [ ] Assign permissions to role → Permissions saved
- [ ] User with role inherits permissions → Can access assigned pages only

### 8.2 Operations Module

**Delivery:**
- [ ] View delivery list → Shows database data (not mock)
- [ ] Create delivery → Success toast, auto-generated No
- [ ] Add items to delivery → Items appear in list
- [ ] Edit draft delivery → Changes saved
- [ ] Submit delivery for approval → Status changes to Pending
- [ ] View delivery details → All info displayed
- [ ] Cancel delivery → Status changes to Cancelled

**Disposal:**
- [ ] Create disposal → Success, auto-generated No
- [ ] Add items with reasons → Items saved
- [ ] Submit for approval → Status Pending
- [ ] Disposal appears in approval queue → Visible

**Transfer:**
- [ ] Create transfer → Success, auto-generated No
- [ ] From ≠ To validation → Error if same
- [ ] Add items → Items saved
- [ ] Submit for approval → Status Pending

**Stock BF:**
- [ ] Create Stock BF → Success, auto-generated No
- [ ] Add stock items → Items saved
- [ ] Edit Stock BF → Changes saved
- [ ] Stock BF unique per outlet+date+product → Validation works

**Cancellation:**
- [ ] Create cancellation → Status automatically Pending
- [ ] No item details (header only) → Correct format
- [ ] Appears in approval queue → Visible

**Delivery Return:**
- [ ] Create delivery return → Success, auto-generated No
- [ ] Add items with conditions → Items saved
- [ ] Submit for approval → Status Pending

**Label Printing:**
- [ ] Create label request → Success, auto-generated No
- [ ] Products with allowFutureLabelPrint → Yellow background
- [ ] Submit request → Status Pending

**Showroom Open Stock:**
- [ ] View open stock for showroom+date → Data displayed
- [ ] Edit open stock (if authorized) → Changes saved

**Showroom Label Printing:**
- [ ] Generate labels → Label data prepared
- [ ] Print labels → Print dialog appears

### 8.3 Approval System

- [ ] View approval queue → Shows all pending items
- [ ] Filter by document type → Filtering works
- [ ] Filter by date range → Filtering works
- [ ] Filter by showroom → Filtering works
- [ ] View item details → All info displayed
- [ ] Approve item → Status changes to Approved, success toast
- [ ] Reject item with reason → Status Rejected, reason stored
- [ ] Approved item executes business logic → Stock updated (if applicable)
- [ ] Rejected item does NOT execute logic → Stock unchanged

### 8.4 POS System

**Installation & Login:**
- [ ] Install POS application → Installs successfully
- [ ] Launch POS → Application opens
- [ ] Login with valid credentials → Main screen opens
- [ ] Online badge shows correct status → Green if online, gray if offline

**Sales Processing:**
- [ ] Add product to cart by clicking tile → Product added
- [ ] Add product by searching → Product added
- [ ] Filter by category → Shows correct products
- [ ] Adjust quantity with +/- buttons → Quantity changes
- [ ] Adjust quantity with numpad → Quantity changes
- [ ] Remove item from cart → Item removed
- [ ] Clear bill → All items removed
- [ ] Complete cash payment → Sale processed, change calculated
- [ ] Complete card payment → Sale processed
- [ ] Receipt prints → Receipt generated

**Online/Offline:**
- [ ] Process sale while online → Saved immediately to database
- [ ] Process sale while offline → Queued for sync
- [ ] Come back online → Queued sales sync automatically
- [ ] Sale number updated after sync → Server-generated number shown

**Stock BF:**
- [ ] Create Stock BF from POS while online → Submitted to server
- [ ] Create Stock BF while offline → Queued for sync
- [ ] Stock BF appears in web app → Visible in Operation → Stock BF

**Transfers:**
- [ ] View pending transfers → Shows incoming transfers
- [ ] Receive transfer → Marked as received
- [ ] Create new transfer while online → Submitted to server
- [ ] Cannot create transfer offline → Error shown

**Delivery Return:**
- [ ] Create delivery return from POS → Submitted to server
- [ ] Cannot create return offline → Error shown

**Cash Submission:**
- [ ] Submit cashier balance → Sent to server
- [ ] Cannot submit offline → Error shown

**Transaction History:**
- [ ] View transaction history → Shows sales
- [ ] Reprint receipt → Receipt prints
- [ ] Filter by date → Filtering works

**Favorites:**
- [ ] Mark product as favorite → Star turns solid
- [ ] View favorites → Shows only favorite products
- [ ] Unmark favorite → Star becomes hollow

### 8.5 Integration Testing

- [ ] User created in web app → Can login to POS
- [ ] Permission assigned in web app → Reflected in POS access
- [ ] Product created in web app → Appears in POS catalog
- [ ] Delivery approved in web app → Status updated
- [ ] Transfer approved in web app → Appears in POS pending transfers
- [ ] POS sale submitted → Appears in web app approval queue
- [ ] POS sale approved in web app → Status updated in POS transaction history

### 8.6 Permission Testing

- [ ] Super admin → Has access to all pages
- [ ] User with limited permissions → Can only access assigned pages
- [ ] User with no approval permission → Cannot approve in approval queue
- [ ] User with view-only permission → Cannot create/edit/delete

### 8.7 Data Verification

**Check Database:**
- [ ] User CRUD → Records in `users` table
- [ ] Role assignment → Records in `user_roles` table
- [ ] Delivery → Records in `deliveries` and `delivery_items` tables
- [ ] Disposal → Records in `disposals` and `disposal_items` tables
- [ ] Transfer → Records in `transfers` and `transfer_items` tables
- [ ] Stock BF → Records in `stock_bf` table
- [ ] Cancellation → Records in `cancellations` table
- [ ] Delivery Return → Records in `delivery_returns` and `delivery_return_items` tables
- [ ] Label Request → Records in `label_print_requests` table
- [ ] POS Sale → Records in `pos_sales` and `pos_sale_lines` tables

**Check Audit Logs:**
```sql
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 20;
```
- [ ] All CRUD operations logged → Records exist
- [ ] Shows: Entity, Action, Old/New values, User, Timestamp

### 8.8 Error Handling

- [ ] Network error (backend down) → Error toast shown, app doesn't crash
- [ ] Validation error (required field missing) → Error shown, form not submitted
- [ ] Duplicate entry (e.g., same username) → Error toast shown
- [ ] Permission denied → 403 error or access denied message
- [ ] Session expired (401) → Auto-refresh token or redirect to login

### 8.9 Performance

- [ ] User list with 100+ users → Loads within 3 seconds
- [ ] Product list with 500+ products → Loads within 3 seconds
- [ ] Approval queue with 50+ items → Loads within 3 seconds
- [ ] POS catalog with 500+ products → Loads instantly (cached)
- [ ] Pagination → Smooth navigation between pages
- [ ] Search → Results filter instantly (< 1 second)

---

## 9. Test Reporting

### 9.1 Issue Reporting Template

When reporting issues during testing, include:

**Issue Title:** Brief description

**Severity:**
- Critical (system unusable)
- High (major feature broken)
- Medium (feature partially broken)
- Low (minor cosmetic issue)

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Result:**
What should happen

**Actual Result:**
What actually happened

**Screenshots:**
Attach screenshots if applicable

**Environment:**
- Browser: Chrome 122
- Backend: Running
- Database: Connected
- User: testuser1

**Additional Notes:**
Any other relevant information

### 9.2 Test Sign-Off

After completing testing, sign off:

**Tester Name:** ___________________  
**Date:** ___________________  
**Test Completion:** ____ %  
**Critical Issues:** ____ (count)  
**High Issues:** ____ (count)  
**Medium Issues:** ____ (count)  
**Low Issues:** ____ (count)  

**Sign-Off:** ☐ Approved for production  
**Comments:** _______________________

---

## 10. Summary

### 10.1 What's Tested

✅ **Fully Tested:**
- Authentication & Authorization
- User Management (Create, Edit, Assign Roles, Delete)
- Role & Permission Management
- Operations Module (9 pages - all workflows)
- Approval System (Unified queue)
- POS System (Desktop app with offline mode)
- Supporting modules (Inventory, Showrooms)

### 10.2 What's NOT Tested (Not Implemented)

❌ **Not Covered:**
- DMS Planning (Delivery Plan, Order Entry, Default Quantities)
- Production Planner & Stores Issue Note
- Production Module (Daily Production, Stock Adjustment)
- Reports Module
- Day-End Process
- Recipe-based production calculations

### 10.3 Next Steps

After completing this testing:
1. ✅ Verify all completed features work correctly
2. ✅ Report any issues found
3. ✅ Get sign-off from stakeholders
4. ⏳ Wait for remaining features to be implemented
5. ⏳ Test additional features as they become available

---

**End of Testing & User Guide**

For questions or support, contact the development team.
