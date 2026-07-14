# PowerShell script to update controller permission codes
# Run this from the root directory

$controllersPath = "DMS-Backend\Controllers"

Write-Host "Updating controller permissions..." -ForegroundColor Green

# Administrator Module Controllers
Write-Host "`nUpdating Administrator module controllers..." -ForegroundColor Yellow

# LabelSettingsController
$file = "$controllersPath\LabelSettingsController.cs"
(Get-Content $file) | ForEach-Object {
    $_ -replace '\[HasPermission\("system:view"\)\]', '[HasPermission("label-settings:view")]' `
       -replace '\[HasPermission\("system:create"\)\]', '[HasPermission("label-settings:create")]' `
       -replace '\[HasPermission\("system:edit"\)\]', '[HasPermission("label-settings:edit")]' `
       -replace '\[HasPermission\("system:delete"\)\]', '[HasPermission("label-settings:delete")]'
} | Set-Content $file
Write-Host "✓ LabelSettingsController updated"

# LabelTemplatesController
$file = "$controllersPath\LabelTemplatesController.cs"
(Get-Content $file) | ForEach-Object {
    $_ -replace '\[HasPermission\("system:view"\)\]', '[HasPermission("label-templates:view")]' `
       -replace '\[HasPermission\("system:create"\)\]', '[HasPermission("label-templates:create")]' `
       -replace '\[HasPermission\("system:edit"\)\]', '[HasPermission("label-templates:edit")]' `
       -replace '\[HasPermission\("system:delete"\)\]', '[HasPermission("label-templates:delete")]'
} | Set-Content $file
Write-Host "✓ LabelTemplatesController updated"

# WorkflowConfigsController
$file = "$controllersPath\WorkflowConfigsController.cs"
(Get-Content $file) | ForEach-Object {
    $_ -replace '\[HasPermission\("system:view"\)\]', '[HasPermission("workflow-config:view")]' `
       -replace '\[HasPermission\("system:create"\)\]', '[HasPermission("workflow-config:create")]' `
       -replace '\[HasPermission\("system:edit"\)\]', '[HasPermission("workflow-config:edit")]' `
       -replace '\[HasPermission\("system:delete"\)\]', '[HasPermission("workflow-config:delete")]'
} | Set-Content $file
Write-Host "✓ WorkflowConfigsController updated"

# GridConfigurationsController
$file = "$controllersPath\GridConfigurationsController.cs"
(Get-Content $file) | ForEach-Object {
    $_ -replace '\[HasPermission\("system:view"\)\]', '[HasPermission("grid-config:view")]' `
       -replace '\[HasPermission\("system:create"\)\]', '[HasPermission("grid-config:create")]' `
       -replace '\[HasPermission\("system:edit"\)\]', '[HasPermission("grid-config:edit")]' `
       -replace '\[HasPermission\("system:delete"\)\]', '[HasPermission("grid-config:delete")]'
} | Set-Content $file
Write-Host "✓ GridConfigurationsController updated"

# RoundingRulesController
$file = "$controllersPath\RoundingRulesController.cs"
(Get-Content $file) | ForEach-Object {
    $_ -replace '\[HasPermission\("system:view"\)\]', '[HasPermission("rounding-rules:view")]' `
       -replace '\[HasPermission\("system:create"\)\]', '[HasPermission("rounding-rules:create")]' `
       -replace '\[HasPermission\("system:edit"\)\]', '[HasPermission("rounding-rules:edit")]' `
       -replace '\[HasPermission\("system:delete"\)\]', '[HasPermission("rounding-rules:delete")]'
} | Set-Content $file
Write-Host "✓ RoundingRulesController updated"

# SectionConsumablesController
$file = "$controllersPath\SectionConsumablesController.cs"
(Get-Content $file) | ForEach-Object {
    $_ -replace '\[HasPermission\("consumable:view"\)\]', '[HasPermission("section-consumables:view")]' `
       -replace '\[HasPermission\("consumable:create"\)\]', '[HasPermission("section-consumables:create")]' `
       -replace '\[HasPermission\("consumable:edit"\)\]', '[HasPermission("section-consumables:edit")]' `
       -replace '\[HasPermission\("consumable:delete"\)\]', '[HasPermission("section-consumables:delete")]'
} | Set-Content $file
Write-Host "✓ SectionConsumablesController updated"

# SecurityPoliciesController
$file = "$controllersPath\SecurityPoliciesController.cs"
(Get-Content $file) | ForEach-Object {
    $_ -replace '\[HasPermission\("system:view"\)\]', '[HasPermission("security-policies:view")]' `
       -replace '\[HasPermission\("system:create"\)\]', '[HasPermission("security-policies:create")]' `
       -replace '\[HasPermission\("system:edit"\)\]', '[HasPermission("security-policies:edit")]' `
       -replace '\[HasPermission\("system:delete"\)\]', '[HasPermission("security-policies:delete")]'
} | Set-Content $file
Write-Host "✓ SecurityPoliciesController updated"

# Inventory Module Controllers
Write-Host "`nUpdating Inventory module controllers..." -ForegroundColor Yellow

# ProductsController
$file = "$controllersPath\ProductsController.cs"
(Get-Content $file) | ForEach-Object {
    $_ -replace '\[HasPermission\("inventory:view"\)\]', '[HasPermission("products:view")]' `
       -replace '\[HasPermission\("inventory:create"\)\]', '[HasPermission("products:create")]' `
       -replace '\[HasPermission\("inventory:edit"\)\]', '[HasPermission("products:edit")]' `
       -replace '\[HasPermission\("inventory:delete"\)\]', '[HasPermission("products:delete")]' `
       -replace '\[HasPermission\("inventory:import"\)\]', '[HasPermission("products:import")]' `
       -replace '\[HasPermission\("inventory:export"\)\]', '[HasPermission("products:export")]'
} | Set-Content $file
Write-Host "✓ ProductsController updated"

# CategoriesController
$file = "$controllersPath\CategoriesController.cs"
(Get-Content $file) | ForEach-Object {
    $_ -replace '\[HasPermission\("inventory:view"\)\]', '[HasPermission("categories:view")]' `
       -replace '\[HasPermission\("inventory:create"\)\]', '[HasPermission("categories:create")]' `
       -replace '\[HasPermission\("inventory:edit"\)\]', '[HasPermission("categories:edit")]' `
       -replace '\[HasPermission\("inventory:delete"\)\]', '[HasPermission("categories:delete")]'
} | Set-Content $file
Write-Host "✓ CategoriesController updated"

# UnitOfMeasuresController
$file = "$controllersPath\UnitOfMeasuresController.cs"
(Get-Content $file) | ForEach-Object {
    $_ -replace '\[HasPermission\("inventory:view"\)\]', '[HasPermission("unit-of-measure:view")]' `
       -replace '\[HasPermission\("inventory:create"\)\]', '[HasPermission("unit-of-measure:create")]' `
       -replace '\[HasPermission\("inventory:edit"\)\]', '[HasPermission("unit-of-measure:edit")]' `
       -replace '\[HasPermission\("inventory:delete"\)\]', '[HasPermission("unit-of-measure:delete")]'
} | Set-Content $file
Write-Host "✓ UnitOfMeasuresController updated"

# IngredientsController
$file = "$controllersPath\IngredientsController.cs"
(Get-Content $file) | ForEach-Object {
    $_ -replace '\[HasPermission\("inventory:view"\)\]', '[HasPermission("ingredients:view")]' `
       -replace '\[HasPermission\("inventory:create"\)\]', '[HasPermission("ingredients:create")]' `
       -replace '\[HasPermission\("inventory:edit"\)\]', '[HasPermission("ingredients:edit")]' `
       -replace '\[HasPermission\("inventory:delete"\)\]', '[HasPermission("ingredients:delete")]'
} | Set-Content $file
Write-Host "✓ IngredientsController updated"

# DMS Module Controllers
Write-Host "`nUpdating DMS module controllers..." -ForegroundColor Yellow

# RecipeTemplatesController
$file = "$controllersPath\RecipeTemplatesController.cs"
(Get-Content $file) | ForEach-Object {
    $_ -replace '\[HasPermission\("recipes:view"\)\]', '[HasPermission("recipe-templates:view")]' `
       -replace '\[HasPermission\("recipes:create"\)\]', '[HasPermission("recipe-templates:create")]' `
       -replace '\[HasPermission\("recipes:edit"\)\]', '[HasPermission("recipe-templates:edit")]' `
       -replace '\[HasPermission\("recipes:delete"\)\]', '[HasPermission("recipe-templates:delete")]'
} | Set-Content $file
Write-Host "✓ RecipeTemplatesController updated"

Write-Host "`n✅ All controllers updated successfully!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Rebuild the application: dotnet clean && dotnet build"
Write-Host "2. Clear permissions in pgAdmin (run clear_permissions.sql)"
Write-Host "3. Restart application to seed new permissions"
Write-Host "4. Run verify_permissions.sql to check"
