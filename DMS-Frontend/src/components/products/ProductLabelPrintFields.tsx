'use client';

import { useEffect, useState } from 'react';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import Checkbox from '@/components/ui/checkbox';
import { Search, X } from 'lucide-react';
import { ingredientsApi, type Ingredient } from '@/lib/api/ingredients';
import type { LabelTemplate } from '@/lib/api/label-templates';
import type { UnitOfMeasure } from '@/lib/api/uoms';
import type { ProductLabelIngredient } from '@/lib/api/products';

export type LabelExpiryMode = 'Days' | 'Hours' | 'FixedTime' | 'ManufactureDateOnly';

export interface ProductLabelPrintValues {
  labelTemplateId?: string | null;
  labelExpiryMode?: string;
  expiryDays?: number | null;
  expiryHours?: number | null;
  expiryFixedTime?: string | null;
  labelPrintUomId?: string | null;
  labelPrintQty?: number;
  allowFutureLabelPrint?: boolean;
  futureManufactureDays?: number;
  labelIngredients?: ProductLabelIngredient[];
}

interface ProductLabelPrintFieldsProps {
  values: ProductLabelPrintValues;
  onChange: (patch: Partial<ProductLabelPrintValues>) => void;
  uoms: UnitOfMeasure[];
  labelTemplates: LabelTemplate[];
}

export function ProductLabelPrintFields({
  values,
  onChange,
  uoms,
  labelTemplates,
}: ProductLabelPrintFieldsProps) {
  const mode = (values.labelExpiryMode || 'Days') as LabelExpiryMode;
  const selected = values.labelIngredients ?? [];
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Ingredient[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 1) {
      setResults([]);
      return;
    }
    const handle = window.setTimeout(async () => {
      try {
        setSearching(true);
        const res = await ingredientsApi.getAll(1, 20, term, undefined, undefined, true);
        const already = new Set(selected.map((s) => s.ingredientId));
        setResults(res.ingredients.filter((i) => !already.has(i.id)));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => window.clearTimeout(handle);
  }, [query, selected]);

  const addIngredient = (ing: Ingredient) => {
    onChange({
      labelIngredients: [
        ...selected,
        {
          ingredientId: ing.id,
          ingredientCode: ing.code,
          ingredientName: ing.name,
          sortOrder: selected.length,
        },
      ],
    });
    setQuery('');
    setResults([]);
  };

  const removeIngredient = (id: string) => {
    onChange({
      labelIngredients: selected
        .filter((s) => s.ingredientId !== id)
        .map((s, idx) => ({ ...s, sortOrder: idx })),
    });
  };

  return (
    <div
      className="space-y-4 p-4 rounded-lg"
      style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}
    >
      <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
        Label print settings
      </p>

      <div className="space-y-3">
        <label className="flex items-center gap-3">
          <input
            type="radio"
            name="labelExpiryMode"
            checked={mode === 'Days'}
            onChange={() => onChange({ labelExpiryMode: 'Days' })}
          />
          <span className="text-sm w-48" style={{ color: 'var(--foreground)' }}>Product Expiry Days</span>
          <Input
            type="number"
            min={0}
            value={values.expiryDays?.toString() ?? ''}
            onChange={(e) => onChange({ expiryDays: e.target.value === '' ? null : Number(e.target.value) })}
            disabled={mode !== 'Days'}
            className="w-28"
          />
        </label>
        <label className="flex items-center gap-3">
          <input
            type="radio"
            name="labelExpiryMode"
            checked={mode === 'Hours'}
            onChange={() => onChange({ labelExpiryMode: 'Hours' })}
          />
          <span className="text-sm w-48" style={{ color: 'var(--foreground)' }}>Product Expiry Hours</span>
          <Input
            type="number"
            min={0}
            value={values.expiryHours?.toString() ?? ''}
            onChange={(e) => onChange({ expiryHours: e.target.value === '' ? null : Number(e.target.value) })}
            disabled={mode !== 'Hours'}
            className="w-28"
          />
        </label>
        <label className="flex items-center gap-3">
          <input
            type="radio"
            name="labelExpiryMode"
            checked={mode === 'FixedTime'}
            onChange={() => onChange({ labelExpiryMode: 'FixedTime' })}
          />
          <span className="text-sm w-48" style={{ color: 'var(--foreground)' }}>Product Expiry Fixed Time</span>
          <div className="flex-1 max-w-xs">
            <Input
              value={values.expiryFixedTime ?? ''}
              onChange={(e) => onChange({ expiryFixedTime: e.target.value })}
              placeholder="12.00 PM"
              disabled={mode !== 'FixedTime'}
              helperText="Hint: 12.00 PM"
              fullWidth
            />
          </div>
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        <Select
          label="Label Print UOM"
          value={values.labelPrintUomId || ''}
          onChange={(e) => onChange({ labelPrintUomId: e.target.value || null })}
          options={uoms.map((u) => ({ value: u.id, label: `${u.code} - ${u.description}` }))}
          placeholder="Select UOM"
          fullWidth
        />
        <Input
          label="Qty"
          type="number"
          min={1}
          value={(values.labelPrintQty ?? 1).toString()}
          onChange={(e) => onChange({ labelPrintQty: Number(e.target.value) || 1 })}
          fullWidth
        />
        <div className="pb-1">
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
            Manufacture date only
          </p>
          <Checkbox
            label="Print manufacture date only"
            checked={mode === 'ManufactureDateOnly'}
            onChange={(e) =>
              onChange({
                labelExpiryMode: e.target.checked ? 'ManufactureDateOnly' : 'Days',
              })
            }
          />
        </div>
      </div>

      <Select
        label="Label template"
        value={values.labelTemplateId || ''}
        onChange={(e) => onChange({ labelTemplateId: e.target.value || null })}
        options={[
          { value: '', label: '— None —' },
          ...labelTemplates.map((t) => ({
            value: t.id,
            label: `${t.code} — ${t.name}`,
          })),
        ]}
        placeholder="Select template (optional)"
        fullWidth
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Checkbox
          label="Allow Future Manufacture Days"
          checked={values.allowFutureLabelPrint ?? false}
          onChange={(e) => onChange({ allowFutureLabelPrint: e.target.checked })}
        />
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: 'var(--foreground)' }}>Future Days</span>
          <Input
            type="number"
            min={0}
            value={(values.futureManufactureDays ?? 0).toString()}
            onChange={(e) => onChange({ futureManufactureDays: Number(e.target.value) || 0 })}
            disabled={!values.allowFutureLabelPrint}
            className="w-24"
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          Label ingredients
        </p>
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          Search ingredients from Inventory → Ingredient and add them to the label.
        </p>
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selected.map((ing) => (
              <span
                key={ing.ingredientId}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs"
                style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <span className="font-mono" style={{ color: '#C8102E' }}>{ing.ingredientCode}</span>
                {ing.ingredientName}
                <button type="button" onClick={() => removeIngredient(ing.ingredientId)} aria-label="Remove">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ingredient name..."
            className="w-full pl-10 pr-4 py-2 rounded-lg text-sm"
            style={{ border: '1px solid var(--input)', backgroundColor: 'var(--background)' }}
          />
          {(searching || results.length > 0 || query.trim()) && (
            <div
              className="absolute z-20 mt-1 w-full max-h-48 overflow-auto rounded-lg shadow-lg"
              style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
            >
              {searching && (
                <p className="px-3 py-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>Searching...</p>
              )}
              {!searching && results.length === 0 && query.trim() && (
                <p className="px-3 py-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  No matching ingredients. Add them under Inventory → Ingredient first.
                </p>
              )}
              {results.map((ing) => (
                <button
                  key={ing.id}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--muted)]"
                  onClick={() => addIngredient(ing)}
                >
                  <span className="font-mono text-xs mr-2" style={{ color: '#C8102E' }}>{ing.code}</span>
                  {ing.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
