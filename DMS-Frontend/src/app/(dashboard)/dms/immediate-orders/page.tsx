'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { InlineDetailPanel } from '@/components/ui/inline-detail-panel';
import Select from '@/components/ui/select';
import { Plus, Eye, EyeOff, Loader2, Info, Printer, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { immediateOrdersApi, type ImmediateOrder } from '@/lib/api/immediate-orders';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useThemeStore } from '@/lib/stores/theme-store';
import { formatSlDate, formatSlDateTime } from '@/lib/sri-lanka-time';

/** One form submission uses one bill no.; backend stores one row per product line. */
interface OrderCluster {
  key: string;
  lines: ImmediateOrder[];
}

function buildOrderClusters(rows: ImmediateOrder[]): OrderCluster[] {
  const withBill = new Map<string, ImmediateOrder[]>();
  const withoutBill: ImmediateOrder[] = [];

  for (const row of rows) {
    const bill = (row.orderBillNo ?? '').trim();
    if (!bill) {
      withoutBill.push(row);
      continue;
    }
    const dateKey = row.orderDate ? new Date(row.orderDate).toISOString().slice(0, 10) : '';
    const outletKey = row.outletId || row.outletName || '';
    const clusterKey = `${bill}\u001f${dateKey}\u001f${outletKey}`;
    const list = withBill.get(clusterKey) ?? [];
    list.push(row);
    withBill.set(clusterKey, list);
  }

  const clusters: OrderCluster[] = [];
  for (const lines of withBill.values()) {
    lines.sort((a, b) => (a.productName || '').localeCompare(b.productName || ''));
    clusters.push({
      key: lines
        .map((l) => l.id)
        .sort()
        .join(','),
      lines,
    });
  }
  for (const row of withoutBill) {
    clusters.push({ key: row.id, lines: [row] });
  }

  clusters.sort((a, b) => {
    const ta = Math.max(...a.lines.map((l) => new Date(l.requestedAt).getTime()));
    const tb = Math.max(...b.lines.map((l) => new Date(l.requestedAt).getTime()));
    return tb - ta;
  });

  return clusters;
}

export default function ImmediateOrdersPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const pageTheme = useThemeStore((s) => s.getPageTheme('delivery'));
  const [orders, setOrders] = useState<ImmediateOrder[]>([]);

  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const [isLoading, setIsLoading] = useState(true);

  /** Expanded order detail — products load here only (same pattern as Operation › Delivery). */
  const [selectedCluster, setSelectedCluster] = useState<OrderCluster | null>(null);

  const orderClusters = useMemo(() => buildOrderClusters(orders), [orders]);

  useEffect(() => {
    loadOrders();
  }, [currentPage, pageSize, statusFilter]);

  useEffect(() => {
    setSelectedCluster(null);
  }, [currentPage, pageSize, statusFilter]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const response = await immediateOrdersApi.getAll(
        currentPage,
        pageSize,
        undefined,
        undefined,
        statusFilter || undefined
      );
      setOrders(response.immediateOrders as ImmediateOrder[]);
      setTotalCount(response.totalCount);
    } catch (error) {
      console.error('Error loading immediate orders:', error);
      toast.error('Failed to load immediate orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitCluster = async (cluster: OrderCluster) => {
    const drafts = cluster.lines.filter((l) => l.status === 'Draft');
    if (drafts.length === 0) {
      toast.info('No draft lines to submit');
      return;
    }
    try {
      await Promise.all(drafts.map((l) => immediateOrdersApi.submit(l.id)));
      toast.success(
        drafts.length === 1
          ? 'Order submitted for approval'
          : `Submitted ${drafts.length} product lines for approval.`,
      );
      setSelectedCluster(null);
      await loadOrders();
    } catch (error) {
      console.error('Error submitting order:', error);
      toast.error('Failed to submit order for approval');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return (
          <Badge variant="success" size="sm">
            Approved
          </Badge>
        );
      case 'Rejected':
        return (
          <Badge variant="danger" size="sm">
            Rejected
          </Badge>
        );
      case 'Completed':
        return (
          <Badge variant="success" size="sm">
            Completed
          </Badge>
        );
      case 'Pending':
        return (
          <Badge variant="warning" size="sm">
            Pending
          </Badge>
        );
      case 'Draft':
        return (
          <Badge variant="neutral" size="sm">
            Draft
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

  const clusterStatusBadge = (lines: ImmediateOrder[]) => {
    const statuses = [...new Set(lines.map((l) => l.status))];
    if (statuses.length === 1) return getStatusBadge(statuses[0]);
    return (
      <Badge variant="neutral" size="sm">
        Mixed
      </Badge>
    );
  };

  const fmtRequested = (lines: ImmediateOrder[]) => {
    const times = lines.map((l) => new Date(l.requestedAt).getTime());
    const t = Math.max(...times);
    return formatSlDateTime(t);
  };

  const columns = [
    {
      key: 'orderBillNo',
      label: 'Bill no.',
      render: (cluster: OrderCluster) => {
        const first = cluster.lines[0];
        const bill = (first.orderBillNo ?? '').trim();
        return (
          <span className="font-medium font-mono text-sm">{bill || '—'}</span>
        );
      },
    },
    {
      key: 'orderDate',
      label: 'Order date',
      render: (cluster: OrderCluster) => (
        <span className="font-medium">
          {formatSlDate(cluster.lines[0].orderDate)}
        </span>
      ),
    },
    {
      key: 'outlet',
      label: 'Outlet',
      render: (cluster: OrderCluster) => <span>{cluster.lines[0].outletName}</span>,
    },
    {
      key: 'lineCount',
      label: 'Items',
      render: (cluster: OrderCluster) => (
        <span className="font-semibold tabular-nums">{cluster.lines.length}</span>
      ),
    },
    {
      key: 'turn',
      label: 'Turn',
      render: (cluster: OrderCluster) => <span>{cluster.lines[0].deliveryTurnName}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (cluster: OrderCluster) => clusterStatusBadge(cluster.lines),
    },
    {
      key: 'requestedAt',
      label: 'Requested',
      render: (cluster: OrderCluster) => (
        <span className="text-xs">{fmtRequested(cluster.lines)}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (cluster: OrderCluster) => {
        const hasDraft = cluster.lines.some((l) => l.status === 'Draft');
        return (
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                if (selectedCluster?.key === cluster.key) setSelectedCluster(null);
                else setSelectedCluster(cluster);
              }}
              className="p-1.5 rounded transition-colors"
              style={{ color: 'var(--muted-foreground)' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              title={selectedCluster?.key === cluster.key ? 'Hide details' : 'View order & products'}
            >
              {selectedCluster?.key === cluster.key ? (
                <Eye className="w-4 h-4" aria-hidden />
              ) : (
                <EyeOff className="w-4 h-4" aria-hidden />
              )}
            </button>
            {hasDraft && (
              <button
                type="button"
                onClick={() => handleSubmitCluster(cluster)}
                className="p-1.5 rounded transition-colors"
                style={{ color: '#3B82F6' }}
                title="Submit draft lines for approval"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand-primary)' }} />
          <p style={{ color: 'var(--muted-foreground)' }}>Loading immediate orders...</p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(totalCount / pageSize);
  const groupedCount = orderClusters.length;
  const lineCount = orders.length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            Immediate Orders
          </h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Quick order management for urgent requests —{' '}
            <strong>{groupedCount}</strong> order{groupedCount !== 1 ? 's' : ''}
            {lineCount !== groupedCount ? (
              <span>
                {' '}
                ({lineCount} product line{lineCount !== 1 ? 's' : ''} on this page)
              </span>
            ) : null}
          </p>
          <div className="mt-2">
            <Badge variant={user?.isSuperAdmin ? 'primary' : 'neutral'} size="sm">
              <Info className="w-3 h-3 mr-1" aria-hidden />
              {user?.isSuperAdmin
                ? 'Super Admin: all outlets — every submission is listed.'
                : 'You only see immediate orders submitted under your account.'}
            </Badge>
          </div>
        </div>
        <Button variant="primary" size="md" onClick={() => router.push('/dms/immediate-orders/add')}>
          <Plus className="w-4 h-4 mr-2" />
          Add Order
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Immediate Orders</CardTitle>
            <div className="flex items-center space-x-3">
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: '', label: 'All Status' },
                  { value: 'Draft', label: 'Draft' },
                  { value: 'Pending', label: 'Pending' },
                  { value: 'Approved', label: 'Approved' },
                  { value: 'Rejected', label: 'Rejected' },
                  { value: 'Completed', label: 'Completed' },
                ]}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable<OrderCluster & { id: string }>
            data={orderClusters.map((c) => ({ ...c, id: c.key }))}
            columns={columns as any}
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            totalCount={totalCount}
            expandedRowKey={selectedCluster?.key ?? null}
            getRowKey={(row) => row.key}
            renderExpandedRow={() =>
              selectedCluster ? (
                <InlineDetailPanel
                  title="Immediate order details"
                  open
                  onClose={() => setSelectedCluster(null)}
                  contentClassName="max-w-[min(100%,80rem)] w-full"
                  footer={
                    <>
                      <Button variant="ghost" onClick={() => setSelectedCluster(null)}>
                        Close
                      </Button>
                      {selectedCluster.lines.some((l) => l.status === 'Draft') && (
                        <Button variant="primary" onClick={() => handleSubmitCluster(selectedCluster)}>
                          <Send className="w-4 h-4 mr-2" aria-hidden />
                          Submit for approval
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        onClick={() =>
                          console.log('Print immediate order:', selectedCluster.lines[0]?.orderBillNo)
                        }
                      >
                        <Printer className="w-4 h-4 mr-2" aria-hidden />
                        Print
                      </Button>
                    </>
                  }
                >
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
                          Bill no.
                        </p>
                        <p
                          className="text-sm font-semibold font-mono"
                          style={{ color: pageTheme?.secondaryColor || '#C8102E' }}
                        >
                          {(selectedCluster.lines[0].orderBillNo ?? '').trim() || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
                          Order date
                        </p>
                        <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                          {formatSlDate(selectedCluster.lines[0].orderDate)}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
                          Outlet
                        </p>
                        <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                          {selectedCluster.lines[0].outletName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
                          Overall status
                        </p>
                        {clusterStatusBadge(selectedCluster.lines)}
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
                        Order lines ({selectedCluster.lines.length})
                      </h4>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead style={{ backgroundColor: 'var(--muted)' }}>
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-semibold">#</th>
                              <th className="px-3 py-2 text-left text-xs font-semibold">Product</th>
                              <th className="px-3 py-2 text-right text-xs font-semibold">Full</th>
                              <th className="px-3 py-2 text-right text-xs font-semibold">Mini</th>
                              <th className="px-3 py-2 text-left text-xs font-semibold">Turn</th>
                              <th className="px-3 py-2 text-left text-xs font-semibold">Line status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedCluster.lines.map((line, index) => (
                              <tr key={line.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                                <td className="px-3 py-2 text-xs align-top">{index + 1}</td>
                                <td className="px-3 py-2 text-xs align-top">
                                  <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                                    {line.productName}
                                  </p>
                                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                                    Ref {line.orderNo}
                                  </p>
                                </td>
                                <td className="px-3 py-2 text-xs text-right align-top tabular-nums">
                                  {Number(line.fullQuantity ?? 0).toLocaleString()}
                                </td>
                                <td className="px-3 py-2 text-xs text-right align-top tabular-nums">
                                  {Number(line.miniQuantity ?? 0).toLocaleString()}
                                </td>
                                <td className="px-3 py-2 text-xs align-top">{line.deliveryTurnName}</td>
                                <td className="px-3 py-2 text-xs align-top">{getStatusBadge(line.status)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <p className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
                        Schedule & reference
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
                            Need by
                          </p>
                          <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                            {selectedCluster.lines[0].needByDate
                              ? `${formatSlDate(selectedCluster.lines[0].needByDate!)}${selectedCluster.lines[0].needByTime ? ` · ${selectedCluster.lines[0].needByTime}` : ''}`
                              : '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
                            Delivery
                          </p>
                          <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                            {selectedCluster.lines[0].deliveryDate
                              ? `${formatSlDate(selectedCluster.lines[0].deliveryDate!)}${selectedCluster.lines[0].deliveryTime ? ` · ${selectedCluster.lines[0].deliveryTime}` : ''}`
                              : '—'}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
                            Production starting
                          </p>
                          <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                            {selectedCluster.lines[0].productionStartingDate
                              ? `${formatSlDate(selectedCluster.lines[0].productionStartingDate!)} ${selectedCluster.lines[0].productionStartingTime ?? ''}`.trim()
                              : '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
                            Recipe request no.
                          </p>
                          <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                            {selectedCluster.lines[0].recipeRequestNumber ?? '—'}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
                            Requested by
                          </p>
                          <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                            {selectedCluster.lines[0].requestedBy}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
                            Requested at
                          </p>
                          <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                            {fmtRequested(selectedCluster.lines)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </InlineDetailPanel>
              ) : null
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
