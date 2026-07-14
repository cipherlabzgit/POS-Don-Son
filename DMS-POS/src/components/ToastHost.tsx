import { useToastStore } from '../lib/toast-store'

export function ToastHost() {
  const message = useToastStore((s) => s.message)
  const level = useToastStore((s) => s.level)
  const clear = useToastStore((s) => s.clear)

  if (!message) return null

  const bg =
    level === 'success'
      ? 'bg-[var(--brand-primary)] text-white'
      : level === 'error'
        ? 'bg-[var(--status-error)] text-white'
        : 'bg-[var(--neutral-800)] text-white'

  return (
    <div className="fixed bottom-6 left-1/2 z-[100] flex max-w-md -translate-x-1/2 px-4">
      <div
        className={`flex w-full items-center justify-between gap-4 rounded-xl px-4 py-3 text-sm shadow-lg ${bg}`}
        role="status"
      >
        <span>{message}</span>
        <button type="button" className="font-bold opacity-80 hover:opacity-100" onClick={clear}>
          ×
        </button>
      </div>
    </div>
  )
}
