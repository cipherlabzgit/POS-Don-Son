'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { InlineDetailPanel } from '@/components/ui/inline-detail-panel';
import { Plus, Search, Edit, Eye, EyeOff, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Select from '@/components/ui/select';
import { deliveryReturnsApi, type DeliveryReturn } from '@/lib/api/delivery-returns';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useThemeStore } from '@/lib/stores/theme-store';
import { isAdminUser, todayISO } from '@/lib/date-restrictions';
import { usePermissions } from '@/hooks/usePermissions';
import { ProtectedPage } from '@/components/auth';
import toast from 'react-hot-toast';
import { formatSlDate, formatSlDateTime } from '@/lib/sri-lanka-time';

export default function DeliveryReturnPage() {
  return (
    <ProtectedPage permission="operation:delivery-return:view">
      <DeliveryReturnPageContent />
    </ProtectedPage>
  );
}

function DeliveryReturnPageContent() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAdmin = isAdminUser(user);
  const { canAction } = usePermissions();
  const canCreate = canAction('/operation/delivery-return', 'create');
  const canEditReturn = canAction('/operation/delivery-return', 'edit');
  const pageTheme = useThemeStore((s) => s.getPageTheme('delivery-return'));

  const [returns, setReturns] = useState<DeliveryReturn[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReturn, setSelectedReturn] = useState<DeliveryReturn | null>(null);
  const [showPreviousRecords, setShowPreviousRecords] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchReturns();
  }, [currentPage, pageSize, statusFilter]);

  const fetchReturns = async () => {
    try {
      setIsLoading(true);
      const filters: Record<string, string> = {};
      if (statusFilter) filters.status = statusFilter;

      const response = await deliveryReturnsApi.getAll(currentPage, pageSize, filters);
      setReturns(response.deliveryReturns || []);
      setTotalPages(response.totalPages || 1);
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string; response?: { data?: { message?: string } } };
      const isNetwork = err?.code === 'ERR_NETWORK' || err?.message === 'Network Error';
      toast.error(
        isNetwork
          ? 'Could not connect to the server. Check your connection and try again.'
          : err.response?.data?.message || 'Failed to load delivery returns',
      );
      setReturns([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReturns = useMemo(() => {
    const today = todayISO();
    const q = searchTerm.toLowerCase().trim();
    return returns.filter((r) => {
      const blob = [
        r.returnNo,
        r.deliveryNo,
        r.outletName,
        r.outlet?.name,
        r.createdByName,
        r.approvedByName,
        r.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchesSearch = !q || blob.includes(q);
      const matchesRole =
        isAdmin || (r.createdById === user?.id && (showPreviousRecords || r.returnDate === today));
      return matchesSearch && matchesRole;
    });
  }, [returns, searchTerm, isAdmin, user, showPreviousRecords]);

  const handleSubmit = async (id: string) => {
    try {
      await deliveryReturnsApi.submit(id);
      toast.success('Delivery return submitted for approval');
      fetchReturns();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to submit delivery return');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
      case 'Processed':
        return (
          <Badge variant="success" size="sm">
            <CheckCircle className="mr-1 h-3 w-3" />
            {status}
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
        return (
          <Badge variant="neutral" size="sm">
            {status}
          </Badge>
        );
    }
  };

  const columns = [
    {
      key: 'no',
      label: 'No',
      render: (item: DeliveryReturn) => (
        <span className="font-mono font-semibold" style={{ color: pageTheme?.secondaryColor || '#C8102E' }}>
          {item.returnNo}
        </span>
      ),
    },
    {
      key: 'returnDate',
      label: 'Return Date',
      render: (item: DeliveryReturn) => (
        <span className="font-medium">{formatSlDate(item.returnDate)}</span>
      ),
    },
    {
      key: 'showroom',
      label: 'Showroom',
      render: (item: DeliveryReturn) => (
        <span className="font-medium">{item.outletName || item.outlet?.name || '-'}</span>
      ),
    },
    {
      key: 'submittedAt',
      label: 'Submitted Date & Time',
      render: (item: DeliveryReturn) => (
        <span className="text-sm">
          {formatSlDateTime(item.createdAt, { dateStyle: 'short',
            timeStyle: 'short', })}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item: DeliveryReturn) => getStatusBadge(item.status),
    },
    {
      key: 'createdBy',
      label: 'Created By',
      render: (item: DeliveryReturn) => <span className="text-sm">{item.createdByName || '-'}</span>,
    },
    {
      key: 'approvedBy',
      label: 'Approved By',
      render: (item: DeliveryReturn) => <span className="text-sm">{item.approvedByName || '-'}</span>,
    },
    {
      key: 'actions',
      label: 'Action',
      render: (item: DeliveryReturn) => (
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={async () => {
              try {
                const detail = await deliveryReturnsApi.getById(item.id);
                const raw = detail as unknown as { data?: DeliveryReturn };
                const data = raw?.data ?? (detail as DeliveryReturn);
                if (selectedReturn?.id === item.id) {
                  setSelectedReturn(null);
                  return;
                }
                setSelectedReturn(data);
              } catch {
                toast.error('Failed to load delivery return details');
              }
            }}
            className="rounded p-1.5 transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F9FAFB';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title={selectedReturn?.id === item.id ? 'Hide details' : 'View details'}
          >
            {selectedReturn?.id === item.id ? (
              <Eye className="h-4 w-4" aria-hidden />
            ) : (
              <EyeOff className="h-4 w-4" aria-hidden />
            )}
          </button>
          {item.status === 'Pending' && canEditReturn && (
            <>
              <button
                type="button"
                onClick={() => router.push(`/operation/delivery-return/edit/${item.id}`)}
                className="rounded p-1.5 transition-colors"
                style={{ color: 'var(--muted-foreground)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F9FAFB';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title="Edit"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(item.id)}
                className="rounded p-1.5 transition-colors"
                style={{ color: '#3B82F6' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#EFF6FF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
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
    <div className="space-y-4 p-4 sm:p-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
          Delivery Returns
        </h1>
        <p className="mt-0.5 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Process delivery returns ({filteredReturns.length} in view)
        </p>
      </div>

      <Card padding="sm">
        <CardHeader className="mb-0 !pb-3 pt-0">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-lg">Delivery Returns</CardTitle>
              {!isAdmin && (
                <Button
                  variant={showPreviousRecords ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setShowPreviousRecords(!showPreviousRecords)}
                >
                  {showPreviousRecords ? 'Today only' : 'Show previous'}
                </Button>
              )}
            </div>
            <div className="flex w-full flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto">
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: '', label: 'All status' },
                  { value: 'Pending', label: 'Pending' },
                  { value: 'Approved', label: 'Approved' },
                  { value: 'Processed', label: 'Processed' },
                ]}
                className="min-w-[8.5rem]"
              />
              <div className="relative min-w-0 flex-1 sm:min-w-[12rem] sm:max-w-xs">
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
                  className="w-full rounded-lg py-2 pr-4 pl-10 text-sm"
                  style={{ border: '1px solid var(--input)' }}
                />
              </div>
              {canCreate && (
                <Button variant="primary" size="md" onClick={() => router.push('/operation/delivery-return/add')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Return
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
              data={filteredReturns}
              columns={columns}
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              emptyMessage="No delivery return records."
              expandedRowKey={selectedReturn?.id ?? null}
              getRowKey={(row) => row.id}
              renderExpandedRow={(ret) => (
                <InlineDetailPanel
                  title="Delivery Return Details"
                  open
                  onClose={() => setSelectedReturn(null)}
                  contentClassName="max-w-[min(100%,80rem)] w-full"
                  footer={
                    <Button variant="ghost" onClick={() => setSelectedReturn(null)}>
                      Close
                    </Button>
                  }
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                          Return No
                        </p>
                        <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                          {ret.returnNo}
                        </p>
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                          Status
                        </p>
                        {getStatusBadge(ret.status)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                          Return Date
                        </p>
                        <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                          {formatSlDate(ret.returnDate)}
                        </p>
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                          Delivered Date
                        </p>
                        <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                          {ret.deliveredDate ? formatSlDate(ret.deliveredDate) : '-'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                        Delivery No
                      </p>
                      <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                        {ret.deliveryNo}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                        Showroom
                      </p>
                      <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                        {ret.outletName || ret.outlet?.name || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                        Total Items
                      </p>
                      <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                        {ret.totalItems}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                        Reason
                      </p>
                      <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                        {ret.reason}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                        Created / Updated
                      </p>
                      <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                        {formatSlDate(ret.createdAt)} • {formatSlDate(ret.updatedAt)}
                      </p>
                    </div>
                    {ret.approvedByName && (
                      <div>
                        <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                          Approved By
                        </p>
                        <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                          {ret.approvedByName}{' '}
                          {ret.approvedDate ? `• ${formatSlDate(ret.approvedDate)}` : ''}
                        </p>
                      </div>
                    )}
                    {ret.items && ret.items.length > 0 && (
                      <div className="border-t pt-4">
                        <p className="mb-2 text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                          Returned items
                        </p>
                        <div className="overflow-hidden rounded-lg border" style={{ borderColor: 'var(--border)' }}>
                          <table className="w-full">
                            <thead style={{ backgroundColor: 'var(--muted)' }}>
                              <tr>
                                <th
                                  className="px-4 py-3 text-left text-xs font-semibold"
                                  style={{ color: 'var(--foreground)' }}
                                >
                                  Product
                                </th>
                                <th
                                  className="px-4 py-3 text-right text-xs font-semibold"
                                  style={{ color: 'var(--foreground)' }}
                                >
                                  Quantity
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {ret.items.map((line) => (
                                <tr key={line.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--foreground)' }}>
                                    <span className="font-medium">
                                      {line.product?.name ?? (line as { productName?: string }).productName ?? '—'}
                                    </span>
                                    {line.product?.code ? (
                                      <span className="mt-0.5 block text-xs" style={{ color: 'var(--muted-foreground)' }}>
                                        {line.product.code}
                                      </span>
                                    ) : null}
                                  </td>
                                  <td
                                    className="px-4 py-3 text-right text-sm font-medium"
                                    style={{ color: 'var(--foreground)' }}
                                  >
                                    {Number(line.quantity).toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
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
