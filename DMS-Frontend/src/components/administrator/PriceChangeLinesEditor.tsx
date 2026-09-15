'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import CsvBulkUploadBar from '@/components/dms/CsvBulkUploadBar';
import type { Product } from '@/lib/api/products';
import { filterByCodeOrName, foldProductSearch } from '@/lib/product-search';
import { Plus, Search, ChevronDown, Trash2 } from 'lucide-react';
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
}: {
  products: Product[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownItemRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  const selected = products.find((p) => p.id === value);
  const displayValue = selected ? `${selected.code} — ${selected.name}` : '';
  const filtered = useMemo(
    () => filterByCodeOrName(products, query, { limit: 20, whenEmpty: 'none' }),
    [products, query],
  );

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  useEffect(() => {
    const el = dropdownItemRefs.current.get(highlight);
    if (el && open) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [highlight, open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        if (!value) setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [value]);

  const pickProduct = (p: Product) => {
    onChange(p.id);
    setQuery('');
    setOpen(false);
    setHighlight(0);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
        Item
      </label>
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: 'var(--muted-foreground)' }}
        />
        <input
          type="text"
          className="w-full pl-9 pr-8 py-2 text-sm border rounded-md focus:outline-none focus:ring-2"
          style={{
            backgroundColor: 'var(--background)',
            borderColor: 'var(--border)',
            color: 'var(--foreground)',
          }}
          placeholder={open ? 'Search by code or name…' : 'Search product…'}
          value={open ? query : displayValue}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (!e.target.value) onChange('');
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setOpen(true);
              setHighlight((h) => (filtered.length ? Math.min(h + 1, filtered.length - 1) : 0));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlight((h) => (filtered.length ? Math.max(h - 1, 0) : 0));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              const pick =
                filtered.length > 0
                  ? filtered[Math.min(Math.max(highlight, 0), filtered.length - 1)]
                  : undefined;
              if (pick) pickProduct(pick);
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
        />
        <ChevronDown
          className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: 'var(--muted-foreground)' }}
        />
      </div>
      {open && (
        <div
          className="absolute z-50 mt-1 w-full border rounded-md shadow-lg max-h-60 overflow-y-auto"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
          role="listbox"
        >
          {!query.trim() ? (
            <div className="px-3 py-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Type a product code or name
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
              No products found
            </div>
          ) : (
            filtered.map((p, i) => (
              <button
                key={p.id}
                ref={(el) => {
                  if (el) dropdownItemRefs.current.set(i, el);
                  else dropdownItemRefs.current.delete(i);
                }}
                type="button"
                role="option"
                aria-selected={i === highlight}
                className="w-full text-left px-3 py-2 text-sm"
                style={{
                  backgroundColor:
                    i === highlight
                      ? 'color-mix(in srgb, var(--accent) 70%, var(--muted))'
                      : p.id === value
                        ? 'var(--accent)'
                        : undefined,
                  color: 'var(--foreground)',
                }}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pickProduct(p);
                }}
              >
                <span className="font-mono font-medium">{p.code}</span>
                <span style={{ color: 'var(--muted-foreground)' }}> — {p.name}</span>
                <span className="ml-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {formatRs(p.unitPrice ?? 0)}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function PriceChangeLinesEditor({
  products,
  lines,
  onChange,
  canImport,
}: {
  products: Product[];
  lines: PriceChangeLine[];
  onChange: (lines: PriceChangeLine[]) => void;
  canImport?: boolean;
}) {
  const [draftProductId, setDraftProductId] = useState('');
  const [draftPrice, setDraftPrice] = useState('');
  const linesRef = useRef(lines);
  linesRef.current = lines;

  const selected = products.find((p) => p.id === draftProductId);

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

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        <div className="md:col-span-7">
          <ProductSearchCombobox products={products} value={draftProductId} onChange={setDraftProductId} />
        </div>
        <div className="md:col-span-3">
          <Input
            label="New Price *"
            type="number"
            min={0}
            step="0.01"
            value={draftPrice}
            onChange={(e) => setDraftPrice(e.target.value)}
            placeholder={selected ? String(selected.unitPrice ?? 0) : '0.00'}
            helperText={selected ? `Current: ${formatRs(selected.unitPrice ?? 0)}` : 'Select an item first'}
            fullWidth
          />
        </div>
        <div className="md:col-span-2">
          <Button type="button" variant="primary" onClick={addLine} className="w-full">
            <Plus className="w-4 h-4 mr-1" />
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
              <th className="px-3 py-2 w-12" />
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
                      className="p-1 rounded"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      <Trash2 className="w-4 h-4" />
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
