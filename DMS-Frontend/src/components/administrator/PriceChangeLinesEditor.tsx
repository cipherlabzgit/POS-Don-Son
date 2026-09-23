'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import CsvBulkUploadBar from '@/components/dms/CsvBulkUploadBar';
import type { Product } from '@/lib/api/products';
import { filterByCodeOrName, foldProductSearch } from '@/lib/product-search';
import { DEFAULT_BRAND_COLOR } from '@/lib/stores/theme-store';
import { Plus, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export type PriceChangeLine = {
  productId: string;
  productCode: string;
  productName: string;
  previousPrice: number;
  newPrice: number;
};

function formatRs(n: number) {
  return `Rs. ${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function ProductSearchCombobox({
  products,
  value,
  onChange,
  onSelected,
  primaryColor = DEFAULT_BRAND_COLOR,
}: {
  products: Product[];
  value: string;
  onChange: (id: string) => void;
  /** Called after a product is picked (e.g. focus New Price). */
  onSelected?: () => void;
  primaryColor?: string;
}) {
  const [query, setQuery] = useState('');
  const [openSuggest, setOpenSuggest] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownItemRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  const selected = products.find((p) => p.id === value);
  const filtered = useMemo(
    () => filterByCodeOrName(products, query, { limit: 15, whenEmpty: 'none' }),
    [products, query],
  );

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  useEffect(() => {
    const el = dropdownItemRefs.current.get(highlight);
    if (el && openSuggest) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [highlight, openSuggest]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenSuggest(false);
        dropdownItemRefs.current.clear();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pickProduct = useCallback(
    (p: Product) => {
      onChange(p.id);
      setQuery('');
      setOpenSuggest(false);
      setHighlight(0);
      onSelected?.();
    },
    [onChange, onSelected],
  );

  const resolveFromQuery = useCallback((): Product | undefined => {
    const q = query.trim();
    if (!q) return undefined;
    let product: Product | undefined = products.find(
      (p) => foldProductSearch(p.code) === foldProductSearch(q),
    );
    if (!product && filtered.length === 1) product = filtered[0];
    if (!product && filtered.length > 0 && highlight >= 0 && highlight < filtered.length) {
      product = filtered[highlight];
    }
    return product;
  }, [filtered, highlight, products, query]);

  const trySelectFromQuery = useCallback(() => {
    const q = query.trim();
    if (!q) {
      toast.error('Enter a product code or name');
      return;
    }
    const product = resolveFromQuery();
    if (!product) {
      toast.error('No matching product. Pick from the list or refine your search.');
      return;
    }
    pickProduct(product);
  }, [pickProduct, query, resolveFromQuery]);

  return (
    <div ref={containerRef} className="relative w-full space-y-1">
      <label className="block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
        Item
      </label>
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--muted-foreground)' }}
        />
        <input
          type="text"
          className="w-full rounded-lg py-2 pl-9 pr-3 text-sm outline-none transition-[border-color,outline,box-shadow]"
          style={{
            border: '2px solid var(--form-field-border)',
            backgroundColor: 'var(--background)',
            color: 'var(--foreground)',
            boxShadow: 'inset 0 1px 2px rgba(15, 23, 42, 0.05)',
          }}
          placeholder="Enter product code"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpenSuggest(true);
            if (value) onChange('');
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
                filtered.length ? Math.min(h + 1, filtered.length - 1) : 0,
              );
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlight((h) => (filtered.length ? Math.max(h - 1, 0) : 0));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              trySelectFromQuery();
            } else if (e.key === 'Escape') {
              setOpenSuggest(false);
            }
          }}
          autoComplete="off"
          role="combobox"
          aria-expanded={openSuggest}
          aria-autocomplete="list"
        />
        {openSuggest && query.trim() && filtered.length > 0 && (
          <ul
            className="absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-lg border shadow-md"
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
                  className="flex w-full min-w-0 items-center px-3 py-2 text-left text-sm transition-colors"
                  style={{
                    backgroundColor:
                      i === highlight
                        ? `color-mix(in srgb, ${primaryColor} 14%, var(--muted))`
                        : 'transparent',
                  }}
                  onMouseEnter={() => setHighlight(i)}
                  onMouseDown={(ev) => {
                    ev.preventDefault();
                    pickProduct(p);
                  }}
                >
                  <span className="min-w-0 flex-1 truncate" style={{ color: 'var(--foreground)' }}>
                    <span className="font-mono font-semibold" style={{ color: primaryColor }}>
                      {p.code}
                    </span>
                    <span style={{ color: 'var(--muted-foreground)' }}> - {p.name}</span>
                    <span className="ml-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {formatRs(p.unitPrice ?? 0)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-xs leading-snug" style={{ color: 'var(--muted-foreground)' }}>
        Use ↑/↓ and Enter to select an item.
      </p>
      {selected ? (
        <p className="text-xs font-medium leading-snug" style={{ color: primaryColor }}>
          Selected: {selected.code} — {selected.name}
        </p>
      ) : null}
    </div>
  );
}

export function PriceChangeLinesEditor({
  products,
  lines,
  onChange,
  canImport,
  primaryColor = DEFAULT_BRAND_COLOR,
}: {
  products: Product[];
  lines: PriceChangeLine[];
  onChange: (lines: PriceChangeLine[]) => void;
  canImport?: boolean;
  primaryColor?: string;
}) {
  const [draftProductId, setDraftProductId] = useState('');
  const [draftPrice, setDraftPrice] = useState('');
  const linesRef = useRef(lines);
  const priceInputRef = useRef<HTMLInputElement>(null);
  linesRef.current = lines;

  const selected = products.find((p) => p.id === draftProductId);

  const focusNewPrice = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = priceInputRef.current;
        if (!el) return;
        el.focus();
        el.select();
      });
    });
  }, []);

  const upsertLine = (line: PriceChangeLine) => {
    const next = [...linesRef.current.filter((l) => l.productId !== line.productId), line];
    linesRef.current = next;
    onChange(next);
  };

  const addLine = () => {
    if (!selected) {
      toast.error('Select a product from the search bar.');
      return;
    }
    const price = Number(draftPrice);
    if (!Number.isFinite(price) || price < 0) {
      toast.error('Enter a valid new price.');
      return;
    }
    upsertLine({
      productId: selected.id,
      productCode: selected.code,
      productName: selected.name,
      previousPrice: selected.unitPrice ?? 0,
      newPrice: price,
    });
    setDraftProductId('');
    setDraftPrice('');
  };

  return (
    <div className="space-y-4">
      {canImport && (
        <CsvBulkUploadBar<{ product: Product; newPrice: number }>
          entityLabel="price items"
          templateFilename="price-manager-items.csv"
          permission="pricing:create"
          columns={[{ header: 'productCode' }, { header: 'newPrice' }]}
          previewDataHeaders={['productCode', 'newPrice']}
          exampleRows={[['P001', '250.00']]}
          mapRow={async (row) => {
            const code = (row.productCode ?? '').trim();
            const priceRaw = (row.newPrice ?? '').trim();
            if (!code) return { ok: false, error: 'productCode is required' };
            const product = products.find((p) => foldProductSearch(p.code) === foldProductSearch(code));
            if (!product) return { ok: false, error: `Unknown product code: ${code}` };
            const newPrice = Number(priceRaw);
            if (!Number.isFinite(newPrice) || newPrice < 0) return { ok: false, error: 'Invalid newPrice' };
            return { ok: true, value: { product, newPrice } };
          }}
          importRow={async ({ product, newPrice }) => {
            upsertLine({
              productId: product.id,
              productCode: product.code,
              productName: product.name,
              previousPrice: product.unitPrice ?? 0,
              newPrice,
            });
          }}
        />
      )}

      <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-12">
        <div className="md:col-span-7">
          <ProductSearchCombobox
            products={products}
            value={draftProductId}
            onChange={setDraftProductId}
            onSelected={focusNewPrice}
            primaryColor={primaryColor}
          />
        </div>
        <div className="md:col-span-3">
          <Input
            ref={priceInputRef}
            label="New Price *"
            type="number"
            min={0}
            step="0.01"
            value={draftPrice}
            onChange={(e) => setDraftPrice(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addLine();
              }
            }}
            placeholder={selected ? String(selected.unitPrice ?? 0) : '0.00'}
            helperText={selected ? `Current: ${formatRs(selected.unitPrice ?? 0)}` : 'Select an item first'}
            fullWidth
          />
        </div>
        <div className="md:col-span-2">
          <Button type="button" variant="primary" onClick={addLine} className="w-full">
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'var(--muted)' }}>
              <th className="px-3 py-2 text-left">Code</th>
              <th className="px-3 py-2 text-left">Item</th>
              <th className="px-3 py-2 text-right">Previous Price</th>
              <th className="px-3 py-2 text-right">New Price</th>
              <th className="w-12 px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center" style={{ color: 'var(--muted-foreground)' }}>
                  Search and add items, or bulk-import a CSV.
                </td>
              </tr>
            ) : (
              lines.map((line) => (
                <tr key={line.productId} className="border-t" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-3 py-2 font-mono">{line.productCode}</td>
                  <td className="px-3 py-2">{line.productName}</td>
                  <td className="px-3 py-2 text-right" style={{ color: 'var(--muted-foreground)' }}>
                    {formatRs(line.previousPrice)}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">{formatRs(line.newPrice)}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      title="Remove"
                      onClick={() => onChange(lines.filter((l) => l.productId !== line.productId))}
                      className="rounded p-1"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
