'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import { Loader2, Send } from 'lucide-react';
import ClassicEntryForm from '@/components/operation/ClassicEntryForm';
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
    <ClassicEntryForm
      title="New Transfer"
      documentLabel="Transfer No#"
      backHref="/operation/transfer"
      header={
        <>
          <Select
            label="From ShowRoom"
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
            label="To ShowRoom"
            value={formData.toShowroomId}
            onChange={(e) => setFormData({ ...formData, toShowroomId: e.target.value })}
            options={outlets
              .filter((o) => o.showInPos && o.id !== formData.fromShowroomId)
              .map((o) => ({ value: o.id, label: `${o.code} - ${o.name}` }))}
            placeholder="Select destination showroom"
            fullWidth
            required
          />
          <Input
            label="Transfer Date"
            type="date"
            value={formData.transferDate}
            onChange={(e) => setFormData({ ...formData, transferDate: e.target.value })}
            min={dateBounds.min}
            max={dateBounds.max}
            helperText={dateBounds.helperText}
            fullWidth
            required
          />
          <Input
            label="Comment"
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
          disabled={isSubmitting || !canCreate || !isFormValid}
          onClick={() => void handleSubmit()}
        >
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Submit
        </Button>
      }
    >
      <DeliveryLineItemsEntry
        products={products}
        items={transferItems}
        onItemsChange={setTransferItems}
        primaryColor={accent}
        hideSearchLabel
        searchHelperText=""
      />
    </ClassicEntryForm>
  );
}
