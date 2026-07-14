'use client';

import { useState, useMemo, useEffect, useCallback, useRef, memo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { InlineDetailPanel } from '@/components/ui/inline-detail-panel';
import Select from '@/components/ui/select';
import { Plus, Search, Edit, Eye, EyeOff, Printer, CheckCircle, XCircle, Clock, Info, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { deliveriesApi, type Delivery } from '@/lib/api/deliveries';
import { printDeliveries } from '@/lib/print-delivery-notes';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useThemeStore } from '@/lib/stores/theme-store';
import { todayISO, isAdminUser } from '@/lib/date-restrictions';
import { usePermissions } from '@/hooks/usePermissions';
import toast from 'react-hot-toast';
import { ProtectedPage } from '@/components/auth';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { formatSlDate, formatSlDateTime } from '@/lib/sri-lanka-time';

const PRINT_CATALOG_MAX = 10_000;

function isDeliveryInNoRange(no: string, fromNo: string, toNo: string): boolean {
  const lo = fromNo.localeCompare(toNo) <= 0 ? fromNo : toNo;
  const hi = fromNo.localeCompare(toNo) <= 0 ? toNo : fromNo;
  return no.localeCompare(lo) >= 0 && no.localeCompare(hi) <= 0;
}

// Memoized search input to prevent re-renders
const SearchInput = memo(({ 
  value, 
  onChange, 
  placeholder = "Search records",
  inputRef 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  placeholder?: string;
  inputRef?: React.RefObject<HTMLInputElement>;
}) => (
  <div className="relative w-full sm:w-auto">
    <Search
      className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform"
      style={{ color: 'var(--muted-foreground)' }}
    />
    <input
      ref={inputRef}
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autoComplete="off"
      className="w-full rounded-lg py-2 pr-4 pl-10 text-sm sm:w-64"
      style={{ border: '1px solid var(--input)' }}
    />
  </div>
));

export default function DeliveryPage() {
  return (
    <ProtectedPage permission="operation:delivery:view">
      <DeliveryPageContent />
    </ProtectedPage>
  );
}

function DeliveryPageContent() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAdmin = isAdminUser(user);
  const { canAction } = usePermissions();
  const canCreate = canAction('/operation/delivery', 'create');
  const canEditDelivery = canAction('/operation/delivery', 'edit');
  const canViewPreviousRecords = canAction('/operation/delivery', 'view-history') || isAdmin;
  const pageTheme = useThemeStore((s) => s.getPageTheme('delivery'));

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [showPreviousRecords, setShowPreviousRecords] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printCatalog, setPrintCatalog] = useState<Delivery[]>([]);
  const [printLoadingCatalog, setPrintLoadingCatalog] = useState(false);
  const [printFromNo, setPrintFromNo] = useState('');
  const [printToNo, setPrintToNo] = useState('');
  const [printRunning, setPrintRunning] = useState(false);
  const [printCatalogCapped, setPrintCatalogCapped] = useState(false);

  const filterDeliveryForCatalog = useCallback(
    (d: Delivery) => {
      const today = todayISO();
      const datePart = (d.deliveryDate ?? '').slice(0, 10);
      return (
        isAdmin ||
        (d.createdById === user?.id && (showPreviousRecords || datePart >= today))
      );
    },
    [isAdmin, user?.id, showPreviousRecords]
  );

  useEffect(() => {
    if (!printModalOpen) return;
    let cancelled = false;
    (async () => {
      setPrintLoadingCatalog(true);
      setPrintCatalogCapped(false);
      try {
        const first = await deliveriesApi.getAll(1, 1, {});
        if (cancelled) return;
        const capped = (first.totalCount ?? 0) > PRINT_CATALOG_MAX;
        setPrintCatalogCapped(capped);
        const total = Math.min(first.totalCount ?? 0, PRINT_CATALOG_MAX);
        const pageSize = Math.max(total, 1);
        const res = await deliveriesApi.getAll(1, pageSize, {});
        if (cancelled) return;
        const raw = res.deliveries || [];
        const sorted = [...raw]
          .filter(filterDeliveryForCatalog)
          .sort((a, b) =>
            (a.deliveryNo || '').localeCompare(b.deliveryNo || '', undefined, {
              numeric: true,
              sensitivity: 'base',
            })
          );
        setPrintCatalog(sorted);
        if (sorted.length > 0) {
          setPrintFromNo(sorted[0].deliveryNo);
          setPrintToNo(sorted[sorted.length - 1].deliveryNo);
        } else {
          setPrintFromNo('');
          setPrintToNo('');
        }
      } catch (e: any) {
        if (!cancelled) {
          toast.error(e.response?.data?.message || 'Failed to load delivery numbers');
          setPrintCatalog([]);
          setPrintFromNo('');
          setPrintToNo('');
        }
      } finally {
        if (!cancelled) setPrintLoadingCatalog(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [printModalOpen, filterDeliveryForCatalog]);

  const printSelectOptions = useMemo(
    () =>
      printCatalog.map((d) => ({
        value: d.deliveryNo,
        label: `${d.deliveryNo} · ${formatSlDate(d.deliveryDate)} · ${d.outletName || d.outlet?.name || '—'} · ${d.status}`,
      })),
    [printCatalog]
  );

  const printSelectionCount = useMemo(() => {
    if (!printFromNo || !printToNo || !printCatalog.length) return 0;
    return printCatalog.filter((d) => isDeliveryInNoRange(d.deliveryNo, printFromNo, printToNo)).length;
  }, [printCatalog, printFromNo, printToNo]);

  const handlePrintRangeConfirm = async () => {
    if (!printFromNo || !printToNo) {
      toast.error('Select both “from” and “to” delivery numbers');
      return;
    }
    const selected = printCatalog.filter((d) => isDeliveryInNoRange(d.deliveryNo, printFromNo, printToNo));
    if (selected.length === 0) {
      toast.error('No deliveries fall in that delivery number range');
      return;
    }
    selected.sort((a, b) =>
      (a.deliveryNo || '').localeCompare(b.deliveryNo || '', undefined, {
        numeric: true,
        sensitivity: 'base',
      })
    );
    setPrintRunning(true);
    const tid = toast.loading(`Preparing ${selected.length} delivery note(s)…`);
    try {
      const fullList = await Promise.all(selected.map((d) => deliveriesApi.getById(d.id)));
      toast.dismiss(tid);
      if (!printDeliveries(fullList)) {
        toast.error('Could not open print window. Allow pop-ups for this site.');
      } else {
        setPrintModalOpen(false);
      }
    } catch (e: any) {
      toast.dismiss(tid);
      toast.error(e.response?.data?.message || 'Failed to load deliveries for printing');
    } finally {
      setPrintRunning(false);
    }
  };

  const fetchDeliveries = async () => {
    try {
      setIsLoading(true);
      const filters: Record<string, string> = {};
      if (statusFilter) filters.status = statusFilter;

      const response = await deliveriesApi.getAll(currentPage, pageSize, filters);
      setDeliveries(response.deliveries || []);
      setTotalPages(response.totalPages || 1);
    } catch (error: any) {
      const isNetwork =
        error?.code === 'ERR_NETWORK' || error?.message === 'Network Error';
      toast.error(
        isNetwork
          ? 'Could not connect to the server. Check your connection and try again.'
          : error.response?.data?.message || 'Failed to load deliveries'
      );
      setDeliveries([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, [currentPage, pageSize, statusFilter]);

  const filteredDeliveries = useMemo(() => {
    const today = todayISO();
    return deliveries.filter((d) => {
      const matchesSearch =
        d.deliveryNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.outlet?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole =
        isAdmin ||
        (d.createdById === user?.id && (showPreviousRecords || (d.deliveryDate ?? '') >= today));
      return matchesSearch && matchesRole;
    });
  }, [deliveries, searchTerm, isAdmin, user, showPreviousRecords]);

  const paginatedDeliveries = filteredDeliveries;

  const handleSubmit = async (id: string) => {
    try {
      await deliveriesApi.submit(id);
      toast.success('Delivery submitted for approval');
      fetchDeliveries();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit delivery');
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
        return (
          <Badge variant="neutral" size="sm">
            {status}
          </Badge>
        );
    }
  };

  const columns = [
    {
      key: 'deliveryDate',
      label: 'Delivery Date',
      render: (item: Delivery) => (
        <span className="font-medium">{formatSlDate(item.deliveryDate)}</span>
      ),
    },
    {
      key: 'deliveryNo',
      label: 'Delivery No',
      render: (item: Delivery) => (
        <span className="font-mono font-semibold" style={{ color: pageTheme?.secondaryColor || '#C8102E' }}>
          {item.deliveryNo}
        </span>
      ),
    },
    {
      key: 'showroom',
      label: 'Showroom',
      render: (item: Delivery) => (
        <span className="font-medium">{item.outletName || item.outlet?.name || '-'}</span>
      ),
    },
    {
      key: 'totalItems',
      label: 'Items',
      render: (item: Delivery) => <span className="font-semibold">{item.totalItems || 0}</span>,
    },
    {
      key: 'totalValue',
      label: 'Total Value',
      render: (item: Delivery) => (
        <span className="font-semibold">Rs. {(item.totalValue || 0).toLocaleString()}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item: Delivery) => getStatusBadge(item.status),
    },
    {
      key: 'createdBy',
      label: 'Created By',
      render: (item: Delivery) => <span className="text-sm">{item.createdByName || '-'}</span>,
    },
    {
      key: 'updatedAt',
      label: 'Updated At',
      render: (item: Delivery) => (
        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {formatSlDate(item.updatedAt)}
        </span>
      ),
    },
    {
      key: 'approvedBy',
      label: 'Approved/Rejected By',
      render: (item: Delivery) => (
        <span className="text-sm">{item.approvedByName || item.approvedBy?.fullName || '-'}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: Delivery) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={async () => {
              try {
                if (selectedDelivery?.id === item.id) {
                  setSelectedDelivery(null);
                  return;
                }
                const fullDelivery = await deliveriesApi.getById(item.id);
                setSelectedDelivery(fullDelivery);
              } catch (error: any) {
                console.error('Error loading delivery:', error);
                toast.error('Failed to load delivery details');
              }
            }}
            className="rounded p-1.5 transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            title={selectedDelivery?.id === item.id ? 'Hide details' : 'View details'}
          >
            {selectedDelivery?.id === item.id ? (
              <Eye className="h-4 w-4" aria-hidden />
            ) : (
              <EyeOff className="h-4 w-4" aria-hidden />
            )}
          </button>
          {item.status === 'Pending' && canEditDelivery && (
            <>
              <button
                onClick={() => router.push(`/operation/delivery/edit/${item.id}`)}
                className="rounded p-1.5 transition-colors"
                style={{ color: 'var(--muted-foreground)' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                title="Edit"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
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
          <button
            onClick={async () => {
              try {
                const full = await deliveriesApi.getById(item.id);
                if (!printDeliveries([full])) {
                  toast.error('Could not open print window. Allow pop-ups for this site.');
                }
              } catch (error: any) {
                toast.error(error.response?.data?.message || 'Failed to load delivery for printing');
              }
            }}
            className="rounded p-1.5 transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            title="Print DN"
          >
            <Printer className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            Delivery
          </h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Create and track deliveries ({filteredDeliveries.length} in view)
          </p>
          <div className="mt-2">
            <Badge variant={isAdmin ? 'primary' : 'neutral'} size="sm">
              <Info className="mr-1 h-3 w-3" />
              {isAdmin
                ? 'Admin: All records visible. Any date allowed.'
                : 'You see your own records for today/future only.'}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {!isAdmin && canViewPreviousRecords && (
            <Button
              variant={showPreviousRecords ? 'primary' : 'secondary'}
              size="md"
              onClick={() => setShowPreviousRecords(!showPreviousRecords)}
            >
              {showPreviousRecords ? 'Hide Previous Records' : 'Show Previous Records'}
            </Button>
          )}
          {canCreate && (
            <Button variant="primary" size="md" onClick={() => router.push('/operation/delivery/add')}>
              <Plus className="mr-2 h-4 w-4" />
              Add Delivery
            </Button>
          )}
          <Button
            variant="secondary"
            size="md"
            onClick={() => setPrintModalOpen(true)}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print Delivery Notes
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <CardTitle>Delivery List</CardTitle>
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
              <SearchInput 
                value={searchTerm}
                onChange={handleSearchChange}
                inputRef={searchInputRef}
              />
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
              data={paginatedDeliveries}
              columns={columns}
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              expandedRowKey={selectedDelivery?.id ?? null}
              getRowKey={(row) => row.id}
              renderExpandedRow={() =>
                selectedDelivery ? (
                  <InlineDetailPanel
                    title="Delivery Details"
                    open
                    onClose={() => setSelectedDelivery(null)}
                    contentClassName="max-w-[min(100%,80rem)] w-full"
                    footer={
                      <>
                        <Button variant="ghost" onClick={() => setSelectedDelivery(null)}>
                          Close
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            if (!selectedDelivery) return;
                            if (!printDeliveries([selectedDelivery])) {
                              toast.error('Could not open print window. Allow pop-ups for this site.');
                            }
                          }}
                        >
                          <Printer className="mr-2 h-4 w-4" />
                          Print DN
                        </Button>
                      </>
                    }
                  >
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                            Delivery No
                          </p>
                          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                            {selectedDelivery.deliveryNo}
                          </p>
                        </div>
                        <div>
                          <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                            Delivery Date
                          </p>
                          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                            {formatSlDate(selectedDelivery.deliveryDate)}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                            Showroom
                          </p>
                          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                            {selectedDelivery.outletName || selectedDelivery.outlet?.name || '-'}
                          </p>
                        </div>
                        <div>
                          <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                            Status
                          </p>
                          {getStatusBadge(selectedDelivery.status)}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                            Total Items
                          </p>
                          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                            {selectedDelivery.totalItems || 0}
                          </p>
                        </div>
                        <div>
                          <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                            Total Value
                          </p>
                          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                            Rs. {(selectedDelivery.totalValue || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                          Created / Updated
                        </p>
                        <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                          {formatSlDate(selectedDelivery.createdAt)} -{' '}
                          {formatSlDate(selectedDelivery.updatedAt)}
                        </p>
                      </div>
                      {(selectedDelivery.approvedByName || selectedDelivery.approvedBy) && (
                        <div>
                          <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                            Approved By / Date
                          </p>
                          <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                            {selectedDelivery.approvedByName || selectedDelivery.approvedBy?.fullName} •{' '}
                            {formatSlDate(selectedDelivery.approvedDate!)}
                          </p>
                        </div>
                      )}
                      {selectedDelivery.notes && (
                        <div>
                          <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                            Notes
                          </p>
                          <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                            {selectedDelivery.notes}
                          </p>
                        </div>
                      )}

                      <div className="border-t pt-4">
                        <h4 className="mb-3 text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                          Delivery items
                        </h4>
                        {selectedDelivery.items && selectedDelivery.items.length > 0 ? (
                          <div className="overflow-hidden rounded-lg border">
                            <table className="w-full">
                              <thead style={{ backgroundColor: 'var(--muted)' }}>
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-semibold">Product</th>
                                  <th className="px-3 py-2 text-right text-xs font-semibold">Quantity</th>
                                  <th className="px-3 py-2 text-right text-xs font-semibold">Unit Price</th>
                                  <th className="px-3 py-2 text-right text-xs font-semibold">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedDelivery.items.map((line: any, index: number) => (
                                  <tr key={index} className="border-t">
                                    <td className="px-3 py-2 text-xs">
                                      <div>
                                        <p className="font-medium">
                                          {line.productName || line.product?.name || 'Unknown Product'}
                                        </p>
                                        {line.product?.code && (
                                          <p className="text-muted-foreground">{line.product.code}</p>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-3 py-2 text-right text-xs">
                                      {Number(line.quantity).toLocaleString()}
                                    </td>
                                    <td className="px-3 py-2 text-right text-xs">
                                      Rs.{' '}
                                      {Number(line.unitPrice).toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </td>
                                    <td className="px-3 py-2 text-right text-xs font-semibold">
                                      Rs.{' '}
                                      {Number(line.total).toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot className="border-t" style={{ backgroundColor: 'var(--muted)' }}>
                                <tr>
                                  <td className="px-3 py-2 text-xs font-bold">Total</td>
                                  <td className="px-3 py-2 text-right text-xs font-bold">
                                    {selectedDelivery.totalItems || 0} items
                                  </td>
                                  <td className="px-3 py-2"></td>
                                  <td
                                    className="px-3 py-2 text-right text-xs font-bold"
                                    style={{ color: pageTheme?.primaryColor || '#C8102E' }}
                                  >
                                    Rs. {(selectedDelivery.totalValue || 0).toLocaleString()}
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        ) : (
                          <div
                            className="rounded-lg border py-8 text-center text-sm"
                            style={{
                              backgroundColor: 'var(--muted)',
                              color: 'var(--muted-foreground)',
                            }}
                          >
                            No line items on this delivery.
                          </div>
                        )}
                      </div>
                    </div>
                  </InlineDetailPanel>
                ) : null
              }
            />
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={printModalOpen}
        onClose={() => !printRunning && setPrintModalOpen(false)}
        title="Print delivery notes"
        size="md"
      >
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Choose the delivery number range to print. Every delivery whose number falls between
          “from” and “to” (inclusive) will be included. If “from” is greater than “to”, the range is
          applied in reverse order.
        </p>

        {printLoadingCatalog ? (
          <div className="flex items-center justify-center gap-2 py-10">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Loading delivery numbers…
            </span>
          </div>
        ) : printCatalog.length === 0 ? (
          <p className="py-6 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            No deliveries are available to print with your current access. Try turning on
            &quot;Show previous records&quot; if you are not an administrator, or check that
            deliveries exist.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            <Select
              label="From delivery no."
              value={printFromNo}
              onChange={(e) => setPrintFromNo(e.target.value)}
              options={printSelectOptions}
              fullWidth
            />
            <Select
              label="To delivery no."
              value={printToNo}
              onChange={(e) => setPrintToNo(e.target.value)}
              options={printSelectOptions}
              fullWidth
            />
            <p className="rounded-md px-3 py-2 text-sm" style={{ backgroundColor: 'var(--muted)' }}>
              <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
                {printSelectionCount}
              </span>{' '}
              delivery note{printSelectionCount === 1 ? '' : 's'} will be printed.
            </p>
            {printCatalogCapped && (
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Only the first {PRINT_CATALOG_MAX.toLocaleString()} deliveries (by server order) are
                loaded for this list. Contact support if you need a larger range in one run.
              </p>
            )}
          </div>
        )}

        <ModalFooter>
          <Button variant="ghost" disabled={printRunning} onClick={() => setPrintModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={
              printRunning ||
              printLoadingCatalog ||
              printCatalog.length === 0 ||
              !printFromNo ||
              !printToNo ||
              printSelectionCount === 0
            }
            onClick={() => void handlePrintRangeConfirm()}
          >
            {printRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Preparing…
              </>
            ) : (
              <>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </>
            )}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
