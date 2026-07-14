'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import DeliveryLineItemsEntry from '@/components/operation/DeliveryLineItemsEntry';
import type { ItemManagementItem } from '@/components/operation/ItemManagementTable';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { cancellationsApi } from '@/lib/api/cancellations';
import { outletsApi, type Outlet } from '@/lib/api/outlets';
import { deliveriesApi, type Delivery } from '@/lib/api/deliveries';
import { productsApi, type Product } from '@/lib/api/products';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getDateBounds, todayISO } from '@/lib/date-restrictions';
import { usePermissions } from '@/hooks/usePermissions';
import { DEFAULT_BRAND_COLOR, useThemeStore } from '@/lib/stores/theme-store';
import toast from 'react-hot-toast';
import ProtectedPage from '@/components/auth/ProtectedPage';

function mapDeliveryItemsToLineItems(d: Delivery | null): ItemManagementItem[] {
  if (!d?.items?.length) return [];
  return d.items.map((li) => ({
    productId: li.productId,
    quantity: li.quantity,
    unitPrice: li.unitPrice ?? 0,
  }));
}

export default function AddCancellationPage() {
  return (
    <ProtectedPage permission="operation:cancellation:view">
      <AddCancellationPageContent />
    </ProtectedPage>
  );
}

function AddCancellationPageContent() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { canAction } = usePermissions();
  const canCreate = canAction('/operation/cancellation', 'create');
  const pageTheme = useThemeStore((s) => s.getPageTheme('cancellation'));
  const accent =
    pageTheme?.secondaryColor ?? pageTheme?.primaryColor ?? DEFAULT_BRAND_COLOR;

  const dateBounds = getDateBounds('back-3-no-future', user as any, {
    allowBackDatePermission: 'operation:cancellation:allow-back-date',
    allowFutureDatePermission: 'operation:cancellation:allow-future-date',
  });

  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [deliveryPreview, setDeliveryPreview] = useState<Delivery | null>(null);
  const [lineItems, setLineItems] = useState<ItemManagementItem[]>([]);
  const [isLoadingDeliveries, setIsLoadingDeliveries] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    cancellationDate: todayISO(),
    deliveryNo: '',
    deliveredDate: '',
    showroomId: '',
    reason: '',
  });

  const isFormValid =
    !!formData.cancellationDate &&
    !!formData.deliveryNo &&
    !!formData.deliveredDate &&
    !!formData.showroomId &&
    !!formData.reason?.trim();

  useEffect(() => {
    void (async () => {
      try {
        const [oRes, pRes] = await Promise.all([
          outletsApi.getAll(),
          productsApi.getAll(1, 5000, undefined, undefined, true),
        ]);
        setOutlets(oRes.outlets.filter((o) => o.isActive));
        setProducts(pRes.products.filter((p) => p.isActive));
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to load form data');
      }
    })();
  }, []);

  useEffect(() => {
    if (!formData.deliveryNo) {
      setDeliveryPreview(null);
      return;
    }
    const fromList = deliveries.find((d) => d.deliveryNo === formData.deliveryNo);
    if (!fromList) {
      setDeliveryPreview(null);
      return;
    }
    if (fromList.items && fromList.items.length > 0) {
      setDeliveryPreview(fromList);
      return;
    }
    let cancelled = false;
    void deliveriesApi
      .getById(fromList.id)
      .then((d: Delivery) => {
        if (!cancelled) setDeliveryPreview(d ?? fromList);
      })
      .catch(() => {
        if (!cancelled) setDeliveryPreview(fromList);
      });
    return () => {
      cancelled = true;
    };
  }, [formData.deliveryNo, deliveries]);

  useEffect(() => {
    setLineItems(mapDeliveryItemsToLineItems(deliveryPreview));
  }, [deliveryPreview]);

  const fetchDeliveriesByDate = async (date: string) => {
    if (!date) {
      setDeliveries([]);
      return;
    }

    try {
      setIsLoadingDeliveries(true);
      const startOfDay = new Date(`${date}T00:00:00Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);

      let response = await deliveriesApi.getAll(1, 100, {
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString(),
        status: 'Approved',
      });

      if (!response.deliveries || response.deliveries.length === 0) {
        response = await deliveriesApi.getAll(1, 100, {
          startDate: startOfDay.toISOString(),
          endDate: endOfDay.toISOString(),
        });

        if (response.deliveries && response.deliveries.length > 0) {
          toast(`Found ${response.deliveries.length} delivery(ies) (not all approved)`);
        }
      }

      setDeliveries(response.deliveries || []);

      if (response.deliveries?.length === 1) {
        setFormData((prev) => ({
          ...prev,
          deliveryNo: response.deliveries![0].deliveryNo,
          showroomId: response.deliveries![0].outletId,
        }));
        toast.success('Delivery auto-selected');
      } else if (response.deliveries && response.deliveries.length > 1) {
        toast.success(`${response.deliveries.length} deliveries found`);
      } else {
        toast('No deliveries found for this date');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load deliveries');
      setDeliveries([]);
    } finally {
      setIsLoadingDeliveries(false);
    }
  };

  const handleSubmit = async () => {
    if (!canCreate) {
      toast.error('You do not have permission to create cancellations');
      return;
    }

    try {
      setIsSubmitting(true);
      await cancellationsApi.create({
        cancellationDate: formData.cancellationDate,
        deliveryNo: formData.deliveryNo,
        deliveredDate: formData.deliveredDate,
        outletId: formData.showroomId,
        reason: formData.reason.trim(),
      });
      toast.success('Cancellation request created successfully');
      router.push('/operation/cancellation');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create cancellation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 p-4 sm:p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
            Delivery Cancellation Entry
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            New delivery cancellation entry
          </p>
        </div>
      </div>

      <Card padding="sm">
        <CardHeader className="mb-3 !pb-3 pt-0">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-lg">New Delivery Cancellation</CardTitle>
              <p className="mt-0.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Cancellation No: New Number
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/operation/cancellation')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pb-5 pt-0">
          <div
            className="space-y-3 rounded-lg border p-3 sm:p-4"
            style={{
              borderColor: 'var(--form-field-border)',
              backgroundColor: 'var(--muted)',
            }}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Cancellation Date"
                type="date"
                value={formData.cancellationDate}
                onChange={(e) => setFormData({ ...formData, cancellationDate: e.target.value })}
                min={dateBounds.min}
                max={dateBounds.max}
                helperText={dateBounds.helperText}
                fullWidth
                required
                className="py-2 px-3"
              />
              <Select
                label="Showroom"
                value={formData.showroomId}
                onChange={(e) => setFormData({ ...formData, showroomId: e.target.value })}
                options={outlets.map((o) => ({ value: o.id, label: `${o.code} - ${o.name}` }))}
                placeholder="Select Showroom"
                fullWidth
                required
                className="py-2 px-3"
              />
            </div>

            <div className="w-full">
              <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                Comment
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={4}
                placeholder="Reason for cancellation (required)"
                required
                className="block w-full resize-y rounded-lg px-3 py-2 text-sm transition-[border-color,outline,box-shadow] focus:outline-none"
                style={{
                  border: '1px solid var(--form-field-border)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)',
                  boxShadow: 'inset 0 1px 2px rgba(15, 23, 42, 0.04)',
                  minHeight: '5.5rem',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--form-focus-ring)';
                  e.currentTarget.style.outline = '2px solid var(--form-focus-ring)';
                  e.currentTarget.style.outlineOffset = '2px';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--form-field-border)';
                  e.currentTarget.style.outline = 'none';
                }}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Delivered Date"
                type="date"
                value={formData.deliveredDate}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setFormData({ ...formData, deliveredDate: newDate, deliveryNo: '', showroomId: '' });
                  void fetchDeliveriesByDate(newDate);
                }}
                fullWidth
                required
                className="py-2 px-3"
              />
              <Select
                label="Delivery No"
                value={formData.deliveryNo}
                onChange={(e) => {
                  const selectedDelivery = deliveries.find((d) => d.deliveryNo === e.target.value);
                  setFormData({
                    ...formData,
                    deliveryNo: e.target.value,
                    showroomId: selectedDelivery?.outletId || formData.showroomId,
                  });
                }}
                options={deliveries.map((d) => ({
                  value: d.deliveryNo,
                  label: `${d.deliveryNo} - ${d.outlet?.name || d.outletName || ''}`,
                }))}
                placeholder={
                  isLoadingDeliveries
                    ? 'Loading deliveries...'
                    : formData.deliveredDate
                      ? 'Select delivery'
                      : 'Select delivered date first'
                }
                fullWidth
                required
                disabled={!formData.deliveredDate || isLoadingDeliveries}
                className="py-2 px-3"
              />
            </div>
            {formData.deliveredDate && !isLoadingDeliveries && (
              <p className="text-[11px] leading-tight" style={{ color: 'var(--muted-foreground)' }}>
                {deliveries.length > 0
                  ? `${deliveries.length} approved ${deliveries.length === 1 ? 'delivery' : 'deliveries'} found for this date`
                  : 'No approved deliveries found for this date'}
              </p>
            )}
          </div>

          <div className="border-t border-[var(--border)] pt-4">
            <DeliveryLineItemsEntry
              products={products}
              items={lineItems}
              onItemsChange={setLineItems}
              primaryColor={accent}
              hideSearchLabel
              searchHelperText="Use ↑/↓ and Enter to select an item."
            />
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--border)] pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push('/operation/cancellation')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={isSubmitting || !canCreate || !isFormValid}
              onClick={() => void handleSubmit()}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Submit
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
