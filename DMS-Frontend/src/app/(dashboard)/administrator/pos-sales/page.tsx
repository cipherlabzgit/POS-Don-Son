'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { InlineDetailPanel } from '@/components/ui/inline-detail-panel';
import { Search, Eye, EyeOff, Loader2, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Select from '@/components/ui/select';
import Button from '@/components/ui/button';
import { posSalesApi, type PosSale } from '@/lib/api/pos-sales';
import { outletsApi, type Outlet } from '@/lib/api/outlets';
import { useThemeStore } from '@/lib/stores/theme-store';
import { ProtectedPage } from '@/components/auth';
import toast from 'react-hot-toast';
import { formatSlDate, formatSlDateTime } from '@/lib/sri-lanka-time';

export default function PosSalesPage() {
  return (
    <ProtectedPage permission="pos:sale:view">
      <PosSalesPageContent />
    </ProtectedPage>
  );
}

function PosSalesPageContent() {
  const pageTheme = useThemeStore((s) => s.getPageTheme('pos-sales'));

  const [sales, setSales] = useState<PosSale[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [outletFilter, setOutletFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<PosSale | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    outletsApi.getAll(1, 200, undefined, undefined, true).then((res) => {
      setOutlets(res.outlets || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchSales();
  }, [currentPage, pageSize, outletFilter, startDate, endDate]);

  const fetchSales = async () => {
    try {
      setIsLoading(true);
      const response = await posSalesApi.getAll(currentPage, pageSize, {
        outletId: outletFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: searchTerm || undefined,
      });
      setSales(response.sales || []);
      setTotalPages(response.totalPages || 1);
      setTotalCount(response.totalCount || 0);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load POS sales');
      setSales([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchSales();
  };

  const handleViewDetail = async (sale: PosSale) => {
    if (selectedSale?.id === sale.id) {
      setSelectedSale(null);
      return;
    }
    setSelectedSale(sale);
    try {
      setDetailLoading(true);
      const full = await posSalesApi.getById(sale.id);
      setSelectedSale(full);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load sale details');
    } finally {
      setDetailLoading(false);
    }
  };

  const formatPaymentMethod = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'cash': return <Badge variant="success" size="sm">Cash</Badge>;
      case 'card': return <Badge variant="primary" size="sm">Card</Badge>;
      default: return <Badge variant="neutral" size="sm">{method || '-'}</Badge>;
    }
  };

  const columns = [
    {
      key: 'soldAt',
      label: 'Date & Time',
      render: (item: PosSale) => (
        <span className="font-medium text-sm">
          {item.soldAt ? formatSlDateTime(item.soldAt) : '-'}
        </span>
      ),
    },
    {
      key: 'saleNo',
      label: 'Sale No',
      render: (item: PosSale) => (
        <span className="font-mono font-semibold text-sm" style={{ color: pageTheme?.secondaryColor || '#C8102E' }}>
          {item.saleNo || '-'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item: PosSale) => {
        const s = (item.status || 'Approved').toLowerCase();
        if (s === 'pending') return <Badge variant="warning" size="sm">Pending</Badge>;
        if (s === 'rejected') return <Badge variant="danger" size="sm">Rejected</Badge>;
        return <Badge variant="success" size="sm">Approved</Badge>;
      },
    },
    {
      key: 'outlet',
      label: 'Outlet',
      render: (item: PosSale) => (
        <span className="text-sm">{item.outletName || item.outlet?.name || '-'}</span>
      ),
    },
    {
      key: 'paymentMethod',
      label: 'Payment',
      render: (item: PosSale) => formatPaymentMethod(item.paymentMethod),
    },
    {
      key: 'totalAmount',
      label: 'Total',
      render: (item: PosSale) => (
        <span className="font-semibold text-sm">
          {typeof item.totalAmount === 'number' ? `Rs. ${item.totalAmount.toLocaleString('en-LK', { minimumFractionDigits: 2 })}` : '-'}
        </span>
      ),
    },
    {
      key: 'createdBy',
      label: 'Cashier',
      render: (item: PosSale) => (
        <span className="text-sm">{item.createdByName || '-'}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (item: PosSale) => (
        <button
          onClick={() => handleViewDetail(item)}
          className="p-1.5 rounded transition-colors"
          style={{ color: 'var(--muted-foreground)' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          title={selectedSale?.id === item.id ? 'Hide details' : 'View line items'}
          disabled={detailLoading}
        >
          {selectedSale?.id === item.id ? (
            <Eye className="w-4 h-4" aria-hidden />
          ) : (
            <EyeOff className="w-4 h-4" aria-hidden />
          )}
        </button>
      ),
    },
  ];

  const outletOptions = [
    { value: '', label: 'All Outlets' },
    ...outlets.map((o) => ({ value: o.id, label: o.name })),
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-7 h-7" style={{ color: pageTheme?.primaryColor || '#C8102E' }} />
            <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>POS Sales</h1>
          </div>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Sales recorded from Point of Sale terminals ({totalCount} total) — Auto-approved on payment
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <CardTitle>Sales List</CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              <Select
                value={outletFilter}
                onChange={(e) => {
                  setOutletFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={outletOptions}
              />
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 rounded-lg text-sm"
                style={{ border: '1px solid var(--input)' }}
                placeholder="Start date"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 rounded-lg text-sm"
                style={{ border: '1px solid var(--input)' }}
                placeholder="End date"
              />
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                <input
                  type="text"
                  placeholder="Search by sale no..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  autoComplete="off"
                  className="pl-10 pr-4 py-2 rounded-lg text-sm w-56"
                  style={{ border: '1px solid var(--input)' }}
                />
              </div>
              <Button variant="primary" size="sm" onClick={handleSearch}>
                Search
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
            </div>
          ) : (
            <DataTable
              data={sales}
              columns={columns}
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              expandedRowKey={selectedSale?.id ?? null}
              getRowKey={(item) => item.id}
              renderExpandedRow={(item) => {
                const sale = selectedSale?.id === item.id ? selectedSale : item;
                return (
                  <InlineDetailPanel
                    title={sale ? `Sale — ${sale.saleNo}` : 'Sale Details'}
                    open
                    onClose={() => setSelectedSale(null)}
                    contentClassName="max-w-[min(100%,52rem)]"
                    footer={
                      <Button variant="ghost" onClick={() => setSelectedSale(null)}>
                        Close
                      </Button>
                    }
                  >
                    <div className="space-y-6">
                      {detailLoading && (
                        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                          <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
                          Loading full sale details…
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Sale No</p>
                          <p className="text-sm font-semibold font-mono" style={{ color: 'var(--foreground)' }}>{sale.saleNo}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Payment Method</p>
                          {formatPaymentMethod(sale.paymentMethod)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Date & Time</p>
                          <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                            {sale.soldAt ? formatSlDateTime(sale.soldAt) : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Outlet</p>
                          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                            {sale.outletName || sale.outlet?.name || '-'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Cashier</p>
                          <p className="text-sm" style={{ color: 'var(--foreground)' }}>{sale.createdByName || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Total Amount</p>
                          <p className="text-lg font-bold" style={{ color: pageTheme?.primaryColor || '#C8102E' }}>
                            {typeof sale.totalAmount === 'number'
                              ? `Rs. ${sale.totalAmount.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`
                              : '-'}
                          </p>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--foreground)' }}>Line Items</h3>
                        {sale.lines && sale.lines.length > 0 ? (
                          <div className="border rounded-lg overflow-hidden">
                            <table className="w-full">
                              <thead style={{ backgroundColor: 'var(--muted)' }}>
                                <tr>
                                  <th className="px-4 py-3 text-left text-sm font-semibold">Product</th>
                                  <th className="px-4 py-3 text-right text-sm font-semibold">Qty</th>
                                  <th className="px-4 py-3 text-right text-sm font-semibold">Unit Price</th>
                                  <th className="px-4 py-3 text-right text-sm font-semibold">Line Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sale.lines.map((line, i) => (
                                  <tr key={i} className="border-t">
                                    <td className="px-4 py-3 text-sm">
                                      {line.productCode ? `${line.productCode} — ` : ''}{line.productName || line.productId}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right">{line.quantity}</td>
                                    <td className="px-4 py-3 text-sm text-right">
                                      {typeof line.unitPrice === 'number' ? `Rs. ${line.unitPrice.toLocaleString('en-LK', { minimumFractionDigits: 2 })}` : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-medium">
                                      {typeof line.lineTotal === 'number' ? `Rs. ${line.lineTotal.toLocaleString('en-LK', { minimumFractionDigits: 2 })}` : '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                    <tfoot className="border-t" style={{ backgroundColor: 'var(--muted)' }}>
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-sm font-bold text-right">Total</td>
                        <td className="px-4 py-3 text-sm font-bold text-right">
                          {typeof sale.totalAmount === 'number'
                            ? `Rs. ${sale.totalAmount.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`
                            : '-'}
                        </td>
                      </tr>
                    </tfoot>
                            </table>
                          </div>
                        ) : (
                          <p className="text-sm text-center py-4" style={{ color: 'var(--muted-foreground)' }}>
                            No line items found
                          </p>
                        )}
                      </div>
                    </div>
                  </InlineDetailPanel>
                );
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
