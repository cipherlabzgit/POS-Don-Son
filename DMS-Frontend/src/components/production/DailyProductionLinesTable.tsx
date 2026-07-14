'use client';

import { useState, useRef, useEffect } from 'react';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import { Plus, XCircle, Edit2, Check, X, Search, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

export interface ProductionLineProduct {
  id: string;
  code: string;
  name: string;
  productionSectionId?: string;
  sectionAssignments?: { productionSectionId: string; productionSectionName: string }[];
}

export interface ProductionSection {
  id: string;
  name: string;
}

export interface DailyProductionLineItem {
  productId: string;
  productionSectionId: string;
  plannedQty: number;
  producedQty: number;
}

interface DailyProductionLinesTableProps {
  products: ProductionLineProduct[];
  productionSections: ProductionSection[];
  items: DailyProductionLineItem[];
  onItemsChange: (items: DailyProductionLineItem[]) => void;
  primaryColor?: string;
}

function ProductSearchCombobox({
  products,
  value,
  onChange,
  label = 'Product',
}: {
  products: ProductionLineProduct[];
  value: string;
  onChange: (id: string) => void;
  label?: string;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = products.find((p) => p.id === value);
  const displayValue = selected ? `${selected.code} - ${selected.name}` : '';

  const filtered = query.trim()
    ? products.filter(
        (p) =>
          p.code.toLowerCase().includes(query.toLowerCase()) ||
          p.name.toLowerCase().includes(query.toLowerCase()),
      )
    : products;

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
        {label}
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
          placeholder={open ? 'Search by code or name…' : 'Select product'}
          value={open ? query : displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
        />
        <ChevronDown
          className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: 'var(--muted-foreground)' }}
        />
      </div>
      {open && (
        <div
          className="absolute z-50 mt-1 w-full border rounded-md shadow-lg max-h-60 overflow-y-auto"
          style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
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
                className="w-full text-left px-3 py-2 text-sm hover:bg-opacity-80 transition-colors"
                style={{
                  backgroundColor: p.id === value ? 'var(--accent)' : undefined,
                  color: 'var(--foreground)',
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(p.id);
                }}
              >
                <span className="font-medium">{p.code}</span>
                <span style={{ color: 'var(--muted-foreground)' }}> — {p.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function resolveSection(product: ProductionLineProduct): string {
  if (product.productionSectionId) return product.productionSectionId;
  if (product.sectionAssignments?.length === 1) return product.sectionAssignments[0].productionSectionId;
  return '';
}

export default function DailyProductionLinesTable({
  products,
  productionSections,
  items,
  onItemsChange,
  primaryColor = '#C8102E',
}: DailyProductionLinesTableProps) {
  const [draft, setDraft] = useState({
    productId: '',
    productionSectionId: '',
    plannedQty: '',
    producedQty: '0',
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState({
    productionSectionId: '',
    plannedQty: '',
    producedQty: '',
  });

  const selectedProduct = products.find((p) => p.id === draft.productId);
  const needsSectionPicker =
    selectedProduct &&
    !selectedProduct.productionSectionId &&
    (selectedProduct.sectionAssignments?.length ?? 0) !== 1;

  const handleProductChange = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    const autoSection = product ? resolveSection(product) : '';
    setDraft((prev) => ({ ...prev, productId, productionSectionId: autoSection }));
  };

  const handleAdd = () => {
    if (!draft.productId) {
      toast.error('Please select a product');
      return;
    }
    const sectionId = draft.productionSectionId;
    if (!sectionId) {
      toast.error('Please select a production section for this product');
      return;
    }
    const planned = draft.plannedQty === '' ? 0 : parseFloat(draft.plannedQty);
    const produced = draft.producedQty === '' ? 0 : parseFloat(draft.producedQty);
    if (Number.isNaN(planned) || planned <= 0) {
      toast.error('Planned quantity must be greater than 0');
      return;
    }
    if (Number.isNaN(produced) || produced < 0) {
      toast.error('Produced quantity must be zero or greater');
      return;
    }
    onItemsChange([
      ...items,
      { productId: draft.productId, productionSectionId: sectionId, plannedQty: planned, producedQty: produced },
    ]);
    setDraft({ productId: '', productionSectionId: '', plannedQty: '', producedQty: '0' });
    toast.success('Product line added');
  };

  const removeAt = (index: number) => {
    onItemsChange(items.filter((_, i) => i !== index));
    setEditingIndex(null);
    toast.success('Line removed');
  };

  const startEdit = (index: number) => {
    const row = items[index];
    setEditingIndex(index);
    setEditDraft({
      productionSectionId: row.productionSectionId,
      plannedQty: String(row.plannedQty),
      producedQty: String(row.producedQty),
    });
  };

  const saveEdit = (index: number) => {
    if (!editDraft.productionSectionId) {
      toast.error('Please select a production section');
      return;
    }
    const planned = parseFloat(editDraft.plannedQty);
    const produced = parseFloat(editDraft.producedQty);
    if (Number.isNaN(planned) || planned <= 0) {
      toast.error('Planned quantity must be greater than 0');
      return;
    }
    if (Number.isNaN(produced) || produced < 0) {
      toast.error('Produced quantity must be zero or greater');
      return;
    }
    const next = [...items];
    next[index] = {
      ...next[index],
      productionSectionId: editDraft.productionSectionId,
      plannedQty: planned,
      producedQty: produced,
    };
    onItemsChange(next);
    setEditingIndex(null);
    toast.success('Line updated');
  };

  const totalPlanned = items.reduce((s, i) => s + i.plannedQty, 0);
  const totalProduced = items.reduce((s, i) => s + i.producedQty, 0);

  const sectionOptions = productionSections.map((s) => ({ value: s.id, label: s.name }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className={needsSectionPicker ? 'md:col-span-3' : 'md:col-span-4'}>
          <ProductSearchCombobox
            products={products}
            value={draft.productId}
            onChange={handleProductChange}
          />
        </div>

        {needsSectionPicker && (
          <div className="md:col-span-3">
            <Select
              label="Production Section"
              value={draft.productionSectionId}
              onChange={(e) => setDraft((prev) => ({ ...prev, productionSectionId: e.target.value }))}
              options={
                selectedProduct?.sectionAssignments?.length
                  ? selectedProduct.sectionAssignments.map((a) => ({
                      value: a.productionSectionId,
                      label: a.productionSectionName,
                    }))
                  : sectionOptions
              }
              placeholder="Select section"
              fullWidth
            />
          </div>
        )}

        <div className="md:col-span-2">
          <Input
            label="Planned qty"
            type="number"
            value={draft.plannedQty}
            onChange={(e) => setDraft({ ...draft, plannedQty: e.target.value })}
            placeholder="0"
            fullWidth
            min="0"
            step="0.01"
          />
        </div>
        <div className="md:col-span-2">
          <Input
            label="Produced qty"
            type="number"
            value={draft.producedQty}
            onChange={(e) => setDraft({ ...draft, producedQty: e.target.value })}
            placeholder="0"
            fullWidth
            min="0"
            step="0.01"
          />
        </div>
        <div className="md:col-span-2 flex items-end">
          <Button
            variant="primary"
            size="md"
            type="button"
            className="w-full"
            onClick={handleAdd}
            disabled={!draft.productId}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add line
          </Button>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead style={{ backgroundColor: 'var(--muted)' }}>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Product</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Section</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Planned</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Produced</th>
                <th className="px-4 py-3 text-center text-sm font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const product = products.find((p) => p.id === item.productId);
                const section = productionSections.find((s) => s.id === item.productionSectionId);
                const isEditing = editingIndex === index;
                return (
                  <tr key={`${item.productId}-${index}`} className="border-t">
                    <td className="px-4 py-3 text-sm">
                      {product ? `${product.code} - ${product.name}` : 'Unknown'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {isEditing ? (
                        <select
                          value={editDraft.productionSectionId}
                          onChange={(e) =>
                            setEditDraft({ ...editDraft, productionSectionId: e.target.value })
                          }
                          className="px-2 py-1 border rounded text-sm"
                        >
                          <option value="">Select section</option>
                          {sectionOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        section?.name ?? <span className="text-red-500 text-xs">No section</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editDraft.plannedQty}
                          onChange={(e) => setEditDraft({ ...editDraft, plannedQty: e.target.value })}
                          className="w-24 px-2 py-1 text-right border rounded"
                          min="0"
                          step="0.01"
                        />
                      ) : (
                        item.plannedQty.toFixed(2)
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editDraft.producedQty}
                          onChange={(e) => setEditDraft({ ...editDraft, producedQty: e.target.value })}
                          className="w-24 px-2 py-1 text-right border rounded"
                          min="0"
                          step="0.01"
                        />
                      ) : (
                        item.producedQty.toFixed(2)
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => saveEdit(index)}
                              className="text-green-600 hover:text-green-800"
                              title="Save"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingIndex(null)}
                              className="text-gray-600 hover:text-gray-800"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEdit(index)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeAt(index)}
                              className="text-red-600 hover:text-red-800"
                              title="Remove"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t" style={{ backgroundColor: 'var(--muted)' }}>
              <tr>
                <td className="px-4 py-3 text-sm font-bold" colSpan={2}>
                  Totals
                </td>
                <td className="px-4 py-3 text-sm text-right font-bold">{totalPlanned.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-right font-bold" style={{ color: primaryColor }}>
                  {totalProduced.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm text-center text-muted-foreground">
                  {items.length} lines
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div
          className="text-center py-8 border rounded-lg"
          style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}
        >
          <p>No products yet. Add one or more lines above.</p>
        </div>
      )}
    </div>
  );
}
