# Don & Sons DMS - System User Manual & Testing Guide

**Version:** 2.0  
**Last Updated:** May 13, 2026  
**Document Type:** Complete User Manual & System Testing Guide

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Dashboard Overview](#2-dashboard-overview)
3. [Administrator Module](#3-administrator-module)
4. [Inventory Management](#4-inventory-management)
5. [Showroom Management](#5-showroom-management)
6. [Operations Module](#6-operations-module)
7. [DMS Module (Delivery & Production Planning)](#7-dms-module-delivery--production-planning)
8. [Production Module](#8-production-module)
9. [POS System User Guide](#9-pos-system-user-guide)
10. [Reports Module](#10-reports-module)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Getting Started

### 1.1 System Access

#### Web Application Access
1. Open your web browser (Chrome, Firefox, or Edge recommended)
2. Navigate to the DMS web application URL
3. You will see the Don & Sons login screen with the brand red and gold theme

#### Login Process
1. **Email Address:** Enter your registered email address
2. **Password:** Enter your password (case-sensitive)
3. Click **"Sign In"** button
4. If credentials are correct, you'll be redirected to the Dashboard

#### First-Time Login
- You will receive login credentials from your system administrator
- Change your password after first login (recommended)
- Contact IT support if you experience login issues

#### Forgot Password
1. Click **"Forgot Password?"** on login page
2. Enter your registered email address
3. Check your email for password reset instructions
4. Follow the link and create a new password

### 1.2 User Roles & Permissions

The system uses Role-Based Access Control (RBAC). Your access depends on your assigned role:

| Role | Access Level | Typical Users |
|------|--------------|---------------|
| **Super Admin** | Full system access, all permissions | System owner, IT manager |
| **Production Manager** | Production, inventory, recipes | Production supervisors |
| **Sales Manager** | Order entry, delivery planning, reports | Sales team leads |
| **Stock Clerk** | Stock adjustments only | Warehouse staff |
| **POS User** | POS terminal only | Showroom cashiers |
| **Finance** | Reports, payments, cashier balance | Finance staff |

**Note:** Your available menu items and actions depend on your assigned permissions.

### 1.3 Navigation Basics

#### Sidebar Navigation
- **Left sidebar** contains all available modules
- Click on any module to expand sub-sections
- Active page is highlighted with brand colors
- Sidebar can be collapsed/expanded using the menu icon

#### Top Header
- **User Menu** (top right): Profile, settings, logout
- **Breadcrumb** (below header): Shows current page path
- **Quick Actions**: Common tasks accessible from any page

#### Main Content Area
- **Page Title**: Shows current page name
- **Action Buttons**: Primary actions (New, Save, Export, etc.)
- **Data Tables**: Sortable, searchable, filterable
- **Forms**: Input validation with helpful error messages

---

## 2. Dashboard Overview

### 2.1 Dashboard Widgets

The Dashboard provides a quick overview of key business metrics:

#### Sales Trend Widget (7 Days)
- Line chart showing sales over the last 7 days
- Hover over points to see exact values
- Helps identify sales patterns and trends

#### Disposal by Section Widget
- Pie or bar chart showing waste by production section
- Identifies areas with highest waste
- Useful for cost control

#### Top Deliveries Widget
- Shows top-performing outlets by delivery volume
- Helps identify best-performing locations
- Updated daily

#### Delivery vs Disposal Widget
- Compares total deliveries against total disposals
- Shows efficiency percentage
- Monitors production accuracy

### 2.2 Dashboard Actions

- **Refresh**: Click refresh icon to update all widgets
- **Date Range**: Select custom date ranges for analysis
- **Export**: Export dashboard data to Excel or PDF
- **Print**: Print dashboard summary

---

## 3. Administrator Module

### 3.1 Security Management

#### Page Location: `/administrator/security`

This section manages users, roles, and permissions.

#### 3.1.1 Users Tab

**View All Users:**
1. Navigate to **Administrator → Security → Users tab**
2. See list of all system users with:
   - First Name, Last Name
   - Email
   - Role(s) assigned
   - Status (Active/Inactive)
   - Created date

**Create New User:**
1. Click **"New User"** button
2. Fill in user details:
   - **First Name**: User's first name (required)
   - **Last Name**: User's last name (required)
   - **Email**: Valid email address (required, must be unique)
   - **Password**: Temporary password (required, min 8 characters)
   - **Role**: Select role(s) from dropdown (required)
   - **Active**: Check to activate user immediately
3. Click **"Create User"**
4. User receives email with login credentials (if email configured)

**Edit User:**
1. Click **edit icon** (✏️) next to user
2. Modify user details as needed
3. **Change Role**: Select different role(s)
4. **Reset Password**: Click "Reset Password" to send reset link
5. **Deactivate**: Uncheck "Active" to disable user access
6. Click **"Update User"**

**Delete User:**
1. Click **delete icon** (🗑️) next to user
2. Confirm deletion
3. User is soft-deleted (can be restored by admin)

**Important Notes:**
- Email addresses must be unique
- Super Admin status grants all permissions automatically
- Users must log out and log back in after role changes
- Deactivated users cannot log in

#### 3.1.2 Roles Tab

**View All Roles:**
1. Navigate to **Administrator → Security → Roles tab**
2. See list of all roles with:
   - Role Name
   - Description
   - Number of users assigned
   - Created date

**Create New Role:**
1. Click **"New Role"** button
2. Enter role details:
   - **Role Name**: Descriptive name (e.g., "Production Manager")
   - **Description**: Brief explanation of role purpose
3. Click **"Create Role"**
4. After creation, assign permissions (see Permissions section)

**Edit Role:**
1. Click **edit icon** (✏️) next to role
2. Modify name or description
3. Click **"Update Role"**

**Assign Permissions to Role:**
1. Click **"Permissions"** button next to role
2. See permission matrix with modules and actions
3. Check boxes to grant permissions:
   - **View**: Can see the module/page
   - **Create**: Can add new records
   - **Edit**: Can modify existing records
   - **Delete**: Can remove records
   - **Approve**: Can approve workflow items
   - **Reject**: Can reject workflow items
   - **Print**: Can print reports/labels
   - **Export**: Can export data
4. Click **"Save Permissions"**

**Delete Role:**
1. Click **delete icon** (🗑️) next to role
2. Confirm deletion
3. **Note**: Cannot delete roles that have users assigned

#### 3.1.3 Permissions Tab

**View All Permissions:**
1. Navigate to **Administrator → Security → Permissions tab**
2. See complete list of all system permissions organized by module
3. This is a **read-only view** for reference

**Permission Naming Convention:**
```
module:submodule:action
```

Examples:
- `inventory:products:view` - View products page
- `operation:delivery:create` - Create delivery documents
- `dms:order:edit` - Edit order entries
- `administrator:users:delete` - Delete users

**Common Permission Actions:**
- `view` - Access to view the page/data
- `create` - Create new records
- `update` / `edit` - Modify existing records
- `delete` - Remove records
- `approve` - Approve workflow documents
- `reject` - Reject workflow documents
- `print` - Print documents/reports
- `export` - Export data to Excel/PDF

### 3.2 System Settings

#### Page Location: `/administrator/system-settings`

Configure global system settings.

**Available Settings:**
1. **Company Information**
   - Company Name
   - Address
   - Phone, Email
   - Logo upload

2. **Tax Settings**
   - VAT percentage
   - Tax registration number
   - Tax calculation rules

3. **Notification Preferences**
   - Email notifications (on/off)
   - SMS notifications (on/off)
   - Notification recipients

4. **System Configuration**
   - Date format
   - Time zone
   - Currency
   - Decimal precision

**How to Update Settings:**
1. Navigate to **Administrator → System Settings**
2. Modify desired settings
3. Click **"Save Changes"**
4. Changes take effect immediately

### 3.3 Delivery Turns

#### Page Location: `/administrator/delivery-turns`

Configure delivery schedules and production start times.

**View Delivery Turns:**
- See all configured delivery turns
- Each turn shows: Turn name, Target time, Active status

**Create Delivery Turn:**
1. Click **"New Delivery Turn"** button
2. Fill in details:
   - **Turn Name**: e.g., "Turn 1 - Morning", "Turn 2 - Afternoon"
   - **Target Delivery Time**: e.g., 5:00 AM, 10:30 AM, 3:30 PM
   - **Active**: Check to enable this turn
   - **Display Order**: Sort order in dropdowns
3. Configure **Per-Section Start Times**:
   - Bakery 1 Start Time
   - Bakery 2 Start Time
   - Filling Section Start Time
   - Short-Eats 1 Start Time
   - Short-Eats 2 Start Time
   - Rotty Section Start Time
   - Etc.
4. Click **"Create Turn"**

**Example Configuration:**

| Turn | Target Time | Bakery Start | Short-Eats Start |
|------|-------------|--------------|------------------|
| Turn 1 | 5:00 AM | 8:00 PM (previous day) | 2:00 PM (previous day) |
| Turn 2 | 10:30 AM | 4:00 AM (same day) | 7:00 AM (same day) |
| Turn 3 | 3:30 PM | 8:00 AM (same day) | 10:00 AM (same day) |

### 3.4 Day Types

#### Page Location: `/administrator/day-types`

Configure day type categories for default quantity management.

**View Day Types:**
- See all configured day types
- Each shows: Name, Description, Active status

**Create Day Type:**
1. Click **"New Day Type"** button
2. Enter details:
   - **Name**: e.g., "Weekday", "Saturday", "Sunday", "Holiday"
   - **Description**: Brief explanation
   - **Active**: Check to enable
3. Click **"Create Day Type"**

**Usage:**
Day types are used in Default Quantities configuration to set baseline product quantities per outlet per day type.

### 3.5 Day Lock

#### Page Location: `/administrator/day-lock`

Lock past dates to prevent data modifications (accounting control).

**How Day Lock Works:**
- Once a date is locked, no transactions can be created, edited, or deleted for that date
- Ensures financial data integrity
- Typically locked after day-end reconciliation

**Lock a Date:**
1. Navigate to **Administrator → Day Lock**
2. Select date from calendar
3. Click **"Lock Date"** button
4. Confirm action
5. Date is now locked (icon changes to locked padlock)

**Unlock a Date:**
1. Find locked date in list
2. Click **"Unlock"** button (requires special permission)
3. Confirm action
4. Date is now unlocked

**Notes:**
- Only users with `day-lock:manage` permission can lock/unlock
- Recommended to lock dates after day-end process completion
- Super admins can unlock any date if needed

### 3.6 Approvals Queue

#### Page Location: `/administrator/approvals`

Unified approval queue for all workflow documents.

**View Pending Approvals:**
1. Navigate to **Administrator → Approvals**
2. See list of all pending approval items grouped by type:
   - Deliveries
   - Disposals
   - Transfers
   - Stock BF
   - Delivery Returns
   - Cancellations
   - Label Printing Requests
   - Stock Adjustments
   - Cashier Balance submissions

**Approve an Item:**
1. Click on item row to view details
2. Review document details, items, quantities
3. Click **"Approve"** button
4. Add optional approval notes
5. Confirm approval
6. Status changes to "Approved"

**Reject an Item:**
1. Click on item row to view details
2. Click **"Reject"** button
3. **Enter rejection reason** (required)
4. Confirm rejection
5. Status changes to "Rejected"
6. Creator is notified

**Filter Approvals:**
- **By Type**: Show only specific document types
- **By Date**: Filter by date range
- **By Showroom**: Filter by outlet
- **By Status**: Pending, Approved, Rejected

### 3.7 Showroom Employee Mapping

#### Page Location: `/administrator/showroom-employee`

Map employees to showrooms for access control and reporting.

**View Mappings:**
- See all employee-showroom assignments
- Shows: Employee name, Assigned showroom(s), Role

**Assign Employee to Showroom:**
1. Click **"New Assignment"** button
2. Select **Employee** from dropdown
3. Select **Showroom(s)** (can select multiple)
4. Set **Primary Showroom** (if employee works at multiple outlets)
5. Click **"Save Assignment"**

**Edit Assignment:**
1. Click **edit icon** next to assignment
2. Modify showroom assignments
3. Click **"Update Assignment"**

**Remove Assignment:**
1. Click **delete icon** next to assignment
2. Confirm removal

### 3.8 Price Manager

#### Page Location: `/administrator/price-manager`

Manage product pricing by outlet or globally.

**View Prices:**
- See all product prices
- Can view by: Product, Outlet, Category
- Shows: Product name, Code, Price, Currency

**Set Product Price:**
1. Click **"New Price"** button
2. Select **Product**
3. Choose **Scope**:
   - **Global**: Applies to all outlets
   - **Per Outlet**: Specific outlet price
4. Enter **Price** (decimal allowed)
5. Set **Effective Date** (optional)
6. Set **Expiry Date** (optional, for promotional pricing)
7. Click **"Save Price"**

**Edit Price:**
1. Click **edit icon** next to price entry
2. Modify price or dates
3. Click **"Update Price"**

**Price Priority:**
- Outlet-specific prices override global prices
- Most recent effective date takes precedence

### 3.9 Workflow Configuration

#### Page Location: `/administrator/workflow-config`

Enable or disable approval workflows for different document types.

**View Workflow Settings:**
- See all workflow configurations
- Each shows: Document type, Approval required (Yes/No)

**Configure Workflow:**
1. Navigate to **Administrator → Workflow Config**
2. Find document type (e.g., "Daily Production", "Delivery", "Stock BF")
3. Toggle **"Requires Approval"** switch
4. If enabled:
   - **Auto-approve**: Allow auto-approval based on rules
   - **Approval Levels**: Set multi-level approvals (if needed)
   - **Notification**: Configure approval notifications
5. Click **"Save Configuration"**

**Workflow-Enabled Document Types:**
- Daily Production
- Delivery
- Disposal
- Transfer
- Stock BF
- Delivery Return
- Cancellation
- Label Printing
- Stock Adjustment
- Cashier Balance

### 3.10 Label Settings

#### Page Location: `/administrator/label-settings`

Configure label printing rules and templates.

**General Label Settings:**
1. **Allow Future Label Print**: Enable/disable printing labels for future dates
2. **Date Rules**: Configure how far in advance labels can be printed
3. **Default Template**: Select default label template
4. **Label Size**: Configure label dimensions

**Product Label Rules:**
- Set which products require labels
- Configure label content (barcode, price, ingredients, etc.)
- Set label expiry rules

**Showroom Label Rules:**
- Configure showroom-specific label requirements
- Set per-outlet label templates

### 3.11 POS Theme Configuration

#### Page Location: `/administrator/pos-theme`

Customize POS terminal appearance (colors, branding).

**View Themes:**
- See all available POS themes
- Shows: Theme name, Preview, Active status

**Create Custom Theme:**
1. Click **"New Theme"** button
2. Enter theme details:
   - **Theme Name**: e.g., "Ocean Blue", "Dark Mode"
   - **Description**: Optional
3. Configure colors using color pickers:
   - **Primary Color**: Main brand color (headers, buttons)
   - **Primary Light**: Lighter variant (hover effects)
   - **Primary Dark**: Darker variant (borders, shadows)
   - **Accent Color**: Secondary highlight color
   - **Accent Light**: Lighter accent variant
   - **Accent Dark**: Darker accent variant
4. **Display Order**: Sort order in theme list
5. Click **"Create Theme"**

**Activate Theme:**
1. Find desired theme in list
2. Click **"Activate"** button (⚡ icon)
3. Theme is immediately applied to all POS terminals
4. POS terminals update automatically when online

**Edit Theme:**
1. Click **edit icon** (✏️) next to theme
2. Modify colors or details
3. Click **"Update Theme"**
4. If active, changes apply immediately

**Delete Theme:**
1. Click **delete icon** (🗑️) next to theme
2. Confirm deletion
3. **Note**: Cannot delete system themes or active theme

**Default Theme Colors:**
- Primary: `#C8102E` (Don & Sons Red)
- Accent: `#FFD100` (Don & Sons Gold)

---

## 4. Inventory Management

### 4.1 Categories

#### Page Location: `/inventory/category`

Manage product categories (Bread, Bun, Sandwich, Short-Eat, etc.).

**View Categories:**
- See all product categories
- Shows: Category name, Code, Number of products

**Create Category:**
1. Click **"New Category"** button
2. Enter details:
   - **Category Name**: e.g., "Bread", "Bun", "Short-Eat"
   - **Code**: Short code (e.g., "BR", "BU", "SE")
   - **Description**: Optional description
   - **Display Order**: Sort order
   - **Active**: Check to enable
3. Click **"Create Category"**

**Edit Category:**
1. Click **edit icon** next to category
2. Modify details
3. Click **"Update Category"**

**Delete Category:**
1. Click **delete icon** next to category
2. Confirm deletion
3. **Note**: Cannot delete categories with assigned products

### 4.2 Unit of Measure (UOM)

#### Page Location: `/inventory/uom`

Manage measurement units (G, Kg, ml, Ltr, Nos, Bot, etc.).

**View UOMs:**
- See all units of measure
- Shows: UOM code, Full name, Type

**Create UOM:**
1. Click **"New UOM"** button
2. Enter details:
   - **Code**: e.g., "Kg", "G", "Ltr", "ml", "Nos"
   - **Full Name**: e.g., "Kilogram", "Gram", "Liter"
   - **Type**: Weight, Volume, Count
   - **Active**: Check to enable
3. Click **"Create UOM"**

**Common UOMs:**
- **G** - Gram (weight)
- **Kg** - Kilogram (weight)
- **ml** - Milliliter (volume)
- **Ltr** - Liter (volume)
- **Nos** - Numbers (count)
- **Bot** - Bottle (count)

### 4.3 Ingredients

#### Page Location: `/inventory/ingredient`

Manage raw materials and ingredients (127+ items).

**View Ingredients:**
- See all ingredients in table format
- Shows: Ingredient name, Code, UOM, Category, Active status
- Search, sort, and filter

**Create Ingredient:**
1. Click **"New Ingredient"** button
2. Fill in details:
   - **Ingredient Name**: e.g., "Flour", "Sugar", "Eggs", "Cheese"
   - **Code**: Unique code (e.g., "FLR", "SUG", "EGG")
   - **UOM**: Select unit of measure
   - **Category**: Optional categorization
   - **Description**: Optional notes
   - **Active**: Check to enable
3. Click **"Create Ingredient"**

**Edit Ingredient:**
1. Click **edit icon** next to ingredient
2. Modify details
3. Click **"Update Ingredient"**

**Delete Ingredient:**
1. Click **delete icon** next to ingredient
2. Confirm deletion
3. **Note**: Cannot delete ingredients used in recipes

**Common Ingredients:**
- Flour, Sugar, Salt, Yeast
- Eggs, Butter, Margarine, Oil
- Cheese, Sausages, Ham, Chicken
- Fish, Prawns, Vegetables
- Bread Crumbs, Batter Mix

### 4.4 Products

#### Page Location: `/inventory/products`

Manage finished products (80+ bakery items).

**View Products:**
- See all products with details
- Shows: Product name, Code, Category, Type, Variants, Active
- Paginated view with search and filters

**Create Product:**
1. Click **"New Product"** button
2. Fill in **Basic Information**:
   - **Product Name**: e.g., "Fish Curry Bun", "Viyana Roll"
   - **Code**: Unique code (e.g., "BU1", "BU4", "BR3")
   - **Category**: Select from dropdown
   - **Product Type**: Raw Material / Semi-Finished / Finished / Section
   - **Description**: Optional product description
3. Configure **Variants**:
   - **Has Full**: Check if product has "Full" size
   - **Has Mini**: Check if product has "Mini" size
   - Example: Viyana Roll has both Full and Mini
4. Set **Quantity Settings**:
   - **Allow Decimal Quantity**: Check if decimals allowed (e.g., 4.75)
   - **Default Weight**: Product weight in grams (e.g., 35g for bun)
5. Configure **Rounding**:
   - **Rounding Value**: Round to nearest value (e.g., 5)
   - **Standard Quantity**: Reference quantity for calculations
6. Set **Section Assignment**:
   - Select production section(s) where product is made
   - Products can span multiple sections
7. **Active**: Check to enable product
8. Click **"Create Product"**

**Edit Product:**
1. Click **edit icon** next to product
2. Modify any product details
3. Click **"Update Product"**

**View Product Details:**
1. Click on product row
2. See complete product information including:
   - Basic details
   - Variants
   - Recipe information (if configured)
   - Stock levels
   - Price information

**Delete Product:**
1. Click **delete icon** next to product
2. Confirm deletion
3. **Note**: Cannot delete products used in orders or recipes

**Important Product Features:**
- **Variants**: Products can have Full and/or Mini sizes
- **Decimal Quantities**: Enable for products sold in decimal amounts
- **Rounding**: For ingredient calculations (e.g., egg garnish)
- **Multi-Section**: Products can be assigned to multiple production sections

---

## 5. Showroom Management

### 5.1 Showrooms (Outlets)

#### Page Location: `/showroom`

Manage all outlet locations (30 showrooms).

**View Showrooms:**
- See all showrooms in table
- Shows: Code, Description, City, Active status, Dashboard enabled

**Create Showroom:**
1. Click **"New Showroom"** button
2. Fill in details:
   - **Code**: 3-letter outlet code (e.g., "DAL", "KEL", "RAG")
   - **Description**: Full outlet name (e.g., "Dalugama Showroom")
   - **City**: Location city
   - **Address**: Full address (optional)
   - **Phone**: Contact number
   - **Dashboard**: Check to include in dashboard metrics
   - **Active**: Check to enable
3. Click **"Create Showroom"**

**Edit Showroom:**
1. Click **edit icon** next to showroom
2. Modify details
3. Click **"Update Showroom"**

**Deactivate Showroom:**
1. Click **edit icon** next to showroom
2. Uncheck **"Active"** checkbox
3. Click **"Update Showroom"**
4. Showroom is now inactive (won't appear in dropdowns)

**Common Showrooms:**
- DAL - Dalugama
- DBQ - Debathgama
- KEL - Kelaniya
- RAG - Ragama
- SGK - Seeduwa
- KML - Kiribathgoda
- BWA - Biyagama
- WED - Weddagala
- RAN - Ranala
- BC - Bandarawatte
- SJE - St. Joseph
- YRK - York
- KAD - Kadawatha
- SRP - Siripura

---

## 6. Operations Module

The Operations module handles day-to-day operational documents and transactions.

### 6.1 Delivery

#### Page Location: `/operation/delivery`

Manage product deliveries to showrooms.

**View Deliveries:**
- See all delivery documents
- Shows: Delivery No, Date, Showroom, Status, Created by
- Filter by: Date range, Showroom, Status

**Create Delivery:**
1. Click **"New Delivery"** button
2. Fill in **Header Information**:
   - **Date**: Delivery date (cannot be future date if day lock enabled)
   - **Showroom**: Select destination outlet
   - **Delivery Turn**: Select delivery turn (if applicable)
   - **Notes**: Optional delivery notes
3. Add **Delivery Items**:
   - Click **"Add Item"** button
   - Search and select **Product**
   - Select **Variant** (Full/Mini if applicable)
   - Enter **Quantity**
   - Item is added to delivery list
   - Repeat for all items
4. Review **Total Items** and **Total Quantity**
5. Click **"Save as Draft"** (saves without submitting)
   - OR -
6. Click **"Submit for Approval"** (if workflow enabled)

**Edit Delivery (Draft):**
1. Click **edit icon** next to draft delivery
2. Modify header or items as needed
3. Add or remove items
4. Click **"Save Changes"** or **"Submit for Approval"**

**Submit Delivery for Approval:**
1. Open draft delivery
2. Review all details
3. Click **"Submit for Approval"**
4. Status changes to "Pending"
5. Approver is notified

**Approve Delivery** (Approver only):
1. Open pending delivery
2. Review all items and quantities
3. Click **"Approve"** button
4. Add optional approval notes
5. Confirm approval
6. Status changes to "Approved"

**Reject Delivery** (Approver only):
1. Open pending delivery
2. Click **"Reject"** button
3. **Enter rejection reason** (required)
4. Confirm rejection
5. Status changes to "Rejected"
6. Creator can view reason and resubmit after corrections

**Cancel Delivery:**
1. Open delivery (must be Draft or Pending)
2. Click **"Cancel"** button
3. Confirm cancellation
4. Status changes to "Cancelled"

**View Delivery Details:**
1. Click on delivery row
2. See complete delivery information:
   - Header: Date, showroom, turn, notes
   - Items: Products, variants, quantities
   - Totals
   - Audit: Created by, approved by, dates

**Print Delivery Note:**
1. Open approved delivery
2. Click **"Print"** button
3. Delivery note opens in new window
4. Print using browser print function

**Export Delivery:**
1. Select delivery(s) using checkboxes
2. Click **"Export"** button
3. Choose format: Excel or PDF
4. File downloads automatically

**Delivery Status Workflow:**
```
Draft → Submit → Pending → Approve/Reject → Approved/Rejected
                    ↓
                 Cancel → Cancelled
```

### 6.2 Disposal

#### Page Location: `/operation/disposal`

Record product waste and disposals.

**View Disposals:**
- See all disposal documents
- Shows: Disposal No, Date, Showroom, Status, Total quantity
- Filter by: Date range, Showroom, Status

**Create Disposal:**
1. Click **"New Disposal"** button
2. Fill in **Header Information**:
   - **Date**: Disposal date
   - **Showroom**: Select outlet where disposal occurred
   - **Reason**: Select disposal reason (Expired, Damaged, Quality Issue, etc.)
   - **Notes**: Optional notes explaining disposal
3. Add **Disposal Items**:
   - Click **"Add Item"** button
   - Search and select **Product**
   - Select **Variant** (Full/Mini if applicable)
   - Enter **Quantity** disposed
   - Enter **Reason** (optional, item-specific)
   - Repeat for all items
4. Review **Total Items** and **Total Quantity**
5. Click **"Save as Draft"** or **"Submit for Approval"**

**Edit Disposal (Draft):**
1. Click **edit icon** next to draft disposal
2. Modify details or items
3. Click **"Save Changes"** or **"Submit for Approval"**

**Approve Disposal** (Approver only):
1. Open pending disposal
2. Review items and reasons
3. Click **"Approve"** button
4. Confirm approval
5. Stock is adjusted automatically

**Reject Disposal** (Approver only):
1. Open pending disposal
2. Click **"Reject"** button
3. Enter rejection reason
4. Confirm rejection

**View Disposal Analysis:**
- Navigate to **Reports → Disposal Report**
- See disposal trends by:
  - Product
  - Showroom
  - Reason
  - Date range

**Common Disposal Reasons:**
- Expired / Past sell-by date
- Damaged during production
- Quality not meeting standards
- Returned by customer
- Overproduction excess

### 6.3 Transfer

#### Page Location: `/operation/transfer`

Transfer products between showrooms.

**View Transfers:**
- See all transfer documents
- Shows: Transfer No, Date, From Showroom, To Showroom, Status
- Filter by: Date range, From/To showroom, Status

**Create Transfer:**
1. Click **"New Transfer"** button
2. Fill in **Header Information**:
   - **Date**: Transfer date
   - **From Showroom**: Source outlet
   - **To Showroom**: Destination outlet (must be different from source)
   - **Transfer Reason**: Why transfer is needed
   - **Notes**: Optional notes
3. Add **Transfer Items**:
   - Click **"Add Item"** button
   - Search and select **Product**
   - Select **Variant** (Full/Mini if applicable)
   - Enter **Quantity** to transfer
   - Repeat for all items
4. Review totals
5. Click **"Save as Draft"** or **"Submit for Approval"**

**Edit Transfer (Draft):**
1. Click **edit icon** next to draft transfer
2. Modify header or items
3. **Note**: Cannot change "From Showroom" or "To Showroom" after items are added
4. Click **"Save Changes"** or **"Submit for Approval"**

**Approve Transfer** (Approver only):
1. Open pending transfer
2. Review from/to showrooms and items
3. Click **"Approve"** button
4. Confirm approval
5. Stock is deducted from source showroom
6. Stock is added to destination showroom

**Transfer Receipt** (Receiving Showroom):
1. Receiving showroom staff logs into POS
2. Navigate to **Operations → Pending Transfers**
3. See list of incoming transfers
4. Click on transfer to view details
5. Options:
   - **Received**: Mark transfer as received (full quantity)
   - **Not Received**: Report non-receipt or partial receipt
6. Click **"Received"** button
7. Transfer is marked as received

**Reject Transfer** (Approver only):
1. Open pending transfer
2. Click **"Reject"** button
3. Enter rejection reason
4. Confirm rejection

**Common Transfer Scenarios:**
- Outlet A has excess stock → Transfer to outlet B with shortage
- Emergency stock replenishment
- Rebalancing stock across outlets
- Seasonal adjustments

### 6.4 Stock BF (Brought Forward)

#### Page Location: `/operation/stock-bf`

Record opening stock balances for showrooms (typically at day start).

**View Stock BF:**
- See all Stock BF documents
- Shows: Date, Showroom, Status, Total items
- Filter by: Date range, Showroom, Status

**Create Stock BF:**
1. Click **"New Stock BF"** button
2. Fill in **Header Information**:
   - **Date**: BF date (usually current date)
   - **Showroom**: Select outlet
   - **Notes**: Optional notes
3. Add **Stock Items**:
   - Click **"Add Item"** button
   - Search and select **Product**
   - Select **Variant** (Full/Mini if applicable)
   - Enter **Quantity** on hand
   - Repeat for all items
4. Review totals
5. Click **"Save as Draft"** or **"Submit for Approval"**

**Submit Stock BF from POS:**
1. POS user logs into POS terminal
2. Navigate to **Operations → Stock BF**
3. See search/select product interface
4. Search for product
5. Select product from dropdown
6. Enter **Quantity**
7. Click **"Add"**
8. Product added to list
9. Repeat for all items
10. Click **"Submit Stock BF"** button
11. Stock BF is created in backend
12. Appears in web app for approval

**Approve Stock BF** (Approver only):
1. Open pending Stock BF
2. Review items and quantities
3. Click **"Approve"** button
4. Confirm approval
5. Stock balances are updated

**Reject Stock BF** (Approver only):
1. Open pending Stock BF
2. Click **"Reject"** button
3. Enter rejection reason
4. Confirm rejection
5. Showroom staff can see reason and resubmit

**Print Stock BF:**
1. Open approved Stock BF
2. Click **"Print"** button
3. Print stock balance report

**Usage Notes:**
- Stock BF is typically done at start of day
- Represents physical count of items on hand
- Used for reconciliation and variance reporting
- Can be submitted from POS terminal for convenience

### 6.5 Cancellation

#### Page Location: `/operation/cancellation`

Cancel orders or deliveries (no item-level details, header only).

**View Cancellations:**
- See all cancellation requests
- Shows: Cancellation No, Date, Reference No, Showroom, Status

**Create Cancellation:**
1. Click **"New Cancellation"** button
2. Fill in details:
   - **Date**: Cancellation date
   - **Reference Type**: What is being cancelled (Order, Delivery, Production)
   - **Reference No**: Document number being cancelled
   - **Showroom**: Affected outlet
   - **Reason**: Reason for cancellation (required)
   - **Notes**: Additional details
3. Click **"Submit Cancellation"**
4. Status is automatically "Pending" (requires approval)

**Approve Cancellation** (Approver only):
1. Open pending cancellation
2. Review reason and reference
3. Click **"Approve"** button
4. Confirm approval
5. Referenced document is cancelled

**Reject Cancellation** (Approver only):
1. Open pending cancellation
2. Click **"Reject"** button
3. Enter rejection reason
4. Confirm rejection
5. Original document remains active

**Common Cancellation Reasons:**
- Customer cancelled order
- Delivery cannot be fulfilled
- Production issue preventing fulfillment
- Incorrect order entry
- Force majeure / emergency

### 6.6 Delivery Return

#### Page Location: `/operation/delivery-return`

Process returns from customers or showrooms.

**View Delivery Returns:**
- See all return documents
- Shows: Return No, Date, Showroom, Delivery Note No, Status
- Filter by: Date range, Showroom, Status

**Create Delivery Return:**
1. Click **"New Delivery Return"** button
2. Fill in **Header Information**:
   - **Return Date**: Date of return
   - **Delivery Note No**: Original delivery reference
   - **Showroom**: Outlet where return is happening
   - **Return Reason**: Reason for return (required)
   - **Notes**: Optional notes
3. Add **Return Items**:
   - Click **"Add Item"** button
   - Search and select **Product**
   - Select **Variant** (Full/Mini if applicable)
   - Enter **Returned Quantity**
   - Enter **Condition**: Good, Damaged, Expired
   - Repeat for all items
4. Review totals
5. Click **"Save as Draft"** or **"Submit for Approval"**

**Submit Delivery Return from POS:**
1. POS user logs into POS terminal
2. Navigate to **Operations → Delivery Return**
3. Enter **Delivery Note No**
4. Select **Return Date** and **Delivery Date**
5. Add return items using search interface
6. Select each product and enter return quantity
7. Click **"Submit Return"**
8. Return appears in web app for approval

**Approve Delivery Return** (Approver only):
1. Open pending return
2. Review items, quantities, and conditions
3. Click **"Approve"** button
4. Confirm approval
5. Stock is adjusted based on condition:
   - Good: Stock is added back
   - Damaged/Expired: May be added to disposal

**Reject Delivery Return** (Approver only):
1. Open pending return
2. Click **"Reject"** button
3. Enter rejection reason
4. Confirm rejection

**Common Return Reasons:**
- Customer dissatisfaction
- Quality issue
- Overdelivery
- Expiry concern
- Damaged during delivery

### 6.7 Label Printing

#### Page Location: `/operation/label-printing`

Request and manage product label printing.

**View Label Print Requests:**
- See all label print requests
- Shows: Request No, Date, Showroom, Products, Status
- Filter by: Date range, Showroom, Status

**Create Label Print Request:**
1. Click **"New Label Request"** button
2. Fill in details:
   - **Print Date**: Date labels are needed
   - **Showroom**: Outlet requesting labels
   - **Label Type**: Product label, Price label, Barcode label
   - **Notes**: Optional notes
3. Add **Products for Labeling**:
   - Click **"Add Product"** button
   - Select **Product**
   - Select **Variant** (if applicable)
   - Enter **Quantity** of labels needed
   - Repeat for multiple products
4. Review label list
5. Click **"Submit Request"**
6. Request is sent for approval (if workflow enabled)

**Approve Label Request** (Approver only):
1. Open pending request
2. Review products and quantities
3. Check label settings compliance (future date rules, etc.)
4. Click **"Approve"** button
5. Confirm approval
6. Labels can now be printed

**Print Labels:**
1. Open approved label request
2. Click **"Print Labels"** button
3. Select **Label Template** (if multiple available)
4. Preview labels
5. Click **"Print"**
6. Labels are sent to printer

**Label Settings:**
- Configured in **Administrator → Label Settings**
- Controls: Future date printing, label content, templates

### 6.8 Showroom Open Stock

#### Page Location: `/operation/showroom-open-stock`

View and update showroom opening stock (read-only for most users, update for authorized).

**View Showroom Open Stock:**
1. Navigate to **Operation → Showroom Open Stock**
2. Select **Showroom** from dropdown
3. Select **Date**
4. View all products with opening stock quantities

**Update Open Stock** (Authorized users only):
1. Follow view steps above
2. Click **"Edit"** button
3. Modify quantities for products as needed
4. Click **"Save Changes"**
5. Stock balances are updated

**Export Open Stock:**
1. Select showroom and date
2. Click **"Export"** button
3. Choose format: Excel or PDF
4. Download stock report

### 6.9 Showroom Label Printing

#### Page Location: `/operation/showroom-label-printing`

Generate and print labels specifically for showroom use.

**Generate Showroom Labels:**
1. Navigate to **Operation → Showroom Label Printing**
2. Select **Showroom**
3. Select **Date**
4. Select **Label Type**:
   - Price labels
   - Product labels
   - Barcode labels
   - Promotional labels
5. Click **"Generate Labels"**
6. System prepares label data

**Print Labels:**
1. Review label preview
2. Adjust quantity per product if needed
3. Select **Label Template**
4. Click **"Print"**
5. Labels are sent to printer

**Batch Print:**
1. Select multiple products using checkboxes
2. Set **Quantity per Product**
3. Click **"Batch Print"**
4. All labels print in sequence

---

## 7. DMS Module (Delivery & Production Planning)

The DMS module handles delivery planning, order entry, production planning, and recipe management.

### 7.1 Order Entry

#### Page Location: `/dms/order-entry-enhanced`

Enter and manage product orders per outlet, turn, and day.

**Open Order Entry Grid:**
1. Navigate to **DMS → Order Entry**
2. Select **Date** for order
3. Select **Day Type** (Weekday, Saturday, Sunday, etc.)
4. Select **Delivery Turn** (Turn 1, Turn 2, Turn 3, etc.)
5. Click **"Load Grid"**
6. Spreadsheet-like grid appears

**Grid Layout:**
- **Rows**: Products (one per product)
- **Columns**: 
  - Item Name
  - Code
  - Full/Mini (if product has variants)
  - BAL (Balance/Extra)
  - Total Full
  - Total Mini
  - One column per showroom (DAL, KEL, RAG, etc.)

**Enter Orders:**
1. Click on cell for Product × Showroom
2. Enter **Quantity**
3. Press Enter or Tab to move to next cell
4. System auto-calculates totals
5. **Decimal quantities allowed** for products with decimal enabled
6. **Extra column**: Enter additional quantity not tied to specific outlet

**Item Checkbox:**
1. Uncheck **Item checkbox** to exclude product from this turn
2. Product row is hidden and excluded from totals

**Outlet Checkbox:**
1. Uncheck **Outlet checkbox** to exclude showroom from this turn
2. Outlet column is hidden
3. Quantities for that outlet are zeroed

**Auto-Load Default Quantities:**
1. Grid auto-loads baseline quantities from **Default Quantities** configuration
2. Based on selected Day Type
3. Adjust quantities as needed

**Save Orders:**
1. After entering all orders
2. Click **"Save"** button
3. Orders are saved to database
4. Can be edited later before plan confirmation

**Bulk Edit:**
1. Select multiple cells (drag with mouse)
2. Enter quantity
3. Press Ctrl+Enter to apply to all selected cells

**Export Grid:**
1. Click **"Export"** button
2. Download Excel file with order grid

### 7.2 Delivery Plan

#### Page Location: `/dms/delivery-plan`

Create and manage delivery plans per date and turn.

**View Delivery Plans:**
- See all delivery plans
- Shows: Date, Turn, Day Type, Status, Total products, Total quantity

**Create Delivery Plan:**
1. Click **"New Delivery Plan"** button
2. Fill in **Plan Header**:
   - **Date**: Delivery date
   - **Day Type**: Select day type (auto-loads defaults)
   - **Delivery Turn**: Select turn (Turn 1, Turn 2, etc.)
   - **Notes**: Optional plan notes
3. Click **"Create Plan"**
4. Plan is created with status "Draft"
5. System auto-loads default quantities based on day type

**Load and Adjust Plan:**
1. Open draft plan
2. Grid view shows all products × outlets
3. Adjust quantities as needed
4. Uncheck items/outlets to exclude
5. Click **"Save Changes"**

**Confirm Plan:**
1. Open draft plan
2. Review all quantities and totals
3. Click **"Confirm Plan"**
4. Status changes to "Confirmed"
5. Plan is now locked for production use

**Cancel Plan:**
1. Open draft or confirmed plan
2. Click **"Cancel Plan"** button
3. Confirm cancellation
4. Status changes to "Cancelled"

**Copy Plan from Previous Date:**
1. Create new plan
2. Click **"Copy from Previous"** button
3. Select source date and turn
4. Plan is populated with previous quantities
5. Adjust as needed

### 7.3 Immediate Orders

#### Page Location: `/dms/immediate-orders`

Enter ad-hoc orders not part of regular delivery plan.

**View Immediate Orders:**
- See all immediate orders
- Shows: Order No, Date, Turn, Showroom, Customer, Products, Status

**Create Immediate Order:**
1. Click **"New Immediate Order"** button
2. Fill in **Order Details**:
   - **Date**: Order date
   - **Delivery Turn**: Which turn to include in
   - **Showroom**: Destination outlet
   - **Customer Name**: Optional customer name
   - **Customized**: Check if customized items
   - **Notes**: Order notes (e.g., "Extra filling, double garnish")
3. Add **Order Items**:
   - Click **"Add Item"** button
   - Select **Product**
   - Select **Variant** (Full/Mini)
   - Enter **Quantity**
   - Enter **Special Instructions** (if customized)
   - Repeat for all items
4. Review order
5. Click **"Submit Order"**
6. Order is added to delivery summary

**Edit Immediate Order:**
1. Click **edit icon** next to order
2. Modify details or items
3. Click **"Save Changes"**

**Cancel Immediate Order:**
1. Open order
2. Click **"Cancel Order"** button
3. Confirm cancellation

**View in Delivery Summary:**
1. Navigate to **DMS → Delivery Summary**
2. Immediate orders appear as sub-rows under products
3. Visually distinct (different background color)
4. Included in grand totals

**Common Use Cases:**
- Large custom orders from corporate clients
- Special event orders
- Urgent orders placed after plan confirmation
- Customized products requiring special handling

### 7.4 Default Quantities

#### Page Location: `/dms/default-quantities`

Configure baseline product quantities per outlet per day type.

**View Default Quantities:**
1. Navigate to **DMS → Default Quantities**
2. See matrix: Products (rows) × Outlets (columns) × Day Type (filter)
3. Shows all baseline quantities

**Set Default Quantities:**
1. Select **Day Type** (Weekday, Saturday, Sunday, etc.)
2. Grid shows products × outlets
3. Enter **Quantity** for each Product × Outlet combination
4. Leave blank if product not delivered to that outlet
5. Click **"Save"** button
6. Defaults are saved

**Copy from Another Day Type:**
1. Select target day type
2. Click **"Copy from..."** button
3. Select source day type
4. Confirm copy
5. All quantities are copied
6. Adjust as needed

**Usage:**
- Default quantities auto-load in Order Entry and Delivery Plan
- Saves time entering repetitive orders
- Can be overridden per specific date

**Example Configuration:**

| Product | DAL (Weekday) | KEL (Weekday) | DAL (Saturday) |
|---------|---------------|---------------|----------------|
| Fish Curry Bun | 15 | 10 | 20 |
| Viyana Roll Full | 25 | 20 | 30 |
| Egg Bun Mini | 30 | 25 | 40 |

### 7.5 Delivery Summary

#### Page Location: `/dms/delivery-summary`

View consolidated delivery summary with all sources (regular orders + immediate orders).

**View Delivery Summary:**
1. Navigate to **DMS → Delivery Summary**
2. Select **Date**
3. Select **Delivery Turn**
4. Click **"Load Summary"**
5. See comprehensive summary

**Summary Layout:**
- **Products** (rows)
- **Outlets** (columns)
- **Totals** (column and row totals)
- **Y/N Flags**: Indicates which outlets receive which products
- **Sub-rows**: Immediate orders shown separately but counted in total

**Columns:**
- Product Name
- Code
- Per-Outlet Quantities (DAL, KEL, RAG, etc.)
- **Total Production Quantity**: Total to produce
- **Stores Issue Quantity**: Total to issue from stores (may differ if freezer stock used)
- **Available Balance**: Items in freezer
- **Use Freezer Stock**: Checkbox to deduct from stores issue

**Use Freezer Stock:**
1. Find product row
2. See **Available Balance** (items in freezer)
3. Check **"Use Freezer Stock"** checkbox
4. **Stores Issue Quantity** = Production Quantity - Available Balance
5. **Production Quantity** remains unchanged (full count for production)

**Example:**
- Chinese Roll total: 199
- Freezer stock: 50
- Check "Use Freezer Stock"
- Stores Issue: 199 - 50 = 149 (only on stores sheet)
- Production Qty: 199 (unchanged - production needs full count)

**Customized Orders:**
- Shown in separate sub-row under main product
- Visually distinct (different color or icon)
- Special instructions displayed
- Counted in total quantity

**Export Summary:**
1. Click **"Export"** button
2. Choose format: Excel or PDF
3. Download delivery summary report

### 7.6 Freezer Stock

#### Page Location: `/dms/freezer-stock`

Manage freezer inventory for products and sections.

**View Freezer Stock:**
1. Navigate to **DMS → Freezer Stock**
2. See all products/items in freezer
3. Shows: Product, Section, Quantity on hand, Last updated

**Add Freezer Stock:**
1. Click **"Add Stock"** button
2. Select **Product** (or ingredient/semi-finished item)
3. Select **Section** (which freezer/section)
4. Enter **Quantity**
5. Enter **Notes** (optional)
6. Click **"Save"**

**Update Freezer Stock:**
1. Click **edit icon** next to stock entry
2. Modify **Quantity**
3. Click **"Update"**

**Stock History:**
1. Click on stock entry
2. See **Stock History** tab
3. View all additions, deductions, adjustments
4. Shows: Date, Action, Quantity, User, Notes

**Usage in Delivery Summary:**
- Freezer stock appears in "Available Balance" column
- Can be deducted from Stores Issue Quantity
- Helps reduce waste by using existing stock

### 7.7 Production Planner

#### Page Location: `/dms/production-planner-enhanced`

View production requirements per section based on delivery plan.

**Open Production Planner:**
1. Navigate to **DMS → Production Planner**
2. Select **Date**
3. Select **Delivery Turn**
4. Click **"Load Planner"**
5. Section-tabbed view appears

**Section Tabs:**
- Bakery 1
- Bakery 2
- Filling Section
- Short-Eats 1 (Prepare)
- Short-Eats 2 (Crumb & Fry)
- Rotty Section
- Plain Roll Section
- Pastry Section

**Each Tab Shows:**
1. **Section Header:**
   - Section Name
   - Production Start Time (from turn config)
   - Effective Delivery Time
2. **Products Table:**
   - Product Name
   - Full Quantity
   - Mini Quantity
   - Total Quantity
3. **Ingredients Table:**
   - Ingredient Name
   - Required Quantity (recipe × product qty)
   - Unit of Measure
   - **NO extra quantities** (exact recipe only)
4. **Sub-Tables** (if applicable):
   - For products with multiple sub-recipes
   - Example: Sugar Candy Bun has "Dough Recipe" table and "Bun Recipe" table

**Special Cases:**

**Viyana Roll:**
- Separate rows for Full and Mini
- Each size calculated independently

**Sugar Candy Bun:**
- **Dough Recipe Table**: Flour, Yeast, Sugar, Salt, etc.
- **Bun Recipe Table**: Sugar, Candy, Crystal Sugar

**Egg Bun:**
- **Bakery Table**: Dough ingredients
- **Filling Table**: 
  - Raw eggs (for filling)
  - Boiled eggs (for garnish)
  - Shown as separate lines

**Rounding:**
- Example: 97 patties
- Rounded to 100 (based on rounding rule)
- Egg garnish: 25 eggs (100 patties ÷ 4)
- Standard value (24.25) also displayed

**Customized Orders:**
- Shown separately within section
- Special instructions displayed
- Counted in total quantity

**Export Production Sheet:**
1. Select **Section Tab**
2. Click **"Export Section"** button
3. Choose format: Excel or PDF
4. Download production sheet for that section

**Print Production Sheet:**
1. Select **Section Tab**
2. Click **"Print"** button
3. Production sheet opens in print dialog
4. Print using browser

**View All Sections:**
1. Click **"View All"** tab
2. See condensed view of all sections
3. Shows totals per section

### 7.8 Stores Issue Note (SIN)

#### Page Location: `/dms/stores-issue-note-enhanced`

Generate stores issue notes (ingredient requirements with extras for stores).

**Open Stores Issue Note:**
1. Navigate to **DMS → Stores Issue Note**
2. Select **Date**
3. Select **Delivery Turn**
4. Click **"Load SIN"**
5. Section-tabbed view appears (same as Production Planner)

**Differences from Production Planner:**

| Feature | Production Planner | Stores Issue Note |
|---------|-------------------|-------------------|
| **Extra Quantities** | ❌ No extras | ✅ Includes extra quantities |
| **Freezer Deduction** | ❌ Full quantity | ✅ Deducts freezer stock |
| **Bakery Recipe** | ❌ Not included | ✅ Included in stores sheet |
| **Purpose** | Production guidance | Stores ingredient issue |

**Example:**

**Production Planner:**
- Chinese Roll Filling: 199 units
- Carrot: 5.0 Kg (recipe only)

**Stores Issue Note:**
- Chinese Roll Filling: 149 units (199 - 50 freezer stock)
- Carrot: 5.5 Kg (5.0 + 0.5 extra for cleaning loss)

**Extra Quantities:**
- Configured in recipe as "Extra Qty"
- Accounts for: Cleaning loss, waste, quality control
- Examples:
  - Vegetables: +10% for cleaning
  - Fish: +5% for bones/skin
  - Chicken: +8% for trimming

**Freezer Stock Deduction:**
- If freezer stock is marked in Delivery Summary
- Stores Issue Quantity = Production Qty - Freezer Stock
- Only affects Stores Issue Note, not Production Planner

**Footer Information:**
- Production Start Time
- Effective Delivery Time
- **Printed By**: User who printed
- **Issued By**: (blank for manual signature)
- **Checked By**: (blank for manual signature)

**Export SIN:**
1. Select **Section Tab**
2. Click **"Export Section"** button
3. Choose format: Excel or PDF
4. Download SIN for that section

**Export All Sections:**
1. Click **"Export All"** button
2. All sections exported to single file
3. Download complete SIN

**Print SIN:**
1. Select section tab
2. Click **"Print"** button
3. Print SIN with footer for signatures

### 7.9 Recipe Management

#### Page Location: `/dms/recipe-management`

Create and manage product recipes (ingredients per product per section).

**View Recipes:**
1. Navigate to **DMS → Recipe Management**
2. See all products with recipes
3. Filter by: Product, Section, Category

**Create Recipe:**
1. Click **"New Recipe"** button
2. Select **Product**
3. Select **Section** (if product spans multiple sections, create separate recipes)
4. Select **Recipe Type**:
   - Standard Recipe: Single ingredient list
   - Multi Sub-Recipe: Multiple named sub-recipes (e.g., Dough + Filling)
5. Click **"Create Recipe"**

**Add Ingredients to Recipe:**
1. Open recipe
2. Click **"Add Ingredient"** button
3. Select **Ingredient**
4. Enter **Quantity per Unit** (e.g., 0.5g flour per bun)
5. Enter **Extra Quantity** (for stores only, e.g., +0.5Kg for waste)
6. Select **UOM**
7. Click **"Add"**
8. Repeat for all ingredients
9. Click **"Save Recipe"**

**Multi Sub-Recipe Example (Sugar Candy Bun):**
1. Create recipe for Sugar Candy Bun
2. Select **Multi Sub-Recipe** type
3. Add **First Sub-Recipe**:
   - Name: "Dough Recipe"
   - Add ingredients: Flour, Yeast, Sugar, Salt, Beehive, Eggs
4. Add **Second Sub-Recipe**:
   - Name: "Bun Recipe"
   - Add ingredients: Sugar, Candy, Crystal Sugar
5. Save recipe

**Multi-Section Recipe Example (Egg Bun):**
1. Create **Bakery Section Recipe**:
   - Ingredients: Flour, Yeast, etc. (dough)
2. Create **Filling Section Recipe**:
   - Ingredients: Raw eggs (for filling), Boiled eggs (for garnish)
   - Note: Create separate ingredient entries for raw vs boiled

**Percentage-Based Ingredients:**
1. Some ingredients calculated as % of another item's total
2. Select **"Percentage"** calculation type
3. Select **Base Item**
4. Enter **Percentage** (e.g., 10% of vegetable curry base)

**Edit Recipe:**
1. Click **edit icon** next to recipe
2. Modify ingredients, quantities, or extras
3. Click **"Save Changes"**

**Recipe Versions:**
- Recipes can have versions with effective dates
- Useful for seasonal variations or cost adjustments
- Set **Effective Date** when creating/editing recipe

**Delete Recipe:**
1. Click **delete icon** next to recipe
2. Confirm deletion
3. **Note**: Cannot delete recipes used in current production plans

**Export Recipe:**
1. Click **"Export"** button
2. Download recipe sheet (Excel or PDF)

### 7.10 Recipe Templates

#### Page Location: `/dms/recipe-templates`

Manage reusable recipe templates for quick recipe creation.

**View Templates:**
- See all recipe templates
- Shows: Template name, Category, Number of ingredients

**Create Template:**
1. Click **"New Template"** button
2. Enter **Template Name** (e.g., "Standard Vegetable Curry")
3. Add **Ingredients**:
   - Ingredient
   - Default quantity
   - UOM
4. Click **"Save Template"**

**Use Template:**
1. Go to Recipe Management
2. Create new recipe
3. Click **"Load from Template"** button
4. Select template
5. Recipe is populated with template ingredients
6. Adjust quantities as needed

**Edit Template:**
1. Click **edit icon** next to template
2. Modify ingredients or quantities
3. Click **"Save Changes"**

### 7.11 Anytime Recipe Generator

#### Page Location: `/dms/anytime-recipe-generator`

Real-time recipe calculator for ad-hoc production.

**Use Anytime Recipe:**
1. Navigate to **DMS → Anytime Recipe Generator**
2. Select **Product**
3. Enter **Quantity** to produce
4. Click **"Calculate"**
5. See ingredient requirements instantly

**Output:**
- Ingredient list with quantities
- Based on configured recipe
- Includes extra quantities
- Can be printed or exported

**Use Cases:**
- Urgent production requests
- Special orders
- Quick ingredient checks
- Training and recipe verification

### 7.12 Reconciliation

#### Page Location: `/dms/reconciliation`

Compare planned vs actual delivery/production quantities.

**Run Reconciliation:**
1. Navigate to **DMS → Reconciliation**
2. Select **Date**
3. Select **Delivery Turn**
4. Select **Showroom** (optional, for outlet-specific reconciliation)
5. Click **"Run Reconciliation"**

**Reconciliation Report Shows:**
- Product Name
- Planned Quantity (from delivery plan)
- Actual Quantity (from deliveries/stock movements)
- Variance (Actual - Planned)
- Variance % ((Variance / Planned) × 100)

**Variance Indicators:**
- **Green**: Actual matches planned (0% variance)
- **Yellow**: Minor variance (< 5%)
- **Red**: Significant variance (≥ 5%)

**Export Reconciliation:**
1. Click **"Export"** button
2. Download reconciliation report (Excel or PDF)

**Use Cases:**
- Daily variance analysis
- Identify over/under production
- Cost control and waste reduction
- Audit and compliance

---

## 8. Production Module

### 8.1 Daily Production

#### Page Location: `/production/daily-production`

Record actual production output per section.

**View Daily Production:**
- See all production entries
- Shows: Date, Section, Products, Status
- Filter by: Date range, Section, Status

**Create Production Entry:**
1. Click **"New Production"** button
2. Fill in **Header**:
   - **Date**: Production date
   - **Section**: Production section (Bakery 1, Bakery 2, etc.)
   - **Shift**: Morning, Afternoon, Night (if applicable)
   - **Notes**: Optional production notes
3. Add **Produced Items**:
   - Click **"Add Item"** button
   - Select **Product**
   - Select **Variant** (Full/Mini)
   - Enter **Produced Quantity**
   - Repeat for all items
4. Review totals
5. Click **"Save as Draft"** or **"Submit for Approval"**

**Edit Production (Draft):**
1. Click **edit icon** next to draft production
2. Modify items or quantities
3. Click **"Save Changes"** or **"Submit"**

**Approve Production** (Approver only):
1. Open pending production
2. Review items and quantities
3. Click **"Approve"** button
4. Confirm approval
5. Stock is updated with produced quantities

**Reject Production** (Approver only):
1. Open pending production
2. Click **"Reject"** button
3. Enter rejection reason
4. Confirm rejection

**Print Production Report:**
1. Open approved production
2. Click **"Print"** button
3. Print production summary

### 8.2 Production Cancel

#### Page Location: `/production/cancel`

Cancel planned production.

**View Production Cancellations:**
- See all cancellation requests
- Shows: Cancel No, Date, Section, Reason, Status

**Create Production Cancellation:**
1. Click **"New Cancellation"** button
2. Select **Date**
3. Select **Section**
4. Select **Products** to cancel
5. Enter **Reason** (required)
6. Click **"Submit Cancellation"**
7. Status is "Pending" (requires approval)

**Approve Cancellation** (Approver only):
1. Open pending cancellation
2. Review reason
3. Click **"Approve"** button
4. Production is cancelled

### 8.3 Current Stock

#### Page Location: `/production/current-stock`

View current stock levels per section/location.

**View Current Stock:**
1. Navigate to **Production → Current Stock**
2. Select **Section** or **Location**
3. See all products with current stock levels
4. Shows: Product, Variant, Quantity, Last updated

**Filter Stock:**
- By Section
- By Product Category
- Low stock only (below threshold)
- Zero stock only

**Export Stock:**
1. Click **"Export"** button
2. Download stock report (Excel or PDF)

### 8.4 Stock Adjustment

#### Page Location: `/production/stock-adjustment`

Adjust stock quantities (corrections, physical count variances).

**View Stock Adjustments:**
- See all adjustment documents
- Shows: Adjustment No, Date, Section, Status, Created by

**Create Stock Adjustment:**
1. Click **"New Adjustment"** button
2. Fill in **Header**:
   - **Date**: Adjustment date
   - **Section/Location**: Where adjustment is happening
   - **Reason**: Reason for adjustment (required)
   - **Reference**: Reference number (optional, e.g., physical count sheet)
   - **Notes**: Optional notes
3. Add **Adjustment Items**:
   - Click **"Add Item"** button
   - Select **Product**
   - Select **Variant**
   - Enter **Current Quantity** (system quantity)
   - Enter **Actual Quantity** (physical count)
   - System calculates **Adjustment** (Actual - Current)
   - Repeat for all items
4. Review adjustments
5. Click **"Save as Draft"** or **"Submit for Approval"**

**Edit Adjustment (Draft):**
1. Click **edit icon** next to draft adjustment
2. Modify items or quantities
3. Click **"Save Changes"** or **"Submit"**

**Approve Adjustment** (Approver only):
1. Open pending adjustment
2. Review items and adjustment amounts
3. Check reason is valid
4. Click **"Approve"** button
5. Confirm approval
6. Stock quantities are adjusted

**Reject Adjustment** (Approver only):
1. Open pending adjustment
2. Click **"Reject"** button
3. Enter rejection reason
4. Confirm rejection

**Common Adjustment Reasons:**
- Physical count variance
- Data entry error correction
- Expired stock write-off
- Breakage/damage
- System error correction

### 8.5 Stock Adjustment Approval

#### Page Location: `/production/stock-adjustment-approval`

Dedicated page for approving stock adjustments.

**View Pending Adjustments:**
1. Navigate to **Production → Stock Adjustment Approval**
2. See all pending adjustments
3. Shows: Adjustment No, Date, Section, Reason, Adjustment amount

**Bulk Approve:**
1. Select multiple adjustments using checkboxes
2. Click **"Bulk Approve"** button
3. Confirm bulk approval
4. All selected adjustments are approved

**Individual Actions:**
- Click **"Approve"** button for individual approval
- Click **"Reject"** button for individual rejection

### 8.6 Production Plan

#### Page Location: `/production/plan`

View and manage production plans (similar to Production Planner from DMS module).

**View Production Plan:**
1. Navigate to **Production → Production Plan**
2. Select **Date**
3. Select **Section**
4. See production requirements

**Print Production Plan:**
1. Click **"Print"** button
2. Print plan for distribution to production floor

**Export Production Plan:**
1. Click **"Export"** button
2. Download plan (Excel or PDF)

---

## 9. POS System User Guide

### 9.1 POS System Overview

The Don & Sons POS (Point of Sale) system is an Electron desktop application for showroom cashiers to process sales, manage transactions, and perform operational tasks.

**Key Features:**
- Offline-capable (works without internet)
- Touch-friendly interface
- Product catalog with search and favorites
- Multiple payment methods
- Transaction history
- Stock management (Stock BF, Transfers, Returns)
- Theme customization (managed by admin)
- Automatic sync when online

### 9.2 POS Installation

#### System Requirements
- **OS**: Windows 10 or later
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 500MB free space
- **Display**: 1024×768 minimum, 1920×1080 recommended
- **Network**: Internet connection for sync (optional for offline operation)

#### Installation Steps
1. Download POS installer: `Don & Sons POS Setup 2.0.0.exe`
2. Run installer (requires admin privileges)
3. Follow installation wizard
4. Click **"Install"**
5. Launch POS application from desktop shortcut

### 9.3 POS Login

**First-Time Login:**
1. Launch POS application
2. See Don & Sons login screen (red and gold theme)
3. Enter **Email Address** (provided by admin)
4. Enter **Password**
5. Click **"Sign In"**
6. If credentials correct, main POS screen opens

**Network Status:**
- **Online badge** (green): Connected to server
- **Offline badge** (gray): No internet connection
- POS works in both modes

**Logout:**
1. Click **User Menu** (top right)
2. Select **"Logout"**
3. Confirm logout
4. Returns to login screen

### 9.4 POS Main Screen

#### Layout Overview

**Header Section:**
- **Don & Sons Logo** (left)
- **Online/Offline Badge** (shows connection status)
- **Sync Status**: Shows pending items (if any)
- **Showroom Selector**: Select active outlet
- **User Menu**: Profile, settings, logout
- **Zoom Controls**: Increase/decrease interface size

**Left Panel - Product Catalog:**
- **Search Bar**: Search products by name or code
- **Category Pills**: Quick filter by category
  - All Categories
  - Favourites (★)
  - Bread
  - Bun
  - Sandwich
  - Short-Eat
  - Pizza
  - Pastry
  - Rotty
  - Pattie
- **Product Tiles**: Grid of products with:
  - Product image (if available)
  - Product name
  - Price
  - Star icon (to mark as favorite)
  - Cart badge (if item in cart)

**Right Panel - Bill/Cart:**
- **Bill Number**: Auto-generated
- **Line Items**: Products added to cart
  - Product name
  - Variant (Full/Mini)
  - Unit price
  - Quantity (with +/- buttons)
  - Line total
  - Remove button (×)
- **Total Amount**: Grand total (large, bold)
- **Clear Bill** button: Remove all items
- **PAY** button: Proceed to payment (red, prominent)

**Left Drawer - Operations:**
- Slide-out drawer with operational functions
- Access via menu icon (☰)
- Contains:
  - Stock BF
  - Pending Transfers
  - New Transfer
  - Delivery Return
  - Cash Submission

### 9.5 Processing a Sale

#### Step-by-Step Sale Process

**1. Add Products to Cart:**
   - **Method A - Click Product Tile:**
     - Click on product tile in catalog
     - Quantity modal appears (if product has variants)
     - Select **Full** or **Mini**
     - Product added to cart with qty 1
   - **Method B - Search:**
     - Type product name in search bar
     - Results filter instantly
     - Click on desired product
   - **Method C - Category Filter:**
     - Click category pill (e.g., "Bun")
     - See only products in that category
     - Click product to add

**2. Adjust Quantities:**
   - Find product in bill panel (right side)
   - Click **+ button** to increase quantity
   - Click **- button** to decrease quantity
   - Or click **quantity number** to open numpad
   - Enter quantity using touch numpad (1-999 range)
   - Click **OK** to apply

**3. Remove Items:**
   - Click **× button** next to item in bill
   - Item is removed from cart

**4. Clear Bill:**
   - Click **"Clear Bill"** button (below line items)
   - Confirm clearing
   - All items removed from cart

**5. Proceed to Payment:**
   - Review all items and quantities
   - Check **Total Amount** (large number at bottom)
   - Click **"PAY"** button (red, prominent)
   - Payment modal opens

#### Payment Process

**Payment Modal:**
- Shows **Total Amount**
- Payment method buttons:
  - **Cash** (green button)
  - **Card** (blue button)
  - **Other** options (if configured)
- **Cancel** button to return to cart

**Cash Payment:**
1. Click **"Cash"** button
2. **Tendered Amount** entry appears
3. Enter amount received from customer
4. System calculates **Change**
5. Shows change amount (large, prominent)
6. Click **"Complete Sale"**
7. Sale is processed

**Card Payment:**
1. Click **"Card"** button
2. Sale is processed immediately (no change calculation)
3. Print receipt prompt appears

**After Payment:**
- **Online Mode**:
  - Sale is completed and approved immediately
  - Sale Number generated by server
  - Stock is deducted
  - Receipt can be printed
  - Success message displayed
- **Offline Mode**:
  - Sale is saved to local database
  - Temporary Sale Number generated
  - Queued for sync when online
  - Receipt can be printed with local data
  - Will be automatically approved when synced

#### Receipt Printing

**Automatic Print:**
- After successful sale, print dialog appears
- Click **"Print Receipt"** to print
- Click **"Skip"** to skip printing

**Reprint Receipt:**
1. Click **User Menu** (top right)
2. Select **"Transaction History"**
3. Find sale in list
4. Click **"Reprint"** button next to sale
5. Receipt prints

**Receipt Contents:**
- Don & Sons logo and branding
- Showroom name and address
- Sale Number
- Date and Time
- Cashier name
- Line items (product, qty, price, total)
- Subtotal
- Tax (if applicable)
- Grand Total
- Payment Method
- Change Given (if cash)
- Barcode (sale number)

### 9.6 Product Catalog Features

#### Favorites

**Mark Product as Favorite:**
1. Find product tile
2. Click **star icon** (☆) on product
3. Star turns solid (★)
4. Product is marked as favorite

**View Favorites:**
1. Click **"Favourites"** category pill (has ★ icon)
2. See only favorite products
3. Quick access to frequently sold items

**Unmark Favorite:**
1. Find product (must be in Favorites view or All Categories)
2. Click **solid star** (★)
3. Star becomes hollow (☆)
4. Product removed from favorites

#### Search

**Search Products:**
1. Click in **Search Bar** (top of catalog)
2. Type product name or code
3. Results filter instantly as you type
4. Case-insensitive search
5. Searches: Product name, Code, Category

**Clear Search:**
1. Click **× button** in search bar
2. Or delete all text
3. Full catalog displayed

#### Category Filtering

**Filter by Category:**
1. Click category pill (e.g., "Bread", "Bun")
2. See only products in that category
3. Category pill highlighted

**View All Categories:**
1. Click **"All Categories"** pill
2. See full product catalog

**Category Colors:**
- **All Categories**: Dark gray
- **Favourites**: Accent color (gold)
- **First Regular Category**: Primary color (red)
- **Other Categories**: Color cycle (green, blue, purple, orange, etc.)

### 9.7 Operations Drawer

Access operational functions from the left drawer.

**Open Operations Drawer:**
1. Click **menu icon** (☰) in top left
2. Drawer slides from left
3. Shows all operational functions

**Close Operations Drawer:**
1. Click **× button** in drawer header
2. Or click outside drawer
3. Drawer slides closed

#### Operations Menu Items

1. **Stock BF** - Record opening stock
2. **Pending Transfers** - View and receive incoming transfers
3. **New Transfer** - Create transfer to another showroom (online only)
4. **Delivery Return** - Process customer returns (online only)
5. **Cash Submission** - Submit cashier balance (online only)
6. **Technical** section:
   - Refresh Cache - Reload product catalog
   - View Logs - See sync and error logs
   - App Version - See current version

### 9.8 Stock BF (Brought Forward)

Record opening stock at start of day from POS.

**Create Stock BF:**
1. Open **Operations Drawer**
2. Click **"Stock BF"**
3. Stock BF screen opens
4. See search interface

**Add Stock Items:**
1. Click in **Product Search** field
2. Type product name
3. Select product from dropdown
4. **Variant prompt** appears (if product has Full/Mini)
5. Select variant
6. Quantity modal appears
7. Enter **Quantity** using numpad
8. Click **OK**
9. Product added to list with quantity
10. Repeat for all items

**Edit Quantity:**
1. Find item in list
2. Click **Edit** button (✏️)
3. Enter new quantity
4. Click **OK**

**Remove Item:**
1. Find item in list
2. Click **Remove** button (×)
3. Item removed from list

**Submit Stock BF:**
1. Review all items and quantities
2. Click **"Submit Stock BF"** button
3. Confirm submission
4. **Online Mode**:
   - Stock BF sent to server
   - Appears in web app for approval
   - Success message shown
5. **Offline Mode**:
   - Stock BF saved to local queue
   - Will sync when online
   - Queued message shown

**Print Stock BF:**
1. After submission
2. Click **"Print"** button (optional)
3. Print local copy for records

**View Submitted Stock BF:**
- Cannot view from POS after submission
- View in web app: **Operation → Stock BF**
- See status: Pending, Approved, Rejected

### 9.9 Pending Transfers

View and receive incoming transfers from other showrooms.

**View Pending Transfers:**
1. Open **Operations Drawer**
2. Click **"Pending Transfers"**
3. See list of incoming transfers
4. Shows: Transfer No, Date, From Showroom, Total items

**View Transfer Details:**
1. Click on transfer row
2. See detail view:
   - Transfer header (from showroom, date, etc.)
   - List of items with quantities
   - Total items and quantity

**Receive Transfer:**
1. Open transfer details
2. Review all items
3. Physically verify items received
4. Click **"Received"** button (green)
5. Confirm receipt
6. **Online Mode**:
   - Transfer marked as received in server
   - Stock added to current showroom
   - Success message shown
7. **Offline Mode**:
   - Receipt queued for sync
   - Will update when online

**Report Non-Receipt:**
1. Open transfer details
2. If items not received or issue found
3. Click **"Not Received"** button (red)
4. Enter **Reason** for non-receipt
5. Confirm
6. **Online Mode**:
   - Reported to server
   - Transfer manager notified
7. **Offline Mode**:
   - Report queued for sync

**No Pending Transfers:**
- If no incoming transfers, message displayed:
  - "No pending transfers for your showroom"

### 9.10 New Transfer

Create transfer to another showroom (online only).

**Create Transfer:**
1. Open **Operations Drawer**
2. Click **"New Transfer"**
3. **Offline Check**: If offline, message shown: "Transfer creation requires online connection"
4. If online, transfer screen opens

**Fill Transfer Details:**
1. **To Showroom**: Select destination outlet from dropdown
   - Cannot select own showroom
2. **Transfer Date**: Select date (defaults to today)
3. **Reason**: Select transfer reason
   - Excess stock
   - Stock balancing
   - Emergency request
   - Other
4. **Notes**: Optional notes

**Add Transfer Items:**
1. Click in **Product Search** field
2. Type product name
3. Select product from dropdown
4. Select **Variant** (if applicable)
5. Enter **Quantity** to transfer
6. Click **Add**
7. Product added to transfer list
8. Repeat for all items

**Edit Transfer Item:**
1. Find item in list
2. Click **Edit** button
3. Change quantity
4. Click **Update**

**Remove Transfer Item:**
1. Find item in list
2. Click **Remove** button
3. Confirm removal

**Submit Transfer:**
1. Review all details
2. Click **"Submit Transfer"** button
3. Confirm submission
4. Transfer sent to server
5. Appears in web app for approval
6. Success message shown

**After Submission:**
- Transfer is "Pending" status
- Admin approves in web app: **Operation → Transfer**
- Receiving showroom sees in "Pending Transfers"

### 9.11 Delivery Return

Process customer returns (online only).

**Create Delivery Return:**
1. Open **Operations Drawer**
2. Click **"Delivery Return"**
3. **Offline Check**: If offline, message shown
4. If online, return screen opens

**Fill Return Details:**
1. **Delivery Note No**: Enter original delivery note number (required)
2. **Return Date**: Select return date (defaults to today)
3. **Delivery Date**: Select original delivery date
4. **Reason**: Select return reason
   - Customer dissatisfaction
   - Quality issue
   - Overdelivery
   - Expiry concern
   - Damaged
5. **Notes**: Optional detailed notes

**Add Return Items:**
1. Click in **Product Search** field
2. Type product name
3. Select product from dropdown
4. Select **Variant**
5. Enter **Return Quantity**
6. Select **Condition**:
   - Good (can resell)
   - Damaged (cannot resell)
   - Expired (cannot resell)
7. Click **Add**
8. Product added to return list
9. Repeat for all returned items

**Edit Return Item:**
1. Find item in list
2. Click **Edit** button
3. Change quantity or condition
4. Click **Update**

**Remove Return Item:**
1. Find item in list
2. Click **Remove** button
3. Confirm removal

**Submit Return:**
1. Review all details
2. Click **"Submit Return"** button
3. Confirm submission
4. Return sent to server
5. Appears in web app for approval
6. Success message shown

**After Submission:**
- Return is "Pending" status
- Admin reviews in web app: **Operation → Delivery Return**
- Approver decides: Approve or Reject
- Stock adjusted based on condition and approval

### 9.12 Cash Submission

Submit cashier balance at end of day (online only).

**Submit Cashier Balance:**
1. Open **Operations Drawer**
2. Click **"Cash Submission"**
3. **Offline Check**: If offline, message shown
4. If online, cash submission screen opens

**Fill Submission Details:**
1. **Submission Date**: Select date (defaults to today)
2. **Shift**: Select shift (if applicable)
   - Morning
   - Afternoon
   - Evening
   - Full Day
3. **Cashier**: Auto-filled with logged-in user
4. **Showroom**: Auto-filled with selected outlet

**Enter Cash Counts:**
1. **Cash Sales Total**: Enter total cash sales from POS
2. **Cash in Hand**: Enter actual cash counted
3. **Variance**: System calculates (Cash in Hand - Cash Sales)
4. **Variance Reason**: If variance, explain reason (required)

**Enter Payment Method Breakdown:**
1. **Cash Amount**: Enter cash payment total
2. **Card Amount**: Enter card payment total
3. **Digital Payment**: Enter digital payment total (if applicable)
4. **Other**: Enter other payment methods

**Add Expenses (if applicable):**
1. Click **"Add Expense"** button
2. Enter **Expense Type** (e.g., Petty Cash, Supplies)
3. Enter **Amount**
4. Enter **Notes**
5. Click **Add**
6. Repeat for all expenses

**Submit Balance:**
1. Review all amounts
2. Check variance is explained
3. Click **"Submit Balance"** button
4. Confirm submission
5. Balance sent to server
6. Appears in web app for approval: **Administrator → Cashier Balance**
7. Success message shown

**After Submission:**
- Balance is "Pending" status
- Finance or manager reviews in web app
- Approver can: Approve or Reject (with reason)

### 9.13 Transaction History

View past sales and reprint receipts.

**Open Transaction History:**
1. Click **User Menu** (top right)
2. Select **"Transaction History"**
3. Transaction history modal opens

**View Transactions:**
- See paginated list of sales
- Shows per sale:
  - Sale Number
  - Date and Time
  - Total Amount
  - Payment Method
  - Status (automatically Approved; exceptional cases may show Rejected or Voided)
- **Online Mode**: Loads from server (all sales)
- **Offline Mode**: Shows local sales only

**Pagination:**
1. See page indicator (e.g., "Page 1 of 5")
2. Click **Next** button to see more sales
3. Click **Previous** button to go back

**Search/Filter:**
- **Date Range**: Select start and end dates
- **Payment Method**: Filter by Cash, Card, etc.
- **Status**: Most sales are Approved automatically; filter to find exceptional cases

**View Sale Details:**
1. Click on sale row
2. See detailed view:
   - Sale header (date, time, cashier, outlet)
   - All line items with quantities and prices
   - Totals
   - Payment details

**Reprint Receipt:**
1. Find sale in list
2. Click **"Reprint"** button next to sale
3. Receipt prints immediately

**Close Transaction History:**
1. Click **× button** in modal header
2. Or click outside modal
3. Returns to main POS screen

### 9.14 Customer Display

Large-screen customer-facing display (optional).

**Open Customer Display:**
1. Click **User Menu** (top right)
2. Select **"Customer Display"**
3. Customer view opens in full screen (new window or second monitor)

**Customer Display Features:**
- **Full Screen**: Dark background, high contrast
- **Company Logo**: Don & Sons branding
- **Live Cart**: Shows items as cashier adds them
- **Item Details**: Product name, quantity, price
- **Running Total**: Large, prominent total amount (gold color)
- **Real-Time Updates**: Instant sync with cashier screen

**Close Customer Display:**
1. Press **Esc** key
2. Or click **Close** button (if visible)
3. Returns to normal view

**Dual Monitor Setup:**
1. Connect second monitor
2. Open Customer Display
3. Drag window to second monitor
4. Press F11 for full screen
5. Customer sees display while cashier uses main screen

### 9.15 POS Settings & Configuration

**Access POS Settings:**
1. Click **User Menu** (top right)
2. Select **"Settings"**
3. Settings panel opens

**Available Settings:**

**General:**
- **Default Showroom**: Set primary outlet
- **Language**: Select interface language (if multi-language enabled)
- **Receipt Printer**: Select default printer

**Display:**
- **Zoom Level**: Increase/decrease interface size (80% - 150%)
- **Theme**: View current theme (set by admin in web app)
- **Product Tile Size**: Small, Medium, Large

**Offline/Sync:**
- **Auto-Sync**: Enable/disable automatic sync when online
- **Sync Interval**: How often to check for updates (minutes)
- **Cache Products**: Keep product catalog offline

**Printing:**
- **Auto-Print Receipt**: Print automatically after sale
- **Number of Copies**: 1, 2, 3
- **Receipt Footer**: Custom text on receipts

**Save Settings:**
1. Make changes
2. Click **"Save"** button
3. Settings saved locally
4. Some changes may require restart

### 9.16 POS Theme Customization

**Theme Management:**
- Themes are managed by admin in web app
- Admin configures colors in **Administrator → POS Theme Configuration**
- Active theme automatically syncs to all POS terminals

**Theme Elements:**
- **Primary Color**: Headers, main buttons, category pill
- **Accent Color**: PAY button, highlights, favorites
- **Header Background**: Top bar color
- **Button Colors**: Primary and accent buttons
- **Category Pills**: First two use brand colors

**Theme Sync:**
- **Automatic**: POS checks for theme updates when online
- **On Startup**: POS loads latest theme on app start
- **On Reconnect**: Theme updates when POS comes online

**View Current Theme:**
1. Open **Settings**
2. See **"Current Theme"** section
3. Shows: Theme name, Primary color, Accent color

**Manual Theme Refresh:**
1. Open **Operations Drawer**
2. Click **"Refresh Cache"** (under Technical section)
3. Theme and product catalog refresh

### 9.17 POS Offline Mode

**How Offline Mode Works:**
- POS app detects network status automatically
- When offline, local database (IndexedDB) is used
- All operations queue for sync when online
- Product catalog cached locally
- Transactions saved locally

**Offline Capabilities:**
- ✅ Process sales (POS sales)
- ✅ Record Stock BF
- ✅ View transaction history (local sales only)
- ✅ Search products
- ✅ Mark favorites
- ✅ Print receipts (with local data)
- ❌ Create transfers (requires online)
- ❌ Create delivery returns (requires online)
- ❌ Cash submission (requires online)
- ❌ View pending transfers (requires online)

**Offline Indicators:**
- **Badge**: "Offline" badge in header (gray)
- **Sync Icon**: Shows pending items count
- **Warning Messages**: Shown when attempting online-only functions

**Queued Operations:**
- Sales
- Stock BF submissions
- Transfer receipts (if received while offline)

**Sync When Online:**
1. POS detects internet connection
2. **Badge changes**: "Online" (green)
3. **Auto-Sync**: Queued items process automatically
4. **Sync Status**: Shows "Syncing..." then "Synced"
5. **Errors**: If sync fails, retries up to 5 times

**View Sync Queue:**
1. Open **Operations Drawer**
2. Click **"View Logs"** (under Technical)
3. See pending items and sync status
4. Shows: Operation type, Status, Retry count

**Manual Sync:**
1. When online, click **Sync Now** button (if visible)
2. Or open Operations → **Refresh Cache**
3. Forces immediate sync of pending items

**Offline Best Practices:**
- Product catalog automatically caches (refreshes daily when online)
- Process sales normally; they sync automatically and are approved when synced
- Receipts can be printed immediately in both online and offline modes
- Submit Stock BF, transfers at start of day when online (if possible)
- Check sync status at end of day before closing

### 9.18 POS Troubleshooting

**Cannot Login:**
- **Check**: Email and password correct (case-sensitive)
- **Check**: Network connection (if first-time login)
- **Check**: Backend server is running
- **Solution**: Contact admin to verify credentials

**Products Not Loading:**
- **Check**: Network connection
- **Solution**: Wait for initial catalog sync (may take 1-2 minutes)
- **Solution**: Click "Refresh Cache" in Operations drawer

**Sale Not Processing:**
- **Check**: All items have quantities > 0
- **Check**: Total amount > 0
- **Solution**: If offline, sale queues for sync (working as expected)
- **Solution**: If online and still failing, check backend server

**Receipt Not Printing:**
- **Check**: Printer is connected and powered on
- **Check**: Printer has paper
- **Check**: Printer selected in Settings
- **Solution**: Print from Transaction History using "Reprint"

**Sync Stuck/Failing:**
- **Check**: Network connection stable
- **Check**: Backend server accessible
- **Solution**: Wait 5 minutes for automatic retry
- **Solution**: Restart POS application
- **Solution**: View Logs for error details

**Theme Not Updating:**
- **Solution**: Click "Refresh Cache" in Operations drawer
- **Solution**: Restart POS application
- **Solution**: Verify theme is set as active in web app

**Slow Performance:**
- **Solution**: Reduce zoom level in Settings
- **Solution**: Clear old transaction data (contact admin)
- **Solution**: Restart POS application
- **Solution**: Check system resources (RAM, CPU)

**App Crashes:**
- **Solution**: Restart POS application
- **Solution**: Check Windows Event Viewer for errors
- **Solution**: Reinstall POS application
- **Solution**: Contact IT support with error details

**Cannot Create Transfer/Return:**
- **Check**: Must be online for these operations
- **Solution**: Wait for internet connection
- **Solution**: If urgent, contact manager to create in web app

---

## 10. Reports Module

### 10.1 Reports Overview

#### Page Location: `/reports`

The Reports module provides various business intelligence and operational reports.

**Available Report Categories:**
1. Sales Reports
2. Delivery Reports
3. Disposal Reports
4. Inventory Reports
5. Production Reports
6. Financial Reports
7. Operational Reports

### 10.2 Common Report Features

**Date Range Selection:**
- All reports support custom date ranges
- Quick options: Today, Yesterday, Last 7 days, Last 30 days, This month, Last month

**Export Options:**
- **Excel**: Download as .xlsx file
- **PDF**: Download as PDF document
- **Print**: Print directly from browser

**Filters:**
- By Showroom/Outlet
- By Product/Category
- By User/Employee
- By Status
- By Section (for production reports)

**Report Actions:**
1. **Generate**: Click "Generate Report" after selecting filters
2. **Export**: Choose format and download
3. **Print**: Direct printing
4. **Schedule**: Set up automated report generation (if configured)
5. **Save**: Save report configuration for reuse

### 10.3 Sales Reports

**Daily Sales Summary:**
- Total sales per day
- Breakdown by outlet
- Breakdown by product category
- Payment method analysis
- Comparison with previous period

**Sales by Product:**
- Product-wise sales quantity
- Product-wise sales value
- Best-selling products
- Slow-moving products
- Trend analysis

**Sales by Outlet:**
- Outlet-wise sales
- Top-performing outlets
- Sales comparison across outlets
- Growth trends

**Cashier Performance:**
- Sales by cashier
- Transaction count per cashier
- Average transaction value
- Hourly/shift analysis

### 10.4 Delivery Reports

**Delivery Summary:**
- Total deliveries by date
- Outlet-wise delivery breakdown
- Product-wise delivery quantities
- Delivery turn analysis

**Delivery vs Plan:**
- Planned quantity
- Actual delivered quantity
- Variance analysis
- Fulfillment rate

**Delivery Efficiency:**
- On-time delivery rate
- Delivery completion status
- Pending deliveries
- Cancelled deliveries

### 10.5 Disposal Reports

**Disposal by Section:**
- Section-wise waste analysis
- Disposal reasons breakdown
- Cost of disposal
- Waste percentage

**Disposal by Product:**
- Product-wise disposal quantities
- High-waste products
- Disposal trend over time

**Disposal by Showroom:**
- Outlet-wise disposal
- Comparison across showrooms
- Waste reduction tracking

### 10.6 Inventory Reports

**Current Stock Report:**
- Product-wise stock levels
- Low stock alerts
- Zero stock items
- Overstock items

**Stock Movement Report:**
- Stock in (production, transfers in)
- Stock out (sales, transfers out, disposal)
- Net movement
- Running balance

**Stock Valuation:**
- Product-wise stock value
- Total inventory value
- Category-wise breakdown

### 10.7 Production Reports

**Daily Production Report:**
- Section-wise production
- Product-wise production quantities
- Production vs Plan comparison
- Production efficiency

**Ingredient Consumption:**
- Ingredient-wise usage
- Consumption vs Plan
- Waste/variance analysis

**Production Efficiency:**
- Actual vs Planned production
- Section-wise efficiency metrics
- Downtime analysis

### 10.8 Financial Reports

**Revenue Report:**
- Total revenue by period
- Revenue by outlet
- Revenue by product category
- Payment method breakdown

**Cost Analysis:**
- Ingredient costs
- Production costs
- Waste costs
- Net margin analysis

**Variance Report:**
- Planned vs Actual revenue
- Planned vs Actual costs
- Budget variance analysis

### 10.9 Operational Reports

**Transfer Report:**
- Inter-outlet transfers
- Transfer frequency
- Transfer reasons
- Transfer efficiency

**Return Report:**
- Return quantity
- Return reasons
- Return rate by product
- Return cost analysis

**Approval Queue Status:**
- Pending approvals by type
- Approval turnaround time
- Bottleneck analysis

---

## 11. Troubleshooting

### 11.1 Common Issues & Solutions

#### Cannot Login to Web Application

**Issue**: Email and password not working

**Solutions:**
1. Verify email address is correct (no typos)
2. Check password is correct (case-sensitive)
3. Try "Forgot Password" to reset
4. Verify account is active (contact admin)
5. Clear browser cache and cookies
6. Try different browser

**Issue**: "Invalid credentials" error

**Solutions:**
1. Confirm caps lock is off
2. Check for extra spaces before/after email or password
3. Contact admin to verify account exists
4. Check if account has been deactivated

#### Permission Denied Errors

**Issue**: "You don't have permission to access this page"

**Solutions:**
1. Log out and log back in (token refresh)
2. Contact admin to verify assigned role and permissions
3. Check if role has required permissions
4. Verify you're not accessing restricted admin-only pages

#### Page Not Loading / Blank Screen

**Issue**: Page shows loading spinner forever or blank screen

**Solutions:**
1. Check internet connection
2. Refresh page (F5 or Ctrl+R)
3. Clear browser cache: Settings → Clear browsing data
4. Check if backend server is running (contact IT)
5. Try different browser
6. Check browser console for errors (F12)

#### Data Not Saving

**Issue**: Clicking "Save" but data doesn't save

**Solutions:**
1. Check all required fields are filled (look for red borders)
2. Check for validation errors (red text below fields)
3. Check internet connection
4. Check if day is locked (for past date transactions)
5. Refresh page and try again
6. Check backend server status

#### Workflow Approval Issues

**Issue**: Cannot approve document

**Solutions:**
1. Verify you have approval permission for that document type
2. Check document status (can only approve "Pending" documents)
3. Refresh page
4. Log out and log back in
5. Contact admin to verify permissions

**Issue**: Submitted document not appearing for approval

**Solutions:**
1. Verify document was successfully submitted (check status)
2. Check approval queue: **Administrator → Approvals**
3. Verify workflow is enabled for that document type
4. Refresh approvals page
5. Check filters (might be filtered out)

#### Sync Issues (POS)

**Issue**: POS says "Syncing..." but never completes

**Solutions:**
1. Check internet connection on POS device
2. Check if backend server is accessible
3. Wait 5 minutes for automatic retry
4. Restart POS application
5. Check sync logs in Operations drawer → View Logs
6. Contact IT support if persists

**Issue**: Sales not appearing in web app

**Solutions:**
1. Check POS is online (green badge)
2. Check sync status in POS header
3. Verify sale was successfully processed (check Transaction History)
4. Wait a few minutes for sync to complete
5. Manually trigger sync: Operations → Refresh Cache

#### Theme Issues (POS)

**Issue**: POS theme not matching admin settings

**Solutions:**
1. Check theme is set as "Active" in web app
2. Click "Refresh Cache" in POS Operations drawer
3. Restart POS application
4. Verify POS is online
5. Check theme was saved in web app

#### Report Issues

**Issue**: Report shows "No data"

**Solutions:**
1. Verify date range is correct
2. Check filters (might be too restrictive)
3. Verify data exists for selected period
4. Try broader date range
5. Remove all filters and try again

**Issue**: Report export fails

**Solutions:**
1. Check internet connection
2. Ensure browser allows downloads
3. Try different export format
4. Check available disk space
5. Try smaller date range

#### Print Issues

**Issue**: Receipts/reports not printing

**Solutions:**
1. Check printer is powered on and connected
2. Check printer has paper and ink/toner
3. Verify printer is set as default in system
4. Check printer queue (clear stuck jobs)
5. Test print from another application
6. Restart printer
7. Reinstall printer drivers

### 11.2 Browser Compatibility

**Supported Browsers:**
- Google Chrome (recommended)
- Microsoft Edge
- Mozilla Firefox
- Safari (Mac)

**Not Supported:**
- Internet Explorer (any version)

**Recommended Browser Settings:**
- JavaScript enabled
- Cookies enabled
- Pop-ups allowed (for reports and prints)
- Hardware acceleration enabled

### 11.3 Performance Optimization

**Slow Page Loading:**
1. Clear browser cache regularly
2. Close unused browser tabs
3. Disable unnecessary browser extensions
4. Use wired internet connection (not WiFi if possible)
5. Check internet speed (minimum 5 Mbps recommended)

**Slow POS Performance:**
1. Reduce zoom level in POS Settings
2. Close other applications on POS device
3. Restart POS application daily
4. Ensure sufficient RAM (8GB recommended)
5. Check for Windows updates

### 11.4 Getting Help

**Help Resources:**
1. **This User Manual**: Comprehensive guide to all features
2. **In-App Help**: Hover over (?) icons for tooltips
3. **Training Videos**: Contact admin for video tutorials
4. **FAQs**: Check with admin for FAQ document

**Contact Support:**

**For Technical Issues:**
- Email: support@ciphelabz.com
- Phone: [Your support number]
- Hours: Monday-Friday, 9 AM - 6 PM

**For Admin/Business Issues:**
- Contact your system administrator
- Contact department manager

**When Reporting Issues, Provide:**
1. Your name and role
2. Page/module where issue occurred
3. Exact error message (screenshot if possible)
4. Steps to reproduce the issue
5. Browser/device information
6. Date and time issue occurred

### 11.5 Best Practices

**Daily Operations:**
1. Log in at start of day
2. Check pending approvals (if approver)
3. Process transactions promptly
4. Submit Stock BF at start of day (POS users)
5. Submit cashier balance at end of day (POS users)
6. Log out at end of day

**Data Entry:**
1. Double-check quantities before saving
2. Add notes for unusual transactions
3. Review before submitting for approval
4. Don't delete; use cancellation/rejection workflow

**Security:**
1. Don't share login credentials
2. Log out when leaving workstation
3. Use strong passwords
4. Change password periodically
5. Report suspicious activity

**Offline Operation (POS):**
1. Ensure product catalog is cached
2. Check sync status before going offline
3. Process sales normally offline
4. Sync as soon as online
5. Verify sync completed successfully

---

## Appendix A: Keyboard Shortcuts

### Web Application

| Action | Shortcut |
|--------|----------|
| Open search | Ctrl + K |
| Save form | Ctrl + S |
| Refresh page | F5 or Ctrl + R |
| Close modal | Esc |
| Navigate back | Alt + ← |
| Navigate forward | Alt + → |
| Open help | F1 |
| Logout | Ctrl + Shift + L |

### POS Application

| Action | Shortcut |
|--------|----------|
| Search products | Ctrl + F |
| Clear bill | Ctrl + Delete |
| Pay (proceed to payment) | F9 |
| Open operations drawer | Ctrl + O |
| Transaction history | Ctrl + H |
| Open settings | Ctrl + , |
| Increase zoom | Ctrl + Plus |
| Decrease zoom | Ctrl + Minus |
| Reset zoom | Ctrl + 0 |
| Logout | Ctrl + Q |
| Toggle fullscreen | F11 |

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **Stock BF** | Stock Brought Forward; opening stock balance at start of period |
| **Turn** | Delivery turn; scheduled delivery time (e.g., 5:00 AM, 10:30 AM) |
| **Day Type** | Classification of day for default quantities (Weekday, Saturday, Sunday, etc.) |
| **Showroom** | Outlet or retail location where products are sold |
| **UOM** | Unit of Measure; measurement unit for ingredients/products (Kg, g, Ltr, etc.) |
| **SIN** | Stores Issue Note; document listing ingredients to issue from stores |
| **RBAC** | Role-Based Access Control; permission system based on user roles |
| **Disposal** | Recording of waste, expired, or unsellable products |
| **Transfer** | Movement of products between showrooms/outlets |
| **Variant** | Product size variant (Full or Mini) |
| **Day Lock** | Feature to prevent modifications to past dates for accounting control |
| **Workflow** | Approval process for documents (Draft → Pending → Approved/Rejected) |
| **Recipe** | List of ingredients and quantities required to make a product |
| **Extra Quantity** | Additional ingredient quantity added to stores issue for waste/loss |
| **Freezer Stock** | Inventory of frozen/stored items available to use |
| **Immediate Order** | Ad-hoc order placed outside regular delivery plan |
| **Reconciliation** | Comparison of planned vs actual quantities to identify variances |

---

## Appendix C: System Limits & Constraints

| Limit | Value |
|-------|-------|
| Maximum products in single order | 500 items |
| Maximum quantity per item | 9999 |
| Decimal precision | 2 decimal places (e.g., 4.75) |
| Maximum showrooms | Unlimited |
| Maximum users | Unlimited |
| Maximum concurrent POS logins | 100 |
| Transaction history retention | 2 years |
| Offline POS catalog cache | 7 days |
| Password minimum length | 8 characters |
| Session timeout | 8 hours |
| Max file upload size | 10 MB |
| Supported image formats | JPG, PNG, GIF |

---

## Appendix D: API & Integration Info (For Developers)

**Backend API Base URL:**
```
http://[server-address]/api
```

**Authentication:**
- Type: JWT (JSON Web Token)
- Header: `Authorization: Bearer [token]`
- Token expiry: 8 hours
- Refresh token expiry: 7 days

**POS Integration:**
- Technology: Electron (Chromium + Node.js)
- Offline Storage: IndexedDB (Dexie)
- Sync Protocol: REST API with retry mechanism
- Idempotency: ClientMutationId for sales

**Theme System:**
- POS themes configured via web app
- Auto-sync to POS terminals
- CSS custom properties for styling

---

## Appendix E: Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | May 13, 2026 | AI Assistant | Initial comprehensive user manual created |

---

**End of User Manual**

For latest updates and additional resources, contact your system administrator.
