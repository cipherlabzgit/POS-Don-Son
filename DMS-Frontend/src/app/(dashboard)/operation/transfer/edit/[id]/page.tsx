'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { transfersApi, type Transfer } from '@/lib/api/transfers';
import { outletsApi, type Outlet } from '@/lib/api/outlets';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useThemeStore } from '@/lib/stores/theme-store';
import { getDateBounds } from '@/lib/date-restrictions';
import toast from 'react-hot-toast';

export default function EditTransferPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const user = useAuthStore((s) => s.user);
  const pageTheme = useThemeStore((s) => s.getPageTheme('transfer'));
  const dateBounds = getDateBounds('back-3-no-future', user as any, {
    allowBackDatePermission: 'operation:transfer:allow-back-date',
    allowFutureDatePermission: 'operation:transfer:allow-future-date',
  });

  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    transferDate: '',
    fromShowroomId: '',
    toShowroomId: '',
    notes: '',
  });

  useEffect(() => {
    if (id) {
      fetchTransfer();
      fetchOutlets();
    }
  }, [id]);

  const fetchTransfer = async () => {
    try {
      setIsLoading(true);
      const transfer = await transfersApi.getById(id);
      setSelectedTransfer(transfer);
      setFormData({
        transferDate: transfer.transferDate,
        fromShowroomId: transfer.fromOutletId,
        toShowroomId: transfer.toOutletId,
        notes: transfer.notes || '',
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load transfer');
      router.push('/operation/transfer');
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
    return formData.transferDate && formData.fromShowroomId && formData.toShowroomId && 
           formData.fromShowroomId !== formData.toShowroomId;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.fromShowroomId === formData.toShowroomId) {
      toast.error('From and To outlets must be different');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await transfersApi.update(id, {
        transferDate: formData.transferDate,
        fromOutletId: formData.fromShowroomId,
        toOutletId: formData.toShowroomId,
        notes: formData.notes,
        items: selectedTransfer?.items?.map(item => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
        })) || [],
      });
      toast.success('Transfer updated successfully');
      router.push('/operation/transfer');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update transfer');
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
          onClick={() => router.push('/operation/transfer')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Transfers
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
          Edit Transfer
        </h1>
        <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Update transfer information
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Transfer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Input
              label={<span>Transfer Date <span className="text-red-500">*</span></span>}
              type="date"
              value={formData.transferDate}
              onChange={(e) => setFormData({ ...formData, transferDate: e.target.value })}
              min={dateBounds.min}
              max={dateBounds.max}
              helperText={dateBounds.helperText}
              fullWidth
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label={<span>From Showroom <span className="text-red-500">*</span></span>}
                value={formData.fromShowroomId}
                onChange={(e) => setFormData({ ...formData, fromShowroomId: e.target.value })}
                options={outlets.filter(o => o.id !== formData.toShowroomId).map(o => ({ value: o.id, label: `${o.code} - ${o.name}` }))}
                placeholder="Select source showroom"
                fullWidth
                required
              />
              <Select
                label={<span>To Showroom <span className="text-red-500">*</span></span>}
                value={formData.toShowroomId}
                onChange={(e) => setFormData({ ...formData, toShowroomId: e.target.value })}
                options={outlets.filter(o => o.id !== formData.fromShowroomId).map(o => ({ value: o.id, label: `${o.code} - ${o.name}` }))}
                placeholder="Select destination showroom"
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

            {/* Display Items (read-only in edit mode) */}
            {selectedTransfer?.items && selectedTransfer.items.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
                  Transfer Items
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead style={{ backgroundColor: 'var(--muted)' }}>
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Product</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTransfer.items.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-4 py-3 text-sm">
                            {item.productCode || item.product?.code} - {item.productName || item.product?.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">{item.quantity.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push('/operation/transfer')}
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
