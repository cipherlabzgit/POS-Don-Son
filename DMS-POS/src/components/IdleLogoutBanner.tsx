import { AlertTriangle } from 'lucide-react'

type Props = {
  secondsLeft: number
  onStay: () => void
  onLogout: () => void
}

export function IdleLogoutBanner({ secondsLeft, onStay, onLogout }: Props) {
  return (
    <div className="fixed bottom-6 right-6 z-[120] max-w-sm rounded-2xl border-2 border-amber-400 bg-amber-50 p-4 shadow-xl">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-amber-600" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-amber-950">Idle timeout</p>
          <p className="mt-1 text-sm text-amber-900">
            No activity for 2 hours. Signing out in <strong>{secondsLeft}</strong> seconds.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onStay}
              className="pos-tap rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-amber-700"
            >
              Stay signed in
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="pos-tap rounded-lg border border-amber-600 px-3 py-1.5 text-sm font-semibold text-amber-900 hover:bg-amber-100"
            >
              Logout now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
