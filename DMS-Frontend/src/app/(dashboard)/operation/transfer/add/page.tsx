'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { transfersApi } from '@/lib/api/transfers';
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

export default function AddTransferPage() {
  return (
    <ProtectedPage permission="operation:transfer:view">
      <AddTransferPageContent />
    </ProtectedPage>
  );
}

function AddTransferPageContent() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { canAction } = usePermissions();
  const canCreate = canAction('/operation/transfer', 'create');
  const pageTheme = useThemeStore((s) => s.getPageTheme('transfer'));
  const accent =
    pageTheme?.secondaryColor ?? pageTheme?.primaryColor ?? DEFAULT_BRAND_COLOR;
  const dateBounds = getDateBounds('back-3-no-future', user as any, {
    allowBackDatePermission: 'operation:transfer:allow-back-date',
    allowFutureDatePermission: 'operation:transfer:allow-future-date',
  });

  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transferItems, setTransferItems] = useState<ItemManagementItem[]>([]);

  const [formData, setFormData] = useState({
    transferDate: todayISO(),
    fromShowroomId: '',
    toShowroomId: '',
    notes: '',
  });

  useEffect(() => {
    void fetchOutlets();
    void fetchProducts();
  }, []);

  const fetchOutlets = async () => {
    try {
      const response = await outletsApi.getAll();
      setOutlets(response.outlets.filter((o) => o.isActive));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load outlets');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productsApi.getAll(1, 5000, undefined, undefined, true);
      setProducts(response.products.filter((p) => p.isActive));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load products');
    }
  };

  const isFormValid =
    !!formData.transferDate &&
    !!formData.fromShowroomId &&
    !!formData.toShowroomId &&
    formData.fromShowroomId !== formData.toShowroomId &&
    transferItems.length > 0;

  const handleSubmit = async () => {
    if (!canCreate) {
      toast.error('You do not have permission to create transfers');
      return;
    }
    if (!formData.fromShowroomId || !formData.toShowroomId) {
      toast.error('Please select both showrooms');
      return;
    }
    if (formData.fromShowroomId === formData.toShowroomId) {
      toast.error('From and To outlets must be different');
      return;
    }
    if (transferItems.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    try {
      setIsSubmitting(true);
      await transfersApi.create({
        transferDate: formData.transferDate,
        fromOutletId: formData.fromShowroomId,
        toOutletId: formData.toShowroomId,
        notes: formData.notes,
        items: transferItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });
      toast.success('Transfer created successfully');
      router.push('/operation/transfer');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create transfer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            Transfer Entry
          </h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            New transfer entry
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>New Transfer</CardTitle>
              <p className="mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Transfer No: New Number
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/operation/transfer')}>
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
            <Input
              label="Transfer date"
              type="date"
              value={formData.transferDate}
              onChange={(e) => setFormData({ ...formData, transferDate: e.target.value })}
              min={dateBounds.min}
              max={dateBounds.max}
              helperText={dateBounds.helperText}
              fullWidth
              required
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Select
                label="From showroom"
                value={formData.fromShowroomId}
                onChange={(e) => setFormData({ ...formData, fromShowroomId: e.target.value })}
                options={outlets
                  .filter((o) => o.id !== formData.toShowroomId)
                  .map((o) => ({ value: o.id, label: `${o.code} - ${o.name}` }))}
                placeholder="Select source showroom"
                fullWidth
                required
              />
              <Select
                label="To showroom"
                value={formData.toShowroomId}
                onChange={(e) => setFormData({ ...formData, toShowroomId: e.target.value })}
                options={outlets
                  .filter((o) => o.id !== formData.fromShowroomId)
                  .map((o) => ({ value: o.id, label: `${o.code} - ${o.name}` }))}
                placeholder="Select destination showroom"
                fullWidth
                required
              />
            </div>
            <Input
              label="Comment"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional notes"
              fullWidth
            />
          </div>

          <div className="border-t pt-6">
            <DeliveryLineItemsEntry
              products={products}
              items={transferItems}
              onItemsChange={setTransferItems}
              primaryColor={accent}
              showPricing={false}
            />
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t pt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push('/operation/transfer')}
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
