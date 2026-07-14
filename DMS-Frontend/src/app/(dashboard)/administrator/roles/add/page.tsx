'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { ArrowLeft, Save, Info } from 'lucide-react';
import { rolesApi, type CreateRoleRequest } from '@/lib/api/roles';
import { permissionsApi, type Permission } from '@/lib/api/permissions';
import AdvancedPermissionsSelector from '@/components/roles/AdvancedPermissionsSelector';
import toast from 'react-hot-toast';

export default function AddRolePage() {
  const router = useRouter();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    permissionIds: [] as string[],
  });

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      const perms = await permissionsApi.getAll(true);
      setPermissions(perms);
    } catch (error) {
      console.error('Failed to load permissions:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      const createData: CreateRoleRequest = {
        name: formData.name,
        description: formData.description,
        isActive: formData.isActive,
        permissionIds: formData.permissionIds,
      };
      await rolesApi.create(createData);
      toast.success('Role created successfully');
      router.push('/administrator/roles');
    } catch (error: any) {
      const errorMsg = error.response?.data?.error?.message || 'Failed to create role';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Add New Role</h1>
            <p className="mt-1 text-gray-500">
              Create a new security role and assign granular permissions
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={submitting}
        >
          Cancel
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1">
          <Card className="sticky top-6 border-none shadow-sm bg-gray-50/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="w-4 h-4 text-red-600" />
                Role Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  label="Role Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Sales Manager"
                  fullWidth
                  required
                  className="bg-white border-gray-200"
                />
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of role responsibilities..."
                    className="w-full p-3 bg-white border border-gray-200 rounded-lg text-sm min-h-[100px] focus:ring-2 focus:ring-red-500 outline-none transition-all"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900">Role Status</span>
                    <span className="text-xs text-gray-500">Enable or disable this role globally</span>
                  </div>
                  <Toggle
                    checked={formData.isActive}
                    onChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting}
                  className="w-full bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200"
                >
                  {submitting ? 'Saving...' : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Role
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-2">
          <AdvancedPermissionsSelector
            permissions={permissions}
            selectedIds={formData.permissionIds}
            onChange={(selectedIds) => setFormData({ ...formData, permissionIds: selectedIds })}
          />
        </div>
      </div>
    </div>
  );
}
