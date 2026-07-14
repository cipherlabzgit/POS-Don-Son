'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { InlineDetailPanel } from '@/components/ui/inline-detail-panel';
import { Plus, Search, Eye, EyeOff, Edit, Send, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Select from '@/components/ui/select';
import { DateRangeFilter } from '@/components/ui/date-range-filter';
import { productionCancelsApi, type ProductionCancel } from '@/lib/api/production-cancels';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useThemeStore } from '@/lib/stores/theme-store';
import { isAdminUser } from '@/lib/date-restrictions';
import { usePermissions } from '@/hooks/usePermissions';
import { ProtectedPage } from '@/components/auth';
import toast from 'react-hot-toast';
import { formatSlDate, formatSlDateTime } from '@/lib/sri-lanka-time';

export default function ProductionCancelPage() {
  return (
    <ProtectedPage permission="production:cancel:view">
      <ProductionCancelPageContent />
    </ProtectedPage>
  );
}

function ProductionCancelPageContent() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAdmin = isAdminUser(user);
  const { canAction } = usePermissions();
  const canCreate = canAction('/production/production-cancel', 'create');
  const canEditCancel = canAction('/production/production-cancel', 'edit');
  const canDeleteCancel = canAction('/production/production-cancel', 'delete');
  const pageTheme = useThemeStore((s) => s.getPageTheme('production-cancel'));

  const [cancels, setCancels] = useState<ProductionCancel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedCancel, setSelectedCancel] = useState<ProductionCancel | null>(null);

  useEffect(() => {
    fetchData();
  }, [currentPage, pageSize, statusFilter, fromDate, toDate]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const filters: any = {};
      if (statusFilter) filters.status = statusFilter;
      if (fromDate) filters.fromDate = fromDate;
      if (toDate) filters.toDate = toDate;
      
      const response = await productionCancelsApi.getAll(currentPage, pageSize, filters);
      console.log('Fetched production cancels:', response);
      console.log('Items array:', response.data);
      console.log('Total count:', response.totalCount);
      
      const items = Array.isArray(response.data) ? response.data : [];
      
      // Debug: Check first item's product data
      if (items.length > 0) {
        console.log('First item full data:', items[0]);
        console.log('First item product:', items[0].product);
      }
      
      setCancels(items);
      setTotalPages(response.totalPages || 1);
      setTotalCount(response.totalCount || items.length);
      
      if (items.length === 0) {
        console.warn('No production cancellation records found');
      }
    } catch (error) {
      console.error('Failed to load production cancels:', error);
      toast.error('Failed to load production cancels');
      setCancels([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (id: string) => {
    try {
      await productionCancelsApi.submit(id);
      toast.success('Production cancellation submitted for approval');
      fetchData();
    } catch (error: any) {
      console.error('Failed to submit production cancellation:', error);
      toast.error(error.response?.data?.message || 'Failed to submit production cancellation');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this production cancellation?')) return;

    try {
      await productionCancelsApi.delete(id);
      toast.success('Production cancellation deleted successfully');
      fetchData();
    } catch (error: any) {
      console.error('Failed to delete production cancellation:', error);
      toast.error(error.response?.data?.message || 'Failed to delete production cancellation');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved': return <Badge variant="success" size="sm">Approved</Badge>;
      case 'Rejected': return <Badge variant="danger" size="sm">Rejected</Badge>;
      case 'Pending': return <Badge variant="warning" size="sm">Pending</Badge>;
      default: return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  const filteredCancels = Array.isArray(cancels) ? cancels.filter(c => {
    const matchesSearch = searchTerm === '' || 
      c.cancelNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.productionNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.createdByName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.lines?.some(line => 
        line.productCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        line.productName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return matchesSearch;
  }) : [];

  const columns = [
    {
      key: 'cancelDate',
      label: 'Cancelled Date',
      render: (item: ProductionCancel) => (
        <span style={{ color: 'var(--muted-foreground)' }}>
          {formatSlDate(item.cancelDate)}
        </span>
      ),
    },
    {
      key: 'cancelNo',
      label: 'Cancel No',
      render: (item: ProductionCancel) => (
        <span className="font-semibold" style={{ color: pageTheme.secondaryColor }}>
          {item.cancelNo}
        </span>
      ),
    },
    {
      key: 'productionNo',
      label: 'Production No',
      render: (item: ProductionCancel) => (
        <span style={{ color: 'var(--foreground)' }}>{item.productionNo}</span>
      ),
    },
    {
      key: 'products',
      label: 'Products',
      render: (item: ProductionCancel) => (
        <span style={{ color: 'var(--foreground)' }}>
          {item.totalItems ? `${item.totalItems} item${item.totalItems > 1 ? 's' : ''}` : '-'}
        </span>
      ),
    },
    {
      key: 'totalQty',
      label: 'Total Qty',
      render: (item: ProductionCancel) => (
        <span style={{ color: 'var(--foreground)' }}>{item.totalQty || '-'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item: ProductionCancel) => getStatusBadge(item.status),
    },
    {
      key: 'actions',
      label: '',
      render: (item: ProductionCancel) => (
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={() => {
              if (selectedCancel?.id === item.id) setSelectedCancel(null);
              else setSelectedCancel(item);
            }}
            className="p-1.5 rounded-full transition-colors"
            style={{ color: 'var(--muted-foreground)', backgroundColor: 'var(--muted)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E5E7EB'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
            title={selectedCancel?.id === item.id ? 'Hide details' : 'View details'}
          >
            {selectedCancel?.id === item.id ? (
              <Eye className="w-4 h-4" aria-hidden />
            ) : (
              <EyeOff className="w-4 h-4" aria-hidden />
            )}
          </button>
          
          {canEditCancel && (
            <button
              onClick={() => router.push(`/production/production-cancel/edit/${item.id}`)}
              className="p-1.5 rounded-full transition-colors"
              style={{ color: 'var(--muted-foreground)', backgroundColor: 'var(--muted)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E5E7EB'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
              title="Edit"
            >
              <Edit className="w-4 h-4" aria-hidden />
            </button>
          )}
          
          {canDeleteCancel && (
            <button
              onClick={() => void handleDelete(item.id)}
              className="p-1.5 rounded-full transition-colors"
              style={{ color: '#ef4444', backgroundColor: '#fee2e2' }}
              title="Delete"
            >
              <Trash2 className="w-4 h-4" aria-hidden />
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
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Production Cancellation</h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            History of Production Cancellation
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canCreate && (
            <Button variant="primary" size="md" onClick={() => router.push('/production/production-cancel/add')}>
              <Plus className="w-4 h-4 mr-2" />
              Add New
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  {isLoading ? 'Loading...' : `Showing ${totalCount} entries`}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Select 
                  value={statusFilter} 
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} 
                  options={[
                    { value: '', label: 'All Status' }, 
                    { value: 'Pending', label: 'Pending' }, 
                    { value: 'Approved', label: 'Approved' }, 
                    { value: 'Rejected', label: 'Rejected' }
                  ]} 
                />
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    autoComplete="off"
                    className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-lg text-sm" 
                    style={{ border: '1px solid var(--input)' }} 
                  />
                </div>
              </div>
            </div>
            
            <DateRangeFilter
              fromDate={fromDate}
              toDate={toDate}
              onFromDateChange={(date) => {
                setFromDate(date);
                setCurrentPage(1);
              }}
              onToDateChange={(date) => {
                setToDate(date);
                setCurrentPage(1);
              }}
              onClear={() => {
                setFromDate('');
                setToDate('');
                setCurrentPage(1);
              }}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <DataTable
              data={filteredCancels}
              columns={columns}
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
              expandedRowKey={selectedCancel?.id ?? null}
              getRowKey={(row) => row.id}
              renderExpandedRow={(cancel) => (
                <InlineDetailPanel
                  title="Production Cancellation Details"
                  open
                  onClose={() => setSelectedCancel(null)}
                  footer={
                    <Button variant="ghost" onClick={() => setSelectedCancel(null)}>
                      Close
                    </Button>
                  }
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Cancel No</p>
                        <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{cancel.cancelNo}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Status</p>
                        {getStatusBadge(cancel.status)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Cancel Date</p>
                        <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                          {formatSlDate(cancel.cancelDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Production No</p>
                        <p className="text-sm" style={{ color: 'var(--foreground)' }}>{cancel.productionNo}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Reason</p>
                      <p className="text-sm" style={{ color: 'var(--foreground)' }}>{cancel.reason}</p>
                    </div>

                    <div>
                      <p className="text-xs font-medium mb-2" style={{ color: 'var(--muted-foreground)' }}>
                        Cancelled Items ({cancel.totalItems || 0} item{(cancel.totalItems || 0) !== 1 ? 's' : ''}, Total: {cancel.totalQty || 0})
                      </p>
                      <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                        <table className="w-full text-sm">
                          <thead style={{ backgroundColor: 'var(--muted)' }}>
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>#</th>
                              <th className="px-3 py-2 text-left text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Product Code</th>
                              <th className="px-3 py-2 text-left text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Product Name</th>
                              <th className="px-3 py-2 text-left text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Section</th>
                              <th className="px-3 py-2 text-right text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Qty</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cancel.lines && cancel.lines.length > 0 ? (
                              cancel.lines.map((line: any, index: number) => (
                                <tr key={index} style={{ borderTop: '1px solid var(--border)' }}>
                                  <td className="px-3 py-2" style={{ color: 'var(--muted-foreground)' }}>{line.lineNo || index + 1}</td>
                                  <td className="px-3 py-2" style={{ color: 'var(--foreground)' }}>{line.productCode || '-'}</td>
                                  <td className="px-3 py-2" style={{ color: 'var(--foreground)' }}>{line.productName || '-'}</td>
                                  <td className="px-3 py-2" style={{ color: 'var(--foreground)' }}>{line.productionSectionName || '-'}</td>
                                  <td className="px-3 py-2 text-right font-semibold" style={{ color: 'var(--foreground)' }}>{line.cancelledQty || 0}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={5} className="px-3 py-4 text-center" style={{ color: 'var(--muted-foreground)' }}>
                                  No items found
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Created By / Date</p>
                      <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                        {cancel.createdByName} • {formatSlDateTime(cancel.createdAt)}
                      </p>
                    </div>
                    {cancel.approvedBy && (
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Approved By / Date</p>
                        <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                          {cancel.approvedBy.fullName} • {cancel.approvedDate ? formatSlDateTime(cancel.approvedDate) : '-'}
                        </p>
                      </div>
                    )}
                  </div>
                </InlineDetailPanel>
              )}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
