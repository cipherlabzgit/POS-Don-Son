'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { ArrowLeft, Plus, Loader2 } from 'lucide-react';
import { uomsApi } from '@/lib/api/uoms';
import toast from 'react-hot-toast';

export default function AddUOMPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      await uomsApi.create(formData);
      toast.success('Unit of measure created successfully');
      router.push('/inventory/uom');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create unit of measure');
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
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Add New Unit of Measure</h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Create a new unit of measure
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>UOM Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="UOM Code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="e.g., KG, PC, LTR"
              fullWidth
              required
            />
            <Input
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Full description"
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
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Add UOM
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
