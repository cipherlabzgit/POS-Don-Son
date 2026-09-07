'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle, Lock, AlertTriangle, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { previousCalendarDayUtcISO } from '@/lib/date-restrictions';
import { useDayEndStore } from '@/lib/stores/day-end-store';
import { ProtectedPage, PermissionButton } from '@/components/auth';
import { Modal, ModalFooter } from '@/components/ui/modal';
import {
  dayEndApi,
  getDayEndApiErrorMessage,
  type DayEndCashierOption,
  type DayEndOutletRow,
  type SaleRecordNotifyTarget,
} from '@/lib/api/day-end';
import {
  cashierBalanceApi,
  getCashierBalanceApiErrorMessage,
} from '@/lib/api/cashier-balance';

const WEEKDAY_OPTIONS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

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
  const [weekStartDay, setWeekStartDay] = useState(3);
  const [weeksToShow, setWeeksToShow] = useState(2);
  const [savingSettings, setSavingSettings] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyTargets, setNotifyTargets] = useState<SaleRecordNotifyTarget[]>([]);
  const [notifySelected, setNotifySelected] = useState<Record<string, boolean>>({});
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifySending, setNotifySending] = useState(false);

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

  useEffect(() => {
    void (async () => {
      try {
        const settings = await dayEndApi.getSaleRecordsSettings();
        setWeekStartDay(settings.weekStartDay);
        setWeeksToShow(settings.weeksToShow);
      } catch {
        /* settings stay at defaults until API is available */
      }
    })();
  }, []);

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

  const handleSaveSaleRecordsSettings = async () => {
    setSavingSettings(true);
    try {
      const saved = await dayEndApi.updateSaleRecordsSettings({
        weekStartDay,
        weeksToShow,
      });
      setWeekStartDay(saved.weekStartDay);
      setWeeksToShow(saved.weeksToShow);
      toast.success('POS sale records window saved.');
    } catch (e) {
      toast.error(getDayEndApiErrorMessage(e));
    } finally {
      setSavingSettings(false);
    }
  };

  const openNotifyModal = async () => {
    if (!dayLocked) return;
    setNotifyOpen(true);
    setNotifyLoading(true);
    try {
      const list = await dayEndApi.getNotifyTargets(processDate);
      setNotifyTargets(list);
      const sel: Record<string, boolean> = {};
      for (const t of list) {
        sel[t.outletId] = t.canNotify;
      }
      setNotifySelected(sel);
    } catch (e) {
      toast.error(getDayEndApiErrorMessage(e));
      setNotifyTargets([]);
    } finally {
      setNotifyLoading(false);
    }
  };

  const notifySelectable = notifyTargets.filter((t) => t.canNotify);
  const allNotifySelected =
    notifySelectable.length > 0 && notifySelectable.every((t) => notifySelected[t.outletId]);

  const toggleNotifyAll = (checked: boolean) => {
    setNotifySelected((prev) => {
      const next = { ...prev };
      for (const t of notifyTargets) {
        if (t.canNotify) next[t.outletId] = checked;
      }
      return next;
    });
  };

  const handleNotifyCashiers = async () => {
    const ids = notifyTargets.filter((t) => t.canNotify && notifySelected[t.outletId]).map((t) => t.outletId);
    if (ids.length === 0) {
      toast.error('Select at least one showroom.');
      return;
    }
    const already = notifyTargets.filter((t) => ids.includes(t.outletId) && t.alreadyNotified);
    let confirmRenotify = false;
    if (already.length > 0) {
      confirmRenotify = window.confirm(
        'Already notified showrooms can be notified again. Send again to the selected showrooms?'
      );
      if (!confirmRenotify) return;
    }

    setNotifySending(true);
    try {
      await dayEndApi.notifyCashiers({
        processDate,
        outletIds: ids,
        confirmRenotify,
      });
      toast.success('Cashiers notified.');
      setNotifyOpen(false);
    } catch (e) {
      const msg = getDayEndApiErrorMessage(e);
      if (/already notified/i.test(msg)) {
        const ok = window.confirm(`${msg} Notify them again?`);
        if (ok) {
          try {
            await dayEndApi.notifyCashiers({
              processDate,
              outletIds: ids,
              confirmRenotify: true,
            });
            toast.success('Cashiers notified.');
            setNotifyOpen(false);
          } catch (e2) {
            toast.error(getDayEndApiErrorMessage(e2));
          }
        }
      } else {
        toast.error(msg);
      }
    } finally {
      setNotifySending(false);
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

      <Card>
        <CardHeader>
          <CardTitle>POS sale records window</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
            Cashier turn week and how many weeks (including the current week) cashiers can see on POS.
          </p>
          <div className="flex flex-wrap items-end gap-4">
            <label className="text-sm font-medium">
              <span className="block mb-1" style={{ color: 'var(--muted-foreground)' }}>
                Cashier turn week starts
              </span>
              <select
                value={weekStartDay}
                onChange={(e) => setWeekStartDay(Number(e.target.value))}
                className="px-3 py-2 rounded-lg text-sm min-w-[160px]"
                style={{ border: '1px solid var(--input)' }}
              >
                {WEEKDAY_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              <span className="block mb-1" style={{ color: 'var(--muted-foreground)' }}>
                Weeks to allow on POS
              </span>
              <Input
                type="number"
                min={1}
                max={12}
                value={weeksToShow}
                onChange={(e) => setWeeksToShow(Number(e.target.value))}
                style={{ maxWidth: '120px' }}
              />
            </label>
            <PermissionButton
              permission="day-end:edit"
              variant="outline"
              size="sm"
              onClick={() => void handleSaveSaleRecordsSettings()}
              isLoading={savingSettings}
              disabled={savingSettings}
            >
              Save window
            </PermissionButton>
          </div>
        </CardContent>
      </Card>

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

            <div className="flex justify-end gap-3 pt-4">
              {dayLocked ? (
                <PermissionButton
                  permission="day-end:notify"
                  variant="outline"
                  size="md"
                  onClick={() => void openNotifyModal()}
                  disabled={loading || notifyLoading}
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Notify To Cashier
                </PermissionButton>
              ) : null}
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

      <Modal
        isOpen={notifyOpen}
        onClose={() => setNotifyOpen(false)}
        title="Notify Cashiers"
        size="lg"
        closeVariant="danger"
      >
        <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
          Select one or more showrooms for {processDate.split('-').reverse().join('/')}. Already notified
          showrooms can be notified again after confirmation.
        </p>
        {notifyLoading ? (
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Loading…
          </p>
        ) : (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={allNotifySelected}
                onChange={(e) => toggleNotifyAll(e.target.checked)}
                className="rounded w-4 h-4"
              />
              Select all showrooms
            </label>
            <div className="max-h-80 overflow-y-auto divide-y" style={{ border: '1px solid var(--border)' }}>
              {notifyTargets.map((t) => (
                <label
                  key={t.outletId}
                  className="flex items-center gap-3 px-3 py-2 text-sm"
                  style={{ opacity: t.canNotify ? 1 : 0.5 }}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(notifySelected[t.outletId])}
                    disabled={!t.canNotify}
                    onChange={(e) =>
                      setNotifySelected((prev) => ({ ...prev, [t.outletId]: e.target.checked }))
                    }
                    className="rounded w-4 h-4"
                  />
                  <span className="flex-1 font-medium">{t.outletName}</span>
                  <span className="min-w-[8rem]">{t.cashierName}</span>
                  <Badge variant={t.alreadyNotified ? 'success' : 'danger'} size="sm">
                    {t.alreadyNotified ? 'Notified' : t.status}
                  </Badge>
                </label>
              ))}
            </div>
          </div>
        )}
        <ModalFooter>
          <Button type="button" variant="outline" onClick={() => setNotifyOpen(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => void handleNotifyCashiers()}
            isLoading={notifySending}
            disabled={notifyLoading || notifySending}
          >
            Notify selected
          </Button>
        </ModalFooter>
      </Modal>
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
