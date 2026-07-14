'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { InlineDetailPanel } from '@/components/ui/inline-detail-panel';
import { Plus, Search, Edit, Eye, EyeOff, Trash2, Play, CheckCircle, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Select from '@/components/ui/select';
import { productionPlansApi, type ProductionPlan } from '@/lib/api/production-plans';
import { ProtectedPage, PermissionButton } from '@/components/auth';
import toast from 'react-hot-toast';
import { formatSlDate, formatSlDateTime } from '@/lib/sri-lanka-time';

function endOfYesterdayIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

function formatShortDate(iso: string | undefined) {
  if (!iso) return '';
  return formatSlDate(iso);
}

function approvalByColumn(item: ProductionPlan): string {
  if (item.status === 'Draft' || item.status === 'PendingApproval') return '—';
  if (item.approvedByName && (item.status === 'Approved' || item.status === 'InProgress' || item.status === 'Completed')) {
    const d = formatShortDate(item.approvedDate);
    return d ? `${item.approvedByName} - ${d}` : item.approvedByName;
  }
  return '—';
}

function editUserName(item: ProductionPlan) {
  return item.updatedByName || item.createdByName || '—';
}

export default function ProductionPlanPage() {
  return (
    <ProtectedPage permission="production:plan:view">
      <ProductionPlanPageContent />
    </ProtectedPage>
  );
}

function ProductionPlanPageContent() {
  const router = useRouter();
  const [plans, setPlans] = useState<ProductionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<ProductionPlan | null>(null);
  const [panelDetail, setPanelDetail] = useState<ProductionPlan | null>(null);
  const [loadingPanelDetail, setLoadingPanelDetail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  /** When true, list only plans with plan date on or before yesterday (historical window). */
  const [showPreviousRecordsOnly, setShowPreviousRecordsOnly] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const filters: {
        status?: string;
        toDate?: string;
      } = {};
      if (statusFilter) filters.status = statusFilter;
      if (showPreviousRecordsOnly) {
        filters.toDate = endOfYesterdayIso();
      }

      const response = await productionPlansApi.getAll(currentPage, pageSize, filters);
      setPlans(Array.isArray(response.data) ? response.data : []);
      setTotalPages(response.totalPages || 1);
      setTotalCount(response.totalCount || 0);
    } catch (error) {
      console.error('Failed to load production plans:', error);
      toast.error('Failed to load production plans');
      setPlans([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, statusFilter, showPreviousRecordsOnly]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!selectedPlan?.id) {
      setPanelDetail(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoadingPanelDetail(true);
        const d = await productionPlansApi.getById(selectedPlan.id);
        if (!cancelled) setPanelDetail(d);
      } catch (error) {
        console.error('Failed to load plan detail:', error);
        if (!cancelled) setPanelDetail(selectedPlan);
      } finally {
        if (!cancelled) setLoadingPanelDetail(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedPlan]);

  const handleSubmit = async (id: string) => {
    try {
      setIsSubmitting(true);
      await productionPlansApi.submit(id);
      toast.success('Production plan submitted for approval');
      await fetchData();
      setSelectedPlan(null);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('Failed to submit production plan:', error);
      toast.error(err.response?.data?.message || 'Failed to submit production plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStart = async (id: string) => {
    try {
      setIsSubmitting(true);
      await productionPlansApi.start(id);
      toast.success('Production plan started successfully');
      await fetchData();
      setSelectedPlan(null);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('Failed to start production plan:', error);
      toast.error(err.response?.data?.message || 'Failed to start production plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      setIsSubmitting(true);
      await productionPlansApi.complete(id);
      toast.success('Production plan completed successfully');
      await fetchData();
      setSelectedPlan(null);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('Failed to complete production plan:', error);
      toast.error(err.response?.data?.message || 'Failed to complete production plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this production plan?')) return;

    try {
      await productionPlansApi.delete(id);
      toast.success('Production plan deleted successfully');
      setSelectedPlan(null);
      await fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('Failed to delete production plan:', error);
      toast.error(err.response?.data?.message || 'Failed to delete production plan');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return (
          <Badge variant="success" size="sm">
            Completed
          </Badge>
        );
      case 'InProgress':
        return (
          <Badge variant="warning" size="sm">
            In Progress
          </Badge>
        );
      case 'Approved':
        return (
          <Badge variant="success" size="sm">
            Approved
          </Badge>
        );
      case 'PendingApproval':
        return (
          <Badge variant="warning" size="sm">
            Pending approval
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" size="sm">
            Draft
          </Badge>
        );
    }
  };

  const filteredPlans = Array.isArray(plans)
    ? plans.filter((p) => {
        if (searchTerm === '') return true;
        const q = searchTerm.toLowerCase();
        return (
          p.planNo?.toLowerCase().includes(q) ||
          p.product?.code?.toLowerCase().includes(q) ||
          p.product?.name?.toLowerCase().includes(q) ||
          p.createdByName?.toLowerCase().includes(q) ||
          p.updatedByName?.toLowerCase().includes(q) ||
          p.reference?.toLowerCase().includes(q) ||
          p.comment?.toLowerCase().includes(q) ||
          p.approvedByName?.toLowerCase().includes(q)
        );
      })
    : [];

  const openRow = (item: ProductionPlan) => {
    if (selectedPlan?.id === item.id) {
      setSelectedPlan(null);
    } else {
      setSelectedPlan(item);
    }
  };

  const displayPlan = panelDetail ?? selectedPlan;

  const columns = [
    {
      key: 'planDate',
      label: 'Plan Date',
      render: (item: ProductionPlan) => (
        <span style={{ color: 'var(--muted-foreground)' }}>
          {formatSlDate(item.planDate)}
        </span>
      ),
    },
    {
      key: 'planNo',
      label: 'Plan No',
      render: (item: ProductionPlan) => (
        <button
          type="button"
          className="cursor-pointer text-left font-semibold hover:underline"
          style={{ color: 'var(--brand-primary)' }}
          onClick={() => setSelectedPlan(item)}
          title="View plan details"
        >
          {item.planNo}
        </button>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item: ProductionPlan) => getStatusBadge(item.status),
    },
    {
      key: 'editUser',
      label: 'Edit User',
      render: (item: ProductionPlan) => (
        <span style={{ color: 'var(--foreground)' }}>{editUserName(item)}</span>
      ),
    },
    {
      key: 'editDate',
      label: 'Edit Date',
      render: (item: ProductionPlan) => (
        <span style={{ color: 'var(--muted-foreground)' }}>
          {formatSlDateTime(item.updatedAt)}
        </span>
      ),
    },
    {
      key: 'reference',
      label: 'Reference',
      render: (item: ProductionPlan) => (
        <span className="max-w-[140px] truncate text-sm" style={{ color: 'var(--foreground)' }} title={item.reference}>
          {item.reference?.trim() ? item.reference : '—'}
        </span>
      ),
    },
    {
      key: 'comment',
      label: 'Comment',
      render: (item: ProductionPlan) => (
        <span className="line-clamp-2 max-w-[200px] whitespace-pre-wrap text-sm" style={{ color: 'var(--foreground)' }}>
          {item.comment?.trim() ? item.comment : '—'}
        </span>
      ),
    },
    {
      key: 'approvedRejected',
      label: 'Approved / Rejected By',
      render: (item: ProductionPlan) => (
        <span className="text-sm" style={{ color: 'var(--foreground)' }}>
          {approvalByColumn(item)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: ProductionPlan) => (
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
            title={selectedPlan?.id === item.id ? 'Hide details' : 'View details'}
          >
            {selectedPlan?.id === item.id ? <Eye className="h-4 w-4" aria-hidden /> : <EyeOff className="h-4 w-4" aria-hidden />}
          </button>
          {item.status === 'Draft' && (
            <PermissionButton
              permission="production:plan:update"
              variant="ghost"
              size="sm"
              className="min-w-0 p-1.5"
              title="Edit"
              onClick={() => router.push(`/production/production-plan/edit/${item.id}`)}
            >
              <Edit className="h-4 w-4" />
            </PermissionButton>
          )}
          {item.status === 'Draft' && (
            <PermissionButton
              permission="production:plan:update"
              variant="ghost"
              size="sm"
              className="min-w-0 p-1.5 text-[#3B82F6] hover:opacity-90"
              title="Submit for approval"
              onClick={() => void handleSubmit(item.id)}
            >
              <Send className="h-4 w-4" />
            </PermissionButton>
          )}
          {item.status === 'Draft' && (
            <PermissionButton
              permission="production:plan:delete"
              variant="ghost"
              size="sm"
              className="min-w-0 p-1.5 text-[var(--status-error)] hover:opacity-90"
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
            Production Plan
          </h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            History of Production Plan
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant={showPreviousRecordsOnly ? 'primary' : 'outline'}
            size="md"
            onClick={() => {
              setShowPreviousRecordsOnly((v) => !v);
              setCurrentPage(1);
            }}
            title="When on, only plans dated on or before yesterday are listed"
          >
            Show Previous Records
          </Button>
          <PermissionButton permission="production:plan:create" variant="primary" size="md" onClick={() => router.push('/production/production-plan/add')}>
            <Plus className="mr-2 h-4 w-4" />
            Add New
          </PermissionButton>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
                Filters
              </span>
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
                  { value: 'Draft', label: 'Draft' },
                  { value: 'PendingApproval', label: 'Pending approval' },
                  { value: 'Approved', label: 'Approved' },
                  { value: 'InProgress', label: 'In Progress' },
                  { value: 'Completed', label: 'Completed' },
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
              data={filteredPlans}
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
              expandedRowKey={selectedPlan?.id ?? null}
              getRowKey={(row) => row.id}
              renderExpandedRow={() =>
                selectedPlan && displayPlan ? (
                  <InlineDetailPanel
                    title="Production Plan Details"
                    open
                    onClose={() => {
                      setSelectedPlan(null);
                      setPanelDetail(null);
                    }}
                    footer={
                      <>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setSelectedPlan(null);
                            setPanelDetail(null);
                          }}
                        >
                          Close
                        </Button>
                        {selectedPlan && displayPlan?.status === 'Draft' && (
                          <PermissionButton
                            permission="production:plan:update"
                            variant="primary"
                            disabled={isSubmitting}
                            onClick={() => void handleSubmit(selectedPlan.id)}
                          >
                            <Send className="mr-2 h-4 w-4" />
                            {isSubmitting ? 'Submitting...' : 'Submit for approval'}
                          </PermissionButton>
                        )}
                        {selectedPlan && displayPlan?.status === 'Approved' && (
                          <PermissionButton
                            permission="production:plan:approve"
                            variant="primary"
                            disabled={isSubmitting}
                            onClick={() => void handleStart(selectedPlan.id)}
                          >
                            <Play className="mr-2 h-4 w-4" />
                            {isSubmitting ? 'Starting...' : 'Start Production'}
                          </PermissionButton>
                        )}
                        {selectedPlan && displayPlan?.status === 'InProgress' && (
                          <PermissionButton
                            permission="production:plan:approve"
                            variant="primary"
                            disabled={isSubmitting}
                            onClick={() => void handleComplete(selectedPlan.id)}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            {isSubmitting ? 'Completing...' : 'Complete'}
                          </PermissionButton>
                        )}
                      </>
                    }
                  >
                    <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                  Plan No
                </p>
                <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                  {displayPlan.planNo}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                  Status
                </p>
                {getStatusBadge(displayPlan.status)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                  Plan Date
                </p>
                <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                  {formatSlDate(displayPlan.planDate)}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                  Priority
                </p>
                <Badge variant="warning" size="sm">
                  {displayPlan.priority}
                </Badge>
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                Products in this plan
              </p>
              {loadingPanelDetail ? (
                <div className="flex justify-center py-6">
                  <div
                    className="h-8 w-8 animate-spin rounded-full border-2 border-transparent"
                    style={{ borderTopColor: 'var(--brand-primary)', borderRightColor: 'var(--neutral-200)' }}
                  />
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border" style={{ borderColor: 'var(--border)' }}>
                  <table className="w-full text-sm">
                    <thead style={{ backgroundColor: 'var(--muted)' }}>
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold">Product code</th>
                        <th className="px-3 py-2 text-left font-semibold">Product name</th>
                        <th className="px-3 py-2 text-right font-semibold">Planned qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t" style={{ borderColor: 'var(--border)' }}>
                        <td className="px-3 py-2" style={{ color: 'var(--foreground)' }}>
                          {displayPlan.product?.code || '—'}
                        </td>
                        <td className="px-3 py-2" style={{ color: 'var(--foreground)' }}>
                          {displayPlan.product?.name || displayPlan.product?.code || '—'}
                        </td>
                        <td className="px-3 py-2 text-right font-medium" style={{ color: 'var(--foreground)' }}>
                          {displayPlan.plannedQty}
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
                  Reference
                </p>
                <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--foreground)' }}>
                  {displayPlan.reference?.trim() ? displayPlan.reference : '—'}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                  Comment
                </p>
                <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--foreground)' }}>
                  {displayPlan.comment?.trim() ? displayPlan.comment : '—'}
                </p>
              </div>
            </div>
            {displayPlan.notes?.trim() && (
              <div>
                <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                  Notes
                </p>
                <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--foreground)' }}>
                  {displayPlan.notes}
                </p>
              </div>
            )}
            <div>
              <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                Edit User / Edit Date
              </p>
              <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                {editUserName(displayPlan)} • {formatSlDateTime(displayPlan.updatedAt)}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                Approved / Rejected By
              </p>
              <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                {approvalByColumn(displayPlan)}
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
