import { useState, useEffect, useRef } from 'react'
import { X, Banknote, CreditCard } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
  onPay: (method: 'Cash' | 'Card', cashReceived?: number, change?: number) => void
  onDisplayBill: (cashReceived?: number, change?: number) => void
  total: number
}

export function PaymentModal({ open, onClose, onPay, onDisplayBill, total }: Props) {
  const [method, setMethod] = useState<'Cash' | 'Card'>('Cash')
  const [cashReceived, setCashReceived] = useState('')
  const cashInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && method === 'Cash') {
      setCashReceived('')
      setTimeout(() => cashInputRef.current?.focus(), 100)
    }
  }, [open, method])

  if (!open) return null

  const cashAmount = parseFloat(cashReceived) || 0
  const change = method === 'Cash' ? Math.max(0, cashAmount - total) : 0
  const isValid = method === 'Card' || (cashAmount >= total && cashAmount > 0)

  const handleCompleteSale = () => {
    if (!isValid) return
    if (method === 'Cash') {
      onPay(method, cashAmount, change)
    } else {
      onPay(method, total, 0)
    }
  }

  const handleQuickCash = (amount: number) => {
    setCashReceived(amount.toFixed(2))
    setTimeout(() => cashInputRef.current?.focus(), 0)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-[var(--foreground)] shadow-2xl">
        <button
          type="button"
          className="absolute right-4 top-4 rounded-lg p-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="font-pos-title mb-1 text-center text-2xl font-bold text-[var(--foreground)]">
          Take payment
        </h2>
        <p className="mb-6 text-center text-sm text-[var(--muted-foreground)]">
          {method === 'Cash' ? 'Enter cash received from customer' : 'Process card payment'}
        </p>
        
        <div className="mb-6 rounded-xl bg-[var(--muted)] px-4 py-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            Amount due
          </p>
          <p className="font-pos-title mt-1 text-3xl font-bold tabular-nums text-[var(--foreground)]">
            Rs {total.toFixed(2)}
          </p>
        </div>

        <div className="mb-6 flex gap-3">
          <button
            type="button"
            onClick={() => setMethod('Cash')}
            className={`pos-tap flex flex-1 flex-col items-center gap-2 rounded-xl py-5 text-lg font-semibold text-white transition ${
              method === 'Cash'
                ? 'bg-[var(--brand-primary)] ring-2 ring-[var(--brand-accent)]'
                : 'bg-[var(--brand-primary-dark)]/90'
            }`}
          >
            <Banknote className="h-8 w-8" />
            Cash
          </button>
          <button
            type="button"
            onClick={() => setMethod('Card')}
            className={`pos-tap flex flex-1 flex-col items-center gap-2 rounded-xl py-5 text-lg font-semibold text-white transition ${
              method === 'Card'
                ? 'bg-[var(--status-info)] ring-2 ring-sky-200'
                : 'bg-sky-700/90'
            }`}
          >
            <CreditCard className="h-8 w-8" />
            Card
          </button>
        </div>

        {method === 'Cash' && (
          <div className="mb-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
                Cash Received
              </label>
              <input
                ref={cashInputRef}
                type="text"
                inputMode="numeric"
                value={cashReceived}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, '')
                  if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
                    setCashReceived(val)
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isValid) {
                    handleCompleteSale()
                  }
                }}
                placeholder="0.00"
                className="w-full rounded-xl border-2 border-[var(--border)] bg-white px-4 py-4 text-2xl font-bold tabular-nums text-[var(--foreground)] text-center focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[5000, 2000, 1000, 500, 200, 100, 50].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => handleQuickCash(amount)}
                  className="pos-tap rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--foreground)] hover:border-[var(--brand-primary)] hover:bg-[var(--neutral-50)]"
                >
                  Rs {amount.toFixed(2)}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleQuickCash(Math.ceil(total / 100) * 100)}
                className="pos-tap rounded-lg border border-[var(--border)] bg-[var(--brand-accent)]/20 px-3 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--brand-accent)]/30"
              >
                Exact+
              </button>
            </div>

            {cashAmount > 0 && (
              <div className={`rounded-xl px-5 py-5 text-center ${
                cashAmount >= total 
                  ? 'bg-emerald-50 border-2 border-emerald-500' 
                  : 'bg-red-50 border-2 border-red-500'
              }`}>
                <p className={`text-sm font-bold uppercase tracking-wider mb-2 ${
                  cashAmount >= total 
                    ? 'text-emerald-700' 
                    : 'text-red-700'
                }`}>
                  {cashAmount >= total ? '💰 CHANGE TO RETURN' : '⚠️ INSUFFICIENT AMOUNT'}
                </p>
                <p className={`font-pos-title text-5xl font-extrabold tabular-nums ${
                  cashAmount >= total 
                    ? 'text-emerald-600' 
                    : 'text-red-600'
                }`}>
                  Rs {cashAmount >= total ? change.toFixed(2) : (total - cashAmount).toFixed(2)}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <button
            type="button"
            className="pos-tap w-full rounded-xl border-2 border-[var(--brand-primary)] bg-white py-3 text-base font-semibold text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5"
            onClick={() => onDisplayBill(method === 'Cash' ? cashAmount : total, method === 'Cash' ? change : 0)}
          >
            Display Bill
          </button>
          
          <div className="flex gap-3">
            <button
              type="button"
              disabled={!isValid}
              className="pos-tap flex-1 rounded-xl bg-[var(--brand-accent)] py-4 text-lg font-bold text-neutral-900 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
              onClick={handleCompleteSale}
            >
              Complete sale
            </button>
            <button
              type="button"
              className="pos-tap flex-1 rounded-xl border border-[var(--border)] py-4 text-lg font-semibold text-[var(--foreground)] hover:bg-[var(--muted)]"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
