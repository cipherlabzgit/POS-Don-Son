# Quick Start Guide - Enhanced DMS Features

## 🚀 What's New

All your requested features have been implemented! The system now supports:

✅ **Decimal quantities** (e.g., 4.75 buns)  
✅ **Multi-turn deliveries** (5AM, 10:30AM, 3:30PM)  
✅ **Section-based production** (Bakery, Filling, Garnish, etc.)  
✅ **Extra ingredient quantities** (carrot with 15% cleaning loss)  
✅ **Customized order tracking**  
✅ **Freezer stock calculations**  
✅ **Multi-component recipes** (egg bun = bun + filling + garnish)  
✅ **Dynamic grid configuration** (Excel-like flexibility for admins)  
✅ **Percentage-based recipes** (50% of base recipe + extras)  

---

## 📁 New Pages to Access

### 1. **Enhanced Order Entry Grid**
**URL:** `/dms/order-entry-enhanced`

**Features:**
- Multi-turn columns (5AM F/M, 10:30AM F/M, 3:30PM F/M)
- Decimal input support (products show ±2 badge if decimal allowed)
- Freezer stock balance toggle
- Section display
- Outlet checkboxes to exclude outlets
- Product Y/N toggle to exclude products

**How to Use:**
1. Toggle "Use Freezer Stock" to see available balance
2. Check/uncheck outlets to activate/deactivate
3. Enter quantities in Full (F) and Mini (M) columns
4. Different products show different delivery turn columns based on configuration

---

### 2. **Enhanced Production Planner**
**URL:** `/dms/production-planner-enhanced`

**Features:**
- **Customized Orders Section:** Shows all customized orders separately at the top
- **Section-wise Breakdown:** Each section (Bakery, Filling, Garnish) shows its products
- **Production Start Times:** Display per section (e.g., Bakery: 23:00, Short-Eats: 02:00)
- **Quantity Breakdown:**
  - Regular Full/Mini (normal orders)
  - Customized Full/Mini (shown in orange)
  - Total Full/Mini (includes both)
  - Grand Total
- **Freezer Stock Option:** Toggle to show "Produce Qty" (Total - Freezer Stock)
- **Product Exclusion:** Checkbox to exclude product from this delivery

**How to Use:**
1. Select delivery date and turn
2. Review customized orders at the top (orange background)
3. Scroll through sections to see production quantities
4. Toggle freezer stock to see reduced production quantities
5. Check boxes to exclude products from production

---

### 3. **Enhanced Stores Issue Note**
**URL:** `/dms/stores-issue-note-enhanced`

**Features:**
- **Section Filter:** Select specific section (Bakery, Filling, Garnish, etc.)
- **Product Breakdown:** Shows which products are being made in this section
- **Ingredient List with Extra Quantities:**
  - **Production Qty:** Recipe value for production (black)
  - **Extra Qty:** Additional for handling loss (orange, e.g., +18 kg)
  - **Stores Qty:** Total to issue (red/yellow background)
  - **Notes:** Reason for extra (e.g., "15% for cleaning loss")
- **Section-wise Export:** Export report for specific section
- **Production Times:** Shows when section starts production

**Important Display Rules:**
- ✅ **Production Sheet sees:** ONLY Production Qty (recipe value)
- ✅ **Stores Issue Note sees:** BOTH Production + Extra (total to issue)
- ✅ **Reason:** Extra is for handling loss, stores needs total, production needs recipe

**How to Use:**
1. Select section from dropdown
2. Review product breakdown for this section
3. Check ingredient requirements
4. Note ingredients with "Extra in Stores Only" badge
5. Click "Export Section Report" to download

---

### 4. **Admin Grid Configuration**
**URL:** `/administrator/grid-configuration`

**Features:**
- **Add/Remove Columns:** Like Excel, add new columns dynamically
- **Add Delivery Turns:** Add new delivery times (e.g., 6:00 PM Turn)
- **Configure Column Properties:**
  - Name and Key
  - Type (Text, Number, Decimal, Checkbox, Dropdown)
  - Width
  - Editable/Required flags
  - Conditional display rules
- **Hierarchical Structure:** Create sub-columns (Full/Mini under each turn)

**How to Use:**
1. Select grid to configure (Order Entry Grid, etc.)
2. Click "Add Column" to add new column
3. Click "Add Delivery Turn" to add new turn (auto-creates Full/Mini columns)
4. Drag columns to reorder (GripVertical icon)
5. Delete columns with trash icon
6. Click "Save Configuration" to apply changes

**Example: Adding 6PM Turn:**
1. Click "Add Delivery Turn"
2. Enter "6:00 PM Turn" as name
3. Enter "18:00" as time
4. System auto-creates 6PM F and 6PM M columns
5. Applied to all outlets immediately

---

## 🔑 Key Concepts

### 1. **Decimal Support**
- Admin configures per product: `allowDecimal: true, decimalPlaces: 2`
- Products with decimal show ±2 badge
- Can enter 4.75, 3.25, etc.

### 2. **5AM F and 5AM M**
- **F = Full** (full-size product)
- **M = Mini** (mini-size product)
- **5AM** = delivery turn time

### 3. **Section-Based Production**
Products are made in multiple sections:
- **Egg Bun Example:**
  - Bakery Section: Makes the bun (11 PM start)
  - Filling Section: Makes the filling (1 AM start)
  - Garnish Section: Adds garnish (3 AM start)
  - Each section has different start time for same 5AM delivery

### 4. **Extra Quantity Logic**
- **Carrot Example:** 120 kg needed for recipe
  - Production sees: 120 kg
  - Stores issues: 138 kg (120 + 15% = 138)
  - Reason: 15% weight loss after cleaning
- **Why:** Recipe calculations must be accurate, but stores needs to issue extra to compensate for losses

### 5. **Customized Orders**
- **Regular Orders:** Standard quantities from all outlets
- **Customized Orders:** Special requests (extra spicy, no crust, etc.)
- **Display:** Shown separately in production planner so production knows to pay special attention
- **Total:** Includes both regular + customized

### 6. **Freezer Stock**
- **When OFF:** Show full production quantities
- **When ON:** 
  - Order Entry: Shows "Available Balance" = Total - Freezer Stock
  - Production: Shows "Produce Qty" = Total - Freezer Stock
  - Stores: Shows reduced ingredient quantities

### 7. **Round-off Values**
- Admin sets per product: `roundOffValue: 0.25`
- **Example:** "4 buns per batch" means quantities round to 4, 8, 12, 16...
- **Example:** "4 patties = 1 egg for garnish" for Egg Bun

---

## 📊 Data Flow Example: Egg Bun Production

### 1. Order Entry (5AM Delivery)
```
Colombo Outlet: 100 Full, 50 Mini
Kandy Outlet: 80 Full, 40 Mini
Extra: 5 Full, 0 Mini
Total: 185 Full, 90 Mini
Freezer Stock: 35
Available (if toggle ON): 150 Full, 90 Mini
```

### 2. Production Planner
```
Section: Bakery 1 (Start: 11 PM)
- Regular: 180 Full, 90 Mini
- Customized: 5 Full, 0 Mini (Extra soft, no crust)
- Total: 185 Full, 90 Mini

Section: Filling Section (Start: 1 AM)
- Same quantities for filling component

Section: Garnish Section (Start: 3 AM)
- Same quantities for garnish
- Uses round-off: 4 patties = 1 boiled egg
```

### 3. Stores Issue Note

**Bakery Section:**
```
Wheat Flour: 
- Production: 450 kg
- Extra: +22.5 kg (5% buffer)
- Stores Issue: 472.5 kg

Raw Eggs:
- Production: 185 nos
- Extra: 0
- Stores Issue: 185 nos
```

**Filling Section:**
```
Carrot:
- Production: 120 kg
- Extra: +18 kg (15% cleaning loss)
- Stores Issue: 138 kg
```

**Garnish Section:**
```
Boiled Eggs:
- Production: 47 nos (185÷4 rounded up)
- Extra: 0
- Stores Issue: 47 nos
```

---

## 🎯 Admin Configuration Workflow

### Step 1: Configure Sections
Edit `mockSectionConfigurations` in `enhanced-models.ts`:
```typescript
{
  name: 'New Section',
  productionStartTime: '22:00',
  effectiveDeliveryDate: 'Next Day',
  effectiveDeliveryTime: '05:00'
}
```

### Step 2: Configure Products
```typescript
{
  code: 'BR2',
  description: 'Sandwich Bread Large',
  allowDecimal: true,
  decimalPlaces: 2,
  sections: [
    { sectionName: 'Bakery 1', componentName: 'Dough' }
  ],
  deliveryTurns: [1, 2], // 5AM and 10:30AM
  roundOffValue: 1
}
```

### Step 3: Configure Ingredients
```typescript
{
  code: 'CRT001',
  description: 'Carrot',
  allowExtraQuantity: true,
  extraQuantityPercentage: 15,
  extraQuantityReason: 'Weight loss after cleaning',
  showExtraInStoresOnly: true
}
```

### Step 4: Add Delivery Turns (via UI)
1. Go to `/administrator/grid-configuration`
2. Click "Add Delivery Turn"
3. Enter name and time
4. System creates columns automatically

---

## 💡 Tips & Best Practices

### For Production Manager:
1. **Check Customized Orders First:** Review orange section in production planner
2. **Use Freezer Stock Toggle:** See if you can use existing stock
3. **Follow Section Times:** Each section starts at different time
4. **Check Exclusions:** Some outlets/products may be excluded

### For Stores Manager:
1. **Issue Total Quantities:** Use "Stores Qty" column (includes extra)
2. **Read Notes:** Understand why extra is needed
3. **Export by Section:** Generate section-wise reports
4. **Check Production Times:** Know when each section needs ingredients

### For Admin:
1. **Test Grid Changes:** Add columns in test mode first
2. **Document Reasons:** Always add notes for extra quantities
3. **Review Sections:** Ensure production times are realistic
4. **Update Round-offs:** Keep standard values documented

---

## 🐛 Troubleshooting

### Issue: Decimal input not working
- Check product has `allowDecimal: true`
- Check `decimalPlaces` is set (e.g., 2)

### Issue: Delivery turn columns not showing
- Check product has turn ID in `deliveryTurns` array
- Check turn is active in configuration

### Issue: Extra quantities not showing
- Check ingredient has `allowExtraQuantity: true`
- Check `showExtraInStoresOnly: true`
- Make sure you're viewing Stores Issue Note, not Production sheet

### Issue: Customized orders not appearing
- Check `isCustomized: true` on order
- Check `customizationNotes` is filled
- View Production Planner page

---

## 📞 Support

For questions or issues:
1. Review this guide
2. Check `ENHANCED_FEATURES_IMPLEMENTED.md` for technical details
3. Inspect data models in `enhanced-models.ts`
4. Check mock data in `enhanced-data.ts`

---

## ✨ What Makes This System Unique

Unlike traditional systems where grid structure is hardcoded:

✅ **Admin can add columns** like Excel  
✅ **Admin can add delivery turns** without developer  
✅ **Admin can configure sections** with start times  
✅ **Admin can set extra quantities** per ingredient  
✅ **System handles multi-component recipes** automatically  
✅ **Customized orders tracked separately** but included in totals  
✅ **Freezer stock integrated** into calculations  
✅ **Decimal quantities supported** per product  

**Result:** A flexible system that adapts to your changing production needs without requiring code changes!
