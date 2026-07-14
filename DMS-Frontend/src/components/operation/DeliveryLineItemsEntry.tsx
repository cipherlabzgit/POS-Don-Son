'use client';

import { useCallback, useEffect, useMemo, useRef, useState, Fragment } from 'react';
import Button from '@/components/ui/button';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { Upload, FileSpreadsheet, Minus, Plus, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Product } from '@/lib/api/products';
import { productsApi } from '@/lib/api/products';
import type { ItemManagementItem } from '@/components/operation/ItemManagementTable';
import {
  downloadDeliveryImportTemplate,
  parseDeliveryImportFile,
} from '@/lib/delivery-import-excel';
import { DEFAULT_BRAND_COLOR } from '@/lib/stores/theme-store';

export interface DeliveryLineItemsEntryProps {
  products: Product[];
  items: ItemManagementItem[];
  onItemsChange: (items: ItemManagementItem[]) => void;
  primaryColor?: string;
  /** Delivery-style table with unit price, line totals, and money footer (default true). */
  showPricing?: boolean;
  /** ItemCode / Quantity Excel import (default true). */
  enableExcelImport?: boolean;
  /** Per-line reason column (e.g. disposal). */
  showReason?: boolean;
  reasonPlaceholder?: string;
  /** Tinted top bar: title + Import on one row (disposal-style). */
  accentToolbar?: boolean;
  /** Hide the label above the search field (placeholder only). */
  hideSearchLabel?: boolean;
  /**
   * Override helper under search. Pass empty string to hide.
   * Default mentions quantity when showPricing is true.
   */
  searchHelperText?: string;
  /** Stronger primary tint on table header row. */
  accentTableHeader?: boolean;
}

function upsertItem(
  items: ItemManagementItem[],
  product: Product,
  addQty: number,
  opts?: { withReason?: boolean }
): ItemManagementItem[] {
  const unitPrice = product.unitPrice ?? 0;
  const idx = items.findIndex((i) => i.productId === product.id);
  if (idx >= 0) {
    const next = [...items];
    next[idx] = {
      ...next[idx],
      quantity: next[idx].quantity + addQty,
    };
    return next;
  }
  const row: ItemManagementItem = { productId: product.id, quantity: addQty, unitPrice };
  if (opts?.withReason) row.reason = '';
  return [...items, row];
}

function getQtyStep(p?: Product): number {
  if (!p?.allowDecimal) return 1;
  const dp = Math.min(Math.max(p.decimalPlaces ?? 2, 1), 4);
  return 10 ** -dp;
}

function getQtyMin(p?: Product): number {
  if (!p) return 1;
  return p.allowDecimal
    ? 10 ** -Math.min(Math.max(p.decimalPlaces ?? 2, 1), 4)
    : 1;
}

function formatQtyEditValue(q: number, p?: Product): string {
  if (!p?.allowDecimal) return String(Math.round(q));
  const dp = Math.min(p.decimalPlaces ?? 2, 6);
  const s = q.toFixed(dp);
  return s.replace(/\.?0+$/, '') || '0';
}

function clampQuantity(q: number, p?: Product): number {
  const min = getQtyMin(p);
  let v = Math.max(q, min);
  if (p && !p.allowDecimal) {
    v = Math.round(v);
    return Math.max(v, min);
  }
  const dp = Math.min(p?.decimalPlaces ?? 4, 6);
  v = parseFloat(v.toFixed(dp));
  return Math.max(v, min);
}

function yesNo(v: boolean | null | undefined): string {
  if (v === true) return 'Yes';
  if (v === false) return 'No';
  return '—';
}

function yesNoWithDefault(
  v: boolean | null | undefined,
  whenUnknown: 'yes' | 'no'
): string {
  if (v === true) return 'Yes';
  if (v === false) return 'No';
  return whenUnknown === 'yes' ? 'Yes' : 'No';
}

function priceLabel(v: number | null | undefined): string {
  if (v == null || Number.isNaN(Number(v))) return '—';
  return Number(v).toFixed(2);
}

export default function DeliveryLineItemsEntry({
  products,
  items,
  onItemsChange,
  primaryColor = DEFAULT_BRAND_COLOR,
  showPricing = true,
  enableExcelImport = true,
  showReason = false,
  reasonPlaceholder = 'Reason (required)',
  accentToolbar = false,
  hideSearchLabel = false,
  searchHelperText,
  accentTableHeader = false,
}: DeliveryLineItemsEntryProps) {
  const [query, setQuery] = useState('');
  const [openSuggest, setOpenSuggest] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [qtyEditRow, setQtyEditRow] = useState<number | null>(null);
  const [qtyDraft, setQtyDraft] = useState('');
  /** Quantity applied when adding the next product (not the search field). */
  const [addQtyInput, setAddQtyInput] = useState('1');
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const qtyInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const pendingQtyFocusProductId = useRef<string | null>(null);
  const dropdownItemRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

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
    return products
      .filter(
        (p) =>
          p.code.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q)
      )
      .slice(0, 15);
  }, [products, query]);

  const highlightedProduct =
    filtered.length > 0
      ? filtered[Math.min(Math.max(highlight, 0), filtered.length - 1)]
      : undefined;
  const addQtyStep = getQtyStep(highlightedProduct);

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  useEffect(() => {
    const highlightedElement = dropdownItemRefs.current.get(highlight);
    if (highlightedElement && openSuggest) {
      highlightedElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [highlight, openSuggest]);

  useEffect(() => {
    const id = pendingQtyFocusProductId.current;
    if (!id) return;
    pendingQtyFocusProductId.current = null;
    const run = () => {
      const el = qtyInputRefs.current.get(id);
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
      const row = items[index];
      if (!row) return;
      const product = products.find((p) => p.id === row.productId);
      const clamped = clampQuantity(raw, product);
      const next = [...items];
      next[index] = { ...next[index], quantity: clamped };
      onItemsChange(next);
    },
    [items, onItemsChange, products]
  );

  const updateRowReason = useCallback(
    (index: number, reason: string) => {
      const row = items[index];
      if (!row) return;
      const next = [...items];
      next[index] = { ...next[index], reason };
      onItemsChange(next);
    },
    [items, onItemsChange]
  );

  const addProduct = useCallback(
    (product: Product, qty: number) => {
      const clamped = clampQuantity(qty, product);
      if (clamped <= 0) {
        toast.error('Quantity must be greater than 0');
        return;
      }
      pendingQtyFocusProductId.current = product.id;
      onItemsChange(upsertItem(items, product, clamped, { withReason: showReason }));
      setQuery('');
      setOpenSuggest(false);
      setQtyEditRow(null);
      setAddQtyInput('1');
      toast.success(`${product.code} added`);
    },
    [items, onItemsChange, showReason]
  );

  const parseTypedAddQty = useCallback(
    (product: Product): number | null => {
      const parsed = parseFloat(addQtyInput.trim().replace(/,/g, ''));
      if (Number.isNaN(parsed) || parsed <= 0) return null;
      return clampQuantity(parsed, product);
    },
    [addQtyInput]
  );

  const bumpAddQty = (deltaSteps: number) => {
    const p = highlightedProduct;
    const step = addQtyStep;
    const raw = parseFloat(addQtyInput.trim().replace(/,/g, ''));
    const base =
      Number.isNaN(raw) || raw <= 0 ? getQtyMin(p) : clampQuantity(raw, p);
    const next = clampQuantity(base + deltaSteps * step, p);
    setAddQtyInput(formatQtyEditValue(next, p));
  };

  const tryAddFromQuery = useCallback(() => {
    const q = query.trim();
    if (!q) {
      toast.error('Enter a product code or name');
      return;
    }
    let product: Product | undefined = products.find(
      (p) => p.code.toLowerCase() === q.toLowerCase()
    );
    if (!product && filtered.length === 1) product = filtered[0];
    if (!product && filtered.length > 0 && highlight >= 0 && highlight < filtered.length) {
      product = filtered[highlight];
    }
    if (!product) {
      toast.error('No matching product. Pick from the list or refine your search.');
      return;
    }
    const qty = parseTypedAddQty(product);
    if (qty == null) {
      toast.error('Enter a valid quantity to add');
      return;
    }
    addProduct(product, qty);
  }, [addProduct, filtered, highlight, parseTypedAddQty, products, query]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpenSuggest(false);
        dropdownItemRefs.current.clear();
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const totalValue = useMemo(
    () =>
      items.reduce(
        (sum, row) => sum + row.quantity * (row.unitPrice ?? 0),
        0
      ),
    [items]
  );

  const totalQty = useMemo(
    () => items.reduce((sum, row) => sum + Number(row.quantity), 0),
    [items]
  );

  const openProductDetail = async (productId: string) => {
    setDetailLoading(true);
    setDetailProduct(products.find((p) => p.id === productId) ?? null);
    try {
      const full = await productsApi.getById(productId);
      setDetailProduct(full);
    } catch {
      toast.error('Failed to load product details');
      setDetailProduct(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const removeRow = (productId: string) => {
    onItemsChange(items.filter((i) => i.productId !== productId));
    setQtyEditRow(null);
  };

  const bumpQuantity = (index: number, delta: number) => {
    setQtyEditRow(null);
    const row = items[index];
    const product = products.find((p) => p.id === row.productId);
    updateRowQuantity(index, row.quantity + delta);
  };

  const handleQtyFocus = (index: number) => {
    const row = items[index];
    const product = products.find((p) => p.id === row.productId);
    setQtyEditRow(index);
    setQtyDraft(formatQtyEditValue(row.quantity, product));
  };

  const handleQtyBlur = useCallback(
    (index: number, value: string) => {
      const row = items[index];
      if (!row) return;
      const raw = value.trim().replace(/,/g, '');
      const num = parseFloat(raw);
      if (Number.isNaN(num) || num <= 0) {
        updateRowQuantity(index, row.quantity);
      } else {
        updateRowQuantity(index, num);
      }
      setQtyEditRow(null);
    },
    [items, updateRowQuantity]
  );

  const handleImportUpload = async () => {
    if (!enableExcelImport) return;
    if (!importFile) {
      toast.error('Choose a file first');
      return;
    }
    try {
      const rows = await parseDeliveryImportFile(importFile);
      if (rows.length === 0) {
        toast.error('No valid rows found. Use ItemCode and Quantity columns.');
        return;
      }
      const byCode = new Map<string, Product>();
      for (const p of products) {
        byCode.set(p.code.toLowerCase().trim(), p);
      }
      let next = [...items];
      const missing: string[] = [];
      for (const { code, quantity } of rows) {
        const product = byCode.get(code.toLowerCase().trim());
        if (!product) {
          missing.push(code);
          continue;
        }
        next = upsertItem(next, product, quantity, { withReason: showReason });
      }
      onItemsChange(next);
      if (missing.length) {
        toast.error(
          `${missing.length} code(s) not found: ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '…' : ''}`
        );
      } else {
        toast.success(`Imported ${rows.length} row(s)`);
      }
      setImportOpen(false);
      setImportFile(null);
      setQtyEditRow(null);
      focusSearchInput();
    } catch {
      toast.error('Could not read the Excel file');
    }
  };

  const resolvedSearchHint =
    searchHelperText !== undefined
      ? searchHelperText
      : 'Use ↑/↓ and Enter to add. After add, quantity is selected to edit; Enter there returns to search.';

  return (
    <div className="space-y-4">
      <div
        ref={wrapRef}
        className="flex flex-col overflow-hidden rounded-lg border-2 bg-[var(--card)]"
        style={{ borderColor: 'var(--form-field-border)' }}
      >
        {accentToolbar ? (
          <div
            className="flex flex-col gap-2 border-b px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4"
            style={{
              borderColor: 'var(--form-field-border)',
              backgroundColor: `color-mix(in srgb, ${primaryColor} 16%, var(--muted))`,
            }}
          >
            <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              Item details
            </div>
            {enableExcelImport ? (
              <Button
                type="button"
                variant="secondary"
                className="shrink-0 self-start sm:self-auto"
                onClick={() => setImportOpen(true)}
              >
                <Upload className="mr-2 h-4 w-4" />
                Import Excel
              </Button>
            ) : null}
          </div>
        ) : null}
        <div className="flex flex-col gap-4 p-3 sm:p-4">
          {!accentToolbar ? (
            <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              Item details
            </div>
          ) : null}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-end">
              <div className="w-full min-w-0 max-w-[min(100%,20rem)] space-y-1">
                {!hideSearchLabel ? (
                  <label
                    className="text-xs font-medium sm:text-sm"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    Search by code or name
                  </label>
                ) : null}
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
                      setOpenSuggest(true);
                      setHighlight((h) =>
                        filtered.length ? Math.min(h + 1, filtered.length - 1) : 0
                      );
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setHighlight((h) => (filtered.length ? Math.max(h - 1, 0) : 0));
                    } else if (e.key === 'Enter') {
                      e.preventDefault();
                      tryAddFromQuery();
                    } else if (e.key === 'Escape') {
                      setOpenSuggest(false);
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
                          ref={(el) => {
                            if (el) dropdownItemRefs.current.set(i, el);
                            else dropdownItemRefs.current.delete(i);
                          }}
                          type="button"
                          role="option"
                          aria-selected={i === highlight}
                          className="flex w-full min-w-0 items-center px-3 py-2 text-left font-serif text-sm transition-colors"
                          style={{
                            backgroundColor:
                              i === highlight
                                ? `color-mix(in srgb, ${primaryColor} 14%, var(--muted))`
                                : 'transparent',
                          }}
                          onMouseEnter={() => setHighlight(i)}
                          onMouseDown={(ev) => ev.preventDefault()}
                          onClick={() => {
                            const qty = parseTypedAddQty(p);
                            if (qty == null) {
                              toast.error('Enter a valid quantity to add');
                              return;
                            }
                            addProduct(p, qty);
                          }}
                        >
                          <span className="min-w-0 flex-1 truncate" style={{ color: 'var(--foreground)' }}>
                            <span
                              className="font-mono font-semibold"
                              style={{ color: primaryColor }}
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
              {resolvedSearchHint ? (
                <p className="text-xs leading-snug" style={{ color: 'var(--muted-foreground)' }}>
                  {resolvedSearchHint}
                </p>
              ) : null}
            </div>
          </div>

          {!accentToolbar && enableExcelImport ? (
            <Button
              type="button"
              variant="secondary"
              className="shrink-0 self-start lg:self-auto"
              onClick={() => setImportOpen(true)}
            >
              <Upload className="mr-2 h-4 w-4" />
              Import Excel
            </Button>
          ) : null}
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
                backgroundColor: accentTableHeader
                  ? `color-mix(in srgb, ${primaryColor} 24%, var(--muted))`
                  : 'color-mix(in srgb, var(--foreground) 6%, var(--muted))',
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
                {showReason ? (
                  <th
                    className="px-3 py-2.5 text-left text-xs font-bold"
                    style={{ color: 'var(--foreground)' }}
                  >
                    Reason
                  </th>
                ) : null}
                {showPricing ? (
                  <th
                    className="px-3 py-2.5 text-right text-xs font-bold"
                    style={{ color: 'var(--foreground)' }}
                  >
                    Price
                  </th>
                ) : null}
                <th
                  className="px-3 py-2.5 text-right text-xs font-bold"
                  style={{ color: 'var(--foreground)' }}
                >
                  Quantity
                </th>
                {showPricing ? (
                  <th
                    className="px-3 py-2.5 text-right text-xs font-bold"
                    style={{ color: 'var(--foreground)' }}
                  >
                    Totals
                  </th>
                ) : null}
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
                const lineTotal = row.quantity * (row.unitPrice ?? 0);
                const step = getQtyStep(product);
                const min = getQtyMin(product);
                const atMin = row.quantity <= min + 1e-9;
                return (
                  <tr
                    key={row.productId}
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
                        className="font-mono font-semibold underline underline-offset-2 hover:opacity-90"
                        style={{ color: primaryColor }}
                        onClick={() => openProductDetail(row.productId)}
                      >
                        {product?.code ?? '—'}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-sm" style={{ color: 'var(--foreground)' }}>
                      {product?.name ?? '—'}
                    </td>
                    {showReason ? (
                      <td className="px-3 py-2 align-middle">
                        <input
                          type="text"
                          value={row.reason ?? ''}
                          onChange={(e) => updateRowReason(index, e.target.value)}
                          placeholder={reasonPlaceholder}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              (e.target as HTMLInputElement).blur();
                              focusSearchInput();
                            }
                          }}
                          className="w-full min-w-[8rem] max-w-[20rem] rounded-md border px-2 py-1.5 text-sm outline-none focus:outline focus:outline-2 focus:outline-offset-0"
                          style={{
                            borderColor: 'var(--form-field-border)',
                            backgroundColor: 'var(--background)',
                            color: 'var(--foreground)',
                            outlineColor: 'var(--form-focus-ring)',
                          }}
                          aria-label="Reason"
                        />
                      </td>
                    ) : null}
                    {showPricing ? (
                      <td
                        className="px-3 py-2 text-right text-sm tabular-nums"
                        style={{ color: 'var(--foreground)' }}
                      >
                        {(row.unitPrice ?? 0).toFixed(2)}
                      </td>
                    ) : null}
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex items-center justify-end gap-1">
                        <button
                          type="button"
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-sm transition-colors disabled:opacity-40"
                          style={{
                            borderColor: 'var(--form-field-border)',
                            backgroundColor: 'var(--muted)',
                            color: 'var(--foreground)',
                          }}
                          disabled={atMin}
                          title="Decrease quantity"
                          onClick={() => bumpQuantity(index, -step)}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <input
                          ref={(el) => {
                            if (el) qtyInputRefs.current.set(row.productId, el);
                            else qtyInputRefs.current.delete(row.productId);
                          }}
                          type="text"
                          inputMode={product?.allowDecimal ? 'decimal' : 'numeric'}
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
                              : formatQtyEditValue(row.quantity, product)
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
                              const el = e.target as HTMLInputElement;
                              el.blur();
                              focusSearchInput();
                            }
                          }}
                          aria-label="Quantity"
                        />
                        <button
                          type="button"
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-sm transition-colors"
                          style={{
                            borderColor: 'var(--form-field-border)',
                            backgroundColor: 'var(--muted)',
                            color: 'var(--foreground)',
                          }}
                          title="Increase quantity"
                          onClick={() => bumpQuantity(index, step)}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    {showPricing ? (
                      <td
                        className="px-3 py-2 text-right text-sm font-semibold tabular-nums"
                        style={{ color: 'var(--foreground)' }}
                      >
                        Rs.{lineTotal.toFixed(2)}
                      </td>
                    ) : null}
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        className="p-1 text-red-600"
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
          No items added.
        </div>
      )}

      <div
        className="flex justify-end border-t px-3 py-3 sm:px-4"
        style={{ borderColor: 'var(--form-field-border)' }}
      >
        {showPricing ? (
          <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            Total Rs.{totalValue.toFixed(2)}
          </span>
        ) : (
          <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--foreground)' }}>
            {items.length} line{items.length === 1 ? '' : 's'} · Total qty {totalQty.toLocaleString(undefined, {
              maximumFractionDigits: 4,
            })}
          </span>
        )}
      </div>
      </div>

      {enableExcelImport ? (
      <Modal
        isOpen={importOpen}
        onClose={() => {
          setImportOpen(false);
          setImportFile(null);
        }}
        title={showPricing ? 'Import Excel — Delivery items' : 'Import Excel — Items (code & quantity)'}
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <p className="mb-2 text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              Step 1 — Download the template
            </p>
            <p className="mb-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Add one row per line with columns <strong>ItemCode</strong> and{' '}
              <strong>Quantity</strong>.
            </p>
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                downloadDeliveryImportTemplate();
                toast.success('Template downloaded');
              }}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Download Excel template
            </Button>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              Step 2 — Upload your file
            </p>
            <input
              type="file"
              accept=".xlsx,.xls"
              className="text-sm"
              onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
            />
            <p className="mt-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {importFile ? importFile.name : 'No file selected'}
            </p>
          </div>
        </div>
        <ModalFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setImportOpen(false);
              setImportFile(null);
            }}
          >
            Cancel
          </Button>
          <Button type="button" variant="primary" onClick={handleImportUpload}>
            Upload
          </Button>
        </ModalFooter>
      </Modal>
      ) : null}

      <Modal
        isOpen={!!detailProduct || detailLoading}
        onClose={() => {
          setDetailProduct(null);
          setDetailLoading(false);
        }}
        title="Item Details"
        size="lg"
        closeVariant="danger"
        titleClassName="font-serif text-xl font-bold tracking-tight text-[var(--foreground)]"
      >
        {detailLoading && (
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Loading…
          </p>
        )}
        {detailProduct && !detailLoading && (
          <div
            className="rounded-md border p-1 sm:p-2"
            style={{
              backgroundColor: 'var(--background)',
              borderColor: 'var(--form-field-border)',
            }}
          >
            <dl className="grid grid-cols-1 sm:grid-cols-[minmax(11rem,42%)_1fr]">
              <ItemDetailGridRow
                label="Product Category"
                value={detailProduct.categoryName || '—'}
                labelColor={primaryColor}
              />
              <ItemDetailGridRow
                label="Product Code"
                value={detailProduct.code}
                labelColor={primaryColor}
              />
              <ItemDetailGridRow
                label="Product Description"
                value={
                  detailProduct.description?.trim() || detailProduct.name || '—'
                }
                labelColor={primaryColor}
              />
              <ItemDetailGridRow
                label="Production Section"
                value={
                  detailProduct.productionSectionName ||
                  detailProduct.productionSection ||
                  '—'
                }
                labelColor={primaryColor}
              />
              <ItemDetailGridRow
                label="Required Open Stock"
                value={yesNo(detailProduct.requireOpenStock)}
                labelColor={primaryColor}
              />
              <ItemDetailGridRow
                label="Active"
                value={yesNo(detailProduct.isActive)}
                labelColor={primaryColor}
              />
              <ItemDetailGridRow
                label="Show in POS"
                value={yesNoWithDefault(detailProduct.showInPos, 'yes')}
                labelColor={primaryColor}
              />
              <ItemDetailGridRow
                label="Favorite"
                value={yesNoWithDefault(detailProduct.favorite, 'no')}
                labelColor={primaryColor}
              />
              <ItemDetailGridRow
                label="Unit Price"
                value={priceLabel(detailProduct.unitPrice)}
                labelColor={primaryColor}
              />
              <ItemDetailGridRow
                label="Enable Label Print"
                value={yesNo(detailProduct.enableLabelPrint)}
                labelColor={primaryColor}
              />
              {detailProduct.enableLabelPrint ? (
                <ItemDetailGridRow
                  label="Label Template"
                  value={formatLabelTemplateDisplay(detailProduct)}
                  labelColor={primaryColor}
                />
              ) : null}
              <ItemDetailGridRow
                label="Expiry Days"
                value={formatExpiryNum(detailProduct.expiryDays)}
                labelColor={primaryColor}
              />
              <ItemDetailGridRow
                label="Expiry Hours"
                value={formatExpiryNum(detailProduct.expiryHours)}
                labelColor={primaryColor}
              />
            </dl>
          </div>
        )}
        <ModalFooter>
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              setDetailProduct(null);
              setDetailLoading(false);
            }}
          >
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

function formatExpiryNum(n: number | null | undefined): string {
  if (n != null && !Number.isNaN(Number(n))) return String(n);
  return '0';
}

function formatLabelTemplateDisplay(p: {
  labelTemplateCode?: string | null;
  labelTemplateName?: string | null;
}): string {
  const code = p.labelTemplateCode?.trim();
  const name = p.labelTemplateName?.trim();
  if (code && name) return `${code} — ${name}`;
  if (name) return name;
  if (code) return code;
  return '—';
}

function ItemDetailGridRow({
  label,
  value,
  labelColor,
}: {
  label: string;
  value: string;
  labelColor: string;
}) {
  return (
    <Fragment key={label}>
      <dt
        className="border-b border-dashed py-2.5 pr-2 font-serif text-sm font-bold sm:pr-4"
        style={{ borderColor: 'var(--form-field-border)', color: labelColor }}
      >
        {label}
      </dt>
      <dd
        className="border-b border-dashed py-2.5 font-sans text-sm sm:pl-1"
        style={{ borderColor: 'var(--form-field-border)', color: 'var(--foreground)' }}
      >
        {value}
      </dd>
    </Fragment>
  );
}
