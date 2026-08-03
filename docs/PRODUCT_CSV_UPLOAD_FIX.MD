# Product CSV Upload Fix

## Issues Fixed

### 1. Missing `sectionAssignments` field in product update
**Problem**: When toggling product active status, the update DTO was missing the `sectionAssignments` field, which could cause update failures.

**Fix**: Added `sectionAssignments` field mapping in the `handleToggleActive` function.

### 2. Incorrect `productType` default value
**Problem**: When `productType` is not provided in the CSV, it was set to `undefined`, which might not be properly handled by the API.

**Fix**: Changed default value from `undefined` to `'Finished'` to match the backend default.

### 3. Missing `productionSectionId` field in CSV mapping
**Problem**: The `productionSectionId` field was not being explicitly set in the DTO.

**Fix**: Added explicit `productionSectionId: undefined` to ensure the field is present in the request.

## Testing CSV Upload

### Sample CSV Format

Create a CSV file named `products-test.csv` with the following format:

```csv
code,name,description,categoryCode,uomCode,unitPrice,productType,productionSection,sectionAssignmentCodes,sectionAssignmentRoles,hasFullSize,hasMiniSize,allowDecimal,decimalPlaces,roundingValue,isPlainRollItem,requireOpenStock,displayInPOS,enableLabelPrint,allowFutureLabelPrint,labelTemplateCode,sortOrder,defaultDeliveryTurns,availableInTurns,isActive
TEST001,Test Product 1,,BREAD,PCS,150.00,Finished,,,true,false,false,0,1,false,true,true,true,false,,0,1;2,1;2;3,true
TEST002,Test Product 2,Sample description,BREAD,PCS,200.00,,,,,true,false,false,0,1,false,true,true,true,false,,0,,,true
```

### Testing Steps

1. **Prepare Test Data**:
   - Ensure you have at least one category with code `BREAD` (or update the CSV with an existing category code)
   - Ensure you have a UOM with code `PCS` (or update the CSV with an existing UOM code)

2. **Access Products Page**:
   - Navigate to `/inventory/products` in the DMS Frontend
   - Verify you have the appropriate permissions (`products:import` or `products:create`)

3. **Download Template**:
   - Click the "CSV template" button to download the template
   - This will show you the exact column headers expected

4. **Upload CSV**:
   - Click the "Upload CSV" button
   - Select your test CSV file
   - Wait for the validation to complete

5. **Review Preview**:
   - Check the preview table for any validation errors (shown in red)
   - Valid rows will be shown with a green checkmark
   - Invalid rows will show error messages

6. **Import Data**:
   - Click the "Import" button to create the products
   - Monitor the progress and check for any errors

## Common Issues and Solutions

### Issue: "Unknown categoryCode" error
**Solution**: Ensure the category code exists in the system. Check `/inventory/category` to find valid codes.

### Issue: "Unknown uomCode" error
**Solution**: Ensure the UOM code exists in the system. Check `/inventory/uom` to find valid codes.

### Issue: "Product with code already exists" error
**Solution**: The product code must be unique. Either use a different code or delete/deactivate the existing product.

### Issue: Permission denied
**Solution**: Ensure your role has either `products:import` or `products:create` permission. Contact an administrator to grant these permissions.

### Issue: "unitPrice must be a number" error
**Solution**: Ensure the unitPrice column contains valid decimal numbers without currency symbols or letters.

### Issue: Validation errors on boolean fields
**Solution**: Use `true`, `false`, `yes`, `no`, `1`, `0`, `y`, or `n` for boolean fields. Leave empty for default values.

## Advanced Features

### Section Assignments
To assign a product to multiple production sections:

```csv
sectionAssignmentCodes,sectionAssignmentRoles
BAK;FILL,Primary;Secondary
```

- Use semicolons (`;`) to separate multiple section codes
- Roles are optional and should match the number of section codes
- Section codes must exist in the system (check `/administrator/production-sections`)

### Delivery Turns
To specify default and available delivery turns:

```csv
defaultDeliveryTurns,availableInTurns
1;2,1;2;3
```

- Use semicolons (`;`) or commas (`,`) to separate turn numbers
- Turn numbers must be integers (e.g., 1, 2, 3)

### Label Templates
To assign a label template:

```csv
labelTemplateCode
LBL001
```

- The label template code must exist in the system
- Leave empty if no label template is needed

## Verification

After importing products:

1. **Check Product List**: Verify the imported products appear in the product list
2. **View Details**: Click on a product to see all details are correctly saved
3. **Test Editing**: Try editing a product to ensure the update functionality works
4. **Test Toggle**: Test activating/deactivating products to verify the fixed update logic

## Technical Details

### Files Modified

1. `DMS-Frontend/src/app/(dashboard)/inventory/products/page.tsx`:
   - Fixed `handleToggleActive` function to include all required fields
   - Fixed `mapProductRow` function to properly set default values
   - Added explicit `productionSectionId` field

### API Endpoints Used

- `POST /api/Products` - Creates a new product for each CSV row
- Uses `CreateProductDto` schema defined in the backend

### Validation

The following validations are applied:

1. **Required Fields**: code, name, categoryId, unitOfMeasureId, unitPrice
2. **Field Lengths**: 
   - code: max 20 characters
   - name: max 200 characters
   - description: max 500 characters
3. **Numeric Ranges**:
   - unitPrice: >= 0
   - decimalPlaces: 0-4 (when allowDecimal is true)
   - roundingValue: > 0

## Troubleshooting

If CSV upload still doesn't work after applying these fixes:

1. **Check Browser Console**: Open browser DevTools (F12) and check the Console tab for error messages
2. **Check Network Tab**: Look for failed API requests and check the response details
3. **Verify Backend is Running**: Ensure the DMS-Backend is running and accessible
4. **Check Permissions**: Verify your user role has the required permissions
5. **Database Connection**: Ensure the database is accessible and migrations are applied

### Enable Debug Logging

To get more detailed error information, check the backend logs:

```bash
cd DMS-Backend
# Logs are written to the console and log files in the Logs/ directory
# Look for errors related to ProductsController or ProductService
```

## Next Steps

- Test the CSV upload functionality with various scenarios
- Verify that product updates work correctly
- Check that all product fields are properly saved and displayed
- Test with production section assignments and delivery turns
