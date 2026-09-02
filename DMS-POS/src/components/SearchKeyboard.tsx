import { createPortal } from 'react-dom'
import { Delete, X } from 'lucide-react'

type Props = {
  value: string
  onChange: (value: string) => void
  onClose: () => void
  label?: string
  placeholder?: string
  onEnter?: () => void
}

const ROW1 = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
const ROW2 = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p']
const ROW3 = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l']
const ROW4 = ['z', 'x', 'c', 'v', 'b', 'n', 'm']

const KEY =
  'pos-tap flex h-12 min-w-0 flex-1 items-center justify-center rounded-lg bg-white/15 text-base font-bold uppercase text-white shadow-sm hover:bg-white/25 active:scale-95'

export function SearchKeyboard({
  value,
  onChange,
  onClose,
  label = 'Item search',
  placeholder = 'Search item name or code',
  onEnter,
}: Props) {
  function press(ch: string) {
    onChange(value + ch)
  }

  function backspace() {
    onChange(value.slice(0, -1))
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 p-3 sm:items-center">
      <div className="w-full max-w-3xl rounded-2xl bg-[var(--brand-primary)] p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Keyboard</h2>
          <button
            type="button"
            onClick={onClose}
            className="pos-tap rounded-md bg-red-600 p-1.5 text-white hover:bg-red-700"
            aria-label="Close keyboard"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 rounded-xl bg-[#f5f0e6] px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-primary)]">
            {label}
          </p>
          <p className="min-h-[1.75rem] text-xl font-semibold text-neutral-900">
            {value || <span className="font-normal text-neutral-400">{placeholder}</span>}
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="flex gap-1.5">
            {ROW1.map((k) => (
              <button key={k} type="button" className={KEY} onClick={() => press(k)}>{k}</button>
            ))}
            <button type="button" className={`${KEY} max-w-16`} onClick={backspace} aria-label="Backspace">
              <Delete className="h-5 w-5" />
            </button>
          </div>
          <div className="flex gap-1.5">
            {ROW2.map((k) => (
              <button key={k} type="button" className={KEY} onClick={() => press(k)}>{k}</button>
            ))}
          </div>
          <div className="flex gap-1.5 px-6">
            {ROW3.map((k) => (
              <button key={k} type="button" className={KEY} onClick={() => press(k)}>{k}</button>
            ))}
          </div>
          <div className="flex gap-1.5 px-14">
            {ROW4.map((k) => (
              <button key={k} type="button" className={KEY} onClick={() => press(k)}>{k}</button>
            ))}
          </div>
          <div className="flex gap-1.5 pt-1">
            <button
              type="button"
              className="pos-tap h-12 rounded-lg border-2 border-white/50 bg-white/10 px-5 text-sm font-bold text-white hover:bg-white/20"
              onClick={() => onChange('')}
            >
              Clear
            </button>
            <button
              type="button"
              className="pos-tap h-12 flex-1 rounded-lg border-2 border-white/50 bg-white/10 text-sm font-bold text-white hover:bg-white/20"
              onClick={() => press(' ')}
            >
              Space
            </button>
            <button
              type="button"
              className="pos-tap h-12 rounded-lg bg-[var(--brand-accent)] px-6 text-sm font-bold text-neutral-900 hover:brightness-105"
              onClick={() => {
                onEnter?.()
                onClose()
              }}
            >
              Enter
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
