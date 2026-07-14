'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { InlineDetailPanel } from '@/components/ui/inline-detail-panel';
import { Plus, Search, Edit, Eye, EyeOff, CheckCircle, XCircle, Clock, Info, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Select from '@/components/ui/select';
import { disposalsApi, type Disposal } from '@/lib/api/disposals';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useThemeStore } from '@/lib/stores/theme-store';
import { isAdminUser, todayISO } from '@/lib/date-restrictions';
import { usePermissions } from '@/hooks/usePermissions';
import { ProtectedPage } from '@/components/auth';
import toast from 'react-hot-toast';
import { formatSlDate, formatSlDateTime } from '@/lib/sri-lanka-time';

export default function DisposalPage() {
  return (
    <ProtectedPage permission="operation:disposal:view">
      <DisposalPageContent />
    </ProtectedPage>
  );
}

function DisposalPageContent() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAdmin = isAdminUser(user);
  const { canAction } = usePermissions();
  const canCreate = canAction('/operation/disposal', 'create');
  const canEditDisposal = canAction('/operation/disposal', 'edit');
  const pageTheme = useThemeStore((s) => s.getPageTheme('disposal'));

  const [disposals, setDisposals] = useState<Disposal[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDisposal, setSelectedDisposal] = useState<Disposal | null>(null);
  const [showPreviousRecords, setShowPreviousRecords] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDisposals();
  }, [currentPage, pageSize, statusFilter]);

  const fetchDisposals = async () => {
    try {
      setIsLoading(true);
      const filters: any = {};
      if (statusFilter) filters.status = statusFilter;
      
      const response = await disposalsApi.getAll(currentPage, pageSize, filters);
      setDisposals(response.disposals || []);
      setTotalPages(response.totalPages || 1);
    } catch (error: any) {
      const isNetwork =
        error?.code === 'ERR_NETWORK' || error?.message === 'Network Error';
      toast.error(
        isNetwork
          ? 'Could not connect to the server. Check your connection and try again.'
          : error.response?.data?.message || 'Failed to load disposals'
      );
      setDisposals([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDisposals = useMemo(() => {
    const today = todayISO();
    const q = searchTerm.toLowerCase().trim();
    return disposals.filter((d) => {
      const blob = [
        d.disposalNo,
        d.outlet?.name,
        d.outletName,
        d.createdByName,
        d.approvedByName,
        d.approvedBy?.fullName,
        d.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchesSearch = !q || blob.includes(q);
      const matchesRole =
        isAdmin ||
        (d.createdById === user?.id && (showPreviousRecords || d.disposalDate === today));
      return matchesSearch && matchesRole;
    });
  }, [disposals, searchTerm, isAdmin, user, showPreviousRecords]);

  const paginatedDisposals = filteredDisposals;

  const toggleDisposalDetails = async (item: Disposal) => {
    try {
      if (selectedDisposal?.id === item.id) {
        setSelectedDisposal(null);
        return;
      }
      const fullDisposal = await disposalsApi.getById(item.id);
      setSelectedDisposal(fullDisposal);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load disposal details');
    }
  };

  const handleSubmit = async (id: string) => {
    try {
      await disposalsApi.submit(id);
      toast.success('Disposal submitted for approval');
      fetchDisposals();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit disposal');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return (
          <Badge variant="success" size="sm">
            <CheckCircle className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        );
      case 'Rejected':
        return (
          <Badge variant="danger" size="sm">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        );
      case 'Pending':
        return (
          <Badge variant="warning" size="sm">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  const columns = [
    {
      key: 'no',
      label: 'No',
      render: (item: Disposal) => (
        <span className="font-mono font-semibold" style={{ color: pageTheme?.secondaryColor || '#C8102E' }}>
          {item.disposalNo}
        </span>
      ),
    },
    {
      key: 'effectiveDate',
      label: 'Effective Date',
      render: (item: Disposal) => (
        <span className="font-medium">{formatSlDate(item.disposalDate)}</span>
      ),
    },
    {
      key: 'showroom',
      label: 'Showroom',
      render: (item: Disposal) => (
        <span className="font-medium">{item.outletName || item.outlet?.name || '-'}</span>
      ),
    },
    {
      key: 'recordedAt',
      label: 'Disposal Date & Time',
      render: (item: Disposal) => (
        <span className="text-sm">
          {formatSlDateTime(item.createdAt, { dateStyle: 'short',
            timeStyle: 'short', })}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item: Disposal) => getStatusBadge(item.status),
    },
    {
      key: 'createdBy',
      label: 'Created By',
      render: (item: Disposal) => (
        <span className="text-sm">{item.createdByName || '-'}</span>
      ),
    },
    {
      key: 'approvedBy',
      label: 'Approved By',
      render: (item: Disposal) => (
        <span className="text-sm">{item.approvedByName || item.approvedBy?.fullName || '-'}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Action',
      render: (item: Disposal) => (
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => void toggleDisposalDetails(item)}
            className="rounded p-1.5 transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            title={selectedDisposal?.id === item.id ? 'Hide details' : 'View details'}
          >
            {selectedDisposal?.id === item.id ? (
              <Eye className="h-4 w-4" aria-hidden />
            ) : (
              <EyeOff className="h-4 w-4" aria-hidden />
            )}
          </button>
          {item.status === 'Pending' && canEditDisposal && (
            <>
              <button
                type="button"
                onClick={() => router.push(`/operation/disposal/edit/${item.id}`)}
                className="rounded p-1.5 transition-colors"
                style={{ color: 'var(--muted-foreground)' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                title="Edit"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(item.id)}
                className="rounded p-1.5 transition-colors"
                style={{ color: '#3B82F6' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#EFF6FF')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                title="Submit for Approval"
              >
                <Clock className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            Disposal
          </h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Record disposals and write-offs ({filteredDisposals.length} in view)
          </p>
          <div className="mt-2">
            <Badge variant={isAdmin ? 'primary' : 'neutral'} size="sm">
              <Info className="mr-1 h-3 w-3" />
              {isAdmin
                ? 'Admin: All records visible. Any date allowed.'
                : 'You see your own records for today only.'}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {!isAdmin && (
            <Button
              variant={showPreviousRecords ? 'primary' : 'secondary'}
              size="md"
              onClick={() => setShowPreviousRecords(!showPreviousRecords)}
            >
              {showPreviousRecords ? 'Hide Previous Records' : 'Show Previous Records'}
            </Button>
          )}
          {canCreate && (
            <Button variant="primary" size="md" onClick={() => router.push('/operation/disposal/add')}>
              <Plus className="mr-2 h-4 w-4" />
              Add Disposal
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <CardTitle>Disposal</CardTitle>
            <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: '', label: 'All Status' },
                  { value: 'Pending', label: 'Pending' },
                  { value: 'Approved', label: 'Approved' },
                  { value: 'Rejected', label: 'Rejected' },
                ]}
              />
              <div className="relative w-full sm:w-auto">
                <Search
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform"
                  style={{ color: 'var(--muted-foreground)' }}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search records"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoComplete="off"
                  className="w-full rounded-lg py-2 pr-4 pl-10 text-sm sm:w-64"
                  style={{ border: '1px solid var(--input)' }}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
            </div>
          ) : (
            <DataTable
              data={paginatedDisposals}
              columns={columns}
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              emptyMessage="No disposal records."
              expandedRowKey={selectedDisposal?.id ?? null}
              getRowKey={(row) => row.id}
              renderExpandedRow={(disposal) => (
                <InlineDetailPanel
                  title="Disposal Details"
                  open
                  onClose={() => setSelectedDisposal(null)}
                  contentClassName="max-w-[min(100%,80rem)] w-full"
                  footer={
                    <Button variant="ghost" onClick={() => setSelectedDisposal(null)}>
                      Close
                    </Button>
                  }
                >
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Disposal No</p>
                        <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{disposal.disposalNo}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Status</p>
                        {getStatusBadge(disposal.status)}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Effective date</p>
                      <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                        {formatSlDate(disposal.disposalDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Disposal date &amp; time</p>
                      <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                        {formatSlDateTime(disposal.createdAt, { dateStyle: 'short',
                          timeStyle: 'short', })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Showroom</p>
                      <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{disposal.outletName || disposal.outlet?.name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Total Items</p>
                      <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{disposal.totalItems || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Created / Updated</p>
                      <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                        {formatSlDate(disposal.createdAt)} • {formatSlDate(disposal.updatedAt)}
                      </p>
                    </div>
                    {disposal.notes && (
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Notes</p>
                        <p className="text-sm" style={{ color: 'var(--foreground)' }}>{disposal.notes}</p>
                      </div>
                    )}

                    <div className="border-t pt-4">
                      <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--foreground)' }}>Disposal Items</h3>
                      {disposal.items && disposal.items.length > 0 ? (
                        <div className="border rounded-lg overflow-hidden">
                          <table className="w-full">
                            <thead style={{ backgroundColor: 'var(--muted)' }}>
                              <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold">Product</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold">Quantity</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">Reason</th>
                              </tr>
                            </thead>
                            <tbody>
                              {disposal.items.map((line, index) => (
                                <tr key={index} className="border-t">
                                  <td className="px-4 py-3 text-sm">
                                    {line.productCode || line.product?.code} - {line.productName || line.product?.name}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-right">{line.quantity.toFixed(2)}</td>
                                  <td className="px-4 py-3 text-sm">{line.reason || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="border-t" style={{ backgroundColor: 'var(--muted)' }}>
                              <tr>
                                <td className="px-4 py-3 text-sm font-bold">Total</td>
                                <td className="px-4 py-3 text-sm text-right font-bold">
                                  {disposal.items.reduce((sum, line) => sum + line.quantity, 0).toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-sm text-center text-muted-foreground">
                                  {disposal.items.length} items
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-center py-4" style={{ color: 'var(--muted-foreground)' }}>
                          No items found
                        </p>
                      )}
                    </div>
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
