import { apiClient, assertApiSuccess, type ApiEnvelope } from './api-client';

export interface LabelTemplate {
  id: string;
  code: string;
  name: string;
  description?: string;
  templateType?: string;
  widthMm: number;
  heightMm: number;
  layoutDesign?: string;
  fields?: string;
  fontSettings?: string;
  sortOrder: number;
  isDefault: boolean;
  isActive: boolean;
  labelPrinterId?: string | null;
  printerName?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateLabelTemplateDto {
  code: string;
  name: string;
  description?: string;
  templateType?: string;
  widthMm: number;
  heightMm: number;
  layoutDesign?: string;
  fields?: string;
  fontSettings?: string;
  sortOrder: number;
  isDefault: boolean;
  isActive: boolean;
  labelPrinterId?: string | null;
}

export interface UpdateLabelTemplateDto extends CreateLabelTemplateDto {}

export interface LabelTemplatesResponse {
  labelTemplates: LabelTemplate[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function pick<T>(obj: Record<string, unknown>, camel: string, pascal: string): T | undefined {
  const v = obj[camel] ?? obj[pascal];
  return v as T | undefined;
}

function normalizeTemplate(raw: Record<string, unknown>): LabelTemplate {
  const lid = pick<string>(raw, 'labelPrinterId', 'LabelPrinterId');
  return {
    id: String(pick<string>(raw, 'id', 'Id') ?? ''),
    code: String(pick<string>(raw, 'code', 'Code') ?? ''),
    name: String(pick<string>(raw, 'name', 'Name') ?? ''),
    description: pick<string>(raw, 'description', 'Description'),
    templateType: pick<string>(raw, 'templateType', 'TemplateType'),
    widthMm: Number(pick(raw, 'widthMm', 'WidthMm') ?? 0),
    heightMm: Number(pick(raw, 'heightMm', 'HeightMm') ?? 0),
    layoutDesign: pick<string>(raw, 'layoutDesign', 'LayoutDesign'),
    fields: pick<string>(raw, 'fields', 'Fields'),
    fontSettings: pick<string>(raw, 'fontSettings', 'FontSettings'),
    sortOrder: Number(pick(raw, 'sortOrder', 'SortOrder') ?? 0),
    isDefault: Boolean(pick(raw, 'isDefault', 'IsDefault')),
    isActive: Boolean(pick(raw, 'isActive', 'IsActive') ?? true),
    labelPrinterId: lid ?? null,
    printerName: pick<string>(raw, 'printerName', 'PrinterName') ?? null,
    createdAt: String(pick<string>(raw, 'createdAt', 'CreatedAt') ?? ''),
    updatedAt: pick<string>(raw, 'updatedAt', 'UpdatedAt'),
  };
}

function parseListPayload(envelope: ApiEnvelope<Record<string, unknown>>): LabelTemplatesResponse {
  const body = envelope.data;
  if (!body || typeof body !== 'object') {
    return { labelTemplates: [], totalCount: 0, page: 1, pageSize: 50, totalPages: 0 };
  }
  const rawList = pick<unknown[]>(body, 'labelTemplates', 'LabelTemplates') ?? [];
  const list = Array.isArray(rawList) ? rawList : [];
  return {
    labelTemplates: list.map((row) => normalizeTemplate(row as Record<string, unknown>)),
    totalCount: Number(pick(body, 'totalCount', 'TotalCount') ?? 0),
    page: Number(pick(body, 'page', 'Page') ?? 1),
    pageSize: Number(pick(body, 'pageSize', 'PageSize') ?? 50),
    totalPages: Number(pick(body, 'totalPages', 'TotalPages') ?? 0),
  };
}

export function getLabelTemplatesErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const ax = err as { response?: { data?: { error?: { message?: string }; message?: string } } };
    const d = ax.response?.data;
    return d?.error?.message ?? d?.message ?? (err instanceof Error ? err.message : 'Request failed');
  }
  if (err instanceof Error) return err.message;
  return 'Request failed';
}

export const labelTemplatesApi = {
  async getAll(
    page: number = 1,
    pageSize: number = 50,
    search?: string,
    activeOnly?: boolean
  ): Promise<LabelTemplatesResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (search) params.append('search', search);
    if (activeOnly !== undefined) params.append('activeOnly', activeOnly.toString());

    const response = await apiClient.get<ApiEnvelope<Record<string, unknown>>>(`/api/label-templates?${params}`);
    assertApiSuccess(response.data);
    return parseListPayload(response.data);
  },

  async getById(id: string): Promise<LabelTemplate> {
    const response = await apiClient.get<ApiEnvelope<Record<string, unknown>>>(`/api/label-templates/${id}`);
    assertApiSuccess(response.data);
    return normalizeTemplate(response.data.data as Record<string, unknown>);
  },

  async create(data: CreateLabelTemplateDto): Promise<LabelTemplate> {
    const response = await apiClient.post<ApiEnvelope<Record<string, unknown>>>('/api/label-templates', data);
    assertApiSuccess(response.data);
    return normalizeTemplate(response.data.data as Record<string, unknown>);
  },

  async update(id: string, data: UpdateLabelTemplateDto): Promise<LabelTemplate> {
    const response = await apiClient.put<ApiEnvelope<Record<string, unknown>>>(
      `/api/label-templates/${id}`,
      data
    );
    assertApiSuccess(response.data);
    return normalizeTemplate(response.data.data as Record<string, unknown>);
  },

  /** Assigns or clears the physical printer for a label template. */
  async assignPrinter(id: string, labelPrinterId: string | null): Promise<LabelTemplate> {
    const response = await apiClient.put<ApiEnvelope<Record<string, unknown>>>(
      `/api/label-templates/${id}/printer`,
      { labelPrinterId }
    );
    assertApiSuccess(response.data);
    return normalizeTemplate(response.data.data as Record<string, unknown>);
  },

  async delete(id: string): Promise<void> {
    const response = await apiClient.delete<ApiEnvelope<unknown>>(`/api/label-templates/${id}`);
    assertApiSuccess(response.data);
  },

  async zplPreview(zpl: string, widthMm: number, heightMm: number, dpmm = 8): Promise<string> {
    const response = await apiClient.post(
      '/api/label-templates/zpl-preview',
      { zpl, widthMm, heightMm, dpmm },
      { responseType: 'blob' }
    );
    return URL.createObjectURL(response.data as Blob);
  },
};
