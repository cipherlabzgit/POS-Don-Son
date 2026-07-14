import { useCallback, useEffect, useState } from 'react'
import { PosSubPageLayout } from '../components/PosSubPageLayout'
import { fetchCashierBalanceContext, fetchCashiersForOutlet, submitCashierBalance } from '../lib/api'
import { useOnlineStatus } from '../lib/use-online-status'
import { useAuthStore } from '../lib/auth-store'
import { useSettingsStore } from '../lib/settings-store'
import { toast } from '../lib/toast-store'
import { formatSubmitError } from '../lib/api-errors'

type Props = { onBack: () => void }

type OutletLineState = {
  outletId: string
  code: string
  name: string
  isShowroomClosed: boolean
  outletEmployeeId: string
  balanceCash: string
  balanceCard: string
  balanceUber: string
  balancePickme: string
}

export function CashSubmissionPage({ onBack }: Props) {
  const token       = useAuthStore((s) => s.accessToken)
  const user        = useAuthStore((s) => s.user)
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const online      = useOnlineStatus(Boolean(token))
  const outletLabel = useSettingsStore((s) => s.outletLabel)

  const canView = hasPermission('cashier-balance:view')
  const canEdit = hasPermission('cashier-balance:edit')

  const defaultDate = () => {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - 1)
    return d.toISOString().slice(0, 10)
  }

  const [processDate, setProcessDate]   = useState(defaultDate)
  const [loading, setLoading]           = useState(true)
  const [loadError, setLoadError]       = useState<string | null>(null)
  const [ctxSubmitted, setCtxSubmitted] = useState(false)
  const [ctxApproved, setCtxApproved]   = useState(false)
  const [lines, setLines]               = useState<OutletLineState[]>([])
  const [cashierOptions, setCashierOptions] = useState<Record<string, { outletEmployeeId: string; displayName: string }[]>>({})
  const [submitting, setSubmitting]     = useState(false)

  const cashier = user ? `${user.firstName} ${user.lastName}`.trim() : '—'
  const today   = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })

  const loadContext = useCallback(async () => {
    if (!canView) { setLoading(false); setLoadError(null); return }
    if (!online) { setLoading(false); setLoadError(null); return }
    setLoading(true)
    setLoadError(null)
    try {
      const ctx = (await fetchCashierBalanceContext(processDate)) as Record<string, unknown>
      const submitted = Boolean(ctx.isSubmitted ?? ctx.IsSubmitted)
      const approved = Boolean(ctx.isApproved ?? ctx.IsApproved)
      setCtxSubmitted(submitted)
      setCtxApproved(approved)

      const outletsRaw = (ctx.outlets ?? ctx.Outlets ?? []) as Record<string, unknown>[]
      const mapped: OutletLineState[] = outletsRaw
        .filter((o) => String(o.outletId ?? o.OutletId ?? '').length > 0)
        .map((o) => ({
        outletId: String(o.outletId ?? o.OutletId ?? ''),
        code: String(o.code ?? o.Code ?? ''),
        name: String(o.name ?? o.Name ?? ''),
        isShowroomClosed: Boolean(o.isShowroomClosed ?? o.IsShowroomClosed),
        outletEmployeeId: (o.outletEmployeeId ?? o.OutletEmployeeId)
          ? String(o.outletEmployeeId ?? o.OutletEmployeeId)
          : '',
        balanceCash:
          o.balanceCash != null || o.BalanceCash != null
            ? String(o.balanceCash ?? o.BalanceCash ?? '')
            : '',
        balanceCard:
          o.balanceCard != null || o.BalanceCard != null
            ? String(o.balanceCard ?? o.BalanceCard ?? '')
            : '',
        balanceUber:
          o.balanceUber != null || o.BalanceUber != null
            ? String(o.balanceUber ?? o.BalanceUber ?? '')
            : '',
        balancePickme:
          o.balancePickme != null || o.BalancePickme != null
            ? String(o.balancePickme ?? o.BalancePickme ?? '')
            : '',
      }))
      setLines(mapped)

      const opts: Record<string, { outletEmployeeId: string; displayName: string }[]> = {}
      await Promise.all(mapped.map(async (row) => {
        try {
          const list = (await fetchCashiersForOutlet(row.outletId)) as Record<string, unknown>[]
          opts[row.outletId] = list.map((c) => ({
            outletEmployeeId: String(c.outletEmployeeId ?? c.OutletEmployeeId ?? ''),
            displayName: String(c.displayName ?? c.DisplayName ?? ''),
          }))
        } catch { opts[row.outletId] = [] }
      }))
      setCashierOptions(opts)
    } catch (e) {
      setLoadError(formatSubmitError(e))
      setLines([])
      setCashierOptions({})
    } finally {
      setLoading(false)
    }
  }, [online, processDate, canView])

  useEffect(() => { void loadContext() }, [loadContext])

  function updateLine(outletId: string, patch: Partial<OutletLineState>) {
    setLines((prev) => prev.map((l) => l.outletId === outletId ? { ...l, ...patch } : l))
  }

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
    if (ctxSubmitted) { toast('This date is already submitted.', 'error'); return }
    if (lines.length === 0) { toast('No showroom rows loaded.', 'error'); return }
    setSubmitting(true)
    try {
      await submitCashierBalance({
        processDate: new Date(`${processDate}T00:00:00.000Z`).toISOString(),
        lines: lines.map((l) => ({
          outletId: l.outletId,
          isShowroomClosed: l.isShowroomClosed,
          outletEmployeeId: l.isShowroomClosed || !l.outletEmployeeId ? null : l.outletEmployeeId,
          balanceCash:   parseDecSubmit(l.balanceCash),
          balanceCard:   parseDecSubmit(l.balanceCard),
          balanceUber:   parseDecSubmit(l.balanceUber),
          balancePickme: parseDecSubmit(l.balancePickme),
        })),
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
        {/* Info strip */}
        <div className="mb-6 grid grid-cols-2 gap-4 rounded-xl border border-[var(--border)] bg-[var(--neutral-50)] px-5 py-4 text-sm sm:grid-cols-4">
          <InfoField label="Showroom" value={outletLabel || '—'} />
          <InfoField label="Date" value={today} />
          <InfoField label="Cashier" value={cashier} />
          <InfoField label="Status" value={statusText} />
        </div>

        {/* Date picker */}
        <div className="mb-5 flex flex-wrap items-end gap-4 rounded-xl border border-[var(--border)] bg-[var(--neutral-50)] px-5 py-4">
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            Business date
            <input type="date" value={processDate} onChange={(e) => setProcessDate(e.target.value)}
              className="mt-1 block rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--brand-primary)] focus:outline-none" />
          </label>
        </div>

        {!online ? (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Connect to the server to load showrooms and submit.
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

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-[var(--neutral-50)] text-xs font-semibold uppercase text-[var(--muted-foreground)]">
              <tr>
                <th className="px-4 py-3 text-left">Showroom</th>
                <th className="px-4 py-3 text-center">Closed</th>
                <th className="px-4 py-3 text-left">Cashier</th>
                <th className="px-4 py-3 text-right">Cash Total</th>
                <th className="px-4 py-3 text-right">Card Total</th>
                <th className="px-4 py-3 text-right">Uber</th>
                <th className="px-4 py-3 text-right">PickMe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {lines.length === 0 && !loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-[var(--neutral-400)]">
                    {loadError
                      ? 'Could not load showroom rows. Fix the issue above and change the date or refresh the page.'
                      : online && canView
                        ? 'No active showrooms were returned for this date. Add outlets in the back office, or pick another business date.'
                        : 'No rows loaded. Check your permissions and try again online.'}
                  </td>
                </tr>
              ) : (
                lines.map((l) => (
                  <tr key={l.outletId} className="hover:bg-[var(--neutral-50)]">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[var(--foreground)]">{l.name}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{l.code}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" checked={l.isShowroomClosed} disabled={ctxSubmitted}
                        className="h-5 w-5 rounded accent-[var(--brand-primary)]"
                        onChange={(e) => updateLine(l.outletId, { isShowroomClosed: e.target.checked })} />
                    </td>
                    <td className="px-4 py-3">
                      <select value={l.outletEmployeeId} disabled={ctxSubmitted || l.isShowroomClosed}
                        onChange={(e) => updateLine(l.outletId, { outletEmployeeId: e.target.value })}
                        className="w-full max-w-[200px] rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--brand-primary)] focus:outline-none disabled:opacity-50">
                        <option value="">Choose cashier…</option>
                        {(cashierOptions[l.outletId] ?? []).map((c) => (
                          <option key={c.outletEmployeeId} value={c.outletEmployeeId}>{c.displayName}</option>
                        ))}
                      </select>
                    </td>
                    {(['balanceCash', 'balanceCard', 'balanceUber', 'balancePickme'] as const).map((field) => (
                      <td key={field} className="px-4 py-3 text-right">
                        <input type="text" inputMode="decimal" value={l[field]}
                          disabled={ctxSubmitted || l.isShowroomClosed}
                          onChange={(e) => updateLine(l.outletId, { [field]: e.target.value })}
                          className={`w-24 rounded-xl border bg-white px-3 py-2 text-right text-sm font-semibold tabular-nums text-[var(--foreground)] focus:border-[var(--brand-primary)] focus:outline-none disabled:opacity-50 ${
                            fieldInvalid(l[field]) ? 'border-red-500 ring-1 ring-red-200' : 'border-[var(--border)]'
                          }`} />
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Submit */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" disabled={submitting || !online || loading || ctxSubmitted || !canEdit}
            onClick={() => void submit()}
            className="pos-tap rounded-xl bg-[var(--brand-accent)] px-8 py-3 font-bold text-neutral-900 shadow hover:brightness-95 disabled:opacity-40">
            {submitting ? 'Submitting…' : 'Submit for Approval'}
          </button>
          {!online ? <p className="self-center text-sm text-amber-700">Online connection required.</p> : null}
        </div>
      </div>
    </PosSubPageLayout>
  )
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-0.5 font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  )
}
