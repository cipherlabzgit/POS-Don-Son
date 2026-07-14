'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { ArrowLeft, Save } from 'lucide-react';
import { rolesApi, type UpdateRoleRequest } from '@/lib/api/roles';
import { permissionsApi, type Permission } from '@/lib/api/permissions';
import PermissionsSelector from '@/components/roles/PermissionsSelector';
import toast from 'react-hot-toast';

export default function EditRolePage() {
  const router = useRouter();
  const params = useParams();
  const roleId = params.id as string;
  
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    permissionIds: [] as string[],
  });

  useEffect(() => {
    loadPermissions();
    loadRole();
  }, [roleId]);

  const loadPermissions = async () => {
    try {
      const perms = await permissionsApi.getAll(true);
      setPermissions(perms);
    } catch (error) {
      console.error('Failed to load permissions:', error);
    }
  };

  const loadRole = async () => {
    try {
      setLoading(true);
      const role = await rolesApi.getById(roleId);
      setFormData({
        name: role.name,
        description: role.description,
        isActive: role.isActive,
        permissionIds: role.permissions?.map(p => p.id) || [],
      });
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to load role';
      toast.error(errorMsg);
      router.push('/administrator/roles');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      const updateData: UpdateRoleRequest = {
        name: formData.name,
        description: formData.description,
        isActive: formData.isActive,
      };
      await rolesApi.update(roleId, updateData);

      if (formData.permissionIds.length > 0) {
        await rolesApi.assignPermissions(roleId, formData.permissionIds);
      }

      toast.success('Role updated successfully');
      router.push('/administrator/roles');
    } catch (error: any) {
      const errorMsg = error.response?.data?.error?.message || 'Failed to update role';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p style={{ color: 'var(--muted-foreground)' }}>Loading role...</p>
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
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Edit Role</h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Update role information and permissions
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Role Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Role Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Sales Manager"
                fullWidth
                required
              />
              <div className="flex items-end">
                <Toggle
                  checked={formData.isActive}
                  onChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  label="Active"
                />
              </div>
            </div>

            <Input
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of role"
              fullWidth
            />
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <PermissionsSelector
              permissions={permissions}
              selectedIds={formData.permissionIds}
              onChange={(selectedIds) => setFormData({ ...formData, permissionIds: selectedIds })}
            />

            <div className="flex justify-end gap-3 pt-6 border-t mt-6">
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
