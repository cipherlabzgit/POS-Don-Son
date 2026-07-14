'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { dailySaleReportApi, type DailySaleReport, type DailySaleShowroomOption } from '@/lib/api/reports-daily-sale';
import { todayISO } from '@/lib/date-restrictions';
import { formatSlDateTime } from '@/lib/sri-lanka-time';
import Button from '../ui/button';

interface DailySaleReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  minReportDate: string | null;
  canBypassReportDayEnd: boolean;
}

export function DailySaleReportModal({
  isOpen,
  onClose,
  minReportDate,
  canBypassReportDayEnd,
}: DailySaleReportModalProps) {
  const [reportDate, setReportDate] = useState(todayISO());
  const [outletId, setOutletId] = useState('');
  const [outlets, setOutlets] = useState<DailySaleShowroomOption[]>([]);
  const [outletsLoading, setOutletsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<DailySaleReport | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setReportDate(todayISO());
      setOutletId('');
      setError(null);
      setPreview(null);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      setOutletsLoading(true);
      setError(null);
      try {
        const list = await dailySaleReportApi.getShowrooms();
        if (cancelled) return;
        const sorted = [...list].sort((a, b) => {
          if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
          return a.code.localeCompare(b.code, undefined, { sensitivity: 'base' });
        });
        setOutlets(sorted);
      } catch (e) {
        if (!cancelled) {
          setOutlets([]);
          setError(e instanceof Error ? e.message : 'Could not load showrooms');
        }
      } finally {
        if (!cancelled) setOutletsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const minAttr = useMemo(() => {
    if (canBypassReportDayEnd || !minReportDate) return undefined;
    return minReportDate;
  }, [canBypassReportDayEnd, minReportDate]);

  const selectedOutletCode = useMemo(() => {
    const o = outlets.find((x) => x.id === outletId);
    return o?.code ?? '';
  }, [outlets, outletId]);

  const loadPreview = useCallback(async () => {
    if (!outletId) {
      setError('Please select a showroom.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const data = await dailySaleReportApi.getJson(outletId, reportDate);
      setPreview(data);
    } catch (e) {
      setPreview(null);
      setError(e instanceof Error ? e.message : 'Could not load report');
    } finally {
      setLoading(false);
    }
  }, [outletId, reportDate]);

  const download = useCallback(
    async (format: 'pdf' | 'xlsx') => {
      if (!outletId) {
        setError('Please select a showroom.');
        return;
      }
      setError(null);
      setLoading(true);
      try {
        await dailySaleReportApi.download(outletId, reportDate, format, selectedOutletCode);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Download failed');
      } finally {
        setLoading(false);
      }
    },
    [outletId, reportDate, selectedOutletCode],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Daily Sale Report"
      size="xl"
      closeVariant="danger"
      panelTone="paper"
    >
      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
        Select filters and generate the report.
      </p>

      <div className="mt-4 space-y-4">
        <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
          Daily Sale Report
        </p>

        <div>
          <label className="block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
            Showroom
          </label>
          <select
            value={outletId}
            onChange={(e) => setOutletId(e.target.value)}
            disabled={outletsLoading}
            className="mt-1 w-full max-w-md rounded-lg border py-2 pl-3 pr-8 text-sm"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--card)' }}
          >
            <option value="">{outletsLoading ? 'Loading…' : 'Select Showroom'}</option>
            {outlets.map((o) => (
              <option key={o.id} value={o.id}>
                {o.code} — {o.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
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
              {preview.outletCode} — {preview.outletName}
            </span>
            <span className="mx-2">·</span>
            <span>{preview.reportDate}</span>
            <span className="mx-2">·</span>
            <span className="text-[var(--muted-foreground)]">
              Generated: {formatSlDateTime(preview.generatedAtUtc)}
            </span>
          </div>
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead>
              <tr style={{ backgroundColor: 'var(--muted)' }}>
                <th className="px-2 py-2 font-semibold">#</th>
                <th className="px-2 py-2 font-semibold">Item code</th>
                <th className="px-2 py-2 font-semibold">Item name</th>
                <th className="px-2 py-2 text-right font-semibold">Qty</th>
                <th className="px-2 py-2 text-right font-semibold">Amount</th>
                <th className="px-2 py-2 text-right font-semibold">Lines</th>
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((r) => (
                <tr key={r.rowNo} className="border-t" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-2 py-1.5">{r.rowNo}</td>
                  <td className="px-2 py-1.5">{r.productCode}</td>
                  <td className="px-2 py-1.5">{r.productName}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{dailySaleReportApi.fmtQty(r.totalQuantity)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{dailySaleReportApi.fmtMoney(r.totalAmount)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{r.lineCount}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t font-semibold" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--muted)' }}>
                <td className="px-2 py-2" colSpan={3}>
                  Totals
                </td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {dailySaleReportApi.fmtQty(preview.totals.totalQuantity)}
                </td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {dailySaleReportApi.fmtMoney(preview.totals.totalAmount)}
                </td>
                <td className="px-2 py-2 text-right tabular-nums">{preview.totals.totalLines}</td>
              </tr>
            </tfoot>
          </table>
          {preview.rows.length === 0 && (
            <p className="px-3 py-4 text-sm" style={{ color: 'var(--muted-foreground)' }}>
              No approved POS sale lines for this showroom on the selected date.
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
          disabled={loading || !outletId}
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
          disabled={loading || !outletId}
          onClick={() => download('xlsx')}
          className="inline-flex items-center gap-2"
        >
          <FileSpreadsheet className="h-4 w-4 text-emerald-600" aria-hidden />
          Excel
        </Button>
        <Button type="button" variant="primary" size="md" disabled={loading || !outletId} onClick={loadPreview}>
          <span className="inline-flex items-center gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden /> : null}
            Show
          </span>
        </Button>
      </div>
    </Modal>
  );
}
