import { Eye, EyeOff, KeyRound, Lock, Shield, X } from 'lucide-react'
import { useBackstageViewModel } from '../viewmodel/use-backstage-view-model'

export function BackstageAdminPanel() {
  const vm = useBackstageViewModel()
  if (!vm.visible) return null

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-950 shadow-2xl">
        <header className="flex items-center justify-between border-b border-neutral-800 px-5 py-3">
          <div className="flex items-center gap-2 text-white">
            <Shield className="h-5 w-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-bold tracking-wide">Hidden Admin Utility</h2>
              <p className="text-[11px] text-neutral-400">Backstage till configuration</p>
            </div>
          </div>
          <button
            type="button"
            onClick={vm.closeCommand}
            className="rounded-lg p-2 text-neutral-400 hover:bg-white/10 hover:text-white"
            aria-label="Close backstage"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {vm.phase === 'locked' ? (
          <form
            className="space-y-4 px-5 py-5"
            onSubmit={(e) => {
              e.preventDefault()
              void vm.unlockCommand()
            }}
          >
            <p className="text-sm text-neutral-300">
              Enter the Verification Admin Key to edit the encrypted API URL, POS Verification Code, and Showroom Code.
            </p>
            <label className="block">
              <span className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                <KeyRound className="h-3.5 w-3.5" /> Verification Admin Key
              </span>
              <div className="flex gap-2">
                <input
                  type={vm.showPassword ? 'text' : 'password'}
                  autoFocus
                  autoComplete="off"
                  value={vm.password}
                  onChange={(e) => vm.setPassword(e.target.value)}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-amber-400"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => vm.setShowPassword(!vm.showPassword)}
                  className="shrink-0 rounded-lg border border-neutral-700 px-3 text-neutral-300 hover:bg-white/10"
                  aria-label={vm.showPassword ? 'Hide password' : 'Show password'}
                >
                  {vm.showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>
            {vm.error ? <p className="text-sm text-red-400">{vm.error}</p> : null}
            {!vm.desktop ? (
              <p className="text-xs text-amber-300">Open this panel from the installed POS desktop app.</p>
            ) : null}
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={vm.closeCommand}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-neutral-300 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={vm.unlocking}
                className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-neutral-900 hover:brightness-105 disabled:opacity-50"
              >
                {vm.unlocking ? 'Verifying…' : 'Unlock'}
              </button>
            </div>
          </form>
        ) : (
          <form
            className="space-y-4 px-5 py-5"
            onSubmit={(e) => {
              e.preventDefault()
              void vm.saveCommand()
            }}
          >
            <div className="flex items-center gap-2 rounded-lg border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-xs text-emerald-300">
              <Lock className="h-3.5 w-3.5" />
              Session unlocked. Values are written to an encrypted file, not a notepad-editable JSON.
            </div>
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                API URL
              </span>
              <input
                value={vm.apiBaseUrl}
                onChange={(e) => vm.setApiBaseUrl(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-amber-400"
                placeholder="http://server:5126"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                POS Verification Code
              </span>
              <input
                value={vm.posVerificationCode}
                onChange={(e) => vm.setPosVerificationCode(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-amber-400"
                placeholder="From DMS → Showroom → POS Verification Code"
                maxLength={40}
              />
              <p className="mt-1 text-[11px] text-neutral-500">
                Binds this till to the showroom. Not the public Code.
              </p>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Showroom Code
              </span>
              <input
                value={vm.showroomCode}
                onChange={(e) => vm.setShowroomCode(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-amber-400"
                placeholder="Public showroom code (e.g. DBQ)"
                maxLength={40}
              />
            </label>
            {vm.configPath ? (
              <p className="truncate text-[11px] text-neutral-500">
                File: {vm.configPath} {vm.encrypted ? '(encrypted)' : ''}
              </p>
            ) : null}
            {vm.error ? <p className="text-sm text-red-400">{vm.error}</p> : null}
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={vm.closeCommand}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-neutral-300 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={vm.saving}
                className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-neutral-900 hover:brightness-105 disabled:opacity-50"
              >
                {vm.saving ? 'Saving…' : 'Save encrypted config'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
