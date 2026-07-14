'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, FileSpreadsheet, FileText, Loader2, X } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import {
  dailySaleOfItemReportApi,
  type DailySaleOfItemProductOption,
  type DailySaleOfItemReport,
} from '@/lib/api/reports-daily-sale-of-item';
import { todayISO } from '@/lib/date-restrictions';
import { formatSlDateTime } from '@/lib/sri-lanka-time';
import Button from '../ui/button';

interface DailySaleOfItemReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  minReportDate: string | null;
  canBypassReportDayEnd: boolean;
}

export function DailySaleOfItemReportModal({
  isOpen,
  onClose,
  minReportDate,
  canBypassReportDayEnd,
}: DailySaleOfItemReportModalProps) {
  const [fromDate, setFromDate] = useState(todayISO());
  const [toDate, setToDate] = useState(todayISO());
  const [itemSearch, setItemSearch] = useState('');
  const [productId, setProductId] = useState('');
  const [productLabel, setProductLabel] = useState('');
  const [suggestions, setSuggestions] = useState<DailySaleOfItemProductOption[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<DailySaleOfItemReport | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const t = todayISO();
      setFromDate(t);
      setToDate(t);
      setItemSearch('');
      setProductId('');
      setProductLabel('');
      setSuggestions([]);
      setError(null);
      setPreview(null);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const q = itemSearch.trim();
    if (q.length < 2 || productId) {
      setSuggestions([]);
      setSuggestLoading(false);
      return;
    }
    setSuggestLoading(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const list = await dailySaleOfItemReportApi.searchProducts(q);
        setSuggestions(list);
      } catch {
        setSuggestions([]);
      } finally {
        setSuggestLoading(false);
      }
    }, 350);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [isOpen, itemSearch, productId]);

  const minAttr = useMemo(() => {
    if (canBypassReportDayEnd || !minReportDate) return undefined;
    return minReportDate;
  }, [canBypassReportDayEnd, minReportDate]);

  const selectProduct = useCallback((p: DailySaleOfItemProductOption) => {
    setProductId(p.id);
    setProductLabel(`${p.code} — ${p.name}`);
    setItemSearch(`${p.code} — ${p.name}`);
    setSuggestions([]);
  }, []);

  const clearProduct = useCallback(() => {
    setProductId('');
    setProductLabel('');
    setItemSearch('');
    setSuggestions([]);
  }, []);

  const loadPreview = useCallback(async () => {
    if (!productId) {
      setError('Please search and select an item.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const data = await dailySaleOfItemReportApi.getJson(productId, fromDate, toDate);
      setPreview(data);
    } catch (e) {
      setPreview(null);
      setError(e instanceof Error ? e.message : 'Could not load report');
    } finally {
      setLoading(false);
    }
  }, [productId, fromDate, toDate]);

  const download = useCallback(
    async (format: 'pdf' | 'xlsx') => {
      if (!productId) {
        setError('Please search and select an item.');
        return;
      }
      setError(null);
      setLoading(true);
      try {
        const code = productLabel.split('—')[0]?.trim() ?? '';
        await dailySaleOfItemReportApi.download(productId, fromDate, toDate, format, code);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Download failed');
      } finally {
        setLoading(false);
      }
    },
    [productId, fromDate, toDate, productLabel],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Daily Sale Of Item"
      size="xl"
      closeVariant="danger"
      panelTone="paper"
    >
      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
        Select filters and generate the report.
      </p>

      <div className="mt-4 space-y-4">
        <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
          Daily Sale Of Item
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <div className="min-w-[140px] flex-1">
            <label className="block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              From Date
            </label>
            <div className="relative mt-1">
              <input
                type="date"
                value={fromDate}
                min={minAttr}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded-lg border py-2 pl-3 pr-10 text-sm"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
              />
              <Calendar
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50"
                aria-hidden
              />
            </div>
          </div>
          <div className="min-w-[140px] flex-1">
            <label className="block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              To Date
            </label>
            <div className="relative mt-1">
              <input
                type="date"
                value={toDate}
                min={minAttr}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full rounded-lg border py-2 pl-3 pr-10 text-sm"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
              />
              <Calendar
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50"
                aria-hidden
              />
            </div>
          </div>
        </div>

        <div className="relative max-w-lg">
          <label className="block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
            Item Code or Item
          </label>
          <div className="mt-1 flex gap-2">
            <input
              type="text"
              value={itemSearch}
              onChange={(e) => {
                const v = e.target.value;
                setItemSearch(v);
                if (productId && v !== productLabel) {
                  setProductId('');
                  setProductLabel('');
                }
              }}
              placeholder="Search item (type at least 2 characters)"
              autoComplete="off"
              className="min-w-0 flex-1 rounded-lg border py-2 px-3 text-sm"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
            />
            {productId ? (
              <button
                type="button"
                onClick={clearProduct}
                className="inline-flex shrink-0 items-center justify-center rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
                title="Clear selection"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            ) : null}
          </div>
          {suggestLoading && (
            <p className="mt-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Searching…
            </p>
          )}
          {suggestions.length > 0 && !productId && (
            <ul
              className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border py-1 shadow-lg"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--card)',
              }}
              role="listbox"
            >
              {suggestions.map((p) => (
                <li key={p.id} role="option">
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted)]"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectProduct(p)}
                  >
                    <span className="font-medium">{p.code}</span>
                    <span className="text-[var(--muted-foreground)]"> — {p.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {preview && (
        <div className="mt-5 overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--border)' }}>
          <div
            className="border-b px-3 py-2 text-xs"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--muted)' }}
          >
            <span className="font-semibold">{preview.companyName}</span>
            <span className="mx-2">·</span>
            <span>{preview.reportTitle}</span>
            <span className="mx-2">·</span>
            <span>
              {preview.productCode} — {preview.productName}
            </span>
            <span className="mx-2">·</span>
            <span>
              {preview.fromDate} → {preview.toDate}
            </span>
            <span className="mx-2">·</span>
            <span className="text-[var(--muted-foreground)]">
              Generated: {formatSlDateTime(preview.generatedAtUtc)}
            </span>
          </div>
          <table className="w-full min-w-[520px] text-left text-xs">
            <thead>
              <tr style={{ backgroundColor: 'var(--muted)' }}>
                <th className="px-2 py-2 font-semibold">#</th>
                <th className="px-2 py-2 font-semibold">Date</th>
                <th className="px-2 py-2 text-right font-semibold">Qty</th>
                <th className="px-2 py-2 text-right font-semibold">Amount</th>
                <th className="px-2 py-2 text-right font-semibold">Lines</th>
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((r) => (
                <tr key={`${r.saleDate}-${r.rowNo}`} className="border-t" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-2 py-1.5">{r.rowNo}</td>
                  <td className="px-2 py-1.5 tabular-nums">{r.saleDate}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    {dailySaleOfItemReportApi.fmtQty(r.totalQuantity)}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    {dailySaleOfItemReportApi.fmtMoney(r.totalAmount)}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{r.lineCount}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t font-semibold" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--muted)' }}>
                <td className="px-2 py-2" colSpan={2}>
                  Totals
                </td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {dailySaleOfItemReportApi.fmtQty(preview.totals.totalQuantity)}
                </td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {dailySaleOfItemReportApi.fmtMoney(preview.totals.totalAmount)}
                </td>
                <td className="px-2 py-2 text-right tabular-nums">{preview.totals.totalLines}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <div
        className="mt-6 flex flex-wrap items-center gap-2 border-t px-6 py-4 -mx-6 -mb-4"
        style={{ borderColor: 'var(--border)' }}
      >
        <Button
          type="button"
          variant="outline"
          size="md"
          disabled={loading || !productId}
          onClick={() => download('pdf')}
          className="inline-flex items-center gap-2"
        >
          <FileText className="h-4 w-4 text-red-600" aria-hidden />
          PDF
        </Button>
        <Button
          type="button"
          variant="outline"
          size="md"
          disabled={loading || !productId}
          onClick={() => download('xlsx')}
          className="inline-flex items-center gap-2"
        >
          <FileSpreadsheet className="h-4 w-4 text-emerald-600" aria-hidden />
          Excel
        </Button>
        <Button type="button" variant="primary" size="md" disabled={loading || !productId} onClick={loadPreview}>
          <span className="inline-flex items-center gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden /> : null}
            Show
          </span>
        </Button>
      </div>
    </Modal>
  );
}
