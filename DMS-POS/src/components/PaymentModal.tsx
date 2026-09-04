import { useState, useEffect } from 'react'
import { X, Banknote, CreditCard } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
  onPay: (method: 'Cash' | 'Card', cashReceived?: number, change?: number) => void
  total: number
}

const KEY_CLS =
  'pos-tap flex h-14 items-center justify-center rounded-xl text-lg font-bold ' +
  'bg-[var(--brand-primary)] text-white shadow-sm hover:bg-[var(--brand-primary-dark)] active:scale-95'

export function PaymentModal({ open, onClose, onPay, total }: Props) {
  const [method, setMethod] = useState<'Cash' | 'Card'>('Cash')
  const [cashReceived, setCashReceived] = useState('')

  useEffect(() => {
    if (open) {
      setCashReceived('')
      setMethod('Cash')
    }
  }, [open])

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

  function press(key: string) {
    setCashReceived((prev) => {
      if (key === 'C') return ''
      if (key === '+1000') {
        const next = (parseFloat(prev) || 0) + 1000
        return next.toFixed(2).replace(/\.00$/, '')
      }
      if (key === '.') {
        if (!prev) return '0.'
        if (prev.includes('.')) return prev
        return `${prev}.`
      }
      if (key === '00' || key === '000') {
        if (!prev || prev === '0') return '0'
        const [whole, frac] = prev.split('.')
        if (frac !== undefined) return prev
        return whole + key
      }
      if (!/^\d$/.test(key)) return prev
      if (!prev || prev === '0') return key
      const [, frac] = prev.split('.')
      if (frac !== undefined && frac.length >= 2) return prev
      return prev + key
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-5 text-[var(--foreground)] shadow-2xl">
        <button
          type="button"
          className="absolute right-4 top-4 rounded-lg p-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="font-pos-title mb-1 text-center text-xl font-bold">Take payment</h2>
        <p className="mb-4 text-center text-sm text-[var(--muted-foreground)]">Select Payment Method</p>

        <div className="mb-4 flex gap-3">
          <button
            type="button"
            onClick={() => setMethod('Cash')}
            className={`pos-tap flex flex-1 items-center justify-center gap-2 rounded-xl py-4 text-lg font-semibold text-white transition ${
              method === 'Cash'
                ? 'bg-[var(--brand-primary)] ring-2 ring-[var(--brand-accent)]'
                : 'bg-[var(--brand-primary-dark)]/80'
            }`}
          >
            <Banknote className="h-6 w-6" />
            Cash
          </button>
          <button
            type="button"
            onClick={() => setMethod('Card')}
            className={`pos-tap flex flex-1 items-center justify-center gap-2 rounded-xl py-4 text-lg font-semibold text-white transition ${
              method === 'Card'
                ? 'bg-[var(--status-info)] ring-2 ring-sky-200'
                : 'bg-sky-700/90'
            }`}
          >
            <CreditCard className="h-6 w-6" />
            Card
          </button>
        </div>

        <div className="mb-3 rounded-xl bg-[var(--neutral-100)] px-4 py-3 text-right">
          <p className="text-sm font-semibold tabular-nums text-[var(--foreground)]">
            Total: Rs {total.toFixed(2)}
          </p>
        </div>

        {method === 'Cash' && (
          <div className="mb-3 space-y-3">
            <div className="rounded-xl border-2 border-[var(--border)] bg-white px-4 py-3 text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                Cash received
              </p>
              <p className="font-pos-title text-3xl font-bold tabular-nums text-[var(--foreground)]">
                {cashReceived || '0.00'}
              </p>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {['1', '2', '3', '00', '4', '5', '6', '000', '7', '8', '9', '+1000'].map((k) => (
                <button key={k} type="button" className={KEY_CLS} onClick={() => press(k)}>
                  {k}
                </button>
              ))}
              <button type="button" className={KEY_CLS} onClick={() => press('0')}>0</button>
              <button type="button" className={KEY_CLS} onClick={() => press('.')}>.</button>
              <button
                type="button"
                className="pos-tap col-span-2 flex h-14 items-center justify-center rounded-xl bg-[var(--brand-accent)] text-lg font-bold text-neutral-900 shadow-sm hover:brightness-105 active:scale-95"
                onClick={() => press('C')}
              >
                C
              </button>
            </div>

            {cashAmount > 0 && (
              <div className={`rounded-xl px-4 py-3 text-center ${
                cashAmount >= total
                  ? 'border-2 border-emerald-500 bg-emerald-50'
                  : 'border-2 border-red-500 bg-red-50'
              }`}>
                <p className={`text-xs font-bold uppercase ${cashAmount >= total ? 'text-emerald-700' : 'text-red-700'}`}>
                  {cashAmount >= total ? 'Change to return' : 'Insufficient amount'}
                </p>
                <p className={`font-pos-title text-3xl font-extrabold tabular-nums ${
                  cashAmount >= total ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  Rs {cashAmount >= total ? change.toFixed(2) : (total - cashAmount).toFixed(2)}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={!isValid}
            className="pos-tap rounded-xl bg-[var(--brand-accent)] py-4 text-lg font-bold text-neutral-900 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={handleCompleteSale}
          >
            Pay
          </button>
          <button
            type="button"
            className="pos-tap rounded-xl border border-[var(--border)] py-4 text-lg font-semibold text-[var(--foreground)] hover:bg-[var(--muted)]"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
