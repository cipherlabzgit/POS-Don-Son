

Don & Sons (Pvt) Ltd  ·  Delivery Management System  ·  Software Requirements & Implementation Plan  ·  Confidential
## DON & SONS (PVT) LTD.
## DELIVERY MANAGEMENT SYSTEM (DMS)
## Complete Software Requirements & Implementation Plan
## Document Version2.0 — Final
DateApril 2026
Tech StackNext.js (Frontend) + ASP.NET Core 8 (Backend) + PostgreSQL (Database)
ClassificationConfidential — For Development Use Only
## TABLE OF CONTENTS
- Global UI / UX Requirements
## 2. Dashboard
- Inventory Module (Products · Category · Unit of Measure · Ingredient)
## 4. Showroom Management
- Operations Module (Delivery · Disposal · Transfer · Stock BF · Cancellation · Delivery Return · Label Printing · Showroom
## Open Stock · Showroom Label Printing)
## 6. Reports Module
- Administrator Module (Day-End Process · Cashier Balance · System Settings · Label Settings · Showroom Calendar
[REMOVED] · Delivery Plan · Security · Day Lock · Approvals · Showroom Employee · Price Manager · WorkFlow Config)
- Production Module (Daily Production · Production Cancel · Current Stock · Stock Adjustment · Stock Adjustment Approval ·
## Production Plan)
## 9. System Architecture & Database Design
- API Endpoint Reference
## 11. Development Phases & Milestones
- Non-Functional Requirements
## 13. Risk Register

Don & Sons (Pvt) Ltd  ·  Delivery Management System  ·  Software Requirements & Implementation Plan  ·  Confidential
## 1. GLOBAL UI / UX REQUIREMENTS
## 1.1 Brand Theme
The  entire  application  must  be  themed  to  match  the  Don  &  Sons  brand  identity.  The  colour  scheme  is  derived  from  the
company  logo:  Red  (#C8102E)  as  the  primary  colour,  Yellow  (#FFD100)  as  the  accent,  and  White  for  text  on  dark
backgrounds. Every page, panel, form, button, chart, and navigation element must follow this colour scheme consistently.
1.2 Mobile-Friendly / Responsive Design
All  web  pages  must  be  built  mobile-friendly.  Layouts  must  adapt  correctly  from  320  px  (mobile  phones)  up  to  1920  px
(desktop monitors). Showroom cashiers and staff will primarily access the system on tablets and mobile phones in the field.
1.3 Per-Page Colour Coding
Each module page can have its own accent colour, configured by the Admin in Label Settings. When the Admin sets a hex
colour  for  a  specific  page,  that  colour  must  replace  all  blue/default  accent  colours  on  that  page  —  including  table  headers,
action buttons, and the left-panel navigation selected-item highlight.
H Note: Example: Admin sets Delivery page colour = #FF0000. Every blue element on the Delivery page changes to red. The left-panel
navigation highlighted item also turns red.
## 1.4 Navigation Structure
Collapsible  left-panel  sidebar.  Top-level  items:  Dashboard,  Inventory,  Show  Room,  Operation,  Reports,  Administrator,
Production. Each expands to show its sub-items. Active item is highlighted per the colour-coding rule above.
## 1.5 Soft Delete — No Permanent Delete
No record may ever be permanently (hard) deleted from any table. All records have an Active Status flag (TRUE / FALSE).
Setting  Active  =  FALSE  hides  the  record  from  all  normal  operation  screens  and  dropdowns,  but  the  record  remains  in  the
database and is auditable.
## 1.6 User Role Access & Date Entry Rules
The following rules apply consistently across all operation screens:
Role / ScenarioRecords VisibleDate Entry Allowed
Admin / Super AdminALL records across ALL datesAny date — back or future
Manager (Admin-granted
permission)
ALL records OR own records depending
on config
Back-date and/or future-date as Admin has
permitted
Regular UserOnly own records for today or future
dates (Today / Today+)
Today and future only — back-date BLOCKED
Disposal — Regular UserOnly own records for TODAY onlyToday only — no back-date, no future date
Transfer, Stock BF,
## Cancellation, Delivery
## Return — Regular User
Only own records for todayBack-date up to 3 days allowed. Future date
## BLOCKED.
## Label Printing — Regular
## User
Only own records for todayBack-date and future date BLOCKED by default
(Admin can grant exception)
Delivery — Regular UserOnly own records entered for today or
future
Today and future (Today+) allowed. Back-date
## BLOCKED.

DON & SONS (PVT) LTDDelivery Management System — Implementation Plan
## Page 3   |   Version 2.0   |   April 2026   |   Confidential
## 2. DASHBOARD
The Dashboard is the default landing page after login. It must be colourful and information-rich.
2.1 Required Widgets (4-quadrant layout)
WidgetChart TypeDescription
Sales Trend for Last 7 DaysLine / Area chartShows total delivery sales value per day for the last 7 calendar days.
X-axis = dates (e.g., 03 Sat, 04 Sun ... 09 Fri). Y-axis = value (e.g.,
## 1,300,000 – 1,800,000).
Disposal by Section —
## Yesterday
Pie / Donut chartShows disposal quantity per product category for yesterday. Each
category (Action, Biscuit, Bread, Bun, Butter Cream, Cake Sheets,
Drinks, Icing Cake, Party, Pastry, Pieces, Pizza, PR, Rice & Curry,
Rotty, Sandwich, Shortbread, Soup) gets a slice with label and value.
Today Top DeliveriesTable + Bar chartLeft side: table listing Showroom code and today's delivery count,
sorted by count descending (e.g., DAL=15, RAG=7, RAN=5, DBQ=5,
KAD=5, KEL=4, KML=4, SGK=4, WED=4). Right side: matching bar
chart.
Delivery vs Disposal Trend
## — 7 Days
Grouped Bar chartSide-by-side bars per product category: Delivery quantity vs Disposal
quantity over the last 7 days.
## 2.2 Additional Header Elements
News  feeder  /  notification  ticker  displayed  in  the  top-right  header  area  (shows  offline/online  status  and  system
notifications). Top-right corner: logged-in user name and role with dropdown for logout/settings.

DON & SONS (PVT) LTDDelivery Management System — Implementation Plan
## Page 4   |   Version 2.0   |   April 2026   |   Confidential
## 3. INVENTORY MODULE
Inventory is the master-data management hub for all product-related configuration. It has four sub-modules accessible
from the left panel under 'Inventory'.
3.1 Products (Inventory → Products)
Central  product  catalogue.  Supports  adding  a  new  product,  editing  an  existing  product,  and  toggling  Active  Status
TRUE/FALSE. No permanent delete ever.
List View — columns displayed:
ColumnDescription
Product CategoryThe category this product belongs to.
Product CodeUnique code (e.g., ACT33, ACT22, ACT32).
Product DescriptionFull product name (e.g., Chicken Shawarma, Popcorn Chicken, String Hoppers Pack).
Unit PriceSelling price per unit (e.g., 750.00, 120.00, 30.00).
Unit of MeasureUOM code (e.g., Nos).
Require Open StkYes / No — whether this product requires a daily Stock BF entry.
ActiveYes / No — soft-delete status.
ActionsEdit icon, Info/View icon, Toggle Active icon.
## Pagination:
Records per page selector (10, 25, 50). Search box. Pagination: Previous | 1 | 2 | 3 | 4 | 5 | ... | 47 | Next (470 products
total shown in reference).
## Add / Edit Form Fields:
FieldTypeBusiness Rule
Product CodeTextUnique identifier. Prefix convention: ACT (Action items), BR (Bread), BU
(Bun), SAN (Sandwich), SE (Short-Eat), PZ (Pizza), PS (Pastry/Pie), RO
(Rotty), PTY (Pattie/Burger), PR (Special Bread), BI (Biscuit), BC (Butter
Cream), IC (Icing Cake), RO (Rotty), etc.
Product DescriptionTextFull display name used across all screens, labels, and reports.
Product CategoryDropdownFK → Category table. Active categories only.
Unit of MeasureDropdownFK → UOM table (G, ml, Nos, etc.).
Unit PriceDecimalSelling price per unit. Used in delivery value calculations.
Require Open StockBooleanIf Yes, this product must have a Stock BF entry each day before operations.
Enable Label PrintBooleanIf TRUE, product is listed in the Label Printing operation. Special rule: if
Admin has allowed future-date printing for this product (Today or Today+),
the Date input box turns YELLOW as a visual alert when this product is
selected.
Active StatusBooleanDefault TRUE. Setting to FALSE hides from all dropdowns and operation
screens. Cannot be permanently deleted.
3.2 Category (Inventory → Category)
Manages the product category master list. When a product is being created or edited, the Category dropdown is sourced
from this list.
Known categories (from reference data):
Action, BAL (Balanceing Malabe), Biscuit, Bread, Bun, Butter Cream, Cake Sheets, Chocolate, Christmas, Desert, DR
(Don's Restaurant), Drinks, Grocery, Icing Cake, INACTIVE, Party, Pastry, Pieces, Pizza, PR (Palm Roll), Rice & Curry,
## Rotty, Sandwich, Shortbread, Soup.
List View — columns:

DON & SONS (PVT) LTDDelivery Management System — Implementation Plan
## Page 5   |   Version 2.0   |   April 2026   |   Confidential
Code, Description, Actions (Edit icon, Info icon, Toggle Active icon). 25 records per page by default. Search box.
## Add / Edit Form:
FieldTypeRule
CodeTextShort unique code (e.g., BUN, BREAD, BAL, DR).
DescriptionTextFull category name displayed on product forms and reports.
ActiveBooleanSoft-delete. Inactive categories must not appear in product creation dropdowns.
3.3 Unit of Measure (Inventory → Unit of Measure)
Manages measurement units. Currently 3 units exist in the live system: G (Gram), ml (Millilitres), Nos. Admin can add
more.
List View — columns:
Code, Description, Actions (Edit icon, Info icon). 10 records per page. Shows 1 to 3 of 3 entries (current data).
## Add / Edit Form:
FieldTypeRule
CodeTextShort unique code (e.g., G, ml, Nos, Kg, Ltr).
DescriptionTextFull name (e.g., Gram, Millilitres, Nos, Kilogram, Litre).
3.4 Ingredient (Inventory → Ingredient)
Manages  the  raw-material  and  semi-finished  ingredient  master  list.  These  ingredients  are  used  in  recipe  lines  in  the
Production Plan module to calculate ingredient requirements. 127 ingredients exist in the live reference system.
List View — columns:
Code, Name, Unit, Actions (Edit icon, Info icon). 10 records per page, paginated (1 to 10 of 127 entries). Search box.
Known ingredients (sample from reference):
B1=Magarine,  BS1=White  Sandwich  Bread  Large  Slice,  BS2=Brown  Bread  Slice,  BS3=White  Sandwich  Bread  Small
Slice, C1=Sliced Cheese, C2=Block Cheese, CF1=Candied Peel, CF2=Puhul Dose, CF3=Dates, CF4=Fruit Cocktail, ...
(127 total).
## Add / Edit Form:
FieldTypeRule
CodeTextUnique short code (e.g., B1, BS1, C1, CF1).
NameTextFull ingredient name (e.g., Magarine, White Sandwich Bread Large Slice).
UnitDropdownFK → UOM table. Required.
ActiveBooleanSoft-delete. Inactive ingredients hidden from recipe editors.

DON & SONS (PVT) LTDDelivery Management System — Implementation Plan
## Page 6   |   Version 2.0   |   April 2026   |   Confidential
## 4. SHOWROOM (OUTLET) MANAGEMENT
Manages all physical showroom / outlet locations. Supports add, edit, and Active Status toggle. No permanent delete.
4.1 List View — columns:
Name  (code),  Desc  (full  name),  City,  Dashborad  (Yes/No  —  whether  shown  on  Dashboard),  Active  (Yes/No),  Actions
(Edit icon, Info icon).
Known showrooms (30 total in live reference):
CodeDescriptionCity
BCBakers CornerMakola Road
BWBandarawattaBandarawatta
DALDalugamaDalugama
DBQDalugama BBQDalugama
## DM2DM2DM2
## DM3DM3DM3
## DM4DM4DM4
DM5DM5Dalugama
DM6DM6Dalugama
KADKadawathaKadawatha
KELKelaniyaKelaniya
## KMLKML—
RAGRagamaRagama
RANRanmuthugalaRanmuthugala
SGKSapugaskandaSapugaskanda
## SJESJE—
## SRPSRP—
WEDWedamullaWedamulla
YRKYork—
## 4.2 Add / Edit Form Fields:
FieldTypeRule
Name (Code)TextShort unique code used everywhere in the system (e.g., DAL, DBQ, KAD).
DescriptionTextFull location name (e.g., Dalugama, Dalugama BBQ, Kadawatha).
CityTextCity or area name.
DashboardBooleanIf Yes, this showroom appears in the Dashboard 'Today Top Deliveries' widget.
ActiveBooleanSoft-delete. Inactive showrooms are hidden from all operation screens and
dropdowns.

DON & SONS (PVT) LTDDelivery Management System — Implementation Plan
## Page 7   |   Version 2.0   |   April 2026   |   Confidential
## 5. OPERATIONS MODULE
The  Operations  module  is  the  core  daily  transactional  module.  It  contains  nine  sub-modules  accessible  from  the  left
panel under 'Operation'.
## 5.1 Delivery
Used  to  record  all  deliveries  dispatched  to  showrooms.  This  is  the  highest-volume  transaction  module.  796  delivery
records shown in the live reference system.
List View — columns:
Delivery  Date,  Delivery  No  (format:  DEL00XXXXXX  —  e.g.,  DEL00528848),  Showroom,  Status  (Approved  /  Pending  /
Rejected),  Edit  User,  Edit  Date,  Approved/Rejected  By,  Action  icons.  Header  buttons:  Show  Previous  Records,  Add
New, Print DN.
## Access & Date Rules:
Admin / Super AdminSees ALL records across ALL dates. Can enter any date (back or future).
Regular UserSees only records they entered for today or future dates (Today / Today+). No back-date entry
allowed.
Back / Future DateOnly Admin or an Admin-permitted Manager (Specific User) may enter back-dates or future
dates. Regular users get an error if they attempt this.
## Colour Coding:
The Admin sets a theme colour for the Delivery page via Administrator → Label Settings. That colour replaces all accent
colours on this page — table headers, buttons, left-panel navigation selected highlight.
## 5.2 Disposal
Used to record unsold/expired showroom stock disposals. 169 disposal records in live reference.
List View — columns:
Disposal Date, Disposal No (format: DIS00XXXXXX — e.g., DIS00087910), Showroom, Delivered Date (the date of the
original delivery), Status, Edit User, Approved/Rejected By, Action icons. Header buttons: Show Previous Records, Add
## New.
## Access & Date Rules:
Admin / Super AdminSees ALL records across ALL dates.
Regular UserSees only their own records for TODAY only. No back-date, no future date.
H Note: Colour Coding applies to this page.
5.3 Transfer (Stock Transfer — Showroom to Showroom)
Used to transfer stock from one showroom to another. 61 transfer records in live reference.
List View — columns:
Transfer Date, Transfer No (format: TRN00XXXXXX — e.g., TRN00023925), ShowRoom From, ShowRoom To, Status,
Edit User, Edit Date, Approved/Rejected By, Action icons. Header buttons: Show Previous Records, Add New.
## Access & Date Rules:
Admin / Super AdminSees ALL records.
Regular UserFuture dates BLOCKED. Back-date up to 3 days is allowed.
POS CashierCashier can also create showroom-to-showroom transfers via the POS front-end interface
(separate from admin panel).
H Note: Colour Coding applies to this page.

DON & SONS (PVT) LTDDelivery Management System — Implementation Plan
## Page 8   |   Version 2.0   |   April 2026   |   Confidential
5.4 Stock BF (Stock Brought Forward — Opening Balance)
Records the daily closing/opening stock balance for each showroom. 94 entries in live reference.
List View — columns:
Date,  Display  No  (format:  SBF00XXXXXX  —  e.g.,  SBF00053186),  ShowRoom,  Status,  Edit  User,  Edit  Date,
Approved/Rejected By, Action icons. Header buttons: Show Previous Records, Add New.
## Access & Date Rules:
Admin / Super AdminSees ALL records.
Regular UserFuture dates BLOCKED. Back-date up to 3 days is allowed.
POS CashierCashier can also enter Stock BF via the POS front-end interface.
H Note: Colour Coding applies to this page.
5.5 Cancellation (Delivery Cancellation)
Records delivery cancellations. 76 cancellation records in live reference.
List View — columns:
Cancellation  Date,  Cancellation  No  (format:  DCN00XXXXXX  —  e.g.,  DCN00033672),  Showroom,  Delivered  Date,
Status, Edit User, Edit Date, Approved/Rejected By, Action icons. Header buttons: Show Previous Records, Add New.
## Access & Date Rules:
Admin / Super AdminSees ALL records.
Regular UserFuture dates BLOCKED. Back-date up to 3 days is allowed.
POS CashierCashier can also enter Delivery Cancellations via the POS front-end interface.
H Note: Colour Coding applies to this page.
5.6 Delivery Return (Return to Production)
Records product returns from showrooms back to production. 32 entries in live reference.
List View — columns:
Return Date, Return No (format: RET00XXXXXX — e.g., RET00019374), Showroom, Delivered Date, Status, Edit User,
Edit Date, Approved/Rejected By, Action icons. Header buttons: Show Previous Records, Add New.
## Access & Date Rules:
Admin / Super AdminSees ALL records.
Regular UserFuture dates BLOCKED. Back-date up to 3 days is allowed.
POS CashierCashier can also enter Delivery Returns via the POS front-end interface.
H Note: Colour Coding applies to this page.
## 5.7 Label Printing
Allows users to submit print requests for product labels. Only products where Enable Label Print = TRUE are available
for selection. 518 label print requests in live reference.
List View — columns:
Date, Display No (format: LBL00XXXXXX — e.g., LBL00135772), Status, Product (e.g., PI31-Cake Cuts, BI9-Doughnut,
BC16-Special   Cake,   PI2-Ribbon   Cake   Piece,   IC7-Chocolate   Cake   A,   RO4-Chicken   Rotty,   RO3-Fish   Rotty,
BI30-Coconut  Cookie,  BR2-Sandwich  Bread  Large,  BR9-Kurakkan  Slice  Pack),  Label  Count,  Edit  User,  Edit  Date,
Approved/Rejected By, Action icons. Header buttons: Show Previous Records, Add New.
## Access & Date Rules:
Admin / Super AdminSees ALL records. Can enter any date.

DON & SONS (PVT) LTDDelivery Management System — Implementation Plan
## Page 9   |   Version 2.0   |   April 2026   |   Confidential
Regular UserNo back-date, no future-date by default.
## Admin-permitted
## Manager
Can enter back-date or future-date if Admin has explicitly granted permission.
Yellow Date Box (special)If Admin has configured a specific product to allow future-date label printing (Today or
Today+), then when that product is selected in the Add form, the Date input box turns
YELLOW as a visual warning indicator.
H Note: Colour Coding applies to this page.
## 5.8 Showroom Open Stock
Displays  the  most  recently  submitted  Stock  BF  record  date  per  showroom.  Admin  can  edit  the  'Stock  As  At'  date  of  a
showroom's last Stock BF record to roll the opening balance forward to cover days when the showroom was closed.
List View — columns:
Showroom (code), Stock As At (editable date — e.g., 10/01/2026 for most showrooms, 09/01/2026 for SJE), Edit icon,
Info icon.
## Use Case Example:
Last Stock BF Date01/01/2026
Showroom Closed02/01/2026 and 03/01/2026
Admin ActionEdit the 'Stock As At' date of the 01/01/2026 entry to 04/01/2026, so that entry becomes the
opening balance for 04/01/2026 — covering the closure gap.
## 5.9 Showroom Label Printing
Prints labels showing the Showroom Code Name. The form allows selecting from a dropdown list of showroom codes,
entering custom text lines, and specifying the label count.
Form — 'New Showroom Label Print Request':
FieldTypeRule
Showroom CodeDropdownList of all active showroom codes. Selecting a showroom auto-fills Text 1 with
the code.
Text 1Text (req'd)Editable — auto-populated with showroom code (e.g., WED).
Text 2TextOptional second line of text for the label.
Label CountInteger (req'd)Number of labels to print.
Submit button generates the label print request. The label is printed via the printer configured for the Showroom Label
template in Label Settings.

DON & SONS (PVT) LTDDelivery Management System — Implementation Plan
## Page 10   |   Version 2.0   |   April 2026   |   Confidential
## 6. REPORTS MODULE
The Reports page uses a two-panel layout: Report Group list on the left, Report List on the right. Clicking a group filters
the available reports.
6.1 Report Groups and Reports
GroupReports Available
GeneralOpening Balance, Service Charges, Unloading Plan
CashierCashier Balance Report, Daily Cashier Reconciliation
SalesDaily Sales Summary, Weekly Sales Trend, Product-wise Sales, Showroom-wise Sales
DeliveryDelivery Note (per outlet per turn), Delivery Summary, Delivery vs Disposal comparison
DisposalDaily Disposal by Showroom, Disposal by Category, Disposal Trend
ProductionDaily Production Planner (per section), Stores Issue Note (per section), Production Summary, Recipe
Card (per product), Ingredient Requirements
## 6.2 Access & Date Restriction Rules
AdminReports can be generated for dates from the last submitted Day-End Process date up to the
current date.
Permitted UsersSame range, but only for reports Admin has granted access to.
HARD RESTRICTIONReports for dates BEFORE the last submitted Day-End Process are completely blocked for
ALL users including Admin. This is a non-negotiable data-integrity lock.
## 6.3 Report Output Formats
Each report supports: on-screen paginated view, Print Preview, PDF Download, Excel Export.

DON & SONS (PVT) LTDDelivery Management System — Implementation Plan
## Page 11   |   Version 2.0   |   April 2026   |   Confidential
## 7. ADMINISTRATOR MODULE
The Administrator module contains twelve sub-sections for system configuration and end-of-day processing. Accessible
via 'Administrator' in the left navigation.
7.i Day-End Process
Finalises the operational day for all showrooms. Links cashier declarations to end-of-day records.
## Behaviour Rules:
Default Date on LoadWhen the page loads, the PREVIOUS day is pre-selected automatically in the Process Date
field (not today).
Cashier Balance Pre-reqIf Cashier Balance for the selected date has NOT been approved yet, ALL Day-End fields and
submission are DISABLED.
Day Lock BlockIf the selected date has been Day-Locked, Day-End Process is completely blocked for that
date.
Form LayoutCheckbox (select showroom), ShowRoom name, Cashier Name (dropdown — active cashiers
assigned to that showroom), Cashier's Balance (numeric input), System Balance
(auto-calculated from records), Status column.
## 7.ii Cashier Balance
Daily cashier cash declaration. Submitted once per day per showroom. The Cashier Balance must be approved before
Day-End Process can proceed.
## Behaviour Rules:
Default Date on LoadPrevious day is automatically selected when page loads.
## Already Submitted =
## Fully Locked
If Cashier Balance has already been submitted for the selected date, the ENTIRE form is
TOTALLY DISABLED (read-only). No edits possible.
Auto-Select All
## Showrooms
When creating a new Cashier Balance entry, ALL active showrooms are automatically selected
(checkboxes ticked). The user CANNOT uncheck any showroom.
## Cashier Balance = Null
## Rule
If the Cashier Balance text box for a showroom is blank (Null), the Cashier Name dropdown for
that showroom is automatically DISABLED.
## Showroom Is Closed
## Checkbox
A new checkbox 'Showroom Is Closed' must be added between the Showroom field and the
Cashier Name dropdown. This field did NOT exist before and must be newly implemented.
## Showroom Is Closed =
## TRUE
When 'Showroom Is Closed' is checked for a showroom: the Cashier Name dropdown is
CLEARED and DISABLED; the Cashier Balance text box is CLEARED and DISABLED; the
closure record is sent to the Approvals queue.
## 7.iii System Settings
Admin-only key-value configuration table. Controls system-wide behaviour switches.
Setting NameDefault
## Value
## Description
Dispos Date Change0Allow non-admin users to change the Disposal Date in Disposal entries.
0=Disallow, 1=Allow.
Delivered Date Change0Allow non-admin users to change the Delivered Date in Disposal entries.
0=Disallow, 1=Allow.
Block current date in Stock BF1Block the current date in Stock BF for non-admin users. 0=Disable block,
1=Enable block.
Day Locking for non-admins1Allow non-admin users to lock a day. 0=Disallow, 1=Allow.
Day UnLocking for non-admins0Allow non-admin users to unlock a day. 0=Disallow, 1=Allow.
## 7.iv Label Settings

DON & SONS (PVT) LTDDelivery Management System — Implementation Plan
## Page 12   |   Version 2.0   |   April 2026   |   Confidential
Admin-only page. Three sections: Defined Label Printers, Set Template to Printer, Defined Label Printing Comments.
## Defined Label Printers:
List of connected label printers. Each row: Printer Name, Edit icon. 'Add Printer' button. Known printers from live system:
ZTMC, Datamax 33835 BPL, Datamax 33220 650dpi DPL, Datamax 33220 650dpi DPL (another), Datamax TLP 3842
test.
Set Template to Printer:
Maps each label template to a specific printer. Each row: Template Name, Edit icon. Known templates from live system:
40×17  mm,  40×17  mm  Large,  50×40  sandwich,  50×45,  55×26  (Rice  &  Curry),  60×40,  Medium  Label  Only  Max  Date,
## Showroom Label, 50×26 Chocolates Ref, 60×50 Fruit Cake Label.
## Defined Label Printing Comments:
Pre-defined comment text options used when printing labels. 'Add Comment' button. Known comments from live system:
## KEEP UNDER REFRIGERATION, NO RICE, WHITE RICE, FISH, CONTAINS.
7.v Showroom Calendar — REMOVED
n The Showroom Calendar page is completely REMOVED from the system as per client instruction (explicitly
marked with 777 in the requirements document). This menu item must NOT appear in the left navigation panel.
No page, no route, no code for this feature.
## 7.vi Delivery Plan
Allows   permitted   users   to   pre-submit   delivery   plans   for   upcoming   dates.   Plans   are   pre-loaded   groups   of
showrooms/products for specific day types and delivery times.
## Rules:
Future Dates OnlyUsers can ONLY select future dates. Today and back-dates are blocked.
Maximum 3 Days AheadOnly up to 3 future days are permitted for selection.
Delivery Time = 5:00 AMThe delivery time is automatically set to 5:00 AM upon submission. The user cannot manually
change the delivery time on this screen.
Pre-loaded PlansThe page displays existing pre-configured delivery plans grouped by schedule (e.g., 'Thursday
Friday – 5.00 am', 'Sunday – 5.00 am', 'Saturday – 5.00 am', 'Monday Tuesday Wednesday –
5.00 am'). Add New creates a new plan group.
Delivery Table UpdateWhen a Delivery Plan is submitted by a user, it automatically creates corresponding pending
records in the Delivery operation table.
7.vii Security (Users & Roles)
Two-tab interface: Users tab and Roles and Capabilities tab.
Users Tab — columns:
User Name, User Role, Edit icon, Delete (soft) icon. 'Add New' button. 10 records per page. Search box. 57 users in live
reference system.
Known User Roles from live data:
SuperAdmin  (admin,  Dulan,  Hilary,  sumith1,  posadmin),  Stock  Adj  Only  (Chamila  Saranga),  Sales  Manager  (Viraj,
Hansa), Production Manager (Upul Nanayakkara), Production (Harshani), and others.
Roles and Capabilities Tab — Role Groups:
Role Group NameTypical Permissions
DeliveriesAccess to Delivery operations.
ProductionAccess to Production module.
Sales ManagerSales and delivery management access.
POS SystemPOS front-end access for cashiers.

DON & SONS (PVT) LTDDelivery Management System — Implementation Plan
## Page 13   |   Version 2.0   |   April 2026   |   Confidential
Role Group NameTypical Permissions
Asst Sales ManagerSubset of Sales Manager permissions.
Production ManagerFull Production access + approvals.
FinanceFinancial reports and cashier balance access.
Data EntryGeneral data entry permissions.
Pro & Stk Adj OnlyProduction and Stock Adjustment only.
ReportsRead-only reports access.
Stock Adj OnlyStock Adjustment Only.
Delivery OnlyDelivery entry only.
Each role has Edit icon, Permissions (capabilities) icon, Delete (soft) icon.
## 7.viii Day Lock
Calendar-based interface to lock or unlock individual operational days.
## Rules:
Hard LockOnce a day is locked, NO user at any role level — including Admin — can create or edit ANY
record for that date. This is an absolute lock.
Calendar UIMonthly calendar view with Prev/Next navigation. Each date shows a lock icon if locked. User
clicks a date to toggle Lock / Unlock.
System Settings tieWhether non-admin users can lock or unlock is controlled by 'Day Locking for non-admins' and
'Day UnLocking for non-admins' in System Settings.
## 7.ix Approvals
Central  approval  hub.  Shows  all  operations  that  have  approvals  enabled  via  WorkFlow  Config.  Users  with  approval
rights can Approve or Reject pending records here.
## Layout:
List of operation groups, each with a 'Pendings' badge counter (e.g., 'Daily Production — Pendings: 1'). Clicking a group
reveals  the  pending  records  with  Approve  /  Reject  actions.  Rejected  records  are  returned  to  the  submitter  with  a
rejection reason.
Operations that support approvals (configured via WorkFlow Config):
Daily  Production,  DayEnd  Process  Balance,  Delivery,  Delivery  Cancel,  Delivery  Return,  Disposal,  End  Process,  Label
Printing,  Production  Cancel,  Production  BF  (Stock  Adjustment),  Stock  Transfer,  Stock  BF,  Cashier  Balance  —  14
operations total in live reference.
## 7.x Showroom Employee
Manages  cashier  and  employee  profiles  for  each  showroom.  These  employees  are  mapped  to  POS  front-end  user
accounts. 28 employees in live reference.
List View — columns:
Employee  ID  (e.g.,  0001,  002,  025,  04,  1278,  1296,  1310,  1320,  1368),  Employee  Name,  Showroom,  Job  Title
(Cashier), Approved (status), Actions (Edit, Info). 10 records per page, paginated.
## Add / Edit Form:
FieldTypeRule
Employee IDTextUnique employee number.
Employee NameTextFull name (e.g., NA Sarath, M.U. Ashan Pradeep, K.R. Thilakanthie, A.M. Dananji
Kumara, W.M. Lahiru Prabath Kumara, Heshan Manjula Weerakody, P. Shashindra
Udantha Jayarathna Ariyarathna, W.P. Harshana Withanage).
ShowroomDropdownFK → Showrooms. Active only.

DON & SONS (PVT) LTDDelivery Management System — Implementation Plan
## Page 14   |   Version 2.0   |   April 2026   |   Confidential
FieldTypeRule
Job TitleTexte.g., Cashier.
ApprovedBooleanApproved / Pending. New employees require approval before they can be used.
ActiveBooleanSoft-delete.
## 7.xi Price Manager
Allows  Admin  to  schedule  product  price  changes  to  take  effect  on  a  future  date.  2,072  price  change  records  in  live
reference system.
List View — columns:
Effected  From  (start  date  —  e.g.,  01/Jan/2015),  Effected  To  (end  date  —  'Up  to  Date'),  Comment  (e.g.,  'Added  in
Product Master', 'Changed in Product Master'), User (who made the change — e.g., Dulan), Edit Date, Edit icon, Refresh
icon.
## Rules:
Future Date SchedulingAdmin selects a future effective date. The price update activates automatically on that date.
Audit TrailEvery price change is permanently logged with old price, new price, effective date, user, and
timestamp.
7.xii WorkFlow Config
Configures which operations require approval and assigns the approver role group for each operation.
List View — columns:
Operation  Name  (sortable),  Approval  Required  (toggle  icon  n),  10  records  per  page,  paginated  (14  operations  total
across 2 pages).
The 14 configurable operations (from live reference):
Operation NameApproval Toggle
Daily ProductionConfigurable via n icon
DayEnd Process BalanceConfigurable
DeliveryConfigurable
Delivery CancelConfigurable
Delivery ReturnConfigurable
DisposalConfigurable
End ProcessConfigurable
Label PrintingConfigurable
Production CancelConfigurable
Production BFConfigurable
Stock BFConfigurable
Stock TransferConfigurable
Cashier BalanceConfigurable
Showroom Label PrintingConfigurable

DON & SONS (PVT) LTDDelivery Management System — Implementation Plan
## Page 15   |   Version 2.0   |   April 2026   |   Confidential
## 8. PRODUCTION MODULE
The Production module manages all bakery and short-eats production activities. It has six sub-modules.
## 8.i Daily Production
Records actual production quantities per product per production section. 163 production records in live reference.
List View — columns:
Production  Date,  Production  No  (format:  PRO00XXXXXX  —  e.g.,  PRO00052166),  Status  (Pending  /  Approved  /
Rejected),  Edit  User,  Edit  Date,  Approved/Rejected  By,  Action  icons.  Header  buttons:  Show  Previous  Records,  Add
## New.
## Access Rules:
Admin / Super AdminSees ALL records.
Regular UserSees only their own records for today. No back-date, no future date.
H Note: Colour Coding applies to this page.
## 8.ii Production Cancel
Records production cancellations (items planned but not produced). 11 records in live reference.
List View — columns:
Cancelled  Date,  Cancelled  No  (format:  PRC00XXXXXX  —  e.g.,  PRC00006319),  Status,  Edit  User,  Edit  Date,
Approved/Rejected By, Action icons. Header buttons: Show Previous Records, Add New.
## Access Rules:
Admin / Super AdminSees ALL records.
Regular UserSees only their own records for today.
H Note: Colour Coding applies to this page.
## 8.iii Current Stock
Real-time production stock position for all products. Shows a live calculation as at the current date and time.
Table header shows:
'Production Stock — Current Production Stock on [date] [time]' (e.g., 1/10/2026 4:36:37 PM).
## Columns:
ColumnCalculation / Source
ProductProduct code + name.
Open BalanceMost recent approved Stock BF quantity for this product.
Today ProductionSum of all approved Daily Production records for today.
Today Production CancelledSum of all approved Production Cancel records for today.
Today DeliverySum of all approved Delivery records for today.
Delivery CancelledSum of all approved Delivery Cancellation records for today.
Delivery ReturnedSum of all approved Delivery Return records for today.
Today BalanceOpen Balance + Today Production − Today Production Cancelled − Today Delivery + Delivery
## Cancelled + Delivery Returned.
50 records per page. Search box. All products displayed (e.g., ACT1-Chicken Rice through to all 470+ products).
8.iv Stock Adjustment (Production Stock BF)

DON & SONS (PVT) LTDDelivery Management System — Implementation Plan
## Page 16   |   Version 2.0   |   April 2026   |   Confidential
Used to carry unsold production stock forward to the next day. Also called 'Production Stock BF'. Items produced today
but not dispatched are entered here to become the opening balance for tomorrow. 35 records in live reference.
List View — columns:
Date, Display No (format: PSA00XXXXXX — e.g., PSA00014974), Status, Edit User, Edit Date, Approved/Rejected By,
Action icons. Header buttons: Show Previous Records, Add New.
## Workflow:
After  submission,  the  Stock  Adjustment  goes  through  the  Production  BF  approval  workflow  (configured  in  WorkFlow
Config). Only after approval does it affect the Current Stock and subsequent Open Balance calculations.
## 8.v Stock Adjustment Approval
Dedicated approval screen for submitted Stock Adjustment records. The approver can approve or reject each pending
adjustment.
List View — columns:
Date,  Display  No,  Edit  User,  Edit  Date.  When  no  pending  records  exist,  shows  'No  data  available  in  table'  with  0  of  0
entries.
## 8.vi Production Plan
The most complex module. Generates daily production planning sheets and recipe calculations from ingredients defined
in the Inventory module. 16 production plans in live reference (over 2 pages).
List View — columns:
Plan  Date,  Plan  No  (format:  PPL00XXXXXX  —  e.g.,  PPL00012661),  Status,  Edit  User,  Edit  Date,  Reference  (e.g.,
'Sunday  5.00am',  '2026/01/10  11.00am  no12786',  'Saturday  5.00am',  'Thursday  Friday  5.00am',  'Monday  Tuesday
Wednesday  5.00am'),  Comment,  Approved/Rejected  By,  Action  icons.  Header  buttons:  Show  Previous  Records,  Add
## New.
## Add / Edit — Production Plan:
Plan DateDate of production.
Day TypeWeekday / Saturday / Sunday — used to auto-load default quantities per outlet per product.
Delivery Turn5:00 AM / 10:30 AM / 3:30 PM — admin-configurable turns.
ReferenceFree text (e.g., date + time + order number).
CommentOptional notes.
Pre-loaded SummaryWhen creating a new Production Plan, a new UI for entering Pre-Loaded Production
Summaries (product quantities per showroom) must be provided.
## Recipe Generation:
Once  a  Production  Plan  is  confirmed,  the  system  generates  recipe  sheets  per  production  section  using  the  Ingredient
data from the Inventory module. The generation follows a two-layer model:
- Per-Item Recipe: the ingredient quantity per 1 unit of a product (configured in product recipe settings).
- Calculated Recipe: Per-Item Quantity × Production Quantity = Total Ingredient Required.
- Stores Issue Version (separate view): Total Ingredient Required + Extra / Waste Allowance per ingredient. This view
is ONLY for stores staff — NOT shown on the production floor sheet.

DON & SONS (PVT) LTDDelivery Management System — Implementation Plan
## Page 17   |   Version 2.0   |   April 2026   |   Confidential
## 9. SYSTEM ARCHITECTURE & DATABASE DESIGN
## 9.1 Technology Stack
LayerTechnologyDetails
FrontendNext.js (React)TypeScript, Tailwind CSS, shadcn/ui components. Mobile-responsive.
Client-side form validation.
BackendASP.NET Core 8 Web APIEntity Framework Core 8 ORM. JWT + Refresh Token authentication.
Hangfire for scheduled jobs. SignalR for real-time notifications.
DatabasePostgreSQLPrimary relational database. Point-in-time recovery (PITR) enabled. Daily
automated dumps.
CacheRedisPhase 6 — for frequently read master data and session management.
PDF ExportServer-side PDF libraryFor production planner, stores issue note, delivery note PDF generation.
HostingConfigurableStateless API — horizontally scalable. HTTPS required.
## 9.2 Core Database Tables
TablePurposeKey Fields
usersSystem users + authid, username, password_hash, role_id, showroom_ids[],
active
user_rolesRole definitionsid, role_name, permissions_json
outletsShowrooms/outlets masterid, code, description, city, dashboard_visible, active
outlet_employeesCashier profilesid, employee_id, name, outlet_id, job_title, approved, active
product_categoriesProduct categoriesid, code, description, active
units_of_measureUOM masterid, code, description
productsProduct master (~470 items)id, code, description, category_id, uom_id, unit_price,
require_open_stock, enable_label_print, active
ingredientsRaw material master (127
items)
id, code, name, uom_id, active
product_recipesRecipe lines per productid, product_id, section_id, ingredient_id, qty_per_unit,
extra_qty_per_unit, effective_from
delivery_turnsDelivery turn configid, name, target_time
production_sectionsProduction section masterid, code, name, sort_order, active
delivery_plansProduction plan headerid, plan_no, plan_date, day_type, turn_id, status, reference,
comment
deliveriesDelivery transaction headerid, delivery_no, delivery_date, outlet_id, turn_id, status,
approved_by
delivery_linesDelivery line itemsdelivery_id, product_id, full_qty, mini_qty, unit_price
disposalsDisposal transaction headerid, disposal_no, disposal_date, outlet_id, delivered_date,
status
disposal_linesDisposal line itemsdisposal_id, product_id, qty, reason
stock_transfersTransfer headerid, transfer_no, transfer_date, from_outlet_id, to_outlet_id,
status
stock_transfer_linesTransfer line itemstransfer_id, product_id, qty
stock_bfStock BF headerid, display_no, bf_date, outlet_id, status, approved_by
stock_bf_linesStock BF line itemsstock_bf_id, product_id, closing_qty
delivery_cancellationsCancellation headerid, cancellation_no, date, outlet_id, delivered_date, status
delivery_returnsReturn headerid, return_no, return_date, outlet_id, delivered_date, status
label_printing_requestsLabel print queueid, display_no, request_date, product_id, label_count, status

DON & SONS (PVT) LTDDelivery Management System — Implementation Plan
## Page 18   |   Version 2.0   |   April 2026   |   Confidential
TablePurposeKey Fields
showroom_label_printsShowroom label requestsid, outlet_id, text1, text2, label_count, requested_at
daily_productionsProduction entry headerid, production_no, production_date, status, approved_by
daily_production_linesProduction line itemsproduction_id, product_id, section_id, qty
production_cancellationsProduction cancel headerid, cancelled_no, cancelled_date, status, approved_by
stock_adjustmentsStock adjustment header
(Prod BF)
id, display_no, adj_date, status, approved_by
stock_adjustment_linesAdjustment line itemsadjustment_id, product_id, section_id, qty
cashier_balancesCashier balance declarationsid, process_date, outlet_id, employee_id, cashier_balance,
system_balance, is_closed, status, approved_by
day_end_processesDay-end finalization recordsid, process_date, outlet_id, employee_id, cashier_balance,
system_balance, status
day_locksLocked datesid, lock_date, locked_by, locked_at
system_settingsKey-value configid, setting_name, setting_value, description
label_printersPrinter definitionsid, printer_name, connection_string, active
label_templatesTemplate-to-printer mappingid, template_name, dimensions, printer_id
label_commentsPre-defined label commentsid, comment_text
price_managerScheduled price changesid, product_id, old_price, new_price, effective_from,
effective_to, comment, created_by
workflow_configsPer-operation approval
settings
id, operation_name, approval_required, approver_role_id
audit_logsFull immutable audit trailid, table_name, record_id, action, old_json, new_json,
user_id, timestamp

DON & SONS (PVT) LTDDelivery Management System — Implementation Plan
## Page 19   |   Version 2.0   |   April 2026   |   Confidential
## 10. API ENDPOINT REFERENCE
10.1 Base URL
## /api/v1/
## 10.2 Endpoint Groups
GroupBase PathKey Endpoints
Auth/authPOST /login, POST /logout, POST /refresh-token, POST
## /change-password
Users/usersGET / POST / PUT /{id} / PATCH /{id}/toggle-active
Outlets/outletsGET / POST / PUT /{id} / PATCH /{id}/toggle-active
Products/productsGET / POST / PUT /{id} / PATCH /{id}/toggle-active
Categories/categoriesGET / POST / PUT /{id}
UOM/uomGET / POST / PUT /{id}
Ingredients/ingredientsGET / POST / PUT /{id} / PATCH /{id}/toggle-active
Recipes/recipesGET?product_id= / POST / PUT /{id} / PATCH /{id}/deactivate
Delivery Plans/delivery-plansGET / POST / PUT /{id} / POST /{id}/confirm / GET
## /{id}/recipe-sheet
Deliveries/deliveriesGET / POST / PUT /{id} / PATCH /{id}/approve / PATCH /{id}/reject
Disposals/disposalsGET / POST / PATCH /{id}/approve|reject
Transfers/transfersGET / POST / PATCH /{id}/approve|reject
Stock BF/stock-bfGET / POST / PATCH /{id}/approve|reject
Cancellations/cancellationsGET / POST / PATCH /{id}/approve|reject
Delivery Returns/delivery-returnsGET / POST / PATCH /{id}/approve|reject
Label Printing/label-printingGET / POST / PATCH /{id}/approve|reject
Showroom Labels/showroom-labelsPOST / GET
Productions/productionsGET / POST / PATCH /{id}/approve|reject
Prod. Cancels/production-cancelsGET / POST / PATCH /{id}/approve|reject
Stock Adj./stock-adjustmentsGET / POST / PATCH /{id}/approve|reject
Current Stock/current-stockGET — real-time stock per product
Prod. Plans/production-plansGET / POST / PUT /{id} / GET /{id}/recipe?section_id=
Day-End/day-endGET?date= / POST / PATCH /{id}/approve|reject
Cashier Balance/cashier-balanceGET?date= / POST / PATCH /{id}/approve|reject
Day Lock/day-lockGET?month=&year;= / POST (lock) / DELETE /{date} (unlock)
Settings/settingsGET / PUT (bulk update)
Price Manager/price-managerGET / POST / PUT /{id}
Approvals/approvalsGET (pending by operation) / POST /{id}/approve / POST /{id}/reject
Dashboard/dashboardGET /sales-trend / GET /disposal-by-section / GET /top-deliveries /
GET /delivery-vs-disposal
Reports/reportsGET /{report_name}?from=&to;=&outlet;_id=&section;_id=&format;
## =pdf|excel|json
Audit Logs/audit-logsGET?table=&record;_id=&from;=&to;=

DON & SONS (PVT) LTDDelivery Management System — Implementation Plan
## Page 20   |   Version 2.0   |   April 2026   |   Confidential
## 11. DEVELOPMENT PHASES & MILESTONES
PhaseWeeksScopeDeliverable / Definition of Done
## Phase 1
## Foundation &
## Master Data
1 – 4ASP.NET Core 8 API + EF Core + PostgreSQL setup.
JWT + Refresh Token auth. Master data CRUD: Users,
Roles, Outlets, Product Categories, Products, UOM,
## Ingredients, Production Sections, Delivery Turns,
Outlet Employees. Audit logging middleware. Next.js
project: TypeScript, Tailwind, shadcn/ui. Auth screens.
Admin panel layout & navigation. All master data
screens.
Admin can fully configure: outlets,
sections, products, ingredients,
users, roles. Login/logout works.
Brand theme applied. Mobile
responsive.
## Phase 2
## Inventory &
## Recipe Engine
5 – 8Recipe CRUD per product per section. Extra qty per
ingredient (stores-only flag). Recipe versioning
(effective-from dates). Calculation engine (recipe × qty
= totals). Recipe management UI. Ingredient
dropdowns in recipe editor.
Admin can manage all recipes for all
470+ products. Calculation engine
tested against sample data.
## Phase 3
## Operations
## Module
9 – 13Delivery, Disposal, Transfer, Stock BF, Cancellation,
## Delivery Return, Label Printing, Showroom Open
Stock, Showroom Label Printing screens. Access/date
rules enforced per spec. Approval workflow integration.
POS front-end screens for Transfer, Stock BF,
Cancellation, Delivery Return. Colour Coding system.
All 9 operation sub-modules fully
functional with correct access
controls, date rules, and approval
workflows.
## Phase 4
## Production
## Module
14 – 18Daily Production, Production Cancel, Current Stock
calculation engine, Stock Adjustment, Stock
Adjustment Approval. Production Plan with pre-loaded
summary UI, recipe generation per section, delivery
summary calculation, stores issue note. Day-type
(Weekday/Saturday/Sunday) defaults. Multi-turn
quantity management.
Production planner generates correct
recipe sheets. Current Stock formula
verified. All 6 production
sub-modules operational.
## Phase 5
## Administrator &
## Reports
19 – 22Day-End Process (with Cashier Balance pre-req and
Day Lock check), Cashier Balance (with Showroom Is
Closed new field), System Settings, Label Settings
(printers + templates + comments), Delivery Plan,
Security (Users & Roles), Day Lock (hard lock),
Approvals hub, Showroom Employee, Price Manager,
WorkFlow Config. Full Reports module (all 6 groups).
PDF + Excel export. Label print queue with template
mapping.
All admin functions operational. All
reports generate correctly with
correct date restriction. Label printing
end-to-end tested.
## Phase 6 Polish,
Migration & UAT
23 – 26Dashboard analytics (live charts). SignalR real-time
notifications (immediate order → notify production).
Hangfire job: auto-generate next day plan from defaults
at midnight. Bulk Excel import tool for initial data
migration. Redis caching for master data. Performance
optimisation. Full UAT with live data comparison. Staff
training documentation.
System live. All calculations match
live Excel values. Staff trained.
Performance targets met.

DON & SONS (PVT) LTDDelivery Management System — Implementation Plan
## Page 21   |   Version 2.0   |   April 2026   |   Confidential
## 12. NON-FUNCTIONAL REQUIREMENTS
CategoryRequirement
Availability99.5% uptime. Graceful degradation when external services fail.
PerformanceOrder/delivery grid loads within 2 seconds. Recipe calculations within 1 second. Dashboard
widgets within 3 seconds. 80+ products × 14+ outlets grid must not lag.
SecurityJWT + Refresh Tokens. HTTPS only. Role-Based Access Control enforced at API level (not
just UI). SQL injection prevention via EF Core parameterised queries. Passwords stored as
bcrypt hashes. All sensitive endpoints require authentication.
AuditabilityEvery create/update/delete operation logged to audit_logs with old values JSON, new values
JSON, user ID, and full timestamp. Audit log is immutable — no delete, no update.
ConcurrencyOptimistic concurrency on production plan saves (ETag-based) to prevent overwrite conflicts
when multiple users edit simultaneously.
ScalabilityStateless API — can be horizontally scaled. Redis caching for master data in Phase 6.
BackupDaily PostgreSQL automated dumps. Point-in-time recovery (PITR) enabled on production
database.
Browser SupportChrome, Firefox, Edge (latest 2 versions). Safari iOS (latest). Mobile-responsive down to 320
px viewport.
Print QualityPDF output must match existing Excel print layouts exactly — same margins, font sizes,
column widths, and signature lines. Side-by-side comparison required during UAT.
Data MigrationMigration tool to import existing Excel defaults and historical data on go-live. Per-item
validation report comparing migrated data with source.
Soft DeleteNo hard delete anywhere in the system. All records have Active Status. This rule has no
exceptions.
Date Lock IntegrityOnce a day is locked via Day Lock, no record for that date can be created or edited by ANY
user at ANY role level. This is enforced at the API layer, not just the UI.

DON & SONS (PVT) LTDDelivery Management System — Implementation Plan
## Page 22   |   Version 2.0   |   April 2026   |   Confidential
## 13. RISK REGISTER
RiskLikeliho
od
ImpactMitigation
Cashier Balance / Day-End dependency
chain: if cashier approval is delayed,
Day-End is blocked for the whole day.
HighHighClear visual alerts on both screens. Admin override path
documented in runbook. Approval SLA defined in staff
policy.
The new 'Showroom Is Closed' checkbox
in Cashier Balance is a new field not in
the existing system — may have
downstream implications.
MediumMediumDedicated test cases for this field. Test all downstream
impacts (Approvals queue, Day-End, reports) before
releasing.
Colour Coding system (per-page theme
from Label Settings) requires dynamic
CSS injection — complex frontend
implementation.
MediumMediumUse CSS custom properties (variables). Theme colours
stored in a context/store. All components use variables,
not hardcoded colours.
Date access rules are complex (different
rules per module, per role). Bugs in
access rules could expose wrong data.
HighHighCentralised access-rule service/middleware at API layer.
Unit tests per module per role. Separate QA sign-off on
access rules.
Production Plan recipe generation
complexity — 470+ products, multiple
sections, stores vs production views.
MediumHighPhase 2 dedicated to recipe engine. Unit tests per
product. UAT comparison with live Excel calculations.
POS front-end (Transfer, Stock BF,
Cancellation, Delivery Return) is a
separate interface — scope may be
underestimated.
MediumHighTreat POS front-end as a separate deployment target in
Phase 3. Define screens in Phase 1 design sprint.
Day Lock hard enforcement at API layer
— if incorrectly applied, could block
legitimate operations.
LowHighDay Lock enforced at API middleware, not at database
trigger. Write explicit integration tests for lock/unlock
scenarios.
User adoption (change from familiar
Excel to web system).
HighMediumExcel-like grid UI in order entry screens. Phased rollout.
Comprehensive staff training documentation in Phase 6.
Multi-user simultaneous order entry
conflicts.
LowHighOptimistic concurrency locking on production plan saves.
Conflict resolution UI shows which user last edited.
End of Document — Don & Sons (Pvt) Ltd. · Delivery Management System · Software Requirements & Implementation Plan · Version
## 2.0 · April 2026
Next Step: Stakeholder review → Validate against live Excel data → Kick off Phase 1 sprint planning.