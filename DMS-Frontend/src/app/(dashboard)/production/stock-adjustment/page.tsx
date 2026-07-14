'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { InlineDetailPanel } from '@/components/ui/inline-detail-panel';
import { Plus, Search, Edit, Eye, EyeOff, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Select from '@/components/ui/select';
import { DateRangeFilter } from '@/components/ui/date-range-filter';
import { stockAdjustmentsApi, type StockAdjustment } from '@/lib/api/stock-adjustments';
import ProtectedPage from '@/components/auth/ProtectedPage';
import PermissionButton from '@/components/auth/PermissionButton';
import WorkflowButtons from '@/components/auth/WorkflowButtons';
import toast from 'react-hot-toast';
import { formatSlDate, formatSlDateTime } from '@/lib/sri-lanka-time';

function formatShortDate(iso: string | undefined) {
  if (!iso) return '';
  return formatSlDate(iso);
}

function approvalColumnText(item: StockAdjustment): string {
  if (item.status === 'Pending') return '—';
  if (item.status === 'Approved' && item.approvedByName) {
    const d = formatShortDate(item.approvedDate);
    return d ? `${item.approvedByName} - ${d}` : item.approvedByName;
  }
  if (item.status === 'Rejected') {
    const who = item.updatedByName || item.createdByName || '—';
    const d = formatShortDate(item.updatedAt);
    return d ? `${who} - ${d}` : who;
  }
  return '—';
}

function editUserName(item: StockAdjustment) {
  return item.updatedByName || item.createdByName || '—';
}

export default function StockAdjustmentPage() {
  const router = useRouter();
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedAdjustment, setSelectedAdjustment] = useState<StockAdjustment | null>(null);
  const [panelDetail, setPanelDetail] = useState<StockAdjustment | null>(null);
  const [loadingPanelDetail, setLoadingPanelDetail] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const filters: { status?: string; fromDate?: string; toDate?: string } = {};
      if (statusFilter) filters.status = statusFilter;
      if (fromDate) filters.fromDate = fromDate;
      if (toDate) filters.toDate = toDate;

      const response = await stockAdjustmentsApi.getAll(currentPage, pageSize, filters);
      setAdjustments(Array.isArray(response.data) ? response.data : []);
      setTotalPages(response.totalPages || 1);
      setTotalCount(response.totalCount || 0);
    } catch (error) {
      console.error('Failed to load stock adjustments:', error);
      toast.error('Failed to load stock adjustments');
      setAdjustments([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, statusFilter, fromDate, toDate]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!selectedAdjustment?.id) {
      setPanelDetail(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoadingPanelDetail(true);
        const d = await stockAdjustmentsApi.getById(selectedAdjustment.id);
        if (!cancelled) setPanelDetail(d);
      } catch (error) {
        console.error('Failed to load adjustment detail:', error);
        if (!cancelled) setPanelDetail(selectedAdjustment);
      } finally {
        if (!cancelled) setLoadingPanelDetail(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedAdjustment]);

  const handleSubmit = async (id: string) => {
    try {
      setIsSubmitting(true);
      await stockAdjustmentsApi.submit(id);
      toast.success('Stock adjustment submitted for approval');
      void fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('Failed to submit stock adjustment:', error);
      toast.error(err.response?.data?.message || 'Failed to submit stock adjustment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this stock adjustment?')) return;

    try {
      await stockAdjustmentsApi.delete(id);
      toast.success('Stock adjustment deleted successfully');
      setSelectedAdjustment(null);
      void fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('Failed to delete stock adjustment:', error);
      toast.error(err.response?.data?.message || 'Failed to delete stock adjustment');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return <Badge variant="success" size="sm">Approved</Badge>;
      case 'Rejected':
        return <Badge variant="danger" size="sm">Rejected</Badge>;
      case 'Pending':
        return <Badge variant="warning" size="sm">Pending</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  const filteredAdjustments = Array.isArray(adjustments)
    ? adjustments.filter((a) => {
        const q = searchTerm.toLowerCase();
        if (!q) return true;
        return (
          a.adjustmentNo?.toLowerCase().includes(q) ||
          a.product?.code?.toLowerCase().includes(q) ||
          a.product?.name?.toLowerCase().includes(q) ||
          a.createdByName?.toLowerCase().includes(q) ||
          a.updatedByName?.toLowerCase().includes(q) ||
          a.approvedByName?.toLowerCase().includes(q)
        );
      })
    : [];

  const openRow = (item: StockAdjustment) => {
    if (selectedAdjustment?.id === item.id) {
      setSelectedAdjustment(null);
    } else {
      setSelectedAdjustment(item);
    }
  };

  const columns = [
    {
      key: 'adjustmentDate',
      label: 'Date',
      render: (item: StockAdjustment) => (
        <span style={{ color: 'var(--muted-foreground)' }}>
          {formatSlDate(item.adjustmentDate)}
        </span>
      ),
    },
    {
      key: 'adjustmentNo',
      label: 'Display No',
      render: (item: StockAdjustment) => (
        <button
          type="button"
          className="cursor-pointer text-left font-semibold hover:underline"
          style={{ color: 'var(--brand-primary)' }}
          onClick={() => setSelectedAdjustment(item)}
          title="View product details"
        >
          {item.adjustmentNo}
        </button>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item: StockAdjustment) => getStatusBadge(item.status),
    },
    {
      key: 'editUser',
      label: 'Edit User',
      render: (item: StockAdjustment) => (
        <span style={{ color: 'var(--foreground)' }}>{editUserName(item)}</span>
      ),
    },
    {
      key: 'editDate',
      label: 'Edit Date',
      render: (item: StockAdjustment) => (
        <span style={{ color: 'var(--muted-foreground)' }}>
          {formatSlDateTime(item.updatedAt)}
        </span>
      ),
    },
    {
      key: 'approvedRejected',
      label: 'Approved / Rejected By',
      render: (item: StockAdjustment) => (
        <span className="text-sm" style={{ color: 'var(--foreground)' }}>
          {approvalColumnText(item)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: StockAdjustment) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => openRow(item)}
            className="rounded-full p-1.5 transition-colors"
            style={{ color: 'var(--muted-foreground)', backgroundColor: 'var(--muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--neutral-200)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--muted)';
            }}
            title={selectedAdjustment?.id === item.id ? 'Hide details' : 'View details'}
          >
            {selectedAdjustment?.id === item.id ? (
              <Eye className="h-4 w-4" aria-hidden />
            ) : (
              <EyeOff className="h-4 w-4" aria-hidden />
            )}
          </button>
          {item.status === 'Pending' && (
            <PermissionButton
              permission="production:stock-adjustment:update"
              onClick={() => router.push(`/production/stock-adjustment/edit/${item.id}`)}
              variant="ghost"
              size="sm"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </PermissionButton>
          )}
          {item.status === 'Pending' && (
            <PermissionButton
              permission="production:stock-adjustment:delete"
              variant="ghost"
              size="sm"
              className="min-w-0 p-1.5 text-[var(--status-error)] hover:opacity-90"
              title="Delete"
              onClick={() => void handleDelete(item.id)}
            >
              <Trash2 className="h-4 w-4" />
            </PermissionButton>
          )}
          <WorkflowButtons
            module="production:stock-adjustment"
            status={item.status as 'Pending' | 'Approved' | 'Rejected'}
            onSubmit={() => void handleSubmit(item.id)}
            isLoading={isSubmitting}
          />
        </div>
      ),
    },
  ];

  const displayAdjustment = panelDetail ?? selectedAdjustment;

  return (
    <ProtectedPage permission="production:stock-adjustment:view">
      <div className="space-y-6 p-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
              Stock Adjustment
            </h1>
            <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
              History Production Stock
            </p>
          </div>
          <div className="flex items-center gap-3">
            <PermissionButton
              permission="production:stock-adjustment:create"
              variant="primary"
              size="md"
              onClick={() => router.push('/production/stock-adjustment/add')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New
            </PermissionButton>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
                    Filters
                  </span>
                </div>
                <div className="flex items-center space-x-3">
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
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      autoComplete="off"
                      className="w-full rounded-lg py-2 pl-10 pr-4 text-sm sm:w-64"
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
              <div className="flex h-64 items-center justify-center">
                <div
                  className="h-8 w-8 animate-spin rounded-full border-2 border-transparent"
                  style={{ borderTopColor: 'var(--page-accent-color)', borderRightColor: 'var(--neutral-200)' }}
                />
              </div>
            ) : (
              <DataTable
                data={filteredAdjustments}
                columns={columns}
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalCount={totalCount}
                embedded
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                expandedRowKey={selectedAdjustment?.id ?? null}
                getRowKey={(row) => row.id}
                renderExpandedRow={() =>
                  selectedAdjustment && displayAdjustment ? (
                    <InlineDetailPanel
                      title="Stock Adjustment Details"
                      open
                      onClose={() => {
                        setSelectedAdjustment(null);
                        setPanelDetail(null);
                      }}
                      footer={
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setSelectedAdjustment(null);
                            setPanelDetail(null);
                          }}
                        >
                          Close
                        </Button>
                      }
                    >
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                              Display No
                            </p>
                            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                              {displayAdjustment.adjustmentNo}
                            </p>
                          </div>
                          <div>
                            <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                              Status
                            </p>
                            {getStatusBadge(displayAdjustment.status)}
                          </div>
                        </div>
                        <div>
                          <p className="mb-2 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                            Products in this request
                          </p>
                          {loadingPanelDetail ? (
                            <div className="flex justify-center py-6">
                              <div
                                className="h-8 w-8 animate-spin rounded-full border-2 border-transparent"
                                style={{
                                  borderTopColor: 'var(--brand-primary)',
                                  borderRightColor: 'var(--neutral-200)',
                                }}
                              />
                            </div>
                          ) : (
                            <div className="overflow-hidden rounded-lg border" style={{ borderColor: 'var(--border)' }}>
                              <table className="w-full text-sm">
                                <thead style={{ backgroundColor: 'var(--muted)' }}>
                                  <tr>
                                    <th className="px-3 py-2 text-left font-semibold">Product code</th>
                                    <th className="px-3 py-2 text-left font-semibold">Product name</th>
                                    <th className="px-3 py-2 text-left font-semibold">Type</th>
                                    <th className="px-3 py-2 text-right font-semibold">Quantity</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr className="border-t" style={{ borderColor: 'var(--border)' }}>
                                    <td className="px-3 py-2" style={{ color: 'var(--foreground)' }}>
                                      {displayAdjustment.product?.code || '—'}
                                    </td>
                                    <td className="px-3 py-2" style={{ color: 'var(--foreground)' }}>
                                      {displayAdjustment.product?.name || displayAdjustment.product?.code || '—'}
                                    </td>
                                    <td className="px-3 py-2">
                                      <Badge
                                        variant={displayAdjustment.adjustmentType === 'Increase' ? 'success' : 'danger'}
                                        size="sm"
                                      >
                                        {displayAdjustment.adjustmentType}
                                      </Badge>
                                    </td>
                                    <td className="px-3 py-2 text-right font-medium" style={{ color: 'var(--foreground)' }}>
                                      {displayAdjustment.quantity}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                              Adjustment Date
                            </p>
                            <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                              {formatSlDate(displayAdjustment.adjustmentDate)}
                            </p>
                          </div>
                          <div>
                            <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                              Edit User / Edit Date
                            </p>
                            <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                              {editUserName(displayAdjustment)} • {formatSlDateTime(displayAdjustment.updatedAt)}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                            Approved / Rejected By
                          </p>
                          <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                            {approvalColumnText(displayAdjustment)}
                          </p>
                        </div>
                        <div>
                          <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                            Reason
                          </p>
                          <p className="text-sm" style={{ color: 'var(--foreground)' }}>{displayAdjustment.reason}</p>
                        </div>
                        {displayAdjustment.notes && (
                          <div>
                            <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                              Notes
                            </p>
                            <p className="text-sm" style={{ color: 'var(--foreground)' }}>{displayAdjustment.notes}</p>
                          </div>
                        )}
                        <div>
                          <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                            Created By / Date
                          </p>
                          <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                            {displayAdjustment.createdByName || '—'} •{' '}
                            {formatSlDateTime(displayAdjustment.createdAt)}
                          </p>
                        </div>
                        {(displayAdjustment.approvedByName || displayAdjustment.approvedBy) && (
                          <div>
                            <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                              Approved By / Date
                            </p>
                            <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                              {displayAdjustment.approvedBy?.fullName ?? displayAdjustment.approvedByName ?? '—'} •{' '}
                              {displayAdjustment.approvedDate
                                ? formatSlDateTime(displayAdjustment.approvedDate)
                                : '-'}
                            </p>
                          </div>
                        )}
                      </div>
                    </InlineDetailPanel>
                  ) : null
                }
              />
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedPage>
  );
}
