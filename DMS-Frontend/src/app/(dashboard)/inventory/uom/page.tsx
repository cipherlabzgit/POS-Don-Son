'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Ruler, Plus, Search, Edit, X, Check, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { uomsApi, UnitOfMeasure, type CreateUnitOfMeasureDto } from '@/lib/api/uoms';
import { ProtectedPage } from '@/components/auth';
import { usePermissions } from '@/hooks/usePermissions';
import toast from 'react-hot-toast';
import CsvBulkUploadBar from '@/components/dms/CsvBulkUploadBar';
import type { CsvRowRecord } from '@/lib/csv-utils';
import { parseBool, req } from '@/lib/bulk-csv-field-parsers';

export default function UOMPage() {
  return (
    <ProtectedPage permission="unit-of-measure:view">
      <UOMPageContent />
    </ProtectedPage>
  );
}

function UOMPageContent() {
  const router = useRouter();
  const { canAction } = usePermissions();
  const canCreate = canAction('/inventory/uom', 'create');
  const canEditUom = canAction('/inventory/uom', 'edit');
  const canBulk = canAction('/inventory/uom', 'import') || canCreate;

  const mapUomRow = useCallback(
    async (
      row: CsvRowRecord,
      _excelRow: number,
    ): Promise<{ ok: true; value: CreateUnitOfMeasureDto } | { ok: false; error: string }> => {
      try {
        const dto: CreateUnitOfMeasureDto = {
          code: req(row, 'code'),
          description: req(row, 'description'),
          isActive: parseBool(row, 'isActive', true),
        };
        return { ok: true, value: dto };
      } catch (e: unknown) {
        return { ok: false, error: e instanceof Error ? e.message : 'Invalid row' };
      }
    },
    [],
  );
  const [uoms, setUoms] = useState<UnitOfMeasure[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    loadUOMs();
  }, [currentPage, pageSize, searchTerm]);

  const loadUOMs = async () => {
    try {
      setLoading(true);
      const response = await uomsApi.getAll(currentPage, pageSize, searchTerm, undefined);
      setUoms(response.unitOfMeasures);
      setTotalCount(response.totalCount);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load unit of measures');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (uom: UnitOfMeasure) => {
    try {
      const updated = await uomsApi.update(uom.id, {
        ...uom,
        isActive: !uom.isActive,
      });
      toast.success(`Unit of measure ${updated.isActive ? 'activated' : 'deactivated'}`);
      loadUOMs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update unit of measure');
    }
  };

  const columns = [
    {
      key: 'code',
      label: 'UOM Code',
      render: (item: UnitOfMeasure) => (
        <span className="font-mono font-semibold" style={{ color: '#C8102E' }}>
          {item.code}
        </span>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (item: UnitOfMeasure) => (
        <span className="font-medium">{item.description}</span>
      ),
    },
    {
      key: 'productCount',
      label: 'Products',
      render: (item: UnitOfMeasure) => (
        <Badge variant="neutral" size="sm">{item.productCount}</Badge>
      ),
    },
    {
      key: 'ingredientCount',
      label: 'Ingredients',
      render: (item: UnitOfMeasure) => (
        <Badge variant="neutral" size="sm">{item.ingredientCount}</Badge>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (item: UnitOfMeasure) => (
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
      render: (item: UnitOfMeasure) => (
        <div className="flex items-center space-x-2">
          {canEditUom && (
            <button
              onClick={() => router.push(`/inventory/uom/edit/${item.id}`)}
              className="p-1.5 rounded transition-colors"
              style={{ color: 'var(--muted-foreground)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          {canEditUom && (
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

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Unit of Measures</h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Manage unit of measures ({totalCount} units)
          </p>
        </div>
        {canCreate && (
          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="primary" size="md" onClick={() => router.push('/inventory/uom/add')}>
              <Plus className="w-4 h-4 mr-2" />
              Add UOM
            </Button>
          </div>
        )}
      </div>

      {canBulk && (
        <div className="w-full min-w-0 max-w-full">
          <CsvBulkUploadBar<CreateUnitOfMeasureDto>
            entityLabel="unit of measures"
            templateFilename="uom-import-template.csv"
            permission={['unit-of-measure:import', 'unit-of-measure:create']}
            permissionMode="any"
            columns={[{ header: 'code' }, { header: 'description' }, { header: 'isActive' }]}
            exampleRows={[['PCS', 'Pieces', 'true']]}
            mapRow={mapUomRow}
            importRow={(dto) => uomsApi.create(dto)}
            onImportComplete={() => loadUOMs()}
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>UOM List</CardTitle>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search UOMs..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                autoComplete="off"
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
              data={uoms}
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
