'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/button';
import {
  DmsEntryScreen,
  DmsHeaderRow,
  DmsInlineField,
  dmsControlClass,
} from '@/components/operation/DmsEntryScreen';
import DeliveryLineItemsEntry from '@/components/operation/DeliveryLineItemsEntry';
import type { ItemManagementItem } from '@/components/operation/ItemManagementTable';
import { Loader2, Send } from 'lucide-react';
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
    <DmsEntryScreen
      title="New Delivery Cancellation"
      documentNo="Cancellation No# New Number"
      onBack={() => router.push('/operation/cancellation')}
    >
      <DmsHeaderRow>
        <DmsInlineField label="ShowRoom :">
          <select
            className={dmsControlClass}
            value={formData.showroomId}
            onChange={(e) => setFormData({ ...formData, showroomId: e.target.value })}
            required
          >
            <option value="">Select Showroom</option>
            {outlets.map((o) => (
              <option key={o.id} value={o.id}>{o.code}</option>
            ))}
          </select>
        </DmsInlineField>
        <DmsInlineField label="Cancellation Date:">
          <input
            type="date"
            className={dmsControlClass}
            value={formData.cancellationDate}
            min={dateBounds.min}
            max={dateBounds.max}
            onChange={(e) => setFormData({ ...formData, cancellationDate: e.target.value })}
            required
          />
        </DmsInlineField>
      </DmsHeaderRow>
      <DmsInlineField label="Comment :">
        <input
          className={`${dmsControlClass} min-w-[16rem] flex-1`}
          value={formData.reason}
          placeholder="Reason for cancellation (required)"
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          required
        />
      </DmsInlineField>
      {dateBounds.helperText ? (
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{dateBounds.helperText}</p>
      ) : null}

      <DeliveryLineItemsEntry
        products={products}
        items={lineItems}
        onItemsChange={setLineItems}
        primaryColor={accent}
      />

      <div className="flex flex-wrap justify-end gap-2 border-t pt-3" style={{ borderColor: '#e5e7eb' }}>
        <Button type="button" variant="ghost" onClick={() => router.push('/operation/cancellation')} disabled={isSubmitting}>
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
