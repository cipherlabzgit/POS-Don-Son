'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { ArrowLeft, Save } from 'lucide-react';
import {
  productionSectionsApi,
  type UpdateProductionSectionDto,
  type ProductionSection,
} from '@/lib/api/production-sections';
import toast from 'react-hot-toast';

export default function EditProductionSectionPage() {
  const router = useRouter();
  const params = useParams();
  const sectionId = params.id as string;

  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    loadSection();
  }, [sectionId]);

  const loadSection = async () => {
    try {
      setLoading(true);
      const section: ProductionSection = await productionSectionsApi.getById(sectionId);
      setFormData({
        code: section.code,
        name: section.name,
        description: section.description || '',
        location: section.location || '',
        capacity: section.capacity != null ? section.capacity.toString() : '',
        displayOrder: section.displayOrder,
        isActive: section.isActive,
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load production section');
      router.push('/administrator/production-sections');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code.trim() || !formData.name.trim()) {
      toast.error('Code and Name are required');
      return;
    }

    try {
      setSubmitting(true);
      const dto: UpdateProductionSectionDto = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        location: formData.location.trim() || undefined,
        capacity: formData.capacity ? parseFloat(formData.capacity) : undefined,
        displayOrder: formData.displayOrder,
        isActive: formData.isActive,
      };
      await productionSectionsApi.update(sectionId, dto);
      toast.success('Production section updated successfully');
      router.push('/administrator/production-sections');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update production section');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p style={{ color: 'var(--muted-foreground)' }}>Loading section...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            Edit Production Section
          </h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Update section information
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
                placeholder="e.g. BAKE1, FILL, SHORT1"
                fullWidth
                required
              />
              <Input
                label="Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Bakery 1, Filling Section"
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
                  'Saving...'
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
