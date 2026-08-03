# Showroom/Outlet Configuration Guide

## Overview

Your POS system uses an **Outlet/Showroom** concept to identify which physical location each POS terminal belongs to. This is critical for:
- Tracking sales per location
- Inventory management per showroom
- Stock transfers between locations
- Delivery planning
- Regional reporting

---

## How It Works

### 1. Backend: Outlet Entity

**Location**: `DMS-Backend/Models/Entities/Outlet.cs`

Each showroom/location is represented by an `Outlet` entity in the database:

```csharp
public class Outlet : BaseEntity
{
    public string Code { get; set; }          // e.g., "SR01", "WH01"
    public string Name { get; set; }          // e.g., "Main Showroom", "Branch 2"
    public string Address { get; set; }       // Physical address
    public string? Phone { get; set; }        // Contact number
    public string? ContactPerson { get; set; }
    public int DisplayOrder { get; set; }     // Sorting order
    public string? LocationType { get; set; } // "Showroom", "Warehouse", etc.
    public bool HasVariants { get; set; }     // Full/Mini size products
    public bool IsDeliveryPoint { get; set; } // Included in delivery planning
    // ... GPS coordinates, operating hours, etc.
}
```

**Database Table**: `outlets`

---

### 2. Creating Outlets in the System

Outlets are managed through the web admin dashboard:

**Endpoint**: `GET/POST /api/outlets`

**To create a new outlet**:
1. Log into the web admin dashboard
2. Navigate to Master Data → Outlets
3. Click "Add New Outlet"
4. Fill in details:
   - **Code**: Unique identifier (e.g., "SR01", "BR01")
   - **Name**: Display name (e.g., "Main Showroom", "Branch 1")
   - **Address**: Physical location
   - **Phone**: Contact number
   - **Location Type**: Showroom/Warehouse/Factory
   - **Display Order**: Sort order in lists
5. Save outlet
6. **Note the Outlet ID (GUID)** - needed for POS deployment

---

### 3. POS: Outlet Selection Flow

#### Step 1: Login

When a user logs into the POS:

**File**: `DMS-POS/src/pages/LoginPage.tsx`

```typescript
// User enters email + password
// POST /api/auth/login
// Receives JWT token
// User is authenticated
```

At this point, **no outlet is selected yet**.

---

#### Step 2: Fetch Available Outlets

After successful login, the POS fetches all available outlets:

**File**: `DMS-POS/src/pages/PosMainPage.tsx` (Lines 149-165)

```typescript
useEffect(() => {
  if (!accessToken) return
  
  // Fetch outlets from backend
  const data = await fetchOutletsPage(1, 100)
  const outlets = data.outlets.map((o) => ({
    id: String(o.id),           // GUID
    code: String(o.code),       // "SR01"
    name: String(o.name),       // "Main Showroom"
    address: String(o.address), // Physical address
    phone: String(o.phone)      // Contact number
  }))
  
  setOutlets(outlets)
  
  // Auto-select if only one outlet exists
  if (!outletId && outlets.length === 1) {
    setOutlet(outlets[0].id, outlets[0].name)
  }
}, [accessToken])
```

**API Call**: `GET /api/outlets/paginated?page=1&pageSize=100`

---

#### Step 3: User Selects Outlet

The POS displays a dropdown in the header for outlet selection:

**File**: `DMS-POS/src/pages/PosMainPage.tsx` (Lines 585-600)

```typescript
{/* Showroom pill in header */}
<button onClick={() => setOutletMenu(!outletMenu)}>
  {outletLabel || 'Select showroom'}
</button>

{/* Dropdown menu */}
{outletMenu ? (
  <ul>
    {outlets.map((o) => (
      <li key={o.id}>
        <button onClick={() => {
          setOutlet(o.id, o.name || o.code)
          setOutletMenu(false)
        }}>
          {o.name} ({o.code})
        </button>
      </li>
    ))}
  </ul>
) : null}
```

**Visual**: 
```
┌─────────────────────────┐
│ Main Showroom (SR01)    │ ← Currently selected
│ ▼                       │
└─────────────────────────┘
       ↓ Click
┌─────────────────────────┐
│ Main Showroom (SR01)    │ ✓
│ Branch 1 (BR01)         │
│ Branch 2 (BR02)         │
│ Warehouse (WH01)        │
└─────────────────────────┘
```

---

#### Step 4: Outlet Stored Locally

Once selected, the outlet is saved in browser local storage:

**File**: `DMS-POS/src/lib/settings-store.ts`

```typescript
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      outletId: null,                    // GUID from database
      outletLabel: 'Showroom',           // Display name
      
      setOutlet: (outletId, outletLabel) => 
        set({ outletId, outletLabel })
    }),
    {
      name: 'dms-pos-settings',          // LocalStorage key
      storage: createJSONStorage(() => localStorage)
    }
  )
)
```

**Storage Location**: Browser LocalStorage
**Key**: `dms-pos-settings`
**Persisted Across**: Sessions (even after closing POS)

**Example LocalStorage Value**:
```json
{
  "state": {
    "outletId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "outletLabel": "Main Showroom",
    "apiBaseUrl": "http://123.231.10.22:5126",
    "zoomPercent": 100,
    "autoPrint": false,
    "receiptPhone": "+94 77 123 4567",
    "receiptAddress": "123 Main St, City"
  },
  "version": 5
}
```

---

### 4. How Outlet ID is Used

Once an outlet is selected, **all sales are tagged with this outlet ID**:

#### Creating a Sale

**File**: `DMS-POS/src/pages/PosMainPage.tsx`

```typescript
async function handlePayment(paymentMethod: string, cashAmount: number) {
  const saleId = crypto.randomUUID()
  
  // Create sale object
  const sale = {
    id: saleId,
    outletId: outletId,           // ← From selected outlet
    paymentMethod: paymentMethod,
    total: subtotal,
    lines: lines.map(line => ({
      productId: line.product.id,
      quantity: line.qty,
      unitPrice: line.product.unitPrice
    })),
    createdAt: Date.now()
  }
  
  // Save to local SQLite
  await offlineDb.sales.put(sale)
  
  // Add to sync queue
  await offlineDb.pending.put({
    id: saleId,
    type: 'pos-sale',
    payload: sale,
    createdAt: Date.now(),
    retryCount: 0
  })
  
  // Try immediate sync if online
  if (online) {
    await processPendingQueue(true)
  }
}
```

#### When Syncing to Server

**File**: `DMS-POS/src/lib/sync-queue.ts`

```typescript
// Batch sync to server
const response = await postPosSalesBulk(salesPayload)

// Backend receives:
{
  "sales": [
    {
      "id": "uuid-1",
      "outletId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890", // ← Critical!
      "paymentMethod": "Cash",
      "total": 1250.00,
      "lines": [...]
    }
  ]
}
```

**Backend Controller**: `DMS-Backend/Controllers/PosSalesController.cs`

```csharp
[HttpPost("bulk")]
public async Task<ActionResult> CreateBulk([FromBody] CreateBulkPosSalesDto dto)
{
    foreach (var saleDto in dto.Sales)
    {
        var sale = new PosSale
        {
            Id = saleDto.Id,
            OutletId = saleDto.OutletId,  // ← Saved to database
            Total = saleDto.Total,
            PaymentMethod = saleDto.PaymentMethod,
            // ...
        };
        
        await _context.PosSales.AddAsync(sale);
    }
    
    await _context.SaveChangesAsync();
}
```

---

## Configuration Per Location

### For Each Remote Location

When deploying to a remote location, each POS terminal will:

1. **Install** the same POS application
2. **Login** with their credentials
3. **See all available outlets** in the dropdown
4. **Select their outlet** (e.g., "Branch 1")
5. **Outlet stored locally** in browser LocalStorage
6. **All sales tagged** with their outlet ID

### Example: 13 Locations

```
Location 1: Main Showroom
├─ POS Terminal 1
│  └─ Outlet: "Main Showroom" (ID: abc123...)
│     └─ All sales tagged with this ID

Location 2: Branch Office
├─ POS Terminal 2
│  └─ Outlet: "Branch Office" (ID: def456...)
│     └─ All sales tagged with this ID

Location 3: Warehouse
├─ POS Terminal 3
│  └─ Outlet: "Warehouse" (ID: ghi789...)
│     └─ All sales tagged with this ID

... (Locations 4-13) ...
```

---

## Automatic Outlet Selection

**If only ONE outlet exists in the database:**

The POS automatically selects it (no manual selection needed):

```typescript
// Auto-select if only one outlet
if (!outletId && outlets.length === 1) {
  setOutlet(outlets[0].id, outlets[0].name)
}
```

**Use Case**: Single-location businesses don't need to manually select showroom.

---

## Changing Outlet

Users can change the selected outlet at any time:

1. Click the showroom pill in the top-right header
2. Dropdown shows all available outlets
3. Click a different outlet
4. **New outlet ID is saved**
5. **All future sales use the new outlet ID**

**Important**: Past sales retain their original outlet ID (not retroactively changed).

---

## Security & Permissions

### Viewing Outlets

**Permission**: None (all authenticated users can see outlets)

The POS shows all outlets from the database. Users can select any outlet from the list.

### Filtering by Outlet (Backend)

Many endpoints accept `outletId` as a filter:

```
GET /api/pos-sales?outletId=abc123&startDate=2026-05-01
GET /api/stock-bf?outletId=abc123
GET /api/transfers?fromOutletId=abc123
```

### Future Enhancement: Restrict Outlet Access

You could add user-to-outlet mapping:

```csharp
public class User
{
    // Restrict which outlets this user can access
    public List<Guid> AllowedOutletIds { get; set; }
}
```

Then filter dropdown to only show allowed outlets.

---

## Outlet Data in Reports

When viewing reports in the web dashboard:

```sql
-- Sales by outlet
SELECT 
    o.name AS outlet_name,
    COUNT(ps.id) AS sale_count,
    SUM(ps.total) AS total_revenue
FROM pos_sales ps
JOIN outlets o ON ps.outlet_id = o.id
WHERE ps.sold_at >= '2026-05-01'
GROUP BY o.id, o.name
ORDER BY total_revenue DESC;
```

**Output**:
```
| Outlet Name      | Sale Count | Total Revenue |
|------------------|------------|---------------|
| Main Showroom    | 1,250      | $125,000.00   |
| Branch 1         | 850        | $85,000.00    |
| Branch 2         | 650        | $65,000.00    |
| Warehouse        | 150        | $15,000.00    |
```

---

## Troubleshooting

### Problem: "Select showroom" Won't Disappear

**Cause**: No outlet selected yet

**Solution**:
1. Check if outlets are loaded: Open DevTools Console
2. Look for: `outlets.length = 0` → No outlets in database
3. Or: User hasn't clicked dropdown to select

**Fix**:
- Create outlets in web admin
- Ensure POS is online when loading (fetches from API)
- Click dropdown and select an outlet

---

### Problem: Sales Going to Wrong Outlet

**Cause**: Wrong outlet selected in POS

**Solution**:
1. Check current outlet: Look at header pill
2. Change outlet: Click pill → Select correct outlet
3. Verify: Create test sale and check in backend

**Prevention**:
- Train staff to verify outlet on login
- Consider adding outlet confirmation on first sale
- Add visual indicator (logo/color per outlet)

---

### Problem: Can't See Outlet in Dropdown

**Cause**: 
- POS is offline (can't fetch outlets)
- Outlet doesn't exist in database
- Backend not accessible

**Solution**:
1. Check network: Ping server
2. Verify outlet exists: Web admin → Outlets
3. Check API: `GET /api/outlets/paginated`
4. Restart POS if needed

---

### Problem: Outlet Not Persisting After Restart

**Cause**: LocalStorage cleared or browser privacy mode

**Solution**:
- Don't use Private/Incognito mode
- Check if LocalStorage is enabled
- Re-select outlet on each startup if needed

---

## Best Practices

### 1. Create All Outlets Before Deployment

```
Before deploying POS to 13 locations:
✓ Create all 13 outlets in web admin
✓ Note down each Outlet ID
✓ Document outlet codes and names
✓ Test outlet selection in dev environment
```

### 2. Use Consistent Naming

```
Code Pattern:
- SR01, SR02, SR03... (Showrooms)
- BR01, BR02, BR03... (Branches)
- WH01, WH02... (Warehouses)

Name Pattern:
- "Main Showroom", "Branch 1", "Branch 2"
- Or: "City A Showroom", "City B Showroom"
```

### 3. Set Display Order

Order outlets logically:
```sql
UPDATE outlets SET display_order = 1 WHERE code = 'SR01'; -- Main first
UPDATE outlets SET display_order = 2 WHERE code = 'BR01';
UPDATE outlets SET display_order = 3 WHERE code = 'BR02';
-- etc.
```

### 4. Add Outlet Info to Receipts

Include outlet details on printed receipts:

```typescript
const receipt = {
  outletName: outletLabel,
  outletAddress: outlets.find(o => o.id === outletId)?.address,
  outletPhone: outlets.find(o => o.id === outletId)?.phone,
  // ...
}
```

### 5. Monitor Sales by Outlet

Create dashboard widget showing:
- Sales today per outlet
- Pending syncs per outlet
- Offline duration per outlet

---

## Summary

```
┌─────────────────────────────────────────────┐
│ Outlet Configuration Flow                    │
└─────────────────────────────────────────────┘

1. Admin creates outlets in web dashboard
   ↓
2. Outlets stored in PostgreSQL (outlets table)
   ↓
3. POS fetches outlets via API after login
   ↓
4. User selects their outlet from dropdown
   ↓
5. Outlet ID + Name stored in LocalStorage
   ↓
6. All sales tagged with this outlet ID
   ↓
7. Sales sync to backend with outlet ID
   ↓
8. Reports filtered/grouped by outlet
```

---

## Key Takeaways

✅ **One Outlet per POS Terminal** (but can be changed)  
✅ **Outlet selected after login** (not hardcoded in app)  
✅ **Stored in LocalStorage** (persists across sessions)  
✅ **All sales tagged** with outlet ID  
✅ **Same installer for all locations** (outlet selected at runtime)  
✅ **Centrally managed** (create/edit outlets in web admin)  
✅ **Flexible** (staff can change outlet if needed)  

---

**This design allows:**
- Single installer for all 13 locations ✅
- Dynamic outlet selection ✅
- Central management ✅
- Easy reporting by location ✅
- Staff flexibility ✅

---

*For deployment instructions, see: [DEPLOYMENT_GUIDE_REMOTE_POS.md](DEPLOYMENT_GUIDE_REMOTE_POS.md)*
