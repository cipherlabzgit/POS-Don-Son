'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { ArrowLeft, Save } from 'lucide-react';
import { deliveryTurnsApi, type UpdateDeliveryTurnDto, type DeliveryTurn, type DeliveryTurnSectionTiming } from '@/lib/api/delivery-turns';
import SectionTimingForm from '@/components/delivery-turns/SectionTimingForm';
import toast from 'react-hot-toast';

export default function EditDeliveryTurnPage() {
  const router = useRouter();
  const params = useParams();
  const deliveryTurnId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    time: '',
    displayOrder: 0,
    isActive: true,
  });

  const [sectionTimings, setSectionTimings] = useState<DeliveryTurnSectionTiming[]>([]);

  useEffect(() => {
    loadDeliveryTurn();
  }, [deliveryTurnId]);

  const loadDeliveryTurn = async () => {
    try {
      setLoading(true);
      const turn = await deliveryTurnsApi.getById(deliveryTurnId);
      setFormData({
        code: turn.code,
        name: turn.name,
        description: turn.description || '',
        time: turn.time,
        displayOrder: turn.displayOrder,
        isActive: turn.isActive,
      });
      setSectionTimings(turn.sectionTimings ?? []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load delivery turn');
      router.push('/administrator/delivery-turns');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code || !formData.name || !formData.time) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const updateData: UpdateDeliveryTurnDto = {
        code: formData.code,
        name: formData.name,
        description: formData.description,
        time: formData.time,
        displayOrder: formData.displayOrder,
        isActive: formData.isActive,
        sectionTimings: sectionTimings,
      };
      await deliveryTurnsApi.update(deliveryTurnId, updateData);
      toast.success('Delivery turn updated successfully');
      router.push('/administrator/delivery-turns');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update delivery turn');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p style={{ color: 'var(--muted-foreground)' }}>Loading delivery turn...</p>
        </div>
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
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Edit Delivery Turn</h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Update delivery turn information and schedule
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Turn Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Turn Code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., M, A, E"
                fullWidth
                required
              />
              <Input
                label="Turn Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Morning, Afternoon"
                fullWidth
                required
              />
            </div>

            <Input
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
              fullWidth
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Delivery Time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                fullWidth
                required
              />
              <Input
                label="Display Order"
                type="number"
                value={formData.displayOrder.toString()}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                fullWidth
              />
            </div>

            <div className="pt-2">
              <Toggle
                checked={formData.isActive}
                onChange={(checked) => setFormData({ ...formData, isActive: checked })}
                label="Active Status"
              />
            </div>
          </form>
        </CardContent>
      </Card>

      <SectionTimingForm
        sectionTimings={sectionTimings}
        onTimingsChange={setSectionTimings}
      />

      <Card>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit}>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting}
              >
                {submitting ? 'Saving...' : (
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
