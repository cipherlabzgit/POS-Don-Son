'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Calendar, Plus, Search, Edit, X, Check, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { dayTypesApi, type DayType, type UpdateDayTypeDto, type CreateDayTypeDto } from '@/lib/api/day-types';
import toast from 'react-hot-toast';
import CsvBulkUploadBar from '@/components/dms/CsvBulkUploadBar';
import type { CsvRowRecord } from '@/lib/csv-utils';
import { parseBool, parseDecimal, req } from '@/lib/bulk-csv-field-parsers';
import { usePermissions } from '@/hooks/usePermissions';

export default function DayTypesPage() {
  const router = useRouter();
  const { canAction } = usePermissions();
  const canCreate = canAction('/administrator/day-types', 'create');
  const canBulk = canAction('/administrator/day-types', 'import') || canCreate;
  const [dayTypes, setDayTypes] = useState<DayType[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDayTypes();
  }, [currentPage, pageSize, searchTerm]);

  const loadDayTypes = async () => {
    try {
      setLoading(true);
      const response = await dayTypesApi.getAll(currentPage, pageSize, searchTerm, undefined);
      setDayTypes(response.dayTypes);
      setTotalCount(response.totalCount);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load day types');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (dayType: DayType) => {
    try {
      const updateData: UpdateDayTypeDto = {
        code: dayType.code,
        name: dayType.name,
        description: dayType.description,
        multiplier: dayType.multiplier,
        color: dayType.color,
        isActive: !dayType.isActive,
      };
      await dayTypesApi.update(dayType.id, updateData);
      toast.success(`Day type ${dayType.isActive ? 'deactivated' : 'activated'}`);
      loadDayTypes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update day type');
    }
  };

  const mapDayTypeRow = useCallback(
    async (
      row: CsvRowRecord,
      _excelRow: number,
    ): Promise<{ ok: true; value: CreateDayTypeDto } | { ok: false; error: string }> => {
      try {
        const dto: CreateDayTypeDto = {
          code: req(row, 'code'),
          name: req(row, 'name'),
          description: row.description?.trim() || undefined,
          multiplier: parseDecimal(row, 'multiplier'),
          color: row.color?.trim() || undefined,
          isActive: parseBool(row, 'isActive', true),
        };
        return { ok: true, value: dto };
      } catch (e: unknown) {
        return { ok: false, error: e instanceof Error ? e.message : 'Invalid row' };
      }
    },
    [],
  );

  const columns = [
    {
      key: 'code',
      label: 'Code',
      render: (item: DayType) => (
        <span className="font-mono font-semibold" style={{ color: '#C8102E' }}>
          {item.code}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'Day Type Name',
      render: (item: DayType) => (
        <div>
          <span className="font-medium">{item.name}</span>
          {item.description && (
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {item.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'multiplier',
      label: 'Multiplier',
      render: (item: DayType) => (
        <Badge variant="neutral" size="sm">{item.multiplier}x</Badge>
      ),
    },
    {
      key: 'color',
      label: 'Color',
      render: (item: DayType) => (
        <div className="flex items-center gap-2">
          {item.color && (
            <div
              className="w-6 h-6 rounded border"
              style={{ backgroundColor: item.color }}
            />
          )}
          <span className="text-sm font-mono">{item.color}</span>
        </div>
      ),
    },
    {
      key: 'applicableDays',
      label: 'Applicable Days',
      render: (item: DayType) => {
        const DAY_LABELS: Record<number, string> = { 1:'Mon',2:'Tue',3:'Wed',4:'Thu',5:'Fri',6:'Sat',0:'Sun' };
        const days = item.applicableDays ?? [];
        if (days.length === 0) {
          return <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Not set</span>;
        }
        const ordered = [1,2,3,4,5,6,0].filter(d => days.includes(d));
        return (
          <div className="flex flex-wrap gap-1">
            {ordered.map(d => (
              <span
                key={d}
                className="inline-flex items-center justify-center w-8 h-6 rounded text-xs font-semibold"
                style={{
                  backgroundColor: '#C8102E15',
                  color: '#C8102E',
                  border: '1px solid #C8102E40',
                }}
              >
                {DAY_LABELS[d]}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (item: DayType) => (
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
      render: (item: DayType) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => router.push(`/administrator/day-types/edit/${item.id}`)}
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
            <Calendar className="w-8 h-8 inline-block mr-3" style={{ color: '#C8102E' }} />
            Day Types
          </h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Manage production day types for morning and afternoon schedules ({totalCount} types)
          </p>
        </div>
        {canCreate && (
          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="primary" size="md" onClick={() => router.push('/administrator/day-types/add')}>
              <Plus className="w-4 h-4 mr-2" />
              Add Day Type
            </Button>
          </div>
        )}
      </div>

      {canBulk && (
        <div className="w-full min-w-0 max-w-full">
          <CsvBulkUploadBar<CreateDayTypeDto>
            entityLabel="day types"
            templateFilename="day-types-import-template.csv"
            permission={['day_type:import', 'day_type:create']}
            permissionMode="any"
            columns={[
              { header: 'code' },
              { header: 'name' },
              { header: 'description' },
              { header: 'multiplier' },
              { header: 'color' },
              { header: 'isActive' },
            ]}
            exampleRows={[['WD', 'Weekday', '', '1', '#3B82F6', 'true']]}
            mapRow={mapDayTypeRow}
            importRow={(dto) => dayTypesApi.create(dto)}
            onImportComplete={() => loadDayTypes()}
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Day Type List</CardTitle>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
              <input
                type="text"
                placeholder="Search day types..."
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
              data={dayTypes}
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
