'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { uomsApi } from '@/lib/api/uoms';
import toast from 'react-hot-toast';

export default function EditUOMPage() {
  const router = useRouter();
  const params = useParams();
  const uomId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    fetchUOM();
  }, [uomId]);

  const fetchUOM = async () => {
    try {
      setLoading(true);
      const uom = await uomsApi.getById(uomId);
      setFormData({
        code: uom.code,
        description: uom.description,
        isActive: uom.isActive,
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load unit of measure');
      router.push('/inventory/uom');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      await uomsApi.update(uomId, formData);
      toast.success('Unit of measure updated successfully');
      router.push('/inventory/uom');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update unit of measure');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p style={{ color: 'var(--muted-foreground)' }}>Loading unit of measure...</p>
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
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Edit Unit of Measure</h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Update unit of measure information
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
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
