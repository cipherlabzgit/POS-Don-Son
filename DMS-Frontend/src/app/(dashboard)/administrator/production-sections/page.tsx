'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Factory, Plus, Search, Edit, X, Check, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  productionSectionsApi,
  type ProductionSection,
  type UpdateProductionSectionDto,
} from '@/lib/api/production-sections';
import toast from 'react-hot-toast';
import { usePermissions } from '@/hooks/usePermissions';

export default function ProductionSectionsPage() {
  const router = useRouter();
  const { canAction } = usePermissions();
  const canCreate = canAction('/administrator/production-sections', 'create');

  const [sections, setSections] = useState<ProductionSection[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSections();
  }, [currentPage, pageSize, searchTerm]);

  const loadSections = async () => {
    try {
      setLoading(true);
      const response = await productionSectionsApi.getAll(currentPage, pageSize, searchTerm);
      setSections(response.productionSections);
      setTotalCount(response.totalCount);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load production sections');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (section: ProductionSection) => {
    try {
      const updateData: UpdateProductionSectionDto = {
        code: section.code,
        name: section.name,
        description: section.description,
        location: section.location,
        capacity: section.capacity,
        displayOrder: section.displayOrder,
        isActive: !section.isActive,
      };
      await productionSectionsApi.update(section.id, updateData);
      toast.success(`Section ${section.isActive ? 'deactivated' : 'activated'}`);
      loadSections();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update section');
    }
  };

  const columns = [
    {
      key: 'code',
      label: 'Code',
      render: (item: ProductionSection) => (
        <span className="font-mono font-semibold text-sm" style={{ color: '#C8102E' }}>
          {item.code}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'Section Name',
      render: (item: ProductionSection) => (
        <span className="font-medium">{item.name}</span>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (item: ProductionSection) => (
        <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {item.description || '—'}
        </span>
      ),
    },
    {
      key: 'location',
      label: 'Location / Dept',
      render: (item: ProductionSection) => (
        <span className="text-sm">{item.location || '—'}</span>
      ),
    },
    {
      key: 'displayOrder',
      label: 'Order',
      render: (item: ProductionSection) => (
        <Badge variant="neutral" size="sm">{item.displayOrder}</Badge>
      ),
    },
    {
      key: 'consumableCount',
      label: 'Consumables',
      render: (item: ProductionSection) => (
        <Badge variant="neutral" size="sm">{item.consumableCount}</Badge>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (item: ProductionSection) => (
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
      render: (item: ProductionSection) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => router.push(`/administrator/production-sections/edit/${item.id}`)}
            className="p-1.5 rounded transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleToggleActive(item)}
            className="p-1.5 rounded transition-colors"
            style={{ color: item.isActive ? '#DC2626' : '#10B981' }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = item.isActive ? '#FEF2F2' : '#F0FDF4')
            }
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
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
            <Factory className="w-8 h-8 inline-block mr-3" style={{ color: '#C8102E' }} />
            Production Sections
          </h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Manage production sections ({totalCount} sections)
          </p>
        </div>
        {canCreate && (
          <Button
            variant="primary"
            size="md"
            onClick={() => router.push('/administrator/production-sections/add')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Section
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Sections List</CardTitle>
            <div className="relative w-full sm:w-auto">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                style={{ color: 'var(--muted-foreground)' }}
              />
              <input
                type="text"
                placeholder="Search sections..."
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
              data={sections}
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
