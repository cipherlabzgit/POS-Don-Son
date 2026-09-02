'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Store, Plus, Search, Edit, X, Check, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { outletsApi, type Outlet, type UpdateOutletDto, type CreateOutletDto } from '@/lib/api/outlets';
import { ProtectedPage } from '@/components/auth';
import { usePermissions } from '@/hooks/usePermissions';
import toast from 'react-hot-toast';
import CsvBulkUploadBar from '@/components/dms/CsvBulkUploadBar';
import type { CsvRowRecord } from '@/lib/csv-utils';
import { parseBool, parseDecimal, parseIntField, req } from '@/lib/bulk-csv-field-parsers';

export default function ShowroomPage() {
  return (
    <ProtectedPage permission="showroom:view">
      <ShowroomPageContent />
    </ProtectedPage>
  );
}

function ShowroomPageContent() {
  const router = useRouter();
  const { canAction } = usePermissions();
  const canCreate = canAction('/showroom', 'create');
  const canEditShowroom = canAction('/showroom', 'edit');
  const canBulk = canAction('/showroom', 'import') || canCreate;

  const mapOutletRow = useCallback(
    async (
      row: CsvRowRecord,
      _excelRow: number,
    ): Promise<{ ok: true; value: CreateOutletDto } | { ok: false; error: string }> => {
      try {
        const dto: CreateOutletDto = {
          code: req(row, 'code'),
          posVerificationCode: row.posVerificationCode?.trim() || undefined,
          name: req(row, 'name'),
          description: row.description?.trim() || undefined,
          address: row.address?.trim() || undefined,
          phone: row.phone?.trim() || undefined,
          contactPerson: row.contactPerson?.trim() || undefined,
          displayOrder: parseIntField(row, 'displayOrder', 0),
          locationType: row.locationType?.trim() || undefined,
          hasVariants: parseBool(row, 'hasVariants', false),
          isDeliveryPoint: parseBool(row, 'isDeliveryPoint', false),
          latitude: row.latitude?.trim() ? parseDecimal(row, 'latitude') : undefined,
          longitude: row.longitude?.trim() ? parseDecimal(row, 'longitude') : undefined,
          operatingHours: row.operatingHours?.trim() || undefined,
          notes: row.notes?.trim() || undefined,
          isActive: parseBool(row, 'isActive', true),
        };
        return { ok: true, value: dto };
      } catch (e: unknown) {
        return { ok: false, error: e instanceof Error ? e.message : 'Invalid row' };
      }
    },
    [],
  );
  const [showrooms, setShowrooms] = useState<Outlet[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadShowrooms();
  }, [currentPage, pageSize, searchTerm]);

  const loadShowrooms = async () => {
    try {
      setLoading(true);
      // Explicitly pass false to include BOTH active and inactive showrooms
      const response = await outletsApi.getAll(currentPage, pageSize, searchTerm, undefined, false);
      setShowrooms(response.outlets);
      setTotalCount(response.totalCount);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load showrooms');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleToggleActive = async (outlet: Outlet) => {
    try {
      const updateData: UpdateOutletDto = {
        code: outlet.code,
        name: outlet.name,
        address: outlet.address || undefined,
        phone: outlet.phone,
        contactPerson: outlet.contactPerson,
        displayOrder: outlet.displayOrder,
        hasVariants: outlet.hasVariants,
        isDeliveryPoint: outlet.isDeliveryPoint,
        isActive: !outlet.isActive,
      };
      await outletsApi.update(outlet.id, updateData);
      toast.success(`Outlet ${outlet.isActive ? 'deactivated' : 'activated'} successfully`);
      loadShowrooms();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update outlet');
    }
  };

  const columns = [
    {
      key: 'code',
      label: 'Code',
      render: (item: Outlet) => (
        <span className="font-mono font-semibold" style={{ color: '#C8102E' }}>
          {item.code}
        </span>
      ),
    },
    {
      key: 'posVerificationCode',
      label: 'POS Verify Code',
      render: (item: Outlet) => (
        <span className="font-mono text-xs">
          {item.posVerificationCode || '—'}
        </span>
      ),
    },
    {
      key: 'displayOrder',
      label: 'Display Order',
      render: (item: Outlet) => (
        <span className="font-medium text-center block">{item.displayOrder}</span>
      ),
    },
    {
      key: 'name',
      label: 'Showroom Name',
      render: (item: Outlet) => (
        <span className="font-medium">{item.name}</span>
      ),
    },
    {
      key: 'address',
      label: 'Location',
    },
    {
      key: 'contactPerson',
      label: 'Manager',
    },
    {
      key: 'phone',
      label: 'Phone',
    },
    {
      key: 'showInDashboard',
      label: 'Dashboard',
      render: (item: Outlet) => (
        item.showInDashboard ? (
          <Badge variant="success" size="sm">Yes</Badge>
        ) : (
          <Badge variant="secondary" size="sm">No</Badge>
        )
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (item: Outlet) => (
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
      render: (item: Outlet) => (
        <div className="flex items-center space-x-2">
          {canEditShowroom && (
            <button
              onClick={() => router.push(`/showroom/edit/${item.id}`)}
              className="p-1.5 rounded transition-colors"
              style={{ color: 'var(--muted-foreground)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          {canEditShowroom && (
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
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Showrooms</h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Manage showroom locations ({totalCount} outlets)
          </p>
        </div>
        {canCreate && (
          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="primary" size="md" onClick={() => router.push('/showroom/add')}>
              <Plus className="w-4 h-4 mr-2" />
              Add Showroom
            </Button>
          </div>
        )}
      </div>

      {canBulk && (
        <div className="w-full min-w-0 max-w-full">
          <CsvBulkUploadBar<CreateOutletDto>
            entityLabel="showrooms"
            templateFilename="showrooms-import-template.csv"
            permission={['showroom:import', 'showroom:create']}
            permissionMode="any"
            columns={[
              { header: 'code' },
              { header: 'posVerificationCode' },
              { header: 'name' },
              { header: 'description' },
              { header: 'address' },
              { header: 'phone' },
              { header: 'contactPerson' },
              { header: 'displayOrder' },
              { header: 'locationType' },
              { header: 'hasVariants' },
              { header: 'isDeliveryPoint' },
              { header: 'latitude' },
              { header: 'longitude' },
              { header: 'operatingHours' },
              { header: 'notes' },
              { header: 'isActive' },
            ]}
            exampleRows={[
              [
                'SR01',
                'PV-K7M2-Q9X4-WN8R',
                'Main Showroom',
                '',
                '123 Street',
                '',
                '',
                '1',
                'Showroom',
                'false',
                'true',
                '',
                '',
                '',
                '',
                'true',
              ],
            ]}
            mapRow={mapOutletRow}
            importRow={(dto) => outletsApi.create(dto)}
            onImportComplete={() => loadShowrooms()}
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Showroom List</CardTitle>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
              <input
                type="text"
                placeholder="Search showrooms..."
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
              data={showrooms}
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
