'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Settings, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { ProtectedPage, PermissionButton } from '@/components/auth';
import {
  autoApprovalConfigsApi,
  type AutoApprovalConfig,
} from '@/lib/api/auto-approval-configs';
import toast from 'react-hot-toast';

/**
 * Auto-Approval Configuration Page
 * Allows administrators to enable/disable auto-approval for each subsection
 */

function AutoApprovalConfigContent() {
  const [configs, setConfigs] = useState<AutoApprovalConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await autoApprovalConfigsApi.getAll();
      setConfigs(data);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load auto-approval configurations');
      setConfigs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConfigs();
  }, [loadConfigs]);

  const toggleConfig = async (config: AutoApprovalConfig) => {
    setUpdating(config.id);
    try {
      await autoApprovalConfigsApi.update(config.id, !config.isEnabled);
      toast.success(
        `Auto-approval ${!config.isEnabled ? 'enabled' : 'disabled'} for ${config.subsectionName}`
      );
      await loadConfigs();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update configuration');
    } finally {
      setUpdating(null);
    }
  };

  // Group configs by module
  const groupedConfigs = configs.reduce((acc, config) => {
    if (!acc[config.module]) {
      acc[config.module] = [];
    }
    acc[config.module].push(config);
    return acc;
  }, {} as Record<string, AutoApprovalConfig[]>);

  const moduleOrder = ['Production', 'Operation', 'DMS'];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
          <Settings className="w-8 h-8 inline-block mr-3" style={{ color: '#C8102E' }} />
          Auto-Approval Settings
        </h1>
        <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Enable or disable auto-approval for each subsection. When enabled, users with auto-approve
          permission can create entries that are automatically approved and saved directly in
          Approved status.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#C8102E' }} />
        </div>
      ) : (
        <div className="space-y-6">
          {moduleOrder.map((moduleName) => {
            const moduleConfigs = groupedConfigs[moduleName] || [];
            if (moduleConfigs.length === 0) return null;

            return (
              <Card key={moduleName}>
                <CardHeader>
                  <CardTitle>{moduleName} Module</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead style={{ backgroundColor: 'var(--muted)' }}>
                        <tr>
                          <th
                            className="text-left p-3 font-semibold"
                            style={{ color: 'var(--muted-foreground)' }}
                          >
                            Subsection
                          </th>
                          <th
                            className="text-left p-3 font-semibold"
                            style={{ color: 'var(--muted-foreground)' }}
                          >
                            Subsection Code
                          </th>
                          <th
                            className="text-center p-3 font-semibold w-32"
                            style={{ color: 'var(--muted-foreground)' }}
                          >
                            Status
                          </th>
                          <th
                            className="text-center p-3 font-semibold w-32"
                            style={{ color: 'var(--muted-foreground)' }}
                          >
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {moduleConfigs.map((config) => (
                          <tr key={config.id} style={{ borderTop: '1px solid var(--border)' }}>
                            <td className="p-3">
                              <span
                                className="font-medium"
                                style={{ color: 'var(--foreground)' }}
                              >
                                {config.subsectionName}
                              </span>
                            </td>
                            <td className="p-3">
                              <code
                                className="text-xs px-2 py-1 rounded"
                                style={{
                                  backgroundColor: 'var(--muted)',
                                  color: 'var(--muted-foreground)',
                                }}
                              >
                                {config.subsectionCode}
                              </code>
                            </td>
                            <td className="p-3 text-center">
                              {config.isEnabled ? (
                                <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span className="text-xs font-medium">Enabled</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                  <XCircle className="w-4 h-4" />
                                  <span className="text-xs font-medium">Disabled</span>
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <PermissionButton
                                permission="auto-approval-config:edit"
                                variant={config.isEnabled ? 'outline' : 'primary'}
                                size="sm"
                                onClick={() => void toggleConfig(config)}
                                isLoading={updating === config.id}
                                disabled={updating !== null}
                              >
                                {config.isEnabled ? 'Disable' : 'Enable'}
                              </PermissionButton>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {configs.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center" style={{ color: 'var(--muted-foreground)' }}>
                No auto-approval configurations found. Please run the backend migration to seed the
                data.
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export default function AutoApprovalConfigPage() {
  return (
    <ProtectedPage permission="auto-approval-config:view">
      <AutoApprovalConfigContent />
    </ProtectedPage>
  );
}
