# DMS – Page-by-Page Data Requirements

## 1. Dashboard (`/dashboard`)
**Display Data:**
- Sales Trend last 7 days (date, total delivery value)
- Disposal by Section – yesterday (category, quantity)
- Today Top Deliveries (showroom code, delivery count)
- Delivery vs Disposal Trend – 7 days (category, delivery qty, disposal qty)
- Online/Offline status, logged-in user name and role

---

## 2. Inventory → Products (`/inventory/products`)
**List Columns:** Product Category, Product Code, Product Description, Unit Price, UOM, Require Open Stock (Yes/No), Active (Yes/No)

**Add/Edit Form Fields:**
| Field | Type | Notes |
|-------|------|-------|
| Product Code | Text | Unique. BR, BU, SAN, SE, PZ, PS, RO, PTY prefixes |
| Product Description | Text | Full display name |
| Product Category | Dropdown | FK → Category (active only) |
| Unit of Measure | Dropdown | FK → UOM |
| Unit Price | Decimal | Selling price |
| Product Type | Dropdown | Raw Material / Semi-Finished / Finished / Section |
| Has Full Variant | Boolean | Show Full qty column |
| Has Mini Variant | Boolean | Show Mini qty column |
| Allow Decimal Qty | Boolean | If true, accept 4.75 etc. |
| Weight (grams) | Decimal (nullable) | e.g. 35g for Kurakkan Plain Bun |
| Rounding Value | Integer (nullable) | e.g. 5 = round up to nearest 5 |
| Standard Quantity | Decimal (nullable) | Reference value displayed alongside rounded |
| Require Open Stock | Boolean | Must have Stock BF entry daily |
| Enable Label Print | Boolean | Available in Label Printing operation |
| Active Status | Boolean | Soft-delete |
| Sort Order | Integer | Display order in grids |

**Section Assignments (sub-form):** Section (dropdown), Is Primary (boolean), Sort Order

---

## 3. Inventory → Category (`/inventory/category`)
**List Columns:** Code, Description, Active, Actions

**Add/Edit Fields:** Code (text, unique), Description (text), Active (boolean)

**Known Categories:** Action, Biscuit, Bread, Bun, Butter Cream, Cake Sheets, Drinks, Icing Cake, Party, Pastry, Pieces, Pizza, PR, Rice & Curry, Rotty, Sandwich, Shortbread, Soup

---

## 4. Inventory → Unit of Measure (`/inventory/uom`)
**List Columns:** Code, Description, Actions

**Add/Edit Fields:** Code (e.g. G, ml, Nos, Kg, Ltr, Bot), Description

---

## 5. Inventory → Ingredient (`/inventory/ingredient`)
**List Columns:** Code, Name, Unit, Active, Actions

**Add/Edit Fields:**
| Field | Type | Notes |
|-------|------|-------|
| Code | Text | Unique short code (e.g. B1, BS1, C1) |
| Name | Text | Full ingredient name |
| Unit | Dropdown | FK → UOM |
| Allow Extra Qty | Boolean | Admin can assign extra waste allowance |
| Extra Qty Note | Text | e.g. "cleaning loss" |
| Active | Boolean | Soft-delete |

---

## 6. Show Room (`/showroom`)
**List Columns:** Name (code), Description, City, Dashboard (Yes/No), Active, Actions

**Add/Edit Fields:** Name/Code (unique), Description, City, Dashboard (boolean), Active (boolean)

**Known Outlets:** DAL, DBQ, KEL, RAG, SGK, KML, BWA, WED, RAN, BC, SJE, YRK, KAD, SRP, BC, BW, DM2–DM6

---

## 7. Operation → Delivery (`/operation/delivery`)
**List Columns:** Delivery Date, Delivery No (DEL00XXXXXX), Showroom, Status (Approved/Pending/Rejected), Edit User, Edit Date, Approved/Rejected By

**Add/Edit Form:**
| Field | Type | Notes |
|-------|------|-------|
| Delivery Date | Date | Admin: any date. User: today/future only |
| Showroom | Dropdown | Active showrooms |
| Delivery Turn | Dropdown | FK → Delivery Turns |
| Line Items | Grid | Product, Full Qty, Mini Qty, Unit Price per product |

**Status Flow:** Pending → Approved / Rejected

---

## 8. Operation → Disposal (`/operation/disposal`)
**List Columns:** Disposal Date, Disposal No (DIS00XXXXXX), Showroom, Delivered Date, Status, Edit User, Approved By

**Add/Edit Form:**
| Field | Type |
|-------|------|
| Disposal Date | Date (today only for regular users) |
| Showroom | Dropdown |
| Delivered Date | Date of original delivery |
| Line Items | Grid: Product, Qty, Reason |

---

## 9. Operation → Transfer (`/operation/transfer`)
**List Columns:** Transfer Date, Transfer No (TRN00XXXXXX), Showroom From, Showroom To, Status, Edit User, Approved By

**Add/Edit Form:** Transfer Date, From Showroom, To Showroom, Line Items (Product, Qty)

---

## 10. Operation → Stock BF (`/operation/stock-bf`)
**List Columns:** Date, Display No (SBF00XXXXXX), Showroom, Status, Edit User, Approved By

**Add/Edit Form:** BF Date, Showroom, Line Items (Product, Closing Qty)

---

## 11. Operation → Cancellation (`/operation/cancellation`)
**List Columns:** Cancellation Date, Cancellation No (DCN00XXXXXX), Showroom, Delivered Date, Status, Edit User, Approved By

**Add/Edit Form:** Cancellation Date, Showroom, Delivered Date, Line Items (Product, Qty)

---

## 12. Operation → Delivery Return (`/operation/delivery-return`)
**List Columns:** Return Date, Return No (RET00XXXXXX), Showroom, Delivered Date, Status, Edit User, Approved By

**Add/Edit Form:** Return Date, Showroom, Delivered Date, Line Items (Product, Qty)

---

## 13. Operation → Label Printing (`/operation/label-printing`)
**List Columns:** Date, Display No (LBL00XXXXXX), Status, Product, Label Count, Edit User, Approved By

**Add Form:** Date, Product (only Enable Label Print=true products), Label Count
- If product allows future-date → Date input turns YELLOW

---

## 14. Operation → Showroom Open Stock (`/operation/showroom-open-stock`)
**List Columns:** Showroom code, Stock As At (editable date)

**Edit:** Change "Stock As At" date to roll opening balance forward for closed days

---

## 15. Operation → Showroom Label Printing (`/operation/showroom-label-printing`)
**Form Fields:** Showroom Code (dropdown, auto-fills Text 1), Text 1 (editable), Text 2 (optional), Label Count (integer)

---

## 16. Operation → All Approvals (`/operation/approvals`)
**Groups shown with pending badge count:**
- Delivery, Disposal, Transfer, Stock BF, Cancellation, Delivery Return, Label Printing, Showroom Label Printing, Cashier Balance, Day-End

**Per record:** Reference No, Date, Showroom/Product, Submitted By, Submitted At, Notes, Line Items detail view
**Actions:** Approve, Reject (with rejection reason)

---

## 17. Production → Daily Production (`/production/daily-production`)
**List Columns:** Production Date, Production No (PRO00XXXXXX), Status, Edit User, Edit Date, Approved By

**Add/Edit Form:**
| Field | Type |
|-------|------|
| Production Date | Date |
| Line Items | Grid: Product, Section, Quantity |

---

## 18. Production → Production Cancel (`/production/production-cancel`)
**List Columns:** Cancelled Date, Cancelled No (PRC00XXXXXX), Status, Edit User, Approved By

**Add Form:** Cancellation Date, Line Items (Product, Section, Qty Cancelled)

---

## 19. Production → Current Stock (`/production/current-stock`)
**Display (real-time, read-only):**
| Column | Calculation |
|--------|-------------|
| Product | Code + Name |
| Open Balance | Latest approved Stock BF qty |
| Today Production | Sum approved Daily Production today |
| Today Production Cancelled | Sum approved Production Cancel today |
| Today Delivery | Sum approved Delivery today |
| Delivery Cancelled | Sum approved Delivery Cancellation today |
| Delivery Returned | Sum approved Delivery Return today |
| Today Balance | Open + Production − Cancelled − Delivery + Del.Cancelled + Returned |

---

## 20. Production → Stock Adjustment (`/production/stock-adjustment`)
**List Columns:** Date, Display No (PSA00XXXXXX), Status, Edit User, Approved By

**Add Form:** Adjustment Date, Line Items (Product, Section, Qty)

---

## 21. Production → Stock Adjustment Approval (`/production/stock-adjustment-approval`)
**List Columns:** Date, Display No, Edit User, Edit Date
**Actions:** Approve, Reject per record

---

## 22. Production → Production Plan (`/production/production-plan`)
**List Columns:** Plan Date, Plan No (PPL00XXXXXX), Status, Edit User, Reference, Comment, Approved By

**Add/Edit Form:**
| Field | Type | Notes |
|-------|------|-------|
| Plan Date | Date | |
| Day Type | Dropdown | Weekday / Saturday / Sunday / Holiday |
| Delivery Turn | Dropdown | 5:00 AM / 10:30 AM / 3:30 PM |
| Reference | Text | Free text e.g. "Monday Tuesday Wednesday 5.00am" |
| Comment | Text | Optional notes |
| Pre-loaded Summary | Grid | Product × Showroom quantities |

---

## 23. Production → All Approvals (`/production/approvals`)
**Groups:** Daily Production, Production Cancel, Stock Adjustment
**Actions:** Approve, Reject

---

## 24. DMS → Delivery Plan (`/dms/delivery-plan`)
**List Columns:** Plan Date, Plan No, Status, Reference, Delivery Turn, Day Type

**Add/Edit Form:**
| Field | Type | Notes |
|-------|------|-------|
| Plan Date | Date | |
| Day Type | Dropdown | Weekday / Saturday / Sunday |
| Delivery Turn | Dropdown | FK → Delivery Turns |
| Outlet Checkboxes | Boolean per outlet | Uncheck = outlet closed for this turn |
| Item Checkboxes | Boolean per product | Uncheck = item not produced this turn |
| Status | Enum | Draft → Confirmed → InProduction → Delivered |

---

## 25. DMS → Order Entry (`/dms/order-entry-enhanced`)
**Spreadsheet grid (Product × Outlet):**
| Column Group | Fields |
|---|---|
| Item | Product Name, Code |
| Variants | Full qty, Mini qty (shown per product config) |
| BAL | Available balance (from freezer stock) |
| Extra | Manually added extra qty |
| Total Full / Mini | Auto: sum of outlet qtys + Extra + Immediate Orders |
| Per-Outlet columns | One column per active outlet (dynamic) |

- Decimal input allowed where `allow_decimal_quantity=true`
- Outlet columns frozen: Item name/Code always visible when scrolling
- Outlet checkbox OFF → column zeroed/hidden
- Item checkbox OFF → row grayed out, excluded from production

---

## 26. DMS → Delivery Summary (`/dms/delivery-summary`)
**Display:**
| Column | Notes |
|--------|-------|
| Product | Name + Code |
| Y/N flag | Is item produced this turn |
| Per-outlet columns | Qty per outlet |
| Total Full | Sum of all outlets Full |
| Total Mini | Sum of all outlets Mini |
| Grand Total | Full + Mini (shown as-is, e.g. 199) |
| Customized sub-row | Customized orders shown separately under product row |

**Controls:**
- "Use Freezer Stock" checkbox per product → Stores Issue Qty = Grand Total − Freezer Stock (stores sheet only; production always shows full total)

---

## 27. DMS → Immediate Orders (`/dms/immediate-orders`)
**List Columns:** Order Date, Order No, Product, Qty Full, Qty Mini, Is Customized, Status, Requested By

**Add Form:**
| Field | Type | Notes |
|-------|------|-------|
| Delivery Plan | Dropdown (nullable) | Link to a delivery plan or standalone |
| Product | Dropdown | |
| Qty Full | Decimal | |
| Qty Mini | Decimal | |
| Is Customized | Boolean | |
| Customization Notes | Text | Required if Is Customized=true |
| Status | Enum | Pending → Confirmed → Cancelled |

---

## 28. DMS → Default Quantities (`/dms/default-quantities`)
**Grid:** Product × Outlet × Day Type → Default Qty Full, Default Qty Mini

---

## 29. DMS → Production Planner (`/dms/production-planner-enhanced`)
**Section-tabbed layout. Per section tab:**
| Element | Content |
|---------|---------|
| Header | Company Name, Section Name, Production Start Time, Effective Delivery Time |
| Item grid | Product, Total Full Qty, Total Mini Qty |
| Ingredient totals | Ingredient Name, Total Qty (recipe × production qty) — NO extra quantities |
| Sub-tables | Pattie Dough, Chinese Roll Batter, Egg Wash, Rotty Dough, Prawn Bun Batter etc. |
| Customized orders | Shown separately with visual distinction |
| Footer | Printed By, Issued By, Checked By |

**Special items:**
- Sugar Candy Bun: Dough table + Bun table (two separate sub-tables)
- Viyana Roll Full + Mini: separate rows with separate recipe calculations
- Egg Bun (Filling section): Raw Eggs row for filling + Boiled Eggs row for garnishing
- Rounding: rounded value shown with standard reference value alongside

---

## 30. DMS → Stores Issue Note (`/dms/stores-issue-note-enhanced`)
**Same as Production Planner BUT:**
| Addition | Detail |
|----------|--------|
| Extra quantities | Stores Qty = (Recipe qty × Production qty) + (Extra qty × Production qty) |
| Freezer deduction | Stores Issue Qty = Total − Freezer Stock (if enabled) |
| Available Balance | Shown per product |
| Bakery recipe | Also printed for stores |

**Export:** PDF per section, Excel per section (sectionwise)

---

## 31. DMS → Freezer Stock (`/dms/freezer-stock`)
**Form Fields:** Product, Section (nullable), Quantity, Stock Date, Notes

**Display:** Product, Section, Quantity, Stock Date, Created By

---

## 32. DMS → Recipe Management (`/dms/recipe-management`)
**Product recipe editor:**
| Field | Notes |
|-------|-------|
| Product | Dropdown |
| Section | Dropdown (which section this recipe belongs to) |
| Variant | Full / Mini / Both |
| Recipe Name | Nullable (e.g. "Dough", "Bun" for Sugar Candy Bun dual sub-recipe) |
| Effective From | Date |

**Recipe Lines (per recipe):**
| Field | Notes |
|-------|-------|
| Ingredient | Dropdown |
| Qty Per Unit | Decimal |
| Is Percentage | Boolean |
| Percentage Source Product | Dropdown (if is_percentage=true) |
| Extra Qty Per Unit | Decimal (default 0) |
| Extra Qty Visible Stores Only | Boolean (default true) |
| Sort Order | Integer |

---

## 33. DMS → Recipe Templates (`/dms/recipe-templates`)
**Template Header:** Template Name (e.g. "Standard Vegetable Curry"), Description, Active
**Template Lines:** Ingredient, Qty Per Unit, Sort Order

---

## 34. DMS → Anytime Recipe Generator (`/dms/anytime-recipe-generator`)
**Inputs:** Product, Quantity, Section
**Output:** Calculated ingredient requirements for the given quantity

---

## 35. DMS → Dough Generator – Patties (`/dms/dough-generator/patties`)
**Inputs:** Total Pattie Count
**Output:** Pattie Dough table — Flour, Beehive, Salt, Eggs quantities

---

## 36. DMS → Dough Generator – Rotty (`/dms/dough-generator/rotty`)
**Inputs:** Total Rotty Count
**Output:** Rotty Dough table — Flour, Salt, Sugar, Eggs quantities; Chicken Rotty Egg Wrap sub-table

---

## 37. DMS → Reconciliation (`/dms/reconciliation`)
**Inputs:** Date, Delivery Turn
**Output:** Comparison of planned vs actual production quantities per product/section

---

## 38. DMS → Section Print Bundle (`/dms/section-print-bundle`)
**Inputs:** Date, Delivery Turn
**Output:** All section production planner sheets bundled for printing

---

## 39. DMS → Print Receipt Cards (`/dms/print-receipt-cards`)
**Inputs:** Delivery Plan or Date+Turn
**Output:** Receipt-style print layouts per outlet

---

## 40. DMS → Pivot Dashboard (`/dms/dashboard-pivot`)
**Display:**
- Item × Turn × Outlet quantity pivot table
- Total quantities per item across turns
- Filter by day type

---

## 41. DMS → DMS Recipe Upload (`/dms/dms-recipe-upload`)
**Function:** Export/upload recipe master data (DMS Recipe sheet equivalent)

---

## 42. DMS → xlsm Importer (`/dms/importer`)
**Function:** Import existing Excel workbook data into the system database

---

## 43. Reports (`/reports`)
**Two-panel layout:** Report Groups (left) + Report List (right)

| Group | Reports |
|-------|---------|
| General | Opening Balance, Service Charges, Unloading Plan |
| Cashier | Cashier Balance Report, Daily Cashier Reconciliation |
| Sales | Daily Sales Summary, Weekly Sales Trend, Product-wise Sales, Showroom-wise Sales |
| Delivery | Delivery Note (per outlet per turn), Delivery Summary, Delivery vs Disposal |
| Disposal | Daily Disposal by Showroom, Disposal by Category, Disposal Trend |
| Production | Daily Production Planner (per section), Stores Issue Note (per section), Production Summary, Recipe Card (per product), Ingredient Requirements |

**Each report inputs:** Date range, Outlet filter, Section filter, Format (PDF/Excel/JSON)
**Access rule:** Cannot generate reports before last Day-End Process date

---

## 44. Administrator → Day-End Process (`/administrator/day-end-process`)
**Pre-requisites:** Cashier Balance approved, Day NOT locked
**Default:** Previous day pre-selected on load
**Form:** Showroom checkbox, Showroom Name, Cashier Name (dropdown), Cashier Balance (numeric), System Balance (auto-calculated), Status

---

## 45. Administrator → Cashier Balance (`/administrator/cashier-balance`)
**Default:** Previous day pre-selected
**Auto-select:** All active showrooms checked (user cannot uncheck)
**Fields per showroom:** Showroom Is Closed (boolean), Cashier Name (dropdown, disabled if balance=null or closed), Cashier Balance (numeric, disabled if closed)
**Rule:** Once submitted for a date → entire form is read-only

---

## 46. Administrator → System Settings (`/administrator/system-settings`)
| Setting | Default | Description |
|---------|---------|-------------|
| Dispos Date Change | 0 | Allow non-admin to change Disposal Date |
| Delivered Date Change | 0 | Allow non-admin to change Delivered Date |
| Block current date in Stock BF | 1 | Block today for Stock BF non-admins |
| Day Locking for non-admins | 1 | Allow non-admins to lock a day |
| Day UnLocking for non-admins | 0 | Allow non-admins to unlock a day |

---

## 47. Administrator → Label Settings (`/administrator/label-settings`)
**Three sections:**
1. **Defined Label Printers:** Printer Name, connection string (Add/Edit)
2. **Set Template to Printer:** Template Name → Printer mapping (Edit)
3. **Defined Label Printing Comments:** Pre-defined comment text options (Add)

**Known templates:** 40×17mm, 50×40 sandwich, 55×26 (Rice & Curry), Showroom Label, etc.

---

## 48. Administrator → Delivery Plan (`/administrator/delivery-plan`)
**Rules:** Future dates only (max 3 days ahead), Delivery Time auto-set to 5:00 AM
**Display:** Pre-configured plan groups (e.g. "Thursday Friday – 5.00am")
**Add/Edit:** Date range, Day Type, Delivery Turn, Showrooms, Products

---

## 49. Administrator → Security (`/administrator/security`)
**Tab 1 – Users** (`/administrator/users`)**:**
| Field | Notes |
|-------|-------|
| Username | Unique |
| First Name, Last Name | Text |
| Password | Hashed |
| Role | Dropdown → Roles |
| Showroom assignments | Multi-select |
| Active | Boolean |

**Tab 2 – Roles** (`/administrator/roles`)**:**
Role Name, Permissions (checkbox matrix per subsection per action)

**Permissions matrix actions:** View, Create, Edit, Delete, Approve, Reject, Print, Export, Import, Execute, Generate, Lock, Back Date, Future Date

---

## 50. Administrator → Day Lock (`/administrator/day-lock`)
**Calendar UI:** Monthly view, Prev/Next navigation
**Each date:** Shows lock icon if locked. Click to toggle Lock/Unlock
**Hard lock:** Once locked, NO user (including Admin) can create/edit records for that date

---

## 51. Administrator → Approvals (`/administrator/approvals`)
**Groups with pending badge:**
Daily Production, DayEnd Process Balance, Delivery, Delivery Cancel, Delivery Return, Disposal, End Process, Label Printing, Production Cancel, Production BF, Stock Transfer, Stock BF, Cashier Balance (14 operations)

**Per record:** Reference No, Date, Submitter, Details view
**Actions:** Approve, Reject (with reason)

---

## 52. Administrator → Showroom Employee (`/administrator/showroom-employee`)
**List Columns:** Employee ID, Employee Name, Showroom, Job Title, Approved, Active

**Add/Edit Form:** Employee ID, Employee Name, Showroom (dropdown), Job Title, Approved (boolean), Active (boolean)

---

## 53. Administrator → Price Manager (`/administrator/price-manager`)
**List Columns:** Effected From, Effected To, Comment, User, Edit Date

**Add/Edit Form:**
| Field | Notes |
|-------|-------|
| Product | Dropdown |
| Old Price | Auto-filled from current |
| New Price | Decimal |
| Effective From | Future date only |
| Comment | Text |

---

## 54. Administrator → WorkFlow Config (`/administrator/workflow-config`)
**List:** Operation Name, Approval Required (toggle)
**14 Operations:** Daily Production, DayEnd Process Balance, Delivery, Delivery Cancel, Delivery Return, Disposal, End Process, Label Printing, Production Cancel, Production BF, Stock Transfer, Stock BF, Cashier Balance, Showroom Label Printing

---

## 55. Administrator → Day-Types (`/administrator/day-types`)
**Fields:** Day Type Name (Weekday/Saturday/Sunday/Holiday/Special), Description, Active
**Used to:** Load default quantities in Order Entry grid

---

## 56. Administrator → Delivery Turns (`/administrator/delivery-turns`)
**Turn Header Fields:** Turn Name (e.g. "5:00 AM Delivery"), Target Delivery Time, Active, Sort Order

**Per-section timing (sub-form):**
| Field | Notes |
|-------|-------|
| Section | Dropdown |
| Production Start Time | Full timestamp (can be previous day, e.g. 8:00 PM Mon for 5 AM Tue) |
| Effective Delivery Time | Full timestamp |
| Notes | Text |

---

## 57. Administrator → Custom Orders (`/administrator/custom-orders`)
**Fields:** Order Date, Product, Qty Full, Qty Mini, Is Customized, Customization Notes, Status, Requested By

---

## 58. Administrator → Grid Configuration (`/administrator/grid-configuration`)
**Function:** Configure column visibility/order for each grid in the system

---

## 59. Administrator → Rounding Rules (`/administrator/rounding-rules`)
**Fields:** Product, Rounding Value (integer), Standard Quantity (reference value shown in production planner), Active

---

## 60. Administrator → Section Consumables (`/administrator/section-consumables`)
**Fields:** Section, Consumable Item (ingredient), Default Qty, Notes
**Purpose:** Fixed consumables per section (gloves, oil papers, etc.) auto-added to stores issue notes

---

## 61. Administrator → Label Templates (`/administrator/label-templates`)
**Fields:** Template Name, Dimensions (e.g. 40×17mm), Printer (dropdown), Active

---

## KEY BUSINESS RULES SUMMARY

| Rule | Page | Detail |
|------|------|--------|
| Decimal quantities | Products, Order Entry | Per product: allow_decimal_quantity flag |
| Product types | Products | Raw Material / Semi-Finished / Finished / Section |
| Extra qty stores only | Recipe Management | extra_qty_per_unit visible only on Stores Issue Note |
| Freezer deduction stores only | Delivery Summary, Stores Issue Note | Production always shows full total |
| Customized orders separate but counted | Delivery Summary, Production Planner | Sub-row display, included in grand total |
| Outlet/Item checkboxes | Delivery Plan, Order Entry | Outlet closed = zero; Item not produced = excluded |
| Same item two weights | Products | Admin sets weight_grams per product variant |
| Dual sub-recipe | Recipe Management | Sugar Candy Bun: "Dough" + "Bun" named sub-recipes |
| Multi-section product | Product Sections | Egg Bun: Bakery + Filling. Sandwich: 4 sections |
| Production start time cross-midnight | Delivery Turns | Full timestamp stored, UI shows (Previous Day) label |
| Rounding | Rounding Rules, Production Planner | Rounded value + standard reference shown together |
| Soft delete only | All pages | No permanent delete; Active=FALSE hides record |
| Day lock = absolute | Day Lock | No edits for locked date by anyone, enforced at API |
| Cashier Balance before Day-End | Day-End Process | Day-End disabled if Cashier Balance not approved |
| Reports date restriction | Reports | Cannot generate before last Day-End Process date |
