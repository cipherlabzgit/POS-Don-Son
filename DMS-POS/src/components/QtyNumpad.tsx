import { useEffect, useState } from 'react'
import { Delete } from 'lucide-react'

type Props = {
  productName: string
  initialQty?: number
  onConfirm: (qty: number) => void
  onCancel: () => void
}

export function QtyNumpad({ productName, initialQty = 1, onConfirm, onCancel }: Props) {
  const [input, setInput] = useState(String(initialQty))

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        const q = Math.max(1, Math.min(999, Number(input) || 0))
        if (q > 0) onConfirm(q)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [input, onConfirm, onCancel])

  function press(digit: string) {
    setInput((prev) => {
      if (digit === 'C') return '0'
      const next = prev === '0' ? digit : prev + digit
      // Cap at 999
      return Number(next) > 999 ? prev : next
    })
  }

  function backspace() {
    setInput((prev) => (prev.length <= 1 ? '0' : prev.slice(0, -1)))
  }

  const qty = Math.max(1, Math.min(999, Number(input) || 0))

  const KEY_CLS =
    'numpad-key pos-tap flex items-center justify-center rounded-2xl text-xl font-bold ' +
    'bg-[var(--brand-accent)] text-neutral-900 shadow-md hover:brightness-105 active:scale-95 ' +
    'h-16 w-full select-none cursor-pointer'

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div
        className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[var(--brand-primary)] px-6 py-4">
          <p className="text-center text-sm font-semibold text-white/80 truncate">Qty — {productName}</p>
        </div>

        {/* Display */}
        <div className="px-6 pt-5 pb-3">
          <div className="flex items-center justify-end gap-2 rounded-xl border-2 border-[var(--neutral-200)] bg-[var(--neutral-50)] px-4 py-3">
            <span className="flex-1 text-right text-4xl font-bold tabular-nums text-[var(--foreground)] tracking-tight">
              {input}
            </span>
            <button
              type="button"
              className="pos-tap rounded-lg p-1 text-[var(--neutral-400)] hover:text-[var(--brand-primary)]"
              onClick={backspace}
              aria-label="Backspace"
            >
              <Delete className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Numpad grid */}
        <div className="grid grid-cols-4 gap-2 px-6 pb-4">
          {['1','2','3','C','4','5','6','⌫','7','8','9','0'].map((k) => (
            <button
              key={k}
              type="button"
              className={
                k === 'C'
                  ? KEY_CLS.replace('bg-[var(--brand-accent)] text-neutral-900', 'bg-[var(--neutral-200)] text-[var(--neutral-700)]')
                  : k === '⌫'
                  ? KEY_CLS.replace('bg-[var(--brand-accent)] text-neutral-900', 'bg-red-100 text-red-700')
                  : KEY_CLS
              }
              onClick={() => k === '⌫' ? backspace() : press(k)}
              aria-label={k === '⌫' ? 'Backspace' : k === 'C' ? 'Clear' : `Digit ${k}`}
            >
              {k === '⌫' ? <Delete className="h-5 w-5" /> : k}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 border-t border-[var(--border)] px-6 py-4">
          <button
            type="button"
            className="pos-tap rounded-xl border-2 border-[var(--neutral-200)] bg-white py-3 text-base font-semibold text-[var(--neutral-700)] hover:bg-[var(--neutral-50)]"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="pos-tap rounded-xl bg-[var(--brand-accent)] py-3 text-base font-bold text-neutral-900 shadow hover:brightness-105 disabled:opacity-40"
            disabled={qty === 0}
            onClick={() => onConfirm(qty)}
          >
            Add {qty > 0 ? `× ${qty}` : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
