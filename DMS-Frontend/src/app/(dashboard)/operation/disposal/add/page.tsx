'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { disposalsApi } from '@/lib/api/disposals';
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

export default function AddDisposalPage() {
  return (
    <ProtectedPage permission="operation:disposal:view">
      <AddDisposalPageContent />
    </ProtectedPage>
  );
}

function AddDisposalPageContent() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { canAction } = usePermissions();
  const canCreate = canAction('/operation/disposal', 'create');
  const dateBounds = getDateBounds('today-only', user as any);
  const pageTheme = useThemeStore((s) => s.getPageTheme('disposal'));
  const accent =
    pageTheme?.secondaryColor ?? pageTheme?.primaryColor ?? DEFAULT_BRAND_COLOR;

  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    disposalDate: todayISO(),
    showroomId: '',
    notes: '',
  });

  const [disposalItems, setDisposalItems] = useState<ItemManagementItem[]>([]);

  const isFormValid =
    !!formData.disposalDate && !!formData.showroomId && disposalItems.length > 0;

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

  const handleSubmit = async () => {
    if (!canCreate) {
      toast.error('You do not have permission to create disposals');
      return;
    }
    if (!formData.showroomId) {
      toast.error('Please select a showroom');
      return;
    }
    if (disposalItems.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    const defaultReason = formData.notes.trim() || '-';

    try {
      setIsSubmitting(true);
      await disposalsApi.create({
        disposalDate: formData.disposalDate,
        outletId: formData.showroomId,
        notes: formData.notes.trim() || undefined,
        items: disposalItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          reason: item.reason?.trim() || defaultReason,
        })),
      });
      toast.success('Disposal created successfully');
      router.push('/operation/disposal');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create disposal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            Disposal Entry
          </h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            New disposal entry
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>New Disposal</CardTitle>
              <p className="mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Disposal No: New Number
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/operation/disposal')}>
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
                label="Effective Date"
                type="date"
                value={formData.disposalDate}
                onChange={(e) => setFormData({ ...formData, disposalDate: e.target.value })}
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
              items={disposalItems}
              onItemsChange={setDisposalItems}
              primaryColor={accent}
            />
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t pt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push('/operation/disposal')}
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
