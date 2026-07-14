'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import { ArrowLeft, Loader2, Printer, Send } from 'lucide-react';
import { deliveriesApi } from '@/lib/api/deliveries';
import { outletsApi, type Outlet } from '@/lib/api/outlets';
import { productsApi, type Product } from '@/lib/api/products';
import DeliveryLineItemsEntry from '@/components/operation/DeliveryLineItemsEntry';
import type { ItemManagementItem } from '@/components/operation/ItemManagementTable';
import { useAuthStore } from '@/lib/stores/auth-store';
import { DEFAULT_BRAND_COLOR, useThemeStore } from '@/lib/stores/theme-store';
import { getDateBounds, nowDateTimeLocalValue } from '@/lib/date-restrictions';
import { usePermissions } from '@/hooks/usePermissions';
import toast from 'react-hot-toast';
import ProtectedPage from '@/components/auth/ProtectedPage';

export default function AddDeliveryPage() {
  return (
    <ProtectedPage permission="operation:delivery:view">
      <AddDeliveryPageContent />
    </ProtectedPage>
  );
}

function AddDeliveryPageContent() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { canAction } = usePermissions();
  const canCreate = canAction('/operation/delivery', 'create');
  const pageTheme = useThemeStore((s) => s.getPageTheme('delivery'));
  const accent =
    pageTheme?.secondaryColor ??
    pageTheme?.primaryColor ??
    DEFAULT_BRAND_COLOR;
  const dateBounds = getDateBounds('delivery', user as any, {
    allowBackDatePermission: 'operation:delivery:allow-back-date',
    allowFutureDatePermission: 'operation:delivery:allow-future-date',
  });

  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryItems, setDeliveryItems] = useState<ItemManagementItem[]>([]);

  const [formData, setFormData] = useState({
    deliveryDateTime: nowDateTimeLocalValue(),
    showroomId: '',
    notes: '',
  });

  useEffect(() => {
    if (dateBounds.lockToNow) {
      setFormData((f) => ({ ...f, deliveryDateTime: nowDateTimeLocalValue() }));
    }
  }, [dateBounds.lockToNow, user?.id]);

  useEffect(() => {
    (async () => {
      try {
        const [oRes, pRes] = await Promise.all([
          outletsApi.getAll(),
          productsApi.getAll(1, 5000, undefined, undefined, true),
        ]);
        setOutlets(oRes.outlets.filter((x) => x.isActive));
        setProducts(pRes.products.filter((p) => p.isActive));
      } catch (e: any) {
        toast.error(e.response?.data?.message || 'Failed to load form data');
      }
    })();
  }, []);

  const selectedDatePart = formData.deliveryDateTime.slice(0, 10);

  const dateInAllowedRange =
    dateBounds.lockToNow ||
    ((!dateBounds.min || selectedDatePart >= dateBounds.min) &&
      (!dateBounds.max || selectedDatePart <= dateBounds.max));

  const isFormValid =
    !!formData.showroomId && deliveryItems.length > 0 && dateInAllowedRange;

  const submit = async (alsoPrint: boolean) => {
    if (!canCreate) {
      toast.error('You do not have permission to create deliveries');
      return;
    }
    if (!formData.showroomId) {
      toast.error('Please select a showroom');
      return;
    }
    if (deliveryItems.length === 0) {
      toast.error('Please add at least one item');
      return;
    }
    if (
      !dateBounds.lockToNow &&
      ((dateBounds.min && selectedDatePart < dateBounds.min) ||
        (dateBounds.max && selectedDatePart > dateBounds.max))
    ) {
      toast.error('Delivery date is outside the allowed range');
      return;
    }

    const parsed = dateBounds.lockToNow ? new Date() : new Date(formData.deliveryDateTime);
    if (Number.isNaN(parsed.getTime())) {
      toast.error('Invalid date and time');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        deliveryDate: parsed.toISOString(),
        outletId: formData.showroomId,
        notes: formData.notes || undefined,
        items: deliveryItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice ?? 0,
        })),
      };
      await deliveriesApi.create(payload);
      toast.success('Delivery created successfully');
      if (alsoPrint) {
        setTimeout(() => window.print(), 300);
      }
      router.push('/operation/delivery');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create delivery');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            Delivery Entry
          </h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            New delivery entry
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>New Delivery</CardTitle>
              <p className="mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Delivery No: New Number
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/operation/delivery')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <div
            className="rounded-xl border-2 p-4 md:p-6 space-y-6"
            style={{
              borderColor: 'var(--form-field-border)',
              backgroundColor: 'var(--muted)',
            }}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Date & Time"
                type="datetime-local"
                value={formData.deliveryDateTime}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, deliveryDateTime: e.target.value }))
                }
                min={dateBounds.lockToNow ? undefined : dateBounds.min ? `${dateBounds.min}T00:00` : undefined}
                max={dateBounds.lockToNow ? undefined : dateBounds.max ? `${dateBounds.max}T23:59` : undefined}
                readOnly={dateBounds.lockToNow}
                helperText={dateBounds.helperText}
                fullWidth
                required
              />
              <Select
                label="Showroom"
                value={formData.showroomId}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, showroomId: e.target.value }))
                }
                options={outlets.map((o) => ({
                  value: o.id,
                  label: `${o.code} - ${o.name}`,
                }))}
                placeholder="Select Showroom"
                fullWidth
                required
              />
            </div>
            <Input
              label="Comment"
              value={formData.notes}
              onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Optional notes"
              fullWidth
            />
          </div>

          <div className="border-t pt-6">
            <DeliveryLineItemsEntry
              products={products}
              items={deliveryItems}
              onItemsChange={setDeliveryItems}
              primaryColor={accent}
            />
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t pt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push('/operation/delivery')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={isSubmitting || !canCreate || !isFormValid}
              onClick={() => submit(false)}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Submit
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={isSubmitting || !canCreate || !isFormValid}
              onClick={() => submit(true)}
            >
              <Printer className="mr-2 h-4 w-4" />
              Submit &amp; Print
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
