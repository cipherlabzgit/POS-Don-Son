# Excel Workbook Parity — Implementation Plan
## Mapping `5.00AM Delivery Production (1).xlsm` → DMS System

> **Purpose**: Close the gap between the legacy Excel macro-driven workflow and the DMS system. This document lists every partially-covered and not-covered feature surfaced during the deep workbook audit, organised into actionable backlog items with acceptance criteria, schema/UI/API impacts, and priority.
>
> **Source of truth (sample)**: `5.00AM Delivery Production (1).xlsm` (29 sheets, 62 VBA modules).
> **Companion docs**: `IMPLEMENTATION_PLAN.md`, `DMS_ENHANCEMENTS_SUMMARY.md`, `ENHANCED_FEATURES_IMPLEMENTED.md`.

---

## ⚠️ Critical Scope Note — This is ONE of MANY Turn Workbooks

The `5.00AM Delivery Production (1).xlsm` file is **only the 5:00 AM turn**. In live operations there are **four to five separate workbooks per day**, one per delivery turn:

| # | Turn | Likely Workbook | Day-Type Set Used |
|---|---|---|---|
| 1 | **5:00 AM** | `5.00AM Delivery Production.xlsm` ✅ audited | Morning day-types (Weekdays, Sat, Sun, Poya, AprNewYear, Curfew) |
| 2 | **6:00 AM** | `6.00AM Delivery Production.xlsm` ❓ not yet sourced | Morning day-types |
| 3 | **10:30 AM** | `10.30AM Delivery Production.xlsm` ❓ not yet sourced | Morning + Mid-day day-types |
| 4 | **1:30 PM / 2:30 PM** | `2.30PM Delivery Production.xlsm` ❓ not yet sourced | Afternoon day-types (Mon-Wed, Thu-Fri, Sat Extra, Sun Extra, Weekdays Extra) |
| 5 | **3:30 PM** | `3.30PM Delivery Production.xlsm` ❓ not yet sourced | Afternoon day-types |

### What this changes about the plan

1. **Turn is a first-class dimension everywhere.** Every plan, planner, stores issue note, print bundle, recipe calculation, default-quantity template, dashboard filter, and rounding rule must be addressable per `(turn × day-type × outlet × product)`. The plan below already treats turn this way — but the *prototype must demonstrate it for at least 2 turns* (5 AM + 2:30 PM) to prove the pattern.
2. **Day-type sets differ per turn.** Morning turns use one day-type vocabulary; afternoon turns use another (with the `*-Extra` variants). The Day-Type master (Task E1.1) must let an admin tag each day-type as `applies_to_morning` and/or `applies_to_evening`, and the turn picker must filter day-types accordingly.
3. **Cross-midnight only applies to the 5 AM (and possibly 6 AM) turn.** The `is_previous_day` flag on a turn is per-turn metadata, not per-product.
4. **A reconciliation report is required per turn**, not just for 5 AM (Task E8.2).
5. **Prototype must include a turn switcher** at the top of Order Entry, Delivery Plan, Production Planner, Stores Issue Note, and Reports — so the same UI serves all five turns.

### New prerequisite task

### Task E0.1 — Acquire and audit the remaining turn workbooks ⛳ P0
- [ ] Obtain `6.00AM`, `10.30AM`, `2.30PM`, `3.30PM` workbooks from operations
- [ ] Run the same sheet-by-sheet + VBA audit performed on the 5 AM file
- [ ] Diff each workbook against the 5 AM baseline; record turn-specific:
  - Day-types
  - Product subset (e.g., 6 AM may only carry Plain Roll items)
  - Section subset
  - Rounding rules
  - Recipe overrides
  - Print layouts
- [ ] Output: append a per-turn delta table to this document
- [ ] Acceptance: every turn-specific behaviour discovered is mapped to an existing or new task below

### Tasks affected by multi-turn reality (no change in priority, only in test scope)

| Task | Multi-turn note |
|---|---|
| E1.1 Day-Type master | Add `applies_to_morning` + `applies_to_evening` flags + filter UI |
| E1.2 Delivery Turns | Already P0 — confirm the 6 AM, 1:30/2:30 PM, 3:30 PM rows are seeded |
| E1.3 Product seed | Each product needs `available_in_turns[]` (subset of all turns) |
| E1.4 Recipe seed | Recipes must support per-turn overrides if any are discovered in E0.1 |
| E2.1 Plain Roll mode | Mode is per-turn; default-on for 6 AM, off for others |
| E2.4 Cross-midnight | `is_previous_day` is per-turn metadata (5 AM yes, others no) |
| E3.x Section tabs | Each section tab in Production Planner must be turn-scoped |
| E4.x Reports | Every report needs a turn filter; combined section print is per-turn |
| E5.2 Calculation breakdown | Must show per-turn split (already in plan — confirm UI) |
| E7.3 Per-turn Y/N | Already turn-aware — add UI prototype for all 5 turn columns |
| E8.1 Importer | Importer must accept multiple xlsm files (one per turn) and de-dupe shared masters |
| E8.2 Reconciliation | One reconciliation report per turn |

---

## Legend

| Tag | Meaning |
|---|---|
| **P0** | Blocking parity — must ship before Excel can be retired |
| **P1** | High-value parity — schedule in next sprint |
| **P2** | Nice-to-have parity — schedule when bandwidth allows |
| **DB** | Requires database migration |
| **API** | Requires backend endpoint(s) |
| **UI** | Requires frontend page/component |
| **Seed** | Requires seed-data update |
| **Report** | Requires a report definition |

---

## Phase E1 — Master Data & Domain Model Parity (P0)

### Task E1.1 — User-managed Day-Type master ⛳ P0 · DB · API · UI · Seed
**Why**: The xlsm has 6 morning + 8 afternoon day-types (`Mon-Wed`, `Thu-Fri`, `Sat`, `Sun`, `Poya`, `April New Year`, `Curfew`, `Weekdays Extra`, `Saturday Extra`, `Sunday Extra`). DMS hard-codes 5 (`Weekday/Saturday/Sunday/Holiday/Special Event`).

- [ ] Create `day_types` master table: `id, code, display_name, applies_to_morning, applies_to_evening, is_extra_variant, sort_order, is_active`
- [ ] Migrate existing enum usages in `outlet_default_quantities`, `delivery_plans`, `delivery_plan_items` to FK
- [ ] Seed values: `MON_WED`, `THU_FRI`, `SAT`, `SUN`, `POYA`, `APR_NEW_YEAR`, `CURFEW`, `WEEKDAYS_EXTRA`, `SATURDAY_EXTRA`, `SUNDAY_EXTRA`
- [ ] Backend: `GET/POST/PUT/DELETE /api/day-types` (Admin only)
- [ ] Frontend: `Administrator → Day-Type Manager` page
- [ ] Update Day-Type pickers in `dms/delivery-plan`, `dms/default-quantities`, `dms/order-entry-enhanced` to read from master
- [ ] Acceptance: Admin can add `Vesak Poya`, `Christmas`, `Curfew Day 2` etc. without code change; existing plans continue to work via FK

### Task E1.2 — Configurable Delivery Turns including 6:00 AM ⛳ P0 · DB · Seed · UI
**Why**: xlsm has 5 turns (5 AM, **6 AM**, 10:30 AM, 1:30/2:30 PM, 3:30 PM). System currently seeds 3.

- [ ] Add `06_00_AM` and `01_30_PM` (or `02_30_PM`) to `delivery_turns` seed
- [ ] `delivery_turns` schema must already support arbitrary turns — verify CRUD UI in `Administrator → Delivery Turns`
- [ ] Add `is_secondary_morning` flag to differentiate 5 AM (primary) vs 6 AM (secondary)
- [ ] Production planner must render the 6 AM column when products opt in
- [ ] Acceptance: A product (e.g., `Fish Bun`, `Chicken Bun`) can be scheduled for 6 AM only; planner shows distinct 6 AM ingredient totals

### Task E1.3 — Seed actual product master from xlsm SKU list ⛳ P0 · Seed
**Why**: xlsm uses specific codes (BR1–BR11, BU1–BU20, PTY1–PTY14, SAN1–SAN10, SE1–SE14, RO1–RO6, PS1–PS7, PZ1–PZ3, PR5). System uses generic placeholders.

- [ ] Extract full product list from `Order` and `Recipe Per Item` sheets (~80 SKUs)
- [ ] Capture: code, name, section, full/mini variants, rounding value, decimal flag, default delivery turns
- [ ] Add missing items confirmed in audit:
  - `BR8 Currant Bread`, `BR11 Butter Bread`, `BR9 Kurakkan Sandwich Slice Pack`
  - `BU…` Soya Bun, Dinner Bun (35g)
  - `RO5 / RO6` Beef Rotty
  - `Roast Bread M`, `Burger Bun`, `Viyana Roll`
- [ ] Seed `products`, `product_variants`, default `delivery_turn_sections`
- [ ] Acceptance: All Excel SKUs present in DMS product master with correct codes

### Task E1.4 — Seed ingredients & recipes from `Recipe Per Item` ⛳ P0 · Seed
**Why**: xlsm contains the canonical recipes (Filling Section, Bakery, Curry, Vegetable Curry, Pastry, Dough). DMS recipe library must match.

- [ ] Extract ingredient list (~127 items) from `Recipe Per Item`, `Filling Section`, `Bakery Recipe Per Item`, `Recipe for Curry Items`, `Patties Doudgh`, `Doughs`
- [ ] Seed `ingredients` master with UoM and standard cost
- [ ] Seed `product_recipes` per product with per-unit weights
- [ ] Encode percentage-based ingredients (e.g., `Carrot 14% Extra`, `Cabbage 12.5% Extra`) using `is_percentage`
- [ ] Acceptance: For any product the calculated ingredient totals match the Excel `Calculation` and `Bakery Recipe Calculation` sheets to within rounding tolerance

### Task E1.5 — Outlet master incl. SRP and DAL-BBQ variant ⛳ P0 · DB · Seed
**Why**: xlsm references `SRP` route (Sripath) and a `DAL BBQ` sub-variant of DAL.

- [ ] Verify all 14 outlets present: `DBQ, SJE, YRK, KEL, BC, SGK, KML, BWA, RAG, KDW, WED, RAN, DAL, SRP`
- [ ] Add `outlet_variant` table (or `parent_outlet_id` self-FK) to model `DAL → DAL BBQ`
- [ ] Update Order Entry Grid to render variant columns where applicable
- [ ] Acceptance: Order Entry shows DAL and DAL BBQ as adjacent columns; aggregations roll up to DAL parent

---

## Phase E2 — Workflow & Mode Parity (P0/P1)

### Task E2.1 — Plain Roll Production mode ⛳ P0 · UI · API
**Why**: xlsm `PlainRollProductionButton_Click` locks every cell except the 14 plain-roll items.

- [ ] Add `production_mode` enum: `Standard | PlainRoll | AnytimeAdHoc`
- [ ] Add `is_plain_roll_item` flag (or section tag) on products: Plain Roll, Seeni Sambol Bun, Fish Bun, Cuttlefish Bun, Chicken Sausage Bun, Egg Bun, Omelette Bun, Egg Burger, Fish Curry Bun, Hot Dog, Honey Sausage Bun, Cheese Chicken Curry Bun, Chicken Bun, Prawn Bun, Dinner Bun
- [ ] Order Entry Grid: add a "Mode" pill/toggle. When `PlainRoll` is active, gray-out non-plain-roll rows and disable input
- [ ] Production Planner: filter sections to show only Plain Roll
- [ ] Acceptance: Switching mode on Order Entry hides irrelevant items just like the Excel `PlainRollProductionButton`

### Task E2.2 — Anytime Recipe Generator (ad-hoc single-product run) ⛳ P1 · UI · API · Report
**Why**: xlsm `AnyTimeRecipeButton_Click` writes current date+time to O11/O12 and runs a one-off recipe printout for a selected product/qty without a delivery plan.

- [ ] New page: `dms/anytime-recipe-generator`
- [ ] Inputs: product, quantity, optional remarks
- [ ] Output: instant ingredient breakdown card with timestamp + operator name; prints to PDF
- [ ] No DB writes other than an audit log entry (`anytime_recipe_runs`)
- [ ] Acceptance: User can print a "Vegetable Pizza × 50" card at any time; record appears in audit log

### Task E2.3 — Single-product Printing Receipt cards (multi-up tickets) ⛳ P1 · Report · UI
**Why**: xlsm `Printing Receipt` sheet has 10 small cards side-by-side (Vegetable Pizza, Chicken Pizza, Sausage Pizza, Egg Bun, Omelette Bun, Egg Burger, Chicken Hot Dog, Cuttlefish Bun, Honey Sausage Bun, +1 generic).

- [ ] Add a report template `Production Receipt — Multi-up`
- [ ] Layout: 2 × 5 grid of small cards on one A4 page
- [ ] Each card = product header + qty + recipe table + operator/date footer
- [ ] Selectable from Production Planner (multi-select products → "Print Receipt Cards")
- [ ] Acceptance: PDF output visually matches the xlsm `Printing Receipt` layout

### Task E2.4 — Cross-midnight production timing UI ⛳ P1 · UI
**Why**: xlsm shows "Production Starting Time = previous day 2:00 PM, Effective Delivery Time = next day 5:00 AM". Schema (`is_previous_day`) supports it; UI does not surface the label.

- [ ] In `production-planner-enhanced` and `stores-issue-note-enhanced`, render a `(Previous Day)` chip/icon next to start time when `is_previous_day = true`
- [ ] Show effective delivery date alongside production start date
- [ ] Acceptance: A 5 AM Wed plan shows Production Start = `Tue 11:00 PM (Previous Day)`, Delivery = `Wed 5:00 AM`

### Task E2.5 — Per-route Extra columns in Delivery Summary / Order Entry ⛳ P2 · DB · UI
**Why**: xlsm afternoon grid has separate `Extra` columns *per route* (e.g., `DBQ Extra`).

- [ ] Decision: confirm with business whether per-route extra is needed (vs single global extra)
- [ ] If yes: add `extra_full / extra_mini` to `delivery_plan_outlet_quantities`
- [ ] Render an "Extra" sub-column under each outlet column in Order Entry afternoon view
- [ ] Roll up to global Extra in Delivery Summary
- [ ] Acceptance: Per-route extras editable; global Extra equals sum of per-route extras

### Task E2.6 — Curfew & Holiday-style emergency mode ⛳ P2 · UI
**Why**: xlsm exposes `MorningCurfewButton`, `EveningCurfewDeliveryButton` as a top-level mode with its own delivery summary and curry sheet.

- [ ] Make `Curfew` a selectable Day-Type (covered in E1.1)
- [ ] Add an "Emergency Mode" banner on the Home dashboard when an active plan uses `CURFEW` day-type
- [ ] Acceptance: Selecting Curfew day-type triggers the emergency banner and unlocks Curfew default-quantity templates

---

## Phase E3 — Production Planner Section Coverage (P0)

### Task E3.1 — Add Curry Section tab ⛳ P0 · UI · API
**Why**: xlsm has dedicated `Curry Sheet` with 15+ curry items (Fish Cutlet, Egg Cutlet, Fish Pattie, Fish Bun, Fish Chinese Roll, Vegetable Chinese Roll, Chicken Curry, Vegetable Curry, Egg & Fish Chin. Curry, Fish Pastry, Cheese Chicken Pastry, Seafood Pie, Chicken Pie, Chicken Sausage Pastry, Bacon Pastry).

- [ ] Add `Curry Section` to `production_sections` master
- [ ] Tag relevant products with this section
- [ ] `dms/production-planner-enhanced`: render Curry Section tab with horizontal item layout + total ingredient row
- [ ] Stores Issue Note + Reports must include Curry Section
- [ ] Acceptance: Curry Section tab matches the xlsm `Curry Sheet` totals

### Task E3.2 — Add Vegetable Curry Section tab ⛳ P1 · UI · API
**Why**: xlsm has separate `Vegetable Curry Sheet` (Vegetable Cutlet, Vegetable Pattie, Vegetable Chinese Roll, Vegetable Pastry, Vegetable Burger Mini).

- [ ] Add `Vegetable Curry Section` to `production_sections`
- [ ] Tag vegetable products
- [ ] Add tab to Production Planner
- [ ] Acceptance: Tab renders independently of Curry Section, with own start time

### Task E3.3 — Patties Dough Generator panel ⛳ P1 · UI · API
**Why**: xlsm `Patties Doudgh` sheet has a "Nos 01" multiplier auto-scaling Flour 18 / Beehive 3.5 / Salt 0.25 / Eggs 0.017.

- [ ] New mini-tool page: `dms/dough-generator/patties`
- [ ] Inputs: number of "Nos 01" units → outputs total ingredient quantities
- [ ] Print button to generate stores issue
- [ ] Acceptance: Output matches Excel for any qty input

### Task E3.4 — Rotty Dough Generator panel ⛳ P1 · UI · API
**Why**: xlsm `Doughs` sheet handles Egg Plain Rotty (RO1), Vegetable Rotty (RO2), Fish Rotty (RO3), Chicken Rotty (RO4), Beef Rotty (RO5/RO6).

- [ ] New page: `dms/dough-generator/rotty`
- [ ] Per-rotty-variant qty inputs
- [ ] Auto stores issue print
- [ ] Acceptance: Output matches Excel for all 5 rotty variants

### Task E3.5 — Filling Section consumables (gloves, piping bag, oil paper, calcium propionate) ⛳ P2 · DB · UI
**Why**: xlsm `Printing` sheet header lists non-ingredient consumables.

- [ ] Add `section_consumables` table: `id, section_id, name, uom, qty_per_batch_or_per_unit, calc_basis`
- [ ] Render a "Consumables" footer row on Production Planner & Stores Issue Note
- [ ] Acceptance: Gloves count auto-computes per Filling Section batch

---

## Phase E4 — Reporting & Print Orchestration (P1)

### Task E4.1 — Combined "Section Printing" one-page report ⛳ P1 · Report
**Why**: xlsm `Section Printing` sheet shows Bakery + Plain Roll + Curry + Pastry on a single page (Full / Mini / Uncooked columns) for the floor supervisor.

- [ ] Report template: `Production — All Sections Summary`
- [ ] 4-up layout (1 grid per section) on A4 landscape, Full/Mini/Uncooked columns
- [ ] Acceptance: Layout visually mirrors xlsm `Section Printing`

### Task E4.2 — DMS Pivot Dashboard with slicer ⛳ P1 · UI · API
**Why**: xlsm `Dashboard` sheet has a slicer-driven pivot (per-product × per-turn × per-route quantity matrix).

- [ ] New page: `dms/dashboard-pivot`
- [ ] Filters: product (multi-select), turn, route, day-type, date range
- [ ] Renders pivot grid: rows = products, columns = routes, values = quantity (sum/avg/count)
- [ ] Drill-down on cell click → detail
- [ ] Export: Excel + PDF
- [ ] Acceptance: Reproduces xlsm Dashboard charts/grids for the same date range

### Task E4.3 — DMS Recipe Upload CSV export ⛳ P0 · API
**Why**: xlsm `DMS Recipe Upload` produces a 2-column `ProductCode, ProductQty` CSV ready to push into the external POS/DMS.

- [ ] Endpoint: `GET /api/reports/dms-recipe-upload?planId={id}&format=csv`
- [ ] Output: header `ProductCode,ProductQty`, one row per produced item
- [ ] Frontend: "Export CSV" button on Production Planner
- [ ] Acceptance: CSV byte-identical structure to xlsm export (commas, quoting, line endings)

### Task E4.4 — Per-product Label templates wired to production output ⛳ P1 · DB · UI
**Why**: xlsm `Egg Sandwich Label` is a per-product label template printed at production time.

- [ ] Extend `Administrator → Label Settings → Templates` to allow per-product templates
- [ ] On Production Planner item row: add "Print Label" action that resolves the template + qty
- [ ] Support label batch printing (n labels per produced unit)
- [ ] Acceptance: Egg Sandwich label prints from Production Planner with correct count

### Task E4.5 — "Print all section sheets for tonight" orchestrator ⛳ P2 · UI · Report
**Why**: xlsm has dedicated buttons that auto-set page setup, apply `Y/N` filter, and pop the print dialog.

- [ ] Production Planner header: "Print Tonight's Production" button
- [ ] Generates a single PDF bundle: Bakery, Plain Roll, Curry, Vege Curry, Pastry, Short-Eats, Rotty, Patties, Filling
- [ ] Footer on every page: `Prepared by {user} on {date} at {time}`
- [ ] Acceptance: One click → one PDF with all sections, Y-filtered items only

### Task E4.6 — Print footer with operator + timestamp ⛳ P0 · Report
**Why**: xlsm sets `CenterFooter = "This File Was Prepared by " & Username & " on &D at &T"` on every print.

- [ ] Centralise report footer template in `ReportRenderer` service
- [ ] All DMS reports must include: Prepared By, Date, Time, Plan ID
- [ ] Acceptance: Every PDF/Excel report shows the footer block

---

## Phase E5 — Calculation & Rounding Engine Parity (P0/P1)

### Task E5.1 — Bulk rounding-rule manager ⛳ P1 · UI
**Why**: xlsm `Printing` sheet notes: "Rounding Value For Bakery Items To 5 ... Rounding Value - 1 Items".

- [ ] `Administrator → Rounding Rules` page: filter products by section/category, bulk-set `rounding_value`
- [ ] Bulk preview: "Set all Bakery products → round to 5"
- [ ] Audit log of changes
- [ ] Acceptance: Admin can set Bakery rounding=5 in one action

### Task E5.2 — Calculation breakdown view ⛳ P1 · UI
**Why**: xlsm `Calculation` sheet shows the math: `Total Carrot × 14% = Net Extra` and `10:30 AM Delivery / 2:30 PM Delivery / Without 2:30 PM / Combined` sub-totals for items like Fish Bun and Chicken Bun.

- [ ] On Stores Issue Note row: expand to show
  - Production qty
  - × recipe weight = base ingredient
  - + extra% / extra fixed = stores total
  - Per-turn split (10:30 AM / 2:30 PM / both)
- [ ] Acceptance: Numbers reconcile cell-by-cell with the Excel Calculation sheet

### Task E5.3 — Carrot/Cabbage style explicit per-vegetable extra ⛳ P0 · DB · UI
**Why**: xlsm has explicit "Carrot 14%" and "Cabbage 12.5%" extra calculation panels.

- [ ] Already supported via `extra_qty_per_unit` + `is_percentage` — verify seeds for these specific ingredients
- [ ] Surface the percentage in Recipe Management UI clearly ("+14% extra to stores")
- [ ] Acceptance: Carrot stores qty = recipe qty × 1.14 in produced reports

### Task E5.4 — Stores-only extra qty enforcement ⛳ P0 · API
**Why**: xlsm `Bakery Recipe for Stores` has extras hidden from `Bakery Recipe Calculation`.

- [ ] Confirm `extra_qty_visible_stores_only` honoured in `DmsCalculationService`
- [ ] Unit tests: production planner totals exclude stores-only extras; stores issue note includes them
- [ ] Acceptance: Tests pass for sample items (Calcium Propionate, etc.)

---

## Phase E6 — Auth, Role & Audit Parity (P1)

### Task E6.1 — Role-based sheet/page visibility (Admin vs Manager) ⛳ P1 · API · UI
**Why**: xlsm `Admin_Permissions` shows Users/Data/Dashboard; `Manager_Permissions` hides them.

- [ ] Confirm RBAC rules:
  - `Admin`: Users, Day-Type Manager, Data, Dashboard, Rounding Rules, Label Templates
  - `Manager`: Order Entry, Delivery Plan, Production Planner, Stores Issue Note, Reports (read-only)
- [ ] Hide nav items for Manager role in `menu-items.ts`
- [ ] Acceptance: Manager login does not see Users / Day-Types / Rounding admin

### Task E6.2 — Welcome greeting + login event log ⛳ P2 · UI
**Why**: xlsm `Workbook_Open` shows "Good Morning/Afternoon/Evening {username}".

- [ ] Time-based greeting on home dashboard
- [ ] Audit log entry for every login (already in `auth_logs` if present — verify)
- [ ] Acceptance: Greeting renders per local time

### Task E6.3 — Mandatory logout reminder ⛳ P2 · UI
**Why**: xlsm `Workbook_Close` enforces logout reminder.

- [ ] Idle-timeout banner after N minutes of inactivity
- [ ] "Save & Logout" button visible on every page
- [ ] Acceptance: User idle >15 min sees logout reminder modal

---

## Phase E7 — UX Affordances Parity (P2)

### Task E7.1 — Active row hover highlight ⛳ P2 · UI
**Why**: xlsm `Hilight_Cells` macro paints the active order row yellow.

- [ ] Order Entry Grid: highlight the focused row (background + left/right anchor cells)
- [ ] Acceptance: Visual matches Excel cue

### Task E7.2 — Outlet checkbox auto-disable when outlet has 0 qty ⛳ P2 · UI
**Why**: xlsm grays out an outlet checkbox if its summary row total is 0.

- [ ] Order Entry: disable outlet column when sum of its cells is 0
- [ ] Acceptance: Empty outlets visibly disabled

### Task E7.3 — Per-product Y/N flags per turn (5 AM, 10:30 AM, 2:30 PM) ⛳ P1 · DB · UI
**Why**: xlsm has three independent checkbox sets (`CheckBoxAllItem`, `CheckBox1030AM`, `CheckBox0130AM`) — enabling/disabling a product per turn.

- [ ] Confirm `delivery_plan_items.include_in_turn` is per (product × turn)
- [ ] Order Entry / Delivery Plan: render per-turn Y/N toggle column
- [ ] Acceptance: A product can be Y for 5 AM and N for 2:30 PM

---

## Phase E8 — Data Migration from xlsm (P0)

### Task E8.1 — One-shot importer for existing Excel data ⛳ P0 · API
- [ ] Build CLI/admin importer that reads the xlsm and seeds:
  - Products + codes
  - Ingredients
  - Recipes (Bakery, Filling, Curry, Vegetable Curry, Pastry, Dough)
  - Default quantities per (product × outlet × day-type × turn)
- [ ] Idempotent (re-runnable) with `--dry-run`
- [ ] Acceptance: Running importer against the xlsm produces the same DMS state as manual seeding

### Task E8.2 — Reconciliation report ⛳ P0 · Report
- [ ] Compare DMS computed Stores Issue Note vs xlsm `Bakery Recipe for Stores` for a sample plan
- [ ] Output diff CSV
- [ ] Acceptance: Diff = 0 (within rounding) for a chosen reference week

---

## Phase E9 — Backend API additions (P0/P1)

### Task E9.1 — Day-Type CRUD ⛳ P0 · API
`/api/day-types` (GET, POST, PUT, DELETE)

### Task E9.2 — Production Mode endpoint ⛳ P0 · API
`/api/production/mode` (PATCH) — switches plan into `Standard | PlainRoll | AnytimeAdHoc`

### Task E9.3 — Anytime Recipe run ⛳ P1 · API
`POST /api/anytime-recipe/run` → returns ingredient breakdown + audit id

### Task E9.4 — DMS Recipe CSV export ⛳ P0 · API
`GET /api/reports/dms-recipe-upload?planId=...&format=csv`

### Task E9.5 — Combined Section Print ⛳ P1 · API
`GET /api/reports/section-printing?planId=...&format=pdf`

### Task E9.6 — Pivot Dashboard data ⛳ P1 · API
`GET /api/dashboard/pivot?productIds=...&turnIds=...&outletIds=...&dayTypeIds=...&from=...&to=...`

### Task E9.7 — Section Consumables CRUD ⛳ P2 · API
`/api/section-consumables` (GET, POST, PUT, DELETE)

---

## Phase E10 — Database Migrations Summary (P0/P1)

| Migration | Tables touched | Phase |
|---|---|---|
| `add_day_types_master` | new `day_types`; FKs on `outlet_default_quantities`, `delivery_plans`, `delivery_plan_items` | E1.1 |
| `add_secondary_morning_turn_flag` | `delivery_turns.is_secondary_morning` | E1.2 |
| `add_outlet_variant` | new `outlet_variants` (or `outlets.parent_outlet_id`) | E1.5 |
| `add_per_route_extra` | `delivery_plan_outlet_quantities.extra_full`, `extra_mini` | E2.5 |
| `add_production_mode` | `delivery_plans.production_mode` | E2.1 |
| `add_anytime_recipe_runs` | new `anytime_recipe_runs` | E2.2 |
| `add_section_consumables` | new `section_consumables` | E3.5 |
| `add_curry_sections` | seed inserts into `production_sections` | E3.1, E3.2 |
| `add_per_turn_yn_flag` | confirm `delivery_plan_items.include_in_turn` | E7.3 |
| `add_label_template_per_product` | `label_templates.product_id` (nullable) | E4.4 |

---

## Acceptance: Excel Retirement Checklist

The Excel workbook can be retired only when:

- [ ] All 14 outlets and DAL-BBQ variant exist in DMS
- [ ] All 80+ products with codes (BR, BU, PTY, SAN, SE, RO, PS, PZ, PR) are seeded
- [ ] All 10+ day-types are user-managed
- [ ] All 5 delivery turns (incl. 6 AM) are configured
- [ ] All 8 production sections (Bakery, Filling, Plain Roll, Curry, Vege Curry, Short Eats, Pastry, Rotty, Patties) have planner tabs
- [ ] Plain Roll Production mode reproduces xlsm behavior
- [ ] Anytime Recipe Generator reproduces xlsm behavior
- [ ] Per-product Printing Receipt cards render
- [ ] DMS Recipe Upload CSV export byte-matches xlsm output
- [ ] Combined Section Printing PDF matches xlsm layout
- [ ] Pivot Dashboard with slicer is live
- [ ] Reconciliation report (E8.2) shows 0 diff for a reference week
- [ ] Stakeholder sign-off from Production Manager and Operations Admin

---

## Estimated Effort (rough, pre-grooming)

| Phase | Story Points |
|---|---|
| E1 — Master Data | 21 |
| E2 — Workflow & Mode | 21 |
| E3 — Section Coverage | 13 |
| E4 — Reporting & Print | 21 |
| E5 — Calculation & Rounding | 8 |
| E6 — Auth/Role/Audit | 8 |
| E7 — UX Affordances | 5 |
| E8 — Data Migration | 13 |
| E9 — Backend APIs | included above |
| E10 — DB Migrations | included above |
| **Total** | **~110 SP** |

Suggested cadence: **6–8 weeks** with 2 full-stack engineers + 1 QA, sequenced E1 → E8 → E2/E3 in parallel → E4/E5 → E6/E7.

---

## Phase F — FRONTEND PROTOTYPE (Build First, Mock Data)

> **Goal**: Stand up clickable, mock-data-driven UI for every gap above so stakeholders can validate flows *before* backend work begins. All pages live under `DMS-Frontend/src/app/...` and reuse existing shadcn/ui primitives.
> **Convention**: Every list/grid page exposes a top-bar **Turn Switcher** (5 AM / 6 AM / 10:30 AM / 2:30 PM / 3:30 PM) and **Day-Type Switcher** that filters its data.

### F.1 — Global Components (shared across pages)

| ID | Component | Path | Notes |
|---|---|---|---|
| F.1.1 | `<TurnSwitcher>` | `src/components/dms/turn-switcher.tsx` | Pill group bound to URL `?turn=` query param; reads from `delivery_turns` mock |
| F.1.2 | `<DayTypeSwitcher>` | `src/components/dms/day-type-switcher.tsx` | Dropdown filtered by selected turn's `applies_to_morning` / `applies_to_evening` |
| F.1.3 | `<ProductionModeToggle>` | `src/components/dms/production-mode-toggle.tsx` | `Standard / Plain Roll / Anytime` — controls grid masking |
| F.1.4 | `<CrossMidnightChip>` | `src/components/dms/cross-midnight-chip.tsx` | Renders "(Previous Day)" badge with tooltip |
| F.1.5 | `<SectionTabBar>` | `src/components/dms/section-tab-bar.tsx` | Bakery / Plain Roll / Filling / Curry / Vege Curry / Pastry / Short Eats / Rotty / Patties |
| F.1.6 | `<RouteExtraColumn>` | `src/components/dms/route-extra-column.tsx` | Dual sub-columns under each outlet for "Order" + "Extra" |
| F.1.7 | `<PerTurnYNGrid>` | `src/components/dms/per-turn-yn-grid.tsx` | Y/N toggle per (product × turn) |
| F.1.8 | `<CalculationBreakdownDrawer>` | `src/components/dms/calculation-breakdown-drawer.tsx` | Side drawer: qty × recipe × extra% = stores total |
| F.1.9 | `<PrintFooter>` | `src/components/dms/print-footer.tsx` | "Prepared by {user} on {date} at {time} · Plan #{id}" |
| F.1.10 | `<ConsumablesFooter>` | `src/components/dms/consumables-footer.tsx` | Gloves / Piping bag / Calcium propionate row at bottom of Stores Issue Note |
| F.1.11 | `<PivotGrid>` | `src/components/dms/pivot-grid.tsx` | Generic pivot for Dashboard (rows × cols × values) |
| F.1.12 | `<RowHighlightProvider>` | `src/components/dms/row-highlight.tsx` | Yellow highlight on focused row (Excel parity) |
| F.1.13 | `<EmptyOutletDisabler>` | hook in Order Entry Grid | Auto-disable outlet column when sum = 0 |
| F.1.14 | `<TimeBasedGreeting>` | `src/components/layout/greeting.tsx` | "Good Morning {user}" header text |
| F.1.15 | `<IdleLogoutBanner>` | `src/components/layout/idle-logout.tsx` | Modal after N min inactivity |

### F.2 — New Pages to Scaffold

| ID | Route | Page Title | Mocks needed | Excel Source |
|---|---|---|---|---|
| F.2.1 | `/administrator/day-types` | **Day-Type Manager** | day-types CRUD list with `applies_to_morning/evening` + `is_extra_variant` + `sort_order` | E1.1 / xlsm Users sheet |
| F.2.2 | `/administrator/delivery-turns` | **Delivery Turns Manager** | turns CRUD with `is_secondary_morning`, `is_previous_day` flags | E1.2 |
| F.2.3 | `/administrator/rounding-rules` | **Bulk Rounding Rule Manager** | filter products by section, bulk-edit `rounding_value`, preview, audit log | E5.1 / xlsm `Printing` notes |
| F.2.4 | `/administrator/section-consumables` | **Section Consumables** | per-section consumables CRUD (gloves, piping bag, calcium propionate) | E3.5 / xlsm `Printing` |
| F.2.5 | `/administrator/label-templates` | **Label Templates (per product)** | template list + per-product binding | E4.4 / xlsm `Egg Sandwich Label` |
| F.2.6 | `/dms/anytime-recipe-generator` | **Anytime Recipe Generator** | product picker + qty → ingredient breakdown card → print PDF preview | E2.2 / xlsm `AnyTimeRecipeButton` |
| F.2.7 | `/dms/dough-generator/patties` | **Patties Dough Generator** | "Nos 01" multiplier → Flour 18 / Beehive 3.5 / Salt 0.25 / Eggs 0.017 | E3.3 / xlsm `Patties Doudgh` |
| F.2.8 | `/dms/dough-generator/rotty` | **Rotty Dough Generator** | RO1–RO6 qty inputs → ingredient totals → print | E3.4 / xlsm `Doughs` |
| F.2.9 | `/dms/dashboard-pivot` | **Pivot Dashboard** | filters (product/turn/route/day-type/date) + `<PivotGrid>` + drill-down + export | E4.2 / xlsm `Dashboard` |
| F.2.10 | `/dms/print-receipt-cards` | **Multi-up Receipt Cards** | multi-select products, render 2×5 grid, print PDF | E2.3 / xlsm `Printing Receipt` |
| F.2.11 | `/dms/section-print-bundle` | **Combined Section Printing** | one-click PDF preview of all sections for a plan | E4.1 / xlsm `Section Printing` |
| F.2.12 | `/dms/dms-recipe-upload` | **DMS Recipe Upload Export** | preview + download CSV (`ProductCode,ProductQty`) | E4.3 / xlsm `DMS Recipe Upload` |
| F.2.13 | `/dms/reconciliation` | **Excel ↔ DMS Reconciliation** | upload xlsm, run diff vs DMS plan, export diff CSV | E8.2 |
| F.2.14 | `/dms/importer` | **xlsm Importer (Admin)** | wizard: choose turn workbook → preview → dry-run → commit | E8.1 |

### F.3 — Existing Pages to Enhance

| ID | Existing Page | Enhancements |
|---|---|---|
| F.3.1 | `/dms/order-entry-enhanced` | Add `<TurnSwitcher>`, `<DayTypeSwitcher>`, `<ProductionModeToggle>`, `<RouteExtraColumn>`, `<PerTurnYNGrid>`, `<RowHighlightProvider>`, `<EmptyOutletDisabler>`. Add DAL/DAL-BBQ adjacency. Add `<CrossMidnightChip>` when 5 AM turn selected. |
| F.3.2 | `/dms/delivery-plan` | Add `<TurnSwitcher>`, `<DayTypeSwitcher>`. Show effective vs production date when previous-day. |
| F.3.3 | `/dms/delivery-summary` | Add `<TurnSwitcher>`. Show per-route Extra columns. |
| F.3.4 | `/dms/default-quantities` | Day-Type picker reads from new master. Per-turn template tabs. |
| F.3.5 | `/dms/production-planner-enhanced` | Add `<SectionTabBar>` with all 8 sections incl. Curry, Vege Curry, Patties. Per-section start time chip. Add "Print Tonight's Production" button → bundle PDF. Add per-row label print action. |
| F.3.6 | `/dms/stores-issue-note-enhanced` | Add `<ConsumablesFooter>`, `<CalculationBreakdownDrawer>`, per-section export. Show stores-only-extras separately. |
| F.3.7 | `/dms/recipe-management` | Surface "% extra" badge (Carrot 14%, Cabbage 12.5%). Stores-only-extra toggle on each ingredient. |
| F.3.8 | `/dms/recipe-templates` | Per-section templates for Curry / Vege Curry / Patties / Rotty. |
| F.3.9 | `/dms/freezer-stock` | Add per-turn deduction view. |
| F.3.10 | `/dms/immediate-orders` | Add `<TurnSwitcher>`. |
| F.3.11 | `/dashboard` (home) | Add `<TimeBasedGreeting>`, idle-logout setup, "today's turn pipeline" cards. |
| F.3.12 | App shell | Hide `Day-Types`, `Users`, `Rounding Rules`, `Label Templates`, `Importer`, `Reconciliation` for `Manager` role. |

### F.4 — Navigation Menu Updates (`menu-items.ts`)

Add the following entries:

```ts
// Inside the existing "DMS" group children
{ name: 'Anytime Recipe',         href: '/dms/anytime-recipe-generator', icon: Zap,         permission: 'dms.anytime-recipe.view' },
{ name: 'Patties Dough',          href: '/dms/dough-generator/patties',   icon: ChefHat,    permission: 'dms.dough.view' },
{ name: 'Rotty Dough',            href: '/dms/dough-generator/rotty',     icon: ChefHat,    permission: 'dms.dough.view' },
{ name: 'Pivot Dashboard',        href: '/dms/dashboard-pivot',           icon: FileBarChart, permission: 'dms.dashboard-pivot.view' },
{ name: 'Receipt Cards',          href: '/dms/print-receipt-cards',       icon: Printer,    permission: 'dms.print.view' },
{ name: 'Section Print Bundle',   href: '/dms/section-print-bundle',      icon: Printer,    permission: 'dms.print.view' },
{ name: 'DMS Recipe Upload',      href: '/dms/dms-recipe-upload',         icon: FileText,   permission: 'dms.export.view' },
{ name: 'Reconciliation',         href: '/dms/reconciliation',            icon: CheckSquare, permission: 'dms.reconciliation.view' },
{ name: 'xlsm Importer',          href: '/dms/importer',                  icon: Database,   permission: 'dms.importer.view' },

// Inside the existing "Administrator" group children
{ name: 'Day-Types',              href: '/administrator/day-types',           icon: CalendarDays, permission: 'administrator.day-types.view' },
{ name: 'Delivery Turns',         href: '/administrator/delivery-turns',      icon: CalendarDays, permission: 'administrator.delivery-turns.view' },
{ name: 'Rounding Rules',         href: '/administrator/rounding-rules',      icon: Settings,     permission: 'administrator.rounding.view' },
{ name: 'Section Consumables',    href: '/administrator/section-consumables', icon: Archive,      permission: 'administrator.consumables.view' },
{ name: 'Label Templates',        href: '/administrator/label-templates',     icon: Printer,      permission: 'administrator.label-templates.view' },
```

### F.5 — Mock Data Modules (under `src/lib/mocks/`)

| File | Shape |
|---|---|
| `mocks/day-types.ts` | `DayType[]` with morning/evening flags |
| `mocks/delivery-turns.ts` | 5 turns with `is_secondary_morning`, `is_previous_day` |
| `mocks/products-full.ts` | ~80 SKUs from xlsm Order sheet (BR/BU/PTY/SAN/SE/RO/PS/PZ/PR codes) |
| `mocks/ingredients.ts` | ~127 ingredients from xlsm Recipe sheets |
| `mocks/recipes-by-section.ts` | recipes grouped by section incl. % extras |
| `mocks/section-consumables.ts` | gloves, piping bag, oil paper, calcium propionate per section |
| `mocks/outlets-with-variants.ts` | 14 outlets + DAL-BBQ variant |
| `mocks/per-turn-yn.ts` | sample (product × turn) Y/N matrix |
| `mocks/dashboard-pivot-rows.ts` | sample rows for Pivot Dashboard |
| `mocks/anytime-runs.ts` | sample audit log entries |

### F.6 — Frontend Prototype Acceptance Checklist

- [ ] Every page in F.2 and F.3 is reachable from the nav menu
- [ ] Turn Switcher works on all DMS pages (filters mock data)
- [ ] Day-Type Switcher reflects the selected turn's morning/evening filter
- [ ] Order Entry Grid demonstrates: Plain Roll mode masking, per-route Extra columns, per-turn Y/N, row highlight, empty-outlet auto-disable
- [ ] Production Planner shows all 8 section tabs incl. Curry, Vege Curry, Patties
- [ ] Stores Issue Note shows consumables footer + calculation breakdown drawer
- [ ] Anytime Recipe Generator prints a sample card with operator + timestamp
- [ ] Patties / Rotty Dough Generators compute correct ingredient totals from input qty
- [ ] Pivot Dashboard renders pivot grid + filters + drill-down
- [ ] Receipt Cards renders 2×5 grid printable layout
- [ ] Combined Section Print bundles all sections to one PDF preview
- [ ] DMS Recipe Upload exports a CSV with header `ProductCode,ProductQty`
- [ ] Day-Type Manager allows add/edit/delete with morning/evening flags
- [ ] Rounding Rules page lets admin bulk-set Bakery items to round-to-5
- [ ] Manager role does NOT see admin-only nav items
- [ ] Time-based greeting and idle-logout banner work on home dashboard
- [ ] Print footer appears on every printable preview
- [ ] All pages responsive at 1280 / 1440 / 1920 widths

### F.7 — Frontend Prototype Sequencing (2–3 weeks)

| Week | Deliverables |
|---|---|
| **Week 1** | F.1.1–F.1.9 shared components · F.4 nav updates · F.5 mock data · F.2.1–F.2.5 admin pages |
| **Week 2** | F.2.6–F.2.10 DMS pages · F.3.1, F.3.5, F.3.6 enhancements (Order Entry, Planner, SIN) |
| **Week 3** | F.2.11–F.2.14 export/reconciliation/importer · F.3.2–F.3.4, F.3.7–F.3.12 remaining enhancements · F.6 acceptance walkthrough |

