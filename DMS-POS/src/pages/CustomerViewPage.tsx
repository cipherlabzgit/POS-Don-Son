import { useCartStore } from '../lib/cart-store'
import { useSettingsStore } from '../lib/settings-store'

type Props = { onBack: () => void }

/**
 * Full-screen customer-facing display — intended for a second monitor or
 * turned screen facing the shopper. Shows the live bill and total in large text.
 */
export function CustomerViewPage({ onBack }: Props) {
  const lines      = useCartStore((s) => s.lines)
  const total      = useCartStore((s) => s.subtotal())
  const outletLabel = useSettingsStore((s) => s.outletLabel)

  return (
    <div className="flex min-h-screen flex-col bg-[var(--neutral-900)] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[var(--brand-primary)] px-6 py-4 text-center">
        <h1 className="font-pos-title text-2xl font-bold text-white sm:text-3xl">
          {outletLabel || 'Don & Sons'}
        </h1>
        <p className="mt-0.5 text-sm text-white/70">Customer View</p>
      </header>

      {/* Bill area */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
          {lines.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
              <p className="text-2xl font-semibold text-white/60">No items yet</p>
              <p className="mt-2 text-sm text-white/40">
                The cashier is preparing your order…
              </p>
            </div>
          ) : (
            <>
              {/* Column headers */}
              <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-white/10 px-6 py-4 text-sm font-bold uppercase tracking-widest text-white/50">
                <span>Item</span>
                <span className="text-center">Qty</span>
                <span className="text-right">Amount</span>
              </div>

              {/* Lines */}
              <div className="divide-y divide-white/10">
                {lines.map((l) => (
                  <div key={l.productId} className="grid grid-cols-[1fr_auto_auto] gap-4 px-6 py-4 text-lg">
                    <span className="font-medium text-white">{l.name}</span>
                    <span className="text-center tabular-nums text-white/70">{l.qty}</span>
                    <span className="text-right tabular-nums font-semibold text-[var(--brand-accent)]">
                      {(l.qty * l.unitPrice).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Total */}
        <div className="mt-6 w-full max-w-2xl rounded-2xl border-2 border-[var(--brand-accent)]/50 bg-[var(--brand-accent)]/10 px-8 py-6 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-[var(--brand-accent)]/70">Total</p>
          <p className="font-pos-title mt-1 text-5xl font-extrabold tabular-nums text-[var(--brand-accent)] sm:text-6xl">
            Rs {total.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-3 text-center">
        <div className="flex items-center justify-between">
          <p className="text-xs text-white/30">Don &amp; Sons (Pvt) Ltd — DMS POS</p>
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg border border-white/20 px-4 py-2 text-xs font-semibold text-white/60 hover:border-white/40 hover:text-white"
          >
            ← Back to POS
          </button>
        </div>
      </footer>
    </div>
  )
}
