'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { ArrowLeft, Plus } from 'lucide-react';
import { productionSectionsApi, type CreateProductionSectionDto } from '@/lib/api/production-sections';
import toast from 'react-hot-toast';

export default function AddProductionSectionPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    location: '',
    capacity: '',
    displayOrder: 0,
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code.trim() || !formData.name.trim()) {
      toast.error('Code and Name are required');
      return;
    }

    try {
      setSubmitting(true);
      const dto: CreateProductionSectionDto = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        location: formData.location.trim() || undefined,
        capacity: formData.capacity ? parseFloat(formData.capacity) : undefined,
        displayOrder: formData.displayOrder,
        isActive: formData.isActive,
      };
      await productionSectionsApi.create(dto);
      toast.success('Production section created successfully');
      router.push('/administrator/production-sections');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create production section');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            Add Production Section
          </h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Create a new production section
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Section Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Code *"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. SECT1, PROD2"
                fullWidth
                required
              />
              <Input
                label="Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Section 1, Production Area A"
                fullWidth
                required
              />
            </div>

            <Input
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description of this section"
              fullWidth
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Location / Department"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Ground Floor, Block A"
                fullWidth
              />
              <Input
                label="Capacity"
                type="number"
                step="0.01"
                min="0"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                placeholder="Optional max capacity"
                fullWidth
              />
            </div>

            <Input
              label="Display Order"
              type="number"
              min="0"
              value={formData.displayOrder.toString()}
              onChange={(e) =>
                setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })
              }
              placeholder="Sort order for display (0 = first)"
              fullWidth
            />

            <div className="pt-2">
              <Toggle
                checked={formData.isActive}
                onChange={(checked) => setFormData({ ...formData, isActive: checked })}
                label="Active"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="ghost" onClick={() => router.back()} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? (
                  'Creating...'
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Section
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
