'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { deliveryReturnsApi } from '@/lib/api/delivery-returns';
import { outletsApi, type Outlet } from '@/lib/api/outlets';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getDateBounds } from '@/lib/date-restrictions';
import toast from 'react-hot-toast';

export default function EditDeliveryReturnPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const user = useAuthStore((s) => s.user);
  const dateBounds = getDateBounds('today-only', user as any, {
    allowBackDatePermission: 'operation:delivery-return:allow-back-date',
    allowFutureDatePermission: 'operation:delivery-return:allow-future-date',
  });

  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    returnDate: '',
    deliveryNo: '',
    deliveredDate: '',
    showroomId: '',
    reason: '',
  });

  useEffect(() => {
    if (id) {
      fetchDeliveryReturn();
      fetchOutlets();
    }
  }, [id]);

  const fetchDeliveryReturn = async () => {
    try {
      setIsLoading(true);
      const detail = await deliveryReturnsApi.getById(id);
      const fullData = detail.data || detail;
      setFormData({
        returnDate: fullData.returnDate,
        deliveryNo: fullData.deliveryNo,
        deliveredDate: fullData.deliveredDate || '',
        showroomId: fullData.outletId,
        reason: fullData.reason,
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load delivery return');
      router.push('/operation/delivery-return');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOutlets = async () => {
    try {
      const response = await outletsApi.getAll();
      setOutlets(response.outlets.filter(o => o.isActive));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load outlets');
    }
  };

  const isFormValid = () => {
    return formData.returnDate && formData.deliveryNo && formData.deliveredDate && 
           formData.showroomId && formData.reason && formData.reason.trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      await deliveryReturnsApi.update(id, {
        returnDate: formData.returnDate,
        deliveryNo: formData.deliveryNo,
        deliveredDate: formData.deliveredDate,
        outletId: formData.showroomId,
        reason: formData.reason,
        items: [],
      });
      toast.success('Delivery return updated successfully');
      router.push('/operation/delivery-return');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update delivery return');
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
          onClick={() => router.push('/operation/delivery-return')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Delivery Returns
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
          Edit Delivery Return
        </h1>
        <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Update delivery return information
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Delivery Return Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Return Date"
                type="date"
                value={formData.returnDate}
                onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                min={dateBounds.min}
                max={dateBounds.max}
                fullWidth
                required
              />
              <Input
                label="Delivered Date"
                type="date"
                value={formData.deliveredDate}
                onChange={(e) => setFormData({ ...formData, deliveredDate: e.target.value })}
                fullWidth
              />
            </div>
            <Input
              label="Delivery No"
              value={formData.deliveryNo}
              onChange={(e) => setFormData({ ...formData, deliveryNo: e.target.value })}
              fullWidth
              required
            />
            <Select
              label="Showroom"
              value={formData.showroomId}
              onChange={(e) => setFormData({ ...formData, showroomId: e.target.value })}
              options={outlets.map(o => ({ value: o.id, label: `${o.code} - ${o.name}` }))}
              fullWidth
              required
            />
            <Input
              label="Reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              fullWidth
              required
            />

            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push('/operation/delivery-return')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting || !isFormValid()}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
