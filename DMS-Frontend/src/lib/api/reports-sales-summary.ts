import axios from 'axios';
import apiClient from './api-client';
import type { ApiEnvelope } from './api-client';

function readApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: { message?: string } } | undefined;
    if (data?.error?.message) return data.error.message;
  }
  if (err instanceof Error) return err.message;
  return 'Request failed';
}

export interface SalesSummaryReportTotals {
  totalCashierShowroomSale: number | null;
  totalSystemSale: number;
  totalDifference: number | null;
}

export interface SalesSummaryReportRow {
  rowNo: number;
  outletCode: string;
  outletName: string;
  isShowroomClosed: boolean;
  cashierShowroomSale: number | null;
  systemSale: number;
  difference: number | null;
}

export interface SalesSummaryReport {
  reportTitle: string;
  companyName: string;
  reportDate: string;
  generatedAtUtc: string;
  rows: SalesSummaryReportRow[];
  totals: SalesSummaryReportTotals;
}

const BASE = '/api/reports/sales-summary';

function fmtMoney(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const salesSummaryReportApi = {
  fmtMoney,

  async getJson(reportDate: string): Promise<SalesSummaryReport> {
    try {
      const res = await apiClient.get<ApiEnvelope<SalesSummaryReport>>(BASE, {
        params: { reportDate, format: 'json' },
      });
      const body = res.data;
      if (!body?.success) {
        const msg =
          body?.error && typeof body.error === 'object' && 'message' in body.error
            ? String((body.error as { message?: string }).message ?? '')
            : '';
        throw new Error(msg || 'Failed to load report');
      }
      return body.data;
    } catch (e) {
      throw new Error(readApiErrorMessage(e));
    }
  },

  async download(reportDate: string, format: 'pdf' | 'xlsx'): Promise<void> {
    try {
      const res = await apiClient.get<ArrayBuffer>(BASE, {
        params: { reportDate, format },
        responseType: 'arraybuffer',
        validateStatus: () => true,
      });

      const contentType = String(res.headers['content-type'] ?? '');
      if (res.status >= 400 || contentType.includes('application/json')) {
        let msg = `Request failed (${res.status})`;
        try {
          const text = new TextDecoder().decode(new Uint8Array(res.data));
          const j = JSON.parse(text) as { error?: { message?: string } };
          if (j?.error?.message) msg = j.error.message;
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }

      const mime =
        format === 'pdf'
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const blob = new Blob([res.data], { type: mime });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales-summary-${reportDate}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      if (e instanceof Error) throw e;
      throw new Error('Download failed');
    }
  },
};
