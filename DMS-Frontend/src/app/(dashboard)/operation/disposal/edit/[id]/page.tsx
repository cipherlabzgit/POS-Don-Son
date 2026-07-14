'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { disposalsApi } from '@/lib/api/disposals';
import { outletsApi, type Outlet } from '@/lib/api/outlets';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getDateBounds } from '@/lib/date-restrictions';
import toast from 'react-hot-toast';

export default function EditDisposalPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const user = useAuthStore((s) => s.user);
  const dateBounds = getDateBounds('today-only', user as any);

  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [disposal, setDisposal] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    disposalDate: '',
    showroomId: '',
    notes: '',
  });

  useEffect(() => {
    fetchOutlets();
    fetchDisposal();
  }, [id]);

  const fetchOutlets = async () => {
    try {
      const response = await outletsApi.getAll();
      setOutlets(response.outlets.filter(o => o.isActive));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load outlets');
    }
  };

  const fetchDisposal = async () => {
    try {
      setIsLoading(true);
      const response = await disposalsApi.getById(id);
      setDisposal(response);
      setFormData({
        disposalDate: response.disposalDate,
        showroomId: response.outletId,
        notes: response.notes || '',
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load disposal');
      router.push('/operation/disposal');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      await disposalsApi.update(id, {
        disposalDate: formData.disposalDate,
        outletId: formData.showroomId,
        notes: formData.notes,
        items: disposal.items?.map((item: any) => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          reason: item.reason,
        })) || [],
      });
      toast.success('Disposal updated successfully');
      router.push('/operation/disposal');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update disposal');
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
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Edit Disposal</h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Update disposal record
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Disposal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={<span>Disposal Date <span className="text-red-500">*</span></span>}
                type="date"
                value={formData.disposalDate}
                onChange={(e) => setFormData({ ...formData, disposalDate: e.target.value })}
                min={dateBounds.min}
                max={dateBounds.max}
                helperText={dateBounds.helperText}
                fullWidth
                required
              />
              <Select
                label={<span>Showroom <span className="text-red-500">*</span></span>}
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
