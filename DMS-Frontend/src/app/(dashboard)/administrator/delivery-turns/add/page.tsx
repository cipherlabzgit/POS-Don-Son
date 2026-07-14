'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { ArrowLeft, Plus } from 'lucide-react';
import { deliveryTurnsApi, type CreateDeliveryTurnDto, type DeliveryTurnSectionTiming } from '@/lib/api/delivery-turns';
import SectionTimingForm from '@/components/delivery-turns/SectionTimingForm';
import toast from 'react-hot-toast';

export default function AddDeliveryTurnPage() {
  const router = useRouter();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code || !formData.name || !formData.time) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const createData: CreateDeliveryTurnDto = {
        code: formData.code,
        name: formData.name,
        description: formData.description,
        time: formData.time,
        displayOrder: formData.displayOrder,
        isActive: formData.isActive,
        sectionTimings: sectionTimings,
      };
      await deliveryTurnsApi.create(createData);
      toast.success('Delivery turn created successfully');
      router.push('/administrator/delivery-turns');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create delivery turn');
    } finally {
      setSubmitting(false);
    }
  };

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
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Add New Delivery Turn</h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Create a new delivery turn time and schedule
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
                {submitting ? 'Creating...' : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Delivery Turn
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
