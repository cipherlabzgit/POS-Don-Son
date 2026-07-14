'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Select from '@/components/ui/select';
import Input from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { ProtectedPage } from '@/components/auth';
import { usePermissions } from '@/hooks/usePermissions';
import { Calendar, Loader2, Plus, Truck, AlertCircle, CheckCircle2, ListOrdered } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import {
  administratorDeliveryPlanApi,
  type AdministratorDeliverySchedule,
  type AdministratorPlanningWindow,
  type AdministratorUpcomingPlan,
  getAdministratorDeliveryPlanErrorMessage,
} from '@/lib/api/admin-delivery-plan';

const SL_OFFSET_MS = 5.5 * 60 * 60 * 1000; // UTC+5:30

/**
 * Parse an ISO timestamp or yyyy-MM-dd string and return the Sri Lanka calendar date.
 * Dates from the API are stored as UTC midnight-of-SL-date (SL midnight = UTC-5:30 of previous UTC day),
 * so we add the SL offset before extracting the date parts.
 */
function slDateFromIso(iso: string): { y: number; m: number; d: number } | null {
  if (!iso) return null;
  // If date-only string like "2026-05-08", treat as SL date directly
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split('-').map(Number);
    if (y && m && d) return { y, m, d };
    return null;
  }
  // Full ISO timestamp — convert to SL time
  const utcMs = new Date(iso).getTime();
  if (isNaN(utcMs)) return null;
  const slMs = utcMs + SL_OFFSET_MS;
  const slDate = new Date(slMs);
  return { y: slDate.getUTCFullYear(), m: slDate.getUTCMonth() + 1, d: slDate.getUTCDate() };
}

/** Format an ISO date/timestamp as a long SL date string. */
function formatSlDate(iso: string): string {
  const parts = slDateFromIso(iso);
  if (!parts) return iso;
  const dt = new Date(Date.UTC(parts.y, parts.m - 1, parts.d));
  return dt.toLocaleDateString('en-LK', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Colombo',
  });
}

/** Short date label for select options e.g. "2026-05-08  (Thu, 8 May)" — input is always a yyyy-MM-dd SL date. */
function formatSlDateShort(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  const dt = new Date(Date.UTC(y, m - 1, d));
  const label = dt.toLocaleDateString('en-LK', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Colombo',
  });
  return `${isoDate}  (${label})`;
}

export default function AdministratorDeliveryPlanPage() {
  const router = useRouter();
  const { can } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<AdministratorDeliverySchedule[]>([]);
  const [windowInfo, setWindowInfo] = useState<AdministratorPlanningWindow | null>(null);
  const [upcoming, setUpcoming] = useState<AdministratorUpcomingPlan[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [planDate, setPlanDate] = useState('');
  const [dayTypeId, setDayTypeId] = useState('');
  const [deliveryTurnId, setDeliveryTurnId] = useState('');
  const [useFreezerStock, setUseFreezerStock] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [sch, win, up] = await Promise.all([
        administratorDeliveryPlanApi.getSchedules(),
        administratorDeliveryPlanApi.getWindow(),
        administratorDeliveryPlanApi.getUpcomingPlans(),
      ]);
      setSchedules(sch);
      setWindowInfo(win);
      setUpcoming(up);
    } catch (e) {
      toast.error(getAdministratorDeliveryPlanErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** Keep selected turn valid when the planning window or date changes (5 AM slots only). */
  useEffect(() => {
    if (!modalOpen || !windowInfo?.availableDeliveryTurns.length) return;
    setDeliveryTurnId((prev) =>
      windowInfo.availableDeliveryTurns.some((t) => t.id === prev)
        ? prev
        : windowInfo.availableDeliveryTurns[0]!.id
    );
  }, [planDate, modalOpen, windowInfo]);

  const openModal = () => {
    if (windowInfo?.allowedPlanDates.length) {
      setPlanDate(windowInfo.allowedPlanDates[0]!);
    }
    if (schedules.length > 0) {
      setDayTypeId(schedules[0]!.dayTypeId);
    }
    const firstTurn = windowInfo?.availableDeliveryTurns[0];
    setDeliveryTurnId(firstTurn?.id ?? '');
    setUseFreezerStock(false);
    setNotes('');
    setModalOpen(true);
  };

  const submitQuickCreate = async () => {
    if (!planDate || !dayTypeId || !deliveryTurnId) {
      toast.error('Select a plan date, day type, and delivery turn.');
      return;
    }
    try {
      setSubmitting(true);
      await administratorDeliveryPlanApi.quickCreate({
        planDate,
        dayTypeId,
        deliveryTurnId,
        useFreezerStock,
        notes: notes.trim() || undefined,
      });
      toast.success('Delivery plan created and delivery tables updated.');
      setModalOpen(false);
      await load();
    } catch (e) {
      toast.error(getAdministratorDeliveryPlanErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const dateOptions =
    windowInfo?.allowedPlanDates.map((d) => ({
      value: d,
      label: formatSlDateShort(d),
    })) ?? [];

  const dayTypeOptions = schedules.map((s) => ({
    value: s.dayTypeId,
    label: s.displayName,
  }));

  const deliveryTurnOptions =
    windowInfo?.availableDeliveryTurns.map((t) => ({
      value: t.id,
      label: `${t.name} — ${t.deliveryTimeDisplay}`,
    })) ?? [];

  return (
    <ProtectedPage permission="admin-delivery-plan:view">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: 'var(--foreground)' }}>
              <Calendar className="w-8 h-8" style={{ color: '#C8102E' }} />
              Delivery Plan
            </h1>
            <p className="mt-1 max-w-2xl text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Pre-load delivery plans for the next three Sri Lanka calendar days (starting tomorrow). Plans use the{' '}
              <strong>5:00 AM</strong> preload turn only (configure under Delivery Turns). Quick create submits the plan
              and updates draft delivery records per outlet. Use <strong>Full details</strong> on a plan below to review
              every outlet × product line before delivery.
            </p>
          </div>
          {can('admin-delivery-plan:create') && (
            <Button
              variant="primary"
              size="md"
              onClick={openModal}
              disabled={!windowInfo || schedules.length === 0 || windowInfo.availableDeliveryTurns.length === 0}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New
            </Button>
          )}
        </div>

        {/* Warning: no delivery turns */}
        {windowInfo && windowInfo.availableDeliveryTurns.length === 0 && (
          <div
            className="p-4 rounded-lg flex items-start gap-3"
            style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5' }}
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#DC2626' }} />
            <p className="text-sm" style={{ color: '#991B1B' }}>
              Quick create needs an active delivery turn at exactly <strong>5:00 AM</strong>. Enable one under{' '}
              <strong>Delivery Turns</strong> (delivery time 05:00:00).
            </p>
          </div>
        )}

        {/* Planning window info */}
        {windowInfo && (
          <div
            className="p-4 rounded-lg flex items-start gap-2"
            style={{ backgroundColor: '#FFFBEB', border: '1px solid #FFD100' }}
          >
            <Calendar className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#92400E' }} />
            <p className="text-sm" style={{ color: '#92400E' }}>
              <strong>Planning window (Sri Lanka time):</strong> {windowInfo.minPlanDate} through{' '}
              {windowInfo.maxPlanDate}. Preload slot:{' '}
              <strong>
                {windowInfo.availableDeliveryTurns.length === 0
                  ? 'none — add an active 5:00 AM turn under Delivery Turns'
                  : windowInfo.availableDeliveryTurns
                      .map((t) => `${t.name} (${t.deliveryTimeDisplay})`)
                      .join(', ')}
              </strong>
              .
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin" style={{ color: '#C8102E' }} />
          </div>
        ) : (
          <>
            {/* Day type schedule list — mirrors the screenshot exactly */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Delivery Plan</CardTitle>
                  {can('admin-delivery-plan:create') && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={openModal}
                      disabled={
                        !windowInfo || schedules.length === 0 || windowInfo.availableDeliveryTurns.length === 0
                      }
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add New
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {schedules.map((s) => (
                    <div
                      key={s.dayTypeId}
                      className="px-6 py-4 flex items-center gap-3"
                      style={{ color: 'var(--foreground)' }}
                    >
                      <Truck className="w-4 h-4 shrink-0" style={{ color: '#C8102E' }} />
                      <span className="text-sm font-medium">{s.displayName}</span>
                    </div>
                  ))}
                  {schedules.length === 0 && (
                    <div className="px-6 py-10 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
                      No active day types configured. Go to{' '}
                      <strong>Administrator → Day Types</strong> to set them up.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Plans already created in the window */}
            {upcoming.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Plans in current window</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                    {upcoming.map((p) => {
                      return (
                        <div
                          key={p.id}
                          className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                        >
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#16a34a' }} />
                            <div className="min-w-0">
                              <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                                {p.dayTypeName} — {formatSlDate(p.planDate)} — {p.deliveryTurnName}
                              </p>
                              <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                                {p.planNo} · {p.totalItems} item{p.totalItems !== 1 ? 's' : ''} · Turn:{' '}
                                {p.deliveryTurnName}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => router.push(`/dms/delivery-plan/edit/${p.id}`)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-opacity hover:opacity-90"
                              style={{
                                color: 'var(--brand-primary)',
                                border: '1px solid var(--border)',
                                backgroundColor: 'var(--card)',
                              }}
                              title="Open full plan: all outlets, products, and quantities"
                            >
                              <ListOrdered className="w-3.5 h-3.5 shrink-0" aria-hidden />
                              Full details
                            </button>
                            <Badge
                              variant={p.status === 'InProduction' ? 'success' : 'warning'}
                              size="sm"
                            >
                              {p.status}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Quick-create modal */}
        <Modal
          isOpen={modalOpen}
          onClose={() => !submitting && setModalOpen(false)}
          title="Add Delivery Plan"
          size="md"
        >
          <div className="space-y-4">
            <Select
              label="Plan date (Sri Lanka time)"
              fullWidth
              options={dateOptions}
              value={planDate}
              onChange={(e) => setPlanDate(e.target.value)}
            />
            <Select
              label="Day type"
              fullWidth
              options={dayTypeOptions}
              value={dayTypeId}
              onChange={(e) => setDayTypeId(e.target.value)}
            />
            <Select
              label="Delivery turn (5:00 AM preload)"
              fullWidth
              options={deliveryTurnOptions}
              value={deliveryTurnId}
              onChange={(e) => setDeliveryTurnId(e.target.value)}
            />
            <Toggle
              checked={useFreezerStock}
              onChange={setUseFreezerStock}
              label="Use freezer stock"
            />
            <Input
              label="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
              placeholder="Optional notes for this plan"
            />
          </div>
          <ModalFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => void submitQuickCreate()}
              disabled={submitting || !planDate || !dayTypeId || !deliveryTurnId}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating…
                </>
              ) : (
                'Create & update deliveries'
              )}
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    </ProtectedPage>
  );
}
