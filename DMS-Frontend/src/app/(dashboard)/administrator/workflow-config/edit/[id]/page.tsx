'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { ArrowLeft, Loader2, Save, Users, Bell, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { workflowConfigsApi, type UpdateWorkflowConfigDto } from '@/lib/api/workflow-configs';
import { rolesApi, type Role } from '@/lib/api/roles';
import toast from 'react-hot-toast';

const WORKFLOW_TYPES = [
  { value: 'Approval', label: 'Approval' },
  { value: 'Review', label: 'Review' },
  { value: 'Notification', label: 'Notification' },
  { value: 'Sequential', label: 'Sequential' },
];

const ENTITY_TYPES = [
  { value: 'Production', label: 'Production' },
  { value: 'Delivery', label: 'Delivery' },
  { value: 'Disposal', label: 'Disposal' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Inventory', label: 'Inventory' },
  { value: 'Label', label: 'Label' },
  { value: 'Pricing', label: 'Pricing' },
  { value: 'DayEnd', label: 'DayEnd' },
  { value: 'Other', label: 'Other' },
];

interface ApprovalStep {
  level: number;
  roles: string[];
}

interface NotificationSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
}

interface EscalationConfig {
  escalateTo: string;
  afterHours: number;
}

function parseJsonSafe<T>(json: string, fallback: T): T {
  if (!json) return fallback;
  try { return JSON.parse(json) as T; } catch { return fallback; }
}

export default function EditWorkflowConfigPage() {
  const router = useRouter();
  const params = useParams();
  const configId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);

  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
    entityType: 'Production',
    workflowType: 'Approval',
    requiresApproval: true,
    approvalLevels: 1,
    autoApproveThreshold: '',
    timeoutHours: '',
    isEnabled: true,
    isActive: true,
  });

  const [approvalSteps, setApprovalSteps] = useState<ApprovalStep[]>([{ level: 1, roles: [] }]);
  const [notifications, setNotifications] = useState<NotificationSettings>({ email: true, sms: false, push: false });
  const [escalation, setEscalation] = useState<EscalationConfig>({ escalateTo: '', afterHours: 48 });

  const set = (k: keyof typeof form, v: string | boolean | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cfg, rolesResp] = await Promise.all([
        workflowConfigsApi.getById(configId),
        rolesApi.getAll(1, 100, undefined, true),
      ]);

      setRoles(rolesResp.roles);

      const levels = cfg.approvalLevels ?? 1;
      const parsedSteps = parseJsonSafe<ApprovalStep[]>(cfg.approvalSteps ?? '', []);
      const syncedSteps: ApprovalStep[] = Array.from({ length: levels }, (_, i) => {
        const existing = parsedSteps.find((s) => s.level === i + 1);
        return existing ?? { level: i + 1, roles: [] };
      });

      setApprovalSteps(syncedSteps);
      setNotifications(parseJsonSafe<NotificationSettings>(cfg.notificationSettings ?? '', { email: true, sms: false, push: false }));
      setEscalation(parseJsonSafe<EscalationConfig>(cfg.escalationConfig ?? '', { escalateTo: '', afterHours: 48 }));

      setForm({
        code: cfg.code,
        name: cfg.name,
        description: cfg.description ?? '',
        entityType: cfg.entityType,
        workflowType: cfg.workflowType,
        requiresApproval: cfg.requiresApproval,
        approvalLevels: levels,
        autoApproveThreshold: cfg.autoApproveThreshold?.toString() ?? '',
        timeoutHours: cfg.timeoutHours?.toString() ?? '',
        isEnabled: cfg.isEnabled,
        isActive: cfg.isActive,
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load workflow configuration.');
      router.push('/administrator/workflow-config');
    } finally {
      setLoading(false);
    }
  }, [configId, router]);

  useEffect(() => { void load(); }, [load]);

  // When approval levels changes, sync the steps array
  const handleApprovalLevelsChange = (newLevels: number) => {
    const n = Math.max(1, Math.min(5, newLevels));
    set('approvalLevels', n);
    setApprovalSteps((prev) =>
      Array.from({ length: n }, (_, i) => prev[i] ?? { level: i + 1, roles: [] })
    );
  };

  const toggleRoleInStep = (stepIndex: number, roleName: string) => {
    setApprovalSteps((prev) =>
      prev.map((step, i) => {
        if (i !== stepIndex) return step;
        const has = step.roles.includes(roleName);
        return { ...step, roles: has ? step.roles.filter((r) => r !== roleName) : [...step.roles, roleName] };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const dto: UpdateWorkflowConfigDto = {
        code: form.code,
        name: form.name,
        description: form.description || undefined,
        entityType: form.entityType,
        workflowType: form.workflowType,
        requiresApproval: form.requiresApproval,
        approvalLevels: Number(form.approvalLevels) || 1,
        autoApproveThreshold: form.autoApproveThreshold ? Number(form.autoApproveThreshold) : undefined,
        approvalSteps: approvalSteps.some((s) => s.roles.length > 0) ? JSON.stringify(approvalSteps) : undefined,
        notificationSettings: JSON.stringify(notifications),
        timeoutHours: form.timeoutHours ? Number(form.timeoutHours) : undefined,
        escalationConfig: escalation.escalateTo ? JSON.stringify(escalation) : undefined,
        isEnabled: form.isEnabled,
        isActive: form.isActive,
      };
      await workflowConfigsApi.update(configId, dto);
      toast.success('Workflow configuration updated successfully.');
      router.push('/administrator/workflow-config');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to update workflow configuration.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#C8102E' }} />
      </div>
    );
  }

  const roleOptions = [{ value: '', label: '— Select role —' }, ...roles.map((r) => ({ value: r.name, label: r.name }))];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            Configure: {form.name}
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Set up user groups and approval rules for this operation.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Operation Details */}
        <Card>
          <CardHeader>
            <CardTitle>Operation Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Operation Name *"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                fullWidth
                required
              />
              <Input
                label="Code"
                value={form.code}
                onChange={(e) => set('code', e.target.value)}
                fullWidth
                required
              />
            </div>
            <Input
              label="Description"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Optional description"
              fullWidth
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Entity Type *"
                value={form.entityType}
                onChange={(e) => set('entityType', e.target.value)}
                options={ENTITY_TYPES}
                fullWidth
              />
              <Select
                label="Workflow Type *"
                value={form.workflowType}
                onChange={(e) => set('workflowType', e.target.value)}
                options={WORKFLOW_TYPES}
                fullWidth
              />
            </div>
          </CardContent>
        </Card>

        {/* Approval & User Group Setup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" style={{ color: '#C8102E' }} />
              Approval &amp; User Group Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Approval Levels"
                type="number"
                value={String(form.approvalLevels)}
                onChange={(e) => handleApprovalLevelsChange(Number(e.target.value))}
                min="1"
                max="5"
                fullWidth
                helperText="Number of approval steps (max 5)"
              />
              <Input
                label="Auto-Approve Threshold (optional)"
                type="number"
                step="0.01"
                value={form.autoApproveThreshold}
                onChange={(e) => set('autoApproveThreshold', e.target.value)}
                placeholder="e.g. 10000"
                fullWidth
                helperText="Auto-approve if total is below this amount"
              />
              <Input
                label="Timeout per Step (hours)"
                type="number"
                value={form.timeoutHours}
                onChange={(e) => set('timeoutHours', e.target.value)}
                placeholder="e.g. 24"
                fullWidth
                helperText="How long before a step escalates"
              />
            </div>

            {/* Per-level role assignment */}
            <div className="space-y-3">
              <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                Approval User Groups
              </p>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Select which roles can approve at each step. Multiple roles mean any one of them can approve.
              </p>
              {approvalSteps.map((step, idx) => (
                <div
                  key={step.level}
                  className="rounded-lg p-4 space-y-3"
                  style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}
                >
                  <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                    Level {step.level} Approvers
                  </p>
                  {roles.length === 0 ? (
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>No active roles found.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {roles.map((role) => {
                        const selected = step.roles.includes(role.name);
                        return (
                          <button
                            key={role.id}
                            type="button"
                            onClick={() => toggleRoleInStep(idx, role.name)}
                            className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                            style={
                              selected
                                ? { backgroundColor: '#C8102E', color: '#fff', border: '1px solid #C8102E' }
                                : { backgroundColor: 'var(--background)', color: 'var(--foreground)', border: '1px solid var(--border)' }
                            }
                          >
                            {role.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {step.roles.length > 0 && (
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      Selected: {step.roles.join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notifications & Escalation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" style={{ color: '#C8102E' }} />
              Notifications &amp; Escalation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Notification toggles */}
            <div>
              <p className="text-sm font-medium mb-3" style={{ color: 'var(--foreground)' }}>
                Notification Channels
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Toggle
                  checked={notifications.email}
                  onChange={(v) => setNotifications((n) => ({ ...n, email: v }))}
                  label="Email Notifications"
                />
                <Toggle
                  checked={notifications.sms}
                  onChange={(v) => setNotifications((n) => ({ ...n, sms: v }))}
                  label="SMS Notifications"
                />
                <Toggle
                  checked={notifications.push}
                  onChange={(v) => setNotifications((n) => ({ ...n, push: v }))}
                  label="Push Notifications"
                />
              </div>
            </div>

            {/* Escalation config */}
            <div
              className="rounded-lg p-4 space-y-4"
              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" style={{ color: '#C8102E' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  Escalation Rules
                </p>
              </div>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                If an approval step is not acted upon within the timeout, escalate to the selected role.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                    Escalate To (Role)
                  </label>
                  <select
                    value={escalation.escalateTo}
                    onChange={(e) => setEscalation((ec) => ({ ...ec, escalateTo: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg"
                    style={{
                      border: '1px solid var(--input)',
                      backgroundColor: 'var(--background)',
                      color: 'var(--foreground)',
                      height: '38px',
                    }}
                  >
                    <option value="">— No escalation —</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                    Leave blank to disable escalation
                  </p>
                </div>
                <Input
                  label="Escalate After (hours)"
                  type="number"
                  value={String(escalation.afterHours)}
                  onChange={(e) => setEscalation((ec) => ({ ...ec, afterHours: Number(e.target.value) || 48 }))}
                  placeholder="e.g. 48"
                  fullWidth
                  helperText="Hours before escalation is triggered"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status toggles */}
        <Card>
          <CardHeader><CardTitle>Status</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Toggle
                checked={form.requiresApproval}
                onChange={(v) => set('requiresApproval', v)}
                label="Requires Approval"
              />
              <Toggle
                checked={form.isEnabled}
                onChange={(v) => set('isEnabled', v)}
                label="Workflow Enabled"
              />
              <Toggle
                checked={form.isActive}
                onChange={(v) => set('isActive', v)}
                label="Active"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => router.back()} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Configuration
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
