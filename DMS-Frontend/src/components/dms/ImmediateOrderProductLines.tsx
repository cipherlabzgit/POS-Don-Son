'use client';

/**
 * Same UX pattern as ItemManagementTable / DailyProductionLinesTable:
 * search product → enter quantities → Add → listed below with remove.
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Plus, XCircle, Search, ChevronDown } from 'lucide-react';
import type { Product } from '@/lib/api/products';
import { toast } from 'sonner';

export interface ImmediateOrderLineItem {
  productId: string;
  fullQuantity: number;
  miniQuantity: number;
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
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = products.find((p) => p.id === value);
  const displayValue = selected ? `${selected.code} — ${selected.name}` : '';

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q),
    );
  }, [products, query]);

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

  const handleSelect = (id: string) => {
    onChange(id);
    setQuery('');
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setOpen(true);
    if (!e.target.value) onChange('');
  };

  const handleFocus = () => {
    setQuery('');
    setOpen(true);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
        Product
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
          onChange={handleInputChange}
          onFocus={handleFocus}
          autoComplete="off"
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
        >
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
              No products found
            </div>
          ) : (
            filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                className="w-full text-left px-3 py-2 text-sm transition-colors hover:bg-opacity-80"
                style={{
                  backgroundColor: p.id === value ? 'var(--accent)' : undefined,
                  color: 'var(--foreground)',
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(p.id);
                }}
              >
                <span className="font-mono font-medium">{p.code}</span>
                <span style={{ color: 'var(--muted-foreground)' }}> — {p.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

interface ImmediateOrderProductLinesProps {
  products: Product[];
  items: ImmediateOrderLineItem[];
  onItemsChange: (items: ImmediateOrderLineItem[]) => void;
}

export default function ImmediateOrderProductLines({
  products,
  items,
  onItemsChange,
}: ImmediateOrderProductLinesProps) {
  const [draftProductId, setDraftProductId] = useState('');
  const [fullStr, setFullStr] = useState('');
  const [miniStr, setMiniStr] = useState('');

  const draftProduct = useMemo(
    () => (draftProductId ? products.find((p) => p.id === draftProductId) : undefined),
    [products, draftProductId],
  );

  const step = draftProduct?.allowDecimal ? '0.01' : '1';

  const parseQty = (raw: string): number => {
    const n = parseFloat(raw.replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  };

  const handleAdd = () => {
    if (!draftProductId) {
      toast.error('Select a product');
      return;
    }
    const full = parseQty(fullStr);
    const mini = draftProduct?.hasMiniSize ? parseQty(miniStr) : 0;
    if (mini > 0 && !draftProduct?.hasMiniSize) {
      toast.error('This product has no mini variant');
      return;
    }
    if (full <= 0 && mini <= 0) {
      toast.error('Enter full and/or mini quantity');
      return;
    }

    const existingIdx = items.findIndex((i) => i.productId === draftProductId);
    if (existingIdx >= 0) {
      const next = [...items];
      next[existingIdx] = {
        productId: draftProductId,
        fullQuantity: next[existingIdx].fullQuantity + full,
        miniQuantity: next[existingIdx].miniQuantity + mini,
      };
      onItemsChange(next);
      toast.success('Quantities updated for this product');
    } else {
      onItemsChange([...items, { productId: draftProductId, fullQuantity: full, miniQuantity: mini }]);
      toast.success('Product added');
    }

    setDraftProductId('');
    setFullStr('');
    setMiniStr('');
  };

  const handleRemove = (productId: string) => {
    onItemsChange(items.filter((i) => i.productId !== productId));
    toast.success('Removed');
  };

  const addDisabled =
    !draftProductId ||
    (parseQty(fullStr) <= 0 && (!draftProduct?.hasMiniSize || parseQty(miniStr) <= 0));

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
        Products &amp; quantities
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
        <div className="lg:col-span-5">
          <ProductSearchCombobox products={products} value={draftProductId} onChange={setDraftProductId} />
        </div>
        <div className="lg:col-span-2">
          <Input
            label="Full"
            type="number"
            min={0}
            step={step}
            value={fullStr}
            onChange={(e) => setFullStr(e.target.value)}
            placeholder="0"
            fullWidth
          />
        </div>
        <div className="lg:col-span-2">
          {draftProduct?.hasMiniSize ? (
            <Input
              label="Mini"
              type="number"
              min={0}
              step={step}
              value={miniStr}
              onChange={(e) => setMiniStr(e.target.value)}
              placeholder="0"
              fullWidth
            />
          ) : (
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                Mini
              </label>
              <div
                className="flex h-10 items-center justify-center rounded-md border text-sm"
                style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)', backgroundColor: 'var(--muted)' }}
              >
                —
              </div>
            </div>
          )}
        </div>
        <div className="lg:col-span-3 flex items-end">
          <Button type="button" variant="primary" size="md" className="w-full" onClick={handleAdd} disabled={addDisabled}>
            <Plus className="w-4 h-4 mr-2" />
            Add to list
          </Button>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: 'var(--muted)' }}>
              <tr>
                <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                  Product
                </th>
                <th className="px-4 py-3 text-right font-semibold w-28" style={{ color: 'var(--muted-foreground)' }}>
                  Full
                </th>
                <th className="px-4 py-3 text-right font-semibold w-28" style={{ color: 'var(--muted-foreground)' }}>
                  Mini
                </th>
                <th className="px-4 py-3 text-center font-semibold w-24"> </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const p = products.find((x) => x.id === item.productId);
                const fmt = (v: number) =>
                  p?.allowDecimal ? Number(v).toFixed(p.decimalPlaces ?? 2) : String(Math.round(v));
                return (
                  <tr key={item.productId} className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold" style={{ color: '#C8102E' }}>
                        {p?.code ?? '?'}
                      </span>
                      <span className="ml-2">{p?.name ?? 'Unknown'}</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{fmt(item.fullQuantity)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {p?.hasMiniSize ? fmt(item.miniQuantity) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemove(item.productId)}
                        className="inline-flex p-1.5 rounded-md hover:bg-red-50"
                        style={{ color: 'var(--destructive)' }}
                        title="Remove"
                      >
                        <XCircle className="w-4 h-4" />
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
          className="text-center py-8 border rounded-lg text-sm"
          style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
        >
          No products yet. Search above, enter quantities, then <strong>Add to list</strong>.
        </div>
      )}

      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
        Adding the same product again merges quantities. Each line becomes one immediate order when you submit.
      </p>
    </div>
  );
}
