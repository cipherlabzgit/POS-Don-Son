# Don & Sons POS - Architecture & Deployment Flow

## System Architecture

```
┌───────────────────────────────────────────────────────────────────────┐
│                        CENTRAL SERVER                                  │
│                     (123.231.10.22:5126)                              │
│                                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │  PostgreSQL  │  │ ASP.NET Core │  │   Web Admin  │               │
│  │   Database   │◄─┤  Backend API │◄─┤   Dashboard  │               │
│  │  (Master)    │  │              │  │              │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
│         ▲                 ▲                                            │
│         │                 │                                            │
│         │          ┌──────┴──────┐                                    │
│         │          │  API Routes  │                                    │
│         │          ├──────────────┤                                    │
│         │          │ /health      │                                    │
│         │          │ /api/auth/*  │                                    │
│         └──────────┤ /api/pos-sales │                                 │
│                    │ /api/pos-sales/bulk │                             │
│                    │ /api/products/paginated │                         │
│                    │ /api/categories/paginated │                       │
│                    └──────────────┘                                    │
└───────────────────────────────────────────────────────────────────────┘
                              │
                              │ INTERNET
                              │ (HTTP/HTTPS)
                              │
                  ┌───────────┴───────────┐
                  │                       │
        ┌─────────▼────────┐    ┌────────▼─────────┐
        │  Auto-Sync       │    │  Auto-Sync       │
        │  Every 60s       │    │  Every 60s       │
        │  + On Reconnect  │    │  + On Reconnect  │
        └─────────┬────────┘    └────────┬─────────┘
                  │                      │
┌─────────────────▼──────────┐ ┌────────▼───────────────────┐
│   REMOTE LOCATION #1        │ │   REMOTE LOCATION #2        │
│   ========================  │ │   ========================  │
│                             │ │                             │
│  ┌───────────────────────┐ │ │  ┌───────────────────────┐ │
│  │  Electron POS App      │ │ │  │  Electron POS App      │ │
│  │  ==================    │ │ │  │  ==================    │ │
│  │                        │ │ │  │                        │ │
│  │  • React UI            │ │ │  │  • React UI            │ │
│  │  • Vite Bundler        │ │ │  │  • Vite Bundler        │ │
│  │  • Zustand State       │ │ │  │  • Zustand State       │ │
│  │  • Axios HTTP          │ │ │  │  • Axios HTTP          │ │
│  │  • Offline-First       │ │ │  │  • Offline-First       │ │
│  │                        │ │ │  │                        │ │
│  └──────────┬────────────┘ │ │  └──────────┬────────────┘ │
│             │ IPC           │ │             │ IPC           │
│  ┌──────────▼────────────┐ │ │  ┌──────────▼────────────┐ │
│  │  SQLite Database      │ │ │  │  SQLite Database      │ │
│  │  =================    │ │ │  │  =================    │ │
│  │                       │ │ │  │                       │ │
│  │  ┌─────────────────┐ │ │ │  │  ┌─────────────────┐ │ │
│  │  │ products        │ │ │ │  │  │ products        │ │ │
│  │  │ categories      │ │ │ │  │  │ categories      │ │ │
│  │  │ sales           │ │ │ │  │  │ sales           │ │ │
│  │  │ pending         │ │ │ │  │  │ pending         │ │ │
│  │  │ dropped_mutations│ │ │ │  │  │ dropped_mutations│ │ │
│  │  └─────────────────┘ │ │ │  │  └─────────────────┘ │ │
│  │                       │ │ │  │                       │ │
│  │  Location: pos-offline│ │ │  │  Location: pos-offline│ │
│  │  .sqlite in %APPDATA% │ │ │  │  .sqlite in %APPDATA% │ │
│  └───────────────────────┘ │ │  └───────────────────────┘ │
│                             │ │                             │
│  Outlet: Branch 1           │ │  Outlet: Branch 2           │
│  Status: ●ONLINE            │ │  Status: ●ONLINE            │
└─────────────────────────────┘ └─────────────────────────────┘

                    ... (Locations 3-13) ...
```

---

## Data Flow - Sale Creation & Sync

### Scenario 1: Online Sale (Normal Operation)

```
┌─────────────┐
│ POS Station │
│  (Online)   │
└──────┬──────┘
       │
       │ 1. User creates sale
       │
       ▼
┌──────────────────────┐
│ SQLite Local DB      │
│ • Save to sales      │  ← Always save locally first
│ • Add to pending     │
└──────┬───────────────┘
       │
       │ 2. Immediate sync attempt (because online)
       │
       ▼
┌──────────────────────┐
│ API: POST /api/      │
│   pos-sales          │  ← Send to server
└──────┬───────────────┘
       │
       │ 3. Success response
       │
       ▼
┌──────────────────────┐
│ SQLite Local DB      │
│ • Update: synced=1   │
│ • server_sale_id     │  ← Mark as synced
│ • Remove from pending│
└──────────────────────┘
       │
       │ 4. Sale visible in backend
       │
       ▼
┌──────────────────────┐
│ PostgreSQL Database  │
│ • Sale record        │  ← Permanent storage
│ • Visible in web UI  │
└──────────────────────┘
```

### Scenario 2: Offline Sale (Network Down)

```
┌─────────────┐
│ POS Station │
│  (Offline)  │  ← No internet connection
└──────┬──────┘
       │
       │ 1. User creates sale
       │
       ▼
┌──────────────────────┐
│ SQLite Local DB      │
│ • Save to sales      │
│ • synced = 0         │  ← Mark as not synced
│ • Add to pending     │  ← Queue for later
└──────────────────────┘
       │
       │ 2. Sale stored locally only
       │    User sees "Pending Sync" status
       │
       ▼
┌──────────────────────┐
│ User Interface       │
│ ⚠ Offline Mode       │
│ Sale #123: Pending   │  ← Visual feedback
└──────────────────────┘
       │
       │ ... time passes ...
       │
       │ 3. Internet reconnects
       │
       ▼
┌──────────────────────┐
│ Sync Service         │
│ • Detects reconnect  │
│ • Wait 2s (debounce) │  ← Avoid rapid retries
│ • Start sync queue   │
└──────┬───────────────┘
       │
       │ 4. Process pending queue
       │
       ▼
┌──────────────────────┐
│ Batch Sync           │
│ • Collect up to 10   │
│ • POST /api/pos-     │  ← Batch for efficiency
│   sales/bulk         │
└──────┬───────────────┘
       │
       │ 5. Success response
       │
       ▼
┌──────────────────────┐
│ SQLite Local DB      │
│ • Update: synced=1   │
│ • Remove from pending│  ← Clear queue
└──────────────────────┘
       │
       │ 6. Sale now in backend
       │
       ▼
┌──────────────────────┐
│ PostgreSQL Database  │
│ • Sale record        │
└──────────────────────┘
```

### Scenario 3: Sync Failure with Retry

```
┌──────────────────────┐
│ Pending Queue        │
│ • 5 sales waiting    │
└──────┬───────────────┘
       │
       │ 1. Sync attempt #1
       │
       ▼
┌──────────────────────┐
│ POST /api/pos-sales  │
│ /bulk                │
└──────┬───────────────┘
       │
       │ ❌ Network timeout
       │
       ▼
┌──────────────────────┐
│ Retry Logic          │
│ • retry_count++      │  ← Increment counter
│ • Keep in pending    │
└──────────────────────┘
       │
       │ ... 60 seconds later ...
       │
       │ 2. Sync attempt #2
       │
       ▼
┌──────────────────────┐
│ POST /api/pos-sales  │
│ /bulk                │
└──────┬───────────────┘
       │
       │ ❌ Server error 500
       │
       ▼
┌──────────────────────┐
│ Retry Logic          │
│ • retry_count++      │  ← Now = 2
│ • Keep in pending    │
└──────────────────────┘
       │
       │ ... 60 seconds later ...
       │
       │ 3. Sync attempt #3
       │
       ▼
┌──────────────────────┐
│ POST /api/pos-sales  │
│ /bulk                │
└──────┬───────────────┘
       │
       │ ✅ Success!
       │
       ▼
┌──────────────────────┐
│ SQLite Local DB      │
│ • Update: synced=1   │
│ • Remove from pending│  ← Success after 2 retries
└──────────────────────┘
```

### Scenario 4: Max Retries Exceeded

```
┌──────────────────────┐
│ Pending Queue        │
│ • Sale #456          │
│ • retry_count = 4    │
└──────┬───────────────┘
       │
       │ 5th retry attempt
       │
       ▼
┌──────────────────────┐
│ POST /api/pos-sales  │
└──────┬───────────────┘
       │
       │ ❌ Still failing
       │
       ▼
┌──────────────────────┐
│ Max Retry Check      │
│ • retry_count = 5    │  ← Reached maximum
│ • Move to dropped    │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ SQLite Local DB      │
│ • dropped_mutations  │  ← Audit trail
│   table              │
│ • Remove from pending│
└──────┬───────────────┘
       │
       │ Notify admin
       │
       ▼
┌──────────────────────┐
│ User Interface       │
│ ⚠ Toast: "Sale could│
│   not sync after 5   │  ← User notification
│   attempts. Contact  │
│   administrator."    │
└──────────────────────┘
```

---

## Deployment Flow - Single Location

```
┌─────────────────────────────────────────────────┐
│ PHASE 1: PREPARATION (Development Machine)      │
└─────────────────────────────────────────────────┘
       │
       │ 1. Build installer
       ▼
┌──────────────────────┐
│ cd DMS-POS           │
│ npm run build        │  ← Webpack + Electron builder
└──────┬───────────────┘
       │
       │ 2. Installer created
       ▼
┌──────────────────────┐
│ DMS-POS/release/     │
│ Don & Sons POS       │  ← Windows installer (.exe)
│ Setup 2.0.0.exe      │    ~100 MB
└──────┬───────────────┘
       │
       │ 3. Create deployment package
       ▼
┌──────────────────────┐
│ deploy-pos-remote.ps1│  ← Run PowerShell script
│ -LocationId "LOC-001"│
│ -OutletId "<guid>"   │
│ -OutletName "Br 1"   │
└──────┬───────────────┘
       │
       │ 4. Package ready
       ▼
┌──────────────────────┐
│ Deployment Package   │
│ • Installer.exe      │
│ • Config.json        │  ← Outlet details
│ • Guide.txt          │
└──────────────────────┘

┌─────────────────────────────────────────────────┐
│ PHASE 2: TRANSFER TO REMOTE LOCATION            │
└─────────────────────────────────────────────────┘
       │
       ├─ Option A: USB Drive ────────┐
       │                               │
       ├─ Option B: Network Share ────┤
       │                               │
       ├─ Option C: Remote Desktop ───┤
       │                               │
       └───────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│ PHASE 3: INSTALLATION (Remote PC)               │
└─────────────────────────────────────────────────┘
       │
       │ 1. Right-click installer
       ▼
┌──────────────────────┐
│ Run as Administrator │  ← Requires admin rights
└──────┬───────────────┘
       │
       │ 2. Installation wizard
       ▼
┌──────────────────────┐
│ NSIS Installer       │
│ • Extract files      │
│ • Create shortcuts   │  ← Desktop + Start Menu
│ • Register app       │
└──────┬───────────────┘
       │
       │ 3. Installation complete
       ▼
┌──────────────────────┐
│ Installed at:        │
│ C:\Users\<User>\     │
│ AppData\Local\       │  ← Application files
│ Programs\don-and-    │
│ sons-pos\            │
└──────────────────────┘

┌─────────────────────────────────────────────────┐
│ PHASE 4: FIRST LAUNCH & CONFIGURATION           │
└─────────────────────────────────────────────────┘
       │
       │ 1. Launch from desktop shortcut
       ▼
┌──────────────────────┐
│ POS Application      │
│ • Create SQLite DB   │
│   at %APPDATA%\      │  ← First-time setup
│   dms-pos\           │
│ • Show login screen  │
└──────┬───────────────┘
       │
       │ 2. User enters credentials
       ▼
┌──────────────────────┐
│ POST /api/auth/login │  ← Authenticate
└──────┬───────────────┘
       │
       │ 3. Login success, JWT token
       ▼
┌──────────────────────┐
│ Outlet Selection     │
│ • Dropdown list      │
│ • Select: "Branch 1" │  ← Critical step!
└──────┬───────────────┘
       │
       │ 4. Outlet selected, trigger sync
       ▼
┌──────────────────────┐
│ Initial Catalog Sync │
│ • GET /api/products/ │
│   paginated          │  ← Download all products
│ • GET /api/          │
│   categories/        │  ← Download categories
│   paginated          │
└──────┬───────────────┘
       │
       │ 5. Products downloaded (1-2 min)
       ▼
┌──────────────────────┐
│ SQLite Database      │
│ • products table     │
│ • categories table   │  ← Cached locally
│ • Ready for offline! │
└──────┬───────────────┘
       │
       │ 6. POS ready to use
       ▼
┌──────────────────────┐
│ POS Main Screen      │
│ • Product catalog    │
│ • Cart               │  ← Fully functional!
│ • Payment            │
└──────────────────────┘

┌─────────────────────────────────────────────────┐
│ PHASE 5: TESTING & VERIFICATION                 │
└─────────────────────────────────────────────────┘
       │
       │ Test 1: Online sale
       ▼
┌──────────────────────┐
│ Create sale          │
│ • 3 products         │
│ • Total: $50.00      │  ← Complete payment
│ • Payment: Cash      │
└──────┬───────────────┘
       │
       │ ✅ Syncs immediately
       ▼
┌──────────────────────┐
│ Backend Dashboard    │
│ • Sale appears       │  ← Verify on server
│ • Status: Approved   │
└──────────────────────┘
       │
       │ Test 2: Offline sale
       ▼
┌──────────────────────┐
│ Disconnect internet  │  ← Unplug ethernet / disable WiFi
└──────┬───────────────┘
       │
       │ Create offline sale
       ▼
┌──────────────────────┐
│ POS shows: Offline   │
│ Sale created         │
│ Status: Pending Sync │  ← Queued locally
└──────┬───────────────┘
       │
       │ Reconnect internet
       ▼
┌──────────────────────┐
│ Auto-sync triggered  │
│ • After 2s debounce  │  ← Automatic!
│ • Upload pending     │
└──────┬───────────────┘
       │
       │ ✅ Sale synced
       ▼
┌──────────────────────┐
│ Status: Synced       │  ← Success!
└──────────────────────┘

┌─────────────────────────────────────────────────┐
│ PHASE 6: DEPLOYMENT COMPLETE                    │
└─────────────────────────────────────────────────┘
       │
       ▼
✅ Location #1 operational!
✅ Repeat for Locations 2-13
```

---

## Sync Timer Behavior

```
Time ────────────────────────────────────────────────────▶

 0s   App starts
      │
      ├─ User authenticated
      │
      ▼
 2s   Initial sync
      │  • Download products
      │  • Download categories
      │
      ▼
60s   Background sync #1
      │  • Check pending queue
      │  • Upload if any
      │
      ▼
120s  Background sync #2
      │  • Check pending queue
      │  • Upload if any
      │
      ▼
180s  Background sync #3
      │  ...
      │
      ▼
      ... continues every 60s while app is open ...


Additional Sync Triggers:
━━━━━━━━━━━━━━━━━━━━━━━━━━

 🔌 Internet reconnect
    │
    ├─ Debounce 2 seconds
    │
    └─▶ Immediate sync

 🪟 Window focus (user returns to app)
    │
    └─▶ Immediate sync

 💳 Sale completed (if online)
    │
    └─▶ Immediate sync attempt
```

---

## Database Schema (SQLite)

```
┌─────────────────────────────────────────────────────┐
│ products                                             │
├─────────────────────────────────────────────────────┤
│ id                TEXT PRIMARY KEY                   │
│ category_id       TEXT NOT NULL                      │
│ code              TEXT NOT NULL                      │
│ name              TEXT NOT NULL                      │
│ unit_price        REAL NOT NULL                      │
│ category_name     TEXT NOT NULL                      │
│ sort_order        REAL DEFAULT 0                     │
│ require_open_stock INTEGER DEFAULT 1                 │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ sales                                                │
├─────────────────────────────────────────────────────┤
│ id                TEXT PRIMARY KEY                   │
│ outlet_id         TEXT NOT NULL                      │
│ payment_method    TEXT NOT NULL                      │
│ total             REAL NOT NULL                      │
│ lines_json        TEXT NOT NULL  (JSON array)        │
│ created_at        INTEGER NOT NULL                   │
│ synced            INTEGER DEFAULT 0  (0/1)           │
│ sale_no           TEXT                               │
│ server_sale_id    TEXT                               │
│ status            TEXT                               │
│ rejection_reason  TEXT                               │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ pending                                              │
├─────────────────────────────────────────────────────┤
│ id                TEXT PRIMARY KEY                   │
│ type              TEXT NOT NULL                      │
│ payload_json      TEXT NOT NULL  (JSON object)       │
│ created_at        INTEGER NOT NULL                   │
│ retry_count       INTEGER DEFAULT 0                  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ dropped_mutations                                    │
├─────────────────────────────────────────────────────┤
│ id                TEXT PRIMARY KEY                   │
│ type              TEXT NOT NULL                      │
│ payload_json      TEXT NOT NULL                      │
│ created_at        INTEGER NOT NULL                   │
│ dropped_at        INTEGER NOT NULL                   │
│ retry_count       INTEGER NOT NULL                   │
└─────────────────────────────────────────────────────┘
```

---

## Network Diagnostics Tool

```
┌───────────────────────────────────────────────────┐
│ Network Diagnostics                                │
│ (Built into POS - Accessible via screen navigation)│
└───────────────────────────────────────────────────┘
       │
       ├─ Test 1: Browser Online Status
       │  └─▶ navigator.onLine
       │
       ├─ Test 2: Server Reachability
       │  └─▶ fetch(apiBaseUrl + '/health')
       │
       ├─ Test 3: API Health Check
       │  └─▶ axios.get('/health')
       │
       ├─ Test 4: Authentication
       │  └─▶ Check JWT token validity
       │
       ├─ Test 5: Database Connection
       │  └─▶ offlineDb.products.toArray()
       │
       ├─ Test 6: Products Cache
       │  └─▶ Count products & categories
       │
       └─ Test 7: Pending Queue
          └─▶ Count pending & dropped
       │
       ▼
┌───────────────────────────────────────────────────┐
│ Results Display                                    │
│ • ✅ All systems operational                       │
│ • ❌ Issues detected with details                 │
│ • Duration of each test                           │
│ • Troubleshooting tips                            │
└───────────────────────────────────────────────────┘
```

---

## Key Takeaways

1. **Offline-First**: POS works without internet, syncs when available
2. **Automatic**: No manual intervention needed for sync
3. **Resilient**: Retries failed syncs automatically
4. **Batch Efficient**: Groups sales for bulk upload
5. **Transparent**: User sees sync status clearly
6. **Auditable**: All failures logged in dropped_mutations
7. **Deployable**: Same installer for all 13 locations
8. **Maintainable**: Centralized backend, distributed POS

---

**This architecture ensures reliable operation across all remote locations with minimal maintenance overhead.**
