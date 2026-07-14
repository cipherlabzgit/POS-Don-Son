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

export interface DailyProductionReportTotals {
  totalPlannedQty: number;
  totalProducedQty: number;
  totalVarianceQty: number;
}

export interface DailyProductionReportRow {
  rowNo: number;
  productCode: string;
  productName: string;
  sections: string;
  plannedQty: number;
  producedQty: number;
  varianceQty: number;
  statusSummary: string;
  lineCount: number;
}

export interface DailyProductionReport {
  reportTitle: string;
  companyName: string;
  reportDate: string;
  generatedAtUtc: string;
  rows: DailyProductionReportRow[];
  totals: DailyProductionReportTotals;
}

const BASE = '/api/reports/daily-production';

export const dailyProductionReportApi = {
  async getJson(reportDate: string): Promise<DailyProductionReport> {
    try {
      const res = await apiClient.get<ApiEnvelope<DailyProductionReport>>(BASE, {
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
      a.download = `daily-production-${reportDate}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
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
