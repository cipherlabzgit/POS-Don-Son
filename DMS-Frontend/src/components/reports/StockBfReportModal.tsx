'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { stockBfReportApi, type StockBfReport } from '@/lib/api/reports-stock-bf';
import { todayISO } from '@/lib/date-restrictions';
import { formatSlDateTime } from '@/lib/sri-lanka-time';
import Button from '../ui/button';

interface StockBfReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  minReportDate: string | null;
  canBypassReportDayEnd: boolean;
}

export function StockBfReportModal({
  isOpen,
  onClose,
  minReportDate,
  canBypassReportDayEnd,
}: StockBfReportModalProps) {
  const [reportDate, setReportDate] = useState(todayISO());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<StockBfReport | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setReportDate(todayISO());
      setError(null);
      setPreview(null);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const minAttr = useMemo(() => {
    if (canBypassReportDayEnd || !minReportDate) return undefined;
    return minReportDate;
  }, [canBypassReportDayEnd, minReportDate]);

  const loadPreview = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await stockBfReportApi.getJson(reportDate);
      setPreview(data);
    } catch (e) {
      setPreview(null);
      setError(e instanceof Error ? e.message : 'Could not load report');
    } finally {
      setLoading(false);
    }
  }, [reportDate]);

  const download = useCallback(
    async (format: 'pdf' | 'xlsx') => {
      setError(null);
      setLoading(true);
      try {
        await stockBfReportApi.download(reportDate, format);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Download failed');
      } finally {
        setLoading(false);
      }
    },
    [reportDate],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Stock BF Report"
      size="xl"
      closeVariant="danger"
      panelTone="paper"
    >
      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
        Select filters and generate the report.
      </p>

      <div className="mt-4">
        <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
          Stock BF Report
        </p>
        <label className="mt-2 block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          Date
        </label>
        <div className="relative mt-1 max-w-xs">
          <input
            type="date"
            value={reportDate}
            min={minAttr}
            onChange={(e) => setReportDate(e.target.value)}
            className="w-full rounded-lg border py-2 pl-3 pr-10 text-sm"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
          />
          <Calendar
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50"
            aria-hidden
          />
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
            <span>BF {preview.reportDate}</span>
            <span className="mx-2">·</span>
            <span className="text-[var(--muted-foreground)]">
              Generated: {formatSlDateTime(preview.generatedAtUtc)}
            </span>
          </div>
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead>
              <tr style={{ backgroundColor: 'var(--muted)' }}>
                <th className="sticky left-0 z-10 px-2 py-2 font-semibold shadow-[2px_0_4px_-2px_rgba(0,0,0,0.15)]" style={{ backgroundColor: 'var(--muted)' }}>
                  #
                </th>
                <th
                  className="sticky left-[2.25rem] z-10 px-2 py-2 font-semibold shadow-[2px_0_4px_-2px_rgba(0,0,0,0.15)]"
                  style={{ backgroundColor: 'var(--muted)' }}
                >
                  Code
                </th>
                <th
                  className="sticky left-[6.5rem] z-10 min-w-[140px] px-2 py-2 font-semibold shadow-[2px_0_4px_-2px_rgba(0,0,0,0.15)]"
                  style={{ backgroundColor: 'var(--muted)' }}
                >
                  Item
                </th>
                {preview.showrooms.map((s) => (
                  <th key={s.outletId} className="px-2 py-2 text-right font-semibold" title={s.outletName}>
                    {s.outletCode}
                  </th>
                ))}
                <th className="px-2 py-2 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((r) => (
                <tr key={r.rowNo} className="border-t" style={{ borderColor: 'var(--border)' }}>
                  <td
                    className="sticky left-0 z-[1] bg-[var(--card)] px-2 py-1.5 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]"
                    style={{ backgroundColor: 'var(--card)' }}
                  >
                    {r.rowNo}
                  </td>
                  <td
                    className="sticky left-[2.25rem] z-[1] bg-[var(--card)] px-2 py-1.5 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]"
                    style={{ backgroundColor: 'var(--card)' }}
                  >
                    {r.productCode}
                  </td>
                  <td
                    className="sticky left-[6.5rem] z-[1] min-w-[140px] bg-[var(--card)] px-2 py-1.5 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]"
                    style={{ backgroundColor: 'var(--card)' }}
                  >
                    {r.productName}
                  </td>
                  {preview.showrooms.map((s, i) => (
                    <td key={s.outletId} className="px-2 py-1.5 text-right tabular-nums">
                      {stockBfReportApi.fmtQty(r.quantities[i] ?? 0)}
                    </td>
                  ))}
                  <td className="px-2 py-1.5 text-right tabular-nums font-medium">
                    {stockBfReportApi.fmtQty(r.rowTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
            {preview.rows.length > 0 && (
              <tfoot>
                <tr className="border-t font-semibold" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--muted)' }}>
                  <td className="sticky left-0 z-[1] px-2 py-2 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]" colSpan={3} style={{ backgroundColor: 'var(--muted)' }}>
                    Totals
                  </td>
                  {preview.showrooms.map((s, i) => (
                    <td key={s.outletId} className="px-2 py-2 text-right tabular-nums">
                      {stockBfReportApi.fmtQty(preview.totals.columnTotals[i] ?? 0)}
                    </td>
                  ))}
                  <td className="px-2 py-2 text-right tabular-nums">{stockBfReportApi.fmtQty(preview.totals.grandTotal)}</td>
                </tr>
              </tfoot>
            )}
          </table>
          {preview.rows.length === 0 && (
            <p className="px-3 py-4 text-sm" style={{ color: 'var(--muted-foreground)' }}>
              No approved or adjusted Stock BF lines for this date.
            </p>
          )}
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
          disabled={loading}
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
          disabled={loading}
          onClick={() => download('xlsx')}
          className="inline-flex items-center gap-2"
        >
          <FileSpreadsheet className="h-4 w-4 text-emerald-600" aria-hidden />
          Excel
        </Button>
        <Button type="button" variant="primary" size="md" disabled={loading} onClick={loadPreview}>
          <span className="inline-flex items-center gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden /> : null}
            Show
          </span>
        </Button>
      </div>
    </Modal>
  );
}
