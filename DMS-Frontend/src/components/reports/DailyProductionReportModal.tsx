'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';

import {
  dailyProductionReportApi,
  type DailyProductionReport,
} from '@/lib/api/reports-daily-production';
import { todayISO } from '@/lib/date-restrictions';
import { formatSlDateTime } from '@/lib/sri-lanka-time';
import Button from '../ui/button';

interface DailyProductionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** yyyy-MM-dd; when set and user cannot bypass day-end, date input uses this as min. */
  minReportDate: string | null;
  canBypassReportDayEnd: boolean;
}

export function DailyProductionReportModal({
  isOpen,
  onClose,
  minReportDate,
  canBypassReportDayEnd,
}: DailyProductionReportModalProps) {
  const [reportDate, setReportDate] = useState(todayISO());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<DailyProductionReport | null>(null);

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
      const data = await dailyProductionReportApi.getJson(reportDate);
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
        await dailyProductionReportApi.download(reportDate, format);
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
      title="Daily Production"
      size="xl"
      closeVariant="danger"
      panelTone="paper"
    >
      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
        Select filters and generate the report.
      </p>

      <div className="mt-4">
        <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
          Daily Production
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
          <div className="border-b px-3 py-2 text-xs" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--muted)' }}>
            <span className="font-semibold">{preview.companyName}</span>
            <span className="mx-2">·</span>
            <span>{preview.reportTitle}</span>
            <span className="mx-2">·</span>
            <span>{preview.reportDate}</span>
            <span className="mx-2">·</span>
            <span className="text-[var(--muted-foreground)]">
              Generated: {formatSlDateTime(preview.generatedAtUtc)}
            </span>
          </div>
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead>
              <tr style={{ backgroundColor: 'var(--muted)' }}>
                <th className="px-2 py-2 font-semibold">#</th>
                <th className="px-2 py-2 font-semibold">Item code</th>
                <th className="px-2 py-2 font-semibold">Item name</th>
                <th className="px-2 py-2 font-semibold">Section(s)</th>
                <th className="px-2 py-2 text-right font-semibold">Planned</th>
                <th className="px-2 py-2 text-right font-semibold">Produced</th>
                <th className="px-2 py-2 text-right font-semibold">Variance</th>
                <th className="px-2 py-2 font-semibold">Status</th>
                <th className="px-2 py-2 text-right font-semibold">Lines</th>
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((r) => (
                <tr key={r.rowNo} className="border-t" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-2 py-1.5">{r.rowNo}</td>
                  <td className="px-2 py-1.5">{r.productCode}</td>
                  <td className="px-2 py-1.5">{r.productName}</td>
                  <td className="px-2 py-1.5">{r.sections}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{r.plannedQty}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{r.producedQty}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{r.varianceQty}</td>
                  <td className="px-2 py-1.5">{r.statusSummary}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{r.lineCount}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t font-semibold" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--muted)' }}>
                <td className="px-2 py-2" colSpan={4}>
                  Totals
                </td>
                <td className="px-2 py-2 text-right tabular-nums">{preview.totals.totalPlannedQty}</td>
                <td className="px-2 py-2 text-right tabular-nums">{preview.totals.totalProducedQty}</td>
                <td className="px-2 py-2 text-right tabular-nums">{preview.totals.totalVarianceQty}</td>
                <td className="px-2 py-2" colSpan={2} />
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
