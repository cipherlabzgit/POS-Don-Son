'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { ArrowLeft, Save } from 'lucide-react';
import { usersApi, type UpdateUserRequest, type User } from '@/lib/api/users';
import { rolesApi, type Role } from '@/lib/api/roles';
import toast from 'react-hot-toast';

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    roleIds: [] as string[],
    phone: '',
    isActive: true,
  });

  useEffect(() => {
    loadRoles();
    loadUser();
  }, [userId]);

  const loadRoles = async () => {
    try {
      const response = await rolesApi.getAll(1, 100, '', true);
      setRoles(response.roles);
    } catch (error) {
      console.error('Failed to load roles:', error);
    }
  };

  const loadUser = async () => {
    try {
      setLoading(true);
      const user = await usersApi.getById(userId);
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        roleIds: user.roles.map(r => r.id),
        phone: user.phone || '',
        isActive: user.isActive,
      });
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to load user';
      toast.error(errorMsg);
      router.push('/administrator/users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      const updateData: UpdateUserRequest = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        isActive: formData.isActive,
      };
      await usersApi.update(userId, updateData);
      
      // Update roles if changed
      if (formData.roleIds.length > 0) {
        await usersApi.assignRoles(userId, formData.roleIds);
      }

      toast.success('User updated successfully');
      router.push('/administrator/users');
    } catch (error: any) {
      const errorMsg = error.response?.data?.error?.message || 'Failed to update user';
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
          <p style={{ color: 'var(--muted-foreground)' }}>Loading user...</p>
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
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Edit User</h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Update user information and roles
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="John"
                fullWidth
                required
              />
              <Input
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Doe"
                fullWidth
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@donandson.com"
                fullWidth
                required
              />
              <Input
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="077-1234567"
                fullWidth
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Roles
              </label>
              <div className="space-y-2">
                {roles.map(role => (
                  <label key={role.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.roleIds.includes(role.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, roleIds: [...formData.roleIds, role.id] });
                        } else {
                          setFormData({ ...formData, roleIds: formData.roleIds.filter(id => id !== role.id) });
                        }
                      }}
                      className="rounded"
                    />
                    <span>{role.name}</span>
                  </label>
                ))}
              </div>
            </div>

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
