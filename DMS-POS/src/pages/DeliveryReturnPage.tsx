import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { PosSubPageLayout } from '../components/PosSubPageLayout'
import { CatalogStaleBanner } from '../components/CatalogStaleBanner'
import { useAuthStore } from '../lib/auth-store'
import { useSettingsStore } from '../lib/settings-store'
import { loadAllActiveProducts } from '../lib/catalog-sync'
import type { ProductRow } from '../lib/types'
import { createDeliveryReturn, submitDeliveryReturn } from '../lib/api'
import { useOnlineStatus } from '../lib/use-online-status'
import { toast } from '../lib/toast-store'
import { formatSubmitError } from '../lib/api-errors'
import { SearchKeyboard } from '../components/SearchKeyboard'

type Props = { onBack: () => void }
type DRow = { productId: string; name: string; code: string; qty: number }

export function DeliveryReturnPage({ onBack }: Props) {
  const user       = useAuthStore((s) => s.user)
  const token      = useAuthStore((s) => s.accessToken)
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const online     = useOnlineStatus(Boolean(token))
  const outletId   = useSettingsStore((s) => s.outletId)
  const outletLabel = useSettingsStore((s) => s.outletLabel)

  const canCreate = hasPermission('operation:delivery-return:create')

  const [deliveryNo, setDeliveryNo]     = useState('')
  const [deliveredDate, setDeliveredDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [returnDate, setReturnDate]     = useState(() => new Date().toISOString().slice(0, 10))
  const [comment, setComment]           = useState('')
  const [products, setProducts]         = useState<ProductRow[]>([])
  const [search, setSearch]             = useState('')
  const [showDrop, setShowDrop]         = useState(false)
  const [qty, setQty]                   = useState('1')
  const [rows, setRows]                 = useState<DRow[]>([])
  const [submitting, setSubmitting]     = useState(false)
  const [kbField, setKbField]           = useState<'comment' | 'search' | null>(null)
  const [pendingProduct, setPendingProduct] = useState<ProductRow | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const qtyRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void (async () => {
      try {
        const list = await loadAllActiveProducts()
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
        console.error('[DeliveryReturn] product catalogue', e)
        toast((e as Error).message, 'error')
      }
    })()
  }, [online])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return []
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)).slice(0, 12)
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
    setPendingProduct(p)
    setSearch(`${p.code} — ${p.name}`)
    setShowDrop(false)
    setKbField(null)
    focusQtySelected()
  }

  function addRow(p?: ProductRow) {
    const target = p ?? pendingProduct ?? filtered[0]
    if (!target) { toast('Select an item first.', 'info'); return }
    const qn = parseFloat(qty.replace(',', '.'))
    if (!Number.isFinite(qn) || qn <= 0) { toast('Enter a valid quantity.', 'error'); return }
    setRows((prev) => {
      const existing = prev.find((x) => x.productId === target.id)
      if (existing) return prev.map((x) => x.productId === target.id ? { ...x, qty: x.qty + qn } : x)
      return [...prev, { productId: target.id, name: target.name, code: target.code, qty: qn }]
    })
    setPendingProduct(null)
    setSearch('')
    setQty('1')
    setShowDrop(false)
  }

  function removeRow(id: string) { setRows((prev) => prev.filter((r) => r.productId !== id)) }

  async function submit() {
    if (!canCreate) { toast('You do not have permission to submit delivery returns.', 'error'); return }
    if (!online) { toast('Delivery returns require an online connection.', 'error'); return }
    if (!outletId) { toast('Choose your showroom on the main POS first.', 'error'); return }
    if (!deliveryNo.trim()) { toast('Enter the delivery note number.', 'error'); return }
    if (rows.length === 0) { toast('Add at least one product line.', 'error'); return }
    setSubmitting(true)
    try {
      const created = (await createDeliveryReturn({
        deliveryNo: deliveryNo.trim(),
        deliveredDate: new Date(`${deliveredDate}T12:00:00.000Z`).toISOString(),
        returnDate: new Date(`${returnDate}T12:00:00.000Z`).toISOString(),
        outletId,
        reason: comment.trim() || 'Return from showroom',
        items: rows.map((r) => ({ productId: r.productId, quantity: r.qty })),
      })) as { id?: string }
      if (!created?.id) throw new Error('No return ID returned.')
      await submitDeliveryReturn(created.id)
      setRows([]); setDeliveryNo(''); setComment('')
      toast('Return submitted for approval.', 'success')
    } catch (e) {
      toast(formatSubmitError(e), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const cashier = user ? `${user.firstName} ${user.lastName}`.trim() : '—'

  if (!canCreate) {
    return (
      <PosSubPageLayout title="Delivery Return" subtitle="Return items to warehouse." onBack={onBack}>
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          You do not have permission to submit delivery returns on this terminal.
        </p>
      </PosSubPageLayout>
    )
  }

  return (
    <PosSubPageLayout
      title="Delivery Return"
      subtitle="Return items to main warehouse."
      onBack={onBack}
      badge={
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${online ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
          {online ? 'Online' : 'Offline — online required'}
        </span>
      }
    >
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-lg sm:p-8">
        <CatalogStaleBanner online={online} />
        {/* Info strip */}
        <div className="mb-6 grid grid-cols-2 gap-4 rounded-xl border border-[var(--border)] bg-[var(--neutral-50)] px-5 py-4 text-sm sm:grid-cols-4">
          <div><p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Showroom</p><p className="mt-0.5 font-semibold text-[var(--foreground)]">{outletLabel || '—'}</p></div>
          <div><p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Date</p><p className="mt-0.5 font-semibold text-[var(--foreground)]">{new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p></div>
          <div><p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Cashier</p><p className="mt-0.5 font-semibold text-[var(--foreground)]">{cashier}</p></div>
          <div><p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Status</p><p className="mt-0.5 font-semibold text-[var(--foreground)]">Ready</p></div>
        </div>

        {/* Optional comment */}
        <div className="mb-5">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Comment (optional)</label>
          <button
            type="button"
            onPointerDown={(e) => { e.preventDefault(); setKbField('comment') }}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--neutral-50)] px-4 py-3 text-left text-[var(--foreground)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
          >
            {comment || <span className="text-[var(--neutral-400)]">Optional comment</span>}
          </button>
        </div>

        {/* Header fields */}
        <div className="mb-5 grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Delivery Note No.</label>
            <input value={deliveryNo} onChange={(e) => setDeliveryNo(e.target.value)} placeholder="e.g. DN-2026-000123"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--neutral-50)] px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--neutral-400)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Delivered On</label>
            <input type="date" value={deliveredDate} onChange={(e) => setDeliveredDate(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--neutral-50)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--brand-primary)] focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Return Date</label>
            <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--neutral-50)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--brand-primary)] focus:outline-none" />
          </div>
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
                <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-[var(--neutral-400)]">No items added.</td></tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.productId} className="hover:bg-[var(--neutral-50)]">
                    <td className="px-4 py-3 font-mono text-xs text-[var(--muted-foreground)]">{r.code}</td>
                    <td className="px-4 py-3 font-medium text-[var(--foreground)]">{r.name}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{r.qty}</td>
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
            value={kbField === 'comment' ? comment : search}
            onChange={(next) => {
              if (kbField === 'comment') {
                setComment(next)
                return
              }
              setSearch(next)
              setShowDrop(true)
            }}
            onClose={() => setKbField(null)}
            onEnter={() => {
              if (kbField === 'search' && filtered[0]) selectProduct(filtered[0])
            }}
            label={kbField === 'comment' ? 'Comment' : 'Item search'}
            placeholder={kbField === 'comment' ? 'Optional comment' : 'Search item code or name'}
          />
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" disabled={submitting || !online || rows.length === 0}
            onClick={() => void submit()}
            className="pos-tap rounded-xl bg-[var(--brand-primary)] px-8 py-3 font-bold text-white shadow hover:bg-[var(--brand-primary-dark)] disabled:opacity-40">
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
          {!online ? <p className="self-center text-sm text-amber-700">Online connection required.</p> : null}
        </div>
      </div>
    </PosSubPageLayout>
  )
}
