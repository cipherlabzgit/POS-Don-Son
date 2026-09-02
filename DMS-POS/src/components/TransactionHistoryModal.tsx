import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { formatSubmitError } from '../lib/api-errors'
import { fetchPosSales, requestPosSaleCancel } from '../lib/api'
import { useAuthStore } from '../lib/auth-store'
import { offlineDb } from '../lib/offline-db'
import { refreshPendingLocalPosSaleStatuses } from '../lib/pos-sale-status-refresh'
import { toast } from '../lib/toast-store'
import { SearchKeyboard } from './SearchKeyboard'

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
  cancelRequested?: boolean
  cancellationReason?: string
  lines?: {
    productName?: string
    quantity?: number
    lineTotal?: number
  }[]
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatBillDateTime(iso?: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const day = String(d.getDate()).padStart(2, '0')
  const mon = MONTHS[d.getMonth()]
  const year = d.getFullYear()
  let hours = d.getHours()
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12
  return `${day}/${mon}/${year} - ${String(hours).padStart(2, '0')}:${minutes}${ampm}`
}

function normalizeSale(raw: SaleRow & { CancelRequested?: boolean; CancellationReason?: string }): SaleRow {
  return {
    ...raw,
    cancelRequested: Boolean(raw.cancelRequested ?? raw.CancelRequested),
    cancellationReason: raw.cancellationReason ?? raw.CancellationReason,
  }
}

function canRequestCancel(sale: SaleRow | null) {
  if (!sale || sale.queued) return false
  if (sale.cancelRequested) return false
  const status = String(sale.status ?? 'Approved').toLowerCase()
  return status === 'approved'
}

export function TransactionHistoryModal({
  open,
  onClose,
  outletId,
  outletLabel,
}: TransactionHistoryModalProps) {
  const user = useAuthStore((s) => s.user)
  const cashier = user ? `${user.firstName} ${user.lastName}`.trim() || user.email : '—'

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState('')
  const [sales, setSales] = useState<SaleRow[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [kbOpen, setKbOpen] = useState(false)

  useLayoutEffect(() => {
    if (open) {
      setPage(1)
      setSelectedId(null)
      setReason('')
      setKbOpen(false)
    }
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
        const list = ((res.sales ?? res.Sales ?? []) as SaleRow[]).map(normalizeSale)
        setSales(list)
        setTotalPages(Math.max(1, Number(res.totalPages ?? res.TotalPages) || 1))
        setSelectedId((prev) => {
          if (prev && list.some((s) => s.id === prev)) return prev
          return list[0]?.id ?? null
        })
      } catch (e) {
        if (!navigator.onLine) {
          const local = await offlineDb.listLocalSalesForOutlet(outletId, 50)
          const list = local.map((s) => ({
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
          }))
          setSales(list)
          setTotalPages(1)
          setErr('')
          setSelectedId(list[0]?.id ?? null)
        } else {
          setErr((e as Error).message)
          setSales([])
          setSelectedId(null)
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [open, outletId, page, outletLabel])

  const selected = useMemo(
    () => sales.find((s) => s.id === selectedId) ?? null,
    [sales, selectedId],
  )

  const billNo = selected?.saleNo ?? (selected ? selected.id.slice(0, 8) : '')
  const reasonTrimmed = reason.trim()
  const requestEnabled = canRequestCancel(selected) && reasonTrimmed.length > 0 && !submitting && navigator.onLine

  async function submitCancelRequest() {
    if (!selected || !requestEnabled) {
      if (!reasonTrimmed) toast('Cancellation reason is required.', 'error')
      return
    }
    setSubmitting(true)
    try {
      await requestPosSaleCancel(selected.id, reasonTrimmed)
      toast(`Cancel request sent for bill ${billNo}.`, 'success')
      setReason('')
      setSales((prev) =>
        prev.map((s) =>
          s.id === selected.id
            ? { ...s, cancelRequested: true, cancellationReason: reasonTrimmed }
            : s,
        ),
      )
    } catch (e) {
      toast(formatSubmitError(e), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col rounded-t-2xl border border-[var(--border)] bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
          <h2 className="font-pos-title text-xl font-bold text-neutral-900">Sales History</h2>
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium text-neutral-700">Cashier: {cashier}</p>
            <button type="button" onClick={onClose} className="rounded-lg p-2 text-[var(--muted-foreground)]">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-5 py-3">
          {!outletId ? (
            <p className="text-sm text-amber-800">Select a showroom on the main screen first.</p>
          ) : loading ? (
            <p className="text-sm text-[var(--muted-foreground)]">Loading…</p>
          ) : err ? (
            <p className="text-sm text-red-600">{err}</p>
          ) : sales.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">No sales found for this outlet.</p>
          ) : (
            <>
              <div className="overflow-hidden rounded-lg border border-neutral-300">
                <div className="max-h-64 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-neutral-100 text-left text-xs font-bold uppercase tracking-wide text-neutral-600">
                      <tr>
                        <th className="px-3 py-2">Bill No</th>
                        <th className="px-3 py-2">Date &amp; Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.map((s) => {
                        const active = s.id === selectedId
                        const status = String(s.status ?? '').toLowerCase()
                        return (
                          <tr
                            key={s.id}
                            onClick={() => {
                              setSelectedId(s.id)
                              setReason('')
                            }}
                            className={`cursor-pointer border-t border-neutral-200 ${
                              active ? 'bg-sky-100' : 'bg-white hover:bg-neutral-50'
                            }`}
                          >
                            <td className="px-3 py-2 font-semibold text-neutral-900">
                              <span className="mr-2">{s.saleNo ?? s.id.slice(0, 8)}</span>
                              {s.queued ? (
                                <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-900">
                                  Queued
                                </span>
                              ) : s.cancelRequested ? (
                                <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-900">
                                  Cancel pending
                                </span>
                              ) : status && status !== 'approved' ? (
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                    status === 'pending'
                                      ? 'bg-sky-200 text-sky-900'
                                      : status === 'rejected'
                                        ? 'bg-red-200 text-red-900'
                                        : status === 'voided'
                                          ? 'bg-slate-200 text-slate-900'
                                          : 'bg-emerald-200 text-emerald-900'
                                  }`}
                                >
                                  {s.status}
                                </span>
                              ) : null}
                            </td>
                            <td className="px-3 py-2 text-neutral-700">{formatBillDateTime(s.soldAt)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {selected ? (
                <p className="mt-3 text-sm font-medium text-neutral-800">
                  Bill {billNo} is active.
                  {selected.cancelRequested ? ' Cancellation request is pending approval.' : null}
                  {String(selected.status ?? '').toLowerCase() === 'voided' ? ' This bill is already cancelled.' : null}
                </p>
              ) : null}

              <button
                type="button"
                disabled={!canRequestCancel(selected)}
                onPointerDown={(e) => {
                  e.preventDefault()
                  if (canRequestCancel(selected)) setKbOpen(true)
                }}
                className="mt-3 min-h-[6.5rem] w-full rounded-lg border border-neutral-300 bg-white px-3 py-3 text-left text-sm text-neutral-900 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400"
              >
                {reason || (
                  <span className="text-neutral-400">Cancellation reason (required)</span>
                )}
              </button>
            </>
          )}
        </div>

        {outletId && totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-[var(--border)] px-5 py-2 text-sm">
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

        <div className="grid grid-cols-2 gap-3 border-t border-[var(--border)] px-5 py-4">
          <button
            type="button"
            disabled={!requestEnabled}
            onClick={() => void submitCancelRequest()}
            className="pos-tap rounded-xl bg-[#22c55e] px-4 py-3 text-base font-bold text-white shadow hover:bg-[#16a34a] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? 'Sending…' : 'Request Cancel'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="pos-tap rounded-xl bg-[#22c55e] px-4 py-3 text-base font-bold text-white shadow hover:bg-[#16a34a]"
          >
            Close
          </button>
        </div>
      </div>

      {kbOpen ? (
        <SearchKeyboard
          value={reason}
          onChange={setReason}
          onClose={() => setKbOpen(false)}
          onEnter={() => setKbOpen(false)}
          label="Cancellation reason"
          placeholder="Cancellation reason (required)"
        />
      ) : null}
    </div>
  )
}
