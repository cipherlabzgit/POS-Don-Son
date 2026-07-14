'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Modal, ModalFooter } from '@/components/ui/modal';
import Input from '@/components/ui/input';
import { Users, Plus, Search, Edit, X, Key } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { usersApi, type User, type UpdateUserRequest, type CreateUserRequest } from '@/lib/api/users';
import { rolesApi } from '@/lib/api/roles';
import { ProtectedPage } from '@/components/auth';
import { usePermissions } from '@/hooks/usePermissions';
import toast from 'react-hot-toast';
import CsvBulkUploadBar from '@/components/dms/CsvBulkUploadBar';
import type { CsvRowRecord } from '@/lib/csv-utils';
import { parseBool, req } from '@/lib/bulk-csv-field-parsers';

export default function UsersPage() {
  return (
    <ProtectedPage permission="users:read">
      <UsersPageContent />
    </ProtectedPage>
  );
}

function UsersPageContent() {
  const router = useRouter();
  const { canAction } = usePermissions();
  const canCreate = canAction('/administrator/users', 'create');
  const canEditUser = canAction('/administrator/users', 'edit');
  const canDeleteUser = canAction('/administrator/users', 'delete');
  const canBulk = canAction('/administrator/users', 'import') || canCreate;

  const rolesPromise = useRef<Promise<Map<string, string>> | null>(null);
  const ensureRoles = useCallback(async () => {
    if (!rolesPromise.current) {
      rolesPromise.current = (async () => {
        const res = await rolesApi.getAll(1, 500, undefined, undefined);
        return new Map(res.roles.map((r) => [r.name.trim().toLowerCase(), r.id] as const));
      })();
    }
    return rolesPromise.current;
  }, []);

  const mapUserRow = useCallback(
    async (
      row: CsvRowRecord,
      _excelRow: number,
    ): Promise<{ ok: true; value: CreateUserRequest } | { ok: false; error: string }> => {
      try {
        const roles = await ensureRoles();
        const names = req(row, 'roleNames')
          .split(/[;,]/)
          .map((s) => s.trim())
          .filter(Boolean);
        const roleIds: string[] = [];
        for (const n of names) {
          const id = roles.get(n.toLowerCase());
          if (!id) return { ok: false, error: `Unknown role name "${n}"` };
          roleIds.push(id);
        }
        if (!roleIds.length) return { ok: false, error: 'roleNames must list at least one role' };

        const dto: CreateUserRequest = {
          email: req(row, 'email'),
          firstName: req(row, 'firstName'),
          lastName: req(row, 'lastName'),
          phone: row.phone?.trim() || undefined,
          password: req(row, 'password'),
          isActive: parseBool(row, 'isActive', true),
          roleIds,
        };
        return { ok: true, value: dto };
      } catch (e: unknown) {
        return { ok: false, error: e instanceof Error ? e.message : 'Invalid row' };
      }
    },
    [ensureRoles],
  );
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadUsers();
  }, [currentPage, pageSize, searchTerm]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await usersApi.getAll(currentPage, pageSize, searchTerm);
      setUsers(response.users);
      setTotalCount(response.totalCount);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleToggleActive = async (user: User) => {
    try {
      const updateData: UpdateUserRequest = {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        isActive: !user.isActive,
      };
      await usersApi.update(user.id, updateData);
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
      await loadUsers();
    } catch (error) {
      console.error('Failed to toggle user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    if (passwordData.password !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setSubmitting(true);
      await usersApi.resetPassword(selectedUser.id, passwordData.password);
      setShowResetPasswordModal(false);
      setSelectedUser(null);
      setPasswordData({ password: '', confirmPassword: '' });
      toast.success('Password reset successfully');
    } catch (error: any) {
      console.error('Failed to reset password:', error);
      toast.error(error.response?.data?.error?.message || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  const openResetPasswordModal = (user: User) => {
    setSelectedUser(user);
    setPasswordData({ password: '', confirmPassword: '' });
    setShowResetPasswordModal(true);
  };

  const columns = [
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
      label: 'User Roles',
      render: (item: User) => (
        <div className="flex flex-wrap gap-1">
          {item.roles.map(role => (
            <Badge key={role.id} variant="info" size="sm">{role.name}</Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item: User) => (
        <Badge variant={item.isActive ? 'success' : 'danger'} size="sm">
          {item.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (item: User) => (
        <div className="flex items-center justify-end space-x-2">
          {canEditUser && (
            <button
              onClick={() => router.push(`/administrator/users/edit/${item.id}`)}
              className="p-1.5 rounded-full transition-colors"
              style={{ color: '#3B82F6', backgroundColor: '#EFF6FF' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#DBEAFE'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#EFF6FF'}
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          {canEditUser && (
            <button
              onClick={() => openResetPasswordModal(item)}
              className="p-1.5 rounded-full transition-colors"
              style={{ color: '#F59E0B', backgroundColor: '#FEF3C7' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FDE68A'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FEF3C7'}
              title="Reset Password"
            >
              <Key className="w-4 h-4" />
            </button>
          )}
          {canDeleteUser && (
            <button
              onClick={() => handleToggleActive(item)}
              className="p-1.5 rounded-full transition-colors"
              style={{ color: '#DC2626', backgroundColor: '#FEF2F2' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEE2E2'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
              title={item.isActive ? 'Deactivate' : 'Activate'}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            <Users className="w-8 h-8 inline-block mr-3" style={{ color: '#C8102E' }} />
            Users & User Roles
          </h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Manage system users, assign roles and capabilities. Only Admin can create users.
          </p>
        </div>
        {canCreate && (
          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="primary" size="md" onClick={() => router.push('/administrator/users/add')}>
              <Plus className="w-4 h-4 mr-2" />
              Add New
            </Button>
          </div>
        )}
      </div>

      {canBulk && (
        <div className="w-full min-w-0 max-w-full">
          <CsvBulkUploadBar<CreateUserRequest>
            entityLabel="users"
            templateFilename="users-import-template.csv"
            permission={['users:import', 'users:create']}
            permissionMode="any"
            columns={[
              { header: 'email' },
              { header: 'firstName' },
              { header: 'lastName' },
              { header: 'phone' },
              { header: 'password' },
              { header: 'isActive' },
              { header: 'roleNames' },
            ]}
            exampleRows={[['user@example.com', 'Jane', 'Doe', '', 'ChangeMe123!', 'true', 'Admin']]}
            mapRow={mapUserRow}
            importRow={(dto) => usersApi.create(dto)}
            onImportComplete={() => loadUsers()}
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="danger" size="sm">Users</Badge>
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {loading ? 'Loading...' : `Showing ${((currentPage - 1) * pageSize) + 1} to ${Math.min(currentPage * pageSize, totalCount)} of ${totalCount} entries`}
              </span>
            </div>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-lg text-sm"
                style={{ border: '1px solid var(--input)' }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center" style={{ color: 'var(--muted-foreground)' }}>
              Loading users...
            </div>
          ) : (
            <DataTable
              data={users}
              columns={columns}
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Reset Password Modal */}
      <Modal
        isOpen={showResetPasswordModal}
        onClose={() => {
          setShowResetPasswordModal(false);
          setSelectedUser(null);
          setPasswordData({ password: '', confirmPassword: '' });
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
                value={passwordData.password}
                onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                placeholder="••••••••"
                fullWidth
                required
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="••••••••"
                fullWidth
                required
              />
            </div>
          </div>
        )}
        <ModalFooter>
          <Button variant="ghost" onClick={() => {
            setShowResetPasswordModal(false);
            setSelectedUser(null);
            setPasswordData({ password: '', confirmPassword: '' });
          }} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleResetPassword} disabled={submitting}>
            <Key className="w-4 h-4 mr-2" />
            {submitting ? 'Resetting...' : 'Reset Password'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
