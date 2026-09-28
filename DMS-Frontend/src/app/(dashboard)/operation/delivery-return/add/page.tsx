'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import { Loader2, Send } from 'lucide-react';
import ClassicEntryForm from '@/components/operation/ClassicEntryForm';
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
    <ClassicEntryForm
      title="New Delivery Return"
      documentLabel="Return No#"
      backHref="/operation/delivery-return"
      header={
        <>
          <Select
            label="ShowRoom From"
            value={formData.showroomId}
            onChange={(e) => setFormData({ ...formData, showroomId: e.target.value })}
            options={outlets.map((o) => ({ value: o.id, label: `${o.code} - ${o.name}` }))}
            placeholder="Select Showroom"
            fullWidth
            required
          />
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
          />
          <div className="sm:col-span-2">
            <Input
              label="Comment"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Notes for this return (required)"
              fullWidth
              required
            />
          </div>
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
        items={returnItems}
        onItemsChange={setReturnItems}
        primaryColor={accent}
        hideSearchLabel
        searchHelperText=""
      />
    </ClassicEntryForm>
  );
}
