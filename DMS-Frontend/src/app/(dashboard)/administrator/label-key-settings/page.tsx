'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Settings, Plus, Search, Edit, X, Check, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  labelSettingsApi,
  type LabelSetting,
  type UpdateLabelSettingDto,
  getLabelSettingsErrorMessage,
} from '@/lib/api/label-settings';
import toast from 'react-hot-toast';
import { ProtectedPage } from '@/components/auth';

export default function LabelKeySettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<LabelSetting[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, [currentPage, pageSize, searchTerm]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await labelSettingsApi.getAll(currentPage, pageSize, searchTerm, undefined, undefined);
      setSettings(response.labelSettings);
      setTotalCount(response.totalCount);
    } catch (error: unknown) {
      toast.error(getLabelSettingsErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (setting: LabelSetting) => {
    try {
      const updateData: UpdateLabelSettingDto = {
        ...setting,
        isActive: !setting.isActive,
      };
      await labelSettingsApi.update(setting.id, updateData);
      toast.success(`Setting ${setting.isActive ? 'deactivated' : 'activated'}`);
      loadSettings();
    } catch (error: unknown) {
      toast.error(getLabelSettingsErrorMessage(error));
    }
  };

  const columns = [
    {
      key: 'settingKey',
      label: 'Setting Key',
      render: (item: LabelSetting) => (
        <span className="font-mono font-semibold" style={{ color: '#C8102E' }}>
          {item.settingKey}
        </span>
      ),
    },
    {
      key: 'settingName',
      label: 'Setting Name',
      render: (item: LabelSetting) => (
        <div>
          <span className="font-medium">{item.settingName}</span>
          {item.description && (
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {item.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'settingValue',
      label: 'Value',
      render: (item: LabelSetting) => <span className="text-sm font-mono">{item.settingValue || '-'}</span>,
    },
    {
      key: 'category',
      label: 'Category',
      render: (item: LabelSetting) =>
        item.category ? (
          <Badge variant="neutral" size="sm">
            {item.category}
          </Badge>
        ) : null,
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (item: LabelSetting) =>
        item.isActive ? (
          <Badge variant="success" size="sm">
            Active
          </Badge>
        ) : (
          <Badge variant="danger" size="sm">
            Inactive
          </Badge>
        ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: LabelSetting) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => router.push(`/administrator/label-key-settings/edit/${item.id}`)}
            className="p-1.5 rounded transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F9FAFB';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          {!item.isSystemSetting && (
            <button
              onClick={() => handleToggleActive(item)}
              className="p-1.5 rounded transition-colors"
              style={{ color: item.isActive ? '#DC2626' : '#10B981' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = item.isActive ? '#FEF2F2' : '#F0FDF4';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title={item.isActive ? 'Deactivate' : 'Activate'}
            >
              {item.isActive ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            </button>
          )}
        </div>
      ),
    },
  ];

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <ProtectedPage permission="label-settings:view">
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
              <Settings className="w-8 h-8 inline-block mr-3" style={{ color: '#C8102E' }} />
              Label configuration keys
            </h1>
            <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
              Key/value parameters used by label printing ({totalCount} settings)
            </p>
          </div>
          <Button variant="primary" size="md" onClick={() => router.push('/administrator/label-key-settings/add')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Setting
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle>Label settings list</CardTitle>
              <div className="relative w-full sm:w-auto">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                  style={{ color: 'var(--muted-foreground)' }}
                />
                <input
                  type="text"
                  placeholder="Search settings..."
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
                data={settings}
                columns={columns}
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                totalCount={totalCount}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedPage>
  );
}
