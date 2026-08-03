# Don & Sons DMS — Final Implementation Gap Analysis

**Prepared:** 2026-05-05  
**Source:** DMS Requirements.pdf (v2.0, April 2026) + Don and Sons DMS.md (ERP Plan v1.0)  
**Scope:** All features specified in requirements that are **missing or incomplete** in the current codebase

> **Legend**
> - 🔴 **Not Implemented** — No code exists at all  
> - 🟡 **Partial** — Backend or frontend exists but not both, or logic is incomplete  
> - 🔵 **UI Only** — Page/route exists but backend wiring/business logic is absent  
> - ✅ **Implemented** — Confirmed present in both backend and frontend (excluded from this document)

---

## 1. GLOBAL UI / UX REQUIREMENTS

### 1.1 Per-Page Dynamic Colour Coding
**Status:** 🔴 Not Implemented

Each module page must apply a configurable hex accent colour (set by Admin in Label Settings) to:
- Table headers on that specific page
- Action buttons on that specific page
- Left-panel navigation selected-item highlight

**Requirement:** When Admin sets Delivery page colour = `#FF0000`, every blue element on the Delivery page turns red, including the left-nav selected highlight. This must be driven by CSS custom properties (variables) — no hardcoded colours.

**Missing:**
- No per-page colour configuration in Label Settings UI
- No CSS variable injection system reading from Label Settings API
- No dynamic theme context/store that page components consume

---

### 1.2 Soft Delete Enforcement — Complete Audit
**Status:** 🟡 Partial

The requirement states **no record may ever be permanently deleted** anywhere in the system. While `BaseEntity` has an `Active` flag, several pages and APIs may still expose hard-delete endpoints. Needs a full audit to confirm no `DELETE` HTTP endpoints permanently remove rows.

---

### 1.3 News Feeder / Notification Ticker
**Status:** 🔴 Not Implemented

Top-right header area must show a scrolling news/notification ticker displaying:
- Offline/online status
- System notifications (SignalR-powered real-time alerts)

**Missing:** No ticker/marquee component in the header layout.

---

## 2. DASHBOARD

### 2.1 Dashboard Widget — Sales Trend (Last 7 Days)
**Status:** 🟡 Partial

**Requirement:** Line/Area chart. X-axis = last 7 calendar dates (e.g., "03 Sat, 04 Sun … 09 Fri"). Y-axis = total delivery sales value per day (e.g., 1,300,000–1,800,000).

**Current state:** `DashboardStatsController` exists but the frontend dashboard widget implementation needs verification that it correctly shows **delivery sales value** (not count) for exactly 7 days in the required date-label format.

---

### 2.2 Dashboard Widget — Disposal by Section (Yesterday)
**Status:** 🟡 Partial

**Requirement:** Pie/Donut chart showing disposal **quantity per product category** for **yesterday only**. Each category (Action, Biscuit, Bread, Bun, Butter Cream, Cake Sheets, Drinks, Icing Cake, Party, Pastry, Pieces, Pizza, PR, Rice & Curry, Rotty, Sandwich, Shortbread, Soup) gets a slice with label and value.

**Current state:** Stats endpoint exists but date restriction to "yesterday" and per-category breakdown needs verification.

---

### 2.3 Dashboard Widget — Today Top Deliveries
**Status:** 🟡 Partial

**Requirement:** Two-panel widget — LEFT: table listing Showroom code and today's delivery count sorted descending. RIGHT: matching horizontal bar chart. Only showrooms where `Dashboard = Yes` appear.

**Current state:** Stats controller exists; confirm the dual-panel (table + bar chart) layout and `Dashboard` flag filter are implemented in the UI.

---

### 2.4 Dashboard Widget — Delivery vs Disposal Trend (7 Days)
**Status:** 🟡 Partial

**Requirement:** Grouped bar chart with side-by-side bars per product category — Delivery quantity vs Disposal quantity over the last 7 days.

**Current state:** Needs verification in the frontend chart implementation.

---

## 3. INVENTORY MODULE

### 3.1 Products — `Enable Label Print` Flag Behaviour
**Status:** 🟡 Partial

When a product with `Enable Label Print = TRUE` is selected in the Label Printing Add form, the **Date input box must turn YELLOW** as a visual alert if Admin has configured future-date printing for that product.

**Missing:** The yellow date-box visual indicator logic in the Label Printing Add form.

---

### 3.2 Products — `Require Open Stock` Business Rule Enforcement
**Status:** 🟡 Partial

If `Require Open Stock = Yes`, the product **must have a Stock BF entry each day** before operations can proceed for that product. This validation gate needs to be enforced at the operation entry screens (Delivery, etc.).

---

## 4. SHOWROOM MANAGEMENT

### 4.1 Showroom — `Dashboard` Boolean Field
**Status:** 🟡 Partial

Showroom records must have a `Dashboard` (Yes/No) field controlling whether that showroom appears in the "Today Top Deliveries" dashboard widget.

**Check:** Confirm the `Dashboard` field exists on the Outlet entity, the Add/Edit showroom form, and is filtered in the dashboard API.

---

## 5. OPERATIONS MODULE

### 5.1 Delivery — Access & Date Rules per Role
**Status:** 🟡 Partial

**Requirement matrix:**

| Role | Records Visible | Date Entry |
|---|---|---|
| Admin/SuperAdmin | ALL records, ALL dates | Any date (back or future) |
| Regular User | Own records, Today or future only | Today+ only, back-date BLOCKED |
| Admin-permitted Manager | Configurable | Back-date and/or future as permitted |

**Missing/Uncertain:**
- Centralised middleware at API layer enforcing per-module, per-role date restrictions
- "Show Previous Records" button behaviour for regular users (should be hidden/disabled)
- Admin-granted date exception configuration per user

---

### 5.2 Disposal — Date Rules
**Status:** 🟡 Partial

Regular users: **TODAY only** — no back-date, no future date. Admin can change disposal date only if `Dispos Date Change` system setting = 1.

**Missing:** System setting `Dispos Date Change` enforcement in the Disposal edit form — the date field must be locked for non-admins unless the setting allows it.

---

### 5.3 Transfer — POS Cashier Integration
**Status:** 🟡 Partial

Cashiers can create showroom-to-showroom transfers via the POS front-end. The POS has a `PendingTransfersPage` and `NewTransferPage` — confirm these are wired to the backend Transfer API and go through the approval workflow.

---

### 5.4 Stock BF — `Block Current Date` System Setting
**Status:** 🟡 Partial

System setting `Block current date in Stock BF` (default = 1) must block non-admin users from using today's date in Stock BF entries.

**Missing:** Confirm this setting is read server-side and enforced in the Stock BF creation endpoint.

---

### 5.5 Label Printing — Yellow Date Box Indicator
**Status:** 🔴 Not Implemented

When a product with future-date printing permission is selected, the date input box turns **YELLOW**. This requires:
1. A product-level flag for "Admin has allowed future-date printing"
2. Frontend logic to watch the product dropdown and apply yellow styling on the date field

---

### 5.6 Label Printing — Admin-Permitted Future Date per User
**Status:** 🔴 Not Implemented

The Admin must be able to explicitly grant specific users/managers permission to enter back-dates or future dates for Label Printing. This is distinct from system-wide back-date rules.

**Missing:** No per-user label printing date exception configuration in Security/User management.

---

### 5.7 Showroom Open Stock — Stock As At Date Edit (Roll-Forward)
**Status:** 🟡 Partial

Admin must be able to edit the `Stock As At` date of a showroom's last Stock BF record to roll the opening balance forward (covering days when the showroom was closed).

**Requirement:** List view shows Showroom code + `Stock As At` date (editable). Edit action changes only the date of the existing record — it does NOT create a new record.

**Check:** Confirm this specific date-roll-forward behaviour is implemented (not just a standard edit form).

---

### 5.8 Showroom Label Printing — Auto-Fill Text 1
**Status:** 🟡 Partial

Selecting a showroom from the dropdown must **auto-fill Text 1** with the showroom code. Confirm this auto-populate behaviour in the frontend form.

---

## 6. REPORTS MODULE

### 6.1 Complete Reports Module
**Status:** 🔴 Mostly Not Implemented

The `/reports` route exists but the full reports module is largely missing functional report generation. All reports must support: **on-screen paginated view, Print Preview, PDF Download, Excel Export**.

**Required report groups and reports:**

| Group | Report | Status |
|---|---|---|
| General | Opening Balance | 🔴 |
| General | Service Charges | 🔴 |
| General | Unloading Plan | 🔴 |
| Cashier | Cashier Balance Report | 🔴 |
| Cashier | Daily Cashier Reconciliation | 🔴 |
| Sales | Daily Sales Summary | 🔴 |
| Sales | Weekly Sales Trend | 🔴 |
| Sales | Product-wise Sales | 🔴 |
| Sales | Showroom-wise Sales | 🔴 |
| Delivery | Delivery Note (per outlet per turn) | 🟡 Partial |
| Delivery | Delivery Summary | 🟡 Partial |
| Delivery | Delivery vs Disposal Comparison | 🔴 |
| Disposal | Daily Disposal by Showroom | 🔴 |
| Disposal | Disposal by Category | 🔴 |
| Disposal | Disposal Trend | 🔴 |
| Production | Daily Production Planner (per section) | 🟡 Partial |
| Production | Stores Issue Note (per section) | 🟡 Partial |
| Production | Production Summary | 🔴 |
| Production | Recipe Card (per product) | 🔴 |
| Production | Ingredient Requirements | 🔴 |

### 6.2 Report Date Access Restriction (HARD RULE)
**Status:** 🔴 Not Implemented

**Non-negotiable requirement:** Reports for dates **before the last submitted Day-End Process** are completely blocked for ALL users including Admin. This lock must be enforced at the API layer.

**Missing:** The report API endpoints must check the last Day-End Process date and reject requests for earlier dates.

### 6.3 Two-Panel Report Layout
**Status:** 🔴 Not Implemented

Reports page uses a **two-panel layout**: Report Group list on the left → clicking a group filters the Report List on the right. The current `/reports` page structure needs to be built to this specification.

---

## 7. ADMINISTRATOR MODULE

### 7.1 Day-End Process — Complete Implementation
**Status:** 🟡 Partial

**Missing behaviours:**

| Rule | Status |
|---|---|
| Default date = PREVIOUS day (not today) auto-selected on page load | 🟡 Check |
| ALL Day-End fields + submit DISABLED if Cashier Balance not yet approved for that date | 🔴 Missing |
| Day-End completely blocked if the date is Day-Locked | 🟡 Check |
| Form: checkbox per showroom, showroom name, cashier dropdown (active cashiers for that showroom), Cashier Balance input, System Balance (auto-calculated), Status column | 🟡 Check |

---

### 7.2 Cashier Balance — `Showroom Is Closed` Checkbox
**Status:** 🔴 Not Implemented

**Critical new field** explicitly called out in requirements as not existing before:

- New checkbox `Showroom Is Closed` must appear **between** the Showroom field and the Cashier Name dropdown
- When checked: Cashier Name dropdown CLEARED and DISABLED; Cashier Balance CLEARED and DISABLED; closure record sent to Approvals queue
- When `Cashier Balance` text box is blank (Null): Cashier Name dropdown auto-DISABLED
- On page load: ALL active showrooms auto-selected (checkboxes pre-ticked); user CANNOT uncheck any showroom
- If already submitted for the selected date: ENTIRE form is TOTALLY DISABLED (read-only)
- Default date = previous day auto-selected on load

---

### 7.3 System Settings — All Five Required Settings
**Status:** 🟡 Partial

The five required system settings must exist with correct default values and must be **enforced at the API layer** (not just UI):

| Setting | Default | Enforcement Point |
|---|---|---|
| `Dispos Date Change` | 0 | Disposal edit — date field lock |
| `Delivered Date Change` | 0 | Disposal edit — delivered date field lock |
| `Block current date in Stock BF` | 1 | Stock BF create — date validation |
| `Day Locking for non-admins` | 1 | Day Lock page — lock action |
| `Day UnLocking for non-admins` | 0 | Day Lock page — unlock action |

**Check:** Confirm all 5 exist in seeded data and are read server-side in respective endpoints.

---

### 7.4 Label Settings — Three Sections + Per-Page Colour
**Status:** 🟡 Partial

Label Settings page must have exactly **three sections**:

1. **Defined Label Printers** — list with Printer Name + Edit icon, `Add Printer` button. Known printers: `ZTMC`, `Datamax 33835 BPL`, `Datamax 33220 650dpi DPL`, `Datamax TLP 3842 test`
2. **Set Template to Printer** — maps each label template to a printer. Known templates: `40×17 mm`, `40×17 mm Large`, `50×40 sandwich`, `50×45`, `55×26 (Rice & Curry)`, `60×40`, `Medium Label Only Max Date`, `Showroom Label`, `50×26 Chocolates Ref`, `60×50 Fruit Cake Label`
3. **Defined Label Printing Comments** — pre-defined comment text with `Add Comment` button. Known: `KEEP UNDER REFRIGERATION`, `NO RICE`, `WHITE RICE`, `FISH`, `CONTAINS`

**Missing:** Per-page colour configuration section (required for §1.1 colour-coding feature).

---

### 7.5 Administrator Delivery Plan
**Status:** 🟡 Partial

**Required rules:**

| Rule | Status |
|---|---|
| Only FUTURE dates selectable (today + back-dates BLOCKED) | 🟡 Check |
| Maximum 3 days ahead only | 🔴 Missing |
| Delivery time auto-set to 5:00 AM on submission (user cannot change it) | 🔴 Missing |
| Pre-loaded plans displayed grouped by schedule (e.g., "Thursday Friday – 5.00am") | 🟡 Check |
| Submitting a Delivery Plan auto-creates **pending Delivery records** in the Delivery operation table | 🔴 Not confirmed |

---

### 7.6 Security — Missing Role Groups
**Status:** 🟡 Partial

**Roles and Capabilities Tab** — currently missing these role groups:

| Role Group | Status |
|---|---|
| Asst Sales Manager | 🔴 |
| Finance | 🔴 |
| Data Entry | 🔴 |
| Pro & Stk Adj Only | 🔴 |
| Reports | 🔴 |
| Delivery Only | 🔴 |

---

### 7.7 Day Lock — Hard Lock at API Middleware Layer
**Status:** 🟡 Partial

**Requirement:** Once a day is locked, **no user at ANY role level — including Admin** — can create or edit ANY record for that date. Enforced at API middleware, not just UI.

**Missing:** A global API middleware that intercepts all Create/Update operations, extracts the record date, and rejects if that date is locked.

---

### 7.8 Approvals Hub — Missing Operations
**Status:** 🟡 Partial

Approvals hub must support all **14 configurable operations**:

| Operation | Status |
|---|---|
| Daily Production | 🟡 |
| DayEnd Process Balance | 🟡 |
| Delivery | 🟡 |
| Delivery Cancel | 🟡 |
| Delivery Return | 🟡 |
| Disposal | 🟡 |
| End Process | 🟡 |
| Label Printing | 🟡 |
| Production Cancel | 🟡 |
| Production BF (Stock Adjustment) | 🟡 |
| Stock BF | 🟡 |
| Stock Transfer | 🟡 |
| **Cashier Balance** | 🔴 Not in approvals hub |
| **Showroom Label Printing** | 🔴 Not in approvals hub |

---

### 7.9 Showroom Employee — Approval Workflow Gate
**Status:** 🟡 Partial

New employees require `Approved = Pending` status and must go through an approval workflow before they can be used (assigned to cashier balance, day-end). Confirm this approval gate is implemented and enforced.

---

### 7.10 Price Manager — Auto-Activation via Scheduled Job
**Status:** 🟡 Partial

**Requirements:**
- Future date scheduling: price update **activates automatically** on the `effective_from` date (requires Hangfire scheduled job)
- Audit trail: every change permanently logged with old price, new price, effective date, user, timestamp
- List view columns: Effected From, Effected To, Comment, User, Edit Date, Edit icon, Refresh icon

**Missing:** Automatic price activation via Hangfire job on `effective_from` date.

---

### 7.11 WorkFlow Config — Showroom Label Printing Entry
**Status:** 🔴 Not Implemented

The WorkFlow Config table must include `Showroom Label Printing` as the 14th configurable operation. Currently only 13 operations may be present.

---

## 8. PRODUCTION MODULE

### 8.1 Current Stock — Exact Live Calculation Formula
**Status:** 🟡 Partial

**Exact formula required (approved records only):**

```
Today Balance = Open Balance
              + Today Production
              - Today Production Cancelled
              - Today Delivery
              + Delivery Cancelled
              + Delivery Returned
```

Each component must count **only approved** records. Confirm this exact formula is implemented in `CurrentStockService`.

---

### 8.2 Production Plan — Pre-Loaded Summary UI
**Status:** 🟡 Partial

When creating a new Production Plan, a UI for entering **Pre-Loaded Production Summaries** (product quantities per showroom) must be provided as a grid/matrix entry interface.

**Check:** Confirm the Production Plan add form includes this pre-loaded summary grid.

---

### 8.3 Production Plan — Recipe Sheet Generation Per Section
**Status:** 🟡 Partial

Once a Production Plan is confirmed, the system must generate **recipe sheets per production section** following the two-layer model:

1. **Per-Item Recipe:** ingredient qty per 1 unit of product
2. **Calculated Recipe:** Per-Item Qty × Production Qty = Total Ingredient Required
3. **Stores Issue Version (separate view):** Total + Extra/Waste Allowance — shown **ONLY** to stores staff, NOT on the production floor sheet

**Missing/Unconfirmed:**
- Stores Issue Note correctly excludes extra qty from the production view
- Section-by-section recipe sheet generation per confirmed plan
- PDF output per section matching Excel print layout with signature lines

---

### 8.4 Recipe Engine — Full/Mini Variant Calculation
**Status:** 🟡 Partial

Products with both Full and Mini variants must have **separate recipe calculations** per variant. Confirm the calculation engine correctly handles separate Full vs Mini production quantities when computing ingredient totals.

---

### 8.5 Recipe Engine — Sugar Candy Bun Dual Sub-Recipe
**Status:** 🟡 Partial

Sugar Candy Bun type items have **two named sub-recipes** (Dough + Bun). Both are calculated separately and displayed in two distinct sub-tables in the production planner and stores note.

**Check:** Confirm `RecipeTemplate` / `RecipeComponent` entities support named sub-recipes and the planner UI renders them as separate sub-tables.

---

### 8.6 Recipe Engine — Percentage-Based Ingredients
**Status:** 🟡 Partial

Some ingredients are percentage-based:
```
qty = (percentage / 100) × Source_Product_Total_Qty
```

**Check:** Confirm this calculation path exists in `RecipeService` and `ProductionPlannerService`.

---

### 8.7 Recipe Engine — Extra Quantity (Stores-Only)
**Status:** 🟡 Partial

Each recipe line has `extra_qty_per_unit`. On the Stores Issue Note:
```
Stores Qty = (Recipe Qty per unit × Production Qty) + (Extra Qty per unit × Production Qty)
```
The extra qty must **not appear** on the production floor sheet.

**Check:** Confirm `StoresIssueNoteService` adds extra qty and the production planner endpoint excludes it.

---

### 8.8 Production Sections — Dynamic Sub-Tables
**Status:** 🟡 Partial

Admin must be able to add dynamic calculation sub-tables per section (e.g., Pattie Dough, Chinese Roll Batter, Egg Wash, Rotty Dough). These are blocks with their own ingredient formula rules separate from the main recipe.

**Check:** Confirm `SectionConsumable` management covers this, or if a dedicated "section calculation block" feature is needed.

---

### 8.9 Delivery Turn — Per-Section Production Timing
**Status:** 🟡 Partial

Each delivery turn, per production section, must store:
- `production_start_time` (can be previous calendar day — e.g., 8:00 PM previous night)
- `effective_delivery_time`

The production planner sheet header must display these times. Confirm the DeliveryTurn ↔ section timing linkage is fully implemented and surfaced in the planner UI.

---

### 8.10 Freezer Stock — Available Balance Deduction (Stores Only)
**Status:** 🟡 Partial

```
Stores Available Qty = Grand Total − Freezer Stock Balance
```
Only on Stores Issue Note when admin enables it. Production sheet always shows full total.

**Check:** Confirm the "Use Freezer Stock" toggle correctly deducts from Stores Issue Note only, with no effect on the production floor view.

---

### 8.11 Egg-to-Beehive Equivalence Calculation
**Status:** 🔴 Not Implemented

In the Bakery section, Beehive is measured in grams. Its egg-as-butter equivalence is displayed as a footnote:
```
Beehive_g ÷ 30 = egg equivalence
```
Display: `SUM × 30g (Egg = Butter)` at the bottom of the Bakery production sheet.

---

### 8.12 Rounding Engine per Product
**Status:** 🟡 Partial

If `rounding_value = 5` for a product: calculated total is rounded up to nearest 5. Standard reference quantity shown alongside (e.g., "Standard: 4 patties per 1 egg garnish"). Rounding applied per item in the production planner.

**Check:** Confirm `RoundingRuleService` is integrated into the production planner calculation output.

---

### 8.13 Multi-Turn Item Configuration
**Status:** 🟡 Partial

Admin must configure which products are available in which delivery turns. Items not in a turn are hidden from that turn's order entry grid.

**Check:** Confirm this per-product, per-turn availability flag exists and is enforced in order entry.

---

### 8.14 Vegetable Curry — Selectable Recipe Template
**Status:** 🟡 Partial

Vegetable Curry products use a selectable curry type — the recipe loads from predefined templates when the product is created. Template can then be overridden per product.

**Check:** Confirm `RecipeTemplate` → `product_recipe_template_links` chain is implemented and the template loader button functions in the recipe editor UI.

---

## 9. POS MODULE

### 9.1 Cashier Balance Submission via POS
**Status:** 🟡 Partial

POS has a `CashSubmissionPage`. Confirm this feeds into the `Cashier Balance` admin module and goes through the standard approval workflow (not a separate unlinked flow).

---

### 9.2 Delivery Cancellations via POS
**Status:** 🔴 Not Confirmed

Per requirements, POS cashiers can create Delivery Cancellations. The POS has Transfer, Stock BF, and Delivery Return pages, but no Delivery Cancellation page is confirmed.

**Missing:** A Delivery Cancellation screen in the POS application.

---

## 10. CROSS-CUTTING / INFRASTRUCTURE

### 10.1 SignalR Real-Time Notifications
**Status:** 🔴 Not Implemented

Required for:
- Real-time order notifications (immediate order received → notify production)
- System-wide notification ticker in the header

**Missing:** No SignalR hub registered in the backend, no WebSocket client in the frontend.

---

### 10.2 Hangfire Scheduled Jobs
**Status:** 🔴 Not Implemented

Required scheduled jobs:
1. **Auto-generate next day's plan** from defaults at midnight
2. **Auto-activate price changes** on their `effective_from` date (Price Manager)

**Missing:** No Hangfire configuration in the backend startup/program.

---

### 10.3 Redis Caching
**Status:** 🔴 Not Implemented

Phase 6 requirement: Redis for frequently-read master data and session management. `MemoryCacheService` exists (in-process only) but Redis is not configured.

---

### 10.4 Audit Log — Immutable & Full Coverage
**Status:** 🟡 Partial

Every create/update/delete must be logged with old values JSON, new values JSON, user ID, full timestamp. `AuditLogService` exists but confirm it is wired as middleware on **all** entity mutations — not selectively applied.

---

### 10.5 Optimistic Concurrency on Production Plan
**Status:** 🔴 Not Implemented

ETag-based optimistic concurrency on production plan saves to prevent overwrite conflicts when multiple users edit simultaneously. The conflict resolution UI must show which user last edited.

**Missing:** No ETag/RowVersion on `ProductionPlan` entity, no concurrency conflict handling in the API.

---

### 10.6 Day Lock — API Middleware Enforcement
**Status:** 🔴 Not Implemented at middleware level

Day Lock enforcement must be at the **API middleware layer**, not just the UI. A global middleware must intercept all POST/PUT requests, extract the record date, and reject if that date is locked.

---

### 10.7 Bulk Excel Import — Validation Report
**Status:** 🟡 Partial

`/dms/importer` and `/dms/dms-recipe-upload` pages exist but confirm the import tool produces a **per-item validation report** comparing migrated data vs the source Excel, covering:
- Product master data
- Historical delivery/disposal/production records
- Recipe data

---

### 10.8 Report Date Lock (Day-End Restriction)
**Status:** 🔴 Not Implemented

Reports for dates **before the last submitted Day-End Process** are completely blocked for all users including Admin. This must be enforced at the API layer on all `/reports/*` endpoints.

---

### 10.9 PDF Export — Excel Layout Parity
**Status:** 🔴 Not Implemented

PDF output must match existing Excel print layouts exactly — same margins, font sizes, column widths, signature lines. Required for:
- Delivery Note (per outlet per turn)
- Production Planner per section (with sub-tables: Pattie Dough, Egg Wash, Chinese Roll Batter, etc.)
- Stores Issue Note per section
- Immediate Orders Summary

**Current state:** `PrintService` and `PrintController` exist but actual server-side PDF generation with Excel-matching layouts is not confirmed.

---

### 10.10 Excel Export on All Reports
**Status:** 🔴 Not Implemented

All reports must support Excel (`.xlsx`) export in addition to PDF. No Excel export service is confirmed in the backend.

---

## 11. SPECIFIC BUSINESS RULES — NOT YET ENFORCED AT API LAYER

These rules are defined in the requirements but their API-level enforcement is unconfirmed or missing:

| Rule | Module | Status |
|---|---|---|
| Regular user sees ONLY own records in ALL operation modules | All Operations | 🟡 Check |
| Back-date up to 3 days for Transfer, Stock BF, Cancellation, Delivery Return (regular users) | Operations | 🟡 Check |
| Future date BLOCKED for Transfer, Stock BF, Cancellation, Delivery Return (regular users) | Operations | 🟡 Check |
| Disposal regular user: TODAY only, no back-date, no future | Disposal | 🟡 Check |
| Label Printing regular user: back-date AND future BLOCKED by default | Label Printing | 🟡 Check |
| Delivery regular user: today and future (Today+) allowed, back-date BLOCKED | Delivery | 🟡 Check |
| Day-End blocked if Cashier Balance not approved for that date | Day-End | 🔴 |
| Showroom Is Closed → auto-disable cashier fields + send to Approvals | Cashier Balance | 🔴 |
| Price change auto-activates on `effective_from` date | Price Manager | 🔴 |
| WorkFlow Config approval toggle actually disables/enables approval requirement | WorkFlow Config | 🟡 Check |
| Inactive categories do NOT appear in product creation dropdowns | Inventory | 🟡 Check |
| Inactive ingredients hidden from recipe editors | Production | 🟡 Check |
| Inactive showrooms hidden from all operation dropdowns | All Operations | 🟡 Check |
| Cashier Balance Null → Cashier Name dropdown auto-disabled | Cashier Balance | 🔴 |
| All active showrooms auto-selected on Cashier Balance new entry | Cashier Balance | 🔴 |
| Label Printing: only products where `Enable Label Print = TRUE` shown in selection | Label Printing | 🟡 Check |
| Day Lock hard block at API level (not just UI) for ALL roles including Admin | All Modules | 🔴 |
| Showroom Calendar page is COMPLETELY REMOVED — no route, no menu item | Administrator | 🟡 Check |

---

## 12. PRIORITY SUMMARY

### 🔴 Critical — Blocking Core Operations
1. **Cashier Balance — `Showroom Is Closed` field** (new field; downstream impacts on Day-End, Approvals, Reports)
2. **Day-End blocked by Cashier Balance approval** — core workflow gate
3. **Day Lock enforcement at API middleware layer** — absolute data integrity rule
4. **Report date lock (Day-End restriction)** — non-negotiable data integrity
5. **SignalR real-time notifications** — production workflow depends on it

### 🟠 High Priority — Core Features Missing
6. Full **Reports Module** — 14+ reports with PDF + Excel export
7. **Per-page dynamic colour coding** system (CSS variables driven by Label Settings)
8. **Hangfire jobs** — price auto-activation + midnight next-day plan generation
9. **WorkFlow Config** — add Cashier Balance + Showroom Label Printing as the 13th and 14th operations
10. **Approvals Hub** — add Cashier Balance + Showroom Label Printing approval flows
11. **PDF generation** with Excel layout parity (Delivery Note, Production Planner, Stores Issue Note)

### 🟡 Medium Priority — Business Rule Enforcement
12. API-layer enforcement of all per-role, per-module date restriction rules
13. `Dispos Date Change` / `Delivered Date Change` / `Block current date in Stock BF` system settings enforced server-side
14. Production Plan → auto-create pending Delivery records on submission (Admin Delivery Plan)
15. Delivery Plan — maximum 3 days ahead + 5:00 AM auto-set enforcement
16. Label Printing — yellow date box + admin-permitted future-date per user
17. Egg-to-Beehive equivalence footnote in Bakery production sheet
18. POS — Delivery Cancellation screen

### 🔵 Lower Priority — Polish & Infrastructure
19. Redis caching (Phase 6)
20. Optimistic concurrency (ETag) on Production Plan saves
21. News/notification ticker in header
22. Bulk Excel import per-item validation report
23. Missing role groups (Finance, Data Entry, Reports, Delivery Only, Asst Sales Manager, Pro & Stk Adj Only)
24. Showroom Calendar — confirm the route/menu item is fully removed

---

*End of Document — Don & Sons (Pvt) Ltd. · DMS Final Implementation Gap Analysis · 2026-05-05*
