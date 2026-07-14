'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import {
  Snowflake,
  Search,
  RefreshCw,
  History,
  Loader2,
  LayoutList,
  Table2,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Modal, ModalFooter } from '@/components/ui/modal';
import {
  freezerStocksApi,
  type FreezerStock,
  type FreezerStockHistory,
  type AdjustFreezerStockDto,
} from '@/lib/api/freezer-stocks';
import { productsApi, type Product } from '@/lib/api/products';
import { productionSectionsApi, type ProductionSection } from '@/lib/api/production-sections';
import { toast } from 'sonner';
import { formatSlDate, formatSlDateTime } from '@/lib/sri-lanka-time';

const LOW_STOCK_THRESHOLD = 10;
const PRODUCT_PAGE_SIZE = 500;

type TabId = 'section' | 'grid';
type AdjustMode = 'delta' | 'setTotal';

export default function FreezerStockPage() {
  const [stockItems, setStockItems] = useState<FreezerStock[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productionSections, setProductionSections] = useState<ProductionSection[]>([]);
  const [history, setHistory] = useState<FreezerStockHistory[]>([]);

  /** Primary workflow: one section at a time */
  const [entrySectionId, setEntrySectionId] = useState('');
  /** Full grid: optional filter to one column, or all */
  const [gridSectionFilter, setGridSectionFilter] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('section');
  const [productSearch, setProductSearch] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');

  const [adjustMode, setAdjustMode] = useState<AdjustMode>('delta');
  const [baselineStock, setBaselineStock] = useState(0);
  const [newTotalInput, setNewTotalInput] = useState('');

  const [adjustmentData, setAdjustmentData] = useState<AdjustFreezerStockDto>({
    productId: '',
    productionSectionId: '',
    adjustmentQuantity: 0,
    reason: '',
  });

  const sortedSections = useMemo(
    () =>
      [...productionSections].sort(
        (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.name.localeCompare(b.name)
      ),
    [productionSections]
  );

  const sectionForApi = useMemo(() => {
    if (activeTab === 'section') return entrySectionId || undefined;
    return gridSectionFilter || undefined;
  }, [activeTab, entrySectionId, gridSectionFilter]);

  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [productsRes, sectionsRes] = await Promise.all([
        productsApi.getAll(1, PRODUCT_PAGE_SIZE, undefined, undefined, true),
        productionSectionsApi.getAll(1, 200, undefined, true),
      ]);

      setProducts(productsRes.products);
      const secs = sectionsRes.productionSections;
      setProductionSections(secs);
      setEntrySectionId((prev) => {
        if (prev) return prev;
        const ordered = [...secs].sort(
          (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.name.localeCompare(b.name)
        );
        return ordered[0]?.id ?? '';
      });
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInitialData();
  }, []);

  const loadStocks = useCallback(async () => {
    if (!productionSections.length) return;
    try {
      const response = await freezerStocksApi.getAll(
        1,
        2000,
        undefined,
        sectionForApi
      );
      setStockItems(response.freezerStocks);
    } catch (error) {
      console.error('Error loading stocks:', error);
      toast.error('Failed to load freezer stocks');
    }
  }, [productionSections.length, sectionForApi]);

  useEffect(() => {
    if (products.length > 0 && productionSections.length > 0) {
      void loadStocks();
    }
  }, [products.length, productionSections.length, loadStocks]);

  const groupedStock: { [productId: string]: { [sectionId: string]: FreezerStock } } = {};
  stockItems.forEach((stock) => {
    if (!groupedStock[stock.productId]) groupedStock[stock.productId] = {};
    groupedStock[stock.productId][stock.productionSectionId] = stock;
  });

  const qtyFor = (productId: string, sectionId: string) =>
    groupedStock[productId]?.[sectionId]?.currentStock ?? 0;

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, productSearch]);

  const lowStockItems = stockItems.filter((s) => s.currentStock < LOW_STOCK_THRESHOLD);

  const openAdjustModal = (productId: string, sectionId: string, currentQty: number) => {
    setAdjustMode('delta');
    setBaselineStock(currentQty);
    setNewTotalInput(String(currentQty));
    setAdjustmentData({
      productId,
      productionSectionId: sectionId,
      adjustmentQuantity: 0,
      reason: '',
    });
    setShowAdjustModal(true);
  };

  const handleAdjust = async () => {
    let quantity = adjustmentData.adjustmentQuantity;
    if (adjustMode === 'setTotal') {
      const target = parseFloat(newTotalInput);
      if (Number.isNaN(target) || target < 0) {
        toast.error('Enter a valid target quantity (0 or more)');
        return;
      }
      quantity = Math.round((target - baselineStock) * 10000) / 10000;
      if (quantity === 0) {
        toast.error('Target is the same as current stock — nothing to change');
        return;
      }
    } else if (quantity === 0) {
      toast.error('Enter a non-zero adjustment, or switch to “Set total”');
      return;
    }

    const reason = (adjustmentData.reason ?? '').trim();
    if (!reason) {
      toast.error('Please enter a reason');
      return;
    }

    try {
      setIsSubmitting(true);
      await freezerStocksApi.adjustStock({
        ...adjustmentData,
        adjustmentQuantity: quantity,
        reason,
      });

      toast.success('Stock updated');
      setShowAdjustModal(false);
      resetAdjustmentForm();
      await loadStocks();
    } catch (error) {
      console.error('Error adjusting stock:', error);
      toast.error('Failed to update stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadHistory = async (productId: string, sectionId: string) => {
    try {
      setSelectedProductId(productId);
      setSelectedSectionId(sectionId);

      const historyData = await freezerStocksApi.getHistory(productId, sectionId);
      setHistory(historyData);
      setShowHistoryModal(true);
    } catch (error) {
      console.error('Error loading history:', error);
      toast.error('Failed to load stock history');
    }
  };

  const resetAdjustmentForm = () => {
    setAdjustmentData({
      productId: '',
      productionSectionId: '',
      adjustmentQuantity: 0,
      reason: '',
    });
    setNewTotalInput('');
    setBaselineStock(0);
  };

  const getTransactionTypeBadge = (type: string) => {
    switch (type) {
      case 'Manual':
        return (
          <Badge variant="primary" size="sm">
            Manual
          </Badge>
        );
      case 'OrderFulfillment':
        return (
          <Badge variant="warning" size="sm">
            Order
          </Badge>
        );
      case 'Production':
        return (
          <Badge variant="success" size="sm">
            Production
          </Badge>
        );
      case 'Adjustment':
        return (
          <Badge variant="neutral" size="sm">
            Adjustment
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" size="sm">
            {type}
          </Badge>
        );
    }
  };

  const visibleGridSections = sortedSections.filter(
    (s) => !gridSectionFilter || s.id === gridSectionFilter
  );

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center p-6">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--brand-primary)' }} />
          <p style={{ color: 'var(--muted-foreground)' }}>Loading freezer stocks…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            Freezer stock
          </h1>
          <p className="mt-1 max-w-2xl" style={{ color: 'var(--muted-foreground)' }}>
            Update balances by production section. Use <strong>By section</strong> for everyday entry; open
            the full grid only when you need to compare every section at once.
          </p>
        </div>
        <Button variant="secondary" size="md" onClick={() => void loadStocks()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {lowStockItems.length > 0 && (
        <div
          className="rounded-lg p-4"
          style={{
            backgroundColor: 'var(--dms-error-callout)',
            border: '1px solid var(--dms-error-border)',
          }}
        >
          <p className="mb-2 text-sm font-medium" style={{ color: 'var(--dms-error-text)' }}>
            Low stock (&lt; {LOW_STOCK_THRESHOLD} units) — {lowStockItems.length} line
            {lowStockItems.length === 1 ? '' : 's'}
          </p>
          <ul className="space-y-1 text-sm" style={{ color: 'var(--dms-error-text)' }}>
            {lowStockItems.slice(0, 6).map((item) => (
              <li key={item.id}>
                • {item.productName} — {item.productionSectionName}:{' '}
                <strong>{item.currentStock}</strong>
              </li>
            ))}
            {lowStockItems.length > 6 && (
              <li>…and {lowStockItems.length - 6} more (search or change section to find them)</li>
            )}
          </ul>
        </div>
      )}

      {/* View switcher */}
      <div
        className="inline-flex rounded-lg p-1"
        style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}
        role="tablist"
        aria-label="Freezer stock view"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'section'}
          onClick={() => setActiveTab('section')}
          className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"
          style={{
            backgroundColor: activeTab === 'section' ? 'var(--card)' : 'transparent',
            color: activeTab === 'section' ? 'var(--foreground)' : 'var(--muted-foreground)',
            boxShadow: activeTab === 'section' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
          }}
        >
          <LayoutList className="h-4 w-4" />
          By section
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'grid'}
          onClick={() => setActiveTab('grid')}
          className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"
          style={{
            backgroundColor: activeTab === 'grid' ? 'var(--card)' : 'transparent',
            color: activeTab === 'grid' ? 'var(--foreground)' : 'var(--muted-foreground)',
            boxShadow: activeTab === 'grid' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
          }}
        >
          <Table2 className="h-4 w-4" />
          All sections table
        </button>
      </div>

      {activeTab === 'section' && (
        <Card>
          <CardHeader className="border-b" style={{ borderColor: 'var(--border)' }}>
            <CardTitle className="text-lg">Enter stock for one section</CardTitle>
            <p className="mt-1 text-sm font-normal" style={{ color: 'var(--muted-foreground)' }}>
              Pick where you are working (e.g. Bakery), search for a product, then use{' '}
              <strong>Adjust</strong> for a clear, full-size action.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  Production section
                </label>
                <Select
                  value={entrySectionId}
                  onChange={(e) => setEntrySectionId(e.target.value)}
                  options={sortedSections.map((s) => ({ value: s.id, label: s.name }))}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  Search products
                </label>
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                    style={{ color: 'var(--muted-foreground)' }}
                  />
                  <input
                    type="search"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Type to filter…"
                    className="w-full rounded-lg py-2.5 pl-10 pr-4 text-sm"
                    style={{
                      border: '1px solid var(--input)',
                      backgroundColor: 'var(--background)',
                      color: 'var(--foreground)',
                    }}
                  />
                </div>
              </div>
            </div>

            {!entrySectionId ? (
              <p className="py-8 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
                No production sections found. Add sections under Administrator → Production sections.
              </p>
            ) : (
              <div className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--border)' }}>
                <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {filteredProducts.map((product) => {
                    const qty = qtyFor(product.id, entrySectionId);
                    const low = qty < LOW_STOCK_THRESHOLD;
                    return (
                      <li
                        key={product.id}
                        className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                        style={{ backgroundColor: 'var(--card)' }}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                            {product.name}
                          </p>
                          <p className="mt-0.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                            {sortedSections.find((s) => s.id === entrySectionId)?.name ?? 'Section'}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                          <div className="text-left sm:text-right">
                            <p
                              className="text-3xl font-bold tabular-nums leading-none"
                              style={{ color: low ? '#DC2626' : '#059669' }}
                            >
                              {qty}
                            </p>
                            <p className="mt-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                              units in freezer
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="primary"
                              size="md"
                              onClick={() => openAdjustModal(product.id, entrySectionId, qty)}
                            >
                              Adjust
                            </Button>
                            <Button
                              variant="secondary"
                              size="md"
                              onClick={() => void loadHistory(product.id, entrySectionId)}
                            >
                              <History className="mr-2 h-4 w-4" />
                              History
                            </Button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {filteredProducts.length === 0 && (
                  <p className="p-8 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    No products match your search.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'grid' && (
        <Card>
          <CardHeader className="flex flex-col gap-4 border-b sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: 'var(--border)' }}>
            <div>
              <CardTitle className="text-lg">All sections</CardTitle>
              <p className="mt-1 text-sm font-normal" style={{ color: 'var(--muted-foreground)' }}>
                Tap a cell to adjust. Use the filter to show one section column only.
              </p>
            </div>
            <Select
              value={gridSectionFilter}
              onChange={(e) => setGridSectionFilter(e.target.value)}
              options={[
                { value: '', label: 'All section columns' },
                ...sortedSections.map((s) => ({ value: s.id, label: s.name })),
              ]}
            />
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y" style={{ borderColor: 'var(--border)' }}>
                <thead style={{ backgroundColor: 'var(--muted)' }}>
                  <tr>
                    <th
                      className="sticky left-0 z-10 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{
                        backgroundColor: 'var(--muted)',
                        color: 'var(--muted-foreground)',
                        minWidth: '14rem',
                      }}
                    >
                      Product
                    </th>
                    {visibleGridSections.map((section) => (
                      <th
                        key={section.id}
                        className="border-l px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide"
                        style={{ color: 'var(--muted-foreground)', borderColor: 'var(--border)' }}
                      >
                        {section.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {products.map((product) => (
                    <tr key={product.id} style={{ backgroundColor: 'var(--card)' }}>
                      <td
                        className="sticky left-0 z-10 px-4 py-2 text-sm font-medium"
                        style={{
                          color: 'var(--foreground)',
                          backgroundColor: 'var(--card)',
                          boxShadow: '4px 0 8px -4px rgba(0,0,0,0.08)',
                        }}
                      >
                        {product.name}
                      </td>
                      {visibleGridSections.map((section) => {
                        const qty = qtyFor(product.id, section.id);
                        const low = qty < LOW_STOCK_THRESHOLD;
                        return (
                          <td
                            key={section.id}
                            className="border-l p-1 align-top"
                            style={{ borderColor: 'var(--border)', minWidth: '7.5rem' }}
                          >
                            <div className="flex flex-col gap-1">
                              <button
                                type="button"
                                onClick={() => openAdjustModal(product.id, section.id, qty)}
                                className="flex min-h-[4.5rem] w-full flex-col items-center justify-center rounded-lg px-2 py-2 text-center transition-colors"
                                style={{
                                  backgroundColor: low ? 'color-mix(in srgb, #DC2626 8%, transparent)' : 'var(--muted)',
                                  border: '1px solid var(--border)',
                                }}
                                title="Adjust stock"
                              >
                                <span
                                  className="text-xl font-bold tabular-nums"
                                  style={{ color: low ? '#DC2626' : '#059669' }}
                                >
                                  {qty}
                                </span>
                                <span
                                  className="mt-1 flex items-center gap-0.5 text-[10px] font-medium uppercase tracking-wide"
                                  style={{ color: 'var(--muted-foreground)' }}
                                >
                                  Adjust <ChevronRight className="h-3 w-3" />
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => void loadHistory(product.id, section.id)}
                                className="w-full rounded-md py-1.5 text-xs font-medium transition-colors hover:opacity-90"
                                style={{ color: 'var(--muted-foreground)' }}
                              >
                                History
                              </button>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Modal
        isOpen={showAdjustModal}
        onClose={() => {
          setShowAdjustModal(false);
          resetAdjustmentForm();
        }}
        title="Update freezer stock"
        size="md"
      >
        <div className="space-y-4">
          <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--muted)' }}>
            <p className="text-sm" style={{ color: 'var(--foreground)' }}>
              <span className="font-semibold">Product:</span>{' '}
              {products.find((p) => p.id === adjustmentData.productId)?.name}
            </p>
            <p className="mt-1 text-sm" style={{ color: 'var(--foreground)' }}>
              <span className="font-semibold">Section:</span>{' '}
              {productionSections.find((s) => s.id === adjustmentData.productionSectionId)?.name}
            </p>
            <p className="mt-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Current balance:{' '}
              <strong className="tabular-nums" style={{ color: 'var(--foreground)' }}>
                {baselineStock}
              </strong>{' '}
              units
            </p>
          </div>

          <div
            className="flex rounded-lg p-1"
            style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}
          >
            <button
              type="button"
              className="flex-1 rounded-md px-3 py-2 text-sm font-medium"
              style={{
                backgroundColor: adjustMode === 'delta' ? 'var(--card)' : 'transparent',
                color: adjustMode === 'delta' ? 'var(--foreground)' : 'var(--muted-foreground)',
              }}
              onClick={() => setAdjustMode('delta')}
            >
              Add / remove
            </button>
            <button
              type="button"
              className="flex-1 rounded-md px-3 py-2 text-sm font-medium"
              style={{
                backgroundColor: adjustMode === 'setTotal' ? 'var(--card)' : 'transparent',
                color: adjustMode === 'setTotal' ? 'var(--foreground)' : 'var(--muted-foreground)',
              }}
              onClick={() => setAdjustMode('setTotal')}
            >
              Set total
            </button>
          </div>

          {adjustMode === 'delta' ? (
            <Input
              label="Change by (use − for removals)"
              type="number"
              value={adjustmentData.adjustmentQuantity === 0 ? '' : String(adjustmentData.adjustmentQuantity)}
              onChange={(e) => {
                const v = e.target.value;
                setAdjustmentData({
                  ...adjustmentData,
                  adjustmentQuantity: v === '' ? 0 : parseFloat(v) || 0,
                });
              }}
              helperText={`Example: +10 to add ten, −5 to remove five. New balance will be ${baselineStock + (adjustmentData.adjustmentQuantity || 0)}.`}
              fullWidth
            />
          ) : (
            <Input
              label="New total quantity in freezer"
              type="number"
              min={0}
              value={newTotalInput}
              onChange={(e) => setNewTotalInput(e.target.value)}
              helperText="We will calculate the difference from the current balance automatically."
              fullWidth
            />
          )}

          <Input
            label="Reason (required)"
            value={adjustmentData.reason}
            onChange={(e) => setAdjustmentData({ ...adjustmentData, reason: e.target.value })}
            placeholder="e.g. Physical count Tuesday, damaged cartons…"
            fullWidth
          />
        </div>
        <ModalFooter>
          <Button
            variant="ghost"
            onClick={() => {
              setShowAdjustModal(false);
              resetAdjustmentForm();
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={() => void handleAdjust()} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              'Save'
            )}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal
        isOpen={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false);
          setHistory([]);
        }}
        title="Movement history"
        size="lg"
      >
        <div className="space-y-4">
          <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--muted)' }}>
            <p className="text-sm">
              <strong>Product:</strong> {products.find((p) => p.id === selectedProductId)?.name}
              <br />
              <strong>Section:</strong> {productionSections.find((s) => s.id === selectedSectionId)?.name}
            </p>
          </div>

          {history.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
              No movements recorded yet.
            </p>
          ) : (
            <div className="max-h-96 overflow-y-auto rounded-lg border" style={{ borderColor: 'var(--border)' }}>
              <table className="min-w-full divide-y" style={{ borderColor: 'var(--border)' }}>
                <thead className="sticky top-0" style={{ backgroundColor: 'var(--muted)' }}>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium">When</th>
                    <th className="px-3 py-2 text-left text-xs font-medium">Type</th>
                    <th className="px-3 py-2 text-right text-xs font-medium">Prev</th>
                    <th className="px-3 py-2 text-right text-xs font-medium">Δ</th>
                    <th className="px-3 py-2 text-right text-xs font-medium">New</th>
                    <th className="px-3 py-2 text-left text-xs font-medium">Reason</th>
                    <th className="px-3 py-2 text-left text-xs font-medium">By</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                  {history.map((h) => (
                    <tr key={h.id}>
                      <td className="px-3 py-2 text-xs whitespace-nowrap">
                        {formatSlDateTime(h.createdAt)}
                      </td>
                      <td className="px-3 py-2">{getTransactionTypeBadge(h.transactionType)}</td>
                      <td className="px-3 py-2 text-right font-mono text-sm">{h.previousStock}</td>
                      <td
                        className="px-3 py-2 text-right font-mono text-sm"
                        style={{ color: h.adjustmentQuantity > 0 ? '#059669' : '#DC2626' }}
                      >
                        {h.adjustmentQuantity > 0 ? '+' : ''}
                        {h.adjustmentQuantity}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-sm font-bold">{h.newStock}</td>
                      <td className="px-3 py-2 text-xs">{h.reason || '—'}</td>
                      <td className="px-3 py-2 text-xs">{h.createdByName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <ModalFooter>
          <Button
            variant="ghost"
            onClick={() => {
              setShowHistoryModal(false);
              setHistory([]);
            }}
          >
            Close
          </Button>
        </ModalFooter>
      </Modal>

      <div
        className="rounded-lg p-4"
        style={{
          backgroundColor: 'var(--dms-success-callout)',
          border: '1px solid var(--dms-success-border)',
        }}
      >
        <div className="flex gap-3">
          <Snowflake className="mt-0.5 h-5 w-5 shrink-0" style={{ color: 'var(--dms-success-text)' }} />
          <div>
            <p className="mb-2 text-sm font-medium" style={{ color: 'var(--dms-success-text)' }}>
              How this ties into planning
            </p>
            <ul className="space-y-1 text-sm" style={{ color: 'var(--dms-success-text)' }}>
              <li>• Balances here feed production planning when “Use freezer stock” is on.</li>
              <li>• Low-stock highlighting uses under {LOW_STOCK_THRESHOLD} units.</li>
              <li>• Production sections (Bakery, Filling, …) are managed under Administrator.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
