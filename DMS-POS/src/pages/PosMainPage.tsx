import {
  useCallback, useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react'
import {
  ChevronLeft, ChevronRight, ChevronUp, Check,
  Cloud, History, Inbox, LogOut, Menu,
  Minus, Package, Plus, Printer,
  Search, Settings2, Star, Truck, Undo2,
  Users, Wallet, X, Maximize2, Power, Stethoscope,
} from 'lucide-react'
import { useAuthStore } from '../lib/auth-store'
import { useCartStore } from '../lib/cart-store'
import { useFavoriteStore } from '../lib/favorite-store'
import { useSettingsStore } from '../lib/settings-store'
import { syncCatalogFromServer } from '../lib/catalog-sync'
import { fetchOutletsPage, postPosSale } from '../lib/api'
import { enqueueMutation, processPendingQueue } from '../lib/sync-queue'
import { useOnlineStatus } from '../lib/use-online-status'
import { printReceiptHtml, type PrintReceiptOpts } from '../lib/print-receipt'
import { toast } from '../lib/toast-store'
import { OnlineBadge } from '../components/OnlineBadge'
import { PaymentModal } from '../components/PaymentModal'
import { TransactionHistoryModal } from '../components/TransactionHistoryModal'
import { QtyNumpad } from '../components/QtyNumpad'
import { SearchKeyboard } from '../components/SearchKeyboard'
import { DiagnosticPage } from './DiagnosticPage'
import type { CategoryRow, ProductRow } from '../lib/types'
import { offlineDb } from '../lib/offline-db'
import type { Screen } from '../screen-types'

// ─── Category pill colours (cycles through palette) ──────────────────────────
const CAT_COLOURS = [
  'bg-[var(--cat-0)] text-neutral-900',    // gold (accent)
  'bg-[var(--cat-1)] text-white',          // red (primary)
  'bg-[var(--cat-2)] text-white',          // green
  'bg-[var(--cat-3)] text-white',          // blue
  'bg-[var(--cat-4)] text-white',          // purple
  'bg-[var(--cat-5)] text-white',          // orange
  'bg-[var(--cat-6)] text-white',          // pink
  'bg-[var(--cat-7)] text-white',          // teal
]

type NumpadTarget = { productId: string; name: string; currentQty: number }

type PosMainPageProps = {
  onOpenScreen: (s: Screen) => void
  onCustomerView: () => void
}

export function PosMainPage({ onOpenScreen, onCustomerView }: PosMainPageProps) {
  const user        = useAuthStore((s) => s.user)
  const logout      = useAuthStore((s) => s.logout)
  const accessToken = useAuthStore((s) => s.accessToken)
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const online      = useOnlineStatus(Boolean(accessToken))

  const canSaleCreate    = hasPermission('pos:sale:create')
  const canSaleView      = hasPermission('pos:sale:view')
  const canStockBfCreate = hasPermission('operation:stock-bf:create')
  const canStockBfView   = hasPermission('operation:stock-bf:view')
  const canTransferCreate = hasPermission('operation:transfer:create')
  const canTransferView   = hasPermission('operation:transfer:view')
  const canDeliveryReturnCreate = hasPermission('operation:delivery-return:create')
  const canCashierBalanceView = hasPermission('cashier-balance:view')
  const canCashierBalanceEdit = hasPermission('cashier-balance:edit')

  const outletId    = useSettingsStore((s) => s.outletId)
  const outletLabel = useSettingsStore((s) => s.outletLabel)
  const assignedShowroomCode = useSettingsStore((s) => s.assignedShowroomCode)
  const setAssignedShowroomCode = useSettingsStore((s) => s.setAssignedShowroomCode)
  const setOutlet   = useSettingsStore((s) => s.setOutlet)
  const apiBaseUrl  = useSettingsStore((s) => s.apiBaseUrl)
  const zoomPercent = useSettingsStore((s) => s.zoomPercent)
  const setZoom     = useSettingsStore((s) => s.setZoomPercent)
  const productTilePercent = useSettingsStore((s) => s.productTilePercent)
  const setProductTilePercent = useSettingsStore((s) => s.setProductTilePercent)
  const cacheUpdatedAt = useSettingsStore((s) => s.cacheUpdatedAt)
  const autoPrint   = useSettingsStore((s) => s.autoPrint)
  const setAutoPrint = useSettingsStore((s) => s.setAutoPrint)
  const receiptPhone = useSettingsStore((s) => s.receiptPhone)
  const receiptAddress = useSettingsStore((s) => s.receiptAddress)
  const setReceiptPhone = useSettingsStore((s) => s.setReceiptPhone)
  const setReceiptAddress = useSettingsStore((s) => s.setReceiptAddress)

  const lines    = useCartStore((s) => s.lines)
  const add      = useCartStore((s) => s.add)
  const inc      = useCartStore((s) => s.inc)
  const dec      = useCartStore((s) => s.dec)
  const remove   = useCartStore((s) => s.remove)
  const subtotal = useCartStore((s) => s.subtotal)
  const clear    = useCartStore((s) => s.clear)

  const toggleFav = useFavoriteStore((s) => s.toggle)
  const isFav     = useFavoriteStore((s) => s.isFav)
  const favIds    = useFavoriteStore((s) => s.ids)

  const [drawer, setDrawer]           = useState(false)
  const [techOpen, setTechOpen]       = useState(false)
  const [userMenu, setUserMenu]       = useState(false)
  const [showroomBindError, setShowroomBindError] = useState('')
  const [search, setSearch]           = useState('')
  const [categoryId, setCategoryId]   = useState<string>('all')
  const [payOpen, setPayOpen]         = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [loadErr, setLoadErr]         = useState('')
  const [numpad, setNumpad]           = useState<NumpadTarget | null>(null)
  const [products, setProducts]       = useState<ProductRow[]>([])
  const [categories, setCategories]   = useState<CategoryRow[]>([])
  const [outlets, setOutlets]         = useState<{ id: string; code: string; name: string; address?: string; phone?: string }[]>([])
  const [lastReceipt, setLastReceipt] = useState<{
    outletLabel: string; total: number; paymentMethod: string; cash: number; change: number
    saleNo?: string; dateTime?: string; lines: { name: string; unitPrice: number; qty: number; amount: number }[]
  } | null>(null)
  const [pendingInfo, setPendingInfo] = useState<{
    count: number
    byType: { type: string; count: number; maxRetry: number }[]
  }>({ count: 0, byType: [] })
  const [syncPopoverOpen, setSyncPopoverOpen] = useState(false)
  const [diagnosticOpen, setDiagnosticOpen] = useState(false)
  const [searchKbOpen, setSearchKbOpen] = useState(false)
  const [catPage, setCatPage] = useState(0)

  const catalogScrollRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const scale = zoomPercent / 100
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const longPressTriggeredRef = useRef(false)

  // ── Catalog load ────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoadErr('')
    try {
      if (online) {
        await syncCatalogFromServer()
      } else if (accessToken) {
        // Health ping may lag after login — try sync once; login flow also syncs.
        try {
          await syncCatalogFromServer()
        } catch {
          /* offline or transient; fall back to local cache */
        }
      }
      const p = await offlineDb.products.toArray()
      const c = await offlineDb.categories.toArray()
      setProducts(p)
      setCategories(c)
      if (p.length === 0) {
        setLoadErr(
          online
            ? 'No products in cache. Open POS Diagnostic → Re-sync from Server.'
            : 'No products in cache. Connect online to download the catalogue.',
        )
      }
    } catch (e) {
      setLoadErr((e as Error).message)
      const p = await offlineDb.products.toArray()
      const c = await offlineDb.categories.toArray()
      setProducts(p)
      setCategories(c)
    }
  }, [online, accessToken])

  useEffect(() => { void loadData() }, [loadData])

  // ── Outlets load (re-fetch when API URL / online changes — not only on login) ─
  useEffect(() => {
    if (!accessToken || !online) return
    let cancelled = false
    void (async () => {
      try {
        const data = await fetchOutletsPage(1, 100)
        if (cancelled) return
        const rows = (data.outlets as Record<string, unknown>[]).map((o) => ({
          id: String(o.id ?? o.Id ?? ''),
          code: String(o.code ?? o.Code ?? ''),
          name: String(o.name ?? o.Name ?? ''),
          address: String(o.address ?? o.Address ?? ''),
          phone: String(o.phone ?? o.Phone ?? ''),
        })).filter((o) => o.id)
        setOutlets(rows)
        const code = useSettingsStore.getState().assignedShowroomCode.trim().toUpperCase()
        if (!code) {
          setOutlet(null, 'Showroom')
          setShowroomBindError('This till has no Showroom Code. A system administrator must set it in Technical settings.')
          return
        }
        const match = rows.find((o) => o.code.trim().toUpperCase() === code)
        if (!match) {
          setOutlet(null, 'Showroom')
          setShowroomBindError(`Showroom Code "${code}" was not found in DMS. Check the Code on Showroom master.`)
          return
        }
        setShowroomBindError('')
        setOutlet(match.id, match.name || match.code)
      } catch (err) {
        if (!cancelled) {
          setOutlets([])
          console.warn('[outlets] Failed to load showrooms:', err)
          toast('Could not load showrooms from server. Check the network connection and permissions.', 'error')
        }
      }
    })()
    return () => { cancelled = true }
  }, [accessToken, online, apiBaseUrl, assignedShowroomCode, setOutlet])

  useEffect(() => {
    if (!accessToken) {
      setPendingInfo({ count: 0, byType: [] })
      return
    }
    const tick = async () => {
      const rows = await offlineDb.pending.toArray()
      const map = new Map<string, { count: number; maxRetry: number }>()
      for (const r of rows) {
        const m = map.get(r.type) ?? { count: 0, maxRetry: 0 }
        m.count += 1
        m.maxRetry = Math.max(m.maxRetry, r.retryCount)
        map.set(r.type, m)
      }
      setPendingInfo({
        count: rows.length,
        byType: [...map.entries()].map(([type, v]) => ({ type, ...v })),
      })
    }
    void tick()
    const id = setInterval(tick, 4000)
    return () => clearInterval(id)
  }, [accessToken])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement
      const tag = t.tagName
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable
      if (e.key === 'Escape') {
        if (payOpen) { e.preventDefault(); setPayOpen(false); return }
        if (numpad) { e.preventDefault(); setNumpad(null); return }
        if (historyOpen) { e.preventDefault(); setHistoryOpen(false); return }
        if (syncPopoverOpen) { e.preventDefault(); setSyncPopoverOpen(false) }
        return
      }
      if (e.key === '/' || e.key === 'F3') {
        if (e.key === '/' && typing) return
        e.preventDefault()
        setSearchKbOpen(true)
        return
      }
      if (e.key === 'F5') {
        e.preventDefault()
        void loadData()
        return
      }
      if (e.key === 'F10') {
        e.preventDefault()
        if (lines.length > 0 && outletId && canSaleCreate) setPayOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [payOpen, numpad, historyOpen, syncPopoverOpen, lines.length, outletId, canSaleCreate, loadData])

  // ── Filtered product list ───────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    let list = products
    if (categoryId === 'fav') list = list.filter((p) => favIds.includes(p.id))
    else if (categoryId !== 'all') list = list.filter((p) => p.categoryId === categoryId)
    const q = search.trim().toLowerCase()
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q))
    return list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name))
  }, [products, categoryId, search, favIds])

  // ── Category row ────────────────────────────────────────────────────────────
  const catRow = useMemo(() => {
    const cols: { id: string; name: string; colour: string }[] = [
      { id: 'all', name: 'All', colour: 'bg-slate-700 text-white' },
      { id: 'fav', name: '★ Favourites', colour: CAT_COLOURS[0] },
    ]
    const sorted = [...categories].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name))
    sorted.forEach((c, i) => cols.push({ id: c.id, name: c.name, colour: CAT_COLOURS[(i + 1) % CAT_COLOURS.length] }))
    return cols
  }, [categories])

  function selectCategory(id: string) {
    setCategoryId(id)
  }

  const CATS_PER_PAGE = 7
  const catPages = Math.max(1, Math.ceil(catRow.length / CATS_PER_PAGE))
  const visibleCats = catRow.slice(catPage * CATS_PER_PAGE, catPage * CATS_PER_PAGE + CATS_PER_PAGE)
  const catProgress = ((catPage + 1) / catPages) * 100

  useEffect(() => {
    if (catPage > catPages - 1) setCatPage(Math.max(0, catPages - 1))
  }, [catPage, catPages])

  const sub = subtotal()

  // ── Current outlet details ─────────────────────────────────────────────────
  const currentOutlet = useMemo(() => outlets.find((o) => o.id === outletId), [outlets, outletId])
  const receiptCompanyAddress = currentOutlet?.address || receiptAddress || 'NO: 302/D, OLD KANDY ROAD,\nDALUGAMA, KELANIYA'
  const receiptCompanyPhone = currentOutlet?.phone || receiptPhone || '011-2911412/076-8214432'

  // ── Payment ─────────────────────────────────────────────────────────────────
  async function handlePay(method: 'Cash' | 'Card', cashReceived?: number, change?: number) {
    if (!canSaleCreate) { toast('You do not have permission to complete sales.', 'error'); return }
    if (!outletId) { toast('This till is not assigned to a showroom.', 'error'); return }
    if (lines.length === 0) return

    const body = {
      outletId,
      paymentMethod: method,
      clientMutationId: crypto.randomUUID(),
      lines: lines.map((l) => ({ productId: l.productId, quantity: l.qty, unitPrice: l.unitPrice })),
    }
    const snapshot = lines.map((l) => ({ name: l.name, unitPrice: l.unitPrice, qty: l.qty, amount: l.qty * l.unitPrice }))
    const totalSnap = sub
    const now = new Date()
    const dateTimeStr = now.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }) + ' ' + 
                       now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })

    const cashPaid = cashReceived ?? totalSnap
    const changeAmount = change ?? 0

    const saveLocal = async (
      saleNo?: string,
      meta?: { serverSaleId?: string; status?: string; rejectionReason?: string },
    ) => {
      await offlineDb.sales.put({
        id: body.clientMutationId,
        outletId,
        paymentMethod: method,
        total: totalSnap,
        lines: lines.map((l) => ({ productId: l.productId, name: l.name, qty: l.qty, unitPrice: l.unitPrice })),
        createdAt: Date.now(),
        synced: Boolean(saleNo),
        saleNo,
        serverSaleId: meta?.serverSaleId,
        status: meta?.status,
        rejectionReason: meta?.rejectionReason,
      })
    }

    try {
      let receiptSnapshot: {
        outletLabel: string
        total: number
        paymentMethod: string
        cash: number
        change: number
        dateTime: string
        saleNo?: string
        lines: { name: string; unitPrice: number; qty: number; amount: number }[]
      }
      if (online) {
        const detail = (await postPosSale(body)) as {
          id?: string
          saleNo?: string
          paymentMethod?: string
          totalAmount?: number
          status?: string
          lines?: { productName?: string; quantity?: number; unitPrice?: number; lineTotal?: number }[]
        }
        await saveLocal(detail.saleNo, {
          serverSaleId: detail.id != null ? String(detail.id) : undefined,
          status: detail.status != null ? String(detail.status) : undefined,
        })
        receiptSnapshot = {
          outletLabel,
          total: Number(detail.totalAmount ?? totalSnap),
          paymentMethod: String(detail.paymentMethod ?? method),
          cash: cashPaid,
          change: changeAmount,
          dateTime: dateTimeStr,
          saleNo: detail.saleNo,
          lines: detail.lines?.length
            ? detail.lines.map((l) => ({ 
                name: String(l.productName ?? ''), 
                unitPrice: Number(l.unitPrice ?? 0),
                qty: Number(l.quantity ?? 0), 
                amount: Number(l.lineTotal ?? 0) 
              }))
            : snapshot,
        }
      } else {
        await enqueueMutation({ id: body.clientMutationId, type: 'pos-sale', payload: body, createdAt: Date.now() })
        await saveLocal()
        receiptSnapshot = { outletLabel, total: totalSnap, paymentMethod: method, cash: cashPaid, change: changeAmount, dateTime: dateTimeStr, lines: snapshot }
      }
      setLastReceipt(receiptSnapshot)
      clear()
      setPayOpen(false)
      toast(
        online
          ? 'Sale completed successfully.'
          : 'Sale queued — will sync when online.',
        'success',
      )
      // Always print receipt after completing sale
      const ok = await printReceiptHtml({
        title: 'DON & SONS (PVT) LTD',
        companyAddress: receiptCompanyAddress,
        companyPhone: `Tel:${receiptCompanyPhone}`,
        outletLabel: receiptSnapshot.outletLabel,
        lines: receiptSnapshot.lines,
        total: receiptSnapshot.total,
        cash: receiptSnapshot.cash,
        change: receiptSnapshot.change,
        dateTime: receiptSnapshot.dateTime,
        cashier: user ? `${user.firstName} ${user.lastName}`.trim() : '',
        paymentMethod: receiptSnapshot.paymentMethod,
        saleNo: receiptSnapshot.saleNo,
        footerLines: ['FOOD ARE NOT RETURNABLE', 'COMPLAINT MUST BE LODGED BEFORE', '12 NOON NEXT DAY'],
      })
      if (!ok) toast('Unable to print — try again.', 'error')
    } catch (e) {
      try {
        await enqueueMutation({ id: body.clientMutationId, type: 'pos-sale', payload: body, createdAt: Date.now() })
        await saveLocal()
        const receiptSnapshot = { outletLabel, total: totalSnap, paymentMethod: method, cash: cashPaid, change: changeAmount, dateTime: dateTimeStr, lines: snapshot }
        setLastReceipt(receiptSnapshot)
        clear()
        setPayOpen(false)
        toast('Server unreachable. Sale queued for sync.', 'info')
        // Always print receipt after completing sale
        const ok = await printReceiptHtml({
          title: 'DON & SONS (PVT) LTD',
          companyAddress: receiptCompanyAddress,
          companyPhone: `Tel:${receiptCompanyPhone}`,
          outletLabel: receiptSnapshot.outletLabel,
          lines: receiptSnapshot.lines,
          total: receiptSnapshot.total,
          cash: receiptSnapshot.cash,
          change: receiptSnapshot.change,
          dateTime: receiptSnapshot.dateTime,
          cashier: user ? `${user.firstName} ${user.lastName}`.trim() : '',
          paymentMethod: receiptSnapshot.paymentMethod,
          footerLines: ['FOOD ARE NOT RETURNABLE', 'COMPLAINT MUST BE LODGED BEFORE', '12 NOON NEXT DAY'],
        })
        if (!ok) toast('Unable to print — try again.', 'error')
      } catch {
        toast((e as Error).message, 'error')
      }
    }
  }

  // ── Print ───────────────────────────────────────────────────────────────────
  async function handlePrint() {
    const now = new Date()
    const dateTimeStr = now.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }) + ' ' +
                       now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })
    const cashier = user ? `${user.firstName} ${user.lastName}`.trim() : ''
    const footerLines = ['FOOD ARE NOT RETURNABLE', 'COMPLAINT MUST BE LODGED BEFORE', '12 NOON NEXT DAY']

    let opts: PrintReceiptOpts | null = null
    if (lines.length > 0) {
      opts = {
        title: 'DON & SONS (PVT) LTD',
        companyAddress: receiptCompanyAddress,
        companyPhone: `Tel:${receiptCompanyPhone}`,
        outletLabel,
        lines: lines.map((l) => ({ name: l.name, unitPrice: l.unitPrice, qty: l.qty, amount: l.qty * l.unitPrice })),
        total: sub,
        cash: sub,
        change: 0,
        dateTime: dateTimeStr,
        cashier,
        footerLines,
      }
    } else if (lastReceipt) {
      opts = {
        title: 'DON & SONS (PVT) LTD',
        companyAddress: receiptCompanyAddress,
        companyPhone: `Tel:${receiptCompanyPhone}`,
        outletLabel: lastReceipt.outletLabel,
        lines: lastReceipt.lines,
        total: lastReceipt.total,
        cash: lastReceipt.cash,
        change: lastReceipt.change,
        dateTime: lastReceipt.dateTime || dateTimeStr,
        cashier,
        paymentMethod: lastReceipt.paymentMethod,
        saleNo: lastReceipt.saleNo,
        footerLines,
      }
    }
    if (!opts) {
      toast('Add items or complete a sale first.', 'info')
      return
    }
    const ok = await printReceiptHtml(opts)
    if (!ok) toast('Unable to print — try again.', 'error')
  }

  // ── Display Bill (during payment) ──────────────────────────────────────────
  async function handleDisplayBill(cashReceived?: number, change?: number) {
    if (lines.length === 0) return
    const now = new Date()
    const dateTimeStr = now.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }) + ' ' +
                       now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })
    const ok = await printReceiptHtml({
      title: 'DON & SONS (PVT) LTD',
      companyAddress: receiptCompanyAddress,
      companyPhone: `Tel:${receiptCompanyPhone}`,
      outletLabel,
      lines: lines.map((l) => ({ name: l.name, unitPrice: l.unitPrice, qty: l.qty, amount: l.qty * l.unitPrice })),
      total: sub,
      cash: cashReceived ?? sub,
      change: change ?? 0,
      dateTime: dateTimeStr,
      cashier: user ? `${user.firstName} ${user.lastName}`.trim() : '',
      footerLines: ['FOOD ARE NOT RETURNABLE', 'COMPLAINT MUST BE LODGED BEFORE', '12 NOON NEXT DAY'],
    })
    if (!ok) toast('Unable to print — try again.', 'error')
  }

  // ── Product tile click → quick add or long press for numpad ────────────────
  function handleProductTap(p: ProductRow) {
    // Quick tap: just add 1 to cart
    add({ productId: p.id, code: p.code, name: p.name, unitPrice: p.unitPrice })
  }

  function handleProductLongPressStart(p: ProductRow) {
    longPressTriggeredRef.current = false
    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true
      openNumpad(p)
    }, 500) // 500ms = 0.5 seconds for long press
  }

  function handleProductLongPressEnd(p: ProductRow) {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
    
    // If long press wasn't triggered, treat as quick tap
    if (!longPressTriggeredRef.current) {
      handleProductTap(p)
    }
  }

  function openNumpad(p: ProductRow) {
    const existing = lines.find((l) => l.productId === p.id)
    setNumpad({ productId: p.id, name: p.name, currentQty: existing?.qty ?? 0 })
  }

  function confirmNumpad(qty: number) {
    if (!numpad) return
    const existing = lines.find((l) => l.productId === numpad.productId)
    const p = products.find((x) => x.id === numpad.productId)
    if (!p) { setNumpad(null); return }

    if (!existing) {
      // Add fresh with desired qty
      for (let i = 0; i < qty; i++) add({ productId: p.id, code: p.code, name: p.name, unitPrice: p.unitPrice })
    } else {
      const diff = qty - existing.qty
      if (diff > 0) for (let i = 0; i < diff; i++) inc(p.id)
      else if (diff < 0) for (let i = 0; i < -diff; i++) dec(p.id)
    }
    setNumpad(null)
  }

  // ── Electron helpers ────────────────────────────────────────────────────────
  type DmsPosApi = { shutdown?: () => void; toggleFullscreen?: () => void }
  const dmsPosApi = typeof window !== 'undefined' ? (window as unknown as { dmsPos?: DmsPosApi }).dmsPos : undefined
  function handleShutdown() { dmsPosApi?.shutdown?.() }
  function handleFullscreen() { dmsPosApi?.toggleFullscreen?.() }

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-white" style={{ fontSize: `${Math.min(1.1, 0.9 * scale)}rem` }}>

      {/* ── Header ── */}
      <header className="flex flex-shrink-0 items-center justify-between gap-2 border-b border-[var(--brand-primary-dark)] bg-[var(--brand-primary)] px-3 py-2 shadow-md">
        {/* Left: menu + brand */}
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setDrawer(true)}
            className="pos-tap rounded-xl border border-white/30 p-2 text-white hover:bg-white/10"
            aria-label="Open operations menu">
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <div className="font-pos-title text-lg font-bold leading-tight text-white sm:text-xl">Don &amp; Sons</div>
            <div className="text-[10px] text-white/70 sm:text-xs">Point of Sale</div>
          </div>
        </div>

        {/* Right: zoom · online badge · showroom · user */}
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {/* Screen zoom (whole dashboard) */}
          <div className="flex items-center gap-0.5 rounded-lg border border-white/30 bg-white/10 px-0.5" title="Screen zoom">
            <span className="hidden pl-1.5 text-[9px] font-bold uppercase tracking-wide text-white/70 sm:inline">Screen</span>
            <button type="button" className="pos-tap px-2 text-white" onClick={() => setZoom(zoomPercent - 10)} aria-label="Screen zoom out"><Minus className="h-4 w-4" /></button>
            <span className="min-w-[2.75rem] text-center text-[11px] font-semibold text-white">{zoomPercent}%</span>
            <button type="button" className="pos-tap px-2 text-white" onClick={() => setZoom(zoomPercent + 10)} aria-label="Screen zoom in"><Plus className="h-4 w-4" /></button>
          </div>

          {/* Product button size (catalogue cards only) */}
          <div className="flex items-center gap-0.5 rounded-lg border border-white/30 bg-white/10 px-0.5" title="Product button size">
            <span className="hidden pl-1.5 text-[9px] font-bold uppercase tracking-wide text-white/70 sm:inline">Buttons</span>
            <button type="button" className="pos-tap px-2 text-white" onClick={() => setProductTilePercent(productTilePercent - 10)} aria-label="Smaller product buttons"><Minus className="h-4 w-4" /></button>
            <span className="min-w-[2.75rem] text-center text-[11px] font-semibold text-white">{productTilePercent}%</span>
            <button type="button" className="pos-tap px-2 text-white" onClick={() => setProductTilePercent(productTilePercent + 10)} aria-label="Larger product buttons"><Plus className="h-4 w-4" /></button>
          </div>

          <div className="relative">
            <OnlineBadge
              online={online}
              pendingCount={pendingInfo.count}
              onPendingClick={() => setSyncPopoverOpen((v) => !v)}
            />
            {syncPopoverOpen && pendingInfo.count > 0 ? (
              <div className="absolute right-0 top-full z-[60] mt-1 w-72 rounded-xl border border-[var(--border)] bg-white p-3 shadow-2xl">
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted-foreground)]">Pending sync</p>
                <ul className="mt-2 max-h-40 space-y-1.5 overflow-auto text-xs text-[var(--foreground)]">
                  {pendingInfo.byType.map((row) => (
                    <li key={row.type} className="flex justify-between gap-2 border-b border-[var(--border)] pb-1 last:border-0">
                      <span className="font-mono text-[10px] text-[var(--brand-primary)]">{row.type}</span>
                      <span className="tabular-nums text-[var(--muted-foreground)]">×{row.count} · retries ≤{row.maxRetry}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="pos-tap mt-3 w-full rounded-lg bg-[var(--brand-primary)] py-2 text-xs font-bold text-white hover:bg-[var(--brand-primary-dark)]"
                  onClick={() => {
                    void processPendingQueue(true)
                    toast('Sync queue processing…', 'info')
                  }}
                >
                  Sync now
                </button>
              </div>
            ) : null}
          </div>

          <div
            className="flex items-center rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white"
            title="Assigned showroom (device setting)"
          >
            <span className="max-w-[10rem] truncate">{outletId ? outletLabel : 'Showroom not assigned'}</span>
          </div>

          {/* User dropdown */}
          <div className="relative">
            <button type="button" onClick={() => setUserMenu((v) => !v)}
              className="flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20">
              <span className="max-w-[6rem] truncate">{user?.firstName ?? 'User'}</span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 rotate-90" />
            </button>
            {userMenu ? (
              <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-xl border border-[var(--border)] bg-white py-2 shadow-xl">
                <div className="border-b border-[var(--border)] px-4 pb-2">
                  <p className="text-[10px] font-semibold uppercase text-[var(--muted-foreground)]">Logged in as</p>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{user?.firstName} {user?.lastName}</p>
                </div>
                <div className="border-b border-[var(--border)] px-3 py-2 space-y-2">
                  <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase text-[var(--muted-foreground)]">Screen zoom</p>
                    <div className="flex items-center gap-1">
                      <button type="button" className="pos-tap rounded-lg border border-[var(--border)] px-2 text-[var(--foreground)]" onClick={() => setZoom(zoomPercent - 10)}>-</button>
                      <span className="flex-1 text-center text-sm font-semibold">{zoomPercent}%</span>
                      <button type="button" className="pos-tap rounded-lg border border-[var(--border)] px-2 text-[var(--foreground)]" onClick={() => setZoom(zoomPercent + 10)}>+</button>
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase text-[var(--muted-foreground)]">Product button size</p>
                    <div className="flex items-center gap-1">
                      <button type="button" className="pos-tap rounded-lg border border-[var(--border)] px-2 text-[var(--foreground)]" onClick={() => setProductTilePercent(productTilePercent - 10)}>-</button>
                      <span className="flex-1 text-center text-sm font-semibold">{productTilePercent}%</span>
                      <button type="button" className="pos-tap rounded-lg border border-[var(--border)] px-2 text-[var(--foreground)]" onClick={() => setProductTilePercent(productTilePercent + 10)}>+</button>
                    </div>
                  </div>
                </div>
                <nav className="px-2 pt-1">
                  <MenuAction icon={<Maximize2 className="h-4 w-4" />} label="Toggle fullscreen" onClick={() => { handleFullscreen(); setUserMenu(false) }} />
                  <MenuAction icon={<Cloud className="h-4 w-4" />} label="Refresh cache" onClick={() => { void loadData(); setUserMenu(false); toast('Refreshing catalogue…', 'info') }} />
                  <MenuAction icon={<Stethoscope className="h-4 w-4 text-blue-600" />} label="Diagnostic" textClass="text-blue-600" onClick={() => { setDiagnosticOpen(true); setUserMenu(false) }} />
                  <MenuAction icon={<Power className="h-4 w-4 text-amber-600" />} label="Shutdown" textClass="text-amber-700" onClick={() => { handleShutdown(); setUserMenu(false) }} />
                  <MenuAction icon={<LogOut className="h-4 w-4 text-red-600" />} label="Logout" textClass="text-red-600" onClick={() => { logout(); setUserMenu(false) }} />
                </nav>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* Catalog error banner */}
      {loadErr ? (
        <div className="flex-shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          <strong>Catalogue:</strong> {loadErr}
        </div>
      ) : null}

      {/* Showroom warning */}
      {!outletId ? (
        <div className="flex-shrink-0 border-b border-[var(--brand-accent)] bg-[var(--brand-accent)]/20 px-4 py-2 text-sm font-medium text-amber-900">
          ⚠ {showroomBindError || 'This till is not assigned to a showroom. Ask an administrator to set the Showroom Code.'}
        </div>
      ) : null}

      {/* ── Main body: bill | catalog ── */}
      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(280px,32%)_1fr]"
        style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: `${100 / scale}%`, height: `${100 / scale}%` }}>

        {/* ── LEFT: Bill panel ── */}
        <section className="flex min-h-0 flex-col border-r border-[var(--border)] bg-white">

          <div className="flex-shrink-0 border-b border-[var(--border)] px-4 py-3">
            <h2 className="font-pos-title text-xl font-bold text-[var(--foreground)]">Bill</h2>
          </div>

          <div className="pos-scroll-visible min-h-0 flex-1">
            {lines.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
                <p className="text-sm font-semibold text-[var(--neutral-500)]">No items yet</p>
                <p className="max-w-xs text-xs text-[var(--neutral-400)]">Tap a product on the right to add it.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 z-10 border-b border-[var(--border)] bg-white text-xs font-semibold text-[var(--muted-foreground)]">
                  <tr>
                    <th className="px-3 py-2">Item</th>
                    <th className="px-2 py-2 text-center">Qty</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {lines.map((l) => (
                    <tr key={l.productId}>
                      <td className="px-3 py-2.5 text-sm font-medium text-[var(--foreground)]">{l.name}</td>
                      <td className="px-2 py-2.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button type="button" className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand-primary)] text-white" onClick={() => remove(l.productId)} aria-label={`Remove ${l.name}`}>
                            <X className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand-primary)] text-white" onClick={() => dec(l.productId)} aria-label={`Decrease ${l.name}`}>
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" className="min-w-[1.25rem] text-center text-sm font-bold tabular-nums"
                            onClick={() => setNumpad({ productId: l.productId, name: l.name, currentQty: l.qty })}>
                            {l.qty}
                          </button>
                          <button type="button" className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand-accent)] text-neutral-900" onClick={() => inc(l.productId)} aria-label={`Increase ${l.name}`}>
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right text-sm font-semibold tabular-nums">
                        {(l.qty * l.unitPrice).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex-shrink-0 border-t border-[var(--border)] bg-white px-4 py-3 space-y-3">
            <p className="font-pos-title text-2xl font-bold tabular-nums text-[var(--foreground)]">
              Total: Rs {sub.toFixed(2)}
            </p>

            <button type="button" disabled={lines.length === 0 || !outletId || !canSaleCreate} onClick={() => lines.length > 0 && outletId && canSaleCreate && setPayOpen(true)}
              className="w-full rounded-lg bg-[var(--brand-primary)] py-4 text-xl font-bold tracking-wide text-white shadow-md hover:bg-[var(--brand-primary-dark)] disabled:cursor-not-allowed disabled:opacity-40">
              PAY
            </button>

            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={onCustomerView} className="pos-tap flex h-14 items-center justify-center rounded-lg bg-[var(--brand-primary)] text-white" aria-label="Customer">
                <Users className="h-6 w-6" />
              </button>
              <button type="button" onClick={handlePrint} className="pos-tap flex h-14 items-center justify-center rounded-lg bg-[var(--brand-accent)] text-neutral-900" aria-label="Print">
                <Printer className="h-6 w-6" />
              </button>
              <button type="button" disabled={!canSaleView} onClick={() => setHistoryOpen(true)} className="pos-tap flex h-14 items-center justify-center rounded-lg bg-[var(--brand-primary-dark)] text-white disabled:opacity-35" aria-label="History">
                <History className="h-6 w-6" />
              </button>
            </div>
          </div>
        </section>

        {/* ── RIGHT: Catalog ── */}
        <section className="flex min-h-0 flex-col bg-[var(--pos-catalog-surface)] p-3">

          {/* Search */}
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--neutral-400)]" />
            <input type="text" placeholder="Search item name or code" value={search}
              ref={searchInputRef}
              readOnly
              inputMode="none"
              onFocus={(e) => { e.currentTarget.blur(); setSearchKbOpen(true) }}
              onClick={() => setSearchKbOpen(true)}
              className="w-full rounded-xl border border-[var(--border)] bg-white py-3 pl-11 pr-10 text-[var(--foreground)] placeholder:text-[var(--neutral-400)] shadow-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
              autoComplete="off" />
            {search.trim() ? (
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[var(--neutral-400)] hover:text-[var(--foreground)]" onClick={() => setSearch('')} aria-label="Clear search">
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="mb-2 flex items-center gap-2">
            <button
              type="button"
              className="pos-tap flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--brand-primary)] text-white disabled:opacity-35"
              disabled={catPage <= 0}
              onClick={() => setCatPage((p) => Math.max(0, p - 1))}
              aria-label="Previous categories"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div
              className="grid min-w-0 flex-1 gap-2 overflow-hidden"
              style={{ gridTemplateColumns: `repeat(${CATS_PER_PAGE}, minmax(0, 1fr))` }}
            >
              {visibleCats.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectCategory(c.id)}
                  className={`flex h-10 w-full items-center justify-center rounded-lg px-1.5 text-center text-xs font-bold leading-tight shadow ${c.colour} ${categoryId === c.id ? 'ring-2 ring-[var(--brand-accent)] ring-offset-1' : ''}`}
                >
                  <span className="line-clamp-2">{c.name.replace('★ ', '')}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="pos-tap flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--brand-primary)] text-white disabled:opacity-35"
              disabled={catPage >= catPages - 1}
              onClick={() => setCatPage((p) => Math.min(catPages - 1, p + 1))}
              aria-label="Next categories"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-[var(--neutral-200)]">
            <div className="h-full rounded-full bg-[var(--brand-primary)] transition-all" style={{ width: `${catProgress}%` }} />
          </div>

          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              className="pos-tap flex h-8 w-8 items-center justify-center rounded-md bg-[var(--brand-primary)] text-white"
              onClick={() => catalogScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
              aria-label="Back to top"
            >
              <Check className="h-4 w-4" />
            </button>
            <button type="button" className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-white px-2.5 py-1.5 text-xs font-medium"
              onClick={() => catalogScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}>
              <ChevronUp className="h-3.5 w-3.5" /> Top
            </button>
          </div>

          <div
            ref={catalogScrollRef}
            className="pos-scroll-visible pos-product-grid grid min-h-0 flex-1 p-0.5"
            style={{
              ['--pos-tile-min' as string]: `${Math.round(128 * (productTilePercent / 100))}px`,
              ['--pos-tile-font' as string]: `${(0.8 * (productTilePercent / 100)).toFixed(3)}rem`,
              ['--pos-tile-gap' as string]: `${Math.max(0.35, 0.55 * (productTilePercent / 100)).toFixed(2)}rem`,
            }}
          >
            {filteredProducts.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] px-6 py-16 text-center">
                <p className="text-sm font-semibold text-[var(--neutral-500)]">No products match</p>
              </div>
            ) : (
              filteredProducts.map((p) => (
                <div
                  key={p.id}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleProductTap(p) } }}
                  onMouseDown={() => handleProductLongPressStart(p)}
                  onMouseUp={() => handleProductLongPressEnd(p)}
                  onMouseLeave={() => {
                    if (longPressTimerRef.current) {
                      clearTimeout(longPressTimerRef.current)
                      longPressTimerRef.current = null
                    }
                  }}
                  onTouchStart={() => handleProductLongPressStart(p)}
                  onTouchEnd={() => handleProductLongPressEnd(p)}
                  onTouchCancel={() => {
                    if (longPressTimerRef.current) {
                      clearTimeout(longPressTimerRef.current)
                      longPressTimerRef.current = null
                    }
                  }}
                  className="product-tile group relative flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-[var(--pos-product-tile-border)] bg-[var(--pos-product-tile)] p-2 text-center text-stone-900 shadow-sm hover:border-[var(--brand-primary)]"
                >
                  <button
                    type="button"
                    className="absolute left-1 top-1 flex h-7 w-7 items-center justify-center rounded-md text-[var(--brand-accent-dark)]"
                    onClick={(e) => { e.stopPropagation(); toggleFav(p.id) }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                    aria-label={isFav(p.id) ? 'Remove from favourites' : 'Add to favourites'}
                  >
                    <Star className={`h-4 w-4 ${isFav(p.id) ? 'fill-[var(--brand-accent)] text-[var(--brand-accent-dark)]' : ''}`} />
                  </button>
                  {lines.find((l) => l.productId === p.id) ? (
                    <span className="absolute right-1 top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--brand-primary)] px-1 text-[11px] font-bold text-white">
                      {lines.find((l) => l.productId === p.id)?.qty}
                    </span>
                  ) : null}
                  <h3 className="line-clamp-3 px-1 text-sm font-semibold leading-tight">
                    {p.name}
                  </h3>
                  <span className="mt-1 text-sm font-bold tabular-nums">
                    Rs {p.unitPrice.toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* ── Modals ── */}
      <PaymentModal open={payOpen} onClose={() => setPayOpen(false)} onPay={handlePay} onDisplayBill={handleDisplayBill} total={sub} />
      <TransactionHistoryModal open={historyOpen} onClose={() => setHistoryOpen(false)} outletId={outletId} outletLabel={outletLabel} />
      {numpad ? (
        <QtyNumpad
          productName={numpad.name}
          initialQty={numpad.currentQty > 0 ? numpad.currentQty : 1}
          onConfirm={confirmNumpad}
          onCancel={() => setNumpad(null)}
        />
      ) : null}
      {diagnosticOpen ? (
        <DiagnosticPage onClose={() => { setDiagnosticOpen(false); void loadData() }} />
      ) : null}
      {searchKbOpen ? (
        <SearchKeyboard value={search} onChange={setSearch} onClose={() => setSearchKbOpen(false)} />
      ) : null}

      {/* ── Operations drawer (slides from left) ── */}
      {drawer ? (
        <div className="fixed inset-0 z-40 flex">
          <aside className="flex w-72 max-w-[85vw] flex-col border-r border-[var(--border)] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--brand-primary)] px-4 py-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/70">Menu</p>
                <span className="font-pos-title text-lg font-bold text-white">Operations</span>
              </div>
              <button type="button" onClick={() => setDrawer(false)} className="pos-tap rounded-lg p-2 text-white/80 hover:bg-white/10" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-1.5 p-3">
              <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Daily tasks</p>
              {canStockBfCreate || canStockBfView ? (
                <OpBtn icon={<Package className="h-5 w-5" />} label="Stock BF" hint="Enter opening stock for today" onClick={() => { onOpenScreen('stock-bf'); setDrawer(false) }} />
              ) : null}
              {canTransferCreate ? (
                <OpBtn icon={<Truck className="h-5 w-5" />} label="New Transfer" hint="Send stock to another showroom" onClick={() => { onOpenScreen('transfer'); setDrawer(false) }} />
              ) : null}
              {canTransferView ? (
                <OpBtn icon={<Inbox className="h-5 w-5" />} label="Pending Transfers" hint="Confirm goods arriving here" onClick={() => { onOpenScreen('transfers'); setDrawer(false) }} />
              ) : null}
              {hasPermission('order:create') ? (
                <OpBtn icon={<Package className="h-5 w-5" />} label="Order Request" hint="Create showroom custom order requests" onClick={() => { onOpenScreen('order-request'); setDrawer(false) }} />
              ) : null}
              {canDeliveryReturnCreate ? (
                <OpBtn icon={<Undo2 className="h-5 w-5" />} label="Delivery Return" hint="Return items to warehouse" onClick={() => { onOpenScreen('return'); setDrawer(false) }} />
              ) : null}
              {canCashierBalanceView || canCashierBalanceEdit ? (
                <OpBtn icon={<Wallet className="h-5 w-5" />} label="Cash Submission" hint="Day-end cashier totals" onClick={() => { onOpenScreen('cash'); setDrawer(false) }} />
              ) : null}
            </nav>

            {/* Tech settings */}
            <div className="mx-3 mb-3 rounded-xl border border-[var(--border)]">
              <button type="button" onClick={() => setTechOpen((v) => !v)}
                className="flex w-full items-center justify-between px-3 py-3 text-sm font-semibold text-[var(--foreground)]">
                <span className="flex items-center gap-2"><Settings2 className="h-4 w-4 text-[var(--muted-foreground)]" /> Technical</span>
                <ChevronRight className={`h-4 w-4 text-[var(--muted-foreground)] transition-transform ${techOpen ? 'rotate-90' : ''}`} />
              </button>
              {techOpen ? (
                <div className="space-y-3 border-t border-[var(--border)] px-3 py-3 text-xs">
                  <div>
                    <p className="mb-1 font-semibold text-[var(--muted-foreground)]">Product button size</p>
                    <div className="flex items-center gap-1">
                      <button type="button" className="pos-tap rounded-lg border border-[var(--border)] px-2 py-1 text-[var(--foreground)]" onClick={() => setProductTilePercent(productTilePercent - 10)}>-</button>
                      <span className="flex-1 text-center text-sm font-semibold tabular-nums">{productTilePercent}%</span>
                      <button type="button" className="pos-tap rounded-lg border border-[var(--border)] px-2 py-1 text-[var(--foreground)]" onClick={() => setProductTilePercent(productTilePercent + 10)}>+</button>
                    </div>
                    <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">Catalogue cards only — does not change screen zoom.</p>
                  </div>
                  {user?.isSuperAdmin ? (
                    <label className="block">
                      <span className="font-semibold text-[var(--muted-foreground)]">Showroom Code</span>
                      <input
                        value={assignedShowroomCode}
                        onChange={(e) => setAssignedShowroomCode(e.target.value)}
                        placeholder="e.g. DBQ"
                        className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--neutral-50)] px-2 py-1.5 font-mono uppercase text-[var(--foreground)]"
                      />
                      <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">
                        Must match the Code field on DMS → Showroom. Cashiers cannot change this.
                      </p>
                    </label>
                  ) : null}
                  <label className="flex cursor-pointer items-center gap-2">
                    <input type="checkbox" checked={autoPrint} onChange={(e) => setAutoPrint(e.target.checked)} className="h-4 w-4 rounded accent-[var(--brand-primary)]" />
                    <span className="font-semibold text-[var(--foreground)]">Auto-print receipt after payment</span>
                  </label>
                  <label className="block">
                    <span className="font-semibold text-[var(--muted-foreground)]">Receipt phone (printed footer)</span>
                    <input value={receiptPhone} onChange={(e) => setReceiptPhone(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--neutral-50)] px-2 py-1.5 text-[var(--foreground)]" />
                  </label>
                  <label className="block">
                    <span className="font-semibold text-[var(--muted-foreground)]">Receipt address line</span>
                    <input value={receiptAddress} onChange={(e) => setReceiptAddress(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--neutral-50)] px-2 py-1.5 text-[var(--foreground)]" />
                  </label>
                  <p className="text-[var(--muted-foreground)]">Cache: <span className="font-medium text-[var(--foreground)]">{cacheUpdatedAt ? new Date(cacheUpdatedAt).toLocaleString() : '—'}</span></p>
                </div>
              ) : null}
            </div>

            <div className="mt-auto border-t border-[var(--border)] px-4 py-3 text-[11px] text-[var(--muted-foreground)]">
              Connect online at least once to cache the product catalogue for offline use.
            </div>
          </aside>
          <button type="button" className="flex-1 bg-black/50" aria-label="Close menu" onClick={() => setDrawer(false)} />
        </div>
      ) : null}
    </div>
  )
}

// ── Small helpers ──────────────────────────────────────────────────────────────

function MenuAction({ icon, label, onClick, textClass = 'text-[var(--foreground)]' }: { icon: ReactNode; label: string; onClick: () => void; textClass?: string }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm hover:bg-[var(--neutral-50)] ${textClass}`}>
      {icon}
      <span>{label}</span>
    </button>
  )
}

function OpBtn({ icon, label, hint, onClick }: { icon: ReactNode; label: string; hint?: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="flex w-full items-start gap-3 rounded-xl border border-[var(--border)] px-3 py-3 text-left transition hover:border-[var(--brand-primary)]/40 hover:bg-[var(--neutral-50)]">
      <span className="mt-0.5 flex-shrink-0 text-[var(--brand-primary)]">{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-[var(--foreground)]">{label}</span>
        {hint ? <span className="mt-0.5 block text-xs text-[var(--muted-foreground)]">{hint}</span> : null}
      </span>
    </button>
  )
}
