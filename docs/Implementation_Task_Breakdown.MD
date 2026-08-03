# Don & Sons DMS - Detailed Implementation Task Breakdown

## Overview
This document breaks down the complete DMS implementation into actionable tasks across 6 phases.
Estimated Duration: 26 weeks (6.5 months)

---

## PHASE 1: Foundation & Master Data (Weeks 1-4)

### 1.1 Backend Foundation Setup
- [ ] **Task 1.1.1**: Initialize ASP.NET Core 8 Web API project
  - Configure project structure (Controllers, Services, Repositories, DTOs)
  - Set up dependency injection container
  - Configure CORS policies
  
- [ ] **Task 1.1.2**: Configure PostgreSQL database connection
  - Install Entity Framework Core 8 packages
  - Create DbContext configuration
  - Set up connection string management (dev, staging, prod)
  
- [ ] **Task 1.1.3**: Implement JWT authentication system
  - Create JWT token generation service
  - Implement refresh token mechanism
  - Create token validation middleware
  - Configure token expiration policies
  
- [ ] **Task 1.1.4**: Create audit logging middleware
  - Design audit_logs table schema
  - Implement automatic logging interceptor
  - Store old/new values as JSON
  - Ensure immutability (no update/delete on audit logs)
  
- [ ] **Task 1.1.5**: Set up global exception handling
  - Create custom exception types
  - Implement global error handler middleware
  - Configure error response format

### 1.2 Database Schema - Core Tables
- [ ] **Task 1.2.1**: Create users table and authentication schema
  - id, username, password_hash, role_id, showroom_ids[], active
  - Create indexes on frequently queried fields
  
- [ ] **Task 1.2.2**: Create user_roles and permissions tables
  - role_name, permissions_json structure
  - Seed initial admin role
  
- [ ] **Task 1.2.3**: Create outlets (showrooms) table
  - code, description, city, dashboard_visible, active
  - Seed 30 initial showrooms from requirements
  
- [ ] **Task 1.2.4**: Create product_categories table
  - code, description, active
  - Seed all 24 categories (Action, Biscuit, Bread, etc.)
  
- [ ] **Task 1.2.5**: Create units_of_measure table
  - code, description
  - Seed G, ml, Nos
  
- [ ] **Task 1.2.6**: Create products table
  - Complete schema with 470+ products support
  - product_code, description, category_id, uom_id, unit_price, require_open_stock, enable_label_print, active
  
- [ ] **Task 1.2.7**: Create ingredients table
  - 127 ingredients support
  - code, name, uom_id, active
  
- [ ] **Task 1.2.8**: Create production_sections table
  - code, name, sort_order, active
  
- [ ] **Task 1.2.9**: Create delivery_turns table
  - name, target_time (5:00 AM, 10:30 AM, 3:30 PM)
  
- [ ] **Task 1.2.10**: Create outlet_employees table
  - employee_id, name, outlet_id, job_title, approved, active

### 1.3 Backend API - Master Data CRUD
- [ ] **Task 1.3.1**: Implement Users API endpoints
  - GET, POST, PUT, PATCH /api/v1/users
  - Toggle active status endpoint
  - Input validation and business rules
  
- [ ] **Task 1.3.2**: Implement Roles API endpoints
  - CRUD operations for roles
  - Permissions management
  
- [ ] **Task 1.3.3**: Implement Outlets API endpoints
  - Full CRUD with soft delete
  - Dashboard visibility toggle
  
- [ ] **Task 1.3.4**: Implement Product Categories API
  - CRUD operations
  - Active/inactive filtering
  
- [ ] **Task 1.3.5**: Implement Products API
  - Complex CRUD with all business rules
  - Pagination (10, 25, 50 records per page)
  - Search functionality
  
- [ ] **Task 1.3.6**: Implement UOM API
  - Simple CRUD operations
  
- [ ] **Task 1.3.7**: Implement Ingredients API
  - CRUD with pagination
  - UOM relationship
  
- [ ] **Task 1.3.8**: Implement Production Sections API
  - CRUD operations
  
- [ ] **Task 1.3.9**: Implement Outlet Employees API
  - CRUD with approval workflow
  - Showroom assignment

### 1.4 Frontend Foundation Setup
- [ ] **Task 1.4.1**: Initialize Next.js project
  - Configure TypeScript
  - Set up Tailwind CSS
  - Install shadcn/ui components
  
- [ ] **Task 1.4.2**: Implement brand theme system
  - Primary: Red (#C8102E)
  - Accent: Yellow (#FFD100)
  - Configure Tailwind theme colors
  
- [ ] **Task 1.4.3**: Create authentication pages
  - Login screen
  - Logout functionality
  - Session management
  - Token refresh logic
  
- [ ] **Task 1.4.4**: Create main layout structure
  - Collapsible left sidebar navigation
  - Top header with user info
  - News ticker/notification area
  - Responsive mobile hamburger menu
  
- [ ] **Task 1.4.5**: Build navigation menu
  - Dashboard, Inventory, ShowRoom, Operation, Reports, Administrator, Production
  - Expandable sub-items
  - Active item highlighting

### 1.5 Frontend - Master Data Screens
- [ ] **Task 1.5.1**: Create Outlets management screen
  - List view with pagination
  - Add/Edit form modal
  - Toggle active status
  - Mobile responsive table
  
- [ ] **Task 1.5.2**: Create Product Categories screen
  - List, Add, Edit, Toggle Active
  
- [ ] **Task 1.5.3**: Create Unit of Measure screen
  - Simple CRUD interface
  
- [ ] **Task 1.5.4**: Create Products screen
  - Complex form with all fields
  - Category and UOM dropdowns
  - Search and pagination (470+ products)
  - Enable Label Print checkbox
  - Require Open Stock checkbox
  
- [ ] **Task 1.5.5**: Create Ingredients screen
  - List with pagination (127 items)
  - Add/Edit form
  - UOM dropdown
  
- [ ] **Task 1.5.6**: Create Users management screen
  - List with role display
  - Add/Edit user form
  - Role assignment
  - Showroom assignment (multi-select)
  
- [ ] **Task 1.5.7**: Create Roles and Capabilities screen
  - Role groups management
  - Permissions editor

### 1.6 Testing & Validation
- [ ] **Task 1.6.1**: Write unit tests for authentication
- [ ] **Task 1.6.2**: Write unit tests for all master data APIs
- [ ] **Task 1.6.3**: Test responsive design on mobile devices (320px to 1920px)
- [ ] **Task 1.6.4**: Verify soft delete works across all tables
- [ ] **Task 1.6.5**: Test audit logging captures all changes

---

## PHASE 2: Inventory & Recipe Engine (Weeks 5-8)

### 2.1 Recipe Database Schema
- [ ] **Task 2.1.1**: Create product_recipes table
  - product_id, section_id, ingredient_id, qty_per_unit, extra_qty_per_unit, effective_from
  - Support versioning by effective_from date
  
- [ ] **Task 2.1.2**: Add indexes for recipe queries
  - Optimize for product_id + section_id + effective_from lookups

### 2.2 Recipe Management Backend
- [ ] **Task 2.2.1**: Implement Recipe CRUD API
  - GET /api/v1/recipes?product_id=
  - POST, PUT, DELETE recipe lines
  - Version management (effective-from dates)
  
- [ ] **Task 2.2.2**: Create recipe calculation engine
  - Calculate total ingredients: qty_per_unit × production_quantity
  - Calculate stores version: total + extra_qty_per_unit
  - Support multi-section calculations
  
- [ ] **Task 2.2.3**: Create recipe version history API
  - Retrieve historical recipes by date
  - Compare recipe versions

### 2.3 Recipe Management Frontend
- [ ] **Task 2.3.1**: Create recipe management screen
  - Product selection dropdown
  - Section selection
  - Ingredient line items grid (add/remove rows)
  
- [ ] **Task 2.3.2**: Build recipe editor interface
  - Ingredient dropdown with search
  - Qty per unit input
  - Extra qty (stores only) input
  - Effective from date picker
  
- [ ] **Task 2.3.3**: Create recipe calculation preview
  - Live calculation display
  - Stores vs Production view toggle
  
- [ ] **Task 2.3.4**: Implement recipe versioning UI
  - View history
  - Copy from previous version
  - Compare versions side-by-side

### 2.4 Testing & Validation
- [ ] **Task 2.4.1**: Test recipe calculations against sample data
- [ ] **Task 2.4.2**: Validate recipe versioning logic
- [ ] **Task 2.4.3**: Test with all 470+ products
- [ ] **Task 2.4.4**: Performance test recipe generation for large production plans

---

## PHASE 3: Operations Module (Weeks 9-13)

### 3.1 Operations Database Schema
- [ ] **Task 3.1.1**: Create deliveries tables
  - deliveries header (id, delivery_no, delivery_date, outlet_id, turn_id, status, approved_by, edit_user, edit_date)
  - delivery_lines (delivery_id, product_id, full_qty, mini_qty, unit_price)
  
- [ ] **Task 3.1.2**: Create disposals tables
  - disposals header (id, disposal_no, disposal_date, outlet_id, delivered_date, status)
  - disposal_lines (disposal_id, product_id, qty, reason)
  
- [ ] **Task 3.1.3**: Create stock_transfers tables
  - stock_transfers header (id, transfer_no, transfer_date, from_outlet_id, to_outlet_id, status)
  - stock_transfer_lines (transfer_id, product_id, qty)
  
- [ ] **Task 3.1.4**: Create stock_bf tables
  - stock_bf header (id, display_no, bf_date, outlet_id, status, approved_by)
  - stock_bf_lines (stock_bf_id, product_id, closing_qty)
  
- [ ] **Task 3.1.5**: Create delivery_cancellations tables
  - Header and lines
  
- [ ] **Task 3.1.6**: Create delivery_returns tables
  - Header and lines
  
- [ ] **Task 3.1.7**: Create label_printing_requests table
  - id, display_no, request_date, product_id, label_count, status
  
- [ ] **Task 3.1.8**: Create showroom_label_prints table
  - id, outlet_id, text1, text2, label_count, requested_at

### 3.2 Access Control & Date Rules Service
- [ ] **Task 3.2.1**: Create centralized access rule service
  - Implement role-based record visibility
  - Admin: ALL records, ALL dates
  - Manager: configurable access
  - Regular User: own records, today/future only
  
- [ ] **Task 3.2.2**: Implement date entry validation service
  - Delivery: Today/Future, no back-date for regular users
  - Disposal: Today only for regular users
  - Transfer/Stock BF/Cancellation/Return: back-date up to 3 days
  - Label Printing: no back/future by default
  
- [ ] **Task 3.2.3**: Create permission checking middleware
  - API-level enforcement
  - Return 403 for unauthorized access

### 3.3 Delivery Module
- [ ] **Task 3.3.1**: Implement Delivery API endpoints
  - GET with filtering by role and date rules
  - POST with date validation
  - PUT with approval workflow
  - PATCH for approve/reject
  
- [ ] **Task 3.3.2**: Create delivery number generator
  - Format: DEL00XXXXXX
  - Auto-increment logic
  
- [ ] **Task 3.3.3**: Build Delivery frontend screen
  - List view with 796 records pagination
  - Show Previous Records button
  - Add New form
  - Product line items grid
  - Status indicators (Approved/Pending/Rejected)
  
- [ ] **Task 3.3.4**: Implement Print DN functionality
  - Generate delivery note PDF
  - Match Excel layout exactly

### 3.4 Disposal Module
- [ ] **Task 3.4.1**: Implement Disposal API
  - Access rules: regular user TODAY only
  - Format: DIS00XXXXXX
  
- [ ] **Task 3.4.2**: Build Disposal frontend screen
  - List with 169 records
  - Add form with delivered date selection
  - Product disposal grid
  
- [ ] **Task 3.4.3**: Implement disposal reason dropdown

### 3.5 Transfer Module
- [ ] **Task 3.5.1**: Implement Transfer API
  - Back-date up to 3 days for regular users
  - Format: TRN00XXXXXX
  
- [ ] **Task 3.5.2**: Build Transfer frontend screen
  - ShowRoom From / ShowRoom To dropdowns
  - Product transfer grid
  
- [ ] **Task 3.5.3**: Create POS Cashier transfer interface
  - Simplified UI for cashiers
  - Mobile-optimized

### 3.6 Stock BF Module
- [ ] **Task 3.6.1**: Implement Stock BF API
  - Back-date up to 3 days
  - Format: SBF00XXXXXX
  
- [ ] **Task 3.6.2**: Build Stock BF frontend screen
  - List with 94 records
  - Add form with product opening balance grid
  
- [ ] **Task 3.6.3**: Create POS Cashier Stock BF interface

### 3.7 Cancellation Module
- [ ] **Task 3.7.1**: Implement Cancellation API
  - Format: DCN00XXXXXX
  - Back-date up to 3 days
  
- [ ] **Task 3.7.2**: Build Cancellation frontend screen
  - 76 records support
  
- [ ] **Task 3.7.3**: Create POS Cashier cancellation interface

### 3.8 Delivery Return Module
- [ ] **Task 3.8.1**: Implement Delivery Return API
  - Format: RET00XXXXXX
  
- [ ] **Task 3.8.2**: Build Delivery Return frontend screen
  - 32 records support
  
- [ ] **Task 3.8.3**: Create POS Cashier return interface

### 3.9 Label Printing Module
- [ ] **Task 3.9.1**: Implement Label Printing API
  - Format: LBL00XXXXXX
  - Only products with enable_label_print = TRUE
  - Yellow date box logic for future-date allowed products
  
- [ ] **Task 3.9.2**: Build Label Printing frontend screen
  - Product dropdown (filtered)
  - Label count input
  - Date box with conditional yellow highlighting
  
- [ ] **Task 3.9.3**: Implement label print queue processing

### 3.10 Showroom Open Stock
- [ ] **Task 3.10.1**: Create Showroom Open Stock API
  - GET latest Stock BF per showroom
  - PUT to edit 'Stock As At' date
  
- [ ] **Task 3.10.2**: Build Showroom Open Stock screen
  - List all showrooms with last Stock BF date
  - Editable date field for admin
  - Use case: covering closed days

### 3.11 Showroom Label Printing
- [ ] **Task 3.11.1**: Create Showroom Label Print API
  - POST new request
  
- [ ] **Task 3.11.2**: Build Showroom Label Print form
  - Showroom code dropdown
  - Text 1 (auto-filled)
  - Text 2 (optional)
  - Label count
  
- [ ] **Task 3.11.3**: Integrate with label printer

### 3.12 Per-Page Color Coding System
- [ ] **Task 3.12.1**: Implement color coding service
  - Store page colors in Label Settings
  - API to retrieve color per page
  
- [ ] **Task 3.12.2**: Build dynamic CSS injection
  - Use CSS custom properties
  - Apply to table headers, buttons, navigation highlight
  
- [ ] **Task 3.12.3**: Test color coding on all operation pages

### 3.13 Testing & Validation
- [ ] **Task 3.13.1**: Test all access control rules per role
- [ ] **Task 3.13.2**: Test date validation rules for each module
- [ ] **Task 3.13.3**: Verify approval workflows
- [ ] **Task 3.13.4**: Test POS interfaces on tablets
- [ ] **Task 3.13.5**: Performance test with high transaction volume

---

## PHASE 4: Production Module (Weeks 14-18)

### 4.1 Production Database Schema
- [ ] **Task 4.1.1**: Create daily_productions tables
  - Header (id, production_no, production_date, status, approved_by)
  - Lines (production_id, product_id, section_id, qty)
  
- [ ] **Task 4.1.2**: Create production_cancellations tables
  - Header (id, cancelled_no, cancelled_date, status)
  - Lines
  
- [ ] **Task 4.1.3**: Create stock_adjustments tables (Production BF)
  - Header (id, display_no, adj_date, status, approved_by)
  - Lines (adjustment_id, product_id, section_id, qty)
  
- [ ] **Task 4.1.4**: Create delivery_plans tables
  - Header (id, plan_no, plan_date, day_type, turn_id, status, reference, comment)
  - Lines (plan_id, outlet_id, product_id, qty)

### 4.2 Daily Production Module
- [ ] **Task 4.2.1**: Implement Daily Production API
  - Format: PRO00XXXXXX
  - 163 records support
  - Access: Admin ALL, Regular User TODAY only
  
- [ ] **Task 4.2.2**: Build Daily Production frontend screen
  - List with filters
  - Add form with product grid per section
  - Quantity input
  
- [ ] **Task 4.2.3**: Integrate with approval workflow

### 4.3 Production Cancel Module
- [ ] **Task 4.3.1**: Implement Production Cancel API
  - Format: PRC00XXXXXX
  - 11 records support
  
- [ ] **Task 4.3.2**: Build Production Cancel frontend screen

### 4.4 Current Stock Module
- [ ] **Task 4.4.1**: Create Current Stock calculation engine
  - Formula: Open Balance + Today Production - Today Production Cancelled - Today Delivery + Delivery Cancelled + Delivery Returned
  - Real-time calculation
  
- [ ] **Task 4.4.2**: Implement Current Stock API
  - GET with live calculation
  - Support 470+ products
  
- [ ] **Task 4.4.3**: Build Current Stock frontend screen
  - Display all columns
  - Timestamp: "Production Stock — Current Production Stock on [date] [time]"
  - 50 records per page
  - Search functionality

### 4.5 Stock Adjustment Module
- [ ] **Task 4.5.1**: Implement Stock Adjustment API
  - Format: PSA00XXXXXX
  - 35 records support
  - Approval workflow (Production BF)
  
- [ ] **Task 4.5.2**: Build Stock Adjustment frontend screen
  - Product grid for unsold stock
  
- [ ] **Task 4.5.3**: Create Stock Adjustment Approval screen
  - Pending list
  - Approve/Reject actions

### 4.6 Production Plan Module (Complex)
- [ ] **Task 4.6.1**: Implement Production Plan API
  - Format: PPL00XXXXXX
  - 16 plans support (paginated)
  
- [ ] **Task 4.6.2**: Build Pre-Loaded Summary UI
  - Day type selection (Weekday/Saturday/Sunday)
  - Delivery turn selection (5:00 AM / 10:30 AM / 3:30 PM)
  - Product quantity grid per showroom
  - Load defaults based on day type
  
- [ ] **Task 4.6.3**: Implement recipe generation engine
  - Two-layer calculation:
    - Per-Item Recipe × Production Quantity = Total
  - Per section recipe sheets
  
- [ ] **Task 4.6.4**: Create Stores Issue Note generator
  - Add extra/waste allowance per ingredient
  - Separate view from production floor sheet
  
- [ ] **Task 4.6.5**: Build Production Plan summary calculation
  - Aggregate quantities per product
  - Display per outlet, per product
  
- [ ] **Task 4.6.6**: Create multi-turn quantity management
  - Handle 3 delivery turns per day
  - Aggregate across turns
  
- [ ] **Task 4.6.7**: Generate production planner PDFs
  - Match Excel layout exactly
  - Per section sheets
  - Include all recipe calculations

### 4.7 Testing & Validation
- [ ] **Task 4.7.1**: Test Current Stock formula with sample data
- [ ] **Task 4.7.2**: Validate recipe generation for all 470+ products
- [ ] **Task 4.7.3**: Compare recipe calculations with live Excel data
- [ ] **Task 4.7.4**: Test multi-section production planning
- [ ] **Task 4.7.5**: Verify stores issue note calculations

---

## PHASE 5: Administrator & Reports (Weeks 19-22)

### 5.1 Administrator Database Schema
- [ ] **Task 5.1.1**: Create cashier_balances table
  - id, process_date, outlet_id, employee_id, cashier_balance, system_balance, is_closed, status, approved_by
  
- [ ] **Task 5.1.2**: Create day_end_processes table
  - id, process_date, outlet_id, employee_id, cashier_balance, system_balance, status
  
- [ ] **Task 5.1.3**: Create day_locks table
  - id, lock_date, locked_by, locked_at
  
- [ ] **Task 5.1.4**: Create system_settings table
  - id, setting_name, setting_value, description
  - Seed 5 initial settings
  
- [ ] **Task 5.1.5**: Create label_printers table
  - id, printer_name, connection_string, active
  
- [ ] **Task 5.1.6**: Create label_templates table
  - id, template_name, dimensions, printer_id
  
- [ ] **Task 5.1.7**: Create label_comments table
  - id, comment_text
  
- [ ] **Task 5.1.8**: Create price_manager table
  - id, product_id, old_price, new_price, effective_from, effective_to, comment, created_by
  
- [ ] **Task 5.1.9**: Create workflow_configs table
  - id, operation_name, approval_required, approver_role_id

### 5.2 Day-End Process Module
- [ ] **Task 5.2.1**: Implement Day-End Process API
  - Check Cashier Balance approval pre-requisite
  - Check Day Lock status
  - Link to cashier declarations
  
- [ ] **Task 5.2.2**: Build Day-End Process screen
  - Default date: PREVIOUS day (auto-load)
  - Disable all fields if Cashier Balance not approved
  - Block if day is locked
  - Form layout: checkbox, showroom, cashier dropdown, balances
  
- [ ] **Task 5.2.3**: Implement cashier-system balance comparison
  - Auto-calculate system balance from records
  - Highlight discrepancies

### 5.3 Cashier Balance Module
- [ ] **Task 5.3.1**: Implement Cashier Balance API
  - Default date: previous day
  - Lock entire form if already submitted
  
- [ ] **Task 5.3.2**: Build Cashier Balance screen
  - Auto-select ALL showrooms (cannot uncheck)
  - NEW: "Showroom Is Closed" checkbox
  - Cashier Name dropdown disabled if Balance is null
  - If "Showroom Is Closed" = TRUE:
    - Clear and disable Cashier Name
    - Clear and disable Balance
    - Send to Approvals queue
  
- [ ] **Task 5.3.3**: Implement read-only mode for submitted balances

### 5.4 System Settings Module
- [ ] **Task 5.4.1**: Implement System Settings API
  - GET all settings
  - PUT bulk update
  
- [ ] **Task 5.4.2**: Build System Settings screen
  - Key-value editor
  - 5 settings:
    - Dispos Date Change
    - Delivered Date Change
    - Block current date in Stock BF
    - Day Locking for non-admins
    - Day UnLocking for non-admins
  
- [ ] **Task 5.4.3**: Integrate settings into access control service

### 5.5 Label Settings Module
- [ ] **Task 5.5.1**: Implement Label Settings API
  - Printers CRUD
  - Templates CRUD
  - Comments CRUD
  - Template-to-Printer mapping
  
- [ ] **Task 5.5.2**: Build Label Settings screen (3 sections)
  - Section 1: Defined Label Printers
  - Section 2: Set Template to Printer
  - Section 3: Defined Label Printing Comments
  
- [ ] **Task 5.5.3**: Implement printer connection testing

### 5.6 Delivery Plan Module
- [ ] **Task 5.6.1**: Implement Delivery Plan API
  - Future dates only (max 3 days ahead)
  - Auto-set delivery time to 5:00 AM
  - Pre-loaded plan groups
  
- [ ] **Task 5.6.2**: Build Delivery Plan screen
  - Date picker (future only, max 3 days)
  - Pre-loaded plan templates
  - Day type groups
  
- [ ] **Task 5.6.3**: Implement auto-create in Delivery table
  - When plan submitted, create pending Delivery records

### 5.7 Security (Users & Roles) Module
- [ ] **Task 5.7.1**: Enhance Users API
  - 57 users support
  - User-role assignment
  
- [ ] **Task 5.7.2**: Build Users tab
  - List with role display
  - Add/Edit user
  - Soft delete
  
- [ ] **Task 5.7.3**: Build Roles and Capabilities tab
  - Role groups management
  - 14 role groups
  - Permissions matrix editor
  
- [ ] **Task 5.7.4**: Implement granular permission checking

### 5.8 Day Lock Module
- [ ] **Task 5.8.1**: Implement Day Lock API
  - GET locked days per month
  - POST lock date
  - DELETE unlock date
  - HARD enforcement: no operations on locked dates
  
- [ ] **Task 5.8.2**: Build Day Lock screen
  - Monthly calendar view
  - Prev/Next navigation
  - Click date to toggle lock/unlock
  - Lock icon indicator
  
- [ ] **Task 5.8.3**: Implement API-level enforcement
  - Middleware to block all operations on locked dates
  - Override: NO override possible (hard lock)
  
- [ ] **Task 5.8.4**: Integrate with System Settings
  - Check "Day Locking for non-admins"
  - Check "Day UnLocking for non-admins"

### 5.9 Approvals Hub
- [ ] **Task 5.9.1**: Implement Approvals API
  - GET pending records per operation
  - POST approve
  - POST reject (with reason)
  
- [ ] **Task 5.9.2**: Build Approvals hub screen
  - List of operation groups with badge counters
  - 14 operations:
    - Daily Production
    - DayEnd Process Balance
    - Delivery
    - Delivery Cancel
    - Delivery Return
    - Disposal
    - End Process
    - Label Printing
    - Production Cancel
    - Production BF
    - Stock Transfer
    - Stock BF
    - Cashier Balance
    - Showroom Label Printing
  
- [ ] **Task 5.9.3**: Implement rejection workflow
  - Return to submitter with reason

### 5.10 Showroom Employee Module
- [ ] **Task 5.10.1**: Enhance Outlet Employees API
  - 28 employees support
  - Approval status
  
- [ ] **Task 5.10.2**: Build Showroom Employee screen
  - List with 10 records per page
  - Employee ID, Name, Showroom, Job Title, Approved
  - Add/Edit form
  
- [ ] **Task 5.10.3**: Implement employee approval workflow

### 5.11 Price Manager Module
- [ ] **Task 5.11.1**: Implement Price Manager API
  - 2,072 records support
  - Schedule future price changes
  - Audit trail
  
- [ ] **Task 5.11.2**: Build Price Manager screen
  - List with effective date range
  - Add scheduled price change
  - Effective From / Effective To
  - Comment field
  
- [ ] **Task 5.11.3**: Implement automatic price activation job
  - Hangfire scheduled job
  - Activate prices on effective date

### 5.12 WorkFlow Config Module
- [ ] **Task 5.12.1**: Implement WorkFlow Config API
  - GET all 14 operations
  - PUT toggle approval requirement
  - Set approver role
  
- [ ] **Task 5.12.2**: Build WorkFlow Config screen
  - List of 14 operations
  - Toggle icon for approval required
  - Approver role dropdown
  
- [ ] **Task 5.12.3**: Integrate with all operation modules

### 5.13 Reports Module
- [ ] **Task 5.13.1**: Design reports database structure
  - Report definitions
  - Report parameters
  
- [ ] **Task 5.13.2**: Implement Reports API
  - GET report list per group
  - GET report data with filters
  - Support PDF, Excel, JSON formats
  
- [ ] **Task 5.13.3**: Build Reports screen layout
  - Two-panel: groups on left, reports on right
  - 6 report groups:
    - General (3 reports)
    - Cashier (2 reports)
    - Sales (4 reports)
    - Delivery (3 reports)
    - Disposal (3 reports)
    - Production (5 reports)
  
- [ ] **Task 5.13.4**: Implement date restriction logic
  - Reports only from last Day-End date to today
  - Block dates before last Day-End (hard block)
  
- [ ] **Task 5.13.5**: Create report generators (20 reports total)
  - Opening Balance
  - Service Charges
  - Unloading Plan
  - Cashier Balance Report
  - Daily Cashier Reconciliation
  - Daily Sales Summary
  - Weekly Sales Trend
  - Product-wise Sales
  - Showroom-wise Sales
  - Delivery Note (per outlet per turn)
  - Delivery Summary
  - Delivery vs Disposal comparison
  - Daily Disposal by Showroom
  - Disposal by Category
  - Disposal Trend
  - Daily Production Planner (per section)
  - Stores Issue Note (per section)
  - Production Summary
  - Recipe Card (per product)
  - Ingredient Requirements
  
- [ ] **Task 5.13.6**: Implement PDF export
  - Match Excel layout exactly
  - Same margins, fonts, column widths
  
- [ ] **Task 5.13.7**: Implement Excel export
  - Native Excel format
  
- [ ] **Task 5.13.8**: Create print preview functionality

### 5.14 Label Printing Integration
- [ ] **Task 5.14.1**: Integrate with physical label printers
  - Test with 5 known printers:
    - ZTMC
    - Datamax 33835 BPL
    - Datamax 33220 650dpi DPL
    - Datamax TLP 3842 test
  
- [ ] **Task 5.14.2**: Implement label template rendering
  - 10 templates:
    - 40×17 mm
    - 40×17 mm Large
    - 50×40 sandwich
    - 50×45
    - 55×26 (Rice & Curry)
    - 60×40
    - Medium Label Only Max Date
    - Showroom Label
    - 50×26 Chocolates Ref
    - 60×50 Fruit Cake Label
  
- [ ] **Task 5.14.3**: Test label printing end-to-end

### 5.15 Testing & Validation
- [ ] **Task 5.15.1**: Test Day-End + Cashier Balance dependency chain
- [ ] **Task 5.15.2**: Test "Showroom Is Closed" checkbox impacts
- [ ] **Task 5.15.3**: Test Day Lock hard enforcement
- [ ] **Task 5.15.4**: Validate all 20 reports against sample data
- [ ] **Task 5.15.5**: Compare report outputs with existing Excel
- [ ] **Task 5.15.6**: Test approval workflows for all 14 operations
- [ ] **Task 5.15.7**: Test price manager scheduled activation
- [ ] **Task 5.15.8**: Test label printing with physical printers

---

## PHASE 6: Polish, Migration & UAT (Weeks 23-26)

### 6.1 Dashboard Module
- [ ] **Task 6.1.1**: Implement Dashboard APIs
  - GET /api/v1/dashboard/sales-trend (7 days)
  - GET /api/v1/dashboard/disposal-by-section (yesterday)
  - GET /api/v1/dashboard/top-deliveries (today)
  - GET /api/v1/dashboard/delivery-vs-disposal (7 days)
  
- [ ] **Task 6.1.2**: Build Dashboard screen (4-quadrant layout)
  - Widget 1: Sales Trend for Last 7 Days (Line/Area chart)
  - Widget 2: Disposal by Section — Yesterday (Pie/Donut chart)
  - Widget 3: Today Top Deliveries (Table + Bar chart)
  - Widget 4: Delivery vs Disposal Trend — 7 Days (Grouped Bar chart)
  
- [ ] **Task 6.1.3**: Implement news ticker/notification area
  - Display offline/online status
  - System notifications
  
- [ ] **Task 6.1.4**: Add real-time data updates
  - Refresh interval: 5 minutes
  - Manual refresh button

### 6.2 Real-Time Notifications (SignalR)
- [ ] **Task 6.2.1**: Set up SignalR hub in backend
  - Configure WebSocket connections
  
- [ ] **Task 6.2.2**: Implement notification events
  - New order → notify production
  - Approval required → notify approver
  - Day-End ready → notify admin
  
- [ ] **Task 6.2.3**: Build frontend notification component
  - Toast/banner notifications
  - Notification center with history
  
- [ ] **Task 6.2.4**: Test real-time updates

### 6.3 Scheduled Jobs (Hangfire)
- [ ] **Task 6.3.1**: Set up Hangfire dashboard
  - Configure jobs monitoring
  
- [ ] **Task 6.3.2**: Create auto-generate production plan job
  - Run at midnight
  - Load defaults based on day type
  - Create next-day plan
  
- [ ] **Task 6.3.3**: Create price activation job
  - Run daily
  - Apply scheduled price changes
  
- [ ] **Task 6.3.4**: Create automated backup job
  - Daily PostgreSQL dumps
  
- [ ] **Task 6.3.5**: Test all scheduled jobs

### 6.4 Redis Caching
- [ ] **Task 6.4.1**: Set up Redis connection
  - Configure connection pooling
  
- [ ] **Task 6.4.2**: Implement caching for master data
  - Products (470+)
  - Categories
  - Outlets
  - UOM
  - Ingredients
  - Users & Roles
  
- [ ] **Task 6.4.3**: Implement cache invalidation
  - On update/delete
  - TTL configuration
  
- [ ] **Task 6.4.4**: Test cache performance improvements

### 6.5 Performance Optimization
- [ ] **Task 6.5.1**: Database query optimization
  - Add missing indexes
  - Analyze slow queries
  - Optimize N+1 queries
  
- [ ] **Task 6.5.2**: API response time optimization
  - Target: < 2 seconds for grids
  - Target: < 1 second for recipe calculations
  - Target: < 3 seconds for dashboard
  
- [ ] **Task 6.5.3**: Frontend performance optimization
  - Code splitting
  - Lazy loading
  - Image optimization
  
- [ ] **Task 6.5.4**: Load testing
  - Simulate 80+ products × 14+ outlets
  - Concurrent user testing (20+ users)
  - Peak load testing

### 6.6 Data Migration
- [ ] **Task 6.6.1**: Create migration data extraction scripts
  - Extract from existing Excel system
  - Extract historical data
  
- [ ] **Task 6.6.2**: Build bulk Excel import tool
  - Import outlets (30)
  - Import products (470+)
  - Import ingredients (127)
  - Import categories (24)
  - Import users (57)
  - Import employees (28)
  - Import historical transactions
  
- [ ] **Task 6.6.3**: Create validation report
  - Compare migrated data with source
  - Per-item validation
  - Discrepancy report
  
- [ ] **Task 6.6.4**: Perform test migration
  - Migrate to staging environment
  - Validate all records
  
- [ ] **Task 6.6.5**: Create rollback plan

### 6.7 User Acceptance Testing (UAT)
- [ ] **Task 6.7.1**: Prepare UAT environment
  - Deploy to staging server
  - Load test data
  
- [ ] **Task 6.7.2**: Create UAT test cases (all modules)
  - Test each user role
  - Test each access rule
  - Test each business rule
  
- [ ] **Task 6.7.3**: Conduct UAT sessions with stakeholders
  - Admin users
  - Production managers
  - Cashiers
  - Sales managers
  
- [ ] **Task 6.7.4**: Compare calculations with live Excel data
  - Recipe calculations
  - Current Stock calculations
  - Report values
  - Production planner totals
  
- [ ] **Task 6.7.5**: Collect feedback and create fix list
  
- [ ] **Task 6.7.6**: Address UAT feedback
  - Critical bugs: immediate fix
  - High priority: pre-launch fix
  - Medium/Low: post-launch backlog

### 6.8 Documentation
- [ ] **Task 6.8.1**: Create technical documentation
  - System architecture
  - API documentation
  - Database schema documentation
  - Deployment guide
  
- [ ] **Task 6.8.2**: Create user manuals
  - Admin user guide
  - Operations user guide
  - Production user guide
  - Reports user guide
  - Cashier POS guide
  
- [ ] **Task 6.8.3**: Create training materials
  - Video tutorials
  - Quick start guides
  - FAQ document
  
- [ ] **Task 6.8.4**: Create runbook for operations team
  - Day-End process guide
  - Troubleshooting guide
  - Admin override procedures

### 6.9 Staff Training
- [ ] **Task 6.9.1**: Conduct admin training sessions
  - System settings
  - User management
  - Approval workflows
  
- [ ] **Task 6.9.2**: Conduct operations staff training
  - Delivery entry
  - Disposal entry
  - Transfer/Stock BF
  
- [ ] **Task 6.9.3**: Conduct production staff training
  - Daily production entry
  - Production planning
  - Recipe sheets
  
- [ ] **Task 6.9.4**: Conduct cashier training
  - POS interface
  - Stock BF entry
  - Transfer entry
  
- [ ] **Task 6.9.5**: Create training certificates/sign-off

### 6.10 Security & Compliance
- [ ] **Task 6.10.1**: Security audit
  - SQL injection testing
  - XSS testing
  - CSRF protection verification
  - Authentication bypass testing
  
- [ ] **Task 6.10.2**: Configure HTTPS
  - SSL certificate installation
  - Force HTTPS redirect
  
- [ ] **Task 6.10.3**: Set up database backups
  - Daily automated dumps
  - Point-in-time recovery (PITR)
  - Test restore procedure
  
- [ ] **Task 6.10.4**: Configure backup retention
  - 30-day retention policy
  - Archive old backups
  
- [ ] **Task 6.10.5**: Set up monitoring and alerts
  - Server health monitoring
  - Database monitoring
  - Application error tracking
  - Uptime monitoring (99.5% target)

### 6.11 Deployment Preparation
- [ ] **Task 6.11.1**: Set up production environment
  - Production server configuration
  - Database server setup
  - Redis server setup
  
- [ ] **Task 6.11.2**: Configure CI/CD pipeline
  - Automated build
  - Automated testing
  - Deployment scripts
  
- [ ] **Task 6.11.3**: Create deployment checklist
  - Pre-deployment tasks
  - Deployment steps
  - Post-deployment verification
  - Rollback procedure
  
- [ ] **Task 6.11.4**: Perform dry-run deployment
  - Deploy to staging
  - Verify all functionality
  - Test rollback

### 6.12 Go-Live
- [ ] **Task 6.12.1**: Execute production migration
  - Migrate all data
  - Validate migration
  
- [ ] **Task 6.12.2**: Deploy to production
  - Follow deployment checklist
  - Monitor for errors
  
- [ ] **Task 6.12.3**: Post-deployment verification
  - Test critical paths
  - Verify integrations (printers, etc.)
  - Test with actual users
  
- [ ] **Task 6.12.4**: Hypercare period (1 week)
  - 24/7 support availability
  - Rapid bug fixes
  - User support
  
- [ ] **Task 6.12.5**: Final sign-off from stakeholders

### 6.13 Post-Launch Tasks
- [ ] **Task 6.13.1**: Monitor system performance
  - Track response times
  - Monitor error rates
  - Check uptime
  
- [ ] **Task 6.13.2**: Collect user feedback
  - In-app feedback form
  - User surveys
  
- [ ] **Task 6.13.3**: Address post-launch issues
  - Bug fixes
  - Performance improvements
  - Feature enhancements
  
- [ ] **Task 6.13.4**: Create maintenance schedule
  - Weekly health checks
  - Monthly updates
  - Quarterly reviews

---

## RISK MITIGATION TASKS

### High Priority Risks
- [ ] **Task R.1**: Test Cashier Balance / Day-End dependency chain thoroughly
  - Create automated alerts
  - Document admin override procedure
  
- [ ] **Task R.2**: Test "Showroom Is Closed" checkbox impacts
  - Test Approvals queue integration
  - Test Day-End Process impact
  - Test Reports impact
  
- [ ] **Task R.3**: Centralize access-rule service
  - Write comprehensive unit tests
  - QA sign-off on access rules per module per role
  
- [ ] **Task R.4**: Test Day Lock hard enforcement
  - Write integration tests
  - Test at API middleware level
  - Verify no bypass possible

### Medium Priority Risks
- [ ] **Task R.5**: Implement dynamic CSS for color coding
  - Use CSS custom properties approach
  - Test color changes across all themes
  
- [ ] **Task R.6**: Test Production Plan recipe generation complexity
  - Unit tests per product
  - UAT comparison with Excel
  
- [ ] **Task R.7**: Define POS front-end screens early (Phase 1 design sprint)
  - Separate deployment target
  - Mobile-optimized designs

---

## TESTING CHECKLIST (Cross-Phase)

### Functional Testing
- [ ] All CRUD operations work correctly
- [ ] All business rules enforced
- [ ] All access controls work per role
- [ ] All date validation rules work
- [ ] Soft delete works everywhere
- [ ] Audit logging captures all changes

### Integration Testing
- [ ] Frontend-Backend API integration
- [ ] Approval workflows across modules
- [ ] Day Lock enforcement across modules
- [ ] Recipe generation integration
- [ ] Label printer integration
- [ ] Report generation integration

### Performance Testing
- [ ] Order grid loads < 2 seconds
- [ ] Recipe calculations < 1 second
- [ ] Dashboard loads < 3 seconds
- [ ] 80+ products × 14+ outlets grid responsive
- [ ] Concurrent user testing (20+ users)

### Security Testing
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Authentication bypass testing
- [ ] Authorization testing per role

### Compatibility Testing
- [ ] Chrome (latest 2 versions)
- [ ] Firefox (latest 2 versions)
- [ ] Edge (latest 2 versions)
- [ ] Safari iOS (latest)
- [ ] Mobile responsive (320px to 1920px)

### UAT Testing
- [ ] Admin user scenarios
- [ ] Operations user scenarios
- [ ] Production user scenarios
- [ ] Cashier scenarios
- [ ] Manager scenarios
- [ ] Compare all calculations with Excel

---

## DELIVERABLES SUMMARY

### Phase 1 Deliverables
- Fully functional authentication system
- All master data modules operational
- Admin can configure all base data
- Brand theme applied throughout
- Mobile responsive design

### Phase 2 Deliverables
- Recipe management system
- Recipe calculation engine verified
- Recipe versioning working
- All 470+ products can have recipes

### Phase 3 Deliverables
- All 9 operation sub-modules functional
- POS interfaces for cashiers
- Approval workflows operational
- Color coding system working
- Access controls enforced

### Phase 4 Deliverables
- All 6 production sub-modules operational
- Current Stock calculation verified
- Production planner generates correct recipes
- Stores issue notes working

### Phase 5 Deliverables
- All administrator functions operational
- All 20 reports generating correctly
- Label printing end-to-end tested
- Day-End process working
- Approvals hub functional

### Phase 6 Deliverables
- System live and operational
- All data migrated and validated
- Staff trained
- Documentation complete
- Performance targets met (99.5% uptime)
- Calculations match Excel values

---

## ESTIMATED EFFORT

### Total Tasks: ~450 individual tasks
### Total Duration: 26 weeks (6.5 months)
### Team Composition Recommendation:
- 2 Backend Developers (ASP.NET Core)
- 2 Frontend Developers (Next.js/React)
- 1 Full-Stack Developer
- 1 QA Engineer
- 1 DevOps Engineer
- 1 Technical Lead / Architect
- 1 Project Manager

### Critical Path Items:
1. Authentication & Authorization (Week 1-2)
2. Master Data Foundation (Week 2-4)
3. Recipe Engine (Week 5-8)
4. Access Control Service (Week 9-10)
5. Production Plan & Recipe Generation (Week 14-18)
6. Day-End Process + Cashier Balance (Week 19-20)
7. Data Migration (Week 23-24)
8. UAT (Week 24-25)
9. Go-Live (Week 26)

---

## NEXT STEPS

1. **Stakeholder Review** - Review this task breakdown with all stakeholders
2. **Validate Against Live Excel** - Ensure all business rules match current system
3. **Team Assembly** - Recruit/assign development team
4. **Sprint Planning** - Break phases into 2-week sprints
5. **Development Environment Setup** - Prepare dev, staging, production environments
6. **Kick-off Phase 1** - Begin with Foundation & Master Data

---

*Document prepared: April 2026*
*Based on: Don_and_Sons_DMS_Requirements_final.md Version 2.0*
