'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { ArrowLeft, Plus } from 'lucide-react';
import { systemSettingsApi, type CreateSystemSettingDto } from '@/lib/api/system-settings';
import toast from 'react-hot-toast';

export default function AddSystemSettingPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    settingKey: '',
    settingName: '',
    settingValue: '',
    settingType: 'String',
    description: '',
    category: 'General',
    isSystemSetting: false,
    isEncrypted: false,
    displayOrder: 0,
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.settingKey || !formData.settingName) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const createData: CreateSystemSettingDto = {
        settingKey: formData.settingKey,
        settingName: formData.settingName,
        settingValue: formData.settingValue,
        settingType: formData.settingType,
        description: formData.description,
        category: formData.category,
        isSystemSetting: formData.isSystemSetting,
        isEncrypted: formData.isEncrypted,
        displayOrder: formData.displayOrder,
        isActive: formData.isActive,
      };
      await systemSettingsApi.create(createData);
      toast.success('System setting created successfully');
      router.push('/administrator/system-settings');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create setting');
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
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Add System Setting</h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Create a new system configuration setting
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Setting Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Setting Key"
                value={formData.settingKey}
                onChange={(e) => setFormData({ ...formData, settingKey: e.target.value })}
                placeholder="e.g., app.session_timeout"
                fullWidth
                required
              />
              <Input
                label="Setting Name"
                value={formData.settingName}
                onChange={(e) => setFormData({ ...formData, settingName: e.target.value })}
                placeholder="Session Timeout"
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
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                  Setting Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.settingType}
                  onChange={(e) => setFormData({ ...formData, settingType: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ border: '1px solid var(--input)' }}
                >
                  <option value="String">String</option>
                  <option value="Number">Number</option>
                  <option value="Boolean">Boolean</option>
                  <option value="JSON">JSON</option>
                  <option value="Password">Password</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ border: '1px solid var(--input)' }}
                >
                  <option value="General">General</option>
                  <option value="Security">Security</option>
                  <option value="Email">Email</option>
                  <option value="Database">Database</option>
                  <option value="API">API</option>
                </select>
              </div>
            </div>

            <Input
              label="Setting Value"
              value={formData.settingValue}
              onChange={(e) => setFormData({ ...formData, settingValue: e.target.value })}
              placeholder="Setting value"
              fullWidth
            />

            <Input
              label="Display Order"
              type="number"
              value={formData.displayOrder.toString()}
              onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
              fullWidth
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <Toggle
                checked={formData.isSystemSetting}
                onChange={(checked) => setFormData({ ...formData, isSystemSetting: checked })}
                label="System Setting"
              />
              <Toggle
                checked={formData.isEncrypted}
                onChange={(checked) => setFormData({ ...formData, isEncrypted: checked })}
                label="Encrypted"
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
                {submitting ? 'Creating...' : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Setting
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
