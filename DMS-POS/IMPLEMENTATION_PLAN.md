# DMS-POS — Implementation Plan

> Generated: 2026-05-05 | Branch: phase-6
> Status key: ✅ Done · 🔧 In progress · 🔴 Bug / broken · 📋 Planned · ❌ Not started

---

## 1. What Is Already Done

| Screen / Feature | Status | Notes |
|---|---|---|
| LoginPage | ✅ | Red/white brand, email+password only, network error detection |
| PosMainPage — Bill panel | ✅ | Line items, qty numpad, clear bill, PAY button |
| PosMainPage — Catalog panel | ✅ | Search, category pills, product tiles, favourites, cart badge |
| PosMainPage — Header | ✅ | Zoom, online badge, showroom selector, user menu |
| PosMainPage — Operations drawer | ✅ | Slides from left, links to all 5 sub-screens, Technical config section |
| Payment modal (Cash / Card) | ✅ | |
| Transaction History modal | ✅ | Paginated, reprint per sale |
| QtyNumpad modal | ✅ | Touch-friendly, 1–999 range |
| CustomerViewPage | ✅ | Full-screen dark display, live cart, gold total |
| StockBfPage | ✅ | Search dropdown, qty, submit & print, offline queue |
| PendingTransfersPage | ✅ | List + detail, Received / Not Receive buttons |
| NewTransferPage | ✅ | Online-only, search dropdown, submit for approval |
| DeliveryReturnPage | ✅ | Online-only, delivery note no., two dates, submit |
| CashSubmissionPage | ✅ | Multi-outlet, cashier picker, 4 payment methods |
| Offline catalog cache (Dexie) | ✅ | Products + categories in IndexedDB |
| Offline POS sales queue | ✅ | Enqueued when offline, synced on reconnect |
| Offline Stock BF queue | ✅ | Enqueued when offline |
| Sync queue (all 5 types) | ✅ | FIFO, max 5 retries, processes on reconnect |
| Token refresh (401 interceptor) | ✅ | Silent refresh, logout on failure |
| Electron main / preload | ✅ | IPC: shutdown, fullscreen, version |
| NSIS installer (Windows) | ✅ | `release/Don & Sons POS Setup 2.0.0.exe` |
| Brand icon (`public/icon.ico`) | ✅ | Red D&S logo, 4 sizes |

---

## 2. Bugs Fixed in This Session

| # | File | Bug | Fix |
|---|---|---|---|
| 1 | `package.json` | Missing `author` field caused electron-builder warning on every build | Added `"author": "Cipher Labz <info@cipherlabz.com>"` |
| 2 | `sync-queue.ts` | `transfer` case tried to update `offlineDb.transfers` but NewTransferPage never saves a record there — silent no-op dead code | Removed the dead `offlineDb.transfers.update()` call |
| 3 | `sync-queue.ts` | `stock-bf-bulk` case tried to update `offlineDb.stockBf` but StockBfPage never saves a record there — silent no-op dead code | Removed the dead `offlineDb.stockBf.update()` call |

---

## 3. Remaining Bugs (Fix Next)

### 3.1 🔴 `StockBfPage` — no local history record saved offline
**Problem:** When submitting offline, StockBfPage enqueues a pending mutation but never writes a record to `offlineDb.stockBf`. If the user closes the app before sync, there is no local history of what was submitted.

**Fix:** In `submit()`, after `enqueueMutation(...)`, also call:
```ts
await offlineDb.stockBf.put({
  id: mutationId,
  outletId,
  processDate: d.toISOString().slice(0, 10),
  lines: rows.map((r) => ({ productId: r.productId, code: r.code, name: r.name, qty: r.qty })),
  createdAt: Date.now(),
  synced: false,
})
```
Then in `sync-queue.ts` `stock-bf-bulk` case, restore the `offlineDb.stockBf.update(row.id, { synced: true })` after a successful sync.

**Files:** [StockBfPage.tsx](src/pages/StockBfPage.tsx) · [sync-queue.ts](src/lib/sync-queue.ts)

---

### 3.2 🔴 `NewTransferPage` — no local history record saved
**Problem:** Transfers are online-only so no queuing, but there's no local audit trail either. If the API call fails after `createTransfer` succeeds but before `submitTransfer`, the transfer exists on the server in Draft state but the user sees an error and can't re-submit from the POS.

**Fix:** After `createTransfer` succeeds, store the server-returned `id` in a small state variable. If `submitTransfer` fails, show a retry button that calls `submitTransfer(savedId)` instead of starting over.

**Files:** [NewTransferPage.tsx](src/pages/NewTransferPage.tsx)

---

### 3.3 🔴 `use-online-status.ts` — no debounce on sync trigger
**Problem:** Rapid network flip (wifi reconnecting) fires `processPendingQueue` multiple times simultaneously, potentially sending duplicate API calls for the same pending mutation.

**Fix:** Add a 2-second debounce before calling `processPendingQueue`.

**Files:** [use-online-status.ts](src/lib/use-online-status.ts)

---

### 3.4 🔴 Dropped mutations are silent
**Problem:** When a pending mutation exceeds `MAX_RETRIES = 5`, it is silently deleted. The cashier has no idea a sale or stock entry was lost.

**Fix:** Before deleting, write a toast with level `'error'` and optionally write the dropped mutation to a `droppedMutations` IndexedDB table for review.

**Files:** [sync-queue.ts](src/lib/sync-queue.ts)

---

### 3.5 🔴 `CashSubmissionPage` — decimal input shows `null` on bad values
**Problem:** If a cashier types letters or clears a field, the parsed value is `null`. The submit payload sends `null` to the backend which may reject it with a confusing 400 error.

**Fix:** Replace `null` with `0` for numeric balance fields before submitting, and show a red border on invalid inputs.

**Files:** [CashSubmissionPage.tsx](src/pages/CashSubmissionPage.tsx)

---

## 4. Planned Features (Not Yet Built)

### 4.1 📋 Permission gates on operations
**Priority:** High  
**Why:** The backend uses `[HasPermission("pos:sale:create")]` etc. If a user doesn't have a permission, they get a 403 from the API — but the POS shows the feature anyway and only fails on submit, which is a poor UX.

**Plan:**
- The `hasPermission(code)` helper already exists in `useAuthStore`.
- Add permission checks to:
  - Operations drawer buttons (hide if no permission)
  - PAY button (`pos:sale:create`)
  - Submit on StockBfPage (`operation:stock-bf:create`)
  - Submit on NewTransferPage (`operation:transfer:create`)
  - Submit on DeliveryReturnPage (`operation:delivery-return:create`)
  - Submit on CashSubmissionPage (`cashier-balance:edit`)
  - Received button on PendingTransfersPage (`operation:transfer:update`)

**Files:** [PosMainPage.tsx](src/pages/PosMainPage.tsx) and all sub-pages · [auth-store.ts](src/lib/auth-store.ts)

---

### 4.2 📋 Sync status indicator (pending badge in header)
**Priority:** High  
**Why:** Cashiers don't know how many offline sales are waiting to sync. If the sync fails repeatedly, they have no visibility.

**Plan:**
- Add a computed `pendingCount` to the header using `offlineDb.pending.count()`.
- Show a yellow dot badge on the online/offline indicator when `pendingCount > 0`.
- Clicking it opens a small popover listing pending mutation types and retry counts.

**Files:** [PosMainPage.tsx](src/pages/PosMainPage.tsx) · [OnlineBadge.tsx](src/components/OnlineBadge.tsx)

---

### 4.3 📋 Receipt customisation — outlet name + logo in print
**Priority:** Medium  
**Why:** The printed receipt shows a hardcoded "Don & Sons" title regardless of outlet. Multi-outlet businesses may want outlet-specific footers or phone numbers.

**Plan:**
- Extend `printReceiptHtml` options to accept `footerLines?: string[]`.
- Pass outlet phone/address from settings (currently not stored — add to settings-store if needed).

**Files:** [print-receipt.ts](src/lib/print-receipt.ts) · [settings-store.ts](src/lib/settings-store.ts)

---

### 4.4 📋 Catalog "last synced" banner in StockBfPage / sub-pages
**Priority:** Medium  
**Why:** Sub-pages (StockBf, Transfers) load products from IndexedDB without syncing. If the cashier's cache is a week old, they may submit stock BF with stale product IDs.

**Plan:**
- Show a banner on StockBfPage / NewTransferPage / DeliveryReturnPage if `cacheUpdatedAt` is older than 24 hours.
- Include a "Refresh" button that calls `syncCatalogFromServer()`.

**Files:** [StockBfPage.tsx](src/pages/StockBfPage.tsx) · [NewTransferPage.tsx](src/pages/NewTransferPage.tsx) · [DeliveryReturnPage.tsx](src/pages/DeliveryReturnPage.tsx)

---

### 4.5 📋 "All categories" pill auto-scroll to active category
**Priority:** Low  
**Why:** When the user clicks a category pill, if it's outside the current visible window, it scrolls past without visual feedback. `catScroll` is set manually — the active category could auto-scroll into view.

**Plan:**
- On `setCategoryId`, calculate the index of the selected category in `catRow` and set `catScroll` to the nearest page start that includes it.

**Files:** [PosMainPage.tsx](src/pages/PosMainPage.tsx)

---

### 4.6 📋 Keyboard shortcuts for POS main page
**Priority:** Low  
**Why:** Cashiers processing high volumes benefit from keyboard entry. The numpad currently only responds to mouse.

**Shortcuts to add:**
| Key | Action |
|---|---|
| `/` or `F3` | Focus catalog search |
| `Escape` | Close numpad / payment modal |
| `Enter` (on numpad) | Confirm quantity |
| `F5` | Refresh catalogue |
| `F10` | Open payment modal |

**Files:** [PosMainPage.tsx](src/pages/PosMainPage.tsx) · [QtyNumpad.tsx](src/components/QtyNumpad.tsx) · [PaymentModal.tsx](src/components/PaymentModal.tsx)

---

### 4.7 📋 Auto-print receipt after payment
**Priority:** Low  
**Why:** Currently the cashier must press Print after paying. Most POS terminals auto-print on successful payment.

**Plan:**
- Add a `settings-store` boolean `autoPrint` (default `false`).
- In `handlePay()`, after clearing the cart and setting `lastReceipt`, call `printReceiptHtml()` automatically if `autoPrint` is enabled.
- Expose the toggle in the Operations drawer Technical section.

**Files:** [PosMainPage.tsx](src/pages/PosMainPage.tsx) · [settings-store.ts](src/lib/settings-store.ts)

---

### 4.8 📋 Offline sales history page (local only)
**Priority:** Low  
**Why:** The Transaction History modal (`fetchPosSales`) only works online. When offline, the modal shows an error. The `offlineDb.sales` table stores all local sales (synced and unsynced) — these could be shown as a fallback.

**Plan:**
- In `TransactionHistoryModal`, when `fetchPosSales` fails offline, fall back to `offlineDb.sales.orderBy('createdAt').reverse().limit(50).toArray()`.
- Mark unsynced rows with a "Queued" badge.

**Files:** [TransactionHistoryModal.tsx](src/components/TransactionHistoryModal.tsx)

---

### 4.9 📋 Stock BF history view (today's submissions)
**Priority:** Low  
**Why:** If a cashier accidentally submits opening stock twice, there's no way to see what was already submitted for today.

**Plan:**
- Add a "History" tab in StockBfPage that calls `GET /api/stock-bf?outletId=...&fromDate=today&toDate=today` and shows a read-only table.

**Files:** [StockBfPage.tsx](src/pages/StockBfPage.tsx) · [api.ts](src/lib/api.ts)

---

### 4.10 📋 Day Lock awareness
**Priority:** Medium  
**Why:** The backend has `[DayLockGuard]` on StockBF, Transfers, DeliveryReturns, and CashierBalance — if the day is locked, the API returns 409/400. The POS currently shows a generic error message.

**Plan:**
- Detect "day is locked" in the error response from these endpoints.
- Show a specific banner: "Today has been locked by the administrator. Changes are no longer allowed."

**Files:** [StockBfPage.tsx](src/pages/StockBfPage.tsx) · [NewTransferPage.tsx](src/pages/NewTransferPage.tsx) · [DeliveryReturnPage.tsx](src/pages/DeliveryReturnPage.tsx) · [CashSubmissionPage.tsx](src/pages/CashSubmissionPage.tsx)

---

## 5. Out of Scope (Not Planned for POS)

These features exist in DMS-Frontend but are intentionally excluded from the POS terminal:

- Approval workflows (approve/reject stock-bf, transfers, delivery-returns) — admin-only, done from DMS-Frontend
- Discount / price modifier UI — not in current business rules
- Analytics / reports — backend has dashboards; POS is not a reporting tool
- Barcode scanner integration — hardware-specific, deferred
- Dark mode — only Customer View is dark by design
- Multi-language support — English only for now
- User management / role assignments

---

## 6. Build & Deployment Notes

### Dev
```powershell
cd DMS-POS
npm run dev
```

### Production build (NSIS installer)
```powershell
# Requires: Developer Mode ON or run as Administrator (for winCodeSign symlinks)
npm run build
# Output: release\Don & Sons POS Setup 2.0.0.exe
```

### Unpacked only (no installer, for testing)
```powershell
npm run build:dir
# Output: release\win-unpacked\Don & Sons POS.exe
```

### Known build requirements
- Windows Developer Mode must be enabled **or** terminal run as Administrator — electron-builder downloads `winCodeSign-2.6.0.7z` which contains macOS symlinks that require symlink privileges to extract.
- `public/icon.ico` must exist (generated as a red D&S logo, 4 sizes: 256/48/32/16px).

---

## 7. API Permission Map

| POS action | Required permission |
|---|---|
| POST /api/pos-sales | `pos:sale:create` |
| GET /api/pos-sales | `pos:sale:view` |
| POST /api/stock-bf/bulk | `operation:stock-bf:create` |
| GET /api/transfers | `operation:transfer:view` |
| POST /api/transfers | `operation:transfer:create` |
| POST /api/transfers/{id}/submit | `operation:transfer:update` |
| POST /api/transfers/{id}/complete-receipt | `operation:transfer:update` |
| POST /api/delivery-returns | `operation:delivery-return:create` |
| POST /api/delivery-returns/{id}/submit | `operation:delivery-return:update` |
| GET /api/cashier-balance/context | `cashier-balance:view` |
| POST /api/cashier-balance/submit | `cashier-balance:edit` |

---

*This document was generated by comparing the live codebase against backend controllers, and reflects the actual state as of 2026-05-05.*
