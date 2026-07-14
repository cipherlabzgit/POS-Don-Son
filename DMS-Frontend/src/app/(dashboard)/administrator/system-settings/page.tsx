'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { Settings, Edit, Loader2 } from 'lucide-react';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { ProtectedPage, PermissionButton } from '@/components/auth';
import {
  systemSettingsApi,
  getSystemSettingsErrorMessage,
  type SystemSetting,
} from '@/lib/api/system-settings';
import toast from 'react-hot-toast';

/**
 * Administrator system flags — loaded from `/api/system-settings` (category Administrator).
 * Value updates use `PUT /api/system-settings/key/{settingKey}`.
 */

function SystemSettingsContent() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<SystemSetting | null>(null);
  const [draftValue, setDraftValue] = useState<string>('0');
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await systemSettingsApi.getAll(1, 100, 'Administrator', undefined, true);
      const sorted = [...res.settings].sort((a, b) => a.displayOrder - b.displayOrder);
      setSettings(sorted);
    } catch (e) {
      toast.error(getSystemSettingsErrorMessage(e));
      setSettings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const openEdit = (s: SystemSetting) => {
    setEditing(s);
    const v = (s.settingValue ?? '0').trim();
    setDraftValue(v === '1' ? '1' : '0');
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditing(null);
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await systemSettingsApi.updateValueByKey(editing.settingKey, draftValue);
      toast.success('Setting updated.');
      closeEdit();
      await loadSettings();
    } catch (e) {
      toast.error(getSystemSettingsErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
          <Settings className="w-8 h-8 inline-block mr-3" style={{ color: '#C8102E' }} />
          System Settings
        </h1>
        <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Configure date-range and administration flags. Values use 0 or 1 as described in each row.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#C8102E' }} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ backgroundColor: 'var(--muted)' }}>
                  <tr>
                    <th className="text-left p-3 font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                      Name
                    </th>
                    <th className="text-left p-3 font-semibold w-24" style={{ color: 'var(--muted-foreground)' }}>
                      Value
                    </th>
                    <th className="text-left p-3 font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                      Description
                    </th>
                    <th className="text-center p-3 font-semibold w-20" style={{ color: 'var(--muted-foreground)' }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {settings.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center" style={{ color: 'var(--muted-foreground)' }}>
                        No administrator settings found. Run the API so bootstrap seeding can create defaults.
                      </td>
                    </tr>
                  ) : (
                    settings.map((s) => (
                      <tr key={s.id} style={{ borderTop: '1px solid var(--border)' }}>
                        <td className="p-3 align-top">
                          <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                            {s.settingName}
                          </span>
                        </td>
                        <td className="p-3 align-top font-mono">{s.isEncrypted ? '********' : s.settingValue ?? '—'}</td>
                        <td className="p-3 align-top" style={{ color: 'var(--muted-foreground)' }}>
                          {s.description ?? '—'}
                        </td>
                        <td className="p-3 text-center align-top">
                          <PermissionButton
                            permission="setting:edit"
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(s)}
                            className="!p-2"
                            title="Edit value"
                          >
                            <Edit className="w-4 h-4" style={{ color: 'var(--page-color, #2563EB)' }} />
                          </PermissionButton>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={editOpen} onClose={closeEdit} title={editing ? `Edit: ${editing.settingName}` : 'Edit'} size="sm">
        {editing && (
          <>
            <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
              {editing.description}
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                Value
              </label>
              {editing.settingType?.toLowerCase() === 'number' ? (
                <select
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={{
                    border: '1px solid var(--input)',
                    backgroundColor: 'var(--background)',
                    color: 'var(--foreground)',
                  }}
                  value={draftValue}
                  onChange={(e) => setDraftValue(e.target.value)}
                >
                  <option value="0">0</option>
                  <option value="1">1</option>
                </select>
              ) : (
                <input
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={{
                    border: '1px solid var(--input)',
                    backgroundColor: 'var(--background)',
                    color: 'var(--foreground)',
                  }}
                  value={draftValue}
                  onChange={(e) => setDraftValue(e.target.value)}
                />
              )}
            </div>
            <ModalFooter>
              <Button variant="outline" size="md" onClick={closeEdit} disabled={saving}>
                Cancel
              </Button>
              <Button variant="primary" size="md" onClick={() => void saveEdit()} isLoading={saving}>
                Save
              </Button>
            </ModalFooter>
          </>
        )}
      </Modal>
    </div>
  );
}

export default function SystemSettingsPage() {
  return (
    <ProtectedPage permission="setting:view">
      <SystemSettingsContent />
    </ProtectedPage>
  );
}
