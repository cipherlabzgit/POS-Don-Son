import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Printer, X } from 'lucide-react'
import { PosSubPageLayout } from '../components/PosSubPageLayout'
import { CatalogStaleBanner } from '../components/CatalogStaleBanner'
import { useAuthStore } from '../lib/auth-store'
import { useSettingsStore } from '../lib/settings-store'
import { loadProductsIntoDb } from '../lib/catalog-sync'
import { offlineDb } from '../lib/offline-db'
import type { ProductRow } from '../lib/types'
import { fetchStockBfRecords, postStockBfBulk } from '../lib/api'
import { enqueueMutation } from '../lib/sync-queue'
import { useOnlineStatus } from '../lib/use-online-status'
import { printReceiptHtml } from '../lib/print-receipt'
import { toast } from '../lib/toast-store'
import { formatSubmitError, isConflictStatus, isUnreachableNetworkError, isAlreadyRecordedError } from '../lib/api-errors'
import { todayCalendarISO } from '../lib/calendar-date'
import { SearchKeyboard } from '../components/SearchKeyboard'

type Props = { onBack: () => void }
type BfRow = { productId: string; code: string; name: string; qty: number }

type HistRow = {
  id: string
  bfNo: string
  productName: string
  quantity: number
  status: string
}

function isBlockingStockBfStatus(status: string) {
  const s = status.toLowerCase()
  return s !== 'rejected' && s !== 'cancelled'
}

export function StockBfPage({ onBack }: Props) {
  const user         = useAuthStore((s) => s.user)
  const token        = useAuthStore((s) => s.accessToken)
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const online       = useOnlineStatus(Boolean(token))
  const outletId     = useSettingsStore((s) => s.outletId)
  const outletLabel  = useSettingsStore((s) => s.outletLabel)

  const canCreate = hasPermission('operation:stock-bf:create')
  const canView   = hasPermission('operation:stock-bf:view')

  const [tab, setTab] = useState<'enter' | 'history'>(() => (canCreate ? 'enter' : 'history'))
  const [products, setProducts] = useState<ProductRow[]>([])
  const [search, setSearch]     = useState('')
  const [showDrop, setShowDrop] = useState(false)
  const [qty, setQty]           = useState('1')
  const [rows, setRows]         = useState<BfRow[]>([])
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const [formLocked, setFormLocked] = useState(false)
  const [histRows, setHistRows] = useState<HistRow[]>([])
  const [histLoading, setHistLoading] = useState(false)
  const [histNonce, setHistNonce] = useState(0)
  const searchRef = useRef<HTMLInputElement>(null)
  const qtyRef = useRef<HTMLInputElement>(null)
  const [kbField, setKbField] = useState<'search' | null>(null)
  const [pendingProduct, setPendingProduct] = useState<ProductRow | null>(null)

  useEffect(() => {
    if (!formLocked) return
    setKbField(null)
    setShowDrop(false)
  }, [formLocked])

  useEffect(() => {
    void (async () => {
      try {
        const list = await loadProductsIntoDb()
        setProducts(list)
        if (list.length === 0) {
          toast(
            online
              ? 'No products in local cache. On the main POS screen, wait for the catalogue to load or use refresh.'
              : 'No products offline. Connect and open the main POS to download the catalogue.',
            online ? 'info' : 'error',
          )
        }
      } catch (e) {
        console.error('[StockBf] product catalogue', e)
        toast((e as Error).message, 'error')
      }
    })()
  }, [online])

  useEffect(() => {
    if (!outletId || (!canView && !canCreate)) return
    const today = todayCalendarISO()
    if (tab === 'history') setHistLoading(true)
    void (async () => {
      try {
        if (!online || !canView) return
        const res = (await fetchStockBfRecords({
          outletId,
          fromDate: today,
          toDate: today,
          page: 1,
          pageSize: 200,
        })) as Record<string, unknown>
        const raw = (res.stockBFs ?? res.StockBFs ?? []) as Record<string, unknown>[]
        const mapped = raw.map((r) => ({
          id: String(r.id ?? r.Id ?? crypto.randomUUID()),
          bfNo: String(r.bfNo ?? r.BFNo ?? '—'),
          productName: String(r.productName ?? r.ProductName ?? '—'),
          quantity: Number(r.quantity ?? r.Quantity ?? 0),
          status: String(r.status ?? r.Status ?? '—'),
        }))
        setHistRows(mapped)
        const blocking = mapped.some((r) => isBlockingStockBfStatus(r.status))
        if (mapped.length === 0) {
          if (!submittingRef.current) setFormLocked(false)
        } else {
          setFormLocked(blocking)
          if (blocking) {
            setRows([])
            setPendingProduct(null)
            setSearch('')
          }
        }
      } catch (e) {
        if (tab === 'history') toast((e as Error).message, 'error')
      } finally {
        setHistLoading(false)
      }
    })()
  }, [tab, online, outletId, canView, canCreate, histNonce])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return []
    return products
      .filter((p) => p.displayInPOS !== false)
      .filter((p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q))
      .slice(0, 12)
  }, [products, search])

  function focusQtySelected() {
    setQty('1')
    window.setTimeout(() => {
      const el = qtyRef.current
      if (!el) return
      el.focus()
      el.select()
    }, 0)
  }

  function selectProduct(p: ProductRow) {
    if (formLocked) {
      toast('Opening stock for today is already submitted and locked.', 'error')
      return
    }
    if (p.displayInPOS === false) {
      toast('This product is not displayed in POS — it cannot be added to Stock BF.', 'error')
      return
    }
    setPendingProduct(p)
    setSearch(`${p.code} — ${p.name}`)
    setShowDrop(false)
    setKbField(null)
    focusQtySelected()
  }

  function addRow(p?: ProductRow) {
    if (formLocked) {
      toast('Opening stock for today is already submitted and locked.', 'error')
      return
    }
    const target = p ?? pendingProduct ?? filtered[0]
    if (!target) { toast('Select an item first.', 'info'); return }
    if (target.displayInPOS === false) {
      toast('This product is not displayed in POS — it cannot be added to Stock BF.', 'error')
      return
    }
    const qn = parseFloat(qty.replace(',', '.'))
    if (!Number.isFinite(qn) || qn <= 0) { toast('Enter a valid quantity.', 'error'); return }
    setRows((prev) => {
      const existing = prev.find((x) => x.productId === target.id)
      if (existing) return prev.map((x) => x.productId === target.id ? { ...x, qty: x.qty + qn } : x)
      return [...prev, { productId: target.id, code: target.code, name: target.name, qty: qn }]
    })
    setPendingProduct(null)
    setSearch('')
    setQty('1')
    setShowDrop(false)
  }

  function removeRow(productId: string) {
    if (formLocked) return
    setRows((prev) => prev.filter((r) => r.productId !== productId))
  }

  function updateRowQty(productId: string, value: string) {
    if (formLocked) return
    const qn = parseFloat(value.replace(',', '.'))
    if (!Number.isFinite(qn) || qn <= 0) return
    setRows((prev) => prev.map((r) => r.productId === productId ? { ...r, qty: qn } : r))
  }

  async function submit(andPrint = false) {
    if (submittingRef.current) return
    if (formLocked) { toast('Opening stock for today is already submitted and locked.', 'error'); return }
    if (!canCreate) { toast('You do not have permission to submit opening stock.', 'error'); return }
    if (!outletId) { toast('Select a showroom on the main POS first.', 'error'); return }
    if (rows.length === 0) { toast('Add at least one product.', 'info'); return }

    const processDateStr = todayCalendarISO()
    const mutationId = crypto.randomUUID()
    const payload = {
      // Date-only (Sri Lanka calendar), matching DMS web — not local midnight converted to UTC.
      bfDate: processDateStr,
      outletId,
      clientMutationId: mutationId,
      items: rows.map((r) => ({ productId: r.productId, quantity: r.qty })),
    }

    submittingRef.current = true
    setSubmitting(true)
    try {
      if (online) {
        try {
          await postStockBfBulk(payload)
        } catch (firstErr) {
          if (!isConflictStatus(firstErr) && !isAlreadyRecordedError(firstErr)) throw firstErr
        }
        await offlineDb.stockBf.put({
          id: mutationId,
          outletId,
          processDate: processDateStr,
          lines: rows.map((r) => ({ productId: r.productId, code: r.code, name: r.name, qty: r.qty })),
          createdAt: Date.now(),
          synced: true,
        })
      } else {
        await enqueueMutation({ id: mutationId, type: 'stock-bf-bulk', payload, createdAt: Date.now() })
        await offlineDb.stockBf.put({
          id: mutationId,
          outletId,
          processDate: processDateStr,
          lines: rows.map((r) => ({ productId: r.productId, code: r.code, name: r.name, qty: r.qty })),
          createdAt: Date.now(),
          synced: false,
        })
      }

      if (andPrint) {
        await printReceiptHtml({
          title: 'Stock BF',
          outletLabel: outletLabel || 'Showroom',
          lines: rows.map((r) => ({ name: `${r.code} — ${r.name}`, unitPrice: 0, qty: r.qty, amount: 0 })),
          total: 0,
          cash: 0,
          change: 0,
        })
      }

      setRows([])
      setHistNonce((n) => n + 1)
      setFormLocked(true)
      toast(online ? 'Opening stock saved.' : 'Queued — will sync when online.', 'success')
      if (andPrint) onBack()
    } catch (e) {
      if (online && isUnreachableNetworkError(e)) {
        try {
          await enqueueMutation({ id: mutationId, type: 'stock-bf-bulk', payload, createdAt: Date.now() })
          await offlineDb.stockBf.put({
            id: mutationId,
            outletId,
            processDate: processDateStr,
            lines: rows.map((r) => ({ productId: r.productId, code: r.code, name: r.name, qty: r.qty })),
            createdAt: Date.now(),
            synced: false,
          })
          setRows([])
          toast('Server unreachable. Opening stock queued for sync.', 'info')
          if (andPrint) onBack()
        } catch {
          toast(formatSubmitError(e), 'error')
        }
      } else {
        toast(formatSubmitError(e), 'error')
      }
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  const cashier = user ? `${user.firstName} ${user.lastName}`.trim() : '—'
  const today   = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })

  if (!canCreate && !canView) {
    return (
      <PosSubPageLayout title="Stock BF" subtitle="Opening stock" onBack={onBack}>
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          You do not have permission to use Stock BF on this terminal.
        </p>
      </PosSubPageLayout>
    )
  }

  return (
    <PosSubPageLayout
      title="Stock BF"
      subtitle="Submit opening stock for today. Search lists only products displayed in POS."
      onBack={onBack}
      badge={
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${online ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
          {online ? 'Online' : 'Offline — queued'}
        </span>
      }
    >
      <div className="mb-4 flex gap-2 border-b border-[var(--border)] pb-3">
        {canCreate ? (
          <button
            type="button"
            onClick={() => setTab('enter')}
            className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === 'enter' ? 'bg-[var(--brand-primary)] text-white' : 'bg-[var(--neutral-100)] text-[var(--foreground)]'}`}
          >
            Opening stock
          </button>
        ) : null}
        {canView ? (
          <button
            type="button"
            onClick={() => setTab('history')}
            className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === 'history' ? 'bg-[var(--brand-primary)] text-white' : 'bg-[var(--neutral-100)] text-[var(--foreground)]'}`}
          >
            Today’s history
          </button>
        ) : null}
      </div>

      {tab === 'history' ? (
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-lg sm:p-8">
          <CatalogStaleBanner online={online} />
          {!outletId ? (
            <p className="text-sm text-amber-800">Select a showroom on the main POS first.</p>
          ) : histLoading ? (
            <p className="text-sm text-[var(--muted-foreground)]">Loading…</p>
          ) : histRows.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">No stock BF lines recorded for today at this showroom.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-[var(--border)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--neutral-50)] text-xs font-semibold uppercase text-[var(--muted-foreground)]">
                  <tr>
                    <th className="px-4 py-3 text-left">BF No</th>
                    <th className="px-4 py-3 text-left">Item</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {histRows.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-3 font-mono text-xs">{r.bfNo}</td>
                      <td className="px-4 py-3 font-medium">{r.productName}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{r.quantity}</td>
                      <td className="px-4 py-3 text-xs">{r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-lg sm:p-8">
          <CatalogStaleBanner online={online} />
          {formLocked ? (
            <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--neutral-50)] px-4 py-3 text-sm font-medium text-[var(--foreground)]">
              Today’s opening stock is submitted and locked. It can be entered again only if DMS rejects it.
            </div>
          ) : null}
          <fieldset disabled={formLocked} className={formLocked ? 'pointer-events-none opacity-60' : undefined}>
          {/* Info strip */}
          <div className="mb-6 grid grid-cols-2 gap-4 rounded-xl border border-[var(--border)] bg-[var(--neutral-50)] px-5 py-4 text-sm sm:grid-cols-4">
            <InfoField label="Showroom" value={outletLabel || '—'} />
            <InfoField label="Date" value={today} />
            <InfoField label="Cashier" value={cashier} />
            <InfoField label="Status" value={formLocked ? 'Submitted' : 'Ready'} />
          </div>

          {/* Search row */}
          <div className="relative mb-4 flex flex-wrap items-end gap-3">
            <div className="relative min-w-[220px] flex-1">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Item</label>
              <input
                ref={searchRef}
                value={search}
                readOnly
                inputMode="none"
                placeholder="Search item code or name"
                onPointerDown={(e) => { e.preventDefault(); setShowDrop(true); setKbField('search') }}
                onFocus={(e) => { e.currentTarget.blur(); setShowDrop(true); setKbField('search') }}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--neutral-50)] px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--neutral-400)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                autoComplete="off"
              />
              {showDrop && filtered.length > 0 ? (
                <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-52 overflow-auto rounded-xl border border-[var(--border)] bg-white shadow-xl">
                  {filtered.map((p) => (
                    <li key={p.id}>
                      <button type="button" className="w-full px-4 py-2.5 text-left text-sm hover:bg-[var(--neutral-50)]"
                        onMouseDown={(e) => { e.preventDefault(); selectProduct(p) }}>
                        <span className="font-mono text-xs text-[var(--neutral-400)]">{p.code}</span>
                        <span className="ml-2 font-medium text-[var(--foreground)]">{p.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="w-28">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Qty</label>
              <input
                ref={qtyRef}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                onFocus={(e) => e.currentTarget.select()}
                onClick={(e) => e.currentTarget.select()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addRow()
                  }
                }}
                inputMode="decimal"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--neutral-50)] px-4 py-3 text-center text-[var(--foreground)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
              />
            </div>

            <button type="button"
              className="pos-tap flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-6 py-3 font-bold text-white shadow hover:bg-[var(--brand-primary-dark)]"
              onClick={() => addRow()}>
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>

          {/* Items table */}
          <div className="overflow-hidden rounded-xl border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--neutral-50)] text-xs font-semibold uppercase text-[var(--muted-foreground)]">
                <tr>
                  <th className="px-4 py-3 text-left">Item Code</th>
                  <th className="px-4 py-3 text-left">Item</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-[var(--neutral-400)]">
                      No items added.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.productId} className="hover:bg-[var(--neutral-50)]">
                      <td className="px-4 py-3 font-mono text-xs text-[var(--muted-foreground)]">{r.code}</td>
                      <td className="px-4 py-3 font-medium text-[var(--foreground)]">{r.name}</td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={r.qty}
                          onChange={(e) => updateRowQty(r.productId, e.target.value)}
                          className="w-20 rounded-lg border border-[var(--border)] bg-white px-2 py-1 text-right text-sm font-semibold tabular-nums focus:border-[var(--brand-primary)] focus:outline-none"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button type="button" className="pos-tap rounded-lg p-1 text-red-500 hover:bg-red-50" onClick={() => removeRow(r.productId)}>
                          <X className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {kbField ? (
            <SearchKeyboard
              value={search}
              onChange={(next) => {
                setSearch(next)
                setShowDrop(true)
              }}
              onClose={() => setKbField(null)}
              onEnter={() => {
                if (filtered[0]) selectProduct(filtered[0])
              }}
              label="Item search"
              placeholder="Search item code or name"
            />
          ) : null}

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" disabled={rows.length === 0 || submitting || formLocked}
              onClick={() => void submit(false)}
              className="pos-tap rounded-xl bg-[var(--brand-primary)] px-8 py-3 font-bold text-white shadow hover:bg-[var(--brand-primary-dark)] disabled:opacity-40">
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
            <button type="button" disabled={rows.length === 0 || submitting || formLocked}
              onClick={() => void submit(true)}
              className="pos-tap flex items-center gap-2 rounded-xl bg-[var(--brand-accent)] px-8 py-3 font-bold text-neutral-900 shadow hover:brightness-95 disabled:opacity-40">
              <Printer className="h-4 w-4" /> Submit &amp; Print
            </button>
          </div>
          </fieldset>
        </div>
      )}
    </PosSubPageLayout>
  )
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-0.5 font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  )
}
