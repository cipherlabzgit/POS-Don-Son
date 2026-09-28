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
import { transfersApi } from '@/lib/api/transfers';
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
    transferDate: yesterdayISO(),
    fromShowroomId: '',
    toShowroomId: '',
    notes: '',
  });

  useEffect(() => {
    void fetchOutlets();
  }, []);

  useEffect(() => {
    void fetchProducts(formData.transferDate);
  }, [formData.transferDate]);

  const fetchOutlets = async () => {
    try {
      const response = await outletsApi.getAll();
      setOutlets(response.outlets.filter((o) => o.isActive));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load outlets');
    }
  };

  const fetchProducts = async (asOf: string) => {
    try {
      const response = await productsApi.getAll(1, 5000, undefined, undefined, true, asOf);
      setProducts(response.products.filter((p) => p.isActive));
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
    <DmsEntryScreen
      title="New Transfer"
      documentNo="Transfer No# New Number"
      onBack={() => router.push('/operation/transfer')}
    >
      <DmsHeaderRow>
        <DmsInlineField label="From ShowRoom :">
          <select
            className={dmsControlClass}
            value={formData.fromShowroomId}
            onChange={(e) => setFormData({ ...formData, fromShowroomId: e.target.value })}
            required
          >
            <option value="">Select source</option>
            {outlets.filter((o) => o.id !== formData.toShowroomId).map((o) => (
              <option key={o.id} value={o.id}>{o.code}</option>
            ))}
          </select>
        </DmsInlineField>
        <DmsInlineField label="To ShowRoom :">
          <select
            className={dmsControlClass}
            value={formData.toShowroomId}
            onChange={(e) => setFormData({ ...formData, toShowroomId: e.target.value })}
            required
          >
            <option value="">Select destination</option>
            {outlets.filter((o) => o.showInPos && o.id !== formData.fromShowroomId).map((o) => (
              <option key={o.id} value={o.id}>{o.code}</option>
            ))}
          </select>
        </DmsInlineField>
      </DmsHeaderRow>
      <DmsHeaderRow>
        <DmsInlineField label="Transfer Date:">
          <input
            type="date"
            className={dmsControlClass}
            value={formData.transferDate}
            min={dateBounds.min}
            max={dateBounds.max}
            onChange={(e) => setFormData({ ...formData, transferDate: e.target.value })}
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
      </DmsHeaderRow>
      {dateBounds.helperText ? (
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{dateBounds.helperText}</p>
      ) : null}

      <DeliveryLineItemsEntry
        products={products}
        items={transferItems}
        onItemsChange={setTransferItems}
        primaryColor={accent}
        showPricing
      />

      <div className="flex flex-wrap justify-end gap-2 border-t pt-3" style={{ borderColor: '#e5e7eb' }}>
        <Button type="button" variant="ghost" onClick={() => router.push('/operation/transfer')} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="button" variant="primary" disabled={isSubmitting || !canCreate || !isFormValid} onClick={() => void handleSubmit()}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Submit
        </Button>
      </div>
    </DmsEntryScreen>
  );
}
