# Don & Sons DMS - Implementation Plan
## Complete Task Breakdown: Frontend First, Then Backend

---

## 🎨 PHASE 1: FRONTEND PROTOTYPE (Complete UI/UX)

### **Stage 1.1: Project Setup & Foundation** (Week 1)

#### Task 1.1.1: Initialize Next.js Project
- [ ] Create Next.js 14+ project with TypeScript
- [ ] Install and configure Tailwind CSS
- [ ] Install and setup shadcn/ui components
- [ ] Configure project structure (folders: components, pages, hooks, lib, types)
- [ ] Setup TypeScript configurations

#### Task 1.1.2: Brand Theme Implementation
- [ ] Create theme configuration file with Don & Sons colors
  - Primary Red: #C8102E
  - Accent Yellow: #FFD100
  - White for dark backgrounds
- [ ] Implement CSS custom properties for dynamic theming
- [ ] Create theme context/provider for per-page color coding
- [ ] Test theme switching functionality

#### Task 1.1.3: Responsive Layout Foundation
- [ ] Create base layout component with collapsible sidebar
- [ ] Implement mobile-responsive navigation (320px - 1920px)
- [ ] Create top navigation bar with user profile dropdown
- [ ] Implement collapsible left-panel sidebar
- [ ] Add news ticker/notification area in header
- [ ] Test on mobile (320px), tablet (768px), desktop (1920px)

---

### **Stage 1.2: Navigation & Routing** (Week 1)

#### Task 1.2.1: Setup Navigation Structure
- [ ] Create navigation menu data structure
- [ ] Implement expandable/collapsible menu items
- [ ] Create navigation items:
  - Dashboard
  - Inventory (Products, Category, UOM, Ingredient)
  - Show Room
  - Operation (Delivery, Disposal, Transfer, Stock BF, Cancellation, Delivery Return, Label Printing, Showroom Open Stock, Showroom Label Printing)
  - Reports
  - Administrator (Day-End Process, Cashier Balance, System Settings, Label Settings, Delivery Plan, Security, Day Lock, Approvals, Showroom Employee, Price Manager, WorkFlow Config)
  - Production (Daily Production, Production Cancel, Current Stock, Stock Adjustment, Stock Adjustment Approval, Production Plan)
- [ ] Implement active state highlighting with per-page color
- [ ] Test navigation on all screen sizes

#### Task 1.2.2: Create Route Structure
- [ ] Setup Next.js App Router structure
- [ ] Create placeholder pages for all modules
- [ ] Implement route protection (auth wrapper - UI only)
- [ ] Test all routes and navigation flow

---

### **Stage 1.3: Authentication UI** (Week 1)

#### Task 1.3.1: Login & Auth Pages
- [ ] Create login page with brand theme
- [ ] Design login form (username, password fields)
- [ ] Add "Remember Me" checkbox
- [ ] Create logout functionality UI
- [ ] Design change password page
- [ ] Mock authentication state management
- [ ] Create auth context/provider (frontend only)
- [ ] Test responsive design on all devices

---

### **Stage 1.4: Dashboard UI** (Week 2)

#### Task 1.4.1: Dashboard Layout
- [ ] Create 4-quadrant responsive layout
- [ ] Design widget containers with brand theme
- [ ] Implement mobile responsive grid (stacks on mobile)

#### Task 1.4.2: Dashboard Widgets (Mock Data)
- [ ] Widget 1: Sales Trend for Last 7 Days
  - Create line/area chart component
  - Add mock data (dates + values)
  - Style with brand colors
- [ ] Widget 2: Disposal by Section - Yesterday
  - Create pie/donut chart component
  - Add mock data for all categories
  - Add legends with colors
- [ ] Widget 3: Today Top Deliveries
  - Create table + bar chart combo
  - Add mock showroom data
  - Implement sorting by count
- [ ] Widget 4: Delivery vs Disposal Trend - 7 Days
  - Create grouped bar chart
  - Add mock comparison data
  - Style with brand colors

#### Task 1.4.3: Dashboard Header Elements
- [ ] Add news/notification ticker
- [ ] Add user profile dropdown (top-right)
- [ ] Test all widgets responsiveness

---

### **Stage 1.5: Inventory Module UI** (Week 2-3)

#### Task 1.5.1: Products Page
- [ ] Create products list view page
- [ ] Design data table with columns:
  - Product Category, Product Code, Product Description, Unit Price, Unit of Measure, Require Open Stk, Active, Actions
- [ ] Implement search functionality (UI)
- [ ] Add pagination controls (10, 25, 50 per page)
- [ ] Create "Add Product" form modal/page
  - Product Code input
  - Product Description input
  - Category dropdown (mock data)
  - UOM dropdown (mock data)
  - Unit Price input
  - Require Open Stock checkbox
  - Enable Label Print checkbox
  - Active Status toggle
- [ ] Create "Edit Product" form (same as add)
- [ ] Add toggle active/inactive button
- [ ] Add info/view button
- [ ] Test with mock data (470+ products)

#### Task 1.5.2: Category Page
- [ ] Create category list view
- [ ] Design table with columns: Code, Description, Actions
- [ ] Implement search functionality (UI)
- [ ] Add pagination (25 per page)
- [ ] Create "Add Category" form modal
  - Code input
  - Description input
  - Active checkbox
- [ ] Create "Edit Category" form
- [ ] Add toggle active button
- [ ] Test with mock categories

#### Task 1.5.3: Unit of Measure Page
- [ ] Create UOM list view
- [ ] Design table: Code, Description, Actions
- [ ] Add "Add UOM" form modal
  - Code input
  - Description input
- [ ] Create "Edit UOM" form
- [ ] Test with mock data (G, ml, Nos)

#### Task 1.5.4: Ingredient Page
- [ ] Create ingredient list view
- [ ] Design table: Code, Name, Unit, Actions
- [ ] Implement search functionality
- [ ] Add pagination (10 per page, 127 entries)
- [ ] Create "Add Ingredient" form modal
  - Code input
  - Name input
  - Unit dropdown
  - Active checkbox
- [ ] Create "Edit Ingredient" form
- [ ] Test with mock 127 ingredients

---

### **Stage 1.6: Showroom Management UI** (Week 3)

#### Task 1.6.1: Showroom List & Forms
- [ ] Create showroom list view
- [ ] Design table: Name (code), Desc, City, Dashboard, Active, Actions
- [ ] Create "Add Showroom" form modal
  - Name/Code input
  - Description input
  - City input
  - Dashboard checkbox
  - Active checkbox
- [ ] Create "Edit Showroom" form
- [ ] Test with 30 showrooms mock data

---

### **Stage 1.7: Operations Module UI** (Week 3-4)

#### Task 1.7.1: Delivery Page
- [ ] Create delivery list view
- [ ] Design table: Delivery Date, Delivery No, Showroom, Status, Edit User, Edit Date, Approved/Rejected By, Actions
- [ ] Add header buttons: "Show Previous Records", "Add New", "Print DN"
- [ ] Create "Add Delivery" form modal
  - Date picker
  - Showroom dropdown
  - Product selection grid
  - Quantity inputs
  - Status indicator
- [ ] Implement per-page color coding
- [ ] Add edit functionality
- [ ] Test with mock 796 records

#### Task 1.7.2: Disposal Page
- [ ] Create disposal list view
- [ ] Design table: Disposal Date, Disposal No, Showroom, Delivered Date, Status, Edit User, Approved/Rejected By, Actions
- [ ] Add header buttons
- [ ] Create "Add Disposal" form modal
  - Date picker
  - Showroom dropdown
  - Delivered date picker
  - Product selection
  - Quantity inputs
- [ ] Implement color coding
- [ ] Test with mock 169 records

#### Task 1.7.3: Transfer Page
- [ ] Create transfer list view
- [ ] Design table: Transfer Date, Transfer No, ShowRoom From, ShowRoom To, Status, Edit User, Edit Date, Actions
- [ ] Create "Add Transfer" form modal
  - Date picker
  - From Showroom dropdown
  - To Showroom dropdown
  - Product selection
  - Quantity inputs
- [ ] Implement color coding
- [ ] Test with mock 61 records

#### Task 1.7.4: Stock BF Page
- [ ] Create Stock BF list view
- [ ] Design table: Date, Display No, ShowRoom, Status, Edit User, Edit Date, Actions
- [ ] Create "Add Stock BF" form modal
  - Date picker
  - Showroom dropdown
  - Product selection grid
  - Quantity inputs
- [ ] Implement color coding
- [ ] Test with mock 94 entries

#### Task 1.7.5: Cancellation Page
- [ ] Create cancellation list view
- [ ] Design table: Cancellation Date, Cancellation No, Showroom, Delivered Date, Status, Actions
- [ ] Create "Add Cancellation" form modal
  - Date picker
  - Showroom dropdown
  - Delivered date
  - Product selection
- [ ] Implement color coding
- [ ] Test with mock 76 records

#### Task 1.7.6: Delivery Return Page
- [ ] Create delivery return list view
- [ ] Design table: Return Date, Return No, Showroom, Delivered Date, Status, Actions
- [ ] Create "Add Delivery Return" form modal
  - Date picker
  - Showroom dropdown
  - Delivered date
  - Product selection
- [ ] Implement color coding
- [ ] Test with mock 32 entries

#### Task 1.7.7: Label Printing Page
- [ ] Create label printing list view
- [ ] Design table: Date, Display No, Status, Product, Label Count, Edit User, Edit Date, Actions
- [ ] Create "Add Label Print Request" form modal
  - Date picker (with yellow highlight feature)
  - Product dropdown (Enable Label Print = TRUE only)
  - Label count input
- [ ] Implement yellow date box warning
- [ ] Implement color coding
- [ ] Test with mock 518 records

#### Task 1.7.8: Showroom Open Stock Page
- [ ] Create showroom open stock view
- [ ] Design table: Showroom, Stock As At, Edit icon, Info icon
- [ ] Implement editable "Stock As At" date field
- [ ] Test with mock data

#### Task 1.7.9: Showroom Label Printing Page
- [ ] Create showroom label print form
- [ ] Design form fields:
  - Showroom Code dropdown
  - Text 1 input (auto-populated)
  - Text 2 input (optional)
  - Label Count input
- [ ] Implement auto-fill functionality
- [ ] Add submit button
- [ ] Test functionality

---

### **Stage 1.8: Reports Module UI** (Week 4)

#### Task 1.8.1: Reports Layout
- [ ] Create two-panel layout (groups left, reports right)
- [ ] Design report group list:
  - General
  - Cashier
  - Sales
  - Delivery
  - Disposal
  - Production
- [ ] Implement group filtering

#### Task 1.8.2: Report List & Forms
- [ ] Create report list for each group
- [ ] Design report selection UI
- [ ] Create report parameter form
  - Date range pickers
  - Showroom filter
  - Section filter
  - Format selector (PDF, Excel, On-screen)
- [ ] Create mock report preview page
- [ ] Add export buttons
- [ ] Test all report groups

---

### **Stage 1.9: Administrator Module UI** (Week 5)

#### Task 1.9.1: Day-End Process Page
- [ ] Create day-end process form
- [ ] Design form with:
  - Process Date picker (default: previous day)
  - Showroom checkboxes
  - Cashier Name dropdowns
  - Cashier's Balance inputs
  - System Balance (read-only)
  - Status column
- [ ] Implement disable logic (if Cashier Balance not approved)
- [ ] Add submit button
- [ ] Test validation rules

#### Task 1.9.2: Cashier Balance Page
- [ ] Create cashier balance form
- [ ] Design form with:
  - Process Date picker (default: previous day)
  - Auto-selected showrooms (all checked)
  - **NEW:** "Showroom Is Closed" checkbox
  - Cashier Name dropdowns
  - Cashier Balance inputs
  - Status column
- [ ] Implement dependency logic:
  - Cashier Balance = Null → disable Cashier Name
  - Showroom Is Closed = TRUE → clear & disable Cashier Name and Balance
  - Already submitted → entire form disabled
- [ ] Test all business rules

#### Task 1.9.3: System Settings Page
- [ ] Create system settings list
- [ ] Design key-value table:
  - Setting Name
  - Value (editable)
  - Description
- [ ] Add 5 settings:
  - Dispos Date Change
  - Delivered Date Change
  - Block current date in Stock BF
  - Day Locking for non-admins
  - Day UnLocking for non-admins
- [ ] Implement toggle switches
- [ ] Test settings changes

#### Task 1.9.4: Label Settings Page
- [ ] Create three sections layout
- [ ] Section 1: Defined Label Printers
  - Printer list table
  - Add printer button
  - Edit printer modal
- [ ] Section 2: Set Template to Printer
  - Template-to-printer mapping table
  - Edit mapping modal
- [ ] Section 3: Defined Label Printing Comments
  - Comments list
  - Add comment button
  - Edit comment modal
- [ ] Test with mock data

#### Task 1.9.5: Delivery Plan Page
- [ ] Create delivery plan list view
- [ ] Design plan groups:
  - Thursday Friday – 5.00 am
  - Sunday – 5.00 am
  - Saturday – 5.00 am
  - Monday Tuesday Wednesday – 5.00 am
- [ ] Create "Add Delivery Plan" form
  - Date picker (future dates only, max 3 days)
  - Day type selector
  - Delivery time (auto-set 5:00 AM)
  - Showroom selection
  - Product selection grid
- [ ] Test date restrictions

#### Task 1.9.6: Security Page (Users & Roles)
- [ ] Create two-tab interface
- [ ] Tab 1: Users
  - User list table
  - Add user form modal
  - Edit user form
  - Soft delete button
- [ ] Tab 2: Roles and Capabilities
  - Role list
  - Edit role modal
  - Permissions checklist
  - Soft delete button
- [ ] Test with mock 57 users

#### Task 1.9.7: Day Lock Page
- [ ] Create calendar interface
- [ ] Design monthly calendar view
- [ ] Add prev/next month navigation
- [ ] Implement lock icon display
- [ ] Add click-to-toggle lock/unlock
- [ ] Show locked dates visually
- [ ] Test calendar functionality

#### Task 1.9.8: Approvals Page
- [ ] Create approval hub layout
- [ ] Design operation groups list with badge counters
- [ ] Create pending records expandable list
- [ ] Add Approve/Reject buttons
- [ ] Create rejection reason modal
- [ ] Test with mock pending items

#### Task 1.9.9: Showroom Employee Page
- [ ] Create employee list view
- [ ] Design table: Employee ID, Name, Showroom, Job Title, Approved, Actions
- [ ] Add pagination (10 per page)
- [ ] Create "Add Employee" form modal
  - Employee ID input
  - Name input
  - Showroom dropdown
  - Job Title input
  - Approved checkbox
  - Active checkbox
- [ ] Create "Edit Employee" form
- [ ] Test with mock 28 employees

#### Task 1.9.10: Price Manager Page
- [ ] Create price change list view
- [ ] Design table: Effected From, Effected To, Comment, User, Edit Date, Actions
- [ ] Create "Schedule Price Change" form
  - Product selector
  - Old price (read-only)
  - New price input
  - Effective from date (future)
  - Effective to date
  - Comment input
- [ ] Test with mock 2,072 records pagination

#### Task 1.9.11: WorkFlow Config Page
- [ ] Create workflow config list
- [ ] Design table: Operation Name, Approval Required (toggle)
- [ ] Add 14 operations:
  - Daily Production, DayEnd Process Balance, Delivery, Delivery Cancel, Delivery Return, Disposal, End Process, Label Printing, Production Cancel, Production BF, Stock BF, Stock Transfer, Cashier Balance, Showroom Label Printing
- [ ] Implement toggle switches
- [ ] Add pagination (10 per page)
- [ ] Test toggle functionality

---

### **Stage 1.10: Production Module UI** (Week 5-6)

#### Task 1.10.1: Daily Production Page
- [ ] Create daily production list view
- [ ] Design table: Production Date, Production No, Status, Edit User, Edit Date, Approved/Rejected By, Actions
- [ ] Add header buttons
- [ ] Create "Add Daily Production" form
  - Production date picker
  - Section selector
  - Product selection grid
  - Quantity inputs
- [ ] Implement color coding
- [ ] Test with mock 163 records

#### Task 1.10.2: Production Cancel Page
- [ ] Create production cancel list view
- [ ] Design table: Cancelled Date, Cancelled No, Status, Edit User, Edit Date, Actions
- [ ] Create "Add Production Cancel" form
  - Cancelled date picker
  - Product selection
  - Quantity inputs
- [ ] Implement color coding
- [ ] Test with mock 11 records

#### Task 1.10.3: Current Stock Page
- [ ] Create current stock view (read-only)
- [ ] Design table with columns:
  - Product
  - Open Balance
  - Today Production
  - Today Production Cancelled
  - Today Delivery
  - Delivery Cancelled
  - Delivery Returned
  - Today Balance (calculated)
- [ ] Add real-time timestamp header
- [ ] Add search functionality
- [ ] Add pagination (50 per page)
- [ ] Test with mock calculations

#### Task 1.10.4: Stock Adjustment Page
- [ ] Create stock adjustment list view
- [ ] Design table: Date, Display No, Status, Edit User, Edit Date, Actions
- [ ] Create "Add Stock Adjustment" form
  - Date picker
  - Product selection grid
  - Section selector
  - Quantity inputs
- [ ] Test with mock 35 records

#### Task 1.10.5: Stock Adjustment Approval Page
- [ ] Create approval interface
- [ ] Design pending adjustments table
- [ ] Add Approve/Reject buttons
- [ ] Show "No data available" when empty
- [ ] Test approval workflow

#### Task 1.10.6: Production Plan Page
- [ ] Create production plan list view
- [ ] Design table: Plan Date, Plan No, Status, Edit User, Edit Date, Reference, Comment, Actions
- [ ] Add header buttons
- [ ] Create "Add Production Plan" form
  - Plan date picker
  - Day type selector (Weekday/Saturday/Sunday)
  - Delivery turn selector (5:00 AM / 10:30 AM / 3:30 PM)
  - Reference input
  - Comment input
  - **NEW:** Pre-loaded Production Summary UI
  - Product-quantity grid per showroom
- [ ] Create recipe generation preview (mock)
- [ ] Create stores issue note preview (mock)
- [ ] Test with mock 16 plans

---

### **Stage 1.10A: DMS Order & Delivery Module UIs** (Week 6-7)

> These stages cover the DMS-specific core modules from the requirements document that are distinct from the general ERP operations above.

#### Task 1.10A.1: Order Entry Grid (DMS)
- [ ] Create spreadsheet-like order entry grid (AG Grid or TanStack Table with inline cell editing)
- [ ] Implement dynamic column structure:
  - Item Name column (frozen — always visible when scrolling right)
  - Product Code column (frozen — always visible)
  - Full / Mini qty columns (shown based on product variant config)
  - BAL column (available balance from freezer stock — read-only, auto-populated)
  - Extra quantity column (manually editable)
  - Total Full / Total Mini columns (auto-calculated = SUM(outlet qtys) + Extra + Immediate Orders, read-only)
  - Per-Outlet columns (dynamic — one column per active outlet, sortable)
  - Multi-Turn sub-columns for applicable items (e.g. 10:30 AM Full/Mini, 3:30 PM Full/Mini)
- [ ] Implement Tab/Enter keyboard navigation between cells
- [ ] Implement inline cell validation (no negatives; integer-only for products where `allow_decimal_quantity = false`)
- [ ] Add per-row Y/N toggle checkbox (include/exclude item from this turn's production)
- [ ] Add per-outlet column checkbox (include/exclude outlet for this turn)
- [ ] Implement color coding:
  - Y rows = white background
  - N rows = light gray background
  - Customized order rows = light yellow background
- [ ] Implement decimal/integer input mode per product configuration
- [ ] Implement virtual scrolling for performance with 80+ products × 14+ outlets
- [ ] Test with mock 80+ products × 14 outlets dataset

#### Task 1.10A.2: Delivery Plan Creation Screen (DMS)
- [ ] Create delivery plan creation form:
  - Date picker
  - Day type selector (Weekday / Saturday / Sunday / Holiday / Special Event)
  - Delivery turn selector (2–4 turns, admin-configured)
- [ ] Auto-load default outlet quantities on plan creation (based on selected day type)
- [ ] Show plan status workflow indicator: Draft → Confirmed → InProduction → Delivered
- [ ] Test that correct defaults load for Weekday vs Saturday vs Sunday selections

#### Task 1.10A.3: Delivery Summary View (DMS)
- [ ] Create dedicated Delivery Summary page (mirrors Excel Delivery Summary sheet):
  - Product list with Y/N production flag toggle per row
  - Per-outlet quantity columns (dynamic, matches active outlets)
  - Total Full, Total Mini, Grand Total columns
  - "☑ Use Freezer Stock" toggle checkbox (when ON: shows Available Balance = Grand Total – Freezer Stock)
  - Customized order sub-rows shown below the product row (visually distinct)
  - Grand total row at bottom
- [ ] Implement available balance deduction display when toggle is ON
- [ ] Ensure deduction only shown on this view and on Stores Issue Note (NOT on Production Planner)
- [ ] Test with 80+ products and 14 outlets

#### Task 1.10A.4: Immediate Orders UI (DMS)
- [ ] Create Immediate Orders list view
- [ ] Design table: Order Date, Product, Qty Full, Qty Mini, Is Customized, Status (Pending/Confirmed/Cancelled), Requested By, Actions
- [ ] Create "Add Immediate Order" form modal:
  - Product picker
  - Quantity Full input
  - Quantity Mini input
  - Is Customized checkbox
  - Customization Notes textarea
  - Link to delivery plan dropdown (optional — standalone if not linked)
- [ ] Show immediate order quantity included in Grand Total
- [ ] Flag customized orders with asterisk or distinct row style
- [ ] Test immediate order creation and total inclusion

#### Task 1.10A.5: Default Quantities Management UI (DMS)
- [ ] Create default quantities management grid:
  - Rows: Products (80+)
  - Column groups: Weekday | Saturday | Sunday | Holiday / Special Event
  - Sub-columns per group: one column per active outlet
- [ ] Implement inline editing for all quantity cells
- [ ] Add bulk save / reset functionality
- [ ] Test that defaults auto-load when creating a delivery plan of the matching day type

---

### **Stage 1.10B: DMS Production Module UIs** (Week 7-8)

#### Task 1.10B.1: Production Planner View (DMS)
- [ ] Create section-tabbed production planner layout with tabs:
  - Bakery 1 | Bakery 2 | Filling Section | Short-Eats 1 | Short-Eats 2 | Rotty Section | Plain Roll Section | Pastry Section
- [ ] Each section tab shows:
  - Header: Production Start Time and Effective Delivery Time (with "(Previous Day)" label when applicable)
  - Item list with production quantities (Full and Mini shown separately)
  - Ingredient totals grid (Ingredient qty_per_unit × Production Qty — NO extra quantities shown here)
- [ ] Implement collapsible/expandable sub-tables (▼ toggle) per section:
  - **Bakery 1/2:** Viyana Roll sub-table (Full + Mini rows), Sugar Candy Bun "Dough" sub-table, Sugar Candy Bun "Bun" sub-table, Egg Wash sub-table (Eggs × coefficient), Summary totals row (Plain Bun total, Yeast total, Sugar total, Beehive, Salt, Sesame Seeds), Beehive equivalence footnote ("SUM × 30g (Egg = Butter)")
  - **Short-Eats 1:** Pattie Dough sub-table (Flour, Beehive, Salt, Eggs), Chinese Roll Batter sub-table (Flour 12 kg base, Salt, Corn Flour, Eggs, Oil), Crumb Batter sub-table (Flour), Egg Wash for Patties sub-table, Sheet counts (Pastry Sheet / Pattie Sheet / Spring Roll Sheet)
  - **Rotty:** Chicken Rotty Egg Wrap sub-table (Flour, Salt, Eggs), Vege Oil for Rotty Dough row
  - **Plain Roll:** Prawn Bun Batter sub-table (Corn Flour, Baking Powder, Eggs, Flour)
- [ ] Add print button per section (opens print preview)
- [ ] Test with mock recipe data for all sections

#### Task 1.10B.2: Stores Issue Note View (DMS)
- [ ] Create Stores Issue Note view per section (mirrors Production Planner but with extra quantities):
  - All ingredients shown with Stores Qty = (Recipe Qty × Prod Qty) + (Extra Qty × Prod Qty)
  - If "Use Freezer Stock" is ON: show "Available Balance: [qty]" per product
  - Viyana Roll Flour Note at bottom: "Viyana Roll Flour: X g | Viyana Roll Mini Flour: Y g | Dusting Flour: Y g"
  - Sign-off section at bottom: Printed By: _____ / Issued By: _____ / Checked By: _____
  - Production Start Time and Effective Delivery Time in header
- [ ] Add PDF download button per section
- [ ] Add Excel export button per section
- [ ] Verify extra quantities are shown here but NOT on the Production Planner
- [ ] Test stores vs production output difference

#### Task 1.10B.3: Recipe Management UI (DMS)
- [ ] Create per-item recipe editor with ingredient grid:
  - Per-row: ingredient picker, quantity per unit input (decimal or int per product config), extra qty per unit input, "Stores Only" toggle, "Is Percentage" checkbox, percentage source product picker (shown when is-percentage = ON)
  - Add/remove ingredient rows
  - Drag-and-drop row reordering (updates sort_order)
- [ ] Add sub-recipe tabs for multi-recipe products (e.g. Sugar Candy Bun: "Dough" tab | "Bun" tab)
- [ ] Add template loader button (opens predefined recipe template picker, loads ingredient lines)
- [ ] Add recipe version management panel:
  - List all recipe versions with effective-from dates
  - Activate / deactivate specific versions
  - Create new version (copies current, sets new effective_from date)
- [ ] Add recipe preview (shows calculated ingredient totals for a user-entered sample quantity)
- [ ] Test sub-recipe tabs, percentage-based rows, template loading, and versioning

#### Task 1.10B.4: Predefined Recipe Templates UI (DMS)
- [ ] Create recipe templates list view
- [ ] Design table: Template Name, Description, Ingredient Count, Active, Actions
- [ ] Create "Add Template" form modal:
  - Template name input
  - Description input
  - Ingredient lines (ingredient picker + quantity per unit)
  - Add/remove ingredient rows
- [ ] Create "Edit Template" form
- [ ] Add "Apply to Product" action (applies template as base recipe, editable per product)
- [ ] Test Vegetable Curry template creation and application

#### Task 1.10B.5: Freezer Stock Management UI (DMS)
- [ ] Create Freezer Stock entry screen:
  - Product picker
  - Section picker (optional — for section-level stock)
  - Quantity input
  - Stock Date picker (default: today)
  - Notes input
- [ ] Create Freezer Stock list view with date filter
- [ ] Show last-updated date per product
- [ ] Test that freezer stock values appear in BAL column of Order Entry Grid and in Stores Issue Note

---

### **Stage 1.11: Reusable Components** (Throughout Week 1-6)

#### Task 1.11.1: Common Components
- [ ] Create reusable data table component
- [ ] Create pagination component
- [ ] Create search component
- [ ] Create date picker component (with yellow highlight support)
- [ ] Create modal/dialog component
- [ ] Create form components (inputs, selects, checkboxes, toggles)
- [ ] Create button components (with theme colors)
- [ ] Create status badge component
- [ ] Create loading spinner component
- [ ] Create toast/notification component

#### Task 1.11.2: Chart Components
- [ ] Create line chart component (recharts/visx)
- [ ] Create area chart component
- [ ] Create pie/donut chart component
- [ ] Create bar chart component
- [ ] Create grouped bar chart component
- [ ] Test all charts with mock data

#### Task 1.11.3: Form Validation
- [ ] Implement client-side validation (React Hook Form + Zod)
- [ ] Create validation schemas for all forms
- [ ] Add error message displays
- [ ] Test all form validations

---

### **Stage 1.12: Frontend Polish & Testing** (Week 6-7)

#### Task 1.12.1: Responsive Testing
- [ ] Test all pages on mobile (320px - 767px)
- [ ] Test all pages on tablet (768px - 1023px)
- [ ] Test all pages on desktop (1024px - 1920px)
- [ ] Fix any responsive issues

#### Task 1.12.2: Per-Page Color Coding System
- [ ] Implement dynamic color injection from mock settings
- [ ] Test color coding on all operation pages
- [ ] Test left-panel navigation highlight color change
- [ ] Verify table headers, buttons adapt to page color

#### Task 1.12.3: UI/UX Polish
- [ ] Add loading states to all pages
- [ ] Add empty states ("No data available")
- [ ] Add error states
- [ ] Implement smooth animations/transitions
- [ ] Test keyboard navigation
- [ ] Test accessibility (ARIA labels, screen readers)
- [ ] Verify brand theme consistency across all pages

#### Task 1.12.4: Mock Data Management
- [ ] Create centralized mock data files
- [ ] Populate all forms with realistic mock data
- [ ] Test all CRUD operations with mock data
- [ ] Verify pagination with large datasets

#### Task 1.12.5: Frontend Documentation
- [ ] Document component structure
- [ ] Document theming system
- [ ] Create style guide
- [ ] Document reusable components
- [ ] Create frontend README

---

## ✅ FRONTEND PROTOTYPE COMPLETE CHECKPOINT

**Frontend Deliverables:**
- ✅ Fully functional UI for all modules
- ✅ Mobile-responsive design (320px - 1920px)
- ✅ Brand theme applied consistently
- ✅ Per-page color coding system
- ✅ All forms with validation
- ✅ Mock data throughout
- ✅ All navigation working
- ✅ Charts and visualizations
- ✅ Reusable component library

---

## 🔧 PHASE 2: BACKEND IMPLEMENTATION

### **Stage 2.1: Backend Setup & Infrastructure** (Week 8)

#### Task 2.1.1: ASP.NET Core 8 Project Setup
- [ ] Create ASP.NET Core 8 Web API project
- [ ] Configure project structure (Controllers, Services, Repositories, Models, DTOs)
- [ ] Setup dependency injection
- [ ] Configure CORS for Next.js frontend
- [ ] Setup environment configuration (appsettings.json)
- [ ] Configure HTTPS

#### Task 2.1.2: PostgreSQL Database Setup
- [ ] Install PostgreSQL
- [ ] Create database: `donandsonsdms`
- [ ] Configure connection string
- [ ] Setup Entity Framework Core 8
- [ ] Install EF Core PostgreSQL provider
- [ ] Configure DbContext

#### Task 2.1.3: Database Schema Design
- [ ] Create all database tables as per requirements:
  - users, user_roles
  - outlets, outlet_employees
  - product_categories, units_of_measure, products, ingredients
  - product_recipes
  - delivery_turns, production_sections
  - delivery_plans, deliveries, delivery_lines
  - disposals, disposal_lines
  - stock_transfers, stock_transfer_lines
  - stock_bf, stock_bf_lines
  - delivery_cancellations, delivery_returns
  - label_printing_requests, showroom_label_prints
  - daily_productions, daily_production_lines
  - production_cancellations
  - stock_adjustments, stock_adjustment_lines
  - cashier_balances, day_end_processes
  - day_locks, system_settings
  - label_printers, label_templates, label_comments
  - price_manager, workflow_configs
  - audit_logs
  **DMS-specific tables (required by DMS requirements document):**
  - `delivery_turn_sections` — production_start_time (timestamp with tz, supports cross-midnight previous-day) + effective_delivery_time per delivery_turn per section
  - `product_sections` — product-to-section assignment with `is_primary` flag and sort_order (a product can span multiple sections, e.g. Sugar Candy Bun: dough in Bakery, bun in Filling)
  - `product_types` — Raw Material, Semi-Finished, Finished, Section
  - `predefined_recipe_templates` — named recipe templates (e.g. "Vegetable Curry Base", "Standard Fish Filling")
  - `predefined_recipe_template_lines` — ingredient lines per template (ingredient_id, quantity_per_unit, sort_order)
  - `product_recipe_template_links` — links a product to a template, with `override_recipe` flag
  - `product_recipes` — per product per section per variant (Full/Mini/Both), with `recipe_name` for named sub-recipes (e.g. "Dough", "Bun" for Sugar Candy Bun), `effective_from` date, `is_active`
  - `product_recipe_lines` — ingredient lines per recipe: `quantity_per_unit`, `extra_qty_per_unit`, `extra_qty_visible_stores_only` (bool), `is_percentage`, `percentage_source_product_id`, sort_order
  - `delivery_plans` — plan_date, plan_type (Weekday/Saturday/Sunday/Holiday/Custom), delivery_turn_id, status (Draft/Confirmed/InProduction/Delivered)
  - `delivery_plan_outlets` — outlet active/inactive flag per plan (outlet checkbox in order grid)
  - `delivery_plan_items` — item active/inactive Y/N flag per plan, extra_quantity_full, extra_quantity_mini, order_quantity_full, order_quantity_mini
  - `delivery_plan_outlet_quantities` — quantity_full + quantity_mini per product per outlet per plan (core order grid data)
  - `immediate_orders` — linked to delivery_plan or standalone, requested_by, is_customized, customization_notes, status (Pending/Confirmed/Cancelled)
  - `immediate_order_lines` — product_id, quantity_full, quantity_mini, is_customized, customization_detail
  - `freezer_stock` — product_id, section_id (nullable), quantity, stock_date, notes, created_by
  - `outlet_default_quantities` — per product per outlet per day_type (Weekday/Saturday/Sunday/Holiday/Special Event) default quantities (Full and Mini)
  - `production_logs` — audit trail of section-level production events (started, completed, etc.)
- [ ] Create EF Core Entity models
- [ ] Configure entity relationships
- [ ] Add soft delete (Active Status) to all entities
- [ ] Create initial migration
- [ ] Apply migration to database

#### Task 2.1.4: Seed Initial Data
- [ ] Create seed data for Units of Measure (G, ml, Nos)
- [ ] Create seed data for 25 Categories
- [ ] Create seed data for 30 Showrooms
- [ ] Create seed data for delivery turns
- [ ] Create seed data for production sections
- [ ] Create seed data for 127 Ingredients
- [ ] Create seed data for system settings (5 settings)
- [ ] Create seed data for admin user
- [ ] Run seeding

---

### **Stage 2.2: Authentication & Authorization** (Week 8-9)

#### Task 2.2.1: JWT Authentication
- [ ] Install JWT packages
- [ ] Configure JWT settings (secret, issuer, audience, expiration)
- [ ] Create JWT token generation service
- [ ] Create refresh token mechanism
- [ ] Implement password hashing (bcrypt)
- [ ] Create authentication middleware

#### Task 2.2.2: Auth Endpoints
- [ ] POST /api/v1/auth/login
  - Validate credentials
  - Generate JWT + refresh token
  - Return user info + tokens
- [ ] POST /api/v1/auth/logout
  - Invalidate refresh token
- [ ] POST /api/v1/auth/refresh-token
  - Validate refresh token
  - Generate new JWT
- [ ] POST /api/v1/auth/change-password
  - Validate old password
  - Hash and save new password

#### Task 2.2.3: Role-Based Access Control (RBAC)
- [ ] Create role authorization attributes
- [ ] Implement permission checking middleware
- [ ] Create role-based access policies
- [ ] Test RBAC on protected endpoints

---

### **Stage 2.3: Audit Logging Middleware** (Week 9)

#### Task 2.3.1: Audit Logging System
- [ ] Create audit log model
- [ ] Create audit logging middleware
- [ ] Capture before/after state (JSON)
- [ ] Log user ID, timestamp, action
- [ ] Make audit_logs immutable (no delete/update)
- [ ] Test audit logging on CRUD operations

---

### **Stage 2.4: Master Data APIs** (Week 9-10)

#### Task 2.4.1: Users API
- [ ] GET /api/v1/users (list all, paginated, searchable)
- [ ] POST /api/v1/users (create user)
- [ ] PUT /api/v1/users/{id} (update user)
- [ ] PATCH /api/v1/users/{id}/toggle-active (soft delete)
- [ ] Implement service layer
- [ ] Implement repository layer
- [ ] Add validation (DTOs)
- [ ] Test endpoints

#### Task 2.4.2: Roles API
- [ ] GET /api/v1/roles (list all roles)
- [ ] POST /api/v1/roles (create role)
- [ ] PUT /api/v1/roles/{id} (update role with permissions)
- [ ] PATCH /api/v1/roles/{id}/toggle-active (soft delete)
- [ ] Implement permissions_json handling
- [ ] Test endpoints

#### Task 2.4.3: Outlets API
- [ ] GET /api/v1/outlets (list all, paginated, searchable)
- [ ] POST /api/v1/outlets (create outlet)
- [ ] PUT /api/v1/outlets/{id} (update outlet)
- [ ] PATCH /api/v1/outlets/{id}/toggle-active (soft delete)
- [ ] Test endpoints

#### Task 2.4.4: Outlet Employees API
- [ ] GET /api/v1/outlet-employees (list, paginated)
- [ ] POST /api/v1/outlet-employees (create employee)
- [ ] PUT /api/v1/outlet-employees/{id} (update)
- [ ] PATCH /api/v1/outlet-employees/{id}/toggle-active
- [ ] Test endpoints

#### Task 2.4.5: Categories API
- [ ] GET /api/v1/categories (list all, paginated, searchable)
- [ ] POST /api/v1/categories (create category)
- [ ] PUT /api/v1/categories/{id} (update)
- [ ] PATCH /api/v1/categories/{id}/toggle-active
- [ ] Test endpoints

#### Task 2.4.6: UOM API
- [ ] GET /api/v1/uom (list all)
- [ ] POST /api/v1/uom (create UOM)
- [ ] PUT /api/v1/uom/{id} (update)
- [ ] Test endpoints

#### Task 2.4.7: Products API
- [ ] GET /api/v1/products (list all 470+, paginated, searchable, filterable)
- [ ] POST /api/v1/products (create product)
- [ ] PUT /api/v1/products/{id} (update product)
- [ ] PATCH /api/v1/products/{id}/toggle-active
- [ ] Implement product validation logic
- [ ] Test endpoints with large dataset

#### Task 2.4.8: Ingredients API
- [ ] GET /api/v1/ingredients (list 127, paginated, searchable)
- [ ] POST /api/v1/ingredients (create ingredient)
- [ ] PUT /api/v1/ingredients/{id} (update)
- [ ] PATCH /api/v1/ingredients/{id}/toggle-active
- [ ] Test endpoints

#### Task 2.4.9: Production Sections API
- [ ] GET /api/v1/production-sections (list all)
- [ ] POST /api/v1/production-sections (create)
- [ ] PUT /api/v1/production-sections/{id} (update)
- [ ] Test endpoints

#### Task 2.4.10: Delivery Turns API
- [ ] GET /api/v1/delivery-turns (list all)
- [ ] POST /api/v1/delivery-turns (create)
- [ ] PUT /api/v1/delivery-turns/{id} (update)
- [ ] Test endpoints

---

### **Stage 2.5: Recipe & Inventory APIs** (Week 10-11)

#### Task 2.5.1: Product Recipes API
- [ ] GET /api/v1/recipes?product_id={id} (get recipes for product)
- [ ] POST /api/v1/recipes (create recipe line)
- [ ] PUT /api/v1/recipes/{id} (update recipe line)
- [ ] PATCH /api/v1/recipes/{id}/deactivate
- [ ] Implement recipe versioning (effective_from)
- [ ] Test recipe calculations

#### Task 2.5.2: Recipe Calculation Engine
- [ ] Create service for recipe calculations
- [ ] Implement: Per-Item Quantity × Production Quantity = Total
- [ ] Implement stores extra/waste allowance calculation
- [ ] Test calculation accuracy

---

### **Stage 2.5A: DMS Calculation Engine & Core APIs** (Week 12-14)

> This stage implements all DMS-specific business logic, calculation rules, and APIs that are central to replacing the Excel workbook.

#### Task 2.5A.1: Enhanced Recipe API (DMS)
- [ ] GET /api/v1/recipes?productId={id} — list all recipes including named sub-recipes and versions
- [ ] POST /api/v1/recipes — create recipe (supports `recipe_name` for sub-recipes like "Dough" / "Bun", `variant` Full/Mini/Both, `section_id`, `effective_from`)
- [ ] PUT /api/v1/recipes/{id} — update recipe header
- [ ] PATCH /api/v1/recipes/{id}/activate — activate recipe version for production use
- [ ] PATCH /api/v1/recipes/{id}/deactivate — deactivate recipe version
- [ ] GET /api/v1/recipes/{id}/lines — get all lines for a recipe
- [ ] POST /api/v1/recipes/{id}/lines — add recipe line (ingredient_id, qty_per_unit, extra_qty_per_unit, extra_qty_visible_stores_only, is_percentage, percentage_source_product_id, sort_order)
- [ ] PUT /api/v1/recipes/{id}/lines/{lineId} — update recipe line
- [ ] DELETE /api/v1/recipes/{id}/lines/{lineId} — remove recipe line
- [ ] Implement Sugar Candy Bun dual sub-recipe: two `product_recipes` records under same product (`recipe_name = "Dough"` and `recipe_name = "Bun"`)
- [ ] Implement percentage-based ingredient: `qty = (percentage / 100) × source_product_total_qty`
- [ ] Implement `extra_qty_visible_stores_only` enforcement (extra qty excluded from production planner response)
- [ ] Implement recipe versioning: only the active version with matching `effective_from ≤ plan_date` is used for calculations
- [ ] Unit test Sugar Candy Bun, Viyana Roll, percentage-based, and stores-only extra qty

#### Task 2.5A.2: Recipe Templates API (DMS)
- [ ] GET /api/v1/recipe-templates — list all templates with their lines
- [ ] POST /api/v1/recipe-templates — create template with ingredient lines
- [ ] PUT /api/v1/recipe-templates/{id} — update template
- [ ] PATCH /api/v1/recipe-templates/{id}/toggle-active
- [ ] POST /api/v1/recipe-templates/{id}/apply?productId=&sectionId= — apply template to a product (creates a new recipe copying template lines; product can then override)
- [ ] Implement Vegetable Curry template as seed data
- [ ] Test template application and recipe override

#### Task 2.5A.3: Delivery Plan & Order Grid APIs (DMS)
- [ ] GET /api/v1/delivery-plans?date=&turnId= — list plans for date/turn
- [ ] POST /api/v1/delivery-plans — create plan; auto-load `outlet_default_quantities` for selected day type into `delivery_plan_outlet_quantities`
- [ ] PUT /api/v1/delivery-plans/{id}/confirm — confirm plan; lock quantities
- [ ] GET /api/v1/delivery-plans/{id}/order-grid — return full order grid matrix (products × outlets) with: qty_full, qty_mini per outlet; extra_qty; order_qty from immediate orders; BAL from freezer_stock; total_full; total_mini; Y/N flag; multi-turn sub-columns for applicable products
- [ ] PUT /api/v1/delivery-plans/{id}/outlet-quantities — bulk save grid (array of product_id + outlet_id + qty_full + qty_mini)
- [ ] PUT /api/v1/delivery-plans/{id}/items/{productId}/toggle — toggle Y/N active flag
- [ ] PUT /api/v1/delivery-plans/{id}/outlets/{outletId}/toggle — toggle outlet active flag
- [ ] Implement multi-turn item filtering: products only appear in turns configured by admin
- [ ] Test with 80+ products × 14 outlets; verify default loading and toggle behavior

#### Task 2.5A.4: Default Quantities API (DMS)
- [ ] GET /api/v1/default-quantities?dayType=&productId= — get defaults per product per outlet per day type
- [ ] PUT /api/v1/default-quantities — bulk upsert defaults (array of product_id + outlet_id + day_type + qty_full + qty_mini)
- [ ] Day types supported: Weekday, Saturday, Sunday, Holiday, Special Event
- [ ] Auto-load on delivery plan creation based on plan date's resolved day type
- [ ] Test default loading correctness for all day types

#### Task 2.5A.5: Immediate Orders API (DMS)
- [ ] GET /api/v1/immediate-orders?deliveryPlanId= — list orders linked to a plan
- [ ] POST /api/v1/immediate-orders — create immediate order with lines (product_id, qty_full, qty_mini, is_customized, customization_notes, delivery_plan_id)
- [ ] PUT /api/v1/immediate-orders/{id} — update order
- [ ] DELETE /api/v1/immediate-orders/{id} — cancel order (soft delete, status = Cancelled)
- [ ] GET /api/v1/immediate-orders/summary?date=&turnId= — summary grouped by status (Pending/Confirmed/Cancelled)
- [ ] Business rule: immediate order quantities ALWAYS included in Grand Total for production (order_quantity_full/mini in delivery_plan_items)
- [ ] Business rule: customized orders included in total but flagged separately in all views
- [ ] Test inclusion of immediate orders in production planner totals

#### Task 2.5A.6: Freezer Stock API (DMS)
- [ ] GET /api/v1/freezer-stock?date= — get current freezer stock per product (used for BAL column in order grid)
- [ ] POST /api/v1/freezer-stock — create stock entry (product_id, section_id, quantity, stock_date, notes)
- [ ] PUT /api/v1/freezer-stock/{id} — update entry
- [ ] Test that freezer stock values feed into BAL column and Stores Issue Note deduction

#### Task 2.5A.7: Delivery Summary Calculation API (DMS)
- [ ] GET /api/v1/delivery-plans/{id}/delivery-summary — return full delivery summary
- [ ] Implement calculations:
  - `Total Full = SUM(outlet qty_full) + extra_quantity_full + SUM(immediate_order qty_full)`
  - `Total Mini = SUM(outlet qty_mini) + extra_quantity_mini + SUM(immediate_order qty_mini)`
  - `Grand Total = Total Full + Total Mini`
  - `Available Qty (if useBalance=true) = Grand Total – freezer_stock.quantity` (per product)
- [ ] Include Y/N production flag per product
- [ ] Include customized order sub-rows below each product row
- [ ] Include outlet inactive flag (outlet OFF → zeroed/excluded in summary)
- [ ] Ensure Available Balance deduction only appears in this view and Stores Issue Note (NOT in Production Planner)
- [ ] Test against expected Excel Delivery Summary sheet output

#### Task 2.5A.8: Production Planner Calculation API (DMS)
- [ ] GET /api/v1/delivery-plans/{id}/production-planner?sectionId= — return production planner for a section
- [ ] For each active product assigned to this section with Y flag ON:
  - For each active recipe line: `ingredient_total = qty_per_unit × production_qty`
  - Extra qty NOT included (extra_qty_visible_stores_only enforced)
- [ ] Implement named sub-table grouping: group lines by `recipe_name` (e.g. "Dough" and "Bun" for Sugar Candy Bun appear as two separate sub-tables)
- [ ] Implement Viyana Roll and Viyana Roll Mini as separate product rows with own recipes
- [ ] Implement Egg-to-Beehive equivalence footnote: `beehive_g_total / 30` displayed as metadata field in response
- [ ] Implement production start time with cross-midnight support: return full timestamp from `delivery_turn_sections`; flag as `is_previous_day = true` when applicable
- [ ] Implement per-section sub-table calculations:
  - **Bakery:** Egg Wash = eggs × coefficient; summary totals (Plain Bun total, Yeast, Sugar, Beehive, Salt, Sesame Seeds)
  - **Short-Eats 1:** Pattie Dough (Flour, Beehive, Salt, Eggs based on pattie qty); Chinese Roll Batter (Flour 12 kg base, Salt, Corn Flour, Eggs, Oil based on roll qty); Crumb Batter; Egg Wash for Patties; sheet counts
  - **Rotty:** Rotty Dough (Flour, Salt, Sugar, Eggs); Chicken Rotty Egg Wrap sub-table
  - **Plain Roll:** Prawn Bun Batter (Corn Flour, Baking Powder, Eggs, Flour)
- [ ] Implement rounding engine: if `product.rounding_value` is set, round production qty up to nearest N before recipe calculation
- [ ] Implement item checkbox OFF: skip product from all calculations; return zero in delivery note
- [ ] Implement outlet checkbox OFF: zero that outlet's quantities
- [ ] Unit test every section calculation formula against the source Excel sheet values

#### Task 2.5A.9: Stores Issue Note Calculation API (DMS)
- [ ] GET /api/v1/delivery-plans/{id}/stores-issue-note?sectionId=&useBalance=true
- [ ] For each active product in section:
  - `Stores Qty = (qty_per_unit × production_qty) + (extra_qty_per_unit × production_qty)`
  - If `useBalance=true`: `Stores Available Qty = Stores Qty – freezer_stock.quantity`
- [ ] Include Viyana Roll Flour Note in response metadata: `{ viyanaRollFlour: Xg, viyanaRollMiniFlour: Yg, dustingFlour: Zg }`
- [ ] Include sign-off metadata fields: `{ printedBy: "", issuedBy: "", checkedBy: "" }`
- [ ] Confirm extra quantities are present here but absent from production planner response
- [ ] Test stores vs production output difference with same plan data

#### Task 2.5A.10: Delivery Note per Outlet API (DMS)
- [ ] GET /api/v1/delivery-plans/{id}/delivery-note?outletId= — single-outlet delivery note
- [ ] Return: outlet name, date, delivery turn, product code, product name, qty_full, qty_mini, total_qty
- [ ] Implement product grouping by category
- [ ] Include Total Items count and Total Qty footer
- [ ] Return zero qty for Y=N items (item excluded from production — still shows on note as 0)
- [ ] Exclude rows where outlet is marked inactive for this plan
- [ ] Test for all 14 outlets

#### Task 2.5A.11: DMS Business Rules Service (Centralized)
- [ ] Create `DmsCalculationService` implementing all business rules:
  - Quantity Calculation: `Total = SUM(outlet qtys) + Extra + ImmediateOrder` per Full and Mini
  - Grand Total = Total Full + Total Mini
  - Stores Available: `Grand Total – Freezer Stock` (stores only, never on production planner)
  - Rounding: `Math.Ceiling(qty / rounding_value) × rounding_value` when `rounding_value` is set
  - Decimal enforcement: truncate to integer when `allow_decimal_quantity = false`
  - Item OFF: recipe qty = 0, delivery note qty = 0
  - Outlet OFF: outlet quantities = 0/excluded in delivery note
  - Multi-turn filtering: only return products whose turn config includes the requested turn
  - Customized orders: always included in totals; flagged in response with `is_customized = true`
  - Beehive equivalence: `beehive_total_g / 30` as additional computed field
  - Sugar Candy Bun: two separate recipe result objects (Dough + Bun) in planner response
  - Percentage-based ingredient: `ingredient_qty = (percentage / 100) × source_product_total_qty`
- [ ] Create unit tests for every rule above against Excel-derived expected values
- [ ] Achieve 100% coverage on calculation service

---

### **Stage 2.6: Operations Module APIs** (Week 11-13)

#### Task 2.6.1: Deliveries API
- [ ] GET /api/v1/deliveries (list, paginated, filtered by role/date)
- [ ] POST /api/v1/deliveries (create delivery with lines)
- [ ] PUT /api/v1/deliveries/{id} (update delivery)
- [ ] PATCH /api/v1/deliveries/{id}/approve (approve)
- [ ] PATCH /api/v1/deliveries/{id}/reject (reject)
- [ ] Implement access & date rules:
  - Admin: all records, any date
  - Regular user: own records, today/future only
- [ ] Generate delivery number (DEL00XXXXXX)
- [ ] Implement delivery value calculation
- [ ] Test all rules

#### Task 2.6.2: Disposals API
- [ ] GET /api/v1/disposals (list, filtered by role)
- [ ] POST /api/v1/disposals (create disposal with lines)
- [ ] PATCH /api/v1/disposals/{id}/approve
- [ ] PATCH /api/v1/disposals/{id}/reject
- [ ] Implement access rules:
  - Admin: all records
  - Regular user: own records, today only
- [ ] Generate disposal number (DIS00XXXXXX)
- [ ] Test rules

#### Task 2.6.3: Transfers API
- [ ] GET /api/v1/transfers (list, filtered)
- [ ] POST /api/v1/transfers (create transfer with lines)
- [ ] PATCH /api/v1/transfers/{id}/approve
- [ ] PATCH /api/v1/transfers/{id}/reject
- [ ] Implement access rules:
  - Regular user: no future, back-date up to 3 days
- [ ] Generate transfer number (TRN00XXXXXX)
- [ ] Test rules

#### Task 2.6.4: Stock BF API
- [ ] GET /api/v1/stock-bf (list, filtered)
- [ ] POST /api/v1/stock-bf (create stock BF with lines)
- [ ] PATCH /api/v1/stock-bf/{id}/approve
- [ ] PATCH /api/v1/stock-bf/{id}/reject
- [ ] Implement access rules (back-date up to 3 days)
- [ ] Generate display number (SBF00XXXXXX)
- [ ] Test rules

#### Task 2.6.5: Cancellations API
- [ ] GET /api/v1/cancellations (list, filtered)
- [ ] POST /api/v1/cancellations (create cancellation)
- [ ] PATCH /api/v1/cancellations/{id}/approve
- [ ] PATCH /api/v1/cancellations/{id}/reject
- [ ] Implement access rules (back-date up to 3 days)
- [ ] Generate cancellation number (DCN00XXXXXX)
- [ ] Test rules

#### Task 2.6.6: Delivery Returns API
- [ ] GET /api/v1/delivery-returns (list, filtered)
- [ ] POST /api/v1/delivery-returns (create return)
- [ ] PATCH /api/v1/delivery-returns/{id}/approve
- [ ] PATCH /api/v1/delivery-returns/{id}/reject
- [ ] Implement access rules (back-date up to 3 days)
- [ ] Generate return number (RET00XXXXXX)
- [ ] Test rules

#### Task 2.6.7: Label Printing API
- [ ] GET /api/v1/label-printing (list, filtered)
- [ ] POST /api/v1/label-printing (create label request)
- [ ] PATCH /api/v1/label-printing/{id}/approve
- [ ] PATCH /api/v1/label-printing/{id}/reject
- [ ] Implement date rules (yellow box logic)
- [ ] Filter products by Enable Label Print = TRUE
- [ ] Generate display number (LBL00XXXXXX)
- [ ] Test rules

#### Task 2.6.8: Showroom Open Stock API
- [ ] GET /api/v1/showroom-open-stock (list all showrooms with last Stock BF date)
- [ ] PUT /api/v1/showroom-open-stock/{outlet_id} (edit Stock As At date)
- [ ] Test date rollover logic

#### Task 2.6.9: Showroom Label Printing API
- [ ] POST /api/v1/showroom-labels (create label print request)
- [ ] GET /api/v1/showroom-labels (list requests)
- [ ] Test label generation

---

### **Stage 2.7: Production Module APIs** (Week 13-14)

#### Task 2.7.1: Daily Productions API
- [ ] GET /api/v1/productions (list, filtered by role)
- [ ] POST /api/v1/productions (create production with lines)
- [ ] PATCH /api/v1/productions/{id}/approve
- [ ] PATCH /api/v1/productions/{id}/reject
- [ ] Implement access rules:
  - Admin: all records
  - Regular user: own records, today only
- [ ] Generate production number (PRO00XXXXXX)
- [ ] Test rules

#### Task 2.7.2: Production Cancellations API
- [ ] GET /api/v1/production-cancels (list, filtered)
- [ ] POST /api/v1/production-cancels (create cancel)
- [ ] PATCH /api/v1/production-cancels/{id}/approve
- [ ] PATCH /api/v1/production-cancels/{id}/reject
- [ ] Generate cancelled number (PRC00XXXXXX)
- [ ] Test rules

#### Task 2.7.3: Current Stock API
- [ ] GET /api/v1/current-stock (calculate real-time stock)
- [ ] Implement calculation formula:
  - Open Balance + Today Production - Today Production Cancelled - Today Delivery + Delivery Cancelled + Delivery Returned
- [ ] Test calculation accuracy
- [ ] Optimize query performance

#### Task 2.7.4: Stock Adjustments API
- [ ] GET /api/v1/stock-adjustments (list, filtered)
- [ ] POST /api/v1/stock-adjustments (create adjustment with lines)
- [ ] PATCH /api/v1/stock-adjustments/{id}/approve
- [ ] PATCH /api/v1/stock-adjustments/{id}/reject
- [ ] Generate display number (PSA00XXXXXX)
- [ ] Test approval workflow

#### Task 2.7.5: Production Plans API
- [ ] GET /api/v1/production-plans (list, filtered)
- [ ] POST /api/v1/production-plans (create plan with pre-loaded summaries)
- [ ] PUT /api/v1/production-plans/{id} (update plan)
- [ ] GET /api/v1/production-plans/{id}/recipe?section_id={id} (generate recipe sheet)
- [ ] Implement recipe generation logic
- [ ] Implement stores issue note generation
- [ ] Generate plan number (PPL00XXXXXX)
- [ ] Test complex calculations

---

### **Stage 2.8: Administrator Module APIs** (Week 14-15)

#### Task 2.8.1: Day-End Process API
- [ ] GET /api/v1/day-end?date={date} (get day-end data for date)
- [ ] POST /api/v1/day-end (submit day-end process)
- [ ] PATCH /api/v1/day-end/{id}/approve
- [ ] PATCH /api/v1/day-end/{id}/reject
- [ ] Implement business rules:
  - Default date = previous day
  - Block if Cashier Balance not approved
  - Block if day is locked
- [ ] Link cashier declarations
- [ ] Calculate system balance
- [ ] Test all dependencies

#### Task 2.8.2: Cashier Balance API
- [ ] GET /api/v1/cashier-balance?date={date} (get cashier balance for date)
- [ ] POST /api/v1/cashier-balance (submit cashier balance)
- [ ] PATCH /api/v1/cashier-balance/{id}/approve
- [ ] PATCH /api/v1/cashier-balance/{id}/reject
- [ ] Implement business rules:
  - Default date = previous day
  - Once submitted → fully locked (read-only)
  - Auto-select all showrooms
  - **NEW:** "Showroom Is Closed" logic
  - Cashier Balance = Null → disable Cashier Name
  - Showroom Is Closed = TRUE → clear & disable fields
- [ ] Send closure record to approvals queue
- [ ] Test all validation rules

#### Task 2.8.3: System Settings API
- [ ] GET /api/v1/settings (get all settings)
- [ ] PUT /api/v1/settings (bulk update settings)
- [ ] Test settings retrieval and update

#### Task 2.8.4: Label Settings APIs
- [ ] Printers:
  - GET /api/v1/label-printers
  - POST /api/v1/label-printers
  - PUT /api/v1/label-printers/{id}
- [ ] Templates:
  - GET /api/v1/label-templates
  - POST /api/v1/label-templates
  - PUT /api/v1/label-templates/{id}
- [ ] Comments:
  - GET /api/v1/label-comments
  - POST /api/v1/label-comments
  - PUT /api/v1/label-comments/{id}
- [ ] Test all label settings

#### Task 2.8.5: Delivery Plan API
- [ ] GET /api/v1/delivery-plans (list plans)
- [ ] POST /api/v1/delivery-plans (create plan)
- [ ] PUT /api/v1/delivery-plans/{id} (update plan)
- [ ] POST /api/v1/delivery-plans/{id}/confirm (confirm plan → create delivery records)
- [ ] Implement business rules:
  - Future dates only (max 3 days)
  - Auto-set delivery time to 5:00 AM
  - Create pending records in deliveries table
- [ ] Test plan confirmation workflow

#### Task 2.8.6: Day Lock API
- [ ] GET /api/v1/day-lock?month={m}&year={y} (get locked dates for month)
- [ ] POST /api/v1/day-lock (lock a date)
- [ ] DELETE /api/v1/day-lock/{date} (unlock a date)
- [ ] Implement hard lock enforcement middleware
  - Block ALL operations for locked dates
- [ ] Check System Settings for non-admin lock/unlock permissions
- [ ] Test lock enforcement on all operation endpoints

#### Task 2.8.7: Approvals API
- [ ] GET /api/v1/approvals (get pending approvals by operation)
- [ ] POST /api/v1/approvals/{id}/approve (approve record)
- [ ] POST /api/v1/approvals/{id}/reject (reject record with reason)
- [ ] Implement approval workflow logic
- [ ] Test approvals for all 14 operations

#### Task 2.8.8: Price Manager API
- [ ] GET /api/v1/price-manager (list price changes, paginated)
- [ ] POST /api/v1/price-manager (schedule price change)
- [ ] PUT /api/v1/price-manager/{id} (update scheduled change)
- [ ] Implement automatic price activation on effective date
- [ ] Log all changes to audit trail
- [ ] Test scheduling and activation

#### Task 2.8.9: WorkFlow Config API
- [ ] GET /api/v1/workflow-configs (list all 14 operations)
- [ ] PUT /api/v1/workflow-configs/{id} (toggle approval required)
- [ ] Test workflow config changes propagation

---

### **Stage 2.9: Reports Module APIs** (Week 15-16)

#### Task 2.9.1: Dashboard Reports API
- [ ] GET /api/v1/dashboard/sales-trend (last 7 days)
- [ ] GET /api/v1/dashboard/disposal-by-section (yesterday)
- [ ] GET /api/v1/dashboard/top-deliveries (today)
- [ ] GET /api/v1/dashboard/delivery-vs-disposal (7 days)
- [ ] Implement chart data aggregation
- [ ] Test data accuracy

#### Task 2.9.2: Reports API
- [ ] GET /api/v1/reports/{report_name}?from=&to=&outlet_id=&section_id=&format=
- [ ] Implement date restriction rules:
  - Reports blocked BEFORE last Day-End Process date
  - Reports allowed from last Day-End to current date
- [ ] Implement 6 report groups:
  - General (Opening Balance, Service Charges, Unloading Plan)
  - Cashier (Cashier Balance Report, Daily Cashier Reconciliation)
  - Sales (Daily Sales Summary, Weekly Sales Trend, Product-wise Sales, Showroom-wise Sales)
  - Delivery (Delivery Note, Delivery Summary, Delivery vs Disposal)
  - Disposal (Daily Disposal by Showroom, Disposal by Category, Disposal Trend)
  - Production (Daily Production Planner, Stores Issue Note, Production Summary, Recipe Card, Ingredient Requirements)
- [ ] Implement output formats:
  - JSON (for on-screen view)
  - PDF (server-side generation)
  - Excel (server-side generation)
- [ ] Test all reports with real data

#### Task 2.9.5: DMS-Specific Reports API
- [ ] **Delivery Note per Outlet** — GET /api/v1/reports/delivery-note/{planId}/{outletId}?format=pdf|excel
  - Columns: Item, Code, Full, Mini, Total
  - Grouped by product category
  - Footer: Total Items count, Total Qty
  - Header: Company Name, Outlet Name, Date, Turn
  - One report per outlet per turn
- [ ] **Delivery Summary Report** — GET /api/v1/reports/delivery-summary/{planId}?format=pdf|excel
  - All outlets in columns; products in rows
  - Per-item Y/N production flag column
  - Total Full, Total Mini, Grand Total columns
  - Available Balance vs Required (if freezer stock used)
- [ ] **Production Planner Report (per section)** — GET /api/v1/reports/production-planner/{planId}/{sectionId}?format=pdf
  - Exact print layout per requirements doc §7.1:
    - Header row: Company Name | Production Starting Time: [date] [time]
    - Second row: Section Name | Effective Delivery Time: [date] [time]
    - Item grid with quantities and ingredient totals
    - Sub-tables (Pattie Dough, Egg Wash, Chinese Roll Batter, etc.) as applicable
    - Footer: Printed By: _____ | Issued By: _____ | Checked By: _____
  - Extra quantities NOT shown
- [ ] **Stores Issue Note Report (per section)** — GET /api/v1/reports/stores-issue-note/{planId}/{sectionId}?useBalance=true&format=pdf
  - Same structure as Production Planner but includes extra/waste quantities
  - Shows "Available Balance: [qty]" per product if useBalance=true
  - Viyana Roll Flour Note at bottom
  - Sign-off section (Printed By / Issued By / Checked By)
- [ ] **Immediate Orders Summary** — GET /api/v1/reports/immediate-orders/{planId}?format=pdf
  - Company Name, Date, Turn header
  - Table of all immediate orders: Product, Qty Full, Qty Mini, Requested By, Status, Customization Details
  - Customized orders flagged separately (asterisk / highlighted row)
- [ ] **Dashboard / Pivot Report** — GET /api/v1/reports/dashboard?date=&turnId=
  - Pivot: Product × Turn × Outlet summary (quantity grid)
  - Total quantities per product across all turns
  - Average quantities per product
  - Item count by category
  - Active outlet count
  - Filter by day type (Weekday/Saturday/Sunday)
- [ ] **Recipe Reports**
  - GET /api/v1/reports/recipe-card/{productId}?format=pdf — per-item recipe card (ingredient + qty per unit)
  - GET /api/v1/reports/ingredient-requirements/{planId}/{sectionId}?format=pdf — aggregated ingredient requirements by section
  - GET /api/v1/reports/ingredient-procurement/{date}?format=pdf — ingredient procurement totals across all turns for a day
- [ ] **Label Printing (DMS Product Labels)** — POST /api/v1/label-printing/product-labels
  - Template-based product labels (admin defines label template per product)
  - Egg Sandwich label and similar item labels
  - Supports printing to configured label printers
- [ ] Verify all DMS report PDFs match existing Excel print layouts (margins, font sizes, column widths, signature line positions)

#### Task 2.9.3: PDF Export Service
- [ ] Install PDF library (iTextSharp/QuestPDF)
- [ ] Create PDF templates for all reports
- [ ] Match existing Excel print layouts
- [ ] Test PDF generation

#### Task 2.9.4: Excel Export Service
- [ ] Install Excel library (EPPlus/ClosedXML)
- [ ] Create Excel templates for all reports
- [ ] Test Excel generation

---

### **Stage 2.10: Advanced Features** (Week 16-17)

#### Task 2.10.1: Access Control Middleware
- [ ] Create centralized access control service
- [ ] Implement per-module, per-role date rules
- [ ] Create access rule unit tests
- [ ] Test all access scenarios

#### Task 2.10.2: Date Validation Service
- [ ] Create date validation service
- [ ] Implement all date rules per module
- [ ] Test back-date, today, future date restrictions

#### Task 2.10.3: Number Generation Service
- [ ] Create auto-incrementing number generator
- [ ] Implement formats:
  - DEL00XXXXXX, DIS00XXXXXX, TRN00XXXXXX, SBF00XXXXXX, DCN00XXXXXX, RET00XXXXXX, LBL00XXXXXX, PRO00XXXXXX, PRC00XXXXXX, PSA00XXXXXX, PPL00XXXXXX
- [ ] Test number uniqueness and sequence

#### Task 2.10.4: Audit Logs API
- [ ] GET /api/v1/audit-logs?table=&record_id=&from=&to=
- [ ] Implement audit log retrieval
- [ ] Test audit trail completeness

---

### **Stage 2.11: Integration & Testing** (Week 17-18)

#### Task 2.11.1: Frontend-Backend Integration
- [ ] Replace all mock API calls with real endpoints
- [ ] Implement API client service (Axios/Fetch)
- [ ] Handle API errors and display user-friendly messages
- [ ] Implement loading states
- [ ] Test all CRUD operations end-to-end

#### Task 2.11.2: Authentication Integration
- [ ] Implement JWT storage (httpOnly cookies/localStorage)
- [ ] Implement refresh token mechanism
- [ ] Implement auto-logout on token expiration
- [ ] Implement protected routes
- [ ] Test authentication flow

#### Task 2.11.3: Access Control Integration
- [ ] Implement role-based UI visibility
- [ ] Hide/disable features based on user role
- [ ] Test all role-based access scenarios
- [ ] Test date restriction enforcement

#### Task 2.11.4: Real-time Features
- [ ] Install SignalR (server + client)
- [ ] Implement real-time notifications
- [ ] Implement live dashboard updates
- [ ] Test real-time functionality

#### Task 2.11.5: API Testing
- [ ] Write unit tests for all services
- [ ] Write integration tests for all endpoints
- [ ] Test error handling
- [ ] Test validation
- [ ] Test business rules
- [ ] Achieve >80% code coverage

#### Task 2.11.6: End-to-End Testing
- [ ] Test complete workflows:
  - User login → Create delivery → Approve → View report
  - Create production plan → Generate recipe → Daily production → Current stock
  - Cashier balance → Day-End process
  - Product creation → Recipe creation → Production planning
- [ ] Test concurrent user scenarios
- [ ] Test data consistency

---

### **Stage 2.12: Performance & Optimization** (Week 18-19)

#### Task 2.12.1: Database Optimization
- [ ] Add indexes on frequently queried columns
- [ ] Optimize complex queries
- [ ] Implement pagination on large datasets
- [ ] Test query performance (< 2 seconds)

#### Task 2.12.2: Caching (Phase 6 - Optional)
- [ ] Install Redis
- [ ] Implement caching for master data (products, categories, outlets)
- [ ] Implement cache invalidation
- [ ] Test cache performance

#### Task 2.12.3: API Performance
- [ ] Implement response compression
- [ ] Optimize payload sizes
- [ ] Test API response times (< 2 seconds)
- [ ] Implement rate limiting

#### Task 2.12.4: Frontend Performance
- [ ] Implement code splitting
- [ ] Optimize bundle size
- [ ] Implement lazy loading
- [ ] Optimize images
- [ ] Test load times

---

### **Stage 2.13: Scheduled Jobs** (Week 19)

#### Task 2.13.1: Hangfire Setup
- [ ] Install Hangfire
- [ ] Configure Hangfire dashboard
- [ ] Test Hangfire jobs

#### Task 2.13.2: Scheduled Jobs
- [ ] Create job: Auto-generate next day plan at midnight
- [ ] Create job: Daily database backup
- [ ] Create job: Auto-activate scheduled price changes
- [ ] Test all scheduled jobs

---

### **Stage 2.14: Security Hardening** (Week 19-20)

#### Task 2.14.1: Security Implementation
- [ ] Enforce HTTPS only
- [ ] Implement CORS properly
- [ ] Implement SQL injection prevention (parameterized queries)
- [ ] Implement XSS prevention
- [ ] Implement CSRF protection
- [ ] Test security vulnerabilities

#### Task 2.14.2: Password Security
- [ ] Implement bcrypt password hashing
- [ ] Implement password strength validation
- [ ] Implement password change on first login
- [ ] Test password security

---

### **Stage 2.15: Data Migration** (Week 20)

#### Task 2.15.1: Migration Tool
- [ ] Create Excel import tool
- [ ] Import 470+ products
- [ ] Import 127 ingredients
- [ ] Import 30 showrooms
- [ ] Import 25 categories
- [ ] Import historical transactions (optional)
- [ ] Generate validation report
- [ ] Compare migrated data with source

---

### **Stage 2.16: Documentation** (Week 20-21)

#### Task 2.16.1: Technical Documentation
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Database schema documentation
- [ ] Architecture documentation
- [ ] Deployment guide
- [ ] Backend README

#### Task 2.16.2: User Documentation
- [ ] User manual for each module
- [ ] Admin guide
- [ ] Cashier guide
- [ ] Production staff guide
- [ ] Video tutorials (optional)

---

### **Stage 2.17: User Acceptance Testing (UAT)** (Week 21-22)

#### Task 2.17.1: UAT Preparation
- [ ] Setup UAT environment
- [ ] Create test scenarios for all modules
- [ ] Prepare test data
- [ ] Train UAT users

#### Task 2.17.2: UAT Execution
- [ ] Test all modules with actual users
- [ ] Collect feedback
- [ ] Compare calculations with live Excel data
- [ ] Test print outputs (PDF matching Excel layouts)
- [ ] Document issues

#### Task 2.17.3: UAT Fixes
- [ ] Fix all critical issues
- [ ] Fix all high-priority issues
- [ ] Re-test fixed issues
- [ ] Get UAT sign-off

---

### **Stage 2.18: Deployment** (Week 22-23)

#### Task 2.18.1: Production Environment Setup
- [ ] Setup production server
- [ ] Install PostgreSQL production instance
- [ ] Configure production database
- [ ] Setup Redis (if using)
- [ ] Configure SSL/HTTPS
- [ ] Setup backup strategy

#### Task 2.18.2: Application Deployment
- [ ] Build frontend for production
- [ ] Deploy frontend (Vercel/Netlify/VPS)
- [ ] Build backend for production
- [ ] Deploy backend (IIS/Linux server)
- [ ] Configure environment variables
- [ ] Test production deployment

#### Task 2.18.3: Monitoring & Logging
- [ ] Setup application logging
- [ ] Setup error tracking (Sentry/AppInsights)
- [ ] Setup performance monitoring
- [ ] Setup database monitoring
- [ ] Create monitoring dashboard

#### Task 2.18.4: Go-Live
- [ ] Final data migration
- [ ] Switch DNS/routes to production
- [ ] Monitor system closely for first 24 hours
- [ ] Provide on-site support for first week

---

### **Stage 2.19: Post-Launch Support** (Week 23-26)

#### Task 2.19.1: Support & Maintenance
- [ ] Monitor system performance
- [ ] Fix post-launch bugs
- [ ] Provide user support
- [ ] Collect enhancement requests
- [ ] Plan future iterations

---

---

## 📐 DMS BUSINESS RULES REFERENCE

> This section is the authoritative reference for all calculation rules that must be faithfully replicated from the Excel workbook. Every rule must be unit-tested against live Excel data before UAT sign-off.

### BR-01: Quantity Calculation Flow
```
Outlet Quantities (per outlet, per product, Full and Mini separately)
+ Extra Quantity (manually added in order grid)
+ Immediate Order Quantities (from immediate_orders)
= Total Full + Total Mini
= Grand Total (used in Production Planner as-is)

Stores Available Qty = Grand Total – Freezer Stock Balance
   → Only on Stores Issue Note when "Use Freezer Stock" is enabled
   → Production Planner ALWAYS shows full Grand Total (no deduction)
```

### BR-02: Recipe Calculation
```
For each product in production:
  For each recipe line (ingredient):
    Production_Qty_for_ingredient = qty_per_unit × Product_Production_Qty

  For stores issue note only:
    Stores_Qty = Production_Qty_for_ingredient + (extra_qty_per_unit × Product_Production_Qty)

  If ingredient is percentage-based (is_percentage = true):
    Production_Qty_for_ingredient = (percentage / 100) × Source_Product_Total_Qty
```

### BR-03: Sugar Candy Bun — Dual Sub-Recipe Rule
- Has two named sub-recipes: `recipe_name = "Dough"` and `recipe_name = "Bun"`
- Each sub-recipe has its own ingredient list and qty_per_unit values
- Both are calculated separately using the same production quantity
- Displayed as two distinct sub-tables in Production Planner and Stores Issue Note
- Dough ingredients shown under "Dough" sub-heading; Bun ingredients under "Bun" sub-heading

### BR-04: Viyana Roll / Viyana Roll Mini
- Viyana Roll Full and Viyana Roll Mini are stored as **separate products** with distinct recipes
- Each has its own `extra_flour` value added to the Stores Issue Note
- Displayed as two separate rows in all grids
- Viyana Roll Flour Note displayed at bottom of Bakery Stores Issue Note:
  `"Viyana Roll Flour: X g | Viyana Roll Mini Flour: Y g | Dusting Flour: Z g"`

### BR-05: Egg-to-Beehive Equivalence (Bakery)
- Beehive is measured in grams; its egg-as-butter equivalence = `Beehive_g / 30`
- Displayed in Bakery section as a footnote: `"SUM × 30g (Egg = Butter)"`

### BR-06: Production Start Time — Cross-Midnight Handling
- Each section has its own production start time per delivery turn, stored as full timestamp (date + time)
- Production start time can be on the **previous calendar day** (e.g. Short-Eats starts 2:00 PM the day before for a 5:00 AM delivery)
- The system must store and display the full timestamp, not just the time
- UI must label previous-day times clearly: "(Previous Day)"

### BR-07: Customized Orders
- Customized orders are **included in the Grand Total** — production sees the full combined count
- On Delivery Summary and Production Planner: total count is shown as-is (includes customized qty)
- Customization details (notes) are displayed in a sub-row below the product row
- Visual indicator distinguishes customized items (asterisk, different row color, or badge)

### BR-08: Item / Outlet Checkbox Logic
- **Item Y/N OFF:** Item excluded from this turn's production
  - Recipe is not calculated; ingredient totals exclude this item
  - Delivery Note shows qty = 0 for this item
- **Outlet Checkbox OFF:** Outlet not receiving delivery this turn
  - Outlet column quantities zeroed in Delivery Summary
  - Outlet excluded or shown as 0 in Delivery Note for that outlet

### BR-09: Rounding Engine
- If `product.rounding_value` is set (e.g. 5): `Rounded_Qty = CEILING(calculated_qty / rounding_value) × rounding_value`
- Standard quantity (reference value) shown alongside actual for staff reference
- Rounding applied to production quantity before recipe calculation

### BR-10: Decimal Quantities
- If `allow_decimal_quantity = true` for a product: input accepts decimals (e.g. 4.75)
- If `allow_decimal_quantity = false`: input is integer-only; API returns validation error for decimals
- Set per product by admin

### BR-11: Multi-Turn Item Availability
- Admin configures which products are available in which delivery turns
- Products not configured for a turn are hidden from that turn's Order Entry Grid
- Items like "Fish Curry Bun" may be restricted to 5 AM turn only

### BR-12: Pattie Dough Sub-Table
- Calculated based on total pattie quantity: Flour, Beehive, Salt, Eggs
- Displayed as a separate sub-table in Short-Eats 1 Production Planner

### BR-13: Chinese Roll Batter Sub-Table
- Flour: 12 kg base; Salt, Corn Flour, Eggs, Oil — linked to total Chinese Roll count
- Displayed as a separate sub-table in Short-Eats 1

### BR-14: Rotty Dough Sub-Table
- Flour, Salt, Sugar, Eggs, Vege Oil based on total rotty count
- Chicken Rotty Egg Wrap: separate sub-table (Flour, Salt, Eggs)

### BR-15: Extra Qty for Ingredients
- Raw-weight vs cleaned-weight loss (e.g. carrots: raw > cleaned weight)
- `extra_qty_per_unit` configured per ingredient per recipe line by admin
- Only visible on Stores Issue Note — never on Production Planner
- Stores note note: `Stores_Qty = Recipe_Qty + (extra_qty_per_unit × Prod_Qty)`

---

## ⚙️ NON-FUNCTIONAL REQUIREMENTS

| Requirement | Specification |
|---|---|
| **Availability** | 99.5% uptime target; graceful degradation (no complete outage) |
| **Performance** | Order grid loads within 2 seconds for 80+ products × 14+ outlets; recipe calculations complete within 1 second |
| **Security** | JWT authentication, HTTPS only, RBAC per role, SQL injection prevention via EF Core parameterized queries, XSS/CSRF protection |
| **Auditability** | Every data change logged with old/new values (JSON), user ID, timestamp; `audit_logs` table is immutable (no update/delete) |
| **Concurrency** | Optimistic concurrency on delivery plan saves using ETag-based conflict detection; UI shows conflict resolution dialog on save collision |
| **Scalability** | Stateless API — can scale horizontally; Redis for session/cache if load increases |
| **Backup** | Daily PostgreSQL dumps; point-in-time recovery configured |
| **Browser Support** | Chrome, Firefox, Edge (latest versions); mobile-responsive for outlet users (320px–1920px) |
| **Print Quality** | PDF output must match existing Excel print layouts exactly: margins, font sizes, column widths, signature lines |
| **Data Migration** | Tool to import existing Excel product list (470+), ingredient list (127), default quantities, and historical delivery data on go-live |
| **Calculation Accuracy** | All calculation outputs must be verified against live Excel workbook values during UAT; zero tolerance for calculation drift |

### Risk Register (from requirements document)

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Recipe complexity missed — dual-recipe items (Sugar Candy Bun), percentage ingredients | Medium | High | Dedicated Stage 2.5A with Excel comparison unit tests per item |
| Dynamic grid performance with 80+ products × 14+ outlets | Medium | Medium | Virtual scrolling (TanStack Virtual), server-side bulk save |
| Cross-midnight production timing confusion (previous day's start time) | High | High | Always store full timestamp; UI shows "(Previous Day)" label clearly |
| User adoption resistance (change from Excel) | High | Medium | Excel-like grid UI; phased rollout; staff training documentation |
| Calculation drift from Excel rounding | Medium | High | Unit test every formula against Excel values; achieve 100% calc service coverage |
| Multi-user simultaneous order entry conflicts | Low | High | Optimistic locking with ETag-based conflict resolution UI |
| Print layout mismatch | Medium | Medium | Print preview before go-live; side-by-side comparison with Excel print output |
| Decimal vs integer confusion per product | Low | Medium | Clear per-product setting enforced at both UI and API layer |

---

## 📊 SUMMARY

### Frontend Prototype (7 weeks)
- Complete UI/UX for all 9 modules
- Mobile-responsive design
- Brand theming
- Mock data throughout
- All forms with validation
- Dashboard with charts
- Reusable component library

### Backend Implementation (16 weeks)
- ASP.NET Core 8 Web API
- PostgreSQL database with 40+ tables
- JWT authentication
- Role-based access control
- 100+ API endpoints
- Complex business logic
- Audit logging
- Reports generation (PDF/Excel)
- Real-time features (SignalR)
- Scheduled jobs (Hangfire)
- Security hardening
- Data migration
- UAT & deployment

### Total Timeline: 23-26 weeks (approximately 6 months)

---

## 🎯 KEY MILESTONES

1. **Week 7**: Frontend prototype complete and ready for review
2. **Week 10**: Master data APIs complete
3. **Week 13**: Operations module APIs complete
4. **Week 15**: Administrator module APIs complete
5. **Week 17**: All APIs complete, integration started
6. **Week 20**: Migration, documentation, and testing complete
7. **Week 22**: UAT complete
8. **Week 23**: Production deployment

---

## ⚠️ CRITICAL SUCCESS FACTORS

1. **Soft Delete Everywhere**: No hard deletes in any table
2. **Day Lock Enforcement**: Absolute lock at API layer
3. **Access Control**: Centralized, role-based, per-module rules
4. **Audit Logging**: Immutable, complete trail of all changes
5. **Date Restrictions**: Different rules per module, enforced at API
6. **Number Generation**: Unique, sequential, formatted correctly
7. **Cashier Balance → Day-End Dependency**: Strictly enforced
8. **Per-Page Color Coding**: Dynamic theme injection
9. **Mobile Responsive**: 320px - 1920px tested thoroughly
10. **UAT with Live Data Comparison**: All calculations must match

---

## 📝 NOTES

- Each task should be tracked in a project management tool (Jira, Trello, etc.)
- Daily standups recommended during development
- Weekly demos to stakeholders
- Code reviews for all major features
- Continuous testing throughout development
- This plan assumes 1-2 developers working full-time

---

**END OF IMPLEMENTATION PLAN**
