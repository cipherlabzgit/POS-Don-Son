import { useCallback, useEffect, useState } from 'react'
import { PosSubPageLayout } from '../components/PosSubPageLayout'
import { fetchPosSaleRecords, markPosSaleRecordsRead, type PosSaleRecords } from '../lib/api'
import { useOnlineStatus } from '../lib/use-online-status'
import { useAuthStore } from '../lib/auth-store'
import { formatSubmitError } from '../lib/api-errors'

type Props = { onBack: () => void }

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function formatDisplayDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!m) return iso
  return `${m[3]}/${m[2]}/${m[1]}`
}

function formatMoney(n: number): string {
  const abs = Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return n < 0 ? `-${abs}` : abs
}

export function SaleRecordsPage({ onBack }: Props) {
  const token = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const online = useOnlineStatus(Boolean(token))
  const canView = hasPermission('pos:sale-records:view') || hasPermission('pos:sale:view')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<PosSaleRecords | null>(null)

  const load = useCallback(async () => {
    if (!canView) {
      setLoading(false)
      setError(null)
      return
    }
    if (!online) {
      setLoading(false)
      setError('Sale records require an online connection.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const records = await fetchPosSaleRecords()
      setData(records)
      await markPosSaleRecordsRead()
    } catch (e) {
      setError(formatSubmitError(e))
    } finally {
      setLoading(false)
    }
  }, [canView, online])

  useEffect(() => {
    void load()
  }, [load])

  const cashier =
    data?.cashierName?.trim() ||
    (user ? `${user.firstName} ${user.lastName}`.trim() : '—')
  const startName = data ? WEEKDAYS[data.weekStartDay] ?? 'Wednesday' : 'Wednesday'
  const endName = data
    ? WEEKDAYS[(data.weekStartDay + 6) % 7] ?? 'Tuesday'
    : 'Tuesday'

  return (
    <PosSubPageLayout
      title="Sale Records"
      subtitle="Day end review — showroom sale minus system sale"
      onBack={onBack}
    >
      {!canView ? (
        <p className="text-sm text-[var(--muted-foreground)]">You do not have permission to view sale records.</p>
      ) : null}

      {canView && loading ? (
        <p className="text-sm text-[var(--muted-foreground)]">Loading sale records…</p>
      ) : null}

      {canView && error ? (
        <p className="text-sm text-red-700">{error}</p>
      ) : null}

      {canView && !loading && !error && data ? (
        <div className="space-y-5">
          <p className="text-sm font-semibold text-[var(--foreground)]">Cashier: {cashier}</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted-foreground)]">Record scope</p>
              <p className="mt-1 text-sm font-semibold">Assigned cashier showrooms</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted-foreground)]">Cashier turn</p>
              <p className="mt-1 text-sm font-semibold">
                {startName} to {endName}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted-foreground)]">Period</p>
              <p className="mt-1 text-sm font-semibold">
                {formatDisplayDate(data.periodStart)} – {formatDisplayDate(data.periodEnd)}
              </p>
            </div>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            Showing {data.weeksToShow} {startName}–{endName} week{data.weeksToShow === 1 ? '' : 's'} through the current
            week.
          </p>

          {data.weeks.map((week) => (
            <section
              key={`${week.weekStart}-${week.weekEnd}`}
              className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm"
            >
              <header className="bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-bold text-white">
                Sale Records — {formatDisplayDate(week.weekStart)} to {formatDisplayDate(week.weekEnd)}
              </header>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]">
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2 text-right">Difference</th>
                    <th className="px-4 py-2">Showroom</th>
                  </tr>
                </thead>
                <tbody>
                  {week.days.map((day, idx) => (
                    <tr key={`${day.date}-${day.showroomName ?? 'na'}-${idx}`} className="border-b border-[var(--border)] last:border-0">
                      <td className="px-4 py-2 font-medium">{formatDisplayDate(day.date)}</td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {day.available && day.difference != null ? (
                          <span className={day.difference < 0 ? 'font-semibold text-red-600' : 'font-semibold'}>
                            {formatMoney(day.difference)}
                          </span>
                        ) : (
                          <span className="italic text-[var(--muted-foreground)]">Not Available</span>
                        )}
                      </td>
                      <td className="px-4 py-2">{day.available ? day.showroomName ?? '—' : '—'}</td>
                    </tr>
                  ))}
                  <tr className="bg-[var(--neutral-100)]">
                    <td className="px-4 py-2.5 font-bold">Total</td>
                    <td
                      className={`px-4 py-2.5 text-right tabular-nums font-bold ${week.total < 0 ? 'text-red-600' : ''}`}
                    >
                      {formatMoney(week.total)}
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </section>
          ))}
        </div>
      ) : null}
    </PosSubPageLayout>
  )
}
