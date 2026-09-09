import { ChevronDown, ChevronUp } from 'lucide-react'

type Props = {
  value: string | number
  onChange: (value: string) => void
  inputRef?: React.Ref<HTMLInputElement>
  min?: number
  step?: number
  disabled?: boolean
  compact?: boolean
  onEnter?: () => void
  ariaLabel?: string
}

function parseQty(value: string | number): number {
  const n = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

export function QtyStepper({
  value,
  onChange,
  inputRef,
  min = 1,
  step = 1,
  disabled = false,
  compact = false,
  onEnter,
  ariaLabel = 'Quantity',
}: Props) {
  function bump(delta: number) {
    if (disabled) return
    const next = Math.max(min, Math.round((parseQty(value) + delta) * 1000) / 1000)
    onChange(String(next))
  }

  return (
    <div className={`relative ${compact ? 'w-24' : 'w-28'}`}>
      <input
        ref={inputRef}
        value={value}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => e.currentTarget.select()}
        onClick={(e) => e.currentTarget.select()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            onEnter?.()
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault()
            bump(step)
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            bump(-step)
          }
        }}
        inputMode="decimal"
        className={`w-full rounded-xl border border-[var(--border)] bg-[var(--neutral-50)] pr-7 text-center font-semibold tabular-nums text-[var(--foreground)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 disabled:opacity-60 ${
          compact ? 'px-2 py-1 text-sm' : 'px-3 py-3'
        }`}
      />
      <div className="absolute inset-y-0 right-0 flex w-6 flex-col overflow-hidden rounded-r-xl border-l border-[var(--border)]">
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          aria-label="Increase quantity"
          className="flex flex-1 items-center justify-center text-[var(--muted-foreground)] hover:bg-[var(--neutral-50)] hover:text-[var(--foreground)] disabled:opacity-40"
          onPointerDown={(e) => {
            e.preventDefault()
            bump(step)
          }}
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          aria-label="Decrease quantity"
          className="flex flex-1 items-center justify-center border-t border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--neutral-50)] hover:text-[var(--foreground)] disabled:opacity-40"
          onPointerDown={(e) => {
            e.preventDefault()
            bump(-step)
          }}
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
