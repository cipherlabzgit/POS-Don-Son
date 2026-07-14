import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, X, Loader2 } from 'lucide-react'
import { PosSubPageLayout } from '../components/PosSubPageLayout'
import { CatalogStaleBanner } from '../components/CatalogStaleBanner'
import { useAuthStore } from '../lib/auth-store'
import { useSettingsStore } from '../lib/settings-store'
import { loadProductsIntoDb } from '../lib/catalog-sync'
import { fetchDeliveryTurnsPage, createImmediateOrder } from '../lib/api'
import { useOnlineStatus } from '../lib/use-online-status'
import { toast } from '../lib/toast-store'
import { formatSubmitError } from '../lib/api-errors'
import type { ProductRow } from '../lib/types'

type OrderRow = {
  productId: string
  code: string
  name: string
  quantity: number
}

type OrderRequestPageProps = {
  onBack: () => void
}

export function OrderRequestPage({ onBack }: OrderRequestPageProps) {
  const token = useAuthStore((s) => s.accessToken)
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const online = useOnlineStatus(Boolean(token))
  const outletId = useSettingsStore((s) => s.outletId)
  const outletLabel = useSettingsStore((s) => s.outletLabel)

  const canCreate = hasPermission('order:create')

  const [products, setProducts] = useState<ProductRow[]>([])
  const [deliveryTurns, setDeliveryTurns] = useState<{ id: string; name: string }[]>([])
  const [search, setSearch] = useState('')
  const [showDrop, setShowDrop] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null)
  const [quantity, setQuantity] = useState('1')
  const [rows, setRows] = useState<OrderRow[]>([])
  const [orderDate] = useState(new Date().toISOString().slice(0, 10))
  const [orderBillNo, setOrderBillNo] = useState('')
  const [needByDate, setNeedByDate] = useState(new Date().toISOString().slice(0, 10))
  const [needByTime, setNeedByTime] = useState('12:00')
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().slice(0, 10))
  const [deliveryTime, setDeliveryTime] = useState('10:00')
  const [productionStartingDate, setProductionStartingDate] = useState(new Date().toISOString().slice(0, 10))
  const [productionStartingTime, setProductionStartingTime] = useState('08:00')
  const [recipeRequestNumber, setRecipeRequestNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [reason, setReason] = useState('')
  const [isCustomized, setIsCustomized] = useState(false)
  const [selectedTurnId, setSelectedTurnId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void (async () => {
      try {
        const list = await loadProductsIntoDb()
        setProducts(list)
      } catch (error) {
        toast((error as Error).message, 'error')
      }
    })()
  }, [])

  useEffect(() => {
    if (!online || !token) return
    void (async () => {
      try {
        const res = await fetchDeliveryTurnsPage(1, 100)
        const turns = (res.deliveryTurns as Record<string, unknown>[]).map((t) => ({
          id: String(t.id ?? ''),
          name: String(t.name ?? ''),
        }))
        setDeliveryTurns(turns)
        if (turns.length > 0 && !selectedTurnId) {
          setSelectedTurnId(turns[0].id)
        }
      } catch (error) {
        toast('Unable to load delivery turns.', 'error')
      }
    })()
  }, [online, token, selectedTurnId])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return []
    return products.filter((product) =>
      product.name.toLowerCase().includes(query) || product.code.toLowerCase().includes(query),
    ).slice(0, 20)
  }, [products, search])

  const addRow = (product?: ProductRow) => {
    const target = product ?? selectedProduct
    if (!target) {
      toast('Search and select a product first.', 'info')
      return
    }
    const qty = parseFloat(quantity.replace(',', '.'))
    if (!Number.isFinite(qty) || qty <= 0) {
      toast('Enter a valid quantity.', 'error')
      return
    }

    setRows((prev) => {
      const existing = prev.find((row) => row.productId === target.id)
      if (existing) {
        return prev.map((row) => row.productId === target.id ? { ...row, quantity: row.quantity + qty } : row)
      }
      return [...prev, { productId: target.id, code: target.code, name: target.name, quantity: qty }]
    })
    setSearch('')
    setSelectedProduct(null)
    setQuantity('1')
    setShowDrop(false)
    searchRef.current?.focus()
  }

  const removeRow = (productId: string) => {
    setRows((prev) => prev.filter((row) => row.productId !== productId))
  }

  const updateRowQty = (productId: string, value: string) => {
    const qty = parseFloat(value.replace(',', '.'))
    if (!Number.isFinite(qty) || qty <= 0) return
    setRows((prev) => prev.map((row) => row.productId === productId ? { ...row, quantity: qty } : row))
  }

  const userName = useAuthStore((s) => s.user?.firstName ? `${s.user.firstName} ${s.user.lastName ?? ''}`.trim() : s.user?.email ?? 'POS User')

  const canSubmit =
    canCreate &&
    online &&
    outletId &&
    rows.length > 0 &&
    selectedTurnId &&
    reason.trim() &&
    orderBillNo.trim() &&
    deliveryDate &&
    deliveryTime.trim() &&
    productionStartingDate &&
    productionStartingTime.trim() &&
    recipeRequestNumber.trim() &&
    needByDate &&
    needByTime.trim() &&
    (!isCustomized || notes.trim())

  const submitOrder = async () => {
    if (!canCreate) {
      toast('You do not have permission to create orders.', 'error')
      return
    }
    if (!online) {
      toast('Order request must be submitted while online.', 'error')
      return
    }
    if (!outletId) {
      toast('Select a showroom on the main POS first.', 'error')
      return
    }
    if (!selectedTurnId) {
      toast('Select a delivery turn.', 'error')
      return
    }
    if (!orderBillNo.trim()) {
      toast('Order bill number is required.', 'error')
      return
    }
    if (!needByDate || !needByTime.trim()) {
      toast('Need-by date and time are required.', 'error')
      return
    }
    if (!deliveryDate || !deliveryTime.trim()) {
      toast('Delivery date and time are required.', 'error')
      return
    }
    if (!productionStartingDate || !productionStartingTime.trim()) {
      toast('Production starting date and time are required.', 'error')
      return
    }
    if (!recipeRequestNumber.trim()) {
      toast('Recipe request number is required.', 'error')
      return
    }
    if (isCustomized && !notes.trim()) {
      toast('Customization notes are required for customized orders.', 'error')
      return
    }
    if (!reason.trim()) {
      toast('Reason is required.', 'error')
      return
    }
    if (rows.length === 0) {
      toast('Add at least one product.', 'error')
      return
    }

    setSubmitting(true)
    try {
      await Promise.all(
        rows.map((row) =>
          createImmediateOrder({
            orderBillNo: orderBillNo.trim(),
            orderDate,
            needByDate,
            needByTime: needByTime.trim(),
            deliveryDate,
            deliveryTime: deliveryTime.trim(),
            productionStartingDate,
            productionStartingTime: productionStartingTime.trim(),
            recipeRequestNumber: recipeRequestNumber.trim(),
            deliveryTurnId: selectedTurnId,
            outletId,
            productId: row.productId,
            fullQuantity: row.quantity,
            miniQuantity: 0,
            requestedBy: userName,
            reason: reason.trim(),
            isCustomized,
            customizationNotes: isCustomized ? notes.trim() : undefined,
          }),
        ),
      )

      setRows([])
      setReason('')
      setNotes('')
      setNeedByDate('')
      setOrderBillNo('')
      setRecipeRequestNumber('')
      setIsCustomized(false)
      toast(`${rows.length} custom order${rows.length > 1 ? 's' : ''} submitted successfully.`, 'success')
      onBack()
    } catch (error) {
      toast(formatSubmitError(error), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PosSubPageLayout
      title="Order Request"
      subtitle="Anytime Order Request — align with DMS immediate orders."
      onBack={onBack}
      badge={
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${online ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
          {online ? 'Online' : 'Offline'}
        </span>
      }
    >
      <div className="space-y-6">
        <CatalogStaleBanner online={online} />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-lg">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--muted-foreground)]">Order Date</label>
                <input
                  type="text"
                  value={orderDate}
                  readOnly
                  disabled
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--neutral-100)] px-4 py-3 text-[var(--muted-foreground)]"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--muted-foreground)]">
                  Order Bill No. <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={orderBillNo}
                  onChange={(e) => setOrderBillNo(e.target.value)}
                  disabled={submitting}
                  placeholder="Bill / reference"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--neutral-50)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--muted-foreground)]">
                  Need By Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={needByDate}
                  min={orderDate}
                  onChange={(e) => setNeedByDate(e.target.value)}
                  disabled={submitting}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--neutral-50)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--muted-foreground)]">
                  Need By Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={needByTime}
                  onChange={(e) => setNeedByTime(e.target.value)}
                  disabled={submitting}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--neutral-50)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--muted-foreground)]">Delivery Turn <span className="text-red-500">*</span></label>
                <select
                  value={selectedTurnId}
                  onChange={(e) => setSelectedTurnId(e.target.value)}
                  disabled={submitting || deliveryTurns.length === 0}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--neutral-50)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                >
                  {deliveryTurns.length === 0 ? (
                    <option value="">No turns available</option>
                  ) : (
                    deliveryTurns.map((turn) => (
                      <option key={turn.id} value={turn.id}>{turn.name}</option>
                    ))
                  )}
                </select>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">
                  Delivery date, time, production timing, and turn are chosen by you—they are not tied to one fixed plan
                  (such as a 5:00 AM run) unless you pick that turn.
                </p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--muted-foreground)]">Delivery Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={deliveryDate}
                  min={orderDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  disabled={submitting}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--neutral-50)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--muted-foreground)]">Delivery Time <span className="text-red-500">*</span></label>
                <input
                  type="time"
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  disabled={submitting}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--neutral-50)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--muted-foreground)]">Production Starting Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={productionStartingDate}
                  min={orderDate}
                  onChange={(e) => setProductionStartingDate(e.target.value)}
                  disabled={submitting}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--neutral-50)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--muted-foreground)]">Production Starting Time <span className="text-red-500">*</span></label>
                <input
                  type="time"
                  value={productionStartingTime}
                  onChange={(e) => setProductionStartingTime(e.target.value)}
                  disabled={submitting}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--neutral-50)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-[var(--muted-foreground)]">
                  Recipe Request No. <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={recipeRequestNumber}
                  onChange={(e) => setRecipeRequestNumber(e.target.value)}
                  disabled={submitting}
                  placeholder="Reference number"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--neutral-50)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-[var(--muted-foreground)]">Reason <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={submitting}
                  placeholder="e.g. Urgent restock, customer demand spike"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--neutral-50)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                />
              </div>
              <div className="md:col-span-2 flex items-center gap-3">
                <input
                  id="pos-io-customized"
                  type="checkbox"
                  checked={isCustomized}
                  onChange={(e) => setIsCustomized(e.target.checked)}
                  disabled={submitting}
                  className="h-4 w-4 rounded border-[var(--border)]"
                />
                <label htmlFor="pos-io-customized" className="text-sm font-semibold text-[var(--foreground)]">
                  Customized order
                </label>
              </div>
              {isCustomized ? (
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-[var(--muted-foreground)]">
                    Customization notes <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={submitting}
                    placeholder="e.g. Extra egg filling, double garnish"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--neutral-50)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                  />
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Products</h2>
                <p className="text-sm text-[var(--muted-foreground)]">Search and add products to the order.</p>
              </div>
              <div className="text-sm text-[var(--muted-foreground)]">
                Showroom: <span className="font-semibold text-[var(--foreground)]">{outletLabel || 'Not selected'}</span>
              </div>
            </div>

            <div className="relative mb-4">
              <input
                ref={searchRef}
                type="text"
                value={selectedProduct ? `${selectedProduct.name} (${selectedProduct.code})` : search}
                onChange={(e) => { setSelectedProduct(null); setSearch(e.target.value); setShowDrop(true) }}
                onFocus={() => { if (!selectedProduct) setShowDrop(true) }}
                onClick={() => { if (selectedProduct) { setSelectedProduct(null); setSearch(''); setShowDrop(true) } }}
                placeholder="Search product code or name"
                disabled={submitting}
                className={`w-full rounded-xl border px-4 py-3 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 ${selectedProduct ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/5 font-medium' : 'border-[var(--border)] bg-[var(--neutral-50)] focus:border-[var(--brand-primary)]'}`}
              />
              {showDrop && filtered.length > 0 && !selectedProduct ? (
                <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-auto rounded-xl border border-[var(--border)] bg-white shadow-xl">
                  {filtered.map((product) => (
                    <li key={product.id}>
                      <button
                        type="button"
                        className="w-full px-4 py-3 text-left text-sm hover:bg-[var(--neutral-50)]"
                        onMouseDown={(e) => { e.preventDefault(); setSelectedProduct(product); setSearch(''); setShowDrop(false) }}
                      >
                        <div className="font-medium text-[var(--foreground)]">{product.name}</div>
                        <div className="text-xs text-[var(--muted-foreground)]">{product.code}</div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="mb-4 grid grid-cols-[1fr_120px] gap-3">
              <input
                type="text"
                inputMode="decimal"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={submitting}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--neutral-50)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                placeholder="Quantity"
              />
              <button
                type="button"
                disabled={submitting}
                className="rounded-xl bg-[var(--brand-primary)] px-4 py-3 text-sm font-bold text-white shadow hover:bg-[var(--brand-primary-dark)] disabled:opacity-40"
                onClick={() => addRow()}
              >
                <Plus className="inline h-4 w-4" /> Add
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--neutral-50)] text-left text-xs font-semibold uppercase text-[var(--muted-foreground)]">
                  <tr>
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-sm text-[var(--neutral-500)]">
                        No products added yet.
                      </td>
                    </tr>
                  ) : rows.map((row) => (
                    <tr key={row.productId} className="hover:bg-[var(--neutral-50)]">
                      <td className="px-4 py-3">
                        <div className="font-medium">{row.name}</div>
                        <div className="text-xs text-[var(--muted-foreground)]">{row.code}</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="text"
                          value={row.quantity}
                          onChange={(e) => updateRowQty(row.productId, e.target.value)}
                          disabled={submitting}
                          className="w-24 rounded-xl border border-[var(--border)] bg-[var(--neutral-50)] px-3 py-2 text-right text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => removeRow(row.productId)}
                          className="rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                        >
                          <X className="inline h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-lg">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-[var(--muted-foreground)]">Ready to submit</p>
              <p className="text-2xl font-bold text-[var(--foreground)]">{rows.length} product{rows.length === 1 ? '' : 's'}</p>
            </div>
            <button
              type="button"
              disabled={!canSubmit || submitting}
              onClick={submitOrder}
              className="rounded-2xl bg-[var(--brand-primary)] px-6 py-4 text-sm font-bold text-white shadow hover:bg-[var(--brand-primary-dark)] disabled:opacity-40"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                </span>
              ) : (
                'Submit Order Request'
              )}
            </button>
          </div>
          {!canCreate ? (
            <p className="mt-3 text-sm text-red-600">You do not have permission to create orders.</p>
          ) : !online ? (
            <p className="mt-3 text-sm text-amber-700">Online connection required to submit custom orders.</p>
          ) : !outletId ? (
            <p className="mt-3 text-sm text-amber-700">Select a showroom on the main POS first.</p>
          ) : !reason.trim() ? (
            <p className="mt-3 text-sm text-amber-700">A reason is required before submitting.</p>
          ) : null}
        </div>
      </div>
    </PosSubPageLayout>
  )
}
