import { useEffect, useLayoutEffect, useState } from 'react'
import { X } from 'lucide-react'
import { fetchPosSales } from '../lib/api'
import { offlineDb } from '../lib/offline-db'
import { refreshPendingLocalPosSaleStatuses } from '../lib/pos-sale-status-refresh'
import { printReceiptHtml } from '../lib/print-receipt'
import { toast } from '../lib/toast-store'

export type TransactionHistoryModalProps = {
  open: boolean
  onClose: () => void
  outletId: string | null
  outletLabel: string
}

type SaleRow = {
  id: string
  saleNo?: string
  soldAt?: string
  paymentMethod?: string
  totalAmount?: number
  outletName?: string
  queued?: boolean
  status?: string
  rejectionReason?: string
  lines?: {
    productName?: string
    quantity?: number
    lineTotal?: number
  }[]
}

export function TransactionHistoryModal({
  open,
  onClose,
  outletId,
  outletLabel,
}: TransactionHistoryModalProps) {
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [sales, setSales] = useState<SaleRow[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useLayoutEffect(() => {
    if (open) setPage(1)
  }, [open, outletId])

  useEffect(() => {
    if (!open || !outletId) {
      setSales([])
      setErr('')
      return
    }
    void (async () => {
      setLoading(true)
      setErr('')
      try {
        if (navigator.onLine && outletId) {
          void refreshPendingLocalPosSaleStatuses({ outletId, limit: 20 })
        }
        const res = (await fetchPosSales({
          page,
          pageSize: 15,
          outletId,
        })) as {
          sales?: SaleRow[]
          Sales?: SaleRow[]
          totalPages?: number
          TotalPages?: number
        }
        const list = (res.sales ?? res.Sales ?? []) as SaleRow[]
        setSales(list)
        setTotalPages(Math.max(1, Number(res.totalPages ?? res.TotalPages) || 1))
      } catch (e) {
        if (!navigator.onLine) {
          const local = await offlineDb.listLocalSalesForOutlet(outletId, 50)
          setSales(
            local.map((s) => ({
              id: s.id,
              saleNo: s.saleNo,
              soldAt: new Date(s.createdAt).toISOString(),
              paymentMethod: s.paymentMethod,
              totalAmount: s.total,
              outletName: outletLabel,
              queued: !s.synced,
              status: s.status,
              rejectionReason: s.rejectionReason,
              lines: s.lines.map((l) => ({
                productName: l.name,
                quantity: l.qty,
                lineTotal: l.qty * l.unitPrice,
              })),
            })),
          )
          setTotalPages(1)
          setErr('')
        } else {
          setErr((e as Error).message)
          setSales([])
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [open, outletId, page])

  if (!open) return null

  async function reprint(s: SaleRow) {
    const lines = (s.lines ?? []).map((l) => {
      const qty = Number(l.quantity ?? 0)
      const amount = Number(l.lineTotal ?? 0)
      return {
        name: String(l.productName ?? ''),
        unitPrice: qty > 0 ? amount / qty : 0,
        qty,
        amount,
      }
    })
    const total = s.totalAmount ?? lines.reduce((a, b) => a + b.amount, 0)
    const ok = await printReceiptHtml({
      title: 'Receipt',
      outletLabel: s.outletName || outletLabel,
      lines,
      total,
      cash: total,
      change: 0,
      paymentMethod: s.paymentMethod,
      saleNo: s.saleNo ? `Sale ${s.saleNo}` : undefined,
    })
    if (!ok) toast('Unable to open print window.', 'error')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <h2 className="font-pos-title text-lg font-bold text-[var(--brand-primary)]">
            Recent sales
          </h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-[var(--muted-foreground)]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto px-4 py-3">
          {!outletId ? (
            <p className="text-sm text-amber-800">Select a showroom on the main screen first.</p>
          ) : loading ? (
            <p className="text-sm text-[var(--muted-foreground)]">Loading…</p>
          ) : err ? (
            <p className="text-sm text-red-600">{err}</p>
          ) : sales.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">No sales found for this outlet.</p>
          ) : (
            <ul className="space-y-2">
              {sales.map((s) => (
                <li
                  key={s.id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-3 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">{s.saleNo ?? s.id.slice(0, 8)}</span>
                    <span className="flex flex-wrap items-center gap-2 text-[var(--muted-foreground)]">
                      {s.queued ? (
                        <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-900">Queued</span>
                      ) : null}
                      {s.status && !s.queued && String(s.status).toLowerCase() !== 'approved' ? (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            String(s.status).toLowerCase() === 'pending'
                              ? 'bg-sky-200 text-sky-900'
                              : String(s.status).toLowerCase() === 'rejected'
                                ? 'bg-red-200 text-red-900'
                                : String(s.status).toLowerCase() === 'voided'
                                  ? 'bg-slate-200 text-slate-900'
                                  : 'bg-emerald-200 text-emerald-900'
                          }`}
                        >
                          {s.status}
                        </span>
                      ) : null}
                      <span>{s.soldAt ? new Date(s.soldAt).toLocaleString() : '—'}</span>
                    </span>
                  </div>
                  {s.rejectionReason ? (
                    <p className="mt-1 text-xs text-red-700">{s.rejectionReason}</p>
                  ) : null}
                  <div className="mt-1 flex flex-wrap justify-between gap-2 text-xs">
                    <span>{s.paymentMethod ?? '—'}</span>
                    <span className="font-bold">Rs {Number(s.totalAmount ?? 0).toFixed(2)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => reprint(s)}
                    className="mt-2 text-xs font-semibold text-[var(--brand-primary)] hover:underline"
                  >
                    Print receipt
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {outletId && totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-2 text-sm">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg px-3 py-1 font-medium text-[var(--brand-primary)] disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-[var(--muted-foreground)]">
              Page {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg px-3 py-1 font-medium text-[var(--brand-primary)] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
