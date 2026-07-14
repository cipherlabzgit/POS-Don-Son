'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { InlineDetailPanel } from '@/components/ui/inline-detail-panel';
import { Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { approvalsApi, type Approval } from '@/lib/api/approvals';
import { stockAdjustmentsApi, type StockAdjustment } from '@/lib/api/stock-adjustments';
import ProtectedPage from '@/components/auth/ProtectedPage';
import toast from 'react-hot-toast';
import { formatSlDate, formatSlDateTime } from '@/lib/sri-lanka-time';

function formatDocDate(iso: string | undefined) {
  if (!iso) return '';
  return formatSlDate(iso);
}

function formatEditDateTime(iso: string | undefined) {
  if (!iso) return '';
  return formatSlDateTime(iso);
}

export default function StockAdjustmentApprovalPage() {
  const router = useRouter();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [adjustmentDetail, setAdjustmentDetail] = useState<StockAdjustment | null>(null);
  const [loadingAdjustmentDetail, setLoadingAdjustmentDetail] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await approvalsApi.getPending(currentPage, pageSize, 'StockAdjustment');
      setApprovals(Array.isArray(response.approvals) ? response.approvals : []);
      setTotalPages(response.totalPages || 1);
      setTotalCount(response.totalCount || 0);
    } catch (error) {
      console.error('Failed to load pending approvals:', error);
      toast.error('Failed to load pending approvals');
      setApprovals([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!selectedApproval?.entityId) {
      setAdjustmentDetail(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoadingAdjustmentDetail(true);
        const detail = await stockAdjustmentsApi.getById(selectedApproval.entityId);
        if (!cancelled) setAdjustmentDetail(detail);
      } catch (error) {
        console.error('Failed to load stock adjustment:', error);
        if (!cancelled) {
          setAdjustmentDetail(null);
          toast.error('Could not load products for this adjustment');
        }
      } finally {
        if (!cancelled) setLoadingAdjustmentDetail(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedApproval]);

  const filteredApprovals = Array.isArray(approvals)
    ? approvals.filter((a) => {
        if (searchTerm === '') return true;
        const q = searchTerm.toLowerCase();
        return (
          a.entityReference?.toLowerCase().includes(q) ||
          a.requestedByName?.toLowerCase().includes(q) ||
          a.entityUpdatedByName?.toLowerCase().includes(q)
        );
      })
    : [];

  const columns = [
    {
      key: 'adjustmentDate',
      label: 'Date',
      render: (item: Approval) => (
        <span style={{ color: 'var(--muted-foreground)' }}>
          {formatDocDate(item.adjustmentDate ?? item.requestedAt)}
        </span>
      ),
    },
    {
      key: 'entityReference',
      label: 'Display No',
      render: (item: Approval) => (
        <button
          type="button"
          className="cursor-pointer text-left font-semibold hover:underline"
          style={{ color: 'var(--brand-primary)' }}
          onClick={() => setSelectedApproval(item)}
          title="View product line(s)"
        >
          {item.entityReference || item.entityId}
        </button>
      ),
    },
    {
      key: 'editUser',
      label: 'Edit User',
      render: (item: Approval) => (
        <span style={{ color: 'var(--foreground)' }}>
          {item.entityUpdatedByName || item.requestedByName || '—'}
        </span>
      ),
    },
    {
      key: 'editDate',
      label: 'Edit Date',
      render: (item: Approval) => (
        <span style={{ color: 'var(--muted-foreground)' }}>
          {formatEditDateTime(item.entityUpdatedAt ?? item.requestedAt)}
        </span>
      ),
    },
  ];

  return (
    <ProtectedPage
      permission="production:stock-adjustment:approve"
      deniedMessage="Only authorized personnel can access stock adjustment approvals. Please contact your supervisor if you need access."
    >
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            Stock Adjustment Approval
          </h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Approving or rejecting adjustments is done only on{' '}
            <Link href="/administrator/approvals" className="font-medium underline" style={{ color: 'var(--brand-primary)' }}>
              Administrator → Approvals
            </Link>
            . This page lists pending items for reference.
          </p>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
              Production Stock BF Approval
            </h2>
            <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
                  Filters
                </span>
              </div>
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
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
              </div>
            ) : (
              <DataTable
                data={filteredApprovals}
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
                expandedRowKey={selectedApproval?.id ?? null}
                getRowKey={(row) => row.id}
                renderExpandedRow={() =>
                  selectedApproval ? (
                    <InlineDetailPanel
                      title="Stock Adjustment Approval Details"
                      open
                      onClose={() => setSelectedApproval(null)}
                      footer={
                        <>
                          <Button variant="ghost" onClick={() => setSelectedApproval(null)}>
                            Close
                          </Button>
                          <Button variant="primary" onClick={() => router.push('/administrator/approvals')}>
                            Open Approvals
                          </Button>
                        </>
                      }
                    >
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                              Display No
                            </p>
                            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                              {selectedApproval.entityReference || selectedApproval.entityId}
                            </p>
                          </div>
                          <div>
                            <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                              Status
                            </p>
                            <Badge variant="warning" size="sm">
                              Pending
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                            Submitted By
                          </p>
                          <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                            {selectedApproval.requestedByName}
                            {selectedApproval.requestedByEmail ? ` (${selectedApproval.requestedByEmail})` : ''}
                          </p>
                        </div>
                        <div>
                          <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                            Submitted At
                          </p>
                          <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                            {formatSlDateTime(selectedApproval.requestedAt)}
                          </p>
                        </div>
                        <div>
                          <p className="mb-2 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                            Products in this request
                          </p>
                          {loadingAdjustmentDetail ? (
                            <div className="flex justify-center py-6">
                              <div
                                className="h-8 w-8 animate-spin rounded-full border-2 border-transparent"
                                style={{ borderTopColor: 'var(--brand-primary)', borderRightColor: 'var(--neutral-200)' }}
                              />
                            </div>
                          ) : adjustmentDetail ? (
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
                                      {adjustmentDetail.product?.code || '—'}
                                    </td>
                                    <td className="px-3 py-2" style={{ color: 'var(--foreground)' }}>
                                      {adjustmentDetail.product?.name || adjustmentDetail.product?.code || '—'}
                                    </td>
                                    <td className="px-3 py-2">
                                      <Badge
                                        variant={adjustmentDetail.adjustmentType === 'Increase' ? 'success' : 'danger'}
                                        size="sm"
                                      >
                                        {adjustmentDetail.adjustmentType}
                                      </Badge>
                                    </td>
                                    <td className="px-3 py-2 text-right font-medium" style={{ color: 'var(--foreground)' }}>
                                      {adjustmentDetail.quantity}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                              No product details loaded.
                            </p>
                          )}
                        </div>
                        {selectedApproval.notes && (
                          <div>
                            <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                              Notes
                            </p>
                            <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                              {selectedApproval.notes}
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
