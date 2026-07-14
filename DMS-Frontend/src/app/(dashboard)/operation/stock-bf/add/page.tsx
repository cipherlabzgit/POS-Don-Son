'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { stockBfApi } from '@/lib/api/stock-bf';
import { outletsApi, type Outlet } from '@/lib/api/outlets';
import { productsApi, type Product } from '@/lib/api/products';
import DeliveryLineItemsEntry from '@/components/operation/DeliveryLineItemsEntry';
import type { ItemManagementItem } from '@/components/operation/ItemManagementTable';
import { useAuthStore } from '@/lib/stores/auth-store';
import { DEFAULT_BRAND_COLOR, useThemeStore } from '@/lib/stores/theme-store';
import { getDateBounds, todayISO } from '@/lib/date-restrictions';
import { usePermissions } from '@/hooks/usePermissions';
import toast from 'react-hot-toast';
import ProtectedPage from '@/components/auth/ProtectedPage';

export default function AddStockBFPage() {
  return (
    <ProtectedPage permission="operation:stock-bf:view">
      <AddStockBFPageContent />
    </ProtectedPage>
  );
}

function AddStockBFPageContent() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);
  const { canAction } = usePermissions();
  const canCreate = canAction('/operation/stock-bf', 'create');
  const pageTheme = useThemeStore((s) => s.getPageTheme('stock-bf'));
  const accent = pageTheme?.primaryColor ?? DEFAULT_BRAND_COLOR;
  const dateBounds = getDateBounds('back-3-no-future', user as any, {
    allowBackDatePermission: 'operation:stock-bf:allow-back-date',
    allowFutureDatePermission: 'operation:stock-bf:allow-future-date',
  });

  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    bfDate: todayISO(),
    showroomId: '',
  });

  const [stockBfItems, setStockBfItems] = useState<ItemManagementItem[]>([]);

  const isFormValid = !!formData.bfDate && !!formData.showroomId && stockBfItems.length > 0;

  useEffect(() => {
    if (!_hasHydrated) return;
    void fetchOutlets();
    void fetchProducts();
  }, [_hasHydrated]);

  const fetchOutlets = async () => {
    try {
      const response = await outletsApi.getAll(1, 1000);
      const list = Array.isArray(response.outlets) ? response.outlets : [];
      setOutlets(list.filter((o) => o.isActive !== false));
    } catch (error: any) {
      const msg =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        'Failed to load showrooms';
      toast.error(msg);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productsApi.getAll(1, 5000, undefined, undefined, true);
      const list = Array.isArray(response.products) ? response.products : [];
      setProducts(
        list.filter((p) => p.isActive !== false && p.requireOpenStock),
      );
    } catch (error: any) {
      const msg =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        'Failed to load products';
      toast.error(msg);
    }
  };

  const handleSubmit = async () => {
    if (!canCreate) {
      toast.error('You do not have permission to create stock B/F');
      return;
    }
    if (!formData.showroomId) {
      toast.error('Please select a showroom');
      return;
    }
    if (stockBfItems.length === 0) {
      toast.error('Please add at least one product');
      return;
    }

    try {
      setIsSubmitting(true);
      await stockBfApi.createBulk({
        bfDate: formData.bfDate,
        outletId: formData.showroomId,
        items: stockBfItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });
      toast.success(`${stockBfItems.length} Stock BF record(s) created — pending approval`);
      router.push('/operation/stock-bf');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create stock BF');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            Stock BF Entry
          </h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            New stock BF entry
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>New Stock BF</CardTitle>
              <p className="mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                BF No: New Number — product list is limited to items that require open stock.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/operation/stock-bf')}>
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
                label="BF date"
                type="date"
                value={formData.bfDate}
                onChange={(e) => setFormData({ ...formData, bfDate: e.target.value })}
                min={dateBounds.min}
                max={dateBounds.max}
                helperText={dateBounds.helperText}
                fullWidth
                required
              />
              <Select
                label="Showroom"
                value={formData.showroomId}
                onChange={(e) => setFormData({ ...formData, showroomId: e.target.value })}
                options={outlets.map((o) => ({ value: o.id, label: `${o.code} - ${o.name}` }))}
                placeholder="Select Showroom"
                fullWidth
                required
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <DeliveryLineItemsEntry
              products={products}
              items={stockBfItems}
              onItemsChange={setStockBfItems}
              primaryColor={accent}
              showPricing={false}
            />
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t pt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push('/operation/stock-bf')}
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
