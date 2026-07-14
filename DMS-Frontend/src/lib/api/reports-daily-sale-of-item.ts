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

export interface DailySaleOfItemProductOption {
  id: string;
  code: string;
  name: string;
}

export interface DailySaleOfItemReportRow {
  rowNo: number;
  saleDate: string;
  totalQuantity: number;
  totalAmount: number;
  lineCount: number;
}

export interface DailySaleOfItemReportTotals {
  totalQuantity: number;
  totalAmount: number;
  totalLines: number;
}

export interface DailySaleOfItemReport {
  reportTitle: string;
  companyName: string;
  productId: string;
  productCode: string;
  productName: string;
  fromDate: string;
  toDate: string;
  generatedAtUtc: string;
  rows: DailySaleOfItemReportRow[];
  totals: DailySaleOfItemReportTotals;
}

const BASE = '/api/reports/daily-sale-of-item';

function fmtMoney(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtQty(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 });
}

function safeFileSegment(code: string): string {
  const t = (code || 'item').trim() || 'item';
  return t.replace(/[<>:"/\\|?*]/g, '-');
}

export const dailySaleOfItemReportApi = {
  fmtMoney,
  fmtQty,

  async searchProducts(search: string, take = 25): Promise<DailySaleOfItemProductOption[]> {
    const q = search.trim();
    if (q.length < 2) return [];
    try {
      const res = await apiClient.get<ApiEnvelope<DailySaleOfItemProductOption[]>>(`${BASE}/products`, {
        params: { search: q, take },
      });
      const body = res.data;
      if (!body?.success) {
        const msg =
          body?.error && typeof body.error === 'object' && 'message' in body.error
            ? String((body.error as { message?: string }).message ?? '')
            : '';
        throw new Error(msg || 'Product search failed');
      }
      const raw = body.data;
      return Array.isArray(raw) ? raw : [];
    } catch (e) {
      throw new Error(readApiErrorMessage(e));
    }
  },

  async getJson(productId: string, fromDate: string, toDate: string): Promise<DailySaleOfItemReport> {
    try {
      const res = await apiClient.get<ApiEnvelope<DailySaleOfItemReport>>(BASE, {
        params: { productId, fromDate, toDate, format: 'json' },
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
    productId: string,
    fromDate: string,
    toDate: string,
    format: 'pdf' | 'xlsx',
    productCodeForName?: string,
  ): Promise<void> {
    try {
      const res = await apiClient.get<ArrayBuffer>(BASE, {
        params: { productId, fromDate, toDate, format },
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
      const seg = safeFileSegment(productCodeForName ?? '');
      a.download = `daily-sale-of-item-${seg}-${fromDate}-to-${toDate}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
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
