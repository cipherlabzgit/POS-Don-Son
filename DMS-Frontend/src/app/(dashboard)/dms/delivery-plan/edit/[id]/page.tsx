'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { deliveryPlansApi, type DeliveryPlan, type BulkUpsertDeliveryPlanItemDto, type DeliveryPlanItem } from '@/lib/api/delivery-plans';
import { toast } from 'sonner';
import { ProtectedPage } from '@/components/auth';
import { formatSlDate } from '@/lib/sri-lanka-time';

export default function EditDeliveryPlanPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [plan, setPlan] = useState<DeliveryPlan | null>(null);
  // key: itemId → mutable item state
  const [itemState, setItemState] = useState<Record<string, { fullQty: number; miniQty: number; isExcluded: boolean }>>({});

  useEffect(() => { fetchPlan(); }, [id]);

  const fetchPlan = async () => {
    try {
      setIsLoading(true);
      const fullPlan = await deliveryPlansApi.getById(id);
      setPlan(fullPlan);

      const state: Record<string, { fullQty: number; miniQty: number; isExcluded: boolean }> = {};
      fullPlan.items.forEach(item => {
        state[item.id] = {
          fullQty: item.fullQuantity,
          miniQty: item.miniQuantity,
          isExcluded: item.isExcluded,
        };
      });
      setItemState(state);
    } catch (error) {
      console.error('Error loading plan:', error);
      toast.error('Failed to load delivery plan');
    } finally {
      setIsLoading(false);
    }
  };

  // Unique outlet list derived from items
  const outlets = useMemo(() => {
    if (!plan) return [];
    const seen = new Set<string>();
    return plan.items.filter(i => { if (seen.has(i.outletId)) return false; seen.add(i.outletId); return true; })
      .map(i => ({ id: i.outletId, name: i.outletName }));
  }, [plan]);

  // Unique product list derived from items
  const products = useMemo(() => {
    if (!plan) return [];
    const seen = new Set<string>();
    return plan.items.filter(i => { if (seen.has(i.productId)) return false; seen.add(i.productId); return true; })
      .map(i => ({ id: i.productId, name: i.productName }));
  }, [plan]);

  // Toggle all items for a given outlet
  const toggleOutlet = (outletId: string, excluded: boolean) => {
    setItemState(prev => {
      const next = { ...prev };
      plan?.items.filter(i => i.outletId === outletId).forEach(i => {
        next[i.id] = { ...next[i.id], isExcluded: excluded };
      });
      return next;
    });
  };

  // Toggle all items for a given product
  const toggleProduct = (productId: string, excluded: boolean) => {
    setItemState(prev => {
      const next = { ...prev };
      plan?.items.filter(i => i.productId === productId).forEach(i => {
        next[i.id] = { ...next[i.id], isExcluded: excluded };
      });
      return next;
    });
  };

  // Is every item for this outlet excluded?
  const isOutletExcluded = (outletId: string) =>
    plan?.items.filter(i => i.outletId === outletId).every(i => itemState[i.id]?.isExcluded) ?? false;

  // Is every item for this product excluded?
  const isProductExcluded = (productId: string) =>
    plan?.items.filter(i => i.productId === productId).every(i => itemState[i.id]?.isExcluded) ?? false;

  const handleSaveItems = async () => {
    if (!plan) return;
    try {
      setIsSubmitting(true);

      const items: BulkUpsertDeliveryPlanItemDto[] = plan.items.map(item => ({
        id: item.id,
        outletId: item.outletId,
        productId: item.productId,
        deliveryTurnId: item.deliveryTurnId,
        fullQuantity: itemState[item.id]?.fullQty ?? item.fullQuantity,
        miniQuantity: itemState[item.id]?.miniQty ?? item.miniQuantity,
        isExcluded: itemState[item.id]?.isExcluded ?? false,
      }));

      await deliveryPlansApi.bulkUpsertItems(plan.id, items);
      toast.success('Plan saved successfully!');
      router.push('/dms/delivery-plan');
    } catch (error) {
      console.error('Error saving items:', error);
      toast.error('Failed to save plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDraft = plan?.status === 'Draft';

  return (
    <ProtectedPage permission={['delivery_plan:view', 'admin-delivery-plan:view']} mode="any">
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p style={{ color: 'var(--muted-foreground)' }}>Loading plan...</p>
          </div>
        </div>
      ) : !plan ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p style={{ color: 'var(--muted-foreground)' }}>Plan not found</p>
            <Button variant="primary" onClick={() => router.push('/dms/delivery-plan')} className="mt-4">
              Back to Plans
            </Button>
          </div>
        </div>
      ) : (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            {plan.planNo}
          </h1>
          {!isDraft && (
            <p className="mt-2 text-sm rounded-md px-3 py-2" style={{ backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}>
              Read-only view — verify quantities and exclusions match what will be delivered. Draft plans can be edited here.
            </p>
          )}
          <p className="mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {formatSlDate(plan.planDate)} · {plan.dayTypeName} · {plan.deliveryTurnName ?? ''}
            <span
              className="ml-3 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: plan.status === 'Draft' ? 'var(--dms-amber)' : 'var(--dms-green-bg)',
                color: plan.status === 'Draft' ? '#92400e' : '#065f46',
              }}
            >
              {plan.status}
            </span>
          </p>
        </div>
      </div>

      {/* Outlet-level exclusion */}
      <Card>
        <CardHeader>
          <CardTitle>Outlets</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-3" style={{ color: 'var(--muted-foreground)' }}>
            Uncheck an outlet to exclude all its items from this delivery.
          </p>
          <div className="flex flex-wrap gap-3">
            {outlets.map(outlet => {
              const excluded = isOutletExcluded(outlet.id);
              return (
                <label
                  key={outlet.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer select-none text-sm font-medium"
                  style={{
                    border: `1px solid ${excluded ? 'var(--destructive)' : 'var(--border)'}`,
                    backgroundColor: excluded ? 'var(--destructive-soft, #fef2f2)' : 'var(--card)',
                    color: 'var(--foreground)',
                    opacity: isDraft ? 1 : 0.6,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!excluded}
                    disabled={!isDraft}
                    onChange={(e) => toggleOutlet(outlet.id, !e.target.checked)}
                    className="w-4 h-4"
                  />
                  {outlet.name}
                </label>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Product-level exclusion */}
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-3" style={{ color: 'var(--muted-foreground)' }}>
            Uncheck a product to exclude it from all outlets in this delivery.
          </p>
          <div className="flex flex-wrap gap-3">
            {products.map(product => {
              const excluded = isProductExcluded(product.id);
              return (
                <label
                  key={product.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer select-none text-sm font-medium"
                  style={{
                    border: `1px solid ${excluded ? 'var(--destructive)' : 'var(--border)'}`,
                    backgroundColor: excluded ? 'var(--destructive-soft, #fef2f2)' : 'var(--card)',
                    color: 'var(--foreground)',
                    opacity: isDraft ? 1 : 0.6,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!excluded}
                    disabled={!isDraft}
                    onChange={(e) => toggleProduct(product.id, !e.target.checked)}
                    className="w-4 h-4"
                  />
                  {product.name}
                </label>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Line items table */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="min-w-full divide-y" style={{ borderColor: 'var(--border)' }}>
              <thead style={{ backgroundColor: 'var(--muted)' }} className="sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Product</th>
                  <th className="px-3 py-2 text-left text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Outlet</th>
                  <th className="px-3 py-2 text-center text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Full Qty</th>
                  <th className="px-3 py-2 text-center text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Mini Qty</th>
                  <th className="px-3 py-2 text-center text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Exclude</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                {plan.items.map(item => {
                  const state = itemState[item.id];
                  const excluded = state?.isExcluded ?? false;
                  return (
                    <tr
                      key={item.id}
                      style={{ opacity: excluded ? 0.45 : 1 }}
                    >
                      <td className="px-3 py-2 text-sm" style={{ color: 'var(--foreground)' }}>{item.productName}</td>
                      <td className="px-3 py-2 text-sm" style={{ color: 'var(--foreground)' }}>{item.outletName}</td>
                      <td className="px-1 py-1 text-center">
                        <input
                          type="number"
                          min="0"
                          value={state?.fullQty ?? 0}
                          onChange={(e) => setItemState(prev => ({
                            ...prev,
                            [item.id]: { ...prev[item.id], fullQty: parseInt(e.target.value) || 0 },
                          }))}
                          disabled={excluded || !isDraft}
                          onFocus={(e) => e.target.select()}
                          className="w-20 px-2 py-1 text-sm text-center rounded"
                          style={{ border: '1px solid var(--input)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                        />
                      </td>
                      <td className="px-1 py-1 text-center">
                        <input
                          type="number"
                          min="0"
                          value={state?.miniQty ?? 0}
                          onChange={(e) => setItemState(prev => ({
                            ...prev,
                            [item.id]: { ...prev[item.id], miniQty: parseInt(e.target.value) || 0 },
                          }))}
                          disabled={excluded || !isDraft}
                          onFocus={(e) => e.target.select()}
                          className="w-20 px-2 py-1 text-sm text-center rounded"
                          style={{ border: '1px solid var(--input)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={excluded}
                          disabled={!isDraft}
                          onChange={(e) => setItemState(prev => ({
                            ...prev,
                            [item.id]: { ...prev[item.id], isExcluded: e.target.checked },
                          }))}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!isDraft && (
            <p className="mt-3 text-sm" style={{ color: 'var(--muted-foreground)' }}>
              This plan is no longer in Draft status and cannot be edited.
            </p>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t mt-4" style={{ borderColor: 'var(--border)' }}>
            <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isSubmitting}>
              Cancel
            </Button>
            {isDraft && (
              <Button type="button" variant="primary" onClick={handleSaveItems} disabled={isSubmitting}>
                {isSubmitting
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                  : <><Save className="w-4 h-4 mr-2" />Save Plan</>}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
      )}
    </ProtectedPage>
  );
}
