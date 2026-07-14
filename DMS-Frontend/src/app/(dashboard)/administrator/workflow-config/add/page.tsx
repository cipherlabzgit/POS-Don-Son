'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { ArrowLeft, Plus } from 'lucide-react';
import { workflowConfigsApi, type CreateWorkflowConfigDto } from '@/lib/api/workflow-configs';
import toast from 'react-hot-toast';

export default function AddWorkflowConfigPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    entityType: 'Production',
    workflowType: 'Approval',
    requiresApproval: true,
    approvalLevels: 1,
    autoApproveThreshold: undefined as number | undefined,
    approvalSteps: '',
    notificationSettings: '',
    timeoutHours: 24,
    escalationConfig: '',
    isEnabled: true,
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code || !formData.name) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const createData: CreateWorkflowConfigDto = {
        code: formData.code,
        name: formData.name,
        description: formData.description,
        entityType: formData.entityType,
        workflowType: formData.workflowType,
        requiresApproval: formData.requiresApproval,
        approvalLevels: formData.approvalLevels,
        autoApproveThreshold: formData.autoApproveThreshold,
        approvalSteps: formData.approvalSteps,
        notificationSettings: formData.notificationSettings,
        timeoutHours: formData.timeoutHours,
        escalationConfig: formData.escalationConfig,
        isEnabled: formData.isEnabled,
        isActive: formData.isActive,
      };
      await workflowConfigsApi.create(createData);
      toast.success('Workflow configuration created successfully');
      router.push('/administrator/workflow-config');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create workflow config');
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
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Add Workflow Configuration</h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Create a new workflow configuration and approval process
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workflow Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Workflow Code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., WF001"
                fullWidth
                required
              />
              <Input
                label="Workflow Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Production Approval"
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
                  Entity Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.entityType}
                  onChange={(e) => setFormData({ ...formData, entityType: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ border: '1px solid var(--input)' }}
                >
                  <option value="Production">Production</option>
                  <option value="Delivery">Delivery</option>
                  <option value="Order">Order</option>
                  <option value="Inventory">Inventory</option>
                  <option value="Transfer">Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                  Workflow Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.workflowType}
                  onChange={(e) => setFormData({ ...formData, workflowType: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ border: '1px solid var(--input)' }}
                >
                  <option value="Approval">Approval</option>
                  <option value="Review">Review</option>
                  <option value="Notification">Notification</option>
                  <option value="Sequential">Sequential</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Approval Levels"
                type="number"
                value={formData.approvalLevels.toString()}
                onChange={(e) => setFormData({ ...formData, approvalLevels: parseInt(e.target.value) || 1 })}
                fullWidth
                required
              />
              <Input
                label="Auto Approve Threshold"
                type="number"
                step="0.01"
                value={formData.autoApproveThreshold?.toString() || ''}
                onChange={(e) => setFormData({ ...formData, autoApproveThreshold: e.target.value ? parseFloat(e.target.value) : undefined })}
                fullWidth
              />
              <Input
                label="Timeout (Hours)"
                type="number"
                value={formData.timeoutHours?.toString() || ''}
                onChange={(e) => setFormData({ ...formData, timeoutHours: e.target.value ? parseInt(e.target.value) : 24 })}
                fullWidth
              />
            </div>

            <Input
              label="Approval Steps (JSON)"
              value={formData.approvalSteps}
              onChange={(e) => setFormData({ ...formData, approvalSteps: e.target.value })}
              placeholder='[{"step": 1, "role": "Manager"}]'
              fullWidth
            />

            <Input
              label="Notification Settings (JSON)"
              value={formData.notificationSettings}
              onChange={(e) => setFormData({ ...formData, notificationSettings: e.target.value })}
              placeholder='{"email": true, "sms": false}'
              fullWidth
            />

            <Input
              label="Escalation Config (JSON)"
              value={formData.escalationConfig}
              onChange={(e) => setFormData({ ...formData, escalationConfig: e.target.value })}
              placeholder='{"escalateTo": "Admin", "afterHours": 48}'
              fullWidth
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <Toggle
                checked={formData.requiresApproval}
                onChange={(checked) => setFormData({ ...formData, requiresApproval: checked })}
                label="Requires Approval"
              />
              <Toggle
                checked={formData.isEnabled}
                onChange={(checked) => setFormData({ ...formData, isEnabled: checked })}
                label="Enabled"
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
                    Add Workflow
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
