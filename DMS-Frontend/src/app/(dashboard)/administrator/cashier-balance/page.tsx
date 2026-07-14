'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Save, AlertTriangle, Lock, CheckCircle } from 'lucide-react';
import { addDaysISO, todayISO } from '@/lib/date-restrictions';
import { ProtectedPage, PermissionButton } from '@/components/auth';
import {
  cashierBalanceApi,
  getCashierBalanceApiErrorMessage,
  type CashierBalanceOutletRow,
  type CashierBalanceRecent,
  type DayEndCashierOption,
} from '@/lib/api/cashier-balance';
import toast from 'react-hot-toast';
import { formatSlDate, formatSlDateTime } from '@/lib/sri-lanka-time';

/**
 * 6.ii Cashier Balance — data from `/api/cashier-balance/*`.
 * Submitted dates are read-only. Open dates: all showrooms are included (checkboxes checked, not unselectable).
 * Amounts are split into Cash, Card, Uber, and PickMe; you may select the cashier before or after entering amounts.
 */

interface RowState {
  outletId: string;
  showroomCode: string;
  showroomName: string;
  selected: boolean;
  isClosed: boolean;
  outletEmployeeId: string;
  balanceCash: string;
  balanceCard: string;
  balanceUber: string;
  balancePickme: string;
}

function mapContextOutletsToRows(outlets: CashierBalanceOutletRow[]): RowState[] {
  return outlets.map((o) => {
    const hasChannel =
      o.balanceCash != null ||
      o.balanceCard != null ||
      o.balanceUber != null ||
      o.balancePickme != null;
    const legacy =
      o.cashierBalance != null && Number.isFinite(o.cashierBalance) ? String(o.cashierBalance) : '';
    const num = (v: number | null | undefined) =>
      v != null && Number.isFinite(v) ? String(v) : '';
    return {
      outletId: o.outletId,
      showroomCode: o.code,
      showroomName: o.name,
      selected: true,
      isClosed: o.isShowroomClosed,
      outletEmployeeId: o.outletEmployeeId ?? '',
      balanceCash: hasChannel ? num(o.balanceCash) : legacy,
      balanceCard: hasChannel ? num(o.balanceCard) : '',
      balanceUber: hasChannel ? num(o.balanceUber) : '',
      balancePickme: hasChannel ? num(o.balancePickme) : '',
    };
  });
}

function parseChannelNum(raw: string): number {
  const t = raw.trim().replace(/,/g, '');
  if (t === '') return 0;
  const n = Number(t);
  return Number.isFinite(n) ? n : 0;
}

function rowChannelTotal(r: RowState): number {
  if (r.isClosed) return 0;
  return (
    parseChannelNum(r.balanceCash) +
    parseChannelNum(r.balanceCard) +
    parseChannelNum(r.balanceUber) +
    parseChannelNum(r.balancePickme)
  );
}

function CashierBalanceContent() {
  const [balanceDate, setBalanceDate] = useState<string>(addDaysISO(-1));
  const [rows, setRows] = useState<RowState[]>([]);
  const [cashiersByOutlet, setCashiersByOutlet] = useState<Record<string, DayEndCashierOption[]>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [submittedByName, setSubmittedByName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [recent, setRecent] = useState<CashierBalanceRecent[]>([]);

  const loadRecent = useCallback(async () => {
    try {
      const list = await cashierBalanceApi.getRecent(10);
      setRecent(list);
    } catch {
      setRecent([]);
    }
  }, []);

  const loadPage = useCallback(async () => {
    setLoading(true);
    try {
      const ctx = await cashierBalanceApi.getContext(balanceDate);
      setIsSubmitted(ctx.isSubmitted);
      setIsApproved(ctx.isApproved);
      setSubmittedAt(ctx.submittedAt);
      setSubmittedByName(ctx.submittedByName);
      setRows(mapContextOutletsToRows(ctx.outlets));

      const ids = ctx.outlets.map((o) => o.outletId).filter(Boolean);
      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            const list = await cashierBalanceApi.getCashiersForOutlet(id);
            return { id, list };
          } catch {
            return { id, list: [] as DayEndCashierOption[] };
          }
        })
      );
      const map: Record<string, DayEndCashierOption[]> = {};
      for (const { id, list } of results) {
        map[id] = list;
      }
      setCashiersByOutlet(map);
    } catch (e) {
      toast.error(getCashierBalanceApiErrorMessage(e));
      setRows([]);
      setCashiersByOutlet({});
    } finally {
      setLoading(false);
    }
  }, [balanceDate]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  useEffect(() => {
    void loadRecent();
  }, [loadRecent]);

  const isLocked = isSubmitted;

  const selectedRows = useMemo(() => rows.filter((r) => r.selected), [rows]);

  const totalBalance = useMemo(
    () => selectedRows.reduce((sum, r) => sum + rowChannelTotal(r), 0),
    [selectedRows]
  );

  const closedCount = selectedRows.filter((r) => r.isClosed).length;
  const openCount = selectedRows.length - closedCount;

  const updateRow = (idx: number, patch: Partial<RowState>) => {
    if (isLocked) return;
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== idx) return r;
        const merged = { ...r, ...patch };
        if (patch.isClosed === true) {
          merged.outletEmployeeId = '';
          merged.balanceCash = '';
          merged.balanceCard = '';
          merged.balanceUber = '';
          merged.balancePickme = '';
        }
        return merged;
      })
    );
  };

  const handleSubmit = async () => {
    if (isLocked) return;

    for (const r of rows) {
      if (!r.isClosed) {
        const total = rowChannelTotal(r);
        if (total <= 0 || !r.outletEmployeeId) {
          toast.error(
            `For each open showroom, select a cashier and enter amounts (Cash, Card, Uber, PickMe), or mark the showroom as closed. (${r.showroomCode} — ${r.showroomName})`
          );
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const closedAtSubmit = rows.filter((r) => r.isClosed).length;
      await cashierBalanceApi.submit({
        processDate: balanceDate,
        lines: rows.map((r) =>
          r.isClosed
            ? { outletId: r.outletId, isShowroomClosed: true }
            : {
                outletId: r.outletId,
                isShowroomClosed: false,
                outletEmployeeId: r.outletEmployeeId,
                balanceCash: parseChannelNum(r.balanceCash),
                balanceCard: parseChannelNum(r.balanceCard),
                balanceUber: parseChannelNum(r.balanceUber),
                balancePickme: parseChannelNum(r.balancePickme),
              }
        ),
      });
      toast.success('Cashier balance submitted successfully.');
      if (closedAtSubmit > 0) {
        toast.success(
          `${closedAtSubmit} closed showroom${closedAtSubmit > 1 ? 's have' : ' has'} been sent to the approvals queue.`,
          { duration: 5000 }
        );
      }
      await loadPage();
      await loadRecent();
    } catch (e) {
      toast.error(getCashierBalanceApiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
          Cashier Balance
        </h1>
        <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Record daily takings split by <strong>Cash</strong>, <strong>Card</strong>, <strong>Uber</strong>, and{' '}
          <strong>PickMe</strong> for each showroom. Submitted dates are read-only. Closed showrooms are sent for
          approval.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Selected Date
            </p>
            <p className="text-lg font-bold mt-1" style={{ color: 'var(--foreground)' }}>
              {formatSlDate(balanceDate + 'T12:00:00')}
            </p>
            <p className="text-xs mt-1" style={{ color: isLocked ? '#DC2626' : '#10B981' }}>
              {isLocked ? 'Submitted (locked)' : 'Open for entry'}
            </p>
            {isApproved && (
              <p className="text-xs mt-1" style={{ color: '#059669' }}>
                Approved for day-end
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Open Showrooms
            </p>
            <p className="text-lg font-bold mt-1" style={{ color: '#10B981' }}>
              {openCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Closed Showrooms
            </p>
            <p className="text-lg font-bold mt-1" style={{ color: '#DC2626' }}>
              {closedCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Total (Rs.) — sum of Cash + Card + Uber + PickMe
            </p>
            <p className="text-lg font-bold mt-1" style={{ color: '#C8102E' }}>
              {totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle>Balance Entry</CardTitle>
            {isLocked && (
              <Badge variant="warning" size="sm">
                <Lock className="w-3 h-3 mr-1" /> Submitted — Read only
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Balance Date"
                type="date"
                value={balanceDate}
                onChange={(e) => setBalanceDate(e.target.value)}
                max={todayISO()}
                helperText="Defaults to previous day. Past or current dates only."
                fullWidth
                disabled={loading}
              />
            </div>

            {isLocked && submittedAt && (
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Submitted {formatSlDateTime(submittedAt)}
                {submittedByName ? ` by ${submittedByName}` : ''}.
              </p>
            )}

            {!isLocked && !loading && (
              <div
                className="p-3 rounded-lg flex items-start gap-2"
                style={{ backgroundColor: '#EFF6FF', border: '1px solid #3B82F6' }}
              >
                <div className="text-sm" style={{ color: '#1E40AF' }}>
                  <strong>Note:</strong> All active showrooms are included. You can choose the cashier first, then enter
                  Cash, Card, Uber, and PickMe (or enter amounts first — both are allowed before submit).
                </div>
              </div>
            )}

            <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--border)' }}>
              <table className="w-full text-sm">
                <thead style={{ backgroundColor: 'var(--muted)' }}>
                  <tr>
                    <th className="text-left p-3 w-12" style={{ color: 'var(--muted-foreground)' }}>
                      Inc.
                    </th>
                    <th className="text-left p-3" style={{ color: 'var(--muted-foreground)' }}>
                      Showroom
                    </th>
                    <th className="text-center p-3" style={{ color: 'var(--muted-foreground)' }}>
                      Showroom Is Closed
                    </th>
                    <th className="text-left p-3 min-w-[160px]" style={{ color: 'var(--muted-foreground)' }}>
                      Cashier Name
                    </th>
                    <th className="text-left p-3" style={{ color: 'var(--muted-foreground)' }}>
                      Cash (Rs.)
                    </th>
                    <th className="text-left p-3" style={{ color: 'var(--muted-foreground)' }}>
                      Card (Rs.)
                    </th>
                    <th className="text-left p-3" style={{ color: 'var(--muted-foreground)' }}>
                      Uber (Rs.)
                    </th>
                    <th className="text-left p-3" style={{ color: 'var(--muted-foreground)' }}>
                      PickMe (Rs.)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={8} className="p-6 text-center" style={{ color: 'var(--muted-foreground)' }}>
                        Loading…
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    rows.map((r, idx) => {
                      const cashierNameDisabled = isLocked || r.isClosed;
                      const channelDisabled = isLocked || r.isClosed;
                      const closedDisabled = isLocked;
                      const cashiers = cashiersByOutlet[r.outletId] ?? [];
                      const cashierOptions = cashiers.map((c) => ({
                        value: c.outletEmployeeId,
                        label: c.displayName,
                      }));

                      return (
                        <tr
                          key={r.outletId}
                          style={{
                            borderTop: '1px solid var(--border)',
                            backgroundColor: r.selected && !isLocked ? '#F0FDF4' : 'white',
                          }}
                        >
                          <td className="p-3 align-top">
                            <input
                              type="checkbox"
                              checked={r.selected}
                              disabled
                              className="rounded w-4 h-4"
                              title="All showrooms are included for this date"
                            />
                          </td>
                          <td className="p-3">
                            <div className="font-mono font-semibold" style={{ color: '#C8102E' }}>
                              {r.showroomCode}
                            </div>
                            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                              {r.showroomName}
                            </div>
                          </td>
                          <td className="p-3 text-center align-top">
                            <input
                              type="checkbox"
                              checked={r.isClosed}
                              disabled={closedDisabled}
                              onChange={(e) => updateRow(idx, { isClosed: e.target.checked })}
                              className="rounded w-5 h-5"
                              title="Mark showroom as closed for the day"
                            />
                            {r.isClosed && (
                              <div className="text-[11px] mt-1" style={{ color: '#92400E' }}>
                                Sent to approvals
                              </div>
                            )}
                          </td>
                          <td className="p-3 align-top">
                            <Select
                              value={r.outletEmployeeId}
                              disabled={cashierNameDisabled}
                              onChange={(e) => updateRow(idx, { outletEmployeeId: e.target.value })}
                              options={cashierOptions}
                              placeholder={r.isClosed ? 'Closed' : 'Select cashier'}
                              fullWidth
                            />
                          </td>
                          <td className="p-3 align-top">
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={r.balanceCash}
                              disabled={channelDisabled}
                              onChange={(e) => updateRow(idx, { balanceCash: e.target.value })}
                              placeholder={r.isClosed ? 'Closed' : '0.00'}
                              fullWidth
                            />
                          </td>
                          <td className="p-3 align-top">
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={r.balanceCard}
                              disabled={channelDisabled}
                              onChange={(e) => updateRow(idx, { balanceCard: e.target.value })}
                              placeholder={r.isClosed ? 'Closed' : '0.00'}
                              fullWidth
                            />
                          </td>
                          <td className="p-3 align-top">
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={r.balanceUber}
                              disabled={channelDisabled}
                              onChange={(e) => updateRow(idx, { balanceUber: e.target.value })}
                              placeholder={r.isClosed ? 'Closed' : '0.00'}
                              fullWidth
                            />
                          </td>
                          <td className="p-3 align-top">
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={r.balancePickme}
                              disabled={channelDisabled}
                              onChange={(e) => updateRow(idx, { balancePickme: e.target.value })}
                              placeholder={r.isClosed ? 'Closed' : '0.00'}
                              fullWidth
                            />
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {!isLocked && closedCount > 0 && (
              <div
                className="p-3 rounded-lg flex items-start gap-2"
                style={{ backgroundColor: '#FFFBEB', border: '1px solid #FFD100' }}
              >
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#92400E' }} />
                <div className="text-sm" style={{ color: '#92400E' }}>
                  {closedCount} showroom{closedCount > 1 ? 's are' : ' is'} marked closed. These entries will be added to
                  the approvals queue when you submit.
                </div>
              </div>
            )}

            {!isLocked && (
              <div className="flex justify-end pt-2">
                <PermissionButton
                  permission="cashier-balance:edit"
                  variant="primary"
                  size="md"
                  onClick={() => void handleSubmit()}
                  isLoading={submitting}
                  disabled={submitting || loading}
                >
                  <Save className="w-4 h-4 mr-2" /> Submit Cashier Balance
                </PermissionButton>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              No balances submitted yet.
            </p>
          ) : (
            <div className="space-y-3">
              {recent.map((s) => (
                <div
                  key={`${s.processDate}-${s.submittedAt}`}
                  className="flex items-center justify-between p-4 rounded-lg"
                  style={{ border: '1px solid var(--border)' }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: '#FEF3C4' }}
                    >
                      <DollarSign className="w-5 h-5" style={{ color: '#C8102E' }} />
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                        {formatSlDate(s.processDate + 'T12:00:00')} — Total Rs.{' '}
                        {s.totalBalance.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        {s.submittedByName ?? 'Unknown'} — {formatSlDateTime(s.submittedAt)} —{' '}
                        {s.closedShowroomCount} closed
                      </p>
                    </div>
                  </div>
                  <Badge variant="success" size="sm">
                    <CheckCircle className="w-3 h-3 mr-1" /> Submitted
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function CashierBalancePage() {
  return (
    <ProtectedPage permission="cashier-balance:view">
      <CashierBalanceContent />
    </ProtectedPage>
  );
}
