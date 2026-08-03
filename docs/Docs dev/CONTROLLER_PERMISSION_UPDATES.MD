# Controller Permission Updates Required

## Overview

After separating permissions by section, the following controllers need to be updated to use their new unique permission codes instead of shared ones.

---

## Administrator Module Controllers

### 1. LabelSettingsController
**Change**: `system:*` → `label-settings:*`
```csharp
// OLD:
[HasPermission("system:view")]
[HasPermission("system:create")]
[HasPermission("system:edit")]
[HasPermission("system:delete")]

// NEW:
[HasPermission("label-settings:view")]
[HasPermission("label-settings:create")]
[HasPermission("label-settings:edit")]
[HasPermission("label-settings:delete")]
```

### 2. LabelTemplatesController
**Change**: `system:*` → `label-templates:*`
```csharp
// OLD:
[HasPermission("system:view")]
[HasPermission("system:create")]
[HasPermission("system:edit")]
[HasPermission("system:delete")]

// NEW:
[HasPermission("label-templates:view")]
[HasPermission("label-templates:create")]
[HasPermission("label-templates:edit")]
[HasPermission("label-templates:delete")]
```

### 3. WorkflowConfigsController
**Change**: `system:*` → `workflow-config:*`
```csharp
// OLD:
[HasPermission("system:view")]
[HasPermission("system:create")]
[HasPermission("system:edit")]
[HasPermission("system:delete")]

// NEW:
[HasPermission("workflow-config:view")]
[HasPermission("workflow-config:create")]
[HasPermission("workflow-config:edit")]
[HasPermission("workflow-config:delete")]
```

### 4. GridConfigurationsController
**Change**: `system:*` → `grid-config:*`
```csharp
// OLD:
[HasPermission("system:view")]
[HasPermission("system:create")]
[HasPermission("system:edit")]
[HasPermission("system:delete")]

// NEW:
[HasPermission("grid-config:view")]
[HasPermission("grid-config:create")]
[HasPermission("grid-config:edit")]
[HasPermission("grid-config:delete")]
```

### 5. RoundingRulesController
**Change**: `system:*` → `rounding-rules:*`
```csharp
// OLD:
[HasPermission("system:view")]
[HasPermission("system:create")]
[HasPermission("system:edit")]
[HasPermission("system:delete")]

// NEW:
[HasPermission("rounding-rules:view")]
[HasPermission("rounding-rules:create")]
[HasPermission("rounding-rules:edit")]
[HasPermission("rounding-rules:delete")]
```

### 6. SectionConsumablesController
**Change**: `consumable:*` → `section-consumables:*`
```csharp
// OLD:
[HasPermission("consumable:view")]
[HasPermission("consumable:create")]
[HasPermission("consumable:edit")]
[HasPermission("consumable:delete")]

// NEW:
[HasPermission("section-consumables:view")]
[HasPermission("section-consumables:create")]
[HasPermission("section-consumables:edit")]
[HasPermission("section-consumables:delete")]
```

### 7. SecurityPoliciesController
**Change**: `system:*` → `security-policies:*`
```csharp
// OLD:
[HasPermission("system:view")]
[HasPermission("system:create")]
[HasPermission("system:edit")]
[HasPermission("system:delete")]

// NEW:
[HasPermission("security-policies:view")]
[HasPermission("security-policies:create")]
[HasPermission("security-policies:edit")]
[HasPermission("security-policies:delete")]
```

---

## Inventory Module Controllers

### 8. ProductsController
**Change**: `inventory:*` → `products:*`
```csharp
// OLD:
[HasPermission("inventory:view")]
[HasPermission("inventory:create")]
[HasPermission("inventory:edit")]
[HasPermission("inventory:delete")]
[HasPermission("inventory:import")]
[HasPermission("inventory:export")]

// NEW:
[HasPermission("products:view")]
[HasPermission("products:create")]
[HasPermission("products:edit")]
[HasPermission("products:delete")]
[HasPermission("products:import")]
[HasPermission("products:export")]
```

### 9. CategoriesController
**Change**: `inventory:*` → `categories:*`
```csharp
// OLD:
[HasPermission("inventory:view")]
[HasPermission("inventory:create")]
[HasPermission("inventory:edit")]
[HasPermission("inventory:delete")]

// NEW:
[HasPermission("categories:view")]
[HasPermission("categories:create")]
[HasPermission("categories:edit")]
[HasPermission("categories:delete")]
```

### 10. UnitOfMeasuresController
**Change**: `inventory:*` → `unit-of-measure:*`
```csharp
// OLD:
[HasPermission("inventory:view")]
[HasPermission("inventory:create")]
[HasPermission("inventory:edit")]
[HasPermission("inventory:delete")]

// NEW:
[HasPermission("unit-of-measure:view")]
[HasPermission("unit-of-measure:create")]
[HasPermission("unit-of-measure:edit")]
[HasPermission("unit-of-measure:delete")]
```

### 11. IngredientsController
**Change**: `inventory:*` → `ingredients:*`
```csharp
// OLD:
[HasPermission("inventory:view")]
[HasPermission("inventory:create")]
[HasPermission("inventory:edit")]
[HasPermission("inventory:delete")]

// NEW:
[HasPermission("ingredients:view")]
[HasPermission("ingredients:create")]
[HasPermission("ingredients:edit")]
[HasPermission("ingredients:delete")]
```

---

## DMS Module Controllers

### 12. RecipeTemplatesController
**Change**: `recipes:*` → `recipe-templates:*`
```csharp
// OLD:
[HasPermission("recipes:view")]
[HasPermission("recipes:create")]
[HasPermission("recipes:edit")]
[HasPermission("recipes:delete")]

// NEW:
[HasPermission("recipe-templates:view")]
[HasPermission("recipe-templates:create")]
[HasPermission("recipe-templates:edit")]
[HasPermission("recipe-templates:delete")]
```

---

## Quick Update Method

For each controller, use Find & Replace (Ctrl+H) in your IDE:

### Example for LabelSettingsController:
1. Open `DMS-Backend/Controllers/LabelSettingsController.cs`
2. Find: `"system:view"` → Replace: `"label-settings:view"`
3. Find: `"system:create"` → Replace: `"label-settings:create"`
4. Find: `"system:edit"` → Replace: `"label-settings:edit"`
5. Find: `"system:delete"` → Replace: `"label-settings:delete"`

---

## Total Changes
- **12 controllers** need updating
- **~48 permission attributes** need changing

---

## After Updating

1. **Rebuild the application**:
   ```cmd
   dotnet clean
   dotnet build
   ```

2. **Clear permissions in database** (in pgAdmin):
   ```sql
   DELETE FROM role_permissions;
   DELETE FROM permissions;
   ```

3. **Restart application** to seed new permissions

4. **Verify** all permissions are unique and correctly assigned

---

## ⚠️ Important Notes

- RecipesController keeps `recipes:*` (no change needed)
- RecipeTemplatesController uses new `recipe-templates:*`
- This gives you granular control over each feature

---

**Estimated Time**: 15-20 minutes for all updates
