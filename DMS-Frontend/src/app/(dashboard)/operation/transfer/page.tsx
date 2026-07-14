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
import { transfersApi, type Transfer } from '@/lib/api/transfers';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useThemeStore } from '@/lib/stores/theme-store';
import { isAdminUser, addDaysISO, getDateBounds } from '@/lib/date-restrictions';
import { usePermissions } from '@/hooks/usePermissions';
import { ProtectedPage } from '@/components/auth';
import toast from 'react-hot-toast';
import { formatSlDate, formatSlDateTime } from '@/lib/sri-lanka-time';

export default function TransferPage() {
  return (
    <ProtectedPage permission="operation:transfer:view">
      <TransferPageContent />
    </ProtectedPage>
  );
}

function TransferPageContent() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAdmin = isAdminUser(user);
  const { canAction } = usePermissions();
  const canCreate = canAction('/operation/transfer', 'create');
  const canEditTransfer = canAction('/operation/transfer', 'edit');
  const pageTheme = useThemeStore((s) => s.getPageTheme('transfer'));
  const dateBounds = getDateBounds('back-3-no-future', user as any, {
    allowBackDatePermission: 'operation:transfer:allow-back-date',
    allowFutureDatePermission: 'operation:transfer:allow-future-date',
  });

  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
  const [showPreviousRecords, setShowPreviousRecords] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTransfers();
  }, [currentPage, pageSize, statusFilter]);

  const fetchTransfers = async () => {
    try {
      setIsLoading(true);
      const filters: any = {};
      if (statusFilter) filters.status = statusFilter;
      
      const response = await transfersApi.getAll(currentPage, pageSize, filters);
      setTransfers(response.transfers || []);
      setTotalPages(response.totalPages || 1);
    } catch (error: any) {
      const isNetwork =
        error?.code === 'ERR_NETWORK' || error?.message === 'Network Error';
      toast.error(
        isNetwork
          ? 'Could not connect to the server. Check your connection and try again.'
          : error.response?.data?.message || 'Failed to load transfers'
      );
      setTransfers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTransfers = useMemo(() => {
    const minDate = dateBounds.min || addDaysISO(-3);
    const q = searchTerm.toLowerCase().trim();
    return transfers.filter((t) => {
      const blob = [
        t.transferNo,
        t.fromOutlet?.name,
        t.fromOutlet?.code,
        t.fromOutletName,
        t.toOutlet?.name,
        t.toOutlet?.code,
        t.toOutletName,
        t.createdByName,
        t.approvedByName,
        t.approvedBy?.fullName,
        t.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchesSearch = !q || blob.includes(q);
      const matchesRole =
        isAdmin ||
        (t.createdById === user?.id && (showPreviousRecords || t.transferDate >= minDate));
      return matchesSearch && matchesRole;
    });
  }, [transfers, searchTerm, isAdmin, user, showPreviousRecords, dateBounds]);

  const paginatedTransfers = filteredTransfers;

  const handleSubmit = async (id: string) => {
    try {
      await transfersApi.submit(id);
      toast.success('Transfer submitted for approval');
      fetchTransfers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit transfer');
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
      render: (item: Transfer) => (
        <span className="font-mono font-semibold" style={{ color: pageTheme?.secondaryColor || '#C8102E' }}>
          {item.transferNo}
        </span>
      ),
    },
    {
      key: 'transferDate',
      label: 'Transfer Date',
      render: (item: Transfer) => (
        <span className="font-medium">{formatSlDate(item.transferDate)}</span>
      ),
    },
    {
      key: 'fromShowroom',
      label: 'Showroom From',
      render: (item: Transfer) => (
        <span className="font-medium">{item.fromOutletName || item.fromOutlet?.name || '-'}</span>
      ),
    },
    {
      key: 'toShowroom',
      label: 'Showroom To',
      render: (item: Transfer) => (
        <span className="font-medium">{item.toOutletName || item.toOutlet?.name || '-'}</span>
      ),
    },
    {
      key: 'submittedAt',
      label: 'Submitted Date & Time',
      render: (item: Transfer) => (
        <span className="text-sm">
          {formatSlDateTime(item.createdAt, { dateStyle: 'short',
            timeStyle: 'short', })}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item: Transfer) => getStatusBadge(item.status),
    },
    {
      key: 'createdBy',
      label: 'Created By',
      render: (item: Transfer) => (
        <span className="text-sm">{item.createdByName || '-'}</span>
      ),
    },
    {
      key: 'approvedBy',
      label: 'Approved By',
      render: (item: Transfer) => (
        <span className="text-sm">{item.approvedByName || item.approvedBy?.fullName || '-'}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Action',
      render: (item: Transfer) => (
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={async () => {
              try {
                if (selectedTransfer?.id === item.id) {
                  setSelectedTransfer(null);
                  return;
                }
                const fullTransfer = await transfersApi.getById(item.id);
                setSelectedTransfer(fullTransfer);
              } catch (error: any) {
                toast.error(error.response?.data?.message || 'Failed to load transfer details');
              }
            }}
            className="rounded p-1.5 transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            title={selectedTransfer?.id === item.id ? 'Hide details' : 'View details'}
          >
            {selectedTransfer?.id === item.id ? (
              <Eye className="h-4 w-4" aria-hidden />
            ) : (
              <EyeOff className="h-4 w-4" aria-hidden />
            )}
          </button>
          {item.status === 'Pending' && canEditTransfer && (
            <>
              <button
                type="button"
                onClick={() => router.push(`/operation/transfer/edit/${item.id}`)}
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
            Transfer
          </h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Manage stock transfers between showrooms ({filteredTransfers.length} in view)
          </p>
          <div className="mt-2">
            <Badge variant={isAdmin ? 'primary' : 'neutral'} size="sm">
              <Info className="mr-1 h-3 w-3" />
              {isAdmin
                ? 'Admin: All records visible. Any date allowed.'
                : 'You see your own transfers. Back date up to 3 days, no future date.'}
            </Badge>
          </div>
        </div>
        {!isAdmin ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant={showPreviousRecords ? 'primary' : 'secondary'}
              size="md"
              onClick={() => setShowPreviousRecords(!showPreviousRecords)}
            >
              {showPreviousRecords ? 'Hide Previous Records' : 'Show Previous Records'}
            </Button>
          </div>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <CardTitle>Transfer</CardTitle>
            <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
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
              {canCreate && (
                <Button variant="primary" size="md" onClick={() => router.push('/operation/transfer/add')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Transfer
                </Button>
              )}
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
              data={paginatedTransfers}
              columns={columns}
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              emptyMessage="No transfer records."
              expandedRowKey={selectedTransfer?.id ?? null}
              getRowKey={(row) => row.id}
              renderExpandedRow={(transfer) => (
                <InlineDetailPanel
                  title="Transfer Details"
                  open
                  onClose={() => setSelectedTransfer(null)}
                  contentClassName="max-w-[min(100%,80rem)] w-full"
                  footer={
                    <Button variant="ghost" onClick={() => setSelectedTransfer(null)}>
                      Close
                    </Button>
                  }
                >
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Transfer No</p>
                        <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{transfer.transferNo}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Status</p>
                        {getStatusBadge(transfer.status)}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Transfer Date</p>
                      <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                        {formatSlDate(transfer.transferDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Submitted date &amp; time</p>
                      <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                        {formatSlDateTime(transfer.createdAt, { dateStyle: 'short',
                          timeStyle: 'short', })}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Showroom From</p>
                        <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{transfer.fromOutletName || transfer.fromOutlet?.name || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Showroom To</p>
                        <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{transfer.toOutletName || transfer.toOutlet?.name || '-'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Total Items</p>
                      <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{transfer.totalItems || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Created / Updated</p>
                      <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                        {formatSlDate(transfer.createdAt)} • {formatSlDate(transfer.updatedAt)}
                      </p>
                    </div>
                    {transfer.notes && (
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Notes</p>
                        <p className="text-sm" style={{ color: 'var(--foreground)' }}>{transfer.notes}</p>
                      </div>
                    )}

                    <div className="border-t pt-4">
                      <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--foreground)' }}>Transfer Items</h3>
                      {transfer.items && transfer.items.length > 0 ? (
                        <div className="border rounded-lg overflow-hidden">
                          <table className="w-full">
                            <thead style={{ backgroundColor: 'var(--muted)' }}>
                              <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold">Product</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold">Quantity</th>
                              </tr>
                            </thead>
                            <tbody>
                              {transfer.items.map((line, index) => (
                                <tr key={index} className="border-t">
                                  <td className="px-4 py-3 text-sm">
                                    {line.productCode || line.product?.code} - {line.productName || line.product?.name}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-right">{line.quantity.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="border-t" style={{ backgroundColor: 'var(--muted)' }}>
                              <tr>
                                <td className="px-4 py-3 text-sm font-bold">Total</td>
                                <td className="px-4 py-3 text-sm text-right font-bold">
                                  {transfer.items.reduce((sum, line) => sum + line.quantity, 0).toFixed(2)}
                                </td>
                              </tr>
                              <tr>
                                <td colSpan={2} className="px-4 py-3 text-sm text-center text-muted-foreground">
                                  {transfer.items.length} items
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
