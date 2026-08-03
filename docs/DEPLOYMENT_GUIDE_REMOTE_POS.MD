# Don & Sons POS - Remote Location Deployment Guide

## Overview

This guide explains how to deploy the Electron POS application to a remote location that will work offline and sync with the central server when online.

---

## Current Architecture

```
┌──────────────────────────────────────────────┐
│  Central Server (123.231.10.22)              │
│  ├─ PostgreSQL (Port 5432)                   │
│  ├─ ASP.NET Core API (Port 5126)             │
│  └─ Master Data (Products, Categories, etc.) │
└──────────────────────────────────────────────┘
                    ↕ Internet ↕
┌──────────────────────────────────────────────┐
│  Remote Location #1 (POS Terminal)           │
│  ├─ Electron POS Application                 │
│  ├─ SQLite Database (Local)                  │
│  ├─ Offline Queue (Pending Transactions)     │
│  └─ Auto-Sync every 60 seconds when online   │
└──────────────────────────────────────────────┘
```

---

## What Already Works ✅

Your POS system is already built with offline-first architecture:

1. **Local SQLite Storage**: All sales, products, and categories stored locally
2. **Offline Mode**: POS works completely offline
3. **Auto-Sync**: Every 60 seconds when online + on reconnect + on app focus
4. **Batch Sync**: Efficient bulk upload of sales
5. **Retry Logic**: Failed syncs retry up to 5 times
6. **Conflict Resolution**: Dropped mutations table for unresolvable conflicts

---

## Prerequisites

### On Central Server

1. **Backend API accessible from remote locations**:
   - Ensure port 5126 is open and accessible
   - Configure firewall rules if needed
   - OR use a domain name (donandson.ddns.net already in CORS)

2. **Create Outlet/Location in Database**:
   - Each POS terminal needs a unique Outlet ID
   - Create outlet in the web admin interface

### On Remote Location PC

1. **Windows PC** (Windows 10 or later)
2. **Internet connection** (for initial setup and periodic sync)
3. **Minimum 4GB RAM, 100MB disk space**
4. **User account with admin rights** (for installation)

---

## Step-by-Step Deployment

### **Phase 1: Build the Installer**

On your development machine:

```bash
# Navigate to POS directory
cd DMS-POS

# Install dependencies (if not already done)
npm install

# Build the production version
npm run build

# This creates an installer in DMS-POS/release folder
# Output: Don & Sons POS Setup X.X.X.exe
```

The installer will be at:
```
DMS-POS/release/Don & Sons POS Setup 2.0.0.exe
```

### **Phase 2: Prepare Deployment Package**

Create a deployment folder with:

1. **Installer**: `Don & Sons POS Setup 2.0.0.exe`
2. **Configuration file**: `pos-config.json` (create this)
3. **Deployment instructions**

Create `pos-config.json` for Location #1:

```json
{
  "locationId": "LOCATION-001",
  "locationName": "Remote Store #1",
  "serverUrl": "http://123.231.10.22:5126",
  "outletId": "<GUID-FROM-DATABASE>",
  "outletName": "Branch Office"
}
```

### **Phase 3: Server Configuration**

#### 1. Update CORS (if needed)

Check `DMS-Backend/appsettings.Development.json`:

```json
{
  "Cors": {
    "AllowedOrigins": [
      "http://localhost:5173",
      "http://123.231.10.22:5174",
      "http://donandson.ddns.net:5174"
    ]
  }
}
```

Add the remote location's IP if it has a static IP, or use `"*"` for all origins (less secure).

#### 2. Update .env (Production)

Ensure `.env` has the correct public URL:

```env
BACKEND_PORT=5126
VITE_API_URL=http://123.231.10.22:5126
```

#### 3. Restart Backend

```bash
cd DMS-Backend
dotnet run
```

Or if using Docker, restart the container.

### **Phase 4: Install on Remote Location**

#### On the Remote PC:

1. **Copy installer** to the remote PC via USB, network share, or remote desktop
   
2. **Run installer** as Administrator:
   ```
   Don & Sons POS Setup 2.0.0.exe
   ```

3. **Installation completes**:
   - Creates desktop shortcut: "Don & Sons POS"
   - Installs to: `C:\Users\<User>\AppData\Local\Programs\don-and-sons-pos\`
   - Creates SQLite database at: `C:\Users\<User>\AppData\Roaming\dms-pos\pos-offline.sqlite`

4. **Launch the application**

### **Phase 5: First-Time Configuration**

When the POS opens for the first time:

#### 1. Login Screen

- The POS will show a login screen
- **IMPORTANT**: Login requires internet connection for the first time
- Use credentials from your backend

#### 2. Configure API URL (if not auto-detected)

If you see connection errors:

1. Press `Ctrl + Shift + I` to open DevTools
2. Go to Application → Local Storage
3. Find `dms-pos-settings`
4. Update `apiBaseUrl`: `"http://123.231.10.22:5126"`
5. Refresh the page

Or add a settings UI:

- Create a settings button that allows changing API URL
- This should be done during development

#### 3. Select Outlet

After login:
- User selects their outlet from dropdown
- This outlet ID is stored locally
- All sales will be tagged with this outlet ID

#### 4. Initial Sync

The app will automatically:
1. Download all products from server (paginated)
2. Download all categories
3. Cache them in SQLite
4. Ready for offline use!

**First sync might take 1-2 minutes depending on product count.**

---

## Testing the Deployment

### Test 1: Online Operation

1. Create a test sale with 2-3 products
2. Complete payment
3. Check if sale appears in transaction history
4. Verify on backend: `GET /api/pos-sales`
5. Expected: Sale synced immediately

### Test 2: Offline Operation

1. **Disconnect internet** (disable WiFi/unplug ethernet)
2. Check connectivity indicator (should show "Offline")
3. Create a sale
4. Complete payment
5. Sale is saved locally, shows "Pending Sync"
6. Create 2-3 more sales while offline

### Test 3: Sync After Reconnect

1. **Reconnect internet**
2. Wait 2-3 seconds (sync debounce)
3. Watch sync progress indicator
4. Verify all pending sales upload to server
5. Check transaction history - all should show "Synced"
6. Verify on backend

### Test 4: Product Updates

1. On backend, add a new product
2. On POS, pull to refresh catalog (or wait for next sync)
3. New product should appear in catalog

---

## Configuration Options

### Location-Specific Settings

Each POS stores these in **Local Storage**:

```typescript
{
  apiBaseUrl: "http://123.231.10.22:5126",
  outletId: "guid-from-database",
  outletLabel: "Branch Office",
  zoomPercent: 100,
  autoPrint: false,
  receiptPhone: "+94 77 123 4567",
  receiptAddress: "123 Main St, City"
}
```

### Changing Settings

Users can access settings from the POS UI (if implemented) or by:

1. Opening DevTools (Ctrl+Shift+I)
2. Application → Local Storage → `dms-pos-settings`
3. Edit JSON directly

---

## Sync Behavior

### When Does Sync Happen?

1. **Every 60 seconds** (background interval)
2. **On reconnect** (after being offline)
3. **On app focus** (when user returns to app)
4. **Immediately after sale** (if online)

### Sync Process

```
┌─────────────────────────────────────────┐
│ 1. Check if online                      │
│ 2. Get pending queue (ordered by time)  │
│ 3. Batch sales (up to 10 per batch)     │
│ 4. Upload to server                     │
│ 5. Update local records as "synced"     │
│ 6. Remove from pending queue            │
│ 7. Retry failures (max 5 attempts)      │
│ 8. Drop after max retries               │
└─────────────────────────────────────────┘
```

### What Gets Synced?

- ✅ POS Sales (batch sync)
- ✅ Stock BF (brought forward)
- ✅ Transfers
- ✅ Delivery Returns
- ✅ Cashier Balance Submissions

### What's Cached Locally?

- ✅ Products (refreshed on login or manual sync)
- ✅ Categories
- ✅ All sales (for transaction history)
- ✅ Dropped mutations (audit trail)

---

## Troubleshooting

### Issue: POS Cannot Connect to Server

**Symptoms**: Login fails, "Network Error" messages

**Solutions**:
1. Check internet connection on remote PC
2. Ping server: `ping 123.231.10.22`
3. Check if backend is running: `curl http://123.231.10.22:5126/health`
4. Verify firewall rules on server
5. Check CORS configuration in backend

### Issue: Sales Not Syncing

**Symptoms**: Sales stay "Pending" forever

**Solutions**:
1. Open DevTools (Ctrl+Shift+I) → Console
2. Look for sync errors
3. Check pending queue:
   ```js
   // In DevTools console
   window.dmsPos.sqliteOp('pendingGetAllOrdered')
   ```
4. Check retry count - if >= 5, moved to dropped_mutations
5. Check authentication - token might be expired

### Issue: Products Not Loading

**Symptoms**: Empty catalog, no products visible

**Solutions**:
1. Check if initial sync completed
2. Manually trigger sync (if button exists)
3. Check local database:
   ```js
   // In DevTools console
   window.dmsPos.sqliteOp('productsGetAll')
   ```
4. Clear local storage and re-login
5. Check backend API: `GET /api/products/paginated?pageSize=200`

### Issue: Duplicate Sales

**Symptoms**: Same sale appears twice in backend

**Possible Causes**:
- Sale was created offline, then user force-synced before auto-sync
- Network timeout caused retry with same clientMutationId
- Backend didn't properly handle idempotency

**Prevention**:
- Backend should check for duplicate `clientMutationId`
- Add unique constraint on `clientMutationId` in PosSales table

### Issue: Database Corruption

**Symptoms**: App crashes, SQLite errors

**Solutions**:
1. Locate database: `C:\Users\<User>\AppData\Roaming\dms-pos\pos-offline.sqlite`
2. Backup current database
3. Check integrity:
   ```bash
   sqlite3 pos-offline.sqlite "PRAGMA integrity_check;"
   ```
4. If corrupted, delete database and restart app (re-sync from server)

### Issue: Slow Performance

**Causes**:
- Large transaction history (10,000+ sales)
- Many pending items in queue
- SQLite not optimized

**Solutions**:
1. Limit transaction history display (already done: 50 limit)
2. Archive old sales (move to backend only)
3. Vacuum SQLite:
   ```sql
   PRAGMA wal_checkpoint(TRUNCATE);
   VACUUM;
   ```

---

## Monitoring & Maintenance

### Daily Checks

1. **Check Sync Status**: Ensure no items stuck in pending queue
2. **Monitor Dropped Mutations**: Investigate why items were dropped
3. **Check Disk Space**: SQLite grows over time
4. **Verify Network**: Consistent connectivity to central server

### Weekly Maintenance

1. **Update Products**: Ensure catalog is current
2. **Check Logs**: Review for any errors
3. **Test Offline Mode**: Simulate network loss

### Monthly Tasks

1. **Database Backup**:
   ```bash
   copy "C:\Users\<User>\AppData\Roaming\dms-pos\pos-offline.sqlite" "D:\Backups\pos-backup-2026-05.sqlite"
   ```
2. **Update POS App**: Deploy new version if available
3. **Review Audit Trail**: Check dropped_mutations table

---

## Scaling to 13 Locations

Once Location #1 is working:

### Deployment Process for Locations 2-13:

1. **Use same installer** (Don & Sons POS Setup 2.0.0.exe)
2. **Create unique `pos-config.json`** for each location:
   ```json
   {
     "locationId": "LOCATION-002",
     "outletId": "<GUID-FOR-LOCATION-2>",
     "outletName": "Branch 2"
   }
   ```
3. **Install on each PC**
4. **Configure outlet during first login**

### Automation Options:

**Option A: Pre-configured Installers**

Create 13 different builds with pre-set API URL:

```bash
# In DMS-POS/.env.production
VITE_API_URL=http://123.231.10.22:5126
VITE_OUTLET_ID=<guid>
VITE_OUTLET_NAME="Branch X"

npm run build
```

**Option B: Configuration Management**

Create a configuration API endpoint:

```csharp
[HttpGet("config/location/{locationCode}")]
public async Task<ActionResult> GetLocationConfig(string locationCode)
{
    // Return outlet ID, name, settings for this location
    return Ok(new {
        outletId = "...",
        outletName = "...",
        receiptPhone = "...",
        receiptAddress = "..."
    });
}
```

POS queries this on first launch.

**Option C: QR Code Setup**

1. Generate QR code for each location containing:
   - Outlet ID
   - Outlet Name
   - API URL
2. POS scans QR on first launch
3. Automatically configures

---

## Security Considerations

### Network Security

1. **Use HTTPS in production**: Change API URL to `https://`
2. **Firewall rules**: Only allow POS locations to access port 5126
3. **VPN**: Consider VPN for remote locations (more secure)

### Authentication

1. **Strong passwords**: Each POS user has unique credentials
2. **Token expiration**: JWT expires after 1440 minutes (configurable)
3. **Refresh tokens**: Automatic refresh before expiry

### Data Security

1. **SQLite encryption**: Consider encrypting local database (add SQLCipher)
2. **No PII locally**: Don't store customer personal info if not needed
3. **Audit trail**: All sync operations logged

---

## Performance Optimization

### For Large Product Catalogs (1000+ products):

1. **Pagination**: Already implemented (200 per page)
2. **Lazy loading**: Don't load all products into memory
3. **Search indexing**: SQLite FTS5 for fast search

### For High Transaction Volume:

1. **Batch size**: Increase from 10 to 20-50 if network is stable
2. **Compression**: Gzip payload in HTTP requests
3. **CDN**: Use CDN for static assets (if web-based portion)

### For Slow Networks:

1. **Reduce sync frequency**: Change from 60s to 120s
2. **Compress database**: PRAGMA page_size, VACUUM
3. **Delta sync**: Only sync changes (future enhancement)

---

## Future Enhancements

### Phase 2: Advanced Sync

1. **Delta sync**: Only download products changed since last sync
   - Add `LastModified` timestamp to Products table
   - Backend endpoint: `GET /api/products/delta?since=<timestamp>`

2. **Conflict resolution UI**: Manual review for conflicts
   - Show dropped_mutations to user
   - Allow manual re-submission

3. **Offline time limit**: Warn if offline > 24 hours

### Phase 3: Monitoring Dashboard

1. **Central monitoring**: Web dashboard showing all POS terminals
2. **Sync status**: Real-time view of sync state per location
3. **Alerts**: Email/SMS if a location hasn't synced in X hours
4. **Health checks**: POS sends heartbeat every 5 minutes

### Phase 4: Data Analytics

1. **Local reports**: Generate sales reports offline
2. **Sync history**: Track all sync operations
3. **Performance metrics**: Measure sync speed, retry rates

---

## Appendix

### A. Database Schema (SQLite)

```sql
-- Products cache
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  unit_price REAL NOT NULL,
  category_name TEXT NOT NULL,
  sort_order REAL DEFAULT 0,
  require_open_stock INTEGER DEFAULT 1
);

-- Categories cache
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  sort_order REAL DEFAULT 0
);

-- Pending sync queue
CREATE TABLE pending (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  retry_count INTEGER DEFAULT 0
);

-- Local sales (full history)
CREATE TABLE sales (
  id TEXT PRIMARY KEY,
  outlet_id TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  total REAL NOT NULL,
  lines_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  synced INTEGER DEFAULT 0,
  sale_no TEXT,
  server_sale_id TEXT,
  status TEXT,
  rejection_reason TEXT
);

-- Failed sync records
CREATE TABLE dropped_mutations (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  dropped_at INTEGER NOT NULL,
  retry_count INTEGER DEFAULT 0
);
```

### B. API Endpoints Used by POS

```
POST   /api/auth/login                    # Authentication
POST   /api/pos-sales                     # Single sale
POST   /api/pos-sales/bulk                # Batch sales
GET    /api/pos-sales/{id}                # Get sale status
GET    /api/products/paginated            # Download products
GET    /api/categories/paginated          # Download categories
POST   /api/stock-bf/bulk                 # Stock brought forward
POST   /api/transfers                     # Create transfer
POST   /api/transfers/{id}/submit         # Submit transfer
POST   /api/delivery-returns              # Create delivery return
POST   /api/cashier-balance               # Submit cashier balance
```

### C. Electron IPC Operations

```javascript
// Available SQLite operations (via window.dmsPos.sqliteOp)
- productsGetAll
- productsSetAll
- categoriesGetAll
- categoriesSetAll
- pendingGetAllOrdered
- pendingPut
- pendingDelete
- pendingUpdate
- salesPut
- salesUpdate
- salesListByOutletDesc
- salesListPendingStatusRefresh
- stockBfPut
- stockBfUpdate
- droppedMutationsPut
- seedFromMigration
```

### D. Useful Commands

```bash
# Build installer
cd DMS-POS
npm run build

# Build without installer (for testing)
npm run build:dir

# Dev mode
npm run dev

# Check database size
dir "%APPDATA%\dms-pos\pos-offline.sqlite"

# Open database
sqlite3 "%APPDATA%\dms-pos\pos-offline.sqlite"

# Count pending items
sqlite3 pos-offline.sqlite "SELECT COUNT(*) FROM pending;"

# View dropped mutations
sqlite3 pos-offline.sqlite "SELECT * FROM dropped_mutations;"
```

---

## Support & Contact

For issues or questions during deployment:

1. Check logs in DevTools Console
2. Check SQLite database for data integrity
3. Verify network connectivity
4. Review this guide's troubleshooting section
5. Contact: info@cipherlabz.com

---

**Document Version**: 1.0  
**Last Updated**: May 17, 2026  
**Author**: Cipher Labz Development Team
