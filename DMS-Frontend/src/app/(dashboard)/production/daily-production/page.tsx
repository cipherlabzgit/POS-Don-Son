'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { InlineDetailPanel } from '@/components/ui/inline-detail-panel';
import { Plus, Search, Eye, EyeOff, History, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Select from '@/components/ui/select';
import { DateRangeFilter } from '@/components/ui/date-range-filter';
import { dailyProductionsApi, type DailyProduction } from '@/lib/api/daily-productions';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useThemeStore } from '@/lib/stores/theme-store';
import { isAdminUser } from '@/lib/date-restrictions';
import { formatSlDate, formatSlDateTime } from '@/lib/sri-lanka-time';
import toast from 'react-hot-toast';
import { ProtectedPage, PermissionButton } from '@/components/auth';

function formatShortDate(iso: string | undefined) {
  if (!iso) return '';
  return formatSlDate(iso);
}


export default function DailyProductionPage() {
  return (
    <ProtectedPage permission="production:daily:view">
      <DailyProductionPageContent />
    </ProtectedPage>
  );
}

function DailyProductionPageContent() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAdmin = isAdminUser(user);
  useThemeStore((s) => s.getPageTheme('daily-production'));

  const [productions, setProductions] = useState<DailyProduction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showPreviousRecords, setShowPreviousRecords] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedProduction, setSelectedProduction] = useState<DailyProduction | null>(null);

  useEffect(() => {
    void fetchData();
  }, [currentPage, pageSize, statusFilter, fromDate, toDate, showPreviousRecords, isAdmin]);

  useEffect(() => {
    if (!isAdmin) setShowPreviousRecords(false);
  }, [isAdmin]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const filters: {
        status?: string;
        fromDate?: string;
        toDate?: string;
        showPreviousRecords?: boolean;
      } = {};
      if (statusFilter) filters.status = statusFilter;
      if (fromDate) filters.fromDate = fromDate;
      if (toDate) filters.toDate = toDate;
      // Admins: optional full history. Standard users: server restricts to own rows added today (Sri Lanka calendar).
      if (isAdmin && showPreviousRecords) filters.showPreviousRecords = true;

      const response = await dailyProductionsApi.getAll(currentPage, pageSize, filters);
      setProductions(Array.isArray(response.data) ? (response.data as DailyProduction[]) : []);
      setTotalPages(response.totalPages || 1);
      setTotalCount(response.totalCount || 0);
    } catch (error) {
      console.error('Failed to load productions:', error);
      toast.error('Failed to load production data');
      setProductions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this production?')) return;

    try {
      await dailyProductionsApi.delete(id);
      toast.success('Production deleted successfully');
      setSelectedProduction(null);
      void fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('Failed to delete production:', error);
      toast.error(err.response?.data?.message || 'Failed to delete production');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return <Badge variant="success" size="sm">Approved</Badge>;
      case 'Pending':
        return <Badge variant="warning" size="sm">Pending</Badge>;
      case 'Rejected':
        return <Badge variant="danger" size="sm">Rejected</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  const filteredProductions = Array.isArray(productions)
    ? productions.filter((p) => {
        const q = searchTerm.toLowerCase();
        if (!q) return true;
        return (
          p.productionNo?.toLowerCase().includes(q) ||
          p.shiftName?.toLowerCase().includes(q) ||
          p.createdByName?.toLowerCase().includes(q) ||
          p.updatedByName?.toLowerCase().includes(q) ||
          p.approvedByName?.toLowerCase().includes(q) ||
          p.lines?.some(line =>
            line.productCode?.toLowerCase().includes(q) ||
            line.productName?.toLowerCase().includes(q) ||
            line.productionSectionName?.toLowerCase().includes(q)
          )
        );
      })
    : [];

  const rowStatusClass = (item: DailyProduction) => {
    switch (item.status) {
      case 'Pending':
        return 'border-l-4 border-l-[var(--status-warning)]';
      case 'Approved':
        return 'border-l-4 border-l-[var(--status-success)]';
      case 'Rejected':
        return 'border-l-4 border-l-[var(--status-error)]';
      default:
        return '';
    }
  };

  const editUser = (item: DailyProduction) => item.updatedByName || item.createdByName || '—';

  const approvalColumnText = (item: DailyProduction): string => {
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
  };

  const columns = [
    {
      key: 'productionDate',
      label: 'Production Date',
      render: (item: DailyProduction) => (
        <span style={{ color: 'var(--muted-foreground)' }}>
          {formatSlDate(item.productionDate)}
        </span>
      ),
    },
    {
      key: 'productionNo',
      label: 'Production No',
      render: (item: DailyProduction) => (
        <span className="font-semibold" style={{ color: '#dc2626' }}>
          {item.productionNo}
        </span>
      ),
    },
    {
      key: 'products',
      label: 'Products',
      render: (item: DailyProduction) => (
        <span style={{ color: 'var(--foreground)' }}>
          {item.totalItems ? `${item.totalItems} item${item.totalItems > 1 ? 's' : ''}` : '-'}
        </span>
      ),
    },
    {
      key: 'totalProducedQty',
      label: 'Total Qty',
      render: (item: DailyProduction) => (
        <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
          {item.totalProducedQty || '-'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item: DailyProduction) => getStatusBadge(item.status),
    },
    {
      key: 'editUser',
      label: 'Edit User',
      render: (item: DailyProduction) => (
        <span style={{ color: 'var(--foreground)' }}>{editUser(item)}</span>
      ),
    },
    {
      key: 'editDate',
      label: 'Edit Date',
      render: (item: DailyProduction) => (
        <span style={{ color: 'var(--muted-foreground)' }}>{formatSlDateTime(item.updatedAt)}</span>
      ),
    },
    {
      key: 'approvedRejected',
      label: 'Approved / Rejected By',
      render: (item: DailyProduction) => (
        <span className="text-sm" style={{ color: 'var(--foreground)' }}>
          {approvalColumnText(item)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: DailyProduction) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              if (selectedProduction?.id === item.id) setSelectedProduction(null);
              else setSelectedProduction(item);
            }}
            className="rounded-full p-1.5 transition-colors"
            style={{ color: 'var(--muted-foreground)', backgroundColor: 'var(--muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--neutral-200)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)'; }}
            title={selectedProduction?.id === item.id ? 'Hide details' : 'View details'}
          >
            {selectedProduction?.id === item.id ? (
              <Eye className="h-4 w-4" aria-hidden />
            ) : (
              <EyeOff className="h-4 w-4" aria-hidden />
            )}
          </button>
          {item.status === 'Pending' && (
            <PermissionButton
              permission="production:daily:delete"
              variant="ghost"
              size="sm"
              className="h-auto min-w-0 rounded-full p-1.5 hover:opacity-90"
              style={{ color: 'var(--status-error)' }}
              title="Delete"
              onClick={() => void handleDelete(item.id)}
            >
              <Trash2 className="h-4 w-4" />
            </PermissionButton>
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
            Production
          </h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            History of Production
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <Button
              type="button"
              variant={showPreviousRecords ? 'primary' : 'outline'}
              size="md"
              onClick={() => {
                setShowPreviousRecords((v) => !v);
                setCurrentPage(1);
              }}
            >
              <History className="mr-2 h-4 w-4" />
              {showPreviousRecords ? "Today's entries (Sri Lanka)" : 'Show previous records'}
            </Button>
          )}
          <PermissionButton
            permission="production:daily:create"
            variant="primary"
            size="md"
            onClick={() => router.push('/production/daily-production/add')}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New
          </PermissionButton>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>
                  Records per page:
                </span>
                <select
                  value={pageSize}
                  disabled={isLoading}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-lg px-3 py-2 text-sm focus:outline-none disabled:opacity-50"
                  style={{
                    border: '1px solid var(--input)',
                    backgroundColor: 'var(--background)',
                    color: 'var(--foreground)',
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <div className="flex flex-wrap items-center gap-3">
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
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>
                    Search:
                  </span>
                  <div className="relative min-w-[12rem] flex-1 sm:max-w-xs sm:flex-initial">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                      style={{ color: 'var(--muted-foreground)' }}
                    />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      autoComplete="off"
                      className="w-full rounded-lg py-2 pl-10 pr-3 text-sm"
                      style={{
                        border: '1px solid var(--input)',
                        backgroundColor: 'var(--card)',
                        color: 'var(--foreground)',
                      }}
                    />
                  </div>
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
              data={filteredProductions}
              columns={columns}
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalCount={totalCount}
              hideRowsPerPage
              embedded
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              rowClassName={(item) => rowStatusClass(item)}
              expandedRowKey={selectedProduction?.id ?? null}
              getRowKey={(row) => row.id}
              renderExpandedRow={() =>
                selectedProduction ? (
                  <InlineDetailPanel
                    title="Production Details"
                    open
                    onClose={() => setSelectedProduction(null)}
                    footer={
                      <div className="flex flex-wrap gap-2 justify-end">
                        <Button variant="ghost" onClick={() => setSelectedProduction(null)}>
                          Close
                        </Button>
                        {selectedProduction.status === 'Pending' && (
                          <PermissionButton
                            permission="production:daily:delete"
                            variant="danger"
                            size="md"
                            onClick={() => void handleDelete(selectedProduction.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </PermissionButton>
                        )}
                      </div>
                    }
                  >
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
                            Production No
                          </p>
                          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                            {selectedProduction.productionNo}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
                            Status
                          </p>
                          {getStatusBadge(selectedProduction.status)}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
                            Production Date
                          </p>
                          <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                            {formatSlDate(selectedProduction.productionDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
                            Shift
                          </p>
                          <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                            {selectedProduction.shiftName}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
                            Total Items
                          </p>
                          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                            {selectedProduction.totalItems}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
                            Total Produced Qty
                          </p>
                          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                            {selectedProduction.totalProducedQty}
                          </p>
                        </div>
                      </div>

                      {/* Product Line Items */}
                      <div>
                        <p className="text-xs font-medium mb-2" style={{ color: 'var(--muted-foreground)' }}>
                          Products
                        </p>
                        <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                          <table className="w-full text-sm">
                            <thead style={{ backgroundColor: 'var(--muted)' }}>
                              <tr>
                                <th className="text-left p-2 font-medium" style={{ color: 'var(--foreground)' }}>Product</th>
                                <th className="text-left p-2 font-medium" style={{ color: 'var(--foreground)' }}>Section</th>
                                <th className="text-right p-2 font-medium" style={{ color: 'var(--foreground)' }}>Planned</th>
                                <th className="text-right p-2 font-medium" style={{ color: 'var(--foreground)' }}>Produced</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedProduction.lines?.map((line, index) => (
                                <tr key={line.id} style={{ borderTop: index > 0 ? '1px solid var(--border)' : 'none' }}>
                                  <td className="p-2">
                                    <div>
                                      <span className="text-muted-foreground text-xs">{line.productCode}</span>
                                      <p className="font-medium" style={{ color: 'var(--foreground)' }}>{line.productName}</p>
                                    </div>
                                  </td>
                                  <td className="p-2" style={{ color: 'var(--muted-foreground)' }}>
                                    {line.productionSectionName}
                                  </td>
                                  <td className="p-2 text-right" style={{ color: 'var(--muted-foreground)' }}>
                                    {line.plannedQty}
                                  </td>
                                  <td className="p-2 text-right font-semibold" style={{ color: 'var(--foreground)' }}>
                                    {line.producedQty}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Notes if any line has notes */}
                      {selectedProduction.lines?.some(line => line.notes) && (
                        <div>
                          <p className="text-xs font-medium mb-2" style={{ color: 'var(--muted-foreground)' }}>
                            Notes
                          </p>
                          {selectedProduction.lines.filter(line => line.notes).map((line) => (
                            <div key={line.id} className="mb-2 p-2 rounded" style={{ backgroundColor: 'var(--muted)' }}>
                              <p className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>{line.productName}:</p>
                              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{line.notes}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
                          Edit User / Date
                        </p>
                        <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                          {editUser(selectedProduction)} • {formatSlDateTime(selectedProduction.updatedAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
                          Approved / Rejected By
                        </p>
                        <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                          {approvalColumnText(selectedProduction)}
                        </p>
                      </div>
                    </div>
                  </InlineDetailPanel>
                ) : null
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
