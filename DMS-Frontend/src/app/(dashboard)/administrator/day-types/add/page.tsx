'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { ArrowLeft, Plus } from 'lucide-react';
import { dayTypesApi, type CreateDayTypeDto } from '@/lib/api/day-types';
import { MultiplierFieldLabel, MULTIPLIER_HELPER_TEXT } from '../multiplier-field-label';
import DaySelector from '@/components/day-types/DaySelector';
import toast from 'react-hot-toast';

export default function AddDayTypePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    multiplier: 1.0,
    color: '#C8102E',
    isActive: true,
  });

  const [applicableDays, setApplicableDays] = useState<number[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.name) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const createData: CreateDayTypeDto = {
        code: formData.code,
        name: formData.name,
        description: formData.description,
        multiplier: formData.multiplier,
        color: formData.color,
        isActive: formData.isActive,
        applicableDays,
      };
      await dayTypesApi.create(createData);
      toast.success('Day type created successfully');
      router.push('/administrator/day-types');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create day type');
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
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Add New Day Type</h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Create a new production day type
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Day Type Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Day Type Code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., HOL, WKD"
                fullWidth
                required
              />
              <Input
                label="Day Type Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Holiday, Weekend"
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
              <div className="w-full">
                <MultiplierFieldLabel />
                <Input
                  id="day-type-multiplier"
                  type="number"
                  step="0.1"
                  value={formData.multiplier.toString()}
                  onChange={(e) => setFormData({ ...formData, multiplier: parseFloat(e.target.value) || 1.0 })}
                  fullWidth
                  required
                  helperText={MULTIPLIER_HELPER_TEXT}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                  Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#000000"
                    fullWidth
                  />
                </div>
              </div>
            </div>

            <div className="pt-1 pb-1">
              <DaySelector selected={applicableDays} onChange={setApplicableDays} />
            </div>

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
                {submitting ? 'Creating...' : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Day Type
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
