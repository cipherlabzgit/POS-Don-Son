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
import { productsApi, type Product } from '@/lib/api/products';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getDateBounds, yesterdayISO } from '@/lib/date-restrictions';
import { usePermissions } from '@/hooks/usePermissions';
import { DEFAULT_BRAND_COLOR, useThemeStore } from '@/lib/stores/theme-store';
import toast from 'react-hot-toast';
import ProtectedPage from '@/components/auth/ProtectedPage';

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
  const [lineItems, setLineItems] = useState<ItemManagementItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    cancellationDate: yesterdayISO(),
    showroomId: '',
    reason: '',
  });

  const isFormValid =
    !!formData.cancellationDate &&
    !!formData.showroomId &&
    !!formData.reason?.trim();

  useEffect(() => {
    void (async () => {
      try {
        const oRes = await outletsApi.getAll();
        setOutlets(oRes.outlets.filter((o) => o.isActive));
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to load form data');
      }
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const pRes = await productsApi.getAll(1, 5000, undefined, undefined, true, formData.cancellationDate);
        if (!cancelled) setProducts(pRes.products.filter((p) => p.isActive));
      } catch (error: any) {
        if (!cancelled) toast.error(error.response?.data?.message || 'Failed to load products');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [formData.cancellationDate]);

  const handleSubmit = async () => {
    if (!canCreate) {
      toast.error('You do not have permission to create cancellations');
      return;
    }

    try {
      setIsSubmitting(true);
      await cancellationsApi.create({
        cancellationDate: formData.cancellationDate,
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
