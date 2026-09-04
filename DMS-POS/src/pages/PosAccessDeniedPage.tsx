import { Eye, EyeOff, KeyRound, Lock, Minus } from 'lucide-react'
import { useBackstageViewModel } from '../backstage/viewmodel/use-backstage-view-model'

type Props = { onReady: () => void }

const fieldCls =
  'w-full rounded-lg border border-white/20 bg-black/30 px-4 py-3 font-mono text-sm text-white outline-none placeholder:text-white/40 focus:border-[var(--brand-accent)]'

export function PosAccessDeniedPage({ onReady }: Props) {
  const vm = useBackstageViewModel({
    startOpen: true,
    listenHotkey: false,
    onSaved: onReady,
  })

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
          You do not have permission to access Don &amp; Sons POS. Please contact the System Administrator.
        </p>

        <div className="mx-auto mt-6 max-w-sm rounded-xl border border-white/10 bg-white/5 px-5 py-4">
          <p className="text-sm text-white/70">Don &amp; Sons</p>
          <p className="font-pos-title text-xl font-bold text-white">Unauthorized Access</p>
        </div>

        <div className="mt-8 text-left">
          {vm.phase === 'locked' ? (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                void vm.unlockCommand()
              }}
            >
              <p className="text-center text-xs font-semibold uppercase tracking-widest text-white/60">
                Administrator setup
              </p>
              <label className="block">
                <span className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-white/70">
                  <KeyRound className="h-3.5 w-3.5" /> POS Admin Key
                </span>
                <div className="flex gap-2">
                  <input
                    type={vm.showPassword ? 'text' : 'password'}
                    autoFocus
                    autoComplete="off"
                    value={vm.password}
                    onChange={(e) => vm.setPassword(e.target.value)}
                    className={fieldCls}
                    placeholder="Current POS password from DMS"
                  />
                  <button
                    type="button"
                    onClick={() => vm.setShowPassword(!vm.showPassword)}
                    className="shrink-0 rounded-lg border border-white/20 px-3 text-white/80 hover:bg-white/10"
                    aria-label={vm.showPassword ? 'Hide password' : 'Show password'}
                  >
                    {vm.showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>
              {vm.error ? <p className="text-sm text-[var(--brand-accent)]">{vm.error}</p> : null}
              {!vm.desktop ? (
                <p className="text-xs text-[var(--brand-accent)]">Use the installed POS desktop app to set the location.</p>
              ) : null}
              <button
                type="submit"
                disabled={vm.unlocking}
                className="w-full rounded-lg bg-[var(--brand-primary)] py-3 font-bold text-white hover:bg-[var(--brand-primary-dark)] disabled:opacity-50"
              >
                {vm.unlocking ? 'Checking…' : 'Continue'}
              </button>
            </form>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                void vm.saveCommand()
              }}
            >
              <p className="flex items-center justify-center gap-2 text-center text-sm font-semibold text-white">
                <Lock className="h-4 w-4 text-[var(--brand-accent)]" />
                Set showroom location
              </p>
              <label className="block">
                <span className="mb-1 block text-[11px] font-bold uppercase text-white/70">API URL</span>
                <input
                  value={vm.apiBaseUrl}
                  onChange={(e) => vm.setApiBaseUrl(e.target.value)}
                  className={fieldCls}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-bold uppercase text-white/70">POS Verification Code</span>
                <input
                  value={vm.posVerificationCode}
                  onChange={(e) => vm.setPosVerificationCode(e.target.value)}
                  maxLength={40}
                  className={fieldCls}
                  placeholder="From DMS Showroom"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-bold uppercase text-white/70">Showroom Code</span>
                <input
                  value={vm.showroomCode}
                  onChange={(e) => vm.setShowroomCode(e.target.value)}
                  maxLength={40}
                  className={fieldCls}
                  placeholder="e.g. DBQ"
                />
              </label>
              {vm.error ? <p className="text-sm text-[var(--brand-accent)]">{vm.error}</p> : null}
              <button
                type="submit"
                disabled={vm.saving}
                className="w-full rounded-lg bg-[var(--brand-primary)] py-3 font-bold text-white hover:bg-[var(--brand-primary-dark)] disabled:opacity-50"
              >
                {vm.saving ? 'Saving…' : 'Save location and go to login'}
              </button>
            </form>
          )}
        </div>

        <p className="mt-8 font-pos-title text-sm font-semibold tracking-wide text-[var(--brand-accent)]">
          ★ Powered By Don &amp; Sons DMS ★
        </p>
      </div>
    </div>
  )
}
