'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { deliveriesApi } from '@/lib/api/deliveries';
import { outletsApi, type Outlet } from '@/lib/api/outlets';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getDateBounds } from '@/lib/date-restrictions';
import toast from 'react-hot-toast';

function mergeCalendarDateIntoInstant(previousIso: string, yyyyMmDd: string): string {
  const prev = new Date(previousIso);
  if (Number.isNaN(prev.getTime())) return new Date(`${yyyyMmDd}T12:00:00`).toISOString();
  const parts = yyyyMmDd.split('-').map(Number);
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  if ([y, m, d].some((n) => Number.isNaN(n))) return previousIso;
  const next = new Date(
    y,
    m - 1,
    d,
    prev.getHours(),
    prev.getMinutes(),
    prev.getSeconds(),
    prev.getMilliseconds()
  );
  return next.toISOString();
}

export default function EditDeliveryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const user = useAuthStore((s) => s.user);
  const dateBounds = getDateBounds('delivery', user as any, {
    allowBackDatePermission: 'operation:delivery:allow-back-date',
    allowFutureDatePermission: 'operation:delivery:allow-future-date',
  });

  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [delivery, setDelivery] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    deliveryDate: '',
    deliveryDateIso: '',
    showroomId: '',
    notes: '',
  });

  useEffect(() => {
    fetchOutlets();
    fetchDelivery();
  }, [id]);

  const fetchOutlets = async () => {
    try {
      const response = await outletsApi.getAll();
      setOutlets(response.outlets.filter(o => o.isActive));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load outlets');
    }
  };

  const fetchDelivery = async () => {
    try {
      setIsLoading(true);
      const response = await deliveriesApi.getById(id);
      setDelivery(response);
      setFormData({
        deliveryDate: response.deliveryDate.slice(0, 10),
        deliveryDateIso: response.deliveryDate,
        showroomId: response.outletId,
        notes: response.notes || '',
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load delivery');
      router.push('/operation/delivery');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      await deliveriesApi.update(id, {
        deliveryDate: formData.deliveryDateIso,
        outletId: formData.showroomId,
        notes: formData.notes,
        items: delivery.items?.map((item: any) => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })) || [],
      });
      toast.success('Delivery updated successfully');
      router.push('/operation/delivery');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update delivery');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Edit Delivery</h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Update delivery information
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Delivery Date"
                type="date"
                value={formData.deliveryDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    deliveryDate: e.target.value,
                    deliveryDateIso: mergeCalendarDateIntoInstant(
                      prev.deliveryDateIso,
                      e.target.value
                    ),
                  }))
                }
                min={dateBounds.min}
                max={dateBounds.max}
                readOnly={!!dateBounds.lockToNow}
                helperText={dateBounds.helperText}
                fullWidth
                required
              />
              <Select
                label="Showroom"
                value={formData.showroomId}
                onChange={(e) => setFormData({ ...formData, showroomId: e.target.value })}
                options={outlets.map(o => ({ value: o.id, label: `${o.code} - ${o.name}` }))}
                placeholder="Select showroom"
                fullWidth
                required
              />
            </div>
            
            <Input
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              fullWidth
            />

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
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
