import { apiClient, assertApiSuccess, type ApiEnvelope } from './api-client';

export interface LabelSetting {
  id: string;
  settingKey: string;
  settingName: string;
  settingValue?: string;
  description?: string;
  category?: string;
  valueType: string;
  sortOrder: number;
  isSystemSetting: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateLabelSettingDto {
  settingKey: string;
  settingName: string;
  settingValue?: string;
  description?: string;
  category?: string;
  valueType: string;
  sortOrder: number;
  isSystemSetting: boolean;
  isActive: boolean;
}

export interface UpdateLabelSettingDto extends CreateLabelSettingDto {}

export interface LabelSettingsResponse {
  labelSettings: LabelSetting[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function pick<T>(obj: Record<string, unknown>, camel: string, pascal: string): T | undefined {
  const v = obj[camel] ?? obj[pascal];
  return v as T | undefined;
}

function normalizeLabelSetting(raw: Record<string, unknown>): LabelSetting {
  return {
    id: String(pick<string>(raw, 'id', 'Id') ?? ''),
    settingKey: String(pick<string>(raw, 'settingKey', 'SettingKey') ?? ''),
    settingName: String(pick<string>(raw, 'settingName', 'SettingName') ?? ''),
    settingValue: pick<string>(raw, 'settingValue', 'SettingValue'),
    description: pick<string>(raw, 'description', 'Description'),
    category: pick<string>(raw, 'category', 'Category'),
    valueType: String(pick<string>(raw, 'valueType', 'ValueType') ?? 'String'),
    sortOrder: Number(pick(raw, 'sortOrder', 'SortOrder') ?? 0),
    isSystemSetting: Boolean(pick(raw, 'isSystemSetting', 'IsSystemSetting')),
    isActive: Boolean(pick(raw, 'isActive', 'IsActive') ?? true),
    createdAt: String(pick<string>(raw, 'createdAt', 'CreatedAt') ?? ''),
    updatedAt: pick<string>(raw, 'updatedAt', 'UpdatedAt'),
  };
}

function parseListPayload(envelope: ApiEnvelope<Record<string, unknown>>): LabelSettingsResponse {
  const body = envelope.data;
  if (!body || typeof body !== 'object') {
    return { labelSettings: [], totalCount: 0, page: 1, pageSize: 50, totalPages: 0 };
  }
  const rawList = pick<unknown[]>(body, 'labelSettings', 'LabelSettings') ?? [];
  const list = Array.isArray(rawList) ? rawList : [];
  return {
    labelSettings: list.map((row) => normalizeLabelSetting(row as Record<string, unknown>)),
    totalCount: Number(pick(body, 'totalCount', 'TotalCount') ?? 0),
    page: Number(pick(body, 'page', 'Page') ?? 1),
    pageSize: Number(pick(body, 'pageSize', 'PageSize') ?? 50),
    totalPages: Number(pick(body, 'totalPages', 'TotalPages') ?? 0),
  };
}

export function getLabelSettingsErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const ax = err as { response?: { data?: { error?: { message?: string }; message?: string } } };
    const d = ax.response?.data;
    return d?.error?.message ?? d?.message ?? (err instanceof Error ? err.message : 'Request failed');
  }
  if (err instanceof Error) return err.message;
  return 'Request failed';
}

export const labelSettingsApi = {
  async getAll(
    page: number = 1,
    pageSize: number = 50,
    search?: string,
    category?: string,
    activeOnly?: boolean
  ): Promise<LabelSettingsResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    if (activeOnly !== undefined) params.append('activeOnly', activeOnly.toString());

    const response = await apiClient.get<ApiEnvelope<Record<string, unknown>>>(`/api/label-settings?${params}`);
    assertApiSuccess(response.data);
    return parseListPayload(response.data);
  },

  async getById(id: string): Promise<LabelSetting> {
    const response = await apiClient.get<ApiEnvelope<Record<string, unknown>>>(`/api/label-settings/${id}`);
    assertApiSuccess(response.data);
    return normalizeLabelSetting(response.data.data as Record<string, unknown>);
  },

  async create(data: CreateLabelSettingDto): Promise<LabelSetting> {
    const response = await apiClient.post<ApiEnvelope<Record<string, unknown>>>('/api/label-settings', data);
    assertApiSuccess(response.data);
    return normalizeLabelSetting(response.data.data as Record<string, unknown>);
  },

  async update(id: string, data: UpdateLabelSettingDto): Promise<LabelSetting> {
    const response = await apiClient.put<ApiEnvelope<Record<string, unknown>>>(`/api/label-settings/${id}`, data);
    assertApiSuccess(response.data);
    return normalizeLabelSetting(response.data.data as Record<string, unknown>);
  },

  async delete(id: string): Promise<void> {
    const response = await apiClient.delete<ApiEnvelope<unknown>>(`/api/label-settings/${id}`);
    assertApiSuccess(response.data);
  },
};
