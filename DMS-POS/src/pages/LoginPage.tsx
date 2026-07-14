import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { loginRequest } from '../lib/api'
import { useAuthStore } from '../lib/auth-store'
import { useSettingsStore } from '../lib/settings-store'

export function LoginPage() {
  const login = useAuthStore((s) => s.login)
  const apiBaseUrl = useSettingsStore((s) => s.apiBaseUrl)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await loginRequest(email.trim(), password)
      login(res.accessToken, res.refreshToken, {
        id: res.user.id,
        email: res.user.email,
        firstName: res.user.firstName,
        lastName: res.user.lastName,
        isSuperAdmin: res.user.isSuperAdmin,
        isActive: res.user.isActive,
        permissions: res.user.permissions ?? [],
        roles: res.user.roles ?? [],
      })
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: string }).message)
          : ''
      const isNetwork =
        msg.includes('Network Error') ||
        msg.includes('ERR_CONNECTION_REFUSED') ||
        msg.includes('ECONNREFUSED')
      setError(
        isNetwork
          ? `Cannot reach server at ${apiBaseUrl.replace(/\/$/, '')}. Check network connection or ask your administrator to configure the server URL.`
          : msg || 'Login failed. Check your credentials and try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--neutral-100)]">
      {/* Top brand bar */}
      <div className="h-2 bg-[var(--brand-primary)]" />

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        {/* Logo card */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--brand-primary)] shadow-lg">
            <span className="font-pos-title text-3xl font-bold text-white">D&S</span>
          </div>
          <h1 className="font-pos-title text-3xl font-bold text-[var(--brand-primary)]">Don &amp; Sons</h1>
          <p className="mt-1 text-sm font-medium text-[var(--muted-foreground)]">Point of Sale Terminal</p>
        </div>

        {/* Login card */}
        <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-8 shadow-xl">
          <h2 className="mb-6 text-center text-xl font-semibold text-[var(--foreground)]">Sign in to open the till</h2>

          <form onSubmit={submit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                Email address
              </label>
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cashier@donandsons.lk"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--neutral-50)] px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--neutral-400)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                required
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--neutral-50)] px-4 py-3 pr-12 text-[var(--foreground)] placeholder:text-[var(--neutral-400)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--neutral-400)] hover:text-[var(--foreground)]"
                  onClick={() => setShowPw((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="pos-tap w-full rounded-xl bg-[var(--brand-primary)] py-3.5 text-base font-bold text-white shadow-md hover:bg-[var(--brand-primary-dark)] disabled:opacity-50 transition-colors"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

        </div>

        <p className="mt-6 text-xs text-[var(--neutral-400)]">Don &amp; Sons (Pvt) Ltd — DMS v2</p>
      </div>

      {/* Bottom accent bar */}
      <div className="h-1.5 bg-[var(--brand-accent)]" />
    </div>
  )
}
