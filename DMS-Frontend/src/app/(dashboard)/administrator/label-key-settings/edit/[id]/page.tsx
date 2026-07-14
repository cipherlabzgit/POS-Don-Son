'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { ArrowLeft, Save } from 'lucide-react';
import {
  labelSettingsApi,
  type LabelSetting,
  type UpdateLabelSettingDto,
  getLabelSettingsErrorMessage,
} from '@/lib/api/label-settings';
import toast from 'react-hot-toast';
import { ProtectedPage } from '@/components/auth';

export default function EditLabelKeySettingPage() {
  const router = useRouter();
  const params = useParams();
  const settingId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isSystemSetting, setIsSystemSetting] = useState(false);

  const [formData, setFormData] = useState({
    settingKey: '',
    settingName: '',
    settingValue: '',
    description: '',
    category: '',
    valueType: 'string',
    sortOrder: 0,
    isSystemSetting: false,
    isActive: true,
  });

  useEffect(() => {
    loadSetting();
  }, [settingId]);

  const loadSetting = async () => {
    try {
      setLoading(true);
      const setting = await labelSettingsApi.getById(settingId);
      setFormData({
        settingKey: setting.settingKey,
        settingName: setting.settingName,
        settingValue: setting.settingValue || '',
        description: setting.description || '',
        category: setting.category || '',
        valueType: setting.valueType,
        sortOrder: setting.sortOrder,
        isSystemSetting: setting.isSystemSetting,
        isActive: setting.isActive,
      });
      setIsSystemSetting(setting.isSystemSetting);
    } catch (error: unknown) {
      toast.error(getLabelSettingsErrorMessage(error));
      router.push('/administrator/label-key-settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.settingKey || !formData.settingName) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const payload: UpdateLabelSettingDto = {
        settingKey: formData.settingKey,
        settingName: formData.settingName,
        settingValue: formData.settingValue || undefined,
        description: formData.description || undefined,
        category: formData.category || undefined,
        valueType: formData.valueType,
        sortOrder: formData.sortOrder,
        isSystemSetting: formData.isSystemSetting,
        isActive: formData.isActive,
      };
      await labelSettingsApi.update(settingId, payload);
      toast.success('Setting updated successfully');
      router.push('/administrator/label-key-settings');
    } catch (error: unknown) {
      toast.error(getLabelSettingsErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ProtectedPage permission="label-settings:view">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p style={{ color: 'var(--muted-foreground)' }}>Loading setting...</p>
          </div>
        </div>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage permission="label-settings:edit">
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
              Edit label configuration key
            </h1>
            <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
              Update label-related key/value setting
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Setting information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Setting Key"
                  value={formData.settingKey}
                  onChange={(e) => setFormData({ ...formData, settingKey: e.target.value })}
                  placeholder="e.g., LABEL_FONT_SIZE"
                  fullWidth
                  required
                  disabled={isSystemSetting}
                />
                <Input
                  label="Setting Name"
                  value={formData.settingName}
                  onChange={(e) => setFormData({ ...formData, settingName: e.target.value })}
                  placeholder="Label Font Size"
                  fullWidth
                  required
                />
              </div>

              <Input
                label="Setting Value"
                value={formData.settingValue}
                onChange={(e) => setFormData({ ...formData, settingValue: e.target.value })}
                placeholder="Value"
                fullWidth
              />

              <Input
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                fullWidth
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Display"
                  fullWidth
                />
                <Input
                  label="Value Type"
                  value={formData.valueType}
                  onChange={(e) => setFormData({ ...formData, valueType: e.target.value })}
                  placeholder="string, number, boolean"
                  fullWidth
                />
                <Input
                  label="Sort Order"
                  type="number"
                  value={formData.sortOrder.toString()}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value, 10) || 0 })}
                  fullWidth
                />
              </div>

              <div className="pt-2">
                <Toggle
                  checked={formData.isActive}
                  onChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  label="Active Status"
                  disabled={isSystemSetting}
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
    </ProtectedPage>
  );
}
