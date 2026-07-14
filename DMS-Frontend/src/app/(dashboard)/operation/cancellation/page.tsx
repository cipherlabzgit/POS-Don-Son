'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { InlineDetailPanel } from '@/components/ui/inline-detail-panel';
import { Plus, Search, Eye, EyeOff, Edit, Info, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Select from '@/components/ui/select';
import { cancellationsApi, type Cancellation } from '@/lib/api/cancellations';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useThemeStore } from '@/lib/stores/theme-store';
import { getDateBounds, isAdminUser, todayISO, addDaysISO } from '@/lib/date-restrictions';
import { usePermissions } from '@/hooks/usePermissions';
import { ProtectedPage } from '@/components/auth';
import toast from 'react-hot-toast';
import { formatSlDate, formatSlDateTime } from '@/lib/sri-lanka-time';

export default function CancellationPage() {
  return (
    <ProtectedPage permission="operation:cancellation:view">
      <CancellationPageContent />
    </ProtectedPage>
  );
}

function CancellationPageContent() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAdmin = isAdminUser(user);
  const { canAction } = usePermissions();
  const canCreate = canAction('/operation/cancellation', 'create');
  const canEditCancellation = canAction('/operation/cancellation', 'edit');
  const pageTheme = useThemeStore((s) => s.getPageTheme('cancellation'));

  const [cancellations, setCancellations] = useState<Cancellation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCancellation, setSelectedCancellation] = useState<Cancellation | null>(null);
  const [showPreviousRecords, setShowPreviousRecords] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCancellations();
  }, [currentPage, pageSize, statusFilter]);

  const fetchCancellations = async () => {
    try {
      setIsLoading(true);
      const filters: any = {};
      if (statusFilter) filters.status = statusFilter;
      
      const response = await cancellationsApi.getAll(currentPage, pageSize, filters);
      setCancellations(response.cancellations || []);
      setTotalPages(response.totalPages || 1);
    } catch (error: any) {
      const isNetwork =
        error?.code === 'ERR_NETWORK' || error?.message === 'Network Error';
      toast.error(
        isNetwork
          ? 'Could not connect to the server. Check your connection and try again.'
          : error.response?.data?.message || 'Failed to load cancellations'
      );
      setCancellations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCancellations = useMemo(() => {
    const minDate = addDaysISO(-3);
    return cancellations.filter(c => {
      const matchesSearch =
        c.cancellationNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.deliveryNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.outletName || c.outlet?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole =
        isAdmin ||
        (c.createdById === user?.id && (showPreviousRecords || c.cancellationDate >= minDate));
      return matchesSearch && matchesRole;
    });
  }, [cancellations, searchTerm, isAdmin, user, showPreviousRecords]);

  const paginatedCancellations = filteredCancellations;

  const handleSubmit = async (id: string) => {
    try {
      await cancellationsApi.submit(id);
      toast.success('Cancellation submitted for approval');
      fetchCancellations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit cancellation');
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

  const formatApproverCell = (item: Cancellation) => {
    if (item.status === 'Approved' && item.approvedByName) {
      const date = item.approvedDate ? formatSlDate(item.approvedDate) : '';
      return (
        <span className="text-sm">
          {item.approvedByName} {date && `- ${date}`}
        </span>
      );
    }
    if (item.status === 'Rejected' && item.rejectedByName) {
      const date = item.rejectedDate ? formatSlDate(item.rejectedDate) : '';
      return (
        <span className="text-sm">
          {item.rejectedByName} {date && `- ${date}`}
        </span>
      );
    }
    return <span className="text-sm">-</span>;
  };

  const columns = [
    {
      key: 'cancellationDate',
      label: 'Cancellation Date',
      render: (item: Cancellation) => (
        <span className="font-medium">{formatSlDate(item.cancellationDate)}</span>
      ),
    },
    {
      key: 'cancellationNo',
      label: 'Cancellation No',
      render: (item: Cancellation) => (
        <span className="font-mono font-semibold" style={{ color: pageTheme?.secondaryColor || '#C8102E' }}>
          {item.cancellationNo}
        </span>
      ),
    },
    {
      key: 'showroom',
      label: 'Showroom',
      render: (item: Cancellation) => (
        <span className="font-medium">{item.outletName || item.outlet?.name || '-'}</span>
      ),
    },
    {
      key: 'deliveredDate',
      label: 'Delivered Date',
      render: (item: Cancellation) => (
        <span className="text-sm">{item.deliveredDate ? formatSlDate(item.deliveredDate) : '-'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item: Cancellation) => getStatusBadge(item.status),
    },
    {
      key: 'editUser',
      label: 'Edit User',
      render: (item: Cancellation) => (
        <span className="text-sm">{item.updatedByName || '-'}</span>
      ),
    },
    {
      key: 'editDate',
      label: 'Edit Date',
      render: (item: Cancellation) => (
        <span className="text-sm">{formatSlDate(item.updatedAt)}</span>
      ),
    },
    {
      key: 'approvedBy',
      label: 'Approved/Rejected By',
      render: (item: Cancellation) => formatApproverCell(item),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: Cancellation) => (
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={async () => {
              try {
                const detail = await cancellationsApi.getById(item.id);
                const raw = detail as unknown as { data?: Cancellation };
                const data = raw?.data ?? (detail as Cancellation);
                if (selectedCancellation?.id === item.id) {
                  setSelectedCancellation(null);
                  return;
                }
                setSelectedCancellation(data);
              } catch (error) {
                toast.error('Failed to load cancellation details');
              }
            }}
            className="rounded p-1.5 transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            title={selectedCancellation?.id === item.id ? 'Hide details' : 'View details'}
          >
            {selectedCancellation?.id === item.id ? (
              <Eye className="h-4 w-4" aria-hidden />
            ) : (
              <EyeOff className="h-4 w-4" aria-hidden />
            )}
          </button>
          {item.status === 'Pending' && canEditCancellation && (
            <>
              <button
                type="button"
                onClick={() => router.push(`/operation/cancellation/edit/${item.id}`)}
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
                title="Submit for approval"
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
            Cancellation
          </h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Delivery cancellation requests ({filteredCancellations.length} in view)
          </p>
          <div className="mt-2">
            <Badge variant={isAdmin ? 'primary' : 'neutral'} size="sm">
              <Info className="mr-1 h-3 w-3" />
              {isAdmin
                ? 'Admin: All records visible. Any date allowed.'
                : 'You see your own cancellations. Back date up to 3 days.'}
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
            <Button variant="primary" size="md" onClick={() => router.push('/operation/cancellation/add')}>
              <Plus className="mr-2 h-4 w-4" />
              Add Cancellation
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <CardTitle>Cancellation List</CardTitle>
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
              data={paginatedCancellations}
              columns={columns}
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              expandedRowKey={selectedCancellation?.id ?? null}
              getRowKey={(row) => row.id}
              renderExpandedRow={(c) => (
                <InlineDetailPanel
                  title="Cancellation Details"
                  open
                  onClose={() => setSelectedCancellation(null)}
                  contentClassName="max-w-[min(100%,80rem)] w-full"
                  footer={
                    <Button variant="ghost" onClick={() => setSelectedCancellation(null)}>
                      Close
                    </Button>
                  }
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Cancellation No</p>
                        <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{c.cancellationNo}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Status</p>
                        {getStatusBadge(c.status)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Cancellation Date</p>
                        <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                          {formatSlDate(c.cancellationDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Delivered Date</p>
                        <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                          {c.deliveredDate ? formatSlDate(c.deliveredDate) : '-'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Delivery No</p>
                      <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{c.deliveryNo}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Showroom</p>
                      <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{c.outletName || c.outlet?.name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Reason</p>
                      <p className="text-sm" style={{ color: 'var(--foreground)' }}>{c.reason}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Created / Updated</p>
                      <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                        {formatSlDate(c.createdAt)} • {formatSlDate(c.updatedAt)}
                      </p>
                    </div>
                    {(c.approvedByName || c.rejectedByName) && (
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Approved/Rejected By</p>
                        <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                          {c.status === 'Approved' && c.approvedByName &&
                            `${c.approvedByName} • ${c.approvedDate ? formatSlDate(c.approvedDate) : ''}`
                          }
                          {c.status === 'Rejected' && c.rejectedByName &&
                            `${c.rejectedByName} • ${c.rejectedDate ? formatSlDate(c.rejectedDate) : ''}`
                          }
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
