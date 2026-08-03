# Frontend POS Receipt Update

## Overview
Updated the POS frontend print preview and receipt printing to match the physical receipt format, including all required fields for a proper thermal receipt.

## Changes Made

### 1. Updated Print Receipt Type Definition
**File:** `DMS-POS/src/lib/print-receipt.ts`

**Changes:**
- Added new fields to `PrintReceiptOpts`:
  - `companyAddress?: string` - Company address with line breaks
  - `companyPhone?: string` - Contact phone numbers
  - `unitPrice: number` - Unit price for each line item
  - `cash: number` - Cash amount received
  - `change: number` - Change to return
  - `cashier?: string` - Cashier name
  - `dateTime?: string` - Transaction date and time

### 2. Updated HTML Receipt Generation
**File:** `DMS-POS/src/lib/print-receipt.ts`

**Changes:**
- Completely redesigned receipt HTML to match physical receipt format
- Added company header with name, address, and phone
- Added showroom, date, cashier, and bill number section
- Updated items table to include 4 columns: Item, Each (unit price), Qty, Total
- Added proper totals section with TOTAL, CASH, and CHANGE
- Added item count summary
- Added footer message about returns policy
- Added "THANK YOU!" message
- Added "Powered by www.yuvima.lk" attribution
- Added print-specific CSS for thermal receipt (80mm width)

### 3. Updated Print Preview Modal
**File:** `DMS-POS/src/components/PrintPreviewModal.tsx`

**Changes:**
- Updated preview to show company header (name, address, phone)
- Added showroom, date, cashier, and bill number display
- Updated items table to 4 columns with unit prices
- Added TOTAL, CASH, and CHANGE rows
- Added item count and total quantity display
- Added footer message display
- Added "THANK YOU!" and powered by text
- Adjusted font sizes to match thermal receipt (10-11px)
- Changed from casual style to thermal receipt monospace style

### 4. Updated POS Main Page
**File:** `DMS-POS/src/pages/PosMainPage.tsx`

**Changes:**

#### Updated State Types:
```typescript
// Added unitPrice, cash, change, dateTime to lastReceipt state
const [lastReceipt, setLastReceipt] = useState<{
  outletLabel: string; total: number; paymentMethod: string; cash: number; change: number
  saleNo?: string; dateTime?: string; 
  lines: { name: string; unitPrice: number; qty: number; amount: number }[]
} | null>(null)
```

#### Updated handlePay Function:
- Added `unitPrice` to snapshot lines
- Added date/time generation in proper format (M/D/YYYY H:MM:SS AM/PM)
- Updated `receiptSnapshot` type to include all new fields
- Set `cash` to total amount (assuming exact payment for now)
- Set `change` to 0
- Added `dateTime` field
- Updated both online and offline receipt snapshots

#### Updated Print Receipt Calls:
- Changed title from "Receipt" to "DON & SONS (PVT) LTD"
- Added company address: "NO: 302/D, OLD KANDY ROAD,\nDALUGAMA, KELANIYA"
- Added company phone: "Tel:011-2911412/0768214432"
- Added cashier name from user data
- Added date/time
- Added cash and change amounts
- Updated footer lines with returns policy

#### Updated handlePrint Function:
- Generate current date/time for preview
- Include all new fields for both current cart preview and last receipt reprint
- Pass company info, cashier, date/time, cash, change

## Receipt Format

The updated receipt now displays:

```
        DON & SONS (PVT) LTD
    NO: 302/D, OLD KANDY ROAD,
         DALUGAMA, KELANIYA
      Tel:011-2911412/0768214432
----------------------------------------
Showroom : Dalugama
Date: 5/15/2026 12:01:15 PM
Cashier: R.M.Buddhika
Bill No: 01300757
----------------------------------------
Item              Each  Qty      Total
----------------------------------------
Fried Rice      950.00   1     950.00
----------------------------------------
TOTAL                           950.00
CASH                            950.00
CHANGE                            0.00
----------------------------------------
No of Items : 1  Total Qty : 1
----------------------------------------
    FOOD ARE NOT RETURNABLE
   COMPLAINT MUST BE LODGED BEFORE
         12 NOON NEXT DAY

           THANK YOU!

      Powered by www.yuvima.lk
```

## Features

1. **Company Header** - Shows company name, address, and phone at the top
2. **Transaction Details** - Showroom, date/time, cashier, bill number
3. **Itemized List** - Shows each item with unit price, quantity, and total
4. **Totals Section** - Displays total amount, cash received, and change
5. **Item Summary** - Shows number of items and total quantity
6. **Footer Policy** - Returns policy message
7. **Thank You** - Bold thank you message
8. **Attribution** - Powered by attribution
9. **Thermal Receipt Optimized** - Formatted for 80mm thermal receipt printers
10. **Print Ready** - Includes @media print CSS for proper printing

## Testing

To test the new receipt format:
1. Open the POS application
2. Add items to cart
3. Click the print preview button (printer icon)
4. Verify the preview matches the physical receipt format
5. Complete a sale to test auto-print (if enabled)
6. Use "Reprint Last" to verify saved receipt data

## Future Enhancements

Potential improvements:
- Allow configuration of company info in settings
- Calculate actual change based on payment amount input
- Support for partial payments
- QR code for digital receipt
- Support for discounts/promotions display
- Tax breakdown if applicable
