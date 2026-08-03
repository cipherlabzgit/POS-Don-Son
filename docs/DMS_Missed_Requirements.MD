# DMS Missed Requirements Analysis

After comparing the `docs/DMS_Page_Data_Requirements.md` and the `DMS_Complete_Flow_Story_Part1.md` against the existing system backend models, the following required data fields and relationships were found to be **missing** or **incompletely implemented** in the current system.

## 1. Product Entity (`Product.cs`)
* **Weight (grams)**: The requirement states products should have a weight (e.g., 35g for a bun) and allow different weight variants. **Missing** in the model.
* **Standard Quantity**: Used alongside rounding value as a reference quantity (e.g., 4 patties = 1 egg garnish). **Missing** in the model.

## 2. Ingredient Entity (`Ingredient.cs`)
* **Allow Extra Qty (Boolean)**: The requirement states admin can assign extra waste allowance (e.g., for cleaning loss). The model has `ExtraPercentageApplicable` but lacks a direct boolean flag for fixed extra quantity allowance.
* **Extra Qty Note (Text)**: The requirement needs a note field (e.g., "cleaning loss"). **Missing** in the model.

## 3. Recipe Entity (`Recipe.cs`)
* **Recipe Name**: Required for products with dual sub-recipes (e.g., "Dough Recipe" and "Bun Recipe" for Sugar Candy Bun). **Missing** in the model.
* **Variant (Full / Mini / Both)**: Required to specify which product variant the recipe applies to. **Missing** in the model.

## 4. Delivery Turn Entity (`DeliveryTurn.cs`)
* **Per-Section Timing**: The requirement specifies a sub-form/table to configure `Production Start Time` and `Effective Delivery Time` *per section* for a given delivery turn. The current model only has a single, global `ProductionStartTime` and `DeliveryTime` for the entire turn. **Missing** a related entity (e.g., `DeliveryTurnSectionTiming`) to handle this.

## 5. Delivery Plan Item / Order Entry (`DeliveryPlanItem.cs`)
* **Extra Quantity**: The Order Entry Grid requires an "Extra qty" column (manually added extra quantity). The model currently only supports `FullQuantity` and `MiniQuantity`. **Missing** `ExtraQuantity` field.

## 6. Immediate Order Entity (`ImmediateOrder.cs`)
* **Is Customized (Boolean)**: Required to flag if an immediate order has special customizations. **Missing** in the model.
* **Customization Notes (Text)**: Required to capture specific customization details (e.g., "Extra egg filling, double garnish"). The model has a generic `Reason` field but lacks dedicated customization flags/notes.
