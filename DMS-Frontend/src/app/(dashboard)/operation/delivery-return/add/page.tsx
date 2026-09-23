'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { deliveryReturnsApi } from '@/lib/api/delivery-returns';
import { outletsApi, type Outlet } from '@/lib/api/outlets';
import { productsApi, type Product } from '@/lib/api/products';
import DeliveryLineItemsEntry from '@/components/operation/DeliveryLineItemsEntry';
import type { ItemManagementItem } from '@/components/operation/ItemManagementTable';
import { useAuthStore } from '@/lib/stores/auth-store';
import { DEFAULT_BRAND_COLOR, useThemeStore } from '@/lib/stores/theme-store';
import { getDateBounds, yesterdayISO } from '@/lib/date-restrictions';
import { usePermissions } from '@/hooks/usePermissions';
import toast from 'react-hot-toast';
import ProtectedPage from '@/components/auth/ProtectedPage';

export default function AddDeliveryReturnPage() {
  return (
    <ProtectedPage permission="operation:delivery-return:view">
      <AddDeliveryReturnPageContent />
    </ProtectedPage>
  );
}

function AddDeliveryReturnPageContent() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { canAction } = usePermissions();
  const canCreate = canAction('/operation/delivery-return', 'create');
  const pageTheme = useThemeStore((s) => s.getPageTheme('delivery-return'));
  const accent =
    pageTheme?.secondaryColor ?? pageTheme?.primaryColor ?? DEFAULT_BRAND_COLOR;
  const dateBounds = getDateBounds('back-3-no-future', user as any, {
    allowBackDatePermission: 'operation:delivery-return:allow-back-date',
    allowFutureDatePermission: 'operation:delivery-return:allow-future-date',
  });

  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [returnItems, setReturnItems] = useState<ItemManagementItem[]>([]);

  const [formData, setFormData] = useState({
    returnDate: yesterdayISO(),
    showroomId: '',
    reason: '',
  });

  useEffect(() => {
    void (async () => {
      try {
        const oRes = await outletsApi.getAll();
        setOutlets(oRes.outlets.filter((o) => o.isActive));
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        toast.error(err.response?.data?.message || 'Failed to load form data');
      }
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const pRes = await productsApi.getAll(1, 5000, undefined, undefined, true, formData.returnDate);
        if (!cancelled) setProducts(pRes.products.filter((p) => p.isActive));
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        if (!cancelled) toast.error(err.response?.data?.message || 'Failed to load products');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [formData.returnDate]);

  const isFormValid =
    !!formData.returnDate &&
    !!formData.showroomId &&
    !!formData.reason?.trim() &&
    returnItems.length > 0;

  const handleSubmit = async () => {
    if (!canCreate) {
      toast.error('You do not have permission to create delivery returns');
      return;
    }
    if (returnItems.length === 0) {
      toast.error('Please add at least one return line item');
      return;
    }

    try {
      setIsSubmitting(true);
      await deliveryReturnsApi.create({
        returnDate: formData.returnDate,
        outletId: formData.showroomId,
        reason: formData.reason.trim(),
        items: returnItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });
      toast.success('Delivery return created successfully');
      router.push('/operation/delivery-return');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to create delivery return');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 p-4 sm:p-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
          Delivery Return Entry
        </h1>
        <p className="mt-0.5 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          New delivery return entry.
        </p>
      </div>

      <Card padding="sm">
        <CardHeader className="mb-3 !pb-3 pt-0">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-lg">New Delivery Return</CardTitle>
              <p className="mt-0.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Return No# New Number
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/operation/delivery-return')}>
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
                label="Return Date"
                type="date"
                value={formData.returnDate}
                onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                min={dateBounds.min}
                max={dateBounds.max}
                helperText={dateBounds.helperText}
                fullWidth
                required
                className="py-2 px-3"
              />
              <Select
                label="Showroom From"
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
                rows={3}
                placeholder="Notes for this return (required)"
                required
                className="block w-full resize-y rounded-lg px-3 py-2 text-sm transition-[border-color,outline,box-shadow] focus:outline-none"
                style={{
                  border: '1px solid var(--form-field-border)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)',
                  boxShadow: 'inset 0 1px 2px rgba(15, 23, 42, 0.04)',
                  minHeight: '4.25rem',
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
          </div>

          <div className="border-t border-[var(--border)] pt-4">
            <DeliveryLineItemsEntry
              products={products}
              items={returnItems}
              onItemsChange={setReturnItems}
              primaryColor={accent}
              hideSearchLabel
              searchHelperText="Use ↑/↓ and Enter to select an item."
            />
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--border)] pt-4">
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
