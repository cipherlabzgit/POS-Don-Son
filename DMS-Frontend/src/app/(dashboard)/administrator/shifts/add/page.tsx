'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { ArrowLeft, Plus } from 'lucide-react';
import { shiftsApi, type CreateShiftDto } from '@/lib/api/shifts';
import toast from 'react-hot-toast';

export default function AddShiftPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    startTime: '06:00',
    endTime: '14:00',
    description: '',
    displayOrder: 1,
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code || !formData.name || !formData.startTime || !formData.endTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const createData: CreateShiftDto = {
        name: formData.name,
        code: formData.code.toUpperCase(),
        startTime: `${formData.startTime}:00`,
        endTime: `${formData.endTime}:00`,
        description: formData.description || undefined,
        displayOrder: formData.displayOrder,
        isActive: formData.isActive,
      };
      await shiftsApi.create(createData);
      toast.success('Shift created successfully');
      router.push('/administrator/shifts');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create shift');
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
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Add New Shift</h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Create a new production shift
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shift Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
                label="Shift Code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g., MORNING, EVENING"
                fullWidth
                required
              />
              <Input
                label="Shift Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Morning Shift, Evening Shift"
                fullWidth
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                  Start Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg text-sm"
                  style={{ border: '1px solid var(--input)' }}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                  End Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg text-sm"
                  style={{ border: '1px solid var(--input)' }}
                  required
                />
              </div>
            </div>

            <Input
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
              fullWidth
            />

            <Input
              label="Display Order"
              type="number"
              value={formData.displayOrder.toString()}
              onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 1 })}
              placeholder="1"
              fullWidth
              required
            />

            <div className="pt-2">
              <Toggle
                checked={formData.isActive}
                onChange={(checked) => setFormData({ ...formData, isActive: checked })}
                label="Active Status"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
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
                <Plus className="w-4 h-4 mr-2" />
                {submitting ? 'Creating...' : 'Create Shift'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
