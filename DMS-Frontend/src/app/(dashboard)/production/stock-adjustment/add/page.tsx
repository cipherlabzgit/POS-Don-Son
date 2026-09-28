'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import { Loader2, Send } from 'lucide-react';
import ClassicEntryForm from '@/components/operation/ClassicEntryForm';
import { stockAdjustmentsApi } from '@/lib/api/stock-adjustments';
import { productsApi, type Product } from '@/lib/api/products';
import DeliveryLineItemsEntry from '@/components/operation/DeliveryLineItemsEntry';
import type { ItemManagementItem } from '@/components/operation/ItemManagementTable';
import { DEFAULT_BRAND_COLOR, useThemeStore } from '@/lib/stores/theme-store';
import { todayISO } from '@/lib/date-restrictions';
import toast from 'react-hot-toast';

export default function AddStockAdjustmentPage() {
  const router = useRouter();
  const pageTheme = useThemeStore((s) => s.getPageTheme('daily-production'));
  const accent = pageTheme?.primaryColor ?? DEFAULT_BRAND_COLOR;

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
  }, [formData.adjustmentDate]);

  const fetchProducts = async () => {
    try {
      const response = await productsApi.getAll(1, 1000, undefined, undefined, true, formData.adjustmentDate);
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

  const handleSubmit = async () => {

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
    <ClassicEntryForm
      title="New Stock Adjustment"
      documentLabel="Adjustment No#"
      backHref="/production/stock-adjustment"
      header={
        <>
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
            label="Adjustment Date"
            type="date"
            value={formData.adjustmentDate}
            onChange={(e) => setFormData({ ...formData, adjustmentDate: e.target.value })}
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
            placeholder="Optional notes"
            fullWidth
          />
        </>
      }
      footer={
        <Button
          type="button"
          variant="primary"
          disabled={isSubmitting || !isFormValid()}
          onClick={() => void handleSubmit()}
        >
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Submit
        </Button>
      }
    >
      <DeliveryLineItemsEntry
        products={products}
        items={adjustmentItems}
        onItemsChange={setAdjustmentItems}
        primaryColor={accent}
        hideSearchLabel
        searchHelperText=""
      />
    </ClassicEntryForm>
  );
}
