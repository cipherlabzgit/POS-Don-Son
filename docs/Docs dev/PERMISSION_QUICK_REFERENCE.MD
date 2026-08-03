# Permission Quick Reference Guide

## Permission Naming Convention

**Format**: `module:resource:action`

### Examples:
- `products:view` - View products
- `operation:delivery:create` - Create deliveries
- `production:plan:approve` - Approve production plans
- `users:read` - View users
- `settings:edit` - Edit settings

---

## Complete Permission List (Alphabetical)

| Permission Code | Display Name | Module | Description |
|----------------|-------------|--------|-------------|
| `admin-delivery-plan:create` | Create AdminDeliveryPlan | Administrator | Create admin delivery plan |
| `admin-delivery-plan:delete` | Delete AdminDeliveryPlan | Administrator | Delete admin delivery plan |
| `admin-delivery-plan:edit` | Update AdminDeliveryPlan | Administrator | Update admin delivery plan |
| `admin-delivery-plan:view` | View AdminDeliveryPlan | Administrator | View admin delivery plan |
| `admin:day-lock` | Lock DayLock | Administrator | Lock/unlock a day |
| `admin:view` | View DayLock | Administrator | View day lock status |
| `administrator:view` | View Module | Administrator | Access administrator module |
| `anytime-recipe:generate` | Generate AnytimeRecipe | DMS | Generate anytime recipes |
| `anytime-recipe:view` | View AnytimeRecipe | DMS | View anytime recipe generator |
| `approval:approve` | Approve Approvals | Administrator | Approve pending items |
| `approval:reject` | Reject Approvals | Administrator | Reject pending items |
| `approval:view` | View Approvals | Administrator | View approval workflows |
| `audit-logs:export` | Export AuditLogs | System | Export audit logs |
| `audit-logs:view` | View AuditLogs | System | View audit logs |
| `cashier-balance:create` | Create CashierBalance | Administrator | Create cashier balance entries |
| `cashier-balance:delete` | Delete CashierBalance | Administrator | Delete cashier balance entries |
| `cashier-balance:edit` | Update CashierBalance | Administrator | Update cashier balance |
| `cashier-balance:view` | View CashierBalance | Administrator | View cashier balance |
| `categories:create` | Create Categories | Inventory | Create categories |
| `categories:delete` | Delete Categories | Inventory | Delete categories |
| `categories:edit` | Update Categories | Inventory | Update categories |
| `categories:view` | View Categories | Inventory | View categories |
| `dashboard-pivot:view` | View DashboardPivot | DMS | View pivot dashboard |
| `dashboard:view` | View Main | Dashboard | View main dashboard |
| `day-end:execute` | Execute DayEndProcess | Administrator | Execute day-end process |
| `day-end:view` | View DayEndProcess | Administrator | View day-end process |
| `day_type:create` | Create DayTypes | Administrator | Create day types |
| `day_type:delete` | Delete DayTypes | Administrator | Delete day types |
| `day_type:edit` | Update DayTypes | Administrator | Update day types |
| `day_type:view` | View DayTypes | Administrator | View day types |
| `default_quantity:create` | Create DefaultQuantities | DMS | Create default quantities |
| `default_quantity:delete` | Delete DefaultQuantities | DMS | Delete default quantities |
| `default_quantity:edit` | Update DefaultQuantities | DMS | Update default quantities |
| `default_quantity:view` | View DefaultQuantities | DMS | View default quantities |
| `delivery-summary:view` | View DeliverySummary | DMS | View delivery summary |
| `delivery_plan:create` | Create DeliveryPlan | DMS | Create delivery plans |
| `delivery_plan:delete` | Delete DeliveryPlan | DMS | Delete delivery plans |
| `delivery_plan:edit` | Update DeliveryPlan | DMS | Update delivery plans |
| `delivery_plan:view` | View DeliveryPlan | DMS | View delivery plans |
| `delivery_turn:create` | Create DeliveryTurns | Administrator | Create delivery turns |
| `delivery_turn:delete` | Delete DeliveryTurns | Administrator | Delete delivery turns |
| `delivery_turn:edit` | Update DeliveryTurns | Administrator | Update delivery turns |
| `delivery_turn:view` | View DeliveryTurns | Administrator | View delivery turns |
| `dms-recipe:export` | Export RecipeExport | DMS | Export/upload DMS recipes |
| `dms:view` | View Module | DMS | Access DMS module |
| `dough-generator:generate` | Generate DoughGenerator | DMS | Generate dough recipes |
| `dough-generator:view` | View DoughGenerator | DMS | View dough generator |
| `employee:create` | Create ShowroomEmployee | Administrator | Create showroom employees |
| `employee:delete` | Delete ShowroomEmployee | Administrator | Delete showroom employees |
| `employee:edit` | Update ShowroomEmployee | Administrator | Update showroom employees |
| `employee:view` | View ShowroomEmployee | Administrator | View showroom employees |
| `freezer_stock:edit` | Adjust FreezerStock | DMS | Adjust freezer stock |
| `freezer_stock:view` | View FreezerStock | DMS | View freezer stock |
| `grid-config:create` | Create GridConfiguration | Administrator | Create grid configurations |
| `grid-config:delete` | Delete GridConfiguration | Administrator | Delete grid configurations |
| `grid-config:edit` | Update GridConfiguration | Administrator | Update grid configurations |
| `grid-config:view` | View GridConfiguration | Administrator | View grid configurations |
| `immediate_order:approve` | Approve ImmediateOrders | DMS | Approve/reject immediate orders |
| `immediate_order:create` | Create ImmediateOrders | DMS | Create immediate orders |
| `immediate_order:delete` | Delete ImmediateOrders | DMS | Delete immediate orders |
| `immediate_order:edit` | Update ImmediateOrders | DMS | Update immediate orders |
| `immediate_order:view` | View ImmediateOrders | DMS | View immediate orders |
| `ingredients:create` | Create Ingredients | Inventory | Create ingredients |
| `ingredients:delete` | Delete Ingredients | Inventory | Delete ingredients |
| `ingredients:edit` | Update Ingredients | Inventory | Update ingredients |
| `ingredients:view` | View Ingredients | Inventory | View ingredients |
| `label-settings:create` | Create LabelSettings | Administrator | Create label settings |
| `label-settings:delete` | Delete LabelSettings | Administrator | Delete label settings |
| `label-settings:edit` | Update LabelSettings | Administrator | Update label settings |
| `label-settings:view` | View LabelSettings | Administrator | View label settings |
| `label-templates:create` | Create LabelTemplates | Administrator | Create label templates |
| `label-templates:delete` | Delete LabelTemplates | Administrator | Delete label templates |
| `label-templates:edit` | Update LabelTemplates | Administrator | Update label templates |
| `label-templates:view` | View LabelTemplates | Administrator | View label templates |
| `operation:approvals:view` | View Approvals | Operation | View all operation approvals in unified page |
| `operation:cancellation:approve` | Approve Cancellation | Operation | Approve/reject cancellations |
| `operation:cancellation:create` | Create Cancellation | Operation | Create cancellation records |
| `operation:cancellation:delete` | Delete Cancellation | Operation | Delete cancellations |
| `operation:cancellation:update` | Update Cancellation | Operation | Update cancellations |
| `operation:cancellation:view` | View Cancellation | Operation | View cancellations |
| `operation:delivery-return:approve` | Approve DeliveryReturn | Operation | Approve/reject delivery returns |
| `operation:delivery-return:create` | Create DeliveryReturn | Operation | Create delivery returns |
| `operation:delivery-return:delete` | Delete DeliveryReturn | Operation | Delete delivery returns |
| `operation:delivery-return:update` | Update DeliveryReturn | Operation | Update delivery returns |
| `operation:delivery-return:view` | View DeliveryReturn | Operation | View delivery returns |
| `operation:delivery:approve` | Approve Delivery | Operation | Approve/reject deliveries |
| `operation:delivery:create` | Create Delivery | Operation | Create deliveries |
| `operation:delivery:delete` | Delete Delivery | Operation | Delete deliveries |
| `operation:delivery:update` | Update Delivery | Operation | Update deliveries |
| `operation:delivery:view` | View Delivery | Operation | View deliveries |
| `operation:disposal:approve` | Approve Disposal | Operation | Approve/reject disposals |
| `operation:disposal:create` | Create Disposal | Operation | Create disposal records |
| `operation:disposal:delete` | Delete Disposal | Operation | Delete disposals |
| `operation:disposal:update` | Update Disposal | Operation | Update disposals |
| `operation:disposal:view` | View Disposal | Operation | View disposals |
| `operation:label-printing:allow-back-future` | AllowBackFuture LabelPrinting | Operation | Allow back/future dated labels |
| `operation:label-printing:approve` | Approve LabelPrinting | Operation | Approve/reject label printing |
| `operation:label-printing:create` | Create LabelPrinting | Operation | Create label printing requests |
| `operation:label-printing:delete` | Delete LabelPrinting | Operation | Delete label printing requests |
| `operation:label-printing:print` | Print LabelPrinting | Operation | Print labels |
| `operation:label-printing:update` | Update LabelPrinting | Operation | Update label printing requests |
| `operation:label-printing:view` | View LabelPrinting | Operation | View label printing requests |
| `operation:showroom-label-printing:create` | Create ShowroomLabelPrinting | Operation | Create showroom label requests |
| `operation:showroom-label-printing:delete` | Delete ShowroomLabelPrinting | Operation | Delete showroom label requests |
| `operation:showroom-label-printing:print` | Print ShowroomLabelPrinting | Operation | Print showroom labels |
| `operation:showroom-label-printing:view` | View ShowroomLabelPrinting | Operation | View showroom label requests |
| `operation:showroom-open-stock:create` | Create ShowroomOpenStock | Operation | Create open stock entries |
| `operation:showroom-open-stock:delete` | Delete ShowroomOpenStock | Operation | Delete open stock |
| `operation:showroom-open-stock:update` | Update ShowroomOpenStock | Operation | Update open stock |
| `operation:showroom-open-stock:view` | View ShowroomOpenStock | Operation | View showroom open stock |
| `operation:stock-bf:approve` | Approve StockBF | Operation | Approve/reject stock BF |
| `operation:stock-bf:create` | Create StockBF | Operation | Create stock BF entries |
| `operation:stock-bf:delete` | Delete StockBF | Operation | Delete stock BF |
| `operation:stock-bf:update` | Update StockBF | Operation | Update stock BF |
| `operation:stock-bf:view` | View StockBF | Operation | View stock brought forward |
| `operation:transfer:approve` | Approve Transfer | Operation | Approve/reject transfers |
| `operation:transfer:create` | Create Transfer | Operation | Create transfers |
| `operation:transfer:delete` | Delete Transfer | Operation | Delete transfers |
| `operation:transfer:update` | Update Transfer | Operation | Update transfers |
| `operation:transfer:view` | View Transfer | Operation | View transfers |
| `order:create` | Create OrderEntry | DMS | Create orders |
| `order:delete` | Delete OrderEntry | DMS | Delete orders |
| `order:edit` | Update OrderEntry | DMS | Update orders |
| `order:view` | View OrderEntry | DMS | View order entries |
| `permissions:read` | View Permissions | Administrator | View all available permissions |
| `pricing:create` | Create PriceManager | Administrator | Create price entries |
| `pricing:delete` | Delete PriceManager | Administrator | Delete price entries |
| `pricing:edit` | Update PriceManager | Administrator | Update product prices |
| `pricing:view` | View PriceManager | Administrator | View product prices |
| `print:receipt-cards` | View PrintReceiptCards | DMS | View/print receipt cards |
| `print:section-bundle` | View SectionPrintBundle | DMS | View/print section bundles |
| `production-planner:create` | Create ProductionPlanner | DMS | Create/compute production plans |
| `production-planner:delete` | Delete ProductionPlanner | DMS | Delete production plans |
| `production-planner:update` | Update ProductionPlanner | DMS | Update production plans |
| `production-planner:view` | View ProductionPlanner | DMS | View production planner |
| `production:cancel:approve` | Approve ProductionCancel | Production | Approve/reject production cancellations |
| `production:cancel:create` | Create ProductionCancel | Production | Create production cancellations |
| `production:cancel:delete` | Delete ProductionCancel | Production | Delete production cancellations |
| `production:cancel:update` | Update ProductionCancel | Production | Update production cancellations |
| `production:cancel:view` | View ProductionCancel | Production | View production cancellations |
| `production:create` | Create ProductionSections | Production | Create production sections |
| `production:current-stock:view` | View CurrentStock | Production | View current production stock |
| `production:daily:approve` | Approve DailyProduction | Production | Approve/reject production |
| `production:daily:create` | Create DailyProduction | Production | Create production entries |
| `production:daily:delete` | Delete DailyProduction | Production | Delete production entries |
| `production:daily:update` | Update DailyProduction | Production | Update production entries |
| `production:daily:view` | View DailyProduction | Production | View daily production |
| `production:delete` | Delete ProductionSections | Production | Delete production sections |
| `production:edit` | Update ProductionSections | Production | Update production sections |
| `production:plan:approve` | Approve ProductionPlan | Production | Approve/start/complete production plans |
| `production:plan:create` | Create ProductionPlan | Production | Create production plans |
| `production:plan:delete` | Delete ProductionPlan | Production | Delete production plans |
| `production:plan:update` | Update ProductionPlan | Production | Update production plans |
| `production:plan:view` | View ProductionPlan | Production | View production plans |
| `production:shift:create` | Create Shifts | Production | Create production shifts |
| `production:shift:delete` | Delete Shifts | Production | Delete production shifts |
| `production:shift:update` | Update Shifts | Production | Update production shifts |
| `production:shift:view` | View Shifts | Production | View production shifts |
| `production:stock-adjustment:approve` | Approve StockAdjustment | Production | Approve/reject stock adjustments |
| `production:stock-adjustment:create` | Create StockAdjustment | Production | Create stock adjustments |
| `production:stock-adjustment:delete` | Delete StockAdjustment | Production | Delete stock adjustments |
| `production:stock-adjustment:update` | Update StockAdjustment | Production | Update stock adjustments |
| `production:stock-adjustment:view` | View StockAdjustment | Production | View stock adjustments |
| `production:view` | View ProductionSections | Production | View production sections |
| `products:create` | Create Products | Inventory | Create new products |
| `products:delete` | Delete Products | Inventory | Delete products |
| `products:edit` | Update Products | Inventory | Update existing products |
| `products:export` | Export Products | Inventory | Export products to file |
| `products:import` | Import Products | Inventory | Import products from file |
| `products:view` | View Products | Inventory | View products list and details |
| `recipe-templates:create` | Create RecipeTemplates | DMS | Create recipe templates |
| `recipe-templates:delete` | Delete RecipeTemplates | DMS | Delete recipe templates |
| `recipe-templates:edit` | Update RecipeTemplates | DMS | Update recipe templates |
| `recipe-templates:view` | View RecipeTemplates | DMS | View recipe templates |
| `recipes:create` | Create RecipeManagement | DMS | Create recipes |
| `recipes:delete` | Delete RecipeManagement | DMS | Delete recipes |
| `recipes:edit` | Update RecipeManagement | DMS | Update recipes |
| `recipes:view` | View RecipeManagement | DMS | View recipes |
| `reconciliation:perform` | Perform Reconciliation | DMS | Perform reconciliation operations |
| `reconciliation:view` | View Reconciliation | DMS | View reconciliation |
| `reports:export` | Export General | Reports | Export reports to PDF/Excel |
| `reports:financial:view` | View Financial | Reports | View financial reports |
| `reports:inventory:view` | View Inventory | Reports | View inventory reports |
| `reports:print` | Print General | Reports | Print reports |
| `reports:production:view` | View Production | Reports | View production reports |
| `reports:sales:view` | View Sales | Reports | View sales reports |
| `reports:view` | View General | Reports | View all reports |
| `roles:create` | Create Roles | Administrator | Create new roles |
| `roles:delete` | Delete Roles | Administrator | Delete roles |
| `roles:read` | View Roles | Administrator | View roles list and details |
| `roles:update` | Update Roles | Administrator | Update existing roles |
| `rounding-rules:create` | Create RoundingRules | Administrator | Create rounding rules |
| `rounding-rules:delete` | Delete RoundingRules | Administrator | Delete rounding rules |
| `rounding-rules:edit` | Update RoundingRules | Administrator | Update rounding rules |
| `rounding-rules:view` | View RoundingRules | Administrator | View rounding rules |
| `section-consumables:create` | Create SectionConsumables | Administrator | Create section consumables |
| `section-consumables:delete` | Delete SectionConsumables | Administrator | Delete section consumables |
| `section-consumables:edit` | Update SectionConsumables | Administrator | Update section consumables |
| `section-consumables:view` | View SectionConsumables | Administrator | View section consumables |
| `security-policies:create` | Create Security | Administrator | Create security policies |
| `security-policies:delete` | Delete Security | Administrator | Delete security policies |
| `security-policies:edit` | Update Security | Administrator | Update security settings |
| `security-policies:view` | View Security | Administrator | View security settings |
| `setting:edit` | Update SystemSettings | Administrator | Update system settings |
| `setting:view` | View SystemSettings | Administrator | View system settings |
| `showroom:create` | Create Outlets | Showroom | Create showrooms |
| `showroom:delete` | Delete Outlets | Showroom | Delete showrooms |
| `showroom:edit` | Update Outlets | Showroom | Update showrooms |
| `showroom:view` | View Outlets | Showroom | View showrooms/outlets |
| `stores-issue-note:create` | Create StoresIssueNote | DMS | Create/compute stores issue notes |
| `stores-issue-note:delete` | Delete StoresIssueNote | DMS | Delete stores issue notes |
| `stores-issue-note:execute` | Execute StoresIssueNote | DMS | Issue/receive stores issue notes |
| `stores-issue-note:update` | Update StoresIssueNote | DMS | Update stores issue notes |
| `stores-issue-note:view` | View StoresIssueNote | DMS | View stores issue notes |
| `system-logs:export` | Export SystemLogs | System | Export system logs |
| `system-logs:view` | View SystemLogs | System | View system logs |
| `unit-of-measure:create` | Create UnitOfMeasure | Inventory | Create units of measure |
| `unit-of-measure:delete` | Delete UnitOfMeasure | Inventory | Delete units of measure |
| `unit-of-measure:edit` | Update UnitOfMeasure | Inventory | Update units of measure |
| `unit-of-measure:view` | View UnitOfMeasure | Inventory | View units of measure |
| `users:create` | Create Users | Administrator | Create new users |
| `users:delete` | Delete Users | Administrator | Delete users |
| `users:read` | View Users | Administrator | View users list and details |
| `users:update` | Update Users | Administrator | Update existing users |
| `workflow-config:create` | Create WorkflowConfig | Administrator | Create workflow configurations |
| `workflow-config:delete` | Delete WorkflowConfig | Administrator | Delete workflow configurations |
| `workflow-config:edit` | Update WorkflowConfig | Administrator | Update workflow configurations |
| `workflow-config:view` | View WorkflowConfig | Administrator | View workflow configurations |
| `xlsm-importer:import` | Import XlsmImporter | DMS | Import XLSM files |
| `xlsm-importer:view` | View XlsmImporter | DMS | View XLSM importer |

---

## Sidebar Menu Permissions

### Dashboard
- Dashboard → `dashboard:view`

### Inventory
- Products → `products:view`
- Category → `categories:view`
- Unit of Measure → `unit-of-measure:view`
- Ingredient → `ingredients:view`

### Show Room
- Show Room → `showroom:view`

### Operation
- Delivery → `operation:delivery:view`
- Delivery Approval → `operation:delivery:approve`
- All Approvals → `operation:approvals:view`
- Disposal → `operation:disposal:view`
- Transfer → `operation:transfer:view`
- Stock BF → `operation:stock-bf:view`
- Cancellation → `operation:cancellation:view`
- Delivery Return → `operation:delivery-return:view`
- Label Printing → `operation:label-printing:view`
- Showroom Open Stock → `operation:showroom-open-stock:view`
- Showroom Label Printing → `operation:showroom-label-printing:view`

### Production
- Parent Menu → `production:view`
- Daily Production → `production:daily:view`
- Production Cancel → `production:cancel:view`
- Current Stock → `production:current-stock:view`
- Stock Adjustment → `production:stock-adjustment:view`
- Stock Adjustment Approval → `production:stock-adjustment:approve`
- Production Plan → `production:plan:view`

### DMS
- Parent Menu → `dms:view`
- Order Entry → `order:view`
- Delivery Plan → `delivery_plan:view`
- Delivery Summary → `delivery-summary:view`
- Immediate Orders → `immediate_order:view`
- Default Quantities → `default_quantity:view`
- Production Planner → `production-planner:view`
- Stores Issue Note → `stores-issue-note:view`
- Recipe Management → `recipes:view`
- Recipe Templates → `recipe-templates:view`
- Freezer Stock → `freezer_stock:view`
- Anytime Recipe → `anytime-recipe:view`
- Patties Dough → `dough-generator:view`
- Rotty Dough → `dough-generator:view`
- Pivot Dashboard → `dashboard-pivot:view`
- Receipt Cards → `print:receipt-cards`
- Section Print Bundle → `print:section-bundle`
- DMS Recipe Upload → `dms-recipe:export`
- Reconciliation → `reconciliation:view`
- xlsm Importer → `xlsm-importer:view`

### Reports
- Reports → `reports:view`

### Administrator
- Parent Menu → `administrator:view`
- Day-End Process → `day-end:view`
- Cashier Balance → `cashier-balance:view`
- System Settings → `setting:view`
- Label Settings → `label-settings:view`
- Delivery Plan → `admin-delivery-plan:view`
- Security → `security-policies:view`
- Users → `users:read`
- Roles → `roles:read`
- Permissions → `permissions:read`
- Day Lock → `admin:view`
- Approvals → `approval:view`
- Showroom Employee → `employee:view`
- Price Manager → `pricing:view`
- WorkFlow Config → `workflow-config:view`
- Grid Configuration → `grid-config:view`
- Day-Types → `day_type:view`
- Delivery Turns → `delivery_turn:view`
- Shifts → `production:shift:view`
- Rounding Rules → `rounding-rules:view`
- Section Consumables → `section-consumables:view`
- Label Templates → `label-templates:view`

---

## Common Permission Patterns

### CRUD Operations
Most resources follow the CRUD pattern:
- `resource:view` or `resource:read` - View/Read
- `resource:create` - Create
- `resource:edit` or `resource:update` - Update
- `resource:delete` - Delete

### Special Actions
- `resource:approve` - Approve items
- `resource:reject` - Reject items
- `resource:export` - Export data
- `resource:import` - Import data
- `resource:print` - Print
- `resource:execute` - Execute operations

### Module Access
- `module:view` - Access to entire module (e.g., `dms:view`, `administrator:view`)

---

## Testing Permissions

### Using Postman/API
```http
GET /api/endpoint
Authorization: Bearer {JWT_TOKEN}
```

JWT token contains `permissions` array - check decoded JWT for user permissions.

### Using Frontend
Check browser console after login:
```javascript
localStorage.getItem('auth-storage')
// Look for "permissions" array in user object
```

### Using Database
```sql
-- Check user's permissions
SELECT DISTINCT p."Code", p."Name", p."Module"
FROM "Permissions" p
JOIN "RolePermissions" rp ON p."Id" = rp."PermissionId"
JOIN "UserRoles" ur ON rp."RoleId" = ur."RoleId"
WHERE ur."UserId" = 'user-guid-here'
ORDER BY p."Module", p."Code";
```

---

## Adding New Permissions

### 1. Backend (ComprehensivePermissionSeeder.cs)
```csharp
permissions.AddRange(CreatePermissionsFromCodes("Module", "Resource", new[]
{
    ("resource:view", "View", "View resource"),
    ("resource:create", "Create", "Create resource"),
}));
```

### 2. Controller
```csharp
[HasPermission("resource:view")]
public async Task<IActionResult> GetResource()
{
    // Implementation
}
```

### 3. Frontend (menu-items.ts)
```typescript
{
  name: 'Resource',
  href: '/module/resource',
  icon: Icon,
  permission: 'resource:view', // COLON notation!
}
```

---

## Troubleshooting

**Sidebar item not showing:**
1. Check user has the permission in JWT token
2. Verify permission code uses COLON notation (`:`)
3. Ensure permission exists in database
4. User may need to logout/login for new permissions

**Permission denied on API call:**
1. Check controller has `[HasPermission("...")]` attribute
2. Verify JWT token contains the permission
3. Check permission string matches exactly
4. Verify user's role has the permission assigned

**Parent menu shows but children don't:**
- This is expected if user has parent permission but not child permissions
- Assign specific child permissions to show those items
