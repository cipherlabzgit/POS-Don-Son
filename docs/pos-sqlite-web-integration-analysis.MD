# POS SQLite ↔ Web ↔ Backend — Integration Analysis

**Scope:** `DMS-POS` (Electron + SQLite/Dexie offline layer), `DMS-Backend` (`/api/pos-sales` and related), and `DMS-Frontend` (operations UI).  
**Date:** 2026-05-06  

---

## Summary

**Core POS sale flow is integrated end-to-end:** the desktop app posts `CreatePosSaleDto`-compatible payloads to `POST /api/pos-sales`, uses `clientMutationId` for idempotent replay, queues failed/offline sales in local storage, and the web app can list detail and drive **approve / reject** against the same records via `OperationApprovalService` and dedicated POS APIs.

**It is not “perfect”** in the sense of full parity between offline UX, web UI filters, inventory side-effects, and broader POS mutations (transfers, delivery returns, cashier balance). The sections below separate **what already aligns** from **missing or weakly aligned** behavior.

---

## What Is Already Well Integrated

| Area | Behavior |
|------|----------|
| **Sale creation** | POS builds `{ outletId, paymentMethod, clientMutationId, lines[] }` matching `CreatePosSaleDto`; backend recomputes line/header totals and persists `Pending` status for approval workflow. |
| **Idempotency** | `PosSaleService.CreateAsync` returns an existing sale when the same non-empty `ClientMutationId` + `OutletId` is seen again; POS uses the mutation id as the local `sales` row key and as the pending-queue row id. |
| **JSON contract** | Backend uses camelCase (`Program.cs`); POS and Frontend clients expect camelCase — consistent for POS sales. |
| **Offline queue** | `sync-queue.ts` processes `pos-sale` mutations with `postPosSale`; on success updates local `sales` (`synced`, `saleNo`). |
| **User feedback** | POS detects `status === 'pending'` after online create and informs the cashier that approval happens in Operations. |
| **Transaction history** | When online, POS loads `GET /api/pos-sales` with paging; when offline, falls back to `offlineDb.listLocalSalesForOutlet`. |
| **Web approvals** | `/operation/approvals` uses `posSalesApi.approve` / `reject` aligned with `POST .../approve` and `POST .../reject` and permissions `pos:sale:approve` / `pos:sale:reject`. |
| **Permissions** | Seeded keys (`pos:sale:view`, `create`, `approve`, `reject`) match controller attributes and frontend permission map. |
| **Catalog** | POS pulls products/categories from the API into local storage (`catalog-sync.ts`); read-only sync path is clear. |
| **Stock BF** | Offline path can queue `stock-bf-bulk` and sync via `POST /api/stock-bf/bulk` (separate from POS sales but part of the same offline stack). |

---

## Gaps, Misalignments, and Missing Features

### 1. Web “POS Sales” list filters vs backend (functional bug)

- **Frontend** (`src/lib/api/pos-sales.ts`) sends `startDate`, `endDate`, and `search` as query parameters.
- **Backend** (`PosSalesController.GetAll`) only binds `page`, `pageSize`, `outletId`.
- **Effect:** Date range and sale-number search in the web UI **do not filter server data**; users may believe they are filtering when the API returns unfiltered pages.

**Recommendation:** Extend `GetAllAsync` / controller with optional date range and sale-no search, or remove unsupported filters from the web client to avoid confusion.

---

### 2. Operation Approvals: reject reason unused

- API accepts `RejectPosSaleDto` with optional `Reason`.
- Approvals UI calls `posSalesApi.reject(id)` without prompting for a reason.
- **Effect:** Rejection audit on the server often has empty `rejectionReason` despite backend support.

**Recommendation:** Add optional reason capture (modal) before reject.

---

### 3. Local SQLite/Dexie vs server identity and lifecycle

- Local `sales.id` is the **client mutation UUID**, not the server `PosSale.Id` (GUID).
- After sync, local records store `saleNo` and `synced` but **not** server id, **not** approval status, and **not** rejection reason.
- **Effect:** Local history cannot correlate easily with web URLs keyed by server id; reprints and messaging cannot show “approved/rejected” without another API round-trip. If a sale is **rejected** on the web, the cashier’s local record still looks like a completed synced sale with a sale number.

**Recommendation:** Persist `serverSaleId`, `status`, and optionally last-known approval fields after create/sync; optionally refresh from `GET /api/pos-sales/{id}` when online.

---

### 4. Queue processor vs rich create response

- On successful queued sync, code only applies `saleNo` from the response (`sync-queue.ts`).
- Online checkout in `PosMainPage` uses full detail for receipt line labels; queued sync path may miss enrichments if API returns more than `saleNo`.

**Recommendation:** Map the same detail shape as online success (or refetch by id) when processing `pos-sale` mutations.

---

### 5. Idempotency: DB index vs service logic

- **Service:** duplicate detection uses `ClientMutationId` **and** `OutletId`.
- **Database:** unique filtered index exists on **`client_mutation_id` alone** (see migrations / `ApplicationDbContext`).
- **Effect:** Theoretically, the same mutation id reused across outlets could pass the service check once but fail on insert — unlikely if UUIDs are global, but the constraints are not identical.

**Recommendation:** Align DB uniqueness with `(outlet_id, client_mutation_id)` if mutation ids are only unique per device, or document that mutation ids must be globally unique.

---

### 6. Approval does not drive inventory or accounting

- `ApproveAsync` / `RejectAsync` only update status and audit columns on `PosSale`.
- **Effect:** There is **no visible stock decrement** (or GL posting) tied to approval in `PosSaleService`. If the business expectation is “approval posts the sale to inventory,” that integration is **missing**.

**Recommendation:** Define whether approval should trigger stock movements; if yes, implement in service or domain events.

---

### 7. POS domain model vs “full” retail POS

Backend and POS agree on a **minimal** contract (single `paymentMethod` string, line-level pricing, no tax/discount/split tender/customer/receipt metadata). Typical gaps:

- No multi-tender / change / cash drawer fields.
- No explicit discounts or headers totals independent of line math.
- No customer linkage.
- `paymentMethod` length capped at 20 on entity — ensure POS labels stay within that.

These are **product scope** gaps, not wiring bugs, but they matter for “perfect” integration with real-world POS expectations.

---

### 8. Other offline mutations: implemented in queue, not in product flows

`sync-queue.ts` supports `transfer`, `delivery-return`, and `cashier-balance`, but **current pages do not enqueue** these — they behave **online-only** with blocking UX.

SQLite schema includes a `transfers` table in the main process, but **IPC/store APIs do not expose transfers** to the renderer (`local-db-types` notes future offline transfers).

**Recommendation:** Either remove dead queue branches or wire UI + SQLite APIs for true offline parity.

---

### 9. Stock BF: asymmetric local history

- Offline submission writes local `stockBf` rows and marks synced after queue success.
- **Online** failure path does not enqueue; online success may not mirror the same local audit row as offline.

**Recommendation:** Unify “always write local audit, then sync” or document intentional asymmetry.

---

### 10. Queue robustness

- Unknown `PendingMutationType` **deletes** the pending row without moving to `droppedMutations` (silent loss).
- `catch` block increments retry but does not classify 401/403 vs 5xx (permissions vs transient).
- Multiple callers can invoke `processPendingQueue` without an explicit mutex (offline/online flapping is mitigated partly by debounce, not fully).

**Recommendation:** Move unknown types to `droppedMutations` with logging; handle auth errors distinctly; optional single-flight guard.

---

### 11. Web POS Sales page vs approvals (by design, but notable)

- The dedicated POS sales page is **view-oriented**; approve/reject live under **Operation Approvals**.
- **Effect:** Operators must use the approvals hub for actions — acceptable if documented; confusing if they expect actions on the POS sales grid.

---

## Quick Reference — API ↔ Clients

| Capability | Backend | DMS-POS | DMS-Frontend |
|------------|---------|---------|--------------|
| List sales | `GET /api/pos-sales` | Yes (`fetchPosSales`) | Yes (`posSalesApi.getAll`) |
| Sale detail | `GET /api/pos-sales/{id}` | Indirect (list items include lines) | Yes |
| Create sale | `POST /api/pos-sales` | Yes | No UI |
| Approve | `POST .../approve` | No | Yes (approvals) |
| Reject | `POST .../reject` | No | Yes (no reason UI) |
| List filters | outlet + paging | outlet + paging | Sends extra params **not implemented server-side** |

---

## Conclusion

The **SQLite-backed POS app and the web system share a coherent API and permission model for recording and approving sales**, with solid **offline enqueue + replay** for **POS sales** and **stock BF bulk**. Remaining work is mostly **product completeness** (inventory on approve, richer sale model), **data alignment** (server id and status in local DB, filter parity on list APIs), and **hardening** (queue edge cases, reject reasons, optional offline for other mutation types).
