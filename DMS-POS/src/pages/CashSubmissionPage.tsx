import { useCallback, useEffect, useState } from 'react'
import { PosSubPageLayout } from '../components/PosSubPageLayout'
import { fetchCashierBalanceContext, submitCashierBalance } from '../lib/api'
import { useOnlineStatus } from '../lib/use-online-status'
import { useAuthStore } from '../lib/auth-store'
import { useSettingsStore } from '../lib/settings-store'
import { toast } from '../lib/toast-store'
import { formatSubmitError } from '../lib/api-errors'

type Props = { onBack: () => void }

function localIsoDate(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function CashSubmissionPage({ onBack }: Props) {
  const token = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const online = useOnlineStatus(Boolean(token))
  const outletId = useSettingsStore((s) => s.outletId)
  const outletLabel = useSettingsStore((s) => s.outletLabel)

  const canView = hasPermission('cashier-balance:view')
  const canEdit = hasPermission('cashier-balance:edit')

  const processDate = localIsoDate()

  const [nowClock, setNowClock] = useState(() => new Date())
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [ctxSubmitted, setCtxSubmitted] = useState(false)
  const [ctxApproved, setCtxApproved] = useState(false)
  const [cash, setCash] = useState('')
  const [card, setCard] = useState('')
  const [uber, setUber] = useState('')
  const [pickme, setPickme] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const cashier = user ? `${user.firstName} ${user.lastName}`.trim() : '—'

  useEffect(() => {
    const id = window.setInterval(() => setNowClock(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const loadContext = useCallback(async () => {
    if (!canView) { setLoading(false); setLoadError(null); return }
    if (!online) { setLoading(false); setLoadError(null); return }
    if (!outletId) {
      setLoading(false)
      setLoadError('This till is not assigned to a showroom.')
      return
    }
    setLoading(true)
    setLoadError(null)
    try {
      const ctx = (await fetchCashierBalanceContext(processDate)) as Record<string, unknown>
      setCtxSubmitted(Boolean(ctx.isSubmitted ?? ctx.IsSubmitted))
      setCtxApproved(Boolean(ctx.isApproved ?? ctx.IsApproved))

      const outletsRaw = (ctx.outlets ?? ctx.Outlets ?? []) as Record<string, unknown>[]
      const mine = outletsRaw.find((o) => String(o.outletId ?? o.OutletId ?? '') === outletId)
      if (!mine) {
        setLoadError('Assigned showroom was not found in today\'s cashier balance list.')
        return
      }
      setCash(mine.balanceCash != null || mine.BalanceCash != null ? String(mine.balanceCash ?? mine.BalanceCash ?? '') : '')
      setCard(mine.balanceCard != null || mine.BalanceCard != null ? String(mine.balanceCard ?? mine.BalanceCard ?? '') : '')
      setUber(mine.balanceUber != null || mine.BalanceUber != null ? String(mine.balanceUber ?? mine.BalanceUber ?? '') : '')
      setPickme(mine.balancePickme != null || mine.BalancePickme != null ? String(mine.balancePickme ?? mine.BalancePickme ?? '') : '')
    } catch (e) {
      setLoadError(formatSubmitError(e))
    } finally {
      setLoading(false)
    }
  }, [online, processDate, canView, outletId])

  useEffect(() => { void loadContext() }, [loadContext])

  function parseDec(s: string): number | null {
    const t = s.trim(); if (!t) return null
    const n = parseFloat(t.replace(',', '.'))
    return Number.isFinite(n) ? n : null
  }

  function parseDecSubmit(s: string): number {
    return parseDec(s) ?? 0
  }

  function fieldInvalid(s: string): boolean {
    const t = s.trim()
    if (!t) return false
    return parseDec(s) === null
  }

  async function submit() {
    if (!canEdit) { toast('You do not have permission to submit cashier balances.', 'error'); return }
    if (!online) { toast('Cash submission requires an online connection.', 'error'); return }
    if (!outletId) { toast('This till is not assigned to a showroom.', 'error'); return }
    if (ctxSubmitted) { toast('This date is already submitted.', 'error'); return }
    setSubmitting(true)
    try {
      await submitCashierBalance({
        processDate: new Date(`${processDate}T12:00:00.000Z`).toISOString(),
        lines: [{
          outletId,
          isShowroomClosed: false,
          outletEmployeeId: null,
          balanceCash: parseDecSubmit(cash),
          balanceCard: parseDecSubmit(card),
          balanceUber: parseDecSubmit(uber),
          balancePickme: parseDecSubmit(pickme),
        }],
      })
      toast('Cashier balance submitted for approval.', 'success')
      await loadContext()
    } catch (e) {
      toast(formatSubmitError(e), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const statusText = loading ? 'Loading…' : ctxSubmitted ? (ctxApproved ? 'Approved' : 'Submitted') : 'Ready'
  const locked = ctxSubmitted || !canEdit

  if (!canView && !canEdit) {
    return (
      <PosSubPageLayout title="Cash Submission" subtitle="Daily cash and card totals." onBack={onBack}>
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          You do not have permission to view or submit cashier balances on this terminal.
        </p>
      </PosSubPageLayout>
    )
  }

  return (
    <PosSubPageLayout
      title="Cash Submission"
      subtitle="Submit daily cash and card totals."
      onBack={onBack}
      badge={
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${online ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
          {online ? 'Online' : 'Offline'}
        </span>
      }
    >
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-lg sm:p-8">
        <div className="mb-6 grid grid-cols-2 gap-6 rounded-xl bg-[color-mix(in_srgb,var(--brand-primary)_8%,white)] px-6 py-5 sm:grid-cols-4">
          <InfoField label="Showroom" value={outletLabel || '—'} />
          <InfoField
            label="Date"
            value={nowClock.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })}
          />
          <InfoField label="Cashier" value={cashier} />
          <InfoField label="Status" value={statusText} />
        </div>

        {!online ? (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Connect to the server to load totals and submit.
          </div>
        ) : null}

        {ctxSubmitted ? (
          <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--neutral-50)] px-4 py-3 text-sm font-medium text-[var(--foreground)]">
            This date is already submitted — values are read-only.
          </div>
        ) : null}

        {loadError ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            {loadError}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          <AmountField label="Cash Total" value={cash} onChange={setCash} disabled={locked || loading} invalid={fieldInvalid(cash)} />
          <AmountField label="Card Total" value={card} onChange={setCard} disabled={locked || loading} invalid={fieldInvalid(card)} />
          <AmountField label="Uber" value={uber} onChange={setUber} disabled={locked || loading} invalid={fieldInvalid(uber)} />
          <AmountField label="Pick Me" value={pickme} onChange={setPickme} disabled={locked || loading} invalid={fieldInvalid(pickme)} />
        </div>

        <div className="mt-8">
          <button
            type="button"
            disabled={submitting || !online || loading || locked || !outletId}
            onClick={() => void submit()}
            className="pos-tap rounded-xl bg-[var(--brand-primary)] px-8 py-3.5 text-base font-bold text-white shadow-md hover:bg-[var(--brand-primary-dark)] disabled:opacity-40"
          >
            {submitting ? 'Submitting…' : 'Submit for Approval'}
          </button>
          {!online ? <p className="mt-3 text-sm text-amber-700">Online connection required.</p> : null}
        </div>
      </div>
    </PosSubPageLayout>
  )
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--brand-primary)]">{label}</p>
      <p className="mt-1 text-base font-bold text-[var(--foreground)]">{value}</p>
    </div>
  )
}

function AmountField({
  label,
  value,
  onChange,
  disabled,
  invalid,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  disabled: boolean
  invalid: boolean
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[var(--foreground)]">{label}</span>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0.00"
        className={`w-full rounded-lg border bg-white px-4 py-3 text-right text-lg font-semibold tabular-nums text-[var(--foreground)] placeholder:text-[var(--neutral-400)] focus:border-[var(--foreground)] focus:outline-none disabled:opacity-50 ${
          invalid ? 'border-red-500 ring-1 ring-red-200' : 'border-[var(--neutral-400)]'
        }`}
      />
    </label>
  )
}
