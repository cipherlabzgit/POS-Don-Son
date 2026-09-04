import { useEffect, useMemo, useState } from 'react'
import { useCartStore } from '../lib/cart-store'
import { useSettingsStore } from '../lib/settings-store'
import { isElectronPos } from '../lib/print-receipt'

type CartSnap = {
  lines: { productId: string; name: string; qty: number; unitPrice: number }[]
  total: number
  change?: number
  thankYou?: boolean
}

type Props = { onBack?: () => void; standalone?: boolean }

export function isCustomerDisplayWindow() {
  return typeof window !== 'undefined' && window.location.hash.includes('customer-display')
}

export function CustomerViewPage({ onBack, standalone = false }: Props) {
  const storeLines = useCartStore((s) => s.lines)
  const storeTotal = useCartStore((s) => s.subtotal())
  const outletLabel = useSettingsStore((s) => s.outletLabel)
  const [remote, setRemote] = useState<CartSnap | null>(null)
  const [clock, setClock] = useState(() => new Date())

  useEffect(() => {
    useSettingsStore.getState().applyThemeColors()
    const id = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!standalone) return
    return window.dmsPos?.onCustomerCart?.((payload) => setRemote(payload))
  }, [standalone])

  const lines = standalone && remote ? remote.lines : storeLines
  const total = standalone && remote ? remote.total : storeTotal
  const thankYou = Boolean(standalone && remote?.thankYou)
  const change = standalone && remote ? Number(remote.change ?? 0) : 0
  const lastId = lines[lines.length - 1]?.productId

  const timeLabel = useMemo(
    () => clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    [clock],
  )

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-[#fff7f8] text-stone-900">
      <header className="flex flex-shrink-0 items-center justify-between bg-[var(--brand-primary)] px-8 py-4 text-white shadow-md">
        <div>
          <p className="font-pos-title text-3xl font-extrabold leading-none">Don &amp; Sons</p>
          <p className="mt-1 text-sm text-white/80">{outletLabel || 'Point of Sale'}</p>
        </div>
        <div className="text-right">
          <p className="font-pos-title text-3xl font-bold tabular-nums">{timeLabel}</p>
          <p className="text-xs uppercase tracking-widest text-white/70">Customer Display</p>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col px-8 py-6">
        {thankYou ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <p className="font-pos-title text-5xl font-extrabold text-[var(--brand-primary)]">Thank you</p>
            <p className="mt-3 text-xl text-stone-600">Please collect your change</p>
            <p className="font-pos-title mt-6 text-6xl font-extrabold tabular-nums text-[var(--brand-primary)]">
              Rs {change.toFixed(2)}
            </p>
          </div>
        ) : lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <p className="font-pos-title text-5xl font-extrabold text-[var(--brand-primary)]">Welcome</p>
            <p className="mt-3 max-w-xl text-xl text-stone-600">
              Your bill will appear here as items are added.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[1fr_6rem_9rem] gap-4 border-b-2 border-[var(--brand-primary)] pb-2 text-sm font-bold uppercase tracking-widest text-[var(--brand-primary)]">
              <span>Item</span>
              <span className="text-center">Qty</span>
              <span className="text-right">Amount</span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto py-2">
              {lines.map((l) => {
                const active = l.productId === lastId
                return (
                  <div
                    key={l.productId}
                    className={`grid grid-cols-[1fr_6rem_9rem] gap-4 rounded-xl px-3 py-3 text-2xl ${
                      active ? 'bg-[var(--brand-accent)]/35' : ''
                    }`}
                  >
                    <span className="font-semibold">{l.name}</span>
                    <span className="text-center tabular-nums">{l.qty}</span>
                    <span className="text-right font-bold tabular-nums">
                      {(l.qty * l.unitPrice).toFixed(2)}
                    </span>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </main>

      <footer className="flex flex-shrink-0 items-center justify-between bg-[var(--brand-primary)] px-8 py-5 text-white">
        <p className="text-lg font-semibold uppercase tracking-wide text-white/80">Total</p>
        <p className="font-pos-title text-5xl font-extrabold tabular-nums text-[var(--brand-accent)]">
          Rs {thankYou ? change.toFixed(2) : total.toFixed(2)}
        </p>
      </footer>

      {!standalone && !isElectronPos() && onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="absolute bottom-3 left-3 rounded-lg border border-white/30 bg-black/20 px-3 py-1.5 text-xs text-white/80"
        >
          Back to POS
        </button>
      ) : null}
    </div>
  )
}
