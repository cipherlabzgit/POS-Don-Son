'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/button';
import { Loader2, Printer, Send } from 'lucide-react';
import {
  DmsEntryScreen,
  DmsHeaderRow,
  DmsInlineField,
  dmsControlClass,
} from '@/components/operation/DmsEntryScreen';
import { deliveriesApi } from '@/lib/api/deliveries';
import { outletsApi, type Outlet } from '@/lib/api/outlets';
import { productsApi, type Product } from '@/lib/api/products';
import { printDeliveryNotesHybrid } from '@/lib/print-delivery-hybrid';
import { DnPrintStatusBadge } from '@/components/operation/DnPrintStatusBadge';
import DeliveryLineItemsEntry from '@/components/operation/DeliveryLineItemsEntry';
import type { ItemManagementItem } from '@/components/operation/ItemManagementTable';
import { useAuthStore } from '@/lib/stores/auth-store';
import { DEFAULT_BRAND_COLOR, useThemeStore } from '@/lib/stores/theme-store';
import { getDateBounds, nowDateTimeLocalValue } from '@/lib/date-restrictions';
import { usePermissions } from '@/hooks/usePermissions';
import toast from 'react-hot-toast';
import ProtectedPage from '@/components/auth/ProtectedPage';

export default function AddDeliveryPage() {
  return (
    <ProtectedPage permission="operation:delivery:view">
      <AddDeliveryPageContent />
    </ProtectedPage>
  );
}

function AddDeliveryPageContent() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { canAction } = usePermissions();
  const canCreate = canAction('/operation/delivery', 'create');
  const pageTheme = useThemeStore((s) => s.getPageTheme('delivery'));
  const accent =
    pageTheme?.secondaryColor ??
    pageTheme?.primaryColor ??
    DEFAULT_BRAND_COLOR;
  const dateBounds = getDateBounds('delivery', user as any, {
    allowBackDatePermission: 'operation:delivery:allow-back-date',
    allowFutureDatePermission: 'operation:delivery:allow-future-date',
  });

  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryItems, setDeliveryItems] = useState<ItemManagementItem[]>([]);

  const [formData, setFormData] = useState({
    deliveryDateTime: nowDateTimeLocalValue(),
    showroomId: '',
    notes: '',
  });

  useEffect(() => {
    if (dateBounds.lockToNow) {
      setFormData((f) => ({ ...f, deliveryDateTime: nowDateTimeLocalValue() }));
    }
  }, [dateBounds.lockToNow, user?.id]);

  const selectedDatePart = formData.deliveryDateTime.slice(0, 10);

  useEffect(() => {
    (async () => {
      try {
        const oRes = await outletsApi.getAll();
        setOutlets(oRes.outlets.filter((x) => x.isActive));
      } catch (e: any) {
        toast.error(e.response?.data?.message || 'Failed to load form data');
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedDatePart) return;
    let cancelled = false;
    void (async () => {
      try {
        const pRes = await productsApi.getAll(1, 5000, undefined, undefined, true, selectedDatePart);
        if (!cancelled) setProducts(pRes.products.filter((p) => p.isActive));
      } catch (e: any) {
        if (!cancelled) toast.error(e.response?.data?.message || 'Failed to load products');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedDatePart]);

  const dateInAllowedRange =
    dateBounds.lockToNow ||
    ((!dateBounds.min || selectedDatePart >= dateBounds.min) &&
      (!dateBounds.max || selectedDatePart <= dateBounds.max));

  const isFormValid =
    !!formData.showroomId && deliveryItems.length > 0 && dateInAllowedRange;

  const submit = async (alsoPrint: boolean) => {
    if (!canCreate) {
      toast.error('You do not have permission to create deliveries');
      return;
    }
    if (!formData.showroomId) {
      toast.error('Please select a showroom');
      return;
    }
    if (deliveryItems.length === 0) {
      toast.error('Please add at least one item');
      return;
    }
    if (
      !dateBounds.lockToNow &&
      ((dateBounds.min && selectedDatePart < dateBounds.min) ||
        (dateBounds.max && selectedDatePart > dateBounds.max))
    ) {
      toast.error('Delivery date is outside the allowed range');
      return;
    }

    const parsed = dateBounds.lockToNow ? new Date() : new Date(formData.deliveryDateTime);
    if (Number.isNaN(parsed.getTime())) {
      toast.error('Invalid date and time');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        deliveryDate: parsed.toISOString(),
        outletId: formData.showroomId,
        notes: formData.notes || undefined,
        items: deliveryItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice ?? 0,
        })),
      };
      const createdRaw = await deliveriesApi.create(payload);
      const created = (createdRaw as any)?.data ?? createdRaw;
      const createdId = created?.id ?? created?.Id;
      toast.success('Delivery created successfully');
      if (alsoPrint && createdId) {
        try {
          const full = await deliveriesApi.getById(createdId);
          const printedBy =
            [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
            user?.email ||
            'System';
          const result = await printDeliveryNotesHybrid([full], { printedBy });
          if (result.mode === 'client') {
            toast.success('Queued for DN Print Client');
          }
        } catch (printError: any) {
          console.error('Delivery note print failed:', printError);
          toast.error(printError.response?.data?.message || 'Delivery saved but printing failed');
        }
      }
      router.push('/operation/delivery');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create delivery');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DmsEntryScreen
      title="New Delivery"
      documentNo="Delivery No# New Number"
      onBack={() => router.push('/operation/delivery')}
      toolbar={<DnPrintStatusBadge />}
    >
      <DmsHeaderRow>
        <DmsInlineField label="ShowRoom :">
          <select
            className={dmsControlClass}
            value={formData.showroomId}
            onChange={(e) => setFormData((f) => ({ ...f, showroomId: e.target.value }))}
            required
          >
            <option value="">Select Showroom</option>
            {outlets.map((o) => (
              <option key={o.id} value={o.id}>
                {o.code}
              </option>
            ))}
          </select>
        </DmsInlineField>
        <DmsInlineField label="Date/Time:">
          <input
            type="datetime-local"
            className={dmsControlClass}
            value={formData.deliveryDateTime}
            min={dateBounds.lockToNow ? undefined : dateBounds.min ? `${dateBounds.min}T00:00` : undefined}
            max={dateBounds.lockToNow ? undefined : dateBounds.max ? `${dateBounds.max}T23:59` : undefined}
            readOnly={dateBounds.lockToNow}
            onChange={(e) => setFormData((f) => ({ ...f, deliveryDateTime: e.target.value }))}
            required
          />
        </DmsInlineField>
      </DmsHeaderRow>
      <DmsInlineField label="Comment :">
        <input
          className={`${dmsControlClass} min-w-[16rem] flex-1`}
          value={formData.notes}
          placeholder="Optional notes"
          onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
        />
      </DmsInlineField>
      {dateBounds.helperText ? (
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {dateBounds.helperText}
        </p>
      ) : null}

      <DeliveryLineItemsEntry
        products={products}
        items={deliveryItems}
        onItemsChange={setDeliveryItems}
        primaryColor={accent}
      />

      <div className="flex flex-wrap justify-end gap-2 border-t pt-3" style={{ borderColor: '#e5e7eb' }}>
        <Button type="button" variant="ghost" onClick={() => router.push('/operation/delivery')} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="button" variant="primary" disabled={isSubmitting || !canCreate || !isFormValid} onClick={() => submit(false)}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Submit
        </Button>
        <Button type="button" variant="secondary" disabled={isSubmitting || !canCreate || !isFormValid} onClick={() => submit(true)}>
          <Printer className="mr-2 h-4 w-4" />
          Submit &amp; Print
        </Button>
      </div>
    </DmsEntryScreen>
  );
}
