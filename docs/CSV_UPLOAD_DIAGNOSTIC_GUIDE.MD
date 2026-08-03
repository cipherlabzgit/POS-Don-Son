# CSV Upload Diagnostic Guide

## Issue: CSV Not Loading to Import Products

This guide will help you identify and fix issues with CSV product imports.

## Diagnostic Steps

### Step 1: Check Browser Console

1. Open your browser (Chrome, Edge, Firefox, etc.)
2. Press `F12` to open Developer Tools
3. Click on the **Console** tab
4. Try uploading a CSV file
5. Look for messages starting with `[CSV Upload]` and `[Product CSV]`

### Step 2: What the Console Logs Mean

The CSV upload process has detailed logging at each stage:

#### File Selection
```
[CSV Upload] File selected: <filename> Size: <bytes> bytes
```
- **If you see this**: File picker worked, file was selected
- **If you don't see this**: File input not working or no file selected

#### File Reading
```
[CSV Upload] Reading file...
[CSV Upload] File read successfully, length: <characters>
```
- **If you see this**: File was read successfully
- **If you don't see this**: File read failed (check file permissions)

#### CSV Parsing
```
[CSV Upload] Parsing CSV...
[CSV Upload] CSV parsed, rows: <number>
```
- **If rows = 0**: Empty file
- **If rows = 1**: Only headers, no data rows
- **If rows > 1**: File parsed successfully

#### Header Validation
```
[CSV Upload] Expected headers: [array of headers]
[CSV Upload] Matrix to records result - rows: <number> error: <error or undefined>
```
- **If error is present**: Missing or incorrect column names
- **If no error**: Headers match expected format

#### Row Validation
```
[Product CSV] Mapping row: {object with row data}
[Product CSV] Loading code lookups...
[Product CSV] Code lookups loaded - Categories: <count> UOMs: <count>
```
- Shows the data being processed for each row
- Shows how many categories and UOMs are available in the system

#### Field Validation
```
[Product CSV] Looking up categoryCode: <code> uomCode: <code>
[Product CSV] Category ID: <guid> UOM ID: <guid>
```
- Shows if category and UOM codes were found
- **If "not found" error**: The code doesn't exist in your system

## Common Issues and Solutions

### Issue 1: "Missing required column(s)" Error

**Symptoms:**
- Error message appears immediately after selecting file
- Console shows: `[CSV Upload] Header validation error: Missing required column(s): ...`

**Cause:** Your CSV doesn't have all the required column headers

**Solution:**
1. Download the template by clicking **"CSV template"** button
2. Copy the exact header row from the template
3. Paste it as the first row in your CSV file
4. Ensure column names match exactly (case-insensitive, but spelling must match)

**Required Columns:**
- code
- name
- description
- categoryCode
- uomCode
- unitPrice
- productType
- productionSection
- sectionAssignmentCodes
- sectionAssignmentRoles
- hasFullSize
- hasMiniSize
- allowDecimal
- decimalPlaces
- roundingValue
- isPlainRollItem
- requireOpenStock
- displayInPOS
- enableLabelPrint
- allowFutureLabelPrint
- labelTemplateCode
- sortOrder
- defaultDeliveryTurns
- availableInTurns
- isActive

### Issue 2: "Unknown categoryCode" Error

**Symptoms:**
- Console shows: `[Product CSV] Category not found: <CODE>`
- Row appears in red with error message

**Cause:** The category code in your CSV doesn't exist in the system

**Solution:**
1. Go to `/inventory/category` in the DMS
2. Check what category codes exist
3. Update your CSV to use existing codes
4. **OR** create the missing category first, then retry the import

**Example:**
```
Console: [Product CSV] Category not found: BREAD Available: ['BAKERY', 'PASTRY', 'SNACKS']
```
Action: Change `BREAD` in your CSV to one of: `BAKERY`, `PASTRY`, or `SNACKS`

### Issue 3: "Unknown uomCode" Error

**Symptoms:**
- Console shows: `[Product CSV] UOM not found: <CODE>`
- Row appears in red with error message

**Cause:** The UOM code in your CSV doesn't exist in the system

**Solution:**
1. Go to `/inventory/uom` in the DMS
2. Check what UOM codes exist (e.g., PCS, KG, LTR)
3. Update your CSV to use existing codes
4. **OR** create the missing UOM first, then retry the import

### Issue 4: "Invalid row" or Field Parsing Errors

**Symptoms:**
- Errors like: `"unitPrice" must be a number`
- Errors like: `"code" is required`
- Console shows: `[Product CSV] Error mapping row:`

**Cause:** Data format is incorrect

**Common Field Issues:**

#### code (required)
- Must not be empty
- Maximum 20 characters
- Example: `PROD001`, `SKU-123`

#### name (required)
- Must not be empty
- Maximum 200 characters
- Example: `White Bread Loaf`

#### unitPrice (required)
- Must be a number
- No currency symbols
- Use dot (`.`) for decimals
- Example: `150.00`, `25.50`

#### Boolean fields
- Use: `true`, `false`, `yes`, `no`, `1`, `0`, `y`, `n`
- Leave empty for default value
- Examples:
  - `hasFullSize`: Default `true`
  - `hasMiniSize`: Default `false`
  - `isActive`: Default `true`

#### Integer fields
- Must be whole numbers
- No decimals
- Examples:
  - `decimalPlaces`: `0`, `1`, `2`, `3`, `4`
  - `sortOrder`: `0`, `1`, `2`, `10`
  - `roundingValue`: `1`, `5`, `10`

#### List fields (semicolon or comma separated)
- `defaultDeliveryTurns`: `1;2` or `1,2,3`
- `availableInTurns`: `1;2;3` or `1,2,3,4`
- `sectionAssignmentCodes`: `BAK;FILL` (use existing section codes)

### Issue 5: File Picker Doesn't Open

**Symptoms:**
- Clicking "Upload CSV" button does nothing
- No console messages appear

**Causes & Solutions:**

1. **Permission Issue**
   - Check if you have `products:import` or `products:create` permission
   - Console should show the upload button if you have permission
   - Contact your administrator to grant permissions

2. **Browser Issue**
   - Try a different browser (Chrome, Edge, Firefox)
   - Clear browser cache
   - Disable browser extensions that might block file inputs

3. **React State Issue**
   - Refresh the page and try again
   - Check console for any React errors

### Issue 6: Nothing Happens After Selecting File

**Symptoms:**
- File selected but no preview appears
- No error messages
- No console logs

**Solutions:**

1. **Check file format:**
   - Must be `.csv` file (not `.xlsx`, `.xls`, or other formats)
   - If you have an Excel file, save it as CSV:
     - Open in Excel
     - File > Save As
     - Choose "CSV (Comma delimited) (*.csv)"

2. **Check file encoding:**
   - File should be UTF-8 encoded
   - Avoid special characters that might break parsing

3. **Check file size:**
   - Very large files (10000+ rows) might take time to process
   - Try with a small test file first (2-3 products)

### Issue 7: "Failed to read CSV" Error

**Symptoms:**
- Generic error message
- Console shows: `[CSV Upload] Fatal error during file processing:`

**Solutions:**

1. **Check the console for the specific error** after the "Fatal error" message
2. **Common causes:**
   - File is corrupted
   - File encoding issues
   - File contains binary data instead of text
   - Browser security blocked the file read

3. **Try:**
   - Open the CSV in a text editor (Notepad, VS Code)
   - Verify it looks like plain text with commas
   - Save it again as a plain CSV
   - Try uploading the saved file

## Testing with a Minimal CSV

Create a test file named `test-products.csv` with this minimal content:

```csv
code,name,description,categoryCode,uomCode,unitPrice,productType,productionSection,sectionAssignmentCodes,sectionAssignmentRoles,hasFullSize,hasMiniSize,allowDecimal,decimalPlaces,roundingValue,isPlainRollItem,requireOpenStock,displayInPOS,enableLabelPrint,allowFutureLabelPrint,labelTemplateCode,sortOrder,defaultDeliveryTurns,availableInTurns,isActive
TEST001,Test Product,,BAKERY,PCS,100.00,Finished,,,,,true,false,false,0,1,false,true,true,true,false,,0,,,true
```

**Before testing:**
1. Ensure you have a category with code `BAKERY` (or change to an existing code)
2. Ensure you have a UOM with code `PCS` (or change to an existing code)
3. Change `TEST001` to a code that doesn't exist yet

**Expected behavior:**
1. File should upload successfully
2. You should see 1 valid row in the preview
3. Click "Import" to create the product

## Checking System Prerequisites

Before importing products, ensure these exist in your system:

### 1. Categories
- Go to: `/inventory/category`
- You need at least one active category
- Note the **Code** column values (e.g., `BAKERY`, `PASTRY`)

### 2. Units of Measure (UOM)
- Go to: `/inventory/uom`
- You need at least one active UOM
- Note the **Code** column values (e.g., `PCS`, `KG`, `LTR`)

### 3. Label Templates (Optional)
- Go to: `/administrator/label-templates`
- Note the **Code** column if you want to use label templates

### 4. Production Sections (Optional)
- Go to: `/administrator/production-sections`
- Note the **Code** column if you want to assign products to sections

## Still Having Issues?

### Collect Diagnostic Information

1. **Open Console (F12)**
2. **Try uploading the CSV**
3. **Copy all console messages** starting with `[CSV Upload]` or `[Product CSV]`
4. **Take a screenshot** of the error message (if any)
5. **Export a few rows of your CSV** as a sample

### What to Share with Support

- Browser version (e.g., Chrome 120, Firefox 115)
- Error messages from console
- Screenshot of the error
- Sample CSV data (remove sensitive information)
- Steps you've already tried

## Success Indicators

When everything works correctly, you should see:

1. ✅ Console: `[CSV Upload] File selected: <filename>`
2. ✅ Console: `[CSV Upload] CSV parsed, rows: <number>`
3. ✅ Console: `[CSV Upload] Matrix to records result - rows: <number>`
4. ✅ Console: `[Product CSV] Loading code lookups...`
5. ✅ Console: `[Product CSV] Code lookups loaded - Categories: <count>`
6. ✅ Console: `[Product CSV] DTO created successfully: <product code>`
7. ✅ Toast notification: "products: X row(s) validated"
8. ✅ Preview table shows your data with green checkmarks
9. ✅ "Import" button is enabled and shows count

After clicking Import:
1. ✅ Toast notification: "Imported X products record(s)."
2. ✅ Products appear in the product list
3. ✅ Products have all fields correctly populated

## Known Limitations

1. **Maximum file size**: Browser dependent, typically ~50MB
2. **Recommended rows per import**: <1000 for best performance
3. **Duplicate codes**: Will fail - codes must be unique
4. **Required fields**: Must have valid data, cannot be empty
5. **Referential integrity**: Categories, UOMs must exist before import

## Quick Reference: CSV Column Format

| Column | Required | Type | Example | Default |
|--------|----------|------|---------|---------|
| code | Yes | Text(20) | PROD001 | - |
| name | Yes | Text(200) | White Bread | - |
| categoryCode | Yes | Text | BAKERY | - |
| uomCode | Yes | Text | PCS | - |
| unitPrice | Yes | Decimal | 150.00 | - |
| productType | No | Text | Finished | Finished |
| hasFullSize | No | Boolean | true | true |
| hasMiniSize | No | Boolean | false | false |
| isActive | No | Boolean | true | true |
| requireOpenStock | No | Boolean | true | true |
| displayInPOS | No | Boolean | true | true |
| enableLabelPrint | No | Boolean | true | true |
| sortOrder | No | Integer | 0 | 0 |
| decimalPlaces | No | Integer | 0 | 0 |
| roundingValue | No | Integer | 1 | 1 |

## Advanced Debugging

If the standard logging doesn't reveal the issue, you can:

1. **Check Network Tab:**
   - Open Developer Tools (F12)
   - Go to Network tab
   - Try the import
   - Look for failed API calls (red entries)
   - Click on failed requests to see details

2. **Check Backend Logs:**
   - If you have access to the backend server
   - Look in `DMS-Backend/Logs/` directory
   - Check for errors during product creation

3. **Database Check:**
   - Verify categories table has data: `SELECT * FROM categories`
   - Verify uoms table has data: `SELECT * FROM unit_of_measures`
   - Check for constraint violations

## Summary Checklist

Before reporting an issue, verify:

- [ ] I have opened the browser console (F12)
- [ ] I have the correct CSV format (downloaded template)
- [ ] I have verified category codes exist in the system
- [ ] I have verified UOM codes exist in the system
- [ ] I have checked the console logs for specific errors
- [ ] I have tested with a minimal 1-2 row CSV
- [ ] I have the required permissions (products:import or products:create)
- [ ] I have tried refreshing the page
- [ ] I have tried a different browser
- [ ] I have read the error messages carefully

The console logs should now show exactly where the process is failing!
