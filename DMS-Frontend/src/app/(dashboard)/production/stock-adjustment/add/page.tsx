'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import { ArrowLeft, Plus, Loader2 } from 'lucide-react';
import { stockAdjustmentsApi } from '@/lib/api/stock-adjustments';
import { productsApi, type Product } from '@/lib/api/products';
import ItemManagementTable, { type ItemManagementItem } from '@/components/operation/ItemManagementTable';
import { useThemeStore } from '@/lib/stores/theme-store';
import { todayISO } from '@/lib/date-restrictions';
import toast from 'react-hot-toast';

export default function AddStockAdjustmentPage() {
  const router = useRouter();
  const pageTheme = useThemeStore((s) => s.getPageTheme('daily-production'));

  const [products, setProducts] = useState<Product[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    adjustmentDate: todayISO(),
    adjustmentType: 'Increase' as 'Increase' | 'Decrease',
    reason: '',
    notes: '',
  });

  const [adjustmentItems, setAdjustmentItems] = useState<ItemManagementItem[]>([]);

  useEffect(() => {
    void fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productsApi.getAll(1, 1000, undefined, undefined, true);
      const productsList = Array.isArray(response.products) ? response.products : [];
      setProducts(productsList.filter((p: Product) => p.isActive));
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('Failed to load products');
      setProducts([]);
    }
  };

  const isFormValid = () =>
    Boolean(formData.adjustmentDate?.trim()) &&
    Boolean(formData.reason?.trim()) &&
    adjustmentItems.length > 0 &&
    adjustmentItems.every((i) => i.productId && i.quantity > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.reason?.trim()) {
      toast.error('Please enter a reason for this adjustment');
      return;
    }

    const lines = adjustmentItems.filter((i) => i.productId && i.quantity > 0);
    if (lines.length === 0) {
      toast.error('Please add at least one product with a quantity');
      return;
    }

    let savedCount = 0;
    try {
      setIsSubmitting(true);
      for (const item of lines) {
        await stockAdjustmentsApi.create({
          adjustmentDate: formData.adjustmentDate,
          productId: item.productId,
          adjustmentType: formData.adjustmentType,
          quantity: item.quantity,
          reason: formData.reason.trim(),
          notes: formData.notes?.trim() || undefined,
        });
        savedCount++;
      }
      toast.success(
        savedCount === 1
          ? 'Stock adjustment created and submitted for approval'
          : `${savedCount} stock adjustments created and submitted for approval`,
      );
      router.push('/production/stock-adjustment');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('Failed to create stock adjustment(s):', error);
      const baseMsg = err.response?.data?.message || 'Failed to create stock adjustment';
      toast.error(
        savedCount > 0
          ? `${baseMsg} (${savedCount} line(s) were saved — check the list before retrying.)`
          : baseMsg,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            Add Stock Adjustment
          </h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Add one or more products — same date, adjustment type, reason, and notes apply to every line
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock Adjustment Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Adjustment Date"
              type="date"
              value={formData.adjustmentDate}
              onChange={(e) => setFormData({ ...formData, adjustmentDate: e.target.value })}
              fullWidth
              required
            />
            <Select
              label="Adjustment Type"
              value={formData.adjustmentType}
              onChange={(e) =>
                setFormData({ ...formData, adjustmentType: e.target.value as 'Increase' | 'Decrease' })
              }
              options={[
                { value: 'Increase', label: 'Increase Stock' },
                { value: 'Decrease', label: 'Decrease Stock' },
              ]}
              fullWidth
              required
            />
            <Input
              label="Reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Reason for adjustment (applies to all lines)"
              fullWidth
              required
            />
            <Input
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional notes (applies to all lines)"
              fullWidth
            />

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-3">Products</h3>
              <ItemManagementTable
                products={products.map((p) => ({ id: p.id, code: p.code, name: p.name }))}
                items={adjustmentItems}
                onItemsChange={setAdjustmentItems}
                showUnitPrice={false}
                showReason={false}
                showTotal={true}
                primaryColor={pageTheme?.primaryColor}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting || !isFormValid()}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create adjustment{adjustmentItems.length > 1 ? 's' : ''} (
                    {adjustmentItems.filter((i) => i.productId && i.quantity > 0).length || 0} product
                    {(adjustmentItems.filter((i) => i.productId && i.quantity > 0).length || 0) === 1 ? '' : 's'})
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
