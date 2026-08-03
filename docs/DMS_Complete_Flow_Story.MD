# Don & Sons DMS — Complete System Flow Story & Test Scenarios

> **Purpose:** End-to-end flow story for testing the complete DMS system.
> Multiple delivery plans are covered (not just 5:00 AM). Every step references actual system pages.

---

## Cast of Characters

| Actor | Role | System Role |
|-------|------|-------------|
| Mr. Don | Owner / Super Admin | SuperAdmin |
| Hilary | Production Manager | Production Manager |
| Viraj | Sales Manager | Sales Manager |
| Harshani | Production Staff | Production |
| Upul | Stores Manager | Production Manager |
| Chamila | Stock Clerk | Stock Adj Only |
| Outlet Staff | Showroom cashiers (DAL, KEL, RAG…) | Regular User / POS |

---

## PHASE A — ONE-TIME SYSTEM SETUP (Admin: Mr. Don)

### A1. Login & Dashboard
1. Mr. Don opens the DMS web app and logs in with SuperAdmin credentials.
2. Lands on **Dashboard** (`/dashboard`) — 4 widgets: Sales Trend (7 days), Disposal by Section, Top Deliveries, Delivery vs Disposal.

### A2. Users & Roles
**Page:** `/administrator/security` → Users tab, Roles tab, Permissions tab
1. Creates roles: *Production Manager, Sales Manager, Production, Stock Adj Only, Deliveries, POS System, Finance*.
2. Sets permissions per role using the checkbox matrix (View/Create/Edit/Delete/Approve/Reject/Print/Export per module).
3. Creates users: Hilary, Viraj, Harshani, Upul, Chamila, outlet cashiers. Assigns roles.

### A3. Showrooms (Outlets)
**Page:** `/showroom`
1. Adds 14+ outlets: DAL, DBQ, KEL, RAG, SGK, KML, BWA, WED, RAN, BC, SJE, YRK, KAD, SRP.
2. Sets Code, Description, City, Dashboard=Yes, Active=Yes.

### A4. Inventory Master Data

**Categories** (`/inventory/category`): Bread, Bun, Sandwich, Short-Eat, Pizza, Pastry, Rotty, Pattie, Action, etc.

**UOM** (`/inventory/uom`): G, Kg, ml, Ltr, Nos, Bot.

**Ingredients** (`/inventory/ingredient`): 127+ items — Flour, Sugar, Salt, Yeast, Beehive, Eggs, Margarine, Oil, Cheese, Sausages, Ham, Chicken, Fish, Prawns, Carrots, Potato, Onions, etc. Each with UOM.

**Products** (`/inventory/products`): 80+ products. For each:
- **Code:** BR1, BU4, BU8, SAN1, SE1, SE8, PZ1, PS1, RO3, etc.
- **Product Type:** Raw Material / Semi-Finished / Finished / Section
- **Variants:** has_full, has_mini (e.g., Viyana Roll has both Full and Mini)
- **Decimal Qty:** `allow_decimal_quantity=true` for products like certain breads (4.75 allowed)
- **Weight:** e.g., Kurakkan Plain Bun = 35g. Same bun can have different weights — admin chooses.
- **Rounding:** rounding_value=5 with standard_quantity reference (4 patties = 1 egg garnish)
- **Section assignment:** one product can span multiple sections

### A5. Production Sections
Creates: Bakery 1, Bakery 2, Filling Section, Short-Eats 1 (Prepare), Short-Eats 2 (Crumb & Fry), Rotty Section, Plain Roll Section, Pastry Section.

Product-to-section mapping:
- **Egg Bun:** bun dough → Bakery, filling → Filling Section
- **Hot Dog:** bun → Bakery, sausage → Filling Section
- **Sandwich:** bread/filling/garnish/packing → 4 separate sections
- **Pizza:** dough → Bakery, toppings → separate section

### A6. Delivery Turns
**Page:** `/administrator/delivery-turns`

Creates multiple delivery plans:
| Turn | Target Time | Example: Bakery Start | Example: Short-Eats Start |
|------|-------------|----------------------|--------------------------|
| Turn 1 | 5:00 AM | 8:00 PM previous night | 2:00 PM previous day |
| Turn 2 | 10:30 AM | 4:00 AM same day | 7:00 AM same day |
| Turn 3 | 3:30 PM | 8:00 AM same day | 10:00 AM same day |

Per-section start times and delivery times are admin-configurable and can vary.

### A7. Day Types
**Page:** `/administrator/day-types`

Creates: Weekday (Mon–Wed), Thursday–Friday, Saturday, Sunday, Holiday, Special Event.

### A8. Default Quantities
**Page:** `/dms/default-quantities`

Per product × outlet × day type baseline quantities. Example:
| Product | DAL (Weekday) | KEL (Weekday) | DAL (Saturday) |
|---------|--------------|--------------|----------------|
| Fish Curry Bun | 15 | 10 | 20 |
| Viyana Roll | 25 | 20 | 30 |

### A9. Workflow Config
**Page:** `/administrator/workflow-config`

Enables approvals for: Daily Production, Delivery, Disposal, Stock BF, Stock Transfer, Cashier Balance, Label Printing, etc.

### A10. Recipes
**Page:** `/dms/recipe-management`

**Standard recipe:** Per ingredient — qty_per_unit + extra_qty (stores only).
```
Fish Curry Bun (Bakery): Flour 0.5g/unit, Yeast 0.02g/unit
Fish Curry Bun (Filling): Boiled Fish 15g/unit + Extra 2g (stores only — cleaning loss)
```

**Sugar Candy Bun — Dual sub-recipe:** TWO named sub-recipes under same product:
- "Dough Recipe": Flour, Yeast, Sugar, Salt, Beehive, Eggs
- "Bun Recipe": Sugar, Candy, Crystal Sugar

**Egg Bun — Multi-section:** Bakery recipe (dough) + Filling recipe (eggs). Stores issue eggs as "raw eggs" to filling and "boiled eggs" for garnishing — separate lines.

**Percentage-based:** Some items use % of another item's total.

**Templates** (`/dms/recipe-templates`): "Standard Vegetable Curry" auto-loads but can be customized. Half veg curry can use percentage from predefined items + extra ingredients.

**Separate recipe plans:** Versioned with effective dates.

---

## PHASE B — DAILY OPERATIONS (Tuesday Preparation)

> Monday evening. Preparing for Tuesday's multiple delivery turns.

### B1. Create Delivery Plan — Turn 1 (5:00 AM)
**Actor:** Viraj | **Page:** `/dms/delivery-plan`
1. Creates new plan: Date=Tuesday, Day Type=Weekday, Turn=5:00 AM.
2. System auto-loads Weekday defaults.
3. **Outlet checkbox:** Unchecks SJE (closed). SJE gets zero quantities.
4. **Item checkbox:** Unchecks Pizza (not produced for 5 AM). Pizza row excluded.
5. Saves as **Draft**.

### B2. Order Entry Grid — Turn 1
**Actor:** Viraj | **Page:** `/dms/order-entry-enhanced`
1. Opens spreadsheet-like grid. Columns: Item | Code | Full | Mini | BAL | Extra | Total Full | Total Mini | [Per-Outlet columns].
2. Adjusts: Fish Curry Bun DAL=18, KEL=12. Viyana Roll Full DAL=25.
3. Tea Bun Extra Full = 10.
4. Decimal values allowed where `allow_decimal_quantity=true` (e.g., 4.75).
5. Items with Full+Mini show both columns. Items with only Full show one.
6. Saves.

### B3. Immediate Orders
**Actor:** Outlet staff / Viraj | **Page:** `/dms/immediate-orders`
1. Outside customer → DAL outlet creates: Chinese Roll × 50, Not Customized.
2. Another request: Egg Bun × 20, Customized=Yes, Notes: "Extra filling, double garnish".
3. Linked to Tuesday 5:00 AM plan. Manager confirms.

### B4. Freezer Stock
**Actor:** Upul | **Page:** `/dms/freezer-stock`
1. Enters: Chinese Roll Filling = 50 in freezer, Fish Cutlet = 30.

### B5. Delivery Summary
**Actor:** Viraj | **Page:** `/dms/delivery-summary`
1. Reviews all products with Y/N flags, per-outlet quantities, totals.
2. **Totals include immediate orders.** Chinese Roll: 199 + 50 = 249 grand total.
3. **Customized orders:** 20 special Egg Buns in separate sub-row, visually distinct, but counted in total.
4. **Available Balance:** Checks "Use Freezer Stock" for Chinese Roll:
   - **Stores Issue = 199 − 50 = 149** (only on stores sheet)
   - **Production Qty = 199** (unchanged — production needs full count)
5. Confirms plan → **Confirmed**.

### B6. Production Planner
**Actor:** Hilary | **Page:** `/dms/production-planner-enhanced`

Section-tabbed layout. Each tab shows:
- Production Start Time + Effective Delivery Time (from turn config)
- Items with quantities
- Ingredient totals (recipe × qty)
- **NO extra quantities — correct recipe only**
- Customized orders shown separately but counted in total

| Tab | Start Time | Key Items |
|-----|-----------|-----------|
| Bakery 1 | Mon 8:00 PM | Viyana Roll (Full+Mini separate), Sugar Candy Bun (Dough table + Bun table) |
| Bakery 2 | Mon 8:00 PM | Bread, Sandwich Bread, Buns |
| Filling | Mon 11:00 PM | Sandwich fillings, Egg Bun eggs (raw + boiled separate) |
| Short-Eats 1 | Mon 2:00 PM | Cutlets, Patties, Chinese Rolls + sub-tables (Pattie Dough, Chinese Roll Batter, Egg Wash) |
| Short-Eats 2 | — | Oil Papers, Bread Crumbs, Flour |
| Rotty | Mon 8:00 PM | Rotty Dough + Chicken Rotty Egg Wrap |
| Plain Roll | — | Garnish + Prawn Bun Batter |

**Rounding example:** 97 patties → rounded to 100 → 25 eggs for garnish. Standard value (24.25) also displayed.

### B7. Stores Issue Note
**Actor:** Upul | **Page:** `/dms/stores-issue-note-enhanced`

Same as Production Planner BUT:
- **Includes extra quantities:** Carrot 5kg + 0.5kg extra = 5.5kg
- **Includes freezer deduction:** Chinese Roll: 199 − 50 = 149
- **Bakery production recipe also added to stores issue sheet**
- Footer: Start Time, Delivery Time, Printed By / Issued By / Checked By
- **Export sectionwise:** PDF and Excel per section

### B8. Create Plans for Other Turns
Repeat B1–B7 for Turn 2 (10:30 AM) and Turn 3 (3:30 PM). Different items may be available per turn.

---

## PHASE C — PRODUCTION & DELIVERY

### C1. Daily Production Entry
**Actor:** Harshani | **Page:** `/production/daily-production`
1. Creates new production record. Enters actual quantities per product per section.
2. Submits → **Pending**.

### C2. Production Approval
**Actor:** Hilary | **Page:** `/production/approvals` or `/administrator/approvals`
1. Sees pending badge. Reviews. Clicks **Approve**.

### C3. Delivery Creation
**Actor:** Viraj | **Page:** `/operation/delivery`
1. Creates one delivery record per outlet per turn.
2. Each lists products with Full/Mini qty and unit price.
3. Submits → **Pending**.

### C4. Delivery Approval
**Page:** `/operation/approvals`
1. Approver reviews and approves. Updates Current Stock.

### C5. Reports Generation
**Page:** `/reports`, `/dms/section-print-bundle`, `/dms/print-receipt-cards`

| Report | Content |
|--------|---------|
| Delivery Note (per outlet) | Products, Full/Mini qty, totals |
| Immediate Orders Summary | All immediate orders, customized flagged |
| Production Planner (per section) | Items, ingredient totals, sub-tables |
| Stores Issue Note (per section) | With extra qty + freezer deduction |
| Delivery Summary | All outlets, per-item totals, Y/N flags |

---

## PHASE D — END OF DAY

### D1. Production Cancel (if needed)
**Page:** `/production/production-cancel` — Records items planned but not produced.

### D2. Stock Adjustment
**Page:** `/production/stock-adjustment` — Carry unsold production to next day.
**Page:** `/production/stock-adjustment-approval` — Hilary approves.

### D3. Current Stock
**Page:** `/production/current-stock` — Real-time: Open Balance + Production − Cancelled − Delivered + Returns.

### D4. Outlet Operations
| Operation | Page | Date Rule (Regular User) |
|-----------|------|------------------------|
| Disposal | `/operation/disposal` | Today only |
| Transfer | `/operation/transfer` | Back-date up to 3 days |
| Stock BF | `/operation/stock-bf` | Back-date up to 3 days |
| Delivery Return | `/operation/delivery-return` | Back-date up to 3 days |
| Cancellation | `/operation/cancellation` | Back-date up to 3 days |

### D5. Cashier Balance
**Page:** `/administrator/cashier-balance`
1. Previous day auto-selected. All showrooms auto-checked.
2. Enter balance. If showroom closed → check "Showroom Is Closed".
3. Submit for approval.

### D6. Day-End Process
**Page:** `/administrator/day-end-process`
1. **Pre-req:** Cashier Balance approved. Day NOT locked.
2. Finalizes the operational day.

### D7. Day Lock
**Page:** `/administrator/day-lock`
1. Calendar view. Lock a date → absolute lock, no edits by anyone.

---

## PHASE E — SPECIAL SCENARIOS

| Scenario | Details |
|----------|---------|
| **Same item, different weights** | Admin chooses weight at product creation (e.g., Sugar Candy Bun 35g or 50g) |
| **Vegetable curry loading** | Template auto-loads when product created. Can be customized. |
| **Half veg curry** | Uses percentage from predefined recipe + extra ingredients |
| **Separate recipe plans** | Versioned with effective dates. Old stays for history. |
| **Dynamic config** | Admin adds outlets/products/sections/ingredients/recipe lines anytime |
| **Label printing** | `/operation/label-printing` — only enabled products. Approval workflow. |
| **Price changes** | `/administrator/price-manager` — schedule future price, auto-applies |
| **Same Full + Mini** | Viyana Roll Full and Viyana Roll Mini = separate products, distinct recipes |

---

## STEP-BY-STEP TEST SCENARIO: "Wednesday 5:00 AM + 10:30 AM Delivery"

### Characters: Viraj (Manager), Hilary (Production), Upul (Stores), DAL outlet user

**Step 1 — Tuesday 1:00 PM:** Viraj → `/dms/delivery-plan` → Creates Wednesday 5:00 AM plan (Weekday). Auto-loads defaults.

**Step 2 — Tuesday 1:15 PM:** Viraj → `/dms/order-entry-enhanced` → Adjusts quantities. KEL wants extra 20 Fish Buns. Sets Extra=10 for Tea Bun.

**Step 3 — Tuesday 2:00 PM:** DAL outlet user → `/dms/immediate-orders` → Creates immediate order: 30 Patties (not customized) + 15 special Chinese Rolls (customized: "no onion").

**Step 4 — Tuesday 2:30 PM:** Viraj → `/dms/immediate-orders` → Confirms both orders.

**Step 5 — Tuesday 3:00 PM:** Upul → `/dms/freezer-stock` → Enters: Patties=40 in freezer.

**Step 6 — Tuesday 3:30 PM:** Viraj → `/dms/delivery-summary` → Reviews. Patties total=180. Enables "Use Freezer Stock" → Stores qty=140. Customized Chinese Rolls shown separately. Confirms plan.

**Step 7 — Tuesday 4:00 PM:** Hilary → `/dms/production-planner-enhanced` → Opens Bakery tab (start: Tue 8PM), Short-Eats tab (start: Tue 2PM). Verifies ingredient totals. NO extra quantities visible. Prints per section.

**Step 8 — Tuesday 4:30 PM:** Upul → `/dms/stores-issue-note-enhanced` → Opens per section. Sees extra quantities + freezer deduction. Prints/exports sectionwise. Issues ingredients to production.

**Step 9 — Tuesday 8:00 PM:** Bakery production starts (per the production start time).

**Step 10 — Wednesday 3:00 AM:** Harshani → `/production/daily-production` → Enters actual produced quantities. Submits.

**Step 11 — Wednesday 3:30 AM:** Hilary → `/production/approvals` → Approves production record.

**Step 12 — Wednesday 4:00 AM:** Viraj → `/operation/delivery` → Creates delivery records per outlet (DAL, KEL, RAG…). Submits.

**Step 13 — Wednesday 4:15 AM:** Approver → `/operation/approvals` → Approves deliveries.

**Step 14 — Wednesday 5:00 AM:** Deliveries dispatched. Viraj → `/reports` → Prints delivery notes per outlet.

**Step 15 — Repeat for 10:30 AM turn:** Viraj creates a separate delivery plan for Wednesday 10:30 AM. Different items/quantities. Same flow.

**Step 16 — Wednesday evening:** Outlet operations (disposal, transfers, etc.). Cashier balance submitted. Day-end processed. Day locked.

---

## FLOW DIAGRAM

```
ADMIN SETUP
    │
    ▼
┌─────────────────────┐
│  Delivery Plan       │ ← Date + Turn + Day Type
│  (Draft)             │   Auto-load defaults
│  Outlet checkboxes   │   Item checkboxes
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Order Entry Grid    │ ← Product × Outlet × Full/Mini
│  Decimal support     │   Extra quantities
└──────────┬──────────┘
           │
     ┌─────┴──────┐
     ▼            ▼
┌─────────┐  ┌──────────┐
│Immediate│  │Freezer   │
│Orders   │  │Stock     │
└────┬────┘  └────┬─────┘
     │            │
     ▼            ▼
┌──────────────────────────┐
│  Delivery Summary         │ ← Confirm Plan
│  Total = Outlets+Extra+   │
│  Immediate                │
│  Freezer deduct = stores  │
│  only                     │
└───────────┬──────────────┘
            │
      ┌─────┴─────────┐
      ▼               ▼
┌───────────┐  ┌────────────────┐
│Production │  │Stores Issue    │
│Planner    │  │Note            │
│(correct   │  │(+extra qty     │
│recipe     │  │ +freezer       │
│only)      │  │ deduction)     │
└─────┬─────┘  └────────┬───────┘
      │                 │
      ▼                 ▼
┌───────────┐  ┌────────────────┐
│Daily Prod │  │Reports/Export   │
│Entry →    │  │Sectionwise     │
│Approve    │  └────────────────┘
└─────┬─────┘
      ▼
┌───────────┐
│Delivery   │ → Approve → Dispatch
│per outlet │
└─────┬─────┘
      ▼
┌───────────────────────┐
│End of Day              │
│Disposal/Transfer/      │
│Stock BF/Returns        │
│Cashier Bal → Day-End   │
│→ Day Lock              │
└───────────────────────┘
```

---

*Document Version: 1.0 | Date: May 2026 | Prepared for DMS System Testing*
*Covers all delivery plans — not limited to 5:00 AM*
