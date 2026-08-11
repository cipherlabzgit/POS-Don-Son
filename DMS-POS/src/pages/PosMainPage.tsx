import {
  useCallback, useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react'
import {
  ChevronLeft, ChevronRight, ChevronUp,
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
import { fetchOutletsPage, getApiBaseUrl, postPosSale } from '../lib/api'
import { enqueueMutation, processPendingQueue } from '../lib/sync-queue'
import { useOnlineStatus } from '../lib/use-online-status'
import { printReceiptHtml, type PrintReceiptOpts } from '../lib/print-receipt'
import { toast } from '../lib/toast-store'
import { OnlineBadge } from '../components/OnlineBadge'
import { PaymentModal } from '../components/PaymentModal'
import { TransactionHistoryModal } from '../components/TransactionHistoryModal'
import { PrintPreviewModal } from '../components/PrintPreviewModal'
import { QtyNumpad } from '../components/QtyNumpad'
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
  const setOutlet   = useSettingsStore((s) => s.setOutlet)
  const apiBaseUrl  = useSettingsStore((s) => s.apiBaseUrl)
  const setApiBaseUrl = useSettingsStore((s) => s.setApiBaseUrl)
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
  const [outletMenu, setOutletMenu]   = useState(false)
  const [search, setSearch]           = useState('')
  const [catScroll, setCatScroll]     = useState(0)
  const [categoryId, setCategoryId]   = useState<string>('all')
  const [payOpen, setPayOpen]         = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [printPreview, setPrintPreview] = useState<PrintReceiptOpts | null>(null)
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

  // ── Outlets load ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken) return
    void (async () => {
      try {
        const data = await fetchOutletsPage(1, 100)
        const rows = (data.outlets as Record<string, unknown>[]).map((o) => ({
          id: String(o.id ?? o.Id ?? ''),
          code: String(o.code ?? o.Code ?? ''),
          name: String(o.name ?? o.Name ?? ''),
          address: String(o.address ?? o.Address ?? ''),
          phone: String(o.phone ?? o.Phone ?? ''),
        })).filter((o) => o.id)
        setOutlets(rows)
        if (!outletId && rows.length === 1) setOutlet(rows[0].id, rows[0].name || rows[0].code)
        if (!outletId && rows.length > 1) {
          // Prefer City Outlet / first showroom so payments are not blocked after login
          const preferred =
            rows.find((o) => /city/i.test(o.name) || /city/i.test(o.code)) ?? rows[0]
          setOutlet(preferred.id, preferred.name || preferred.code)
        }
      } catch { /* offline */ }
    })()
  }, [accessToken, outletId, setOutlet])

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
        if (printPreview) { e.preventDefault(); setPrintPreview(null); return }
        if (syncPopoverOpen) { e.preventDefault(); setSyncPopoverOpen(false) }
        return
      }
      if (e.key === '/' || e.key === 'F3') {
        if (e.key === '/' && typing) return
        e.preventDefault()
        searchInputRef.current?.focus()
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
  }, [payOpen, numpad, historyOpen, printPreview, syncPopoverOpen, lines.length, outletId, canSaleCreate, loadData])

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

  const CAT_PAGE = 8

  function selectCategory(id: string) {
    setCategoryId(id)
    const idx = catRow.findIndex((c) => c.id === id)
    if (idx < 0) return
    const maxScroll = Math.max(0, catRow.length - CAT_PAGE)
    const target = Math.min(Math.max(0, idx - CAT_PAGE + 1), maxScroll)
    setCatScroll(target)
  }

  const sub = subtotal()

  // ── Current outlet details ─────────────────────────────────────────────────
  const currentOutlet = useMemo(() => outlets.find((o) => o.id === outletId), [outlets, outletId])
  const receiptCompanyAddress = currentOutlet?.address || receiptAddress || 'NO: 302/D, OLD KANDY ROAD,\nDALUGAMA, KELANIYA'
  const receiptCompanyPhone = currentOutlet?.phone || receiptPhone || '011-2911412/076-8214432'

  // ── Payment ─────────────────────────────────────────────────────────────────
  async function handlePay(method: 'Cash' | 'Card', cashReceived?: number, change?: number) {
    if (!canSaleCreate) { toast('You do not have permission to complete sales.', 'error'); return }
    if (!outletId) { toast('Select a showroom first.', 'error'); return }
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
  function handlePrint() {
    const now = new Date()
    const dateTimeStr = now.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }) + ' ' + 
                       now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })
    
    if (lines.length > 0) {
      setPrintPreview({
        title: 'DON & SONS (PVT) LTD',
        companyAddress: receiptCompanyAddress,
        companyPhone: `Tel:${receiptCompanyPhone}`,
        outletLabel,
        lines: lines.map((l) => ({ name: l.name, unitPrice: l.unitPrice, qty: l.qty, amount: l.qty * l.unitPrice })),
        total: sub,
        cash: sub,
        change: 0,
        dateTime: dateTimeStr,
        cashier: user ? `${user.firstName} ${user.lastName}`.trim() : '',
        footerLines: ['FOOD ARE NOT RETURNABLE', 'COMPLAINT MUST BE LODGED BEFORE', '12 NOON NEXT DAY'],
      })
      return
    }
    if (lastReceipt) {
      setPrintPreview({
        title: 'DON & SONS (PVT) LTD',
        companyAddress: receiptCompanyAddress,
        companyPhone: `Tel:${receiptCompanyPhone}`,
        outletLabel: lastReceipt.outletLabel,
        lines: lastReceipt.lines,
        total: lastReceipt.total,
        cash: lastReceipt.cash,
        change: lastReceipt.change,
        dateTime: lastReceipt.dateTime || dateTimeStr,
        cashier: user ? `${user.firstName} ${user.lastName}`.trim() : '',
        paymentMethod: lastReceipt.paymentMethod,
        saleNo: lastReceipt.saleNo,
        footerLines: ['FOOD ARE NOT RETURNABLE', 'COMPLAINT MUST BE LODGED BEFORE', '12 NOON NEXT DAY'],
      })
      return
    }
    toast('Add items to print a preview, or complete a sale first.', 'info')
  }

  // ── Display Bill (during payment) ──────────────────────────────────────────
  function handleDisplayBill(cashReceived?: number, change?: number) {
    if (lines.length === 0) return
    const now = new Date()
    const dateTimeStr = now.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }) + ' ' + 
                       now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })
    
    setPrintPreview({
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

          {/* Showroom pill */}
          <div className="relative">
            <button type="button" onClick={() => setOutletMenu((v) => !v)}
              className="flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20">
              <span className="max-w-[8rem] truncate">{outletLabel || 'Select showroom'}</span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 rotate-90" />
            </button>
            {outletMenu ? (
              <ul className="absolute right-0 top-full z-50 mt-1 min-w-[12rem] rounded-xl border border-[var(--border)] bg-white py-1 shadow-xl">
                {outlets.map((o) => (
                  <li key={o.id}>
                    <button type="button" className="w-full px-4 py-2.5 text-left text-sm hover:bg-[var(--neutral-50)]"
                      onClick={() => { setOutlet(o.id, o.name || o.code); setOutletMenu(false) }}>
                      <span className="font-semibold text-[var(--foreground)]">{o.name}</span>
                      {' '}<span className="text-[var(--muted-foreground)]">({o.code})</span>
                    </button>
                  </li>
                ))}
                {outlets.length === 0 && <li className="px-4 py-3 text-xs text-[var(--muted-foreground)]">No showrooms available</li>}
              </ul>
            ) : null}
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
          ⚠ Select a showroom from the header to enable payments.
        </div>
      ) : null}

      {/* ── Main body: bill | catalog ── */}
      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(280px,32%)_1fr]"
        style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: `${100 / scale}%`, height: `${100 / scale}%` }}>

        {/* ── LEFT: Bill panel ── */}
        <section className="flex min-h-0 flex-col border-r border-[var(--border)] bg-white">

          <div className="flex-shrink-0 border-b border-[var(--border)] bg-[var(--neutral-50)] px-4 py-3">
            <h2 className="font-pos-title text-lg font-bold text-[var(--foreground)]">Current Bill</h2>
            <p className="text-xs text-[var(--muted-foreground)]">Tap a product on the right to add it</p>
          </div>

          {/* Lines table */}
          <div className="pos-scroll-light min-h-0 flex-1 overflow-auto">
            {lines.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
                <p className="text-sm font-semibold text-[var(--neutral-500)]">No items yet</p>
                <p className="max-w-xs text-xs text-[var(--neutral-400)]">Browse categories on the right and tap any product to add it here.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--neutral-50)] text-xs font-semibold uppercase text-[var(--muted-foreground)]">
                  <tr>
                    <th className="px-3 py-2.5">Item</th>
                    <th className="px-3 py-2.5 text-center">Qty</th>
                    <th className="px-3 py-2.5 text-right">Amount</th>
                    <th className="w-9 px-3 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {lines.map((l) => (
                    <tr key={l.productId} className="hover:bg-[var(--neutral-50)]">
                      <td className="px-3 py-2.5 text-sm font-medium text-[var(--foreground)]">{l.name}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-center gap-1">
                          <button type="button" className="pos-tap rounded-lg bg-red-50 px-2 text-red-600 hover:bg-red-100" onClick={() => dec(l.productId)} aria-label={`Decrease ${l.name}`}>
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" className="min-w-[2rem] text-center text-sm font-bold tabular-nums text-[var(--foreground)] hover:text-[var(--brand-primary)]"
                            onClick={() => setNumpad({ productId: l.productId, name: l.name, currentQty: l.qty })} title="Edit quantity">
                            {l.qty}
                          </button>
                          <button type="button" className="pos-tap rounded-lg border border-[var(--border)] bg-white px-2 text-[var(--foreground)] hover:border-[var(--brand-primary)] hover:bg-[var(--neutral-50)]" onClick={() => inc(l.productId)} aria-label={`Increase ${l.name}`}>
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right text-sm font-semibold tabular-nums">
                        Rs {(l.qty * l.unitPrice).toFixed(2)}
                      </td>
                      <td className="px-3 py-2.5">
                        <button type="button" className="pos-tap rounded-lg p-1 text-red-500 hover:bg-red-50" onClick={() => remove(l.productId)} aria-label={`Remove ${l.name}`}>
                          <X className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Total + actions */}
          <div className="flex-shrink-0 border-t border-[var(--border)] bg-white px-4 py-3 space-y-3">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Total</p>
                <p className="font-pos-title text-2xl font-bold tabular-nums text-[var(--foreground)]">
                  Rs {sub.toFixed(2)}
                </p>
              </div>
              {lines.length > 0 ? (
                <button type="button" onClick={() => { clear(); toast('Bill cleared.', 'info') }}
                  className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--muted-foreground)] hover:border-red-300 hover:text-red-600">
                  Clear bill
                </button>
              ) : null}
            </div>

            <button type="button" disabled={lines.length === 0 || !outletId || !canSaleCreate} onClick={() => lines.length > 0 && outletId && canSaleCreate && setPayOpen(true)}
              className="w-full rounded-xl bg-[var(--brand-primary)] py-4 text-lg font-bold text-white shadow-md transition hover:bg-[var(--brand-primary-dark)] disabled:cursor-not-allowed disabled:opacity-40">
              PAY
            </button>

            <div className="grid grid-cols-3 gap-2">
              <ActionBtn icon={<Users className="h-5 w-5 text-[var(--brand-primary)]" />} label="Customer" onClick={onCustomerView} />
              <ActionBtn icon={<Printer className="h-5 w-5 text-[var(--brand-accent-dark)]" />} label="Print" accent onClick={handlePrint} />
              <ActionBtn icon={<History className="h-5 w-5 text-[var(--neutral-600)]" />} label="History" dark onClick={() => setHistoryOpen(true)} disabled={!canSaleView} />
            </div>
          </div>
        </section>

        {/* ── RIGHT: Catalog ── */}
        <section className="flex min-h-0 flex-col bg-[var(--neutral-50)] p-3">

          {/* Search */}
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--neutral-400)]" />
            <input type="search" placeholder="Search item name or code" value={search}
              ref={searchInputRef}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-white py-3 pl-11 pr-10 text-[var(--foreground)] placeholder:text-[var(--neutral-400)] shadow-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
              autoComplete="off" />
            {search.trim() ? (
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[var(--neutral-400)] hover:text-[var(--foreground)]" onClick={() => setSearch('')} aria-label="Clear search">
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          {/* Category pills row */}
          <div className="mb-3 flex items-center gap-2">
            <button type="button" className="pos-tap flex-shrink-0 rounded-xl border border-[var(--border)] bg-white p-2 shadow-sm hover:bg-[var(--neutral-100)]"
              onClick={() => setCatScroll((s) => Math.max(0, s - 1))} aria-label="Previous categories">
              <ChevronLeft className="h-5 w-5 text-[var(--neutral-600)]" />
            </button>
            <div className="flex flex-1 gap-2 overflow-x-hidden">
              {catRow.slice(catScroll, catScroll + CAT_PAGE).map((c) => (
                <button key={c.id} type="button" onClick={() => selectCategory(c.id)}
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold shadow transition whitespace-nowrap ${c.colour} ${categoryId === c.id ? 'ring-2 ring-[var(--brand-primary)] ring-offset-2' : 'opacity-90 hover:opacity-100'}`}>
                  {c.name}
                </button>
              ))}
            </div>
            <button type="button" className="pos-tap flex-shrink-0 rounded-xl border border-[var(--border)] bg-white p-2 shadow-sm hover:bg-[var(--neutral-100)]"
              onClick={() => setCatScroll((s) => Math.min(Math.max(0, catRow.length - CAT_PAGE), s + 1))} aria-label="Next categories">
              <ChevronRight className="h-5 w-5 text-[var(--neutral-600)]" />
            </button>
          </div>

          {/* Count + Top */}
          <div className="mb-2 flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <span>{filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}</span>
            <button type="button" className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-white px-2.5 py-1.5 text-xs font-medium hover:bg-[var(--neutral-100)]"
              onClick={() => catalogScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}>
              <ChevronUp className="h-3.5 w-3.5" /> Top
            </button>
          </div>

          {/* Product grid — auto-fill columns, uniform aspect tiles, rows do not stretch */}
          <div
            ref={catalogScrollRef}
            className="pos-scroll pos-product-grid grid min-h-0 flex-1 overflow-y-auto p-0.5"
            style={{
              ['--pos-tile-min' as string]: `${Math.round(140 * (productTilePercent / 100))}px`,
              ['--pos-tile-font' as string]: `${(0.875 * (productTilePercent / 100)).toFixed(3)}rem`,
              ['--pos-tile-gap' as string]: `${Math.max(0.35, 0.75 * (productTilePercent / 100)).toFixed(2)}rem`,
            }}
          >
            {filteredProducts.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] px-6 py-16 text-center">
                <p className="text-sm font-semibold text-[var(--neutral-500)]">No products match</p>
                <p className="mt-1 text-xs text-[var(--neutral-400)]">Try a different category or clear the search.</p>
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
                  className="product-tile group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-white p-3 text-left text-stone-900 shadow-sm hover:border-[var(--brand-primary)] hover:shadow-md"
                >
                  <div className="flex shrink-0 items-start justify-between gap-1 mb-2">
                    <button
                      type="button"
                      className="-m-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-[var(--brand-primary)]"
                      onClick={(e) => { e.stopPropagation(); toggleFav(p.id) }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onMouseUp={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      onTouchEnd={(e) => e.stopPropagation()}
                      aria-label={isFav(p.id) ? 'Remove from favourites' : 'Add to favourites'}
                    >
                      <Star className={`h-4 w-4 ${isFav(p.id) ? 'fill-[var(--brand-primary)] text-[var(--brand-primary)]' : ''}`} />
                    </button>
                    {lines.find((l) => l.productId === p.id) ? (
                      <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--brand-primary)] px-1.5 text-[11px] font-bold text-white">
                        {lines.find((l) => l.productId === p.id)?.qty}
                      </span>
                    ) : (
                      <span className="h-6 w-6 shrink-0" aria-hidden />
                    )}
                  </div>
                  <div className="min-h-0 flex-1 overflow-hidden mb-3">
                    <h3 className="line-clamp-3 text-sm font-semibold leading-tight text-stone-800">
                      {p.name}
                    </h3>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1.5 border-t border-stone-200/80 pt-2.5">
                    <span className="product-tile-price text-base font-bold tabular-nums text-stone-900">
                      Rs {p.unitPrice.toFixed(2)}
                    </span>
                    <span className="truncate font-mono text-[10px] font-medium text-stone-500">
                      {p.code}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* ── Modals ── */}
      <PaymentModal open={payOpen} onClose={() => setPayOpen(false)} onPay={handlePay} onDisplayBill={handleDisplayBill} total={sub} />
      <TransactionHistoryModal open={historyOpen} onClose={() => setHistoryOpen(false)} outletId={outletId} outletLabel={outletLabel} />
      {printPreview ? (
        <PrintPreviewModal opts={printPreview} onClose={() => setPrintPreview(null)} />
      ) : null}
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
                  <label className="block">
                    <span className="font-semibold text-[var(--muted-foreground)]">API base URL</span>
                    <input value={apiBaseUrl} onChange={(e) => setApiBaseUrl(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--neutral-50)] px-2 py-1.5 font-mono text-[11px] text-[var(--foreground)]" />
                  </label>
                  <div>
                    <p className="mb-1 font-semibold text-[var(--muted-foreground)]">Product button size</p>
                    <div className="flex items-center gap-1">
                      <button type="button" className="pos-tap rounded-lg border border-[var(--border)] px-2 py-1 text-[var(--foreground)]" onClick={() => setProductTilePercent(productTilePercent - 10)}>-</button>
                      <span className="flex-1 text-center text-sm font-semibold tabular-nums">{productTilePercent}%</span>
                      <button type="button" className="pos-tap rounded-lg border border-[var(--border)] px-2 py-1 text-[var(--foreground)]" onClick={() => setProductTilePercent(productTilePercent + 10)}>+</button>
                    </div>
                    <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">Catalogue cards only — does not change screen zoom.</p>
                  </div>
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
                  <p className="text-[var(--muted-foreground)]">Active: <span className="font-mono text-[var(--foreground)]">{getApiBaseUrl()}</span></p>
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

function ActionBtn({ icon, label, onClick, accent, dark, disabled }: { icon: ReactNode; label: string; onClick: () => void; accent?: boolean; dark?: boolean; disabled?: boolean }) {
  const base = 'flex flex-col items-center gap-1 rounded-xl border py-3 text-xs font-semibold shadow-sm transition hover:brightness-95'
  const cls = accent
    ? `${base} border-[var(--brand-accent)] bg-[var(--brand-accent)] text-neutral-900`
    : dark
    ? `${base} border-[var(--neutral-700)] bg-[var(--neutral-800)] text-white`
    : `${base} border-[var(--border)] bg-white text-[var(--foreground)] hover:bg-[var(--neutral-50)]`
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={`${cls} disabled:cursor-not-allowed disabled:opacity-35`}>
      {icon}
      <span>{label}</span>
    </button>
  )
}

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
