'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Settings, Plus, Search, Edit, X, Check, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { gridConfigurationsApi, type GridConfiguration, type UpdateGridConfigurationDto } from '@/lib/api/grid-configurations';
import toast from 'react-hot-toast';

export default function GridConfigurationPage() {
  const router = useRouter();
  const [configurations, setConfigurations] = useState<GridConfiguration[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfigurations();
  }, [currentPage, pageSize, searchTerm]);

  const loadConfigurations = async () => {
    try {
      setLoading(true);
      const response = await gridConfigurationsApi.getAll(currentPage, pageSize, searchTerm, undefined, undefined);
      setConfigurations(response.gridConfigurations);
      setTotalCount(response.totalCount);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load grid configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (config: GridConfiguration) => {
    try {
      const updateData: UpdateGridConfigurationDto = {
        gridName: config.gridName,
        userId: config.userId,
        configurationName: config.configurationName,
        columnSettings: config.columnSettings,
        sortSettings: config.sortSettings,
        filterSettings: config.filterSettings,
        pageSize: config.pageSize,
        isDefault: config.isDefault,
        isShared: config.isShared,
        isActive: !config.isActive,
      };
      await gridConfigurationsApi.update(config.id, updateData);
      toast.success(`Configuration ${config.isActive ? 'deactivated' : 'activated'}`);
      loadConfigurations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update configuration');
    }
  };

  const columns = [
    {
      key: 'gridName',
      label: 'Grid Name',
      render: (item: GridConfiguration) => (
        <span className="font-mono font-semibold" style={{ color: '#C8102E' }}>
          {item.gridName}
        </span>
      ),
    },
    {
      key: 'configurationName',
      label: 'Configuration Name',
      render: (item: GridConfiguration) => (
        <span className="font-medium">{item.configurationName || '-'}</span>
      ),
    },
    {
      key: 'pageSize',
      label: 'Page Size',
      render: (item: GridConfiguration) => (
        <Badge variant="neutral" size="sm">{item.pageSize || 50}</Badge>
      ),
    },
    {
      key: 'userId',
      label: 'User Specific',
      render: (item: GridConfiguration) => (
        item.userId ? <Badge variant="info" size="sm">User</Badge> : <Badge variant="neutral" size="sm">Global</Badge>
      ),
    },
    {
      key: 'isDefault',
      label: 'Default',
      render: (item: GridConfiguration) => (
        item.isDefault ? <Badge variant="info" size="sm">Default</Badge> : null
      ),
    },
    {
      key: 'isShared',
      label: 'Shared',
      render: (item: GridConfiguration) => (
        item.isShared ? <Badge variant="success" size="sm">Shared</Badge> : null
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (item: GridConfiguration) => (
        item.isActive ? (
          <Badge variant="success" size="sm">Active</Badge>
        ) : (
          <Badge variant="danger" size="sm">Inactive</Badge>
        )
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: GridConfiguration) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => router.push(`/administrator/grid-configuration/edit/${item.id}`)}
            className="p-1.5 rounded transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleToggleActive(item)}
            className="p-1.5 rounded transition-colors"
            style={{ color: item.isActive ? '#DC2626' : '#10B981' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = item.isActive ? '#FEF2F2' : '#F0FDF4'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title={item.isActive ? 'Deactivate' : 'Activate'}
          >
            {item.isActive ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
          </button>
        </div>
      ),
    },
  ];

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            <Settings className="w-8 h-8 inline-block mr-3" style={{ color: '#C8102E' }} />
            Grid Configuration
          </h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Manage saved grid configurations, views, and preferences ({totalCount} configurations)
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => router.push('/administrator/grid-configuration/add')}>
          <Plus className="w-4 h-4 mr-2" />
          Add Configuration
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Grid Configurations</CardTitle>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
              <input
                type="text"
                placeholder="Search configurations..."
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
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#C8102E' }} />
            </div>
          ) : (
            <DataTable
              data={configurations}
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
