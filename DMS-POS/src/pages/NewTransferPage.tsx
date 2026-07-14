import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { PosSubPageLayout } from '../components/PosSubPageLayout'
import { CatalogStaleBanner } from '../components/CatalogStaleBanner'
import { useAuthStore } from '../lib/auth-store'
import { useSettingsStore } from '../lib/settings-store'
import { loadProductsIntoDb } from '../lib/catalog-sync'
import type { ProductRow } from '../lib/types'
import { createTransfer, fetchOutletsPage, submitTransfer } from '../lib/api'
import { useOnlineStatus } from '../lib/use-online-status'
import { toast } from '../lib/toast-store'
import { formatSubmitError } from '../lib/api-errors'

type Props = { onBack: () => void }
type TRow = { productId: string; name: string; code: string; qty: number }

export function NewTransferPage({ onBack }: Props) {
  const user         = useAuthStore((s) => s.user)
  const token        = useAuthStore((s) => s.accessToken)
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const online       = useOnlineStatus(Boolean(token))
  const fromOutletId = useSettingsStore((s) => s.outletId)
  const outletLabel  = useSettingsStore((s) => s.outletLabel)

  const canCreate = hasPermission('operation:transfer:create')

  const [outlets, setOutlets]         = useState<{ id: string; code: string; name: string }[]>([])
  const [toOutletId, setToOutletId]   = useState('')
  const [transferDate, setTransferDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [notes, setNotes]             = useState('')
  const [products, setProducts]       = useState<ProductRow[]>([])
  const [search, setSearch]           = useState('')
  const [showDrop, setShowDrop]       = useState(false)
  const [qty, setQty]                 = useState('1')
  const [rows, setRows]               = useState<TRow[]>([])
  const [submitting, setSubmitting]   = useState(false)
  const [pendingSubmitId, setPendingSubmitId] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

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
        console.error('[NewTransfer] product catalogue', e)
        toast((e as Error).message, 'error')
      }
    })()
  }, [online])

  useEffect(() => {
    if (!token) return
    void (async () => {
      try {
        const data = await fetchOutletsPage(1, 200)
        setOutlets((data.outlets as Record<string, unknown>[]).map((o) => ({
          id: String(o.id), code: String(o.code ?? ''), name: String(o.name ?? ''),
        })))
      } catch { /* offline */ }
    })()
  }, [token])

  const toChoices = useMemo(() => outlets.filter((o) => o.id !== fromOutletId), [outlets, fromOutletId])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return []
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)).slice(0, 12)
  }, [products, search])

  function addRow(p: ProductRow) {
    const qn = parseFloat(qty.replace(',', '.'))
    if (!Number.isFinite(qn) || qn <= 0) { toast('Enter a valid quantity.', 'error'); return }
    setRows((prev) => {
      const existing = prev.find((x) => x.productId === p.id)
      if (existing) return prev.map((x) => x.productId === p.id ? { ...x, qty: x.qty + qn } : x)
      return [...prev, { productId: p.id, name: p.name, code: p.code, qty: qn }]
    })
    setSearch(''); setQty('1'); setShowDrop(false)
    searchRef.current?.focus()
  }

  function removeRow(id: string) { setRows((prev) => prev.filter((r) => r.productId !== id)) }

  async function submit() {
    if (!canCreate) { toast('You do not have permission to create transfers.', 'error'); return }
    if (!online) { toast('Creating transfers requires an online connection.', 'error'); return }
    if (!fromOutletId) { toast('Choose your showroom on the main POS first.', 'error'); return }
    if (!toOutletId) { toast('Choose a destination showroom.', 'error'); return }
    if (rows.length === 0) { toast('Add at least one product line.', 'error'); return }
    setSubmitting(true)
    setPendingSubmitId(null)
    try {
      const created = (await createTransfer({
        transferDate: new Date(`${transferDate}T12:00:00.000Z`).toISOString(),
        fromOutletId,
        toOutletId,
        notes: notes.trim() || undefined,
        items: rows.map((r) => ({ productId: r.productId, quantity: r.qty })),
      })) as { id?: string }
      if (!created?.id) throw new Error('No transfer ID returned.')
      try {
        await submitTransfer(created.id)
        setRows([]); setNotes('')
        setPendingSubmitId(null)
        toast('Transfer submitted for approval.', 'success')
      } catch (submitErr) {
        setPendingSubmitId(String(created.id))
        toast(formatSubmitError(submitErr), 'error')
      }
    } catch (e) {
      setPendingSubmitId(null)
      toast(formatSubmitError(e), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function retrySubmitTransfer() {
    if (!pendingSubmitId || !online) return
    setSubmitting(true)
    try {
      await submitTransfer(pendingSubmitId)
      setRows([]); setNotes('')
      setPendingSubmitId(null)
      toast('Transfer submitted for approval.', 'success')
    } catch (e) {
      toast(formatSubmitError(e), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const cashier = user ? `${user.firstName} ${user.lastName}`.trim() : '—'

  if (!canCreate) {
    return (
      <PosSubPageLayout title="New Transfer" subtitle="Send stock to another branch." onBack={onBack}>
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          You do not have permission to create transfers on this terminal.
        </p>
      </PosSubPageLayout>
    )
  }

  return (
    <PosSubPageLayout
      title="New Transfer"
      subtitle="Send stock from your showroom to another branch."
      onBack={onBack}
      badge={
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${online ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
          {online ? 'Online' : 'Offline — online required'}
        </span>
      }
    >
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-lg sm:p-8">
        <CatalogStaleBanner online={online} />
        {pendingSubmitId ? (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            <p className="font-medium">Transfer was saved as draft but could not be submitted for approval.</p>
            <button
              type="button"
              disabled={submitting || !online}
              onClick={() => void retrySubmitTransfer()}
              className="pos-tap rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
            >
              {submitting ? 'Retrying…' : 'Retry submit'}
            </button>
          </div>
        ) : null}
        {/* Info strip */}
        <div className="mb-6 grid grid-cols-2 gap-4 rounded-xl border border-[var(--border)] bg-[var(--neutral-50)] px-5 py-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">From</p>
            <p className="mt-0.5 font-semibold text-[var(--foreground)]">{outletLabel || '—'}</p>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">To Showroom</label>
            <select value={toOutletId} onChange={(e) => setToOutletId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-2 py-1.5 text-sm text-[var(--foreground)] focus:border-[var(--brand-primary)] focus:outline-none">
              <option value="">Select destination…</option>
              {toChoices.map((o) => <option key={o.id} value={o.id}>{o.name} ({o.code})</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Date</label>
            <input type="date" value={transferDate} onChange={(e) => setTransferDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-2 py-1.5 text-sm text-[var(--foreground)] focus:border-[var(--brand-primary)] focus:outline-none" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Requested by</p>
            <p className="mt-0.5 font-semibold text-[var(--foreground)]">{cashier}</p>
          </div>
        </div>

        {/* Comment */}
        <div className="mb-5">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Comment (optional)</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional comment"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--neutral-50)] px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--neutral-400)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20" />
        </div>

        {/* Search row */}
        <div className="relative mb-4 flex flex-wrap items-end gap-3">
          <div className="relative min-w-[220px] flex-1">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Item</label>
            <input ref={searchRef} value={search}
              onChange={(e) => { setSearch(e.target.value); setShowDrop(true) }}
              onFocus={() => setShowDrop(true)}
              placeholder="Search item code or name"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--neutral-50)] px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--neutral-400)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
              autoComplete="off" />
            {showDrop && filtered.length > 0 ? (
              <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-52 overflow-auto rounded-xl border border-[var(--border)] bg-white shadow-xl">
                {filtered.map((p) => (
                  <li key={p.id}>
                    <button type="button" className="w-full px-4 py-2.5 text-left text-sm hover:bg-[var(--neutral-50)]"
                      onMouseDown={(e) => { e.preventDefault(); addRow(p) }}>
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
            <input value={qty} onChange={(e) => setQty(e.target.value)} inputMode="decimal"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--neutral-50)] px-4 py-3 text-center text-[var(--foreground)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20" />
          </div>
          <button type="button"
            className="pos-tap flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-6 py-3 font-bold text-white shadow hover:bg-[var(--brand-primary-dark)]"
            onClick={() => { const p = filtered[0]; if (p) addRow(p); else toast('No match — type more.', 'info') }}>
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

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" disabled={submitting || !online || rows.length === 0}
            onClick={() => void submit()}
            className="pos-tap rounded-xl bg-[var(--brand-primary)] px-8 py-3 font-bold text-white shadow hover:bg-[var(--brand-primary-dark)] disabled:opacity-40">
            {submitting ? 'Submitting…' : 'Submit Transfer'}
          </button>
          {!online ? <p className="self-center text-sm text-amber-700">Online connection required.</p> : null}
        </div>
      </div>
    </PosSubPageLayout>
  )
}
