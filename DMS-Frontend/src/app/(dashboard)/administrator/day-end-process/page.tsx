'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Lock, AlertTriangle, ShieldAlert } from 'lucide-react';
import { previousCalendarDayUtcISO } from '@/lib/date-restrictions';
import { useDayEndStore } from '@/lib/stores/day-end-store';
import { ProtectedPage, PermissionButton } from '@/components/auth';
import {
  dayEndApi,
  getDayEndApiErrorMessage,
  type DayEndCashierOption,
  type DayEndOutletRow,
} from '@/lib/api/day-end';
import {
  cashierBalanceApi,
  getCashierBalanceApiErrorMessage,
} from '@/lib/api/cashier-balance';

/**
 * 6.i Day-End Process
 *
 * Data from `GET /api/day-end/context` and `GET /api/day-end/outlets/{id}/cashiers`.
 * Submit: `POST /api/day-end/submit` (requires day-end:execute).
 * Approve cashier balance for date: `POST /api/day-end/cashier-balance/approve` (cashier-balance:edit).
 */

interface OutletRowState {
  outletId: string;
  outletName: string;
  systemBalance: number;
  rowStatus: string;
  selected: boolean;
  outletEmployeeId: string;
  cashierBalance: string;
}

function formatMoney(n: number): string {
  if (!Number.isFinite(n)) return '0.00';
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseBalanceInput(raw: string): number | null {
  const t = raw.trim().replace(/,/g, '');
  if (t === '') return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return n;
}

function mapOutletsToRows(outlets: DayEndOutletRow[]): OutletRowState[] {
  return outlets.map((o) => ({
    outletId: o.outletId,
    outletName: o.outletName,
    systemBalance: o.systemBalance,
    rowStatus: o.rowStatus,
    selected: false,
    outletEmployeeId: '',
    cashierBalance: '',
  }));
}

function DayEndProcessContent() {
  const setLastDayEndProcessDate = useDayEndStore((s) => s.setLastDayEndProcessDate);

  const [processDate, setProcessDate] = useState<string>(previousCalendarDayUtcISO());
  const [rows, setRows] = useState<OutletRowState[]>([]);
  const [cashiersByOutlet, setCashiersByOutlet] = useState<Record<string, DayEndCashierOption[]>>({});
  const [cashierApproved, setCashierApproved] = useState(false);
  const [dayLocked, setDayLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const loadContext = useCallback(async () => {
    setLoading(true);
    try {
      const ctx = await dayEndApi.getContext(processDate);
      setCashierApproved(ctx.cashierBalanceApproved);
      setDayLocked(ctx.dayLocked);

      let outletRows = mapOutletsToRows(ctx.outlets);
      if (outletRows.length === 0) {
        try {
          const cb = await cashierBalanceApi.getContext(processDate);
          outletRows = cb.outlets.map((o) => ({
            outletId: o.outletId,
            outletName: o.name,
            systemBalance: 0,
            rowStatus: 'Pending',
            selected: false,
            outletEmployeeId: o.outletEmployeeId ?? '',
            cashierBalance:
              o.cashierBalance != null && Number.isFinite(o.cashierBalance) ? String(o.cashierBalance) : '',
          }));
        } catch (cbErr) {
          console.warn('Day-end: no outlets from day-end context; cashier balance fallback failed', cbErr);
          toast.error(getCashierBalanceApiErrorMessage(cbErr));
        }
      }
      setRows(outletRows);
      setCashiersByOutlet({});

      if (ctx.lastDayEndProcessDate) {
        setLastDayEndProcessDate(ctx.lastDayEndProcessDate);
      }

      const ids = outletRows.map((o) => o.outletId).filter(Boolean);
      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            const list = await dayEndApi.getCashiersForOutlet(id);
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
      toast.error(getDayEndApiErrorMessage(e));
      setRows([]);
      setCashiersByOutlet({});
    } finally {
      setLoading(false);
    }
  }, [processDate, setLastDayEndProcessDate]);

  useEffect(() => {
    void loadContext();
  }, [loadContext]);

  const blocked = !cashierApproved || dayLocked;

  const blockReason = useMemo(() => {
    if (dayLocked) return 'Selected date is Day-Locked. Day-End Process cannot be performed.';
    if (!cashierApproved)
      return 'Cashier Balance for this date is not approved. All Day-End Process actions are disabled.';
    return null;
  }, [dayLocked, cashierApproved]);

  const toggleShowroom = (id: string) => {
    if (blocked) return;
    setRows((prev) => prev.map((s) => (s.outletId === id ? { ...s, selected: !s.selected } : s)));
  };

  const updateCashier = (id: string, outletEmployeeId: string) => {
    if (blocked) return;
    setRows((prev) => prev.map((s) => (s.outletId === id ? { ...s, outletEmployeeId } : s)));
  };

  const updateCashierBalance = (id: string, balance: string) => {
    if (blocked) return;
    setRows((prev) => prev.map((s) => (s.outletId === id ? { ...s, cashierBalance: balance } : s)));
  };

  const handleApproveCashierBalance = async () => {
    if (dayLocked) return;
    setIsApproving(true);
    try {
      await dayEndApi.approveCashierBalance(processDate);
      toast.success('Cashier balance approved for this date.');
      await loadContext();
    } catch (e) {
      toast.error(getDayEndApiErrorMessage(e));
    } finally {
      setIsApproving(false);
    }
  };

  const handleSubmit = async () => {
    if (blocked) return;

    const selected = rows.filter((s) => s.selected);
    if (selected.length === 0) {
      toast.error('Please select at least one showroom.');
      return;
    }

    for (const showroom of selected) {
      if (!showroom.outletEmployeeId) {
        toast.error(`Please select a cashier for ${showroom.outletName}.`);
        return;
      }
      const bal = parseBalanceInput(showroom.cashierBalance);
      if (bal === null) {
        toast.error(`Please enter a valid cashier balance for ${showroom.outletName}.`);
        return;
      }
    }

    setIsProcessing(true);
    try {
      await dayEndApi.submit({
        processDate,
        lines: selected.map((s) => ({
          outletId: s.outletId,
          outletEmployeeId: s.outletEmployeeId,
          cashierBalance: parseBalanceInput(s.cashierBalance)!,
        })),
      });
      toast.success('Day-End Process submitted successfully.');
      await loadContext();
    } catch (e) {
      toast.error(getDayEndApiErrorMessage(e));
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'completed') {
      return (
        <Badge variant="success" size="sm">
          Completed
        </Badge>
      );
    }
    if (s === 'error') {
      return (
        <Badge variant="danger" size="sm">
          Error
        </Badge>
      );
    }
    return (
      <Badge variant="neutral" size="sm">
        —
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
          Day-End Process
        </h1>
        <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Complete daily closing operations for selected showrooms. Page defaults to the previous day.
        </p>
      </div>

      {blockReason && (
        <div
          className="p-4 rounded-lg flex items-start gap-3"
          style={{
            backgroundColor: dayLocked ? '#FEF2F2' : '#FFFBEB',
            border: `1px solid ${dayLocked ? '#FCA5A5' : '#FFD100'}`,
          }}
        >
          <ShieldAlert
            className="w-5 h-5 mt-0.5 shrink-0"
            style={{ color: dayLocked ? '#DC2626' : '#92400E' }}
          />
          <p className="text-sm font-medium" style={{ color: dayLocked ? '#991B1B' : '#92400E' }}>
            {blockReason}
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Day-End Process</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <label
                className="text-sm font-medium shrink-0"
                style={{ color: 'var(--foreground)', minWidth: '100px' }}
              >
                Process Date:
              </label>
              <Input
                type="date"
                value={processDate}
                onChange={(e) => setProcessDate(e.target.value)}
                max={previousCalendarDayUtcISO()}
                disabled={loading}
                style={{ maxWidth: '200px' }}
              />
              {cashierApproved ? (
                <Badge variant="success" size="sm">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Cashier Balance Approved
                </Badge>
              ) : (
                <Badge variant="danger" size="sm">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Cashier Balance Not Approved
                </Badge>
              )}
              {dayLocked && (
                <Badge variant="danger" size="sm">
                  <Lock className="w-3 h-3 mr-1" />
                  Day Locked
                </Badge>
              )}
              {!cashierApproved && !dayLocked && (
                <PermissionButton
                  permission="cashier-balance:edit"
                  variant="outline"
                  size="sm"
                  onClick={() => void handleApproveCashierBalance()}
                  isLoading={isApproving}
                  disabled={loading || isApproving}
                >
                  Approve cashier balance for this date
                </PermissionButton>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                    <th
                      className="text-left py-3 px-4"
                      style={{
                        color: 'var(--muted-foreground)',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        width: '50px',
                      }}
                    />
                    <th
                      className="text-left py-3 px-4"
                      style={{ color: 'var(--muted-foreground)', fontWeight: 600, fontSize: '0.875rem' }}
                    >
                      ShowRoom
                    </th>
                    <th
                      className="text-left py-3 px-4"
                      style={{ color: 'var(--muted-foreground)', fontWeight: 600, fontSize: '0.875rem' }}
                    >
                      Cashier Name
                    </th>
                    <th
                      className="text-left py-3 px-4"
                      style={{ color: 'var(--muted-foreground)', fontWeight: 600, fontSize: '0.875rem' }}
                    >
                      Cashier&apos;s Balance
                    </th>
                    <th
                      className="text-left py-3 px-4"
                      style={{ color: 'var(--muted-foreground)', fontWeight: 600, fontSize: '0.875rem' }}
                    >
                      System Balance
                    </th>
                    <th
                      className="text-left py-3 px-4"
                      style={{ color: 'var(--muted-foreground)', fontWeight: 600, fontSize: '0.875rem' }}
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
                        Loading…
                      </td>
                    </tr>
                  )}
                  {!loading && rows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
                        No active showrooms found.
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    rows.map((showroom, index) => {
                      const cashiers = cashiersByOutlet[showroom.outletId] ?? [];
                      return (
                        <tr
                          key={showroom.outletId}
                          style={{
                            borderBottom: index < rows.length - 1 ? '1px solid var(--border)' : 'none',
                            backgroundColor: showroom.selected && !blocked ? '#F0FDF4' : 'white',
                            opacity: blocked ? 0.6 : 1,
                          }}
                        >
                          <td className="py-3 px-4">
                            <input
                              type="checkbox"
                              checked={showroom.selected}
                              onChange={() => toggleShowroom(showroom.outletId)}
                              disabled={blocked}
                              className="rounded w-4 h-4"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium" style={{ color: '#C8102E' }}>
                              {showroom.outletName}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={showroom.outletEmployeeId}
                              onChange={(e) => updateCashier(showroom.outletId, e.target.value)}
                              disabled={blocked}
                              className="w-full min-w-[160px] px-3 py-2 rounded-lg text-sm"
                              style={{ border: '1px solid var(--input)' }}
                            >
                              <option value="">-- Select Cashier --</option>
                              {cashiers.map((c) => (
                                <option key={c.outletEmployeeId} value={c.outletEmployeeId}>
                                  {c.displayName}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={showroom.cashierBalance}
                              onChange={(e) => updateCashierBalance(showroom.outletId, e.target.value)}
                              disabled={blocked}
                              placeholder="0.00"
                              className="w-full max-w-[140px] px-3 py-2 rounded-lg text-sm"
                              style={{ border: '1px solid var(--input)' }}
                            />
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium">{formatMoney(showroom.systemBalance)}</span>
                          </td>
                          <td className="py-3 px-4">{getStatusBadge(showroom.rowStatus)}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-4">
              <PermissionButton
                permission="day-end:execute"
                variant="primary"
                size="md"
                onClick={() => void handleSubmit()}
                isLoading={isProcessing}
                disabled={blocked || isProcessing || loading}
              >
                {isProcessing ? (
                  <>Processing...</>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Submit Day-End Process
                  </>
                )}
              </PermissionButton>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DayEndProcessPage() {
  return (
    <ProtectedPage permission="day-end:view">
      <DayEndProcessContent />
    </ProtectedPage>
  );
}
