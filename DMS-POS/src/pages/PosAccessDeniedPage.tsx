import { KeyRound, Minus } from 'lucide-react'
import { openBackstagePanel } from '../backstage/viewmodel/use-backstage-view-model'

type Props = { onReady: () => void }

export function PosAccessDeniedPage({ onReady: _onReady }: Props) {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-10"
      style={{
        background:
          'radial-gradient(ellipse at center, #7a0c1c 0%, #4a0812 42%, #1a0408 100%)',
      }}
    >
      <div className="w-full max-w-xl rounded-3xl border border-white/15 bg-black/45 px-8 py-10 text-center shadow-2xl backdrop-blur-md">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-primary)] ring-4 ring-white/15">
          <Minus className="h-7 w-7 text-white" strokeWidth={3} />
        </div>
        <h1 className="font-pos-title text-4xl font-bold tracking-wide text-white">
          ACCESS DENIED
        </h1>
        <p className="mx-auto mt-3 max-w-md font-pos-title text-sm leading-relaxed text-white/85">
          This till is not bound to a showroom yet. An administrator must set the POS Verification Code.
        </p>

        <div className="mx-auto mt-6 max-w-sm rounded-xl border border-white/10 bg-white/5 px-5 py-4">
          <p className="text-sm text-white/70">Don &amp; Sons</p>
          <p className="font-pos-title text-xl font-bold text-white">Till not configured</p>
        </div>

        <button
          type="button"
          onClick={() => openBackstagePanel()}
          className="mx-auto mt-8 flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-6 py-3 font-bold text-white hover:bg-[var(--brand-primary-dark)]"
        >
          <KeyRound className="h-4 w-4" />
          Configure showroom
        </button>
        <p className="mt-3 text-xs text-white/60">
          Or press <span className="font-semibold text-white">Ctrl+Shift+A</span> and unlock with the POS Admin Key.
        </p>

        <p className="mt-8 font-pos-title text-sm font-semibold tracking-wide text-[var(--brand-accent)]">
          ★ Powered By Don &amp; Sons DMS ★
        </p>
      </div>
    </div>
  )
}
