'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Button from '@/components/ui/button';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { Minus, Plus, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { DEFAULT_BRAND_COLOR } from '@/lib/stores/theme-store';

export interface ProductionCancelProduct {
  id: string;
  code: string;
  name: string;
  categoryName?: string;
  productionSectionId?: string;
  sectionAssignments?: { productionSectionId: string; productionSectionName: string }[];
  requiresOpenStock?: boolean;
  isActive?: boolean;
  displayInPOS?: boolean;
  isFavorite?: boolean;
  unitPrice?: number;
  enableLabelPrint?: boolean;
  expiryDays?: number;
  expiryHours?: number;
}

export interface ProductionSection {
  id: string;
  name: string;
}

export interface ProductionCancelItem {
  productId: string;
  productionSectionId: string;
  cancelledQty: number;
}

export interface ProductionCancelItemsEntryProps {
  readonly products: ProductionCancelProduct[];
  readonly productionSections: ProductionSection[];
  readonly items: ProductionCancelItem[];
  readonly onItemsChange: (items: ProductionCancelItem[]) => void;
  readonly primaryColor?: string;
}

function resolveAutoSection(product: ProductionCancelProduct): string {
  if (product.productionSectionId) return product.productionSectionId;
  if (product.sectionAssignments?.length === 1) {
    return product.sectionAssignments[0].productionSectionId;
  }
  return '';
}

function getQtyStep(): number {
  return 0.01;
}

function getQtyMin(): number {
  return 0.01;
}

function formatQtyValue(q: number): string {
  return q.toFixed(2);
}

function clampQuantity(q: number): number {
  const min = getQtyMin();
  return Math.max(q, min);
}

export default function ProductionCancelItemsEntry({
  products,
  productionSections,
  items,
  onItemsChange,
  primaryColor = DEFAULT_BRAND_COLOR,
}: ProductionCancelItemsEntryProps) {
  const [query, setQuery] = useState('');
  const [openSuggest, setOpenSuggest] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [qtyEditRow, setQtyEditRow] = useState<number | null>(null);
  const [qtyDraft, setQtyDraft] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductionCancelProduct | null>(null);
  
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const qtyInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const pendingQtyFocusKey = useRef<string | null>(null);

  const focusSearchInput = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = inputRef.current;
        if (!el) return;
        el.focus({ preventScroll: true });
        const len = el.value.length;
        try {
          el.setSelectionRange(len, len);
        } catch {
          /* ignore */
        }
      });
    });
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const matches = products
      .filter(
        (p) =>
          p.code.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q)
      )
      .slice(0, 15);
    
    return matches;
  }, [products, query]);

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  useEffect(() => {
    const key = pendingQtyFocusKey.current;
    if (!key) return;
    pendingQtyFocusKey.current = null;
    const run = () => {
      const el = qtyInputRefs.current.get(key);
      if (!el) return;
      el.focus({ preventScroll: true });
      el.select();
    };
    requestAnimationFrame(() => {
      requestAnimationFrame(run);
    });
  }, [items]);

  const updateRowQuantity = useCallback(
    (index: number, raw: number) => {
      const clamped = clampQuantity(raw);
      const next = [...items];
      next[index] = { ...next[index], cancelledQty: clamped };
      onItemsChange(next);
    },
    [items, onItemsChange]
  );

  const updateRowSection = useCallback(
    (index: number, sectionId: string) => {
      const next = [...items];
      next[index] = { ...next[index], productionSectionId: sectionId };
      onItemsChange(next);
    },
    [items, onItemsChange]
  );

  const addProduct = useCallback(
    (product: ProductionCancelProduct) => {
      if (!product || !product.id) {
        toast.error('Invalid product');
        return;
      }

      // Check if product already exists in the list
      const existingIndex = items.findIndex((item) => item.productId === product.id);
      if (existingIndex !== -1) {
        toast.error(`${product.code} is already in the list`);
        // Focus the existing item's quantity field
        pendingQtyFocusKey.current = `${existingIndex}-qty`;
        setQuery('');
        setOpenSuggest(false);
        return;
      }

      // Auto-resolve section or use first available
      const autoSection = resolveAutoSection(product);
      const sectionId = autoSection || productionSections[0]?.id || '';
      
      if (!sectionId && productionSections.length === 0) {
        toast.error('No production sections available. Please add production sections first in Settings.');
        return;
      }
      
      if (!sectionId) {
        toast.error('Could not determine production section for this product');
        return;
      }

      // Add with default quantity
      const newIndex = items.length;
      const newItem: ProductionCancelItem = {
        productId: product.id,
        productionSectionId: sectionId,
        cancelledQty: 1,
      };

      const newItems = [...items, newItem];
      
      pendingQtyFocusKey.current = `${newIndex}-qty`;
      onItemsChange(newItems);
      setQuery('');
      setOpenSuggest(false);
      setQtyEditRow(null);
      toast.success(`${product.code} added`);
      
      // Ensure search input gets focus after the quantity field is done
      focusSearchInput();
    },
    [items, onItemsChange, productionSections, focusSearchInput]
  );

  const tryAddFromQuery = useCallback(() => {
    const q = query.trim();
    if (!q) {
      toast.error('Enter a product code or name');
      return;
    }
    
    // Calculate filtered products fresh to avoid stale state
    const currentFiltered = products
      .filter(
        (p) =>
          p.code.toLowerCase().includes(q.toLowerCase()) ||
          p.name.toLowerCase().includes(q.toLowerCase())
      )
      .slice(0, 15);
    
    if (currentFiltered.length === 0) {
      toast.error('No matching products found');
      return;
    }
    
    // First, try to find exact match by code
    let product: ProductionCancelProduct | undefined = products.find(
      (p) => p.code.toLowerCase() === q.toLowerCase()
    );
    
    // If no exact match, try exact match by name
    if (!product) {
      product = products.find(
        (p) => p.name.toLowerCase() === q.toLowerCase()
      );
    }
    
    // If still no exact match and only one filtered result, use it
    if (!product && currentFiltered.length === 1) {
      product = currentFiltered[0];
    }
    
    // Otherwise, use the highlighted product from the dropdown
    if (!product && currentFiltered.length > 0) {
      const safeHighlight = Math.max(0, Math.min(highlight, currentFiltered.length - 1));
      product = currentFiltered[safeHighlight];
    }
    
    if (!product) {
      toast.error('Could not select product. Please try again.');
      return;
    }

    addProduct(product);
  }, [addProduct, highlight, products, query]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpenSuggest(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const removeRow = (productId: string) => {
    onItemsChange(items.filter((i) => i.productId !== productId));
    setQtyEditRow(null);
  };

  const bumpRowQuantity = (index: number, delta: number) => {
    setQtyEditRow(null);
    const row = items[index];
    updateRowQuantity(index, row.cancelledQty + delta);
  };

  const handleQtyFocus = (index: number) => {
    const row = items[index];
    setQtyEditRow(index);
    setQtyDraft(formatQtyValue(row.cancelledQty));
  };

  const handleQtyBlur = useCallback(
    (index: number, value: string) => {
      const row = items[index];
      if (!row) return;
      const raw = value.trim().replace(/,/g, '');
      const num = parseFloat(raw);
      if (Number.isNaN(num) || num < 0) {
        updateRowQuantity(index, row.cancelledQty);
      } else {
        updateRowQuantity(index, num);
      }
      setQtyEditRow(null);
    },
    [items, updateRowQuantity]
  );

  const totalCancelled = useMemo(
    () => items.reduce((sum, row) => sum + row.cancelledQty, 0),
    [items]
  );

  return (
    <div className="space-y-4">
      <div
        ref={wrapRef}
        className="flex flex-col overflow-hidden rounded-lg border-2 bg-[var(--card)]"
        style={{ borderColor: 'var(--form-field-border)' }}
      >
        <div className="flex flex-col gap-4 p-3 sm:p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              Products to cancel
            </div>
          </div>
          
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-end">
              <div className="w-full min-w-0 max-w-[min(100%,20rem)] space-y-1">
                <label
                  className="text-xs font-medium sm:text-sm"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  Search by code or name
                </label>
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setOpenSuggest(true);
                    }}
                    onFocus={(e) => {
                      setOpenSuggest(!!query.trim());
                      e.currentTarget.style.borderColor = 'var(--form-focus-ring)';
                      e.currentTarget.style.outline = '2px solid var(--form-focus-ring)';
                      e.currentTarget.style.outlineOffset = '2px';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--form-field-border)';
                      e.currentTarget.style.outline = 'none';
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        e.stopPropagation();
                        if (filtered.length > 0) {
                          setOpenSuggest(true);
                          setHighlight((h) => Math.min(h + 1, filtered.length - 1));
                        }
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        e.stopPropagation();
                        if (filtered.length > 0) {
                          setOpenSuggest(true);
                          setHighlight((h) => Math.max(h - 1, 0));
                        }
                      } else if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                        const q = query.trim();
                        if (q) {
                          setOpenSuggest(false);
                          tryAddFromQuery();
                        } else {
                          toast.error('Please enter a product code or name');
                        }
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenSuggest(false);
                        setQuery('');
                      }
                    }}
                    placeholder="Enter product code"
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-[border-color,outline,box-shadow]"
                    style={{
                      border: '2px solid var(--form-field-border)',
                      backgroundColor: 'var(--background)',
                      color: 'var(--foreground)',
                      boxShadow: 'inset 0 1px 2px rgba(15, 23, 42, 0.05)',
                    }}
                    autoComplete="off"
                  />
                  {openSuggest && query.trim() && products.length === 0 && (
                    <div
                      className="absolute z-20 mt-1 w-full rounded-lg border shadow-md p-3 text-sm"
                      style={{
                        backgroundColor: 'var(--card)',
                        borderColor: 'var(--form-field-border)',
                        color: 'var(--muted-foreground)',
                      }}
                    >
                      Loading products...
                    </div>
                  )}
                  {openSuggest && query.trim() && products.length > 0 && filtered.length === 0 && (
                    <div
                      className="absolute z-20 mt-1 w-full rounded-lg border shadow-md p-3 text-sm"
                      style={{
                        backgroundColor: 'var(--card)',
                        borderColor: 'var(--form-field-border)',
                        color: 'var(--muted-foreground)',
                      }}
                    >
                      No products found matching &quot;{query}&quot;
                    </div>
                  )}
                  {openSuggest && query.trim() && filtered.length > 0 && (
                    <ul
                      className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-lg border shadow-md"
                      style={{
                        backgroundColor: 'var(--card)',
                        borderColor: 'var(--form-field-border)',
                      }}
                      role="listbox"
                    >
                      {filtered.map((p, i) => (
                        <li key={p.id}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={i === highlight}
                            className="flex w-full min-w-0 items-center px-3 py-2 text-left font-serif text-sm transition-colors hover:opacity-90"
                            style={{
                              backgroundColor:
                                i === highlight
                                  ? `color-mix(in srgb, ${primaryColor} 14%, var(--muted))`
                                  : 'transparent',
                            }}
                            onMouseEnter={() => setHighlight(i)}
                            onMouseDown={(ev) => {
                              ev.preventDefault();
                              ev.stopPropagation();
                            }}
                            onClick={(ev) => {
                              ev.preventDefault();
                              ev.stopPropagation();
                              addProduct(p);
                            }}
                          >
                            <span className="min-w-0 flex-1 truncate" style={{ color: 'var(--foreground)' }}>
                              <span
                                className="font-mono font-semibold"
                                style={{ color: '#dc2626' }}
                              >
                                {p.code}
                              </span>
                              <span style={{ color: 'var(--muted-foreground)' }}> - {p.name}</span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <p className="text-xs leading-snug" style={{ color: 'var(--muted-foreground)' }}>
                  Type to search, then press <strong>Enter</strong> to add to list. Use ↑/↓ to navigate suggestions.
                </p>
              </div>
            </div>
          </div>
        </div>

        {items.length > 0 ? (
          <div
            className="overflow-x-auto border-t bg-[var(--background)]"
            style={{ borderColor: 'var(--form-field-border)' }}
          >
            <table className="w-full">
              <thead
                className="border-b"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--foreground) 6%, var(--muted))',
                  borderColor: 'var(--form-field-border)',
                }}
              >
                <tr>
                  <th
                    className="px-3 py-2.5 text-left text-xs font-bold"
                    style={{ color: 'var(--foreground)' }}
                  >
                    #
                  </th>
                  <th
                    className="px-3 py-2.5 text-left text-xs font-bold"
                    style={{ color: 'var(--foreground)' }}
                  >
                    Item Code
                  </th>
                  <th
                    className="px-3 py-2.5 text-left text-xs font-bold"
                    style={{ color: 'var(--foreground)' }}
                  >
                    Item Name
                  </th>
                  <th
                    className="px-3 py-2.5 text-left text-xs font-bold"
                    style={{ color: 'var(--foreground)' }}
                  >
                    Production Section
                  </th>
                  <th
                    className="px-3 py-2.5 text-right text-xs font-bold"
                    style={{ color: 'var(--foreground)' }}
                  >
                    Cancelled Qty
                  </th>
                  <th
                    className="px-3 py-2.5 text-center text-xs font-bold"
                    style={{ color: 'var(--foreground)' }}
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, index) => {
                  const product = products.find((p) => p.id === row.productId);
                  const step = getQtyStep();
                  return (
                    <tr
                      key={`${row.productId}-${index}`}
                      className="border-t"
                      style={{
                        borderColor: 'var(--form-field-border)',
                        backgroundColor: 'var(--card)',
                      }}
                    >
                      <td className="px-3 py-2 text-sm" style={{ color: 'var(--foreground)' }}>
                        {index + 1}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <button
                          type="button"
                          onClick={() => {
                            if (product) {
                              setSelectedProduct(product);
                              setDetailsOpen(true);
                            }
                          }}
                          className="font-mono font-semibold underline hover:opacity-80 transition-opacity cursor-pointer"
                          style={{ color: '#dc2626' }}
                          title="Click to view details"
                        >
                          {product?.code ?? '—'}
                        </button>
                      </td>
                      <td className="px-3 py-2 text-sm" style={{ color: 'var(--foreground)' }}>
                        {product?.name ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <select
                          value={row.productionSectionId}
                          onChange={(e) => updateRowSection(index, e.target.value)}
                          className="rounded px-2 py-1 text-xs border"
                          style={{
                            borderColor: 'var(--form-field-border)',
                            backgroundColor: 'var(--background)',
                            color: 'var(--foreground)',
                          }}
                        >
                          {productionSections.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            type="button"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-sm transition-colors"
                            style={{
                              borderColor: 'var(--form-field-border)',
                              backgroundColor: 'var(--muted)',
                              color: 'var(--foreground)',
                            }}
                            onClick={() => bumpRowQuantity(index, -step)}
                            title="Decrease"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <input
                            ref={(el) => {
                              if (el) qtyInputRefs.current.set(`${index}-qty`, el);
                              else qtyInputRefs.current.delete(`${index}-qty`);
                            }}
                            type="text"
                            inputMode="decimal"
                            className="h-8 w-[4.5rem] rounded-md border px-1 text-center text-sm tabular-nums outline-none focus:outline focus:outline-2 focus:outline-offset-0"
                            style={{
                              borderColor: 'var(--form-field-border)',
                              backgroundColor: 'var(--background)',
                              color: 'var(--foreground)',
                              outlineColor: 'var(--form-focus-ring)',
                            }}
                            onFocus={(e) => {
                              handleQtyFocus(index);
                              e.currentTarget.select();
                            }}
                            value={
                              qtyEditRow === index
                                ? qtyDraft
                                : formatQtyValue(row.cancelledQty)
                            }
                            onChange={(e) => {
                              const v = e.target.value;
                              setQtyEditRow(index);
                              setQtyDraft(v);
                              const raw = v.trim().replace(/,/g, '');
                              if (raw === '' || raw === '.' || raw === '-') return;
                              const num = parseFloat(raw);
                              if (!Number.isNaN(num) && num > 0) {
                                updateRowQuantity(index, num);
                              }
                            }}
                            onBlur={(e) => handleQtyBlur(index, e.currentTarget.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                e.stopPropagation();
                                const el = e.target as HTMLInputElement;
                                el.blur();
                                // Return focus to search field
                                focusSearchInput();
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-sm transition-colors"
                            style={{
                              borderColor: 'var(--form-field-border)',
                              backgroundColor: 'var(--muted)',
                              color: 'var(--foreground)',
                            }}
                            onClick={() => bumpRowQuantity(index, step)}
                            title="Increase"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Remove"
                          onClick={() => removeRow(row.productId)}
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            className="border-t py-10 text-center text-sm"
            style={{
              borderColor: 'var(--form-field-border)',
              backgroundColor: 'var(--muted)',
              color: 'var(--muted-foreground)',
            }}
          >
            No products yet. Add one or more lines above.
          </div>
        )}

        <div
          className="flex justify-end border-t px-3 py-3 sm:px-4"
          style={{ borderColor: 'var(--form-field-border)' }}
        >
          <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--foreground)' }}>
            {items.length} line{items.length === 1 ? '' : 's'} · Total Cancelled:{' '}
            <span style={{ color: '#dc2626' }}>{totalCancelled.toFixed(2)}</span>
          </span>
        </div>
      </div>

      {/* Product Details Modal */}
      <Modal
        isOpen={detailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedProduct(null);
        }}
        title="Item Details"
        size="md"
      >
        {selectedProduct && (
          <div className="space-y-4">
            {/* Row 1 */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <div>
                <p className="text-sm font-bold mb-1" style={{ color: '#dc2626' }}>
                  Product Category
                </p>
                <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                  {selectedProduct.categoryName || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-bold mb-1" style={{ color: '#dc2626' }}>
                  Action
                </p>
                <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                  View
                </p>
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <div>
                <p className="text-sm font-bold mb-1" style={{ color: '#dc2626' }}>
                  Product Code
                </p>
                <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                  {selectedProduct.code}
                </p>
              </div>
              <div>
                <p className="text-sm font-bold mb-1" style={{ color: '#dc2626' }}>
                  Product Description
                </p>
                <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                  {selectedProduct.name}
                </p>
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <div>
                <p className="text-sm font-bold mb-1" style={{ color: '#dc2626' }}>
                  Production Section
                </p>
                <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                  {selectedProduct.productionSectionId
                    ? productionSections.find((s) => s.id === selectedProduct.productionSectionId)
                        ?.name || '—'
                    : selectedProduct.sectionAssignments && selectedProduct.sectionAssignments.length > 0
                    ? selectedProduct.sectionAssignments.map((a) => a.productionSectionName).join(', ')
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-sm font-bold mb-1" style={{ color: '#dc2626' }}>
                  Required Open Stock
                </p>
                <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                  {selectedProduct.requiresOpenStock ? 'Yes' : 'No'}
                </p>
              </div>
            </div>

            {/* Row 4 */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <div>
                <p className="text-sm font-bold mb-1" style={{ color: '#dc2626' }}>
                  Active
                </p>
                <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                  {selectedProduct.isActive ? 'Yes' : 'No'}
                </p>
              </div>
              <div>
                <p className="text-sm font-bold mb-1" style={{ color: '#dc2626' }}>
                  Show in POS
                </p>
                <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                  {selectedProduct.displayInPOS ? 'Yes' : 'No'}
                </p>
              </div>
            </div>

            {/* Row 5 */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <div>
                <p className="text-sm font-bold mb-1" style={{ color: '#dc2626' }}>
                  Favorite
                </p>
                <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                  {selectedProduct.isFavorite ? 'Yes' : 'No'}
                </p>
              </div>
              <div>
                <p className="text-sm font-bold mb-1" style={{ color: '#dc2626' }}>
                  Unit Price
                </p>
                <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                  {selectedProduct.unitPrice?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>

            {/* Row 6 */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <div>
                <p className="text-sm font-bold mb-1" style={{ color: '#dc2626' }}>
                  Enable Label Print
                </p>
                <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                  {selectedProduct.enableLabelPrint ? 'Yes' : 'No'}
                </p>
              </div>
              <div>
                <p className="text-sm font-bold mb-1" style={{ color: '#dc2626' }}>
                  Expiry Days
                </p>
                <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                  {selectedProduct.expiryDays ?? 0}
                </p>
              </div>
            </div>

            {/* Row 8 */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div>
                <p className="text-sm font-bold mb-1" style={{ color: '#dc2626' }}>
                  Expiry Hours
                </p>
                <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                  {selectedProduct.expiryHours ?? 0}
                </p>
              </div>
            </div>
          </div>
        )}
        <ModalFooter>
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              setDetailsOpen(false);
              setSelectedProduct(null);
            }}
          >
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
