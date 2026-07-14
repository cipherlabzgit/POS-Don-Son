import { fetchPosSaleById } from './api'
import { listLocalSalesPendingStatusRefresh, offlineDb } from './offline-db'
import { localLinesFromPosSaleApi, parsePosSaleDetailPayload } from './pos-sale-response'
import { toast } from './toast-store'

let refreshRunning = false

/** Pull approval/rejection (and line labels) from the server for local rows still marked Pending. */
export async function refreshPendingLocalPosSaleStatuses(opts?: {
  outletId?: string | null
  limit?: number
}): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return
  if (refreshRunning) return
  refreshRunning = true
  try {
    const rows = await listLocalSalesPendingStatusRefresh(opts?.limit ?? 25, opts?.outletId)
    for (const sale of rows) {
      const sid = sale.serverSaleId
      if (!sid) continue
      try {
        const raw = await fetchPosSaleById(sid)
        const detail = parsePosSaleDetailPayload(raw)
        const prevPending = !sale.status || sale.status.trim().toLowerCase() === 'pending'
        const nextRejected = detail.status?.trim().toLowerCase() === 'rejected'
        if (prevPending && nextRejected) {
          const msg = detail.rejectionReason?.trim()
          toast(
            msg
              ? `Sale rejected: ${msg.slice(0, 140)}${msg.length > 140 ? '…' : ''}`
              : `Sale ${detail.saleNo ?? sale.saleNo ?? ''} was rejected.`,
            'info',
          )
        }
        const linesPatch =
          detail.lines?.length && detail.lines.some((l) => l.productId != null && String(l.productId))
            ? localLinesFromPosSaleApi(detail.lines)
            : undefined
        await offlineDb.sales.update(sale.id, {
          status: detail.status,
          rejectionReason: detail.rejectionReason,
          ...(detail.saleNo ? { saleNo: detail.saleNo } : {}),
          ...(linesPatch ? { lines: linesPatch } : {}),
        })
      } catch {
        /* missing sale or network — skip */
      }
    }
  } finally {
    refreshRunning = false
  }
}
