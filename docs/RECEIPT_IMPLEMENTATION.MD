# POS Receipt Implementation

## Overview
Implemented a receipt printing service that generates PDF receipts matching the physical receipt format shown in the reference image.

## Changes Made

### 1. Created DTO Models
**File:** `DMS-Backend/Models/DTOs/PosSales/PosSaleReceiptDto.cs`
- `PosSaleReceiptDto`: Contains all receipt data including company info, showroom, bill details, items, and totals
- `PosSaleReceiptLineDto`: Represents individual line items on the receipt

### 2. Created Service Interface
**File:** `DMS-Backend/Services/Interfaces/IPosSaleReceiptService.cs`
- `GetReceiptDataAsync()`: Retrieves receipt data for a POS sale
- `GenerateReceiptPdf()`: Generates PDF from receipt data

### 3. Implemented Receipt Service
**File:** `DMS-Backend/Services/Implementations/PosSaleReceiptService.cs`
- Fetches POS sale data with related entities (outlet, cashier, products)
- Generates PDF receipt using QuestPDF library
- Receipt format matches the physical receipt with:
  - Company header (name, address, phone)
  - Showroom name
  - Date/time and cashier
  - Bill number
  - Itemized product list with prices
  - Total, cash, and change
  - Item count and total quantity
  - Footer message about returns policy
  - "Powered by" text

### 4. Updated Controller
**File:** `DMS-Backend/Controllers/PosSalesController.cs`
- Added new endpoint: `GET /api/pos-sales/{id}/receipt`
- Returns PDF file for download
- Requires `pos:sale:view` permission

### 5. Registered Service
**File:** `DMS-Backend/Program.cs`
- Added `IPosSaleReceiptService` and `PosSaleReceiptService` to dependency injection

### 6. Added Configuration
**File:** `DMS-Backend/appsettings.json`
- Added `Receipt` section with configurable values:
  - `CompanyName`: "DON & SONS (PVT) LTD"
  - `CompanyAddress`: Address with line breaks
  - `CompanyPhone`: Contact numbers
  - `FooterMessage`: Returns policy message
  - `PoweredBy`: Attribution text

## Receipt Format Details

The receipt PDF is generated with:
- **Paper size:** 80mm thermal receipt paper
- **Font:** Clean, readable system font at 8pt
- **Layout:** Matches physical receipt exactly
  - Centered company header
  - Left-aligned transaction details
  - Table format for items
  - Right-aligned prices
  - Bold totals section
  - Centered footer and thank you message

## API Usage

### Get Receipt PDF
```http
GET /api/pos-sales/{posSaleId}/receipt
Authorization: Bearer {token}
```

**Response:**
- Content-Type: `application/pdf`
- Filename: `Receipt-{BillNo}.pdf`
- Status: 200 OK

**Errors:**
- 404 Not Found: POS sale doesn't exist
- 401 Unauthorized: No valid token
- 403 Forbidden: User doesn't have `pos:sale:view` permission

## Configuration Options

You can customize the receipt by editing the `Receipt` section in `appsettings.json`:

```json
{
  "Receipt": {
    "CompanyName": "Your Company Name",
    "CompanyAddress": "Line 1\nLine 2",
    "CompanyPhone": "Phone numbers",
    "FooterMessage": "Your return policy",
    "PoweredBy": "Your attribution"
  }
}
```

## Testing

To test the receipt generation:
1. Stop the running backend application
2. Rebuild the project: `dotnet build`
3. Start the application: `dotnet run`
4. Make a POS sale or use an existing sale ID
5. Call the endpoint: `GET /api/pos-sales/{id}/receipt`
6. The PDF will be downloaded automatically

## Sample Receipt Structure

```
        DON & SONS (PVT) LTD
    NO: 302/D, OLD KANDY ROAD,
         DALUGAMA, KELANIYA
      Tel:011-2911412/0768214432
----------------------------------------
Showroom : Dalugama
Date: 5/14/2026 2:31:15 PM
Cashier: R.M.Buddhika
Bill No: 01300757
----------------------------------------
Item              Each  Qty      Total
----------------------------------------
Omelette Bun     150.00   1     150.00
Fish Bun         150.00   1     150.00
----------------------------------------
TOTAL                           300.00
CASH                            300.00
CHANGE                            0.00
----------------------------------------
No of Items : 2  Total Qty : 2
----------------------------------------
    FOOD ARE NOT RETURNABLE
   COMPLAINT MUST BE LODGED BEFORE
         12 NOON NEXT DAY

           THANK YOU!

      Powered by www.yuvima.lk
```

## Notes

- The receipt uses the cashier's name from the `CreatedBy` user
- Prices are formatted with 2 decimal places
- Quantities are shown as whole numbers
- The receipt PDF is optimized for thermal receipt printers
- All configuration values have sensible defaults matching your current setup
