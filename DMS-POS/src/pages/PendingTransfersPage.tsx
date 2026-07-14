import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { PosSubPageLayout } from '../components/PosSubPageLayout'
import { completeTransferReceipt, fetchTransferDetail, fetchTransfers } from '../lib/api'
import { useSettingsStore } from '../lib/settings-store'
import { useAuthStore } from '../lib/auth-store'
import { useOnlineStatus } from '../lib/use-online-status'
import { toast } from '../lib/toast-store'
import { formatSubmitError } from '../lib/api-errors'

type Props = { onBack: () => void }
type Transfer = Record<string, unknown>

export function PendingTransfersPage({ onBack }: Props) {
  const outletId    = useSettingsStore((s) => s.outletId)
  const outletLabel = useSettingsStore((s) => s.outletLabel)
  const token       = useAuthStore((s) => s.accessToken)
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const online      = useOnlineStatus(Boolean(token))

  const canUpdate = hasPermission('operation:transfer:update')

  const [list, setList]         = useState<Transfer[]>([])
  const [selected, setSelected] = useState<Transfer | null>(null)
  const [detail, setDetail]     = useState<Transfer | null>(null)
  const [loading, setLoading]   = useState(false)
  const [acting, setActing]     = useState(false)
  const [err, setErr]           = useState('')

  async function loadList() {
    if (!outletId || !online) return
    setLoading(true)
    setErr('')
    try {
      const res = await fetchTransfers({ page: 1, pageSize: 100, toOutletId: outletId, status: 'Approved' })
      setList((res.transfers as Transfer[]) ?? [])
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadList() }, [outletId, online])

  useEffect(() => {
    if (!selected) { setDetail(null); return }
    void (async () => {
      try {
        const d = await fetchTransferDetail(String(selected.id))
        setDetail(d as Transfer)
      } catch { setDetail(null) }
    })()
  }, [selected])

  async function markReceived() {
    if (!detail?.id || !online) return
    setActing(true)
    try {
      await completeTransferReceipt(String(detail.id))
      setSelected(null)
      setDetail(null)
      await loadList()
      toast('Transfer received — stock updated.', 'success')
    } catch (e) {
      toast(formatSubmitError(e), 'error')
    } finally {
      setActing(false)
    }
  }

  function markNotReceived() {
    toast('Use the DMS web portal to reject or dispute a transfer.', 'info')
  }

  const items = (detail?.items as Transfer[] | undefined) ?? []

  return (
    <PosSubPageLayout
      title="Pending Transfers"
      subtitle="Receive transfers sent to this showroom."
      onBack={onBack}
      badge={
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${online ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
          {online ? 'Online' : 'Offline'}
        </span>
      }
    >
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-lg sm:p-8">
        {/* Info strip */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--neutral-50)] px-5 py-4 text-sm">
          <div className="flex flex-wrap gap-8">
            <InfoField label="Showroom" value={outletLabel || '—'} />
            <InfoField label="Pending Count" value={String(list.length)} />
            <InfoField label="Status" value={loading ? 'Loading…' : 'Ready'} />
          </div>
          <button type="button"
            className="pos-tap flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--neutral-50)]"
            onClick={() => void loadList()} disabled={loading || !online}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {!outletId ? (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Select your showroom on the main POS screen first.
          </div>
        ) : null}
        {err ? <p className="mb-4 text-sm text-red-600">{err}</p> : null}
        {!canUpdate ? (
          <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
            You can view pending transfers but do not have permission to mark them as received.
          </p>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: queue */}
          <div>
            <h2 className="mb-3 text-base font-bold text-[var(--foreground)]">Pending Transfers</h2>
            <div className="overflow-hidden rounded-xl border border-[var(--border)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--neutral-50)] text-xs font-semibold uppercase text-[var(--muted-foreground)]">
                  <tr>
                    <th className="px-4 py-3 text-left">Transfer No</th>
                    <th className="px-4 py-3 text-left">From</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-right">Items</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {list.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-sm text-[var(--neutral-400)]">
                        {outletId ? 'No pending transfers to receive.' : 'Choose a showroom to see transfers.'}
                      </td>
                    </tr>
                  ) : (
                    list.map((t) => (
                      <tr key={String(t.id)}
                        className={`cursor-pointer hover:bg-[var(--neutral-50)] ${selected?.id === t.id ? 'bg-[var(--brand-primary)]/8 font-semibold' : ''}`}
                        onClick={() => setSelected(t)}>
                        <td className="px-4 py-3 text-[var(--brand-primary)]">{String(t.transferNo)}</td>
                        <td className="px-4 py-3">{String(t.fromOutletName ?? '')}</td>
                        <td className="px-4 py-3">{new Date(String(t.transferDate)).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{String((t.items as unknown[])?.length ?? '—')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: detail */}
          <div>
            <h2 className="mb-3 text-base font-bold text-[var(--foreground)]">Transfer Detail</h2>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--neutral-50)] px-5 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <InfoField label="Transfer No" value={detail ? String(detail.transferNo ?? '—') : '—'} />
                <InfoField label="From" value={detail ? String(detail.fromOutletName ?? '—') : '—'} />
                <InfoField label="To" value={detail ? String(detail.toOutletName ?? '—') : '—'} />
                <InfoField label="Date" value={detail?.transferDate ? new Date(String(detail.transferDate)).toLocaleDateString() : '—'} />
                {detail?.notes ? <div className="col-span-2"><InfoField label="Comment" value={String(detail.notes)} /></div> : null}
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-[var(--border)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--neutral-50)] text-xs font-semibold uppercase text-[var(--muted-foreground)]">
                  <tr>
                    <th className="px-4 py-3 text-left">Item Code</th>
                    <th className="px-4 py-3 text-left">Item</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-sm text-[var(--neutral-400)]">
                        Select a transfer to see items.
                      </td>
                    </tr>
                  ) : (
                    items.map((it) => (
                      <tr key={String(it.id ?? it.productId)}>
                        <td className="px-4 py-3 font-mono text-xs text-[var(--muted-foreground)]">{String(it.productCode ?? '')}</td>
                        <td className="px-4 py-3 font-medium">{String(it.productName ?? '')}</td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums">{String(it.quantity ?? '')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Action buttons matching screenshot */}
            <div className="mt-4 flex justify-end gap-3">
              <button type="button"
                className="pos-tap rounded-xl bg-[var(--status-success)] px-6 py-2.5 text-sm font-bold text-white shadow hover:brightness-95 disabled:opacity-40"
                disabled={!detail?.id || !online || acting || !canUpdate}
                onClick={() => void markReceived()}>
                {acting ? 'Processing…' : 'Received'}
              </button>
              <button type="button"
                className="pos-tap rounded-xl bg-[var(--brand-accent)] px-6 py-2.5 text-sm font-bold text-neutral-900 shadow hover:brightness-95 disabled:opacity-40"
                disabled={!detail?.id}
                onClick={markNotReceived}>
                Not Receive
              </button>
            </div>
          </div>
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
