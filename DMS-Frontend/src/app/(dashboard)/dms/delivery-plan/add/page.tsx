'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import { ArrowLeft, Plus, Loader2 } from 'lucide-react';
import {
  deliveryPlansApi,
  type BulkUpsertDeliveryPlanItemDto,
  type DeliveryPlanningWindow,
} from '@/lib/api/delivery-plans';
import { dayTypesApi, type DayType } from '@/lib/api/day-types';
import { defaultQuantitiesApi, type DefaultQuantity } from '@/lib/api/default-quantities';
import { toast } from 'sonner';

export default function AddDeliveryPlanPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dayTypes, setDayTypes] = useState<DayType[]>([]);
  /** Backend rules: next 3 SL days from tomorrow, 5:00 AM turns only. */
  const [planningWindow, setPlanningWindow] = useState<DeliveryPlanningWindow | null>(null);

  /** Default quantity rows for the selected day type (B1: loaded when day type changes). */
  const [defaultRows, setDefaultRows] = useState<DefaultQuantity[]>([]);
  const [defaultsLoading, setDefaultsLoading] = useState(false);

  /** Included = outlet participates; unchecked = closed for this plan (all its lines excluded). */
  const [outletIncluded, setOutletIncluded] = useState<Record<string, boolean>>({});
  /** Included = product is produced; unchecked = not produced for any outlet in this plan. */
  const [productIncluded, setProductIncluded] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
    planDate: '',
    dayTypeId: '',
    deliveryTurnId: '',
    useFreezerStock: false,
    notes: '',
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!formData.dayTypeId) {
      setDefaultRows([]);
      setOutletIncluded({});
      setProductIncluded({});
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setDefaultsLoading(true);
        const res = await defaultQuantitiesApi.getAll(1, 3000, undefined, formData.dayTypeId);
        if (cancelled) return;
        const rows = res.defaultQuantities ?? [];
        setDefaultRows(rows);

        const nextO: Record<string, boolean> = {};
        const nextP: Record<string, boolean> = {};
        for (const row of rows) {
          if (nextO[row.outletId] === undefined) nextO[row.outletId] = true;
          if (nextP[row.productId] === undefined) nextP[row.productId] = true;
        }
        setOutletIncluded(nextO);
        setProductIncluded(nextP);
      } catch (error) {
        console.error('Error loading default quantities:', error);
        if (!cancelled) {
          setDefaultRows([]);
          toast.error('Could not load default quantities for this day type');
        }
      } finally {
        if (!cancelled) setDefaultsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [formData.dayTypeId]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [dayTypesRes, windowRes] = await Promise.all([
        dayTypesApi.getAll(1, 100, undefined, true),
        deliveryPlansApi.getPlanningWindow(),
      ]);

      setDayTypes(dayTypesRes.dayTypes);
      setPlanningWindow(windowRes);

      const defaultDate =
        windowRes.allowedPlanDates[0] ?? windowRes.minPlanDate ?? '';

      setFormData((prev) => ({
        ...prev,
        planDate: defaultDate || prev.planDate,
        dayTypeId: dayTypesRes.dayTypes[0]?.id ?? '',
        deliveryTurnId: windowRes.availableDeliveryTurns[0]?.id ?? '',
      }));
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const outlets = useMemo(() => {
    const seen = new Set<string>();
    const list: { id: string; name: string }[] = [];
    for (const row of defaultRows) {
      if (seen.has(row.outletId)) continue;
      seen.add(row.outletId);
      list.push({ id: row.outletId, name: row.outletName });
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [defaultRows]);

  const products = useMemo(() => {
    const seen = new Set<string>();
    const list: { id: string; name: string }[] = [];
    for (const row of defaultRows) {
      if (seen.has(row.productId)) continue;
      seen.add(row.productId);
      list.push({ id: row.productId, name: row.productName });
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [defaultRows]);

  const setOutletIncludedOne = (outletId: string, included: boolean) => {
    setOutletIncluded((prev) => ({ ...prev, [outletId]: included }));
  };

  const setProductIncludedOne = (productId: string, included: boolean) => {
    setProductIncluded((prev) => ({ ...prev, [productId]: included }));
  };

  const isOutletExcluded = (outletId: string) => !(outletIncluded[outletId] ?? true);

  const isProductExcluded = (productId: string) => !(productIncluded[productId] ?? true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.dayTypeId) {
      toast.error('Please select a day type');
      return;
    }
    if (!formData.deliveryTurnId) {
      toast.error('Please select a delivery turn');
      return;
    }

    if (
      planningWindow &&
      planningWindow.allowedPlanDates.length > 0 &&
      !planningWindow.allowedPlanDates.includes(formData.planDate)
    ) {
      toast.error('Plan date must be within the allowed Sri Lanka planning window.');
      return;
    }

    try {
      setIsSubmitting(true);
      const newPlan = await deliveryPlansApi.create({
        planDate: formData.planDate,
        dayTypeId: formData.dayTypeId,
        deliveryTurnId: formData.deliveryTurnId,
        useFreezerStock: formData.useFreezerStock,
        notes: formData.notes || undefined,
      });

      const items: BulkUpsertDeliveryPlanItemDto[] = defaultRows.map((dq) => {
        const oOk = outletIncluded[dq.outletId] ?? true;
        const pOk = productIncluded[dq.productId] ?? true;
        return {
          outletId: dq.outletId,
          productId: dq.productId,
          fullQuantity: dq.fullQuantity,
          miniQuantity: dq.miniQuantity,
          isExcluded: !oOk || !pOk,
        };
      });

      if (items.length > 0) {
        await deliveryPlansApi.bulkUpsertItems(newPlan.id, items);
      }

      toast.success('Delivery plan created as Draft with default quantities.');
      router.push(`/dms/delivery-plan/edit/${newPlan.id}`);
    } catch (error) {
      console.error('Error creating plan:', error);
      toast.error('Failed to create delivery plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p style={{ color: 'var(--muted-foreground)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            Create Delivery Plan
          </h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Preload window: next three Sri Lanka calendar days from tomorrow, 5:00 AM turn only. Defaults load when you
            choose a day type; save as Draft.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plan Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Plan Date"
              type="date"
              value={formData.planDate}
              min={planningWindow?.minPlanDate}
              max={planningWindow?.maxPlanDate}
              onChange={(e) => {
                const next = e.target.value;
                setFormData((prev) => {
                  const turns = planningWindow?.availableDeliveryTurns ?? [];
                  const stillOk = turns.some((t) => t.id === prev.deliveryTurnId);
                  return {
                    ...prev,
                    planDate: next,
                    deliveryTurnId: stillOk ? prev.deliveryTurnId : turns[0]?.id ?? '',
                  };
                });
              }}
              helperText={
                planningWindow
                  ? `Sri Lanka preload window: ${planningWindow.minPlanDate} – ${planningWindow.maxPlanDate} (next 3 days from tomorrow).`
                  : 'Delivery date for this plan'
              }
              fullWidth
              required
            />

            <Select
              label="Day Type"
              value={formData.dayTypeId}
              onChange={(e) => setFormData({ ...formData, dayTypeId: e.target.value })}
              options={dayTypes.map((dt) => ({ value: dt.id, label: dt.name }))}
              helperText="Loads default quantities for all outlets configured for this day type"
              fullWidth
              required
            />

            <Select
              label="Delivery Turn (5:00 AM preload)"
              value={formData.deliveryTurnId}
              onChange={(e) => setFormData({ ...formData, deliveryTurnId: e.target.value })}
              options={(planningWindow?.availableDeliveryTurns ?? []).map((t) => ({
                value: t.id,
                label: `${t.name} — ${t.deliveryTimeDisplay}`,
              }))}
              helperText={
                (planningWindow?.availableDeliveryTurns.length ?? 0) === 0
                  ? 'No active 5:00 AM delivery turn. Add one under Delivery Turns.'
                  : 'Preload plans use the 5:00 AM slot only.'
              }
              fullWidth
              required
            />

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="useFreezerStock"
                checked={formData.useFreezerStock}
                onChange={(e) => setFormData({ ...formData, useFreezerStock: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="useFreezerStock" className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                Use Freezer Stock
              </label>
            </div>

            <Input
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              fullWidth
            />

            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--dms-notes)', border: '1px solid var(--dms-notes-border)' }}>
              <p className="text-sm font-medium mb-2" style={{ color: 'var(--dms-notes-title)' }}>
                Default quantities (B1)
              </p>
              <p className="text-sm" style={{ color: 'var(--dms-notes-fg)' }}>
                When you select a day type, default outlet × product quantities are loaded here. Uncheck an outlet (e.g. closed) or a product (e.g. not produced) before creating the plan. The plan is saved in{' '}
                <strong>Draft</strong> — you can fine-tune lines on the next screen.
              </p>
            </div>

            {formData.dayTypeId && (
              <div className="space-y-4 pt-2">
                {defaultsLoading ? (
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading default quantities…
                  </div>
                ) : defaultRows.length === 0 ? (
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    No default quantities are configured for this day type. You can still create an empty Draft plan and add lines later.
                  </p>
                ) : (
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    Loaded <strong>{defaultRows.length}</strong> outlet × product lines ({outlets.length} outlets, {products.length}{' '}
                    products).
                  </p>
                )}

                {!defaultsLoading && defaultRows.length > 0 && (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Outlets</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm mb-3" style={{ color: 'var(--muted-foreground)' }}>
                          Uncheck an outlet if it is closed for this delivery turn (excludes all its items).
                        </p>
                        <div className="flex flex-wrap gap-3">
                          {outlets.map((outlet) => {
                            const excluded = isOutletExcluded(outlet.id);
                            return (
                              <label
                                key={outlet.id}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer select-none text-sm font-medium"
                                style={{
                                  border: `1px solid ${excluded ? 'var(--destructive)' : 'var(--border)'}`,
                                  backgroundColor: excluded ? 'var(--destructive-soft, #fef2f2)' : 'var(--card)',
                                  color: 'var(--foreground)',
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={!excluded}
                                  onChange={(e) => setOutletIncludedOne(outlet.id, e.target.checked)}
                                  className="w-4 h-4"
                                />
                                {outlet.name}
                              </label>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Products</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm mb-3" style={{ color: 'var(--muted-foreground)' }}>
                          Uncheck a product if it is not being produced for this delivery (excludes it at all outlets).
                        </p>
                        <div className="flex flex-wrap gap-3">
                          {products.map((product) => {
                            const excluded = isProductExcluded(product.id);
                            return (
                              <label
                                key={product.id}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer select-none text-sm font-medium"
                                style={{
                                  border: `1px solid ${excluded ? 'var(--destructive)' : 'var(--border)'}`,
                                  backgroundColor: excluded ? 'var(--destructive-soft, #fef2f2)' : 'var(--card)',
                                  color: 'var(--foreground)',
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={!excluded}
                                  onChange={(e) => setProductIncludedOne(product.id, e.target.checked)}
                                  className="w-4 h-4"
                                />
                                {product.name}
                              </label>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={
                  isSubmitting ||
                  defaultsLoading ||
                  (planningWindow?.availableDeliveryTurns.length ?? 0) === 0
                }
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Draft Plan
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
