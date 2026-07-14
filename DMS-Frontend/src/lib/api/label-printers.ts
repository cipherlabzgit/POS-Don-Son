import { apiClient, assertApiSuccess, type ApiEnvelope } from './api-client';

export interface LabelPrinter {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface LabelPrinterCreateDto {
  name: string;
  sortOrder: number;
}

export interface LabelPrinterUpdateDto {
  name: string;
  sortOrder: number;
  isActive: boolean;
}

function pick<T>(obj: Record<string, unknown>, camel: string, pascal: string): T | undefined {
  const v = obj[camel] ?? obj[pascal];
  return v as T | undefined;
}

function normalizePrinter(raw: Record<string, unknown>): LabelPrinter {
  return {
    id: String(pick<string>(raw, 'id', 'Id') ?? ''),
    name: String(pick<string>(raw, 'name', 'Name') ?? ''),
    sortOrder: Number(pick(raw, 'sortOrder', 'SortOrder') ?? 0),
    isActive: Boolean(pick(raw, 'isActive', 'IsActive') ?? true),
  };
}

function parseListEnvelope(envelope: ApiEnvelope<Record<string, unknown>>): LabelPrinter[] {
  const body = envelope.data;
  if (!body || typeof body !== 'object') return [];
  const rawList = pick<unknown[]>(body, 'printers', 'Printers') ?? [];
  if (!Array.isArray(rawList)) return [];
  return rawList.map((row) => normalizePrinter(row as Record<string, unknown>));
}

export function getLabelPrintersErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const ax = err as { response?: { data?: { error?: { message?: string }; message?: string } } };
    const d = ax.response?.data;
    return d?.error?.message ?? d?.message ?? (err instanceof Error ? err.message : 'Request failed');
  }
  if (err instanceof Error) return err.message;
  return 'Request failed';
}

export const labelPrintersApi = {
  async getAll(activeOnly = false): Promise<LabelPrinter[]> {
    const params = new URLSearchParams();
    params.append('activeOnly', String(activeOnly));
    const response = await apiClient.get<ApiEnvelope<Record<string, unknown>>>(`/api/label-printers?${params}`);
    assertApiSuccess(response.data);
    return parseListEnvelope(response.data);
  },

  async create(data: LabelPrinterCreateDto): Promise<LabelPrinter> {
    const response = await apiClient.post<ApiEnvelope<Record<string, unknown>>>('/api/label-printers', data);
    assertApiSuccess(response.data);
    return normalizePrinter(response.data.data as Record<string, unknown>);
  },

  async update(id: string, data: LabelPrinterUpdateDto): Promise<LabelPrinter> {
    const response = await apiClient.put<ApiEnvelope<Record<string, unknown>>>(
      `/api/label-printers/${id}`,
      data
    );
    assertApiSuccess(response.data);
    return normalizePrinter(response.data.data as Record<string, unknown>);
  },
};
