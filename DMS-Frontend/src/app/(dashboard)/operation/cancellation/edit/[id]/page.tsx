'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { cancellationsApi } from '@/lib/api/cancellations';
import { outletsApi, type Outlet } from '@/lib/api/outlets';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getDateBounds } from '@/lib/date-restrictions';
import toast from 'react-hot-toast';

export default function EditCancellationPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const user = useAuthStore((s) => s.user);
  const dateBounds = getDateBounds('back-3-no-future', user as any, {
    allowBackDatePermission: 'operation:cancellation:allow-back-date',
    allowFutureDatePermission: 'operation:cancellation:allow-future-date',
  });

  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    cancellationDate: '',
    deliveryNo: '',
    deliveredDate: '',
    showroomId: '',
    reason: '',
  });

  const isFormValid = () => {
    return formData.cancellationDate && formData.deliveryNo && formData.deliveredDate &&
           formData.showroomId && formData.reason && formData.reason.trim();
  };

  useEffect(() => {
    fetchOutlets();
    fetchCancellation();
  }, [id]);

  const fetchOutlets = async () => {
    try {
      const response = await outletsApi.getAll();
      setOutlets(response.outlets.filter(o => o.isActive));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load outlets');
    }
  };

  const fetchCancellation = async () => {
    try {
      setIsLoading(true);
      const response = await cancellationsApi.getById(id);
      const cancellation = response.data || response;
      setFormData({
        cancellationDate: cancellation.cancellationDate,
        deliveryNo: cancellation.deliveryNo,
        deliveredDate: cancellation.deliveredDate || '',
        showroomId: cancellation.outletId,
        reason: cancellation.reason,
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load cancellation');
      router.push('/operation/cancellation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      await cancellationsApi.update(id, {
        cancellationDate: formData.cancellationDate,
        deliveryNo: formData.deliveryNo,
        deliveredDate: formData.deliveredDate,
        outletId: formData.showroomId,
        reason: formData.reason,
      });
      toast.success('Cancellation updated successfully');
      router.push('/operation/cancellation');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update cancellation');
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
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Edit Cancellation</h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Update delivery cancellation request
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cancellation Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Cancellation Date"
                type="date"
                value={formData.cancellationDate}
                onChange={(e) => setFormData({ ...formData, cancellationDate: e.target.value })}
                min={dateBounds.min}
                max={dateBounds.max}
                helperText={dateBounds.helperText}
                fullWidth
                required
              />
              <Input
                label="Delivered Date"
                type="date"
                value={formData.deliveredDate}
                onChange={(e) => setFormData({ ...formData, deliveredDate: e.target.value })}
                fullWidth
                required
              />
            </div>
            
            <Input
              label="Delivery No"
              value={formData.deliveryNo}
              onChange={(e) => setFormData({ ...formData, deliveryNo: e.target.value })}
              placeholder="DN-2026-XXXXXX"
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
            
            <Input
              label="Reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Reason for cancellation..."
              fullWidth
              required
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
                disabled={isSubmitting || !isFormValid()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Cancellation
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
