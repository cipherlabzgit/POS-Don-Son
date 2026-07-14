'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Modal, ModalFooter } from '@/components/ui/modal';
import Input from '@/components/ui/input';
import { Shield, Plus, Search, Edit, X, Key, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ProtectedPage } from '@/components/auth';
import { PermissionsManager } from '@/components/administrator/permissions-manager';
import { usersApi, type User, type UpdateUserRequest } from '@/lib/api/users';

type TabType = 'users' | 'permissions';

export default function SecurityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab: TabType = searchParams?.get('tab') === 'permissions' ? 'permissions' : 'users';

  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersTotalCount, setUsersTotalCount] = useState(0);
  const [usersSearchTerm, setUsersSearchTerm] = useState('');
  const [usersCurrentPage, setUsersCurrentPage] = useState(1);
  const [usersPageSize, setUsersPageSize] = useState(10);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userSubmitting, setUserSubmitting] = useState(false);
  const [resetPasswordData, setResetPasswordData] = useState({
    password: '',
    confirmPassword: '',
  });

  const loadUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const response = await usersApi.getAll(usersCurrentPage, usersPageSize, usersSearchTerm);
      setUsers(response.users);
      setUsersTotalCount(response.totalCount);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setUsersLoading(false);
    }
  }, [usersCurrentPage, usersPageSize, usersSearchTerm]);

  useEffect(() => {
    if (activeTab === 'users') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch users list on tab/pagination
      void loadUsers();
    }
  }, [activeTab, loadUsers]);

  const handleTabChange = (tab: TabType) => {
    router.push(`/administrator/security?tab=${tab}`, { scroll: false });
  };

  const handleToggleUserActive = async (user: User) => {
    try {
      const updateData: UpdateUserRequest = {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        isActive: !user.isActive,
      };
      await usersApi.update(user.id, updateData);
      await loadUsers();
    } catch (error) {
      console.error('Failed to toggle user status:', error);
      alert('Failed to update user status');
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    if (resetPasswordData.password !== resetPasswordData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      setUserSubmitting(true);
      await usersApi.resetPassword(selectedUser.id, resetPasswordData.password);
      setShowResetPasswordModal(false);
      setSelectedUser(null);
      setResetPasswordData({ password: '', confirmPassword: '' });
      alert('Password reset successfully');
    } catch (error: unknown) {
      console.error('Failed to reset password:', error);
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      alert(err.response?.data?.error?.message || 'Failed to reset password');
    } finally {
      setUserSubmitting(false);
    }
  };

  const openResetPasswordModal = (user: User) => {
    setSelectedUser(user);
    setResetPasswordData({ password: '', confirmPassword: '' });
    setShowResetPasswordModal(true);
  };

  const usersColumns = [
    {
      key: 'fullName',
      label: 'User Name',
      render: (item: User) => (
        <div>
          <div className="font-medium" style={{ color: 'var(--foreground)' }}>
            <Users className="w-4 h-4 inline-block mr-2" style={{ color: 'var(--muted-foreground)' }} />
            {item.fullName}
          </div>
          <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{item.email}</div>
        </div>
      ),
    },
    {
      key: 'roles',
      label: 'User Role',
      render: (item: User) => (
        <div className="flex flex-wrap gap-1">
          {item.roles.map((role) => (
            <Badge key={role.id} variant="info" size="sm">{role.name}</Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (item: User) => (
        <div className="flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={() => router.push(`/administrator/users/edit/${item.id}`)}
            className="p-1.5 rounded-full transition-colors"
            style={{ color: 'var(--muted-foreground)', backgroundColor: 'var(--muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#E5E7EB'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F3F4F6'; }}
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => openResetPasswordModal(item)}
            className="p-1.5 rounded-full transition-colors"
            style={{ color: 'var(--muted-foreground)', backgroundColor: 'var(--muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#E5E7EB'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F3F4F6'; }}
            title="Reset Password"
          >
            <Key className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleToggleUserActive(item)}
            className="p-1.5 rounded-full transition-colors"
            style={{ color: 'var(--muted-foreground)', backgroundColor: 'var(--muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#E5E7EB'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F3F4F6'; }}
            title={item.isActive ? 'Deactivate' : 'Activate'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const usersTotalPages = Math.ceil(usersTotalCount / usersPageSize);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            <Shield className="w-8 h-8 inline-block mr-3" style={{ color: '#C8102E' }} />
            Users & User Roles
          </h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            {activeTab === 'users'
              ? 'Manage system users, assign roles and capabilities. Only Admin can create users.'
              : 'Pick a role, then configure which menus and actions it may use. Create new roles as needed.'}
          </p>
        </div>
        {activeTab === 'users' && (
          <Button variant="primary" size="md" onClick={() => router.push('/administrator/users/add')}>
            <Plus className="w-4 h-4 mr-2" />
            Add New
          </Button>
        )}
        {activeTab === 'permissions' && (
          <Button variant="primary" size="md" onClick={() => router.push('/administrator/roles/add')}>
            <Plus className="w-4 h-4 mr-2" />
            Add role
          </Button>
        )}
      </div>

      <div className="flex gap-2" style={{ borderBottom: '2px solid var(--border)' }}>
        <button
          type="button"
          onClick={() => handleTabChange('users')}
          className="px-4 py-2 font-medium transition-colors"
          style={{
            color: activeTab === 'users' ? '#C8102E' : 'var(--muted-foreground)',
            borderBottom: activeTab === 'users' ? '2px solid #C8102E' : 'none',
            marginBottom: '-2px',
          }}
        >
          <Users className="w-4 h-4 inline-block mr-2" />
          User accounts
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('permissions')}
          className="px-4 py-2 font-medium transition-colors"
          style={{
            color: activeTab === 'permissions' ? '#C8102E' : 'var(--muted-foreground)',
            borderBottom: activeTab === 'permissions' ? '2px solid #C8102E' : 'none',
            marginBottom: '-2px',
          }}
        >
          <Shield className="w-4 h-4 inline-block mr-2" />
          Roles & permissions
        </button>
      </div>

      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  {usersLoading
                    ? 'Loading...'
                    : `Showing ${((usersCurrentPage - 1) * usersPageSize) + 1} to ${Math.min(usersCurrentPage * usersPageSize, usersTotalCount)} of ${usersTotalCount} entries`}
                </span>
              </div>
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                <input
                  type="text"
                  placeholder="Search..."
                  value={usersSearchTerm}
                  onChange={(e) => {
                    setUsersSearchTerm(e.target.value);
                    setUsersCurrentPage(1);
                  }}
                  className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-lg text-sm"
                  style={{ border: '1px solid var(--input)' }}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {usersLoading ? (
              <div className="p-8 text-center" style={{ color: 'var(--muted-foreground)' }}>
                Loading users...
              </div>
            ) : (
              <DataTable
                data={users}
                columns={usersColumns}
                currentPage={usersCurrentPage}
                totalPages={usersTotalPages}
                pageSize={usersPageSize}
                onPageChange={setUsersCurrentPage}
                onPageSizeChange={(size) => {
                  setUsersPageSize(size);
                  setUsersCurrentPage(1);
                }}
              />
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'permissions' && (
        <ProtectedPage permission="permissions:read">
          <PermissionsManager embedded />
        </ProtectedPage>
      )}

      <Modal
        isOpen={showResetPasswordModal}
        onClose={() => {
          setShowResetPasswordModal(false);
          setSelectedUser(null);
          setResetPasswordData({ password: '', confirmPassword: '' });
        }}
        title="Reset Password"
        size="md"
      >
        {selectedUser && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Reset password for <strong>{selectedUser.fullName}</strong> ({selectedUser.email})
            </p>
            <div className="grid grid-cols-1 gap-4">
              <Input
                label="New Password"
                type="password"
                value={resetPasswordData.password}
                onChange={(e) => setResetPasswordData({ ...resetPasswordData, password: e.target.value })}
                placeholder="••••••••"
                fullWidth
                required
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={resetPasswordData.confirmPassword}
                onChange={(e) => setResetPasswordData({ ...resetPasswordData, confirmPassword: e.target.value })}
                placeholder="••••••••"
                fullWidth
                required
              />
            </div>
          </div>
        )}
        <ModalFooter>
          <Button
            variant="ghost"
            onClick={() => {
              setShowResetPasswordModal(false);
              setSelectedUser(null);
              setResetPasswordData({ password: '', confirmPassword: '' });
            }}
            disabled={userSubmitting}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={handleResetPassword} disabled={userSubmitting}>
            <Key className="w-4 h-4 mr-2" />
            {userSubmitting ? 'Resetting...' : 'Reset Password'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
