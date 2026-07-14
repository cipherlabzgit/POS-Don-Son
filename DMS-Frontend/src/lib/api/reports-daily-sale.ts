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

export interface DailySaleReportTotals {
  totalQuantity: number;
  totalAmount: number;
  totalLines: number;
}

export interface DailySaleReportRow {
  rowNo: number;
  productCode: string;
  productName: string;
  totalQuantity: number;
  totalAmount: number;
  lineCount: number;
}

export interface DailySaleReport {
  reportTitle: string;
  companyName: string;
  outletId: string;
  outletCode: string;
  outletName: string;
  reportDate: string;
  generatedAtUtc: string;
  rows: DailySaleReportRow[];
  totals: DailySaleReportTotals;
}

export interface DailySaleShowroomOption {
  id: string;
  code: string;
  name: string;
  displayOrder: number;
}

const BASE = '/api/reports/daily-sale';

function fmtMoney(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtQty(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 });
}

function safeFileSegment(code: string): string {
  const t = (code || 'showroom').trim() || 'showroom';
  return t.replace(/[<>:"/\\|?*]/g, '-');
}

export const dailySaleReportApi = {
  fmtMoney,
  fmtQty,

  async getShowrooms(): Promise<DailySaleShowroomOption[]> {
    try {
      const res = await apiClient.get<ApiEnvelope<DailySaleShowroomOption[]>>(`${BASE}/showrooms`);
      const body = res.data;
      if (!body?.success) {
        const msg =
          body?.error && typeof body.error === 'object' && 'message' in body.error
            ? String((body.error as { message?: string }).message ?? '')
            : '';
        throw new Error(msg || 'Failed to load showrooms');
      }
      const raw = body.data;
      return Array.isArray(raw) ? raw : [];
    } catch (e) {
      throw new Error(readApiErrorMessage(e));
    }
  },

  async getJson(outletId: string, reportDate: string): Promise<DailySaleReport> {
    try {
      const res = await apiClient.get<ApiEnvelope<DailySaleReport>>(BASE, {
        params: { outletId, reportDate, format: 'json' },
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

  async download(
    outletId: string,
    reportDate: string,
    format: 'pdf' | 'xlsx',
    outletCodeForName?: string,
  ): Promise<void> {
    try {
      const res = await apiClient.get<ArrayBuffer>(BASE, {
        params: { outletId, reportDate, format },
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
      const seg = safeFileSegment(outletCodeForName ?? '');
      a.download = `daily-sale-${seg}-${reportDate}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
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
