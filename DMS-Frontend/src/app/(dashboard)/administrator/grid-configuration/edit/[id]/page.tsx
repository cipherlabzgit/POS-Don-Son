'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { ArrowLeft, Save } from 'lucide-react';
import { gridConfigurationsApi, type UpdateGridConfigurationDto } from '@/lib/api/grid-configurations';
import toast from 'react-hot-toast';

export default function EditGridConfigurationPage() {
  const router = useRouter();
  const params = useParams();
  const configId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    gridName: '',
    userId: undefined as string | undefined,
    configurationName: '',
    columnSettings: '',
    sortSettings: '',
    filterSettings: '',
    pageSize: 50,
    isDefault: false,
    isShared: false,
    isActive: true,
  });

  useEffect(() => {
    loadConfiguration();
  }, [configId]);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      const config = await gridConfigurationsApi.getById(configId);
      setFormData({
        gridName: config.gridName,
        userId: config.userId,
        configurationName: config.configurationName || '',
        columnSettings: config.columnSettings || '',
        sortSettings: config.sortSettings || '',
        filterSettings: config.filterSettings || '',
        pageSize: config.pageSize || 50,
        isDefault: config.isDefault,
        isShared: config.isShared,
        isActive: config.isActive,
      });
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to load configuration';
      toast.error(errorMsg);
      router.push('/administrator/grid-configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.gridName || !formData.configurationName) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      setSubmitting(true);
      const updateData: UpdateGridConfigurationDto = {
        gridName: formData.gridName,
        userId: formData.userId,
        configurationName: formData.configurationName,
        columnSettings: formData.columnSettings,
        sortSettings: formData.sortSettings,
        filterSettings: formData.filterSettings,
        pageSize: formData.pageSize,
        isDefault: formData.isDefault,
        isShared: formData.isShared,
        isActive: formData.isActive,
      };
      await gridConfigurationsApi.update(configId, updateData);
      toast.success('Grid configuration updated successfully');
      router.push('/administrator/grid-configuration');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update configuration');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p style={{ color: 'var(--muted-foreground)' }}>Loading configuration...</p>
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
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Edit Grid Configuration</h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Update grid configuration settings
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Grid Name"
                value={formData.gridName}
                onChange={(e) => setFormData({ ...formData, gridName: e.target.value })}
                placeholder="e.g., OrderGrid, ProductGrid"
                fullWidth
                required
              />
              <Input
                label="Configuration Name"
                value={formData.configurationName}
                onChange={(e) => setFormData({ ...formData, configurationName: e.target.value })}
                placeholder="My Custom View"
                fullWidth
                required
              />
            </div>
            <Input
              label="User ID (Optional)"
              value={formData.userId || ''}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value || undefined })}
              placeholder="Leave empty for global configuration"
              fullWidth
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Page Size"
                type="number"
                value={formData.pageSize.toString()}
                onChange={(e) => setFormData({ ...formData, pageSize: parseInt(e.target.value) || 50 })}
                fullWidth
              />
            </div>
            <Input
              label="Column Settings (JSON)"
              value={formData.columnSettings}
              onChange={(e) => setFormData({ ...formData, columnSettings: e.target.value })}
              placeholder='{"visible": ["col1", "col2"], "widths": {"col1": 100}}'
              fullWidth
            />
            <Input
              label="Sort Settings (JSON)"
              value={formData.sortSettings}
              onChange={(e) => setFormData({ ...formData, sortSettings: e.target.value })}
              placeholder='{"field": "name", "direction": "asc"}'
              fullWidth
            />
            <Input
              label="Filter Settings (JSON)"
              value={formData.filterSettings}
              onChange={(e) => setFormData({ ...formData, filterSettings: e.target.value })}
              placeholder='{"category": "bakery", "status": "active"}'
              fullWidth
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <Toggle
                checked={formData.isDefault}
                onChange={(checked) => setFormData({ ...formData, isDefault: checked })}
                label="Set as Default"
              />
              <Toggle
                checked={formData.isShared}
                onChange={(checked) => setFormData({ ...formData, isShared: checked })}
                label="Shared Configuration"
              />
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
