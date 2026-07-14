'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Shield, Plus, Search, Edit, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { rolesApi, type Role, type UpdateRoleRequest } from '@/lib/api/roles';
import { ProtectedPage } from '@/components/auth';
import { usePermissions } from '@/hooks/usePermissions';
import toast from 'react-hot-toast';

export default function RolesPage() {
  return (
    <ProtectedPage permission="roles:read">
      <RolesPageContent />
    </ProtectedPage>
  );
}

function RolesPageContent() {
  const router = useRouter();
  const { canAction } = usePermissions();
  const canCreate = canAction('/administrator/roles', 'create');
  const canEditRole = canAction('/administrator/roles', 'edit');
  const canDeleteRole = canAction('/administrator/roles', 'delete');
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    loadRoles();
  }, [currentPage, pageSize, searchTerm]);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await rolesApi.getAll(currentPage, pageSize, searchTerm);
      setRoles(response.roles);
      setTotalCount(response.totalCount);
    } catch (error) {
      console.error('Failed to load roles:', error);
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleToggleActive = async (role: Role) => {
    try {
      const updateData: UpdateRoleRequest = {
        name: role.name,
        description: role.description,
        isActive: !role.isActive,
      };
      await rolesApi.update(role.id, updateData);
      toast.success(`Role ${role.isActive ? 'deactivated' : 'activated'} successfully`);
      await loadRoles();
    } catch (error: any) {
      console.error('Failed to toggle role status:', error);
      toast.error(error.response?.data?.error?.message || 'Failed to update role status');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Role Name',
      render: (item: Role) => (
        <div>
          <div className="font-medium" style={{ color: 'var(--foreground)' }}>
            <Shield className="w-4 h-4 inline-block mr-2" style={{ color: 'var(--muted-foreground)' }} />
            {item.name}
          </div>
          <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{item.description}</div>
        </div>
      ),
    },
    {
      key: 'permissions',
      label: 'Permissions',
      render: (item: Role) => (
        <Badge variant="info" size="sm">{item.permissionCount || 0} permissions</Badge>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item: Role) => (
        <Badge variant={item.isActive ? 'success' : 'danger'} size="sm">
          {item.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (item: Role) => (
        <div className="flex items-center justify-end space-x-2">
          {canEditRole && (
            <button
              onClick={() => router.push(`/administrator/roles/edit/${item.id}`)}
              className="p-1.5 rounded-full transition-colors"
              style={{ color: '#3B82F6', backgroundColor: '#EFF6FF' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#DBEAFE'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#EFF6FF'}
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          {canDeleteRole && (
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
            <Shield className="w-8 h-8 inline-block mr-3" style={{ color: '#C8102E' }} />
            Roles & Capabilities
          </h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Manage user roles, capabilities and permission groups. Only Admin can create and assign.
          </p>
        </div>
        {canCreate && (
          <Button variant="primary" size="md" onClick={() => router.push('/administrator/roles/add')}>
            <Plus className="w-4 h-4 mr-2" />
            Add New
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="danger" size="sm">Roles and Capabilities</Badge>
            </div>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
              <input
                type="text"
                placeholder="Search roles..."
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
              Loading roles...
            </div>
          ) : (
            <DataTable
              data={roles}
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
    </div>
  );
}
