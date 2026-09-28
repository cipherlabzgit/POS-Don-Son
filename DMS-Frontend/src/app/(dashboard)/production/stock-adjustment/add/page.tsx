'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/button';
import { Loader2, Send } from 'lucide-react';
import {
  DmsEntryScreen,
  DmsHeaderRow,
  DmsInlineField,
  dmsControlClass,
} from '@/components/operation/DmsEntryScreen';
import { stockAdjustmentsApi } from '@/lib/api/stock-adjustments';
import { productsApi, type Product } from '@/lib/api/products';
import DeliveryLineItemsEntry from '@/components/operation/DeliveryLineItemsEntry';
import type { ItemManagementItem } from '@/components/operation/ItemManagementTable';
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
    <DmsEntryScreen
      title="New Stock Adjustment"
      documentNo="Adjustment No# New Number"
      onBack={() => router.push('/production/stock-adjustment')}
    >
      <DmsHeaderRow>
        <DmsInlineField label="Adjustment Date:">
          <input
            type="date"
            className={dmsControlClass}
            value={formData.adjustmentDate}
            onChange={(e) => setFormData({ ...formData, adjustmentDate: e.target.value })}
            required
          />
        </DmsInlineField>
        <DmsInlineField label="Type :">
          <select
            className={dmsControlClass}
            value={formData.adjustmentType}
            onChange={(e) => setFormData({ ...formData, adjustmentType: e.target.value as 'Increase' | 'Decrease' })}
            required
          >
            <option value="Increase">Increase</option>
            <option value="Decrease">Decrease</option>
          </select>
        </DmsInlineField>
      </DmsHeaderRow>
      <DmsInlineField label="Reason :">
        <input
          className={`${dmsControlClass} min-w-[16rem] flex-1`}
          value={formData.reason}
          placeholder="Reason for adjustment (required)"
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          required
        />
      </DmsInlineField>
      <DmsInlineField label="Comment :">
        <input
          className={`${dmsControlClass} min-w-[16rem] flex-1`}
          value={formData.notes}
          placeholder="Optional notes"
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </DmsInlineField>

      <DeliveryLineItemsEntry
        products={products}
        items={adjustmentItems}
        onItemsChange={setAdjustmentItems}
        primaryColor={pageTheme?.primaryColor}
        showPricing
      />

      <div className="flex flex-wrap justify-end gap-2 border-t pt-3" style={{ borderColor: '#e5e7eb' }}>
        <Button type="button" variant="ghost" onClick={() => router.push('/production/stock-adjustment')} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="button" variant="primary" disabled={isSubmitting || !isFormValid()} onClick={() => void handleSubmit()}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Submit
        </Button>
      </div>
    </DmsEntryScreen>
  );
}
