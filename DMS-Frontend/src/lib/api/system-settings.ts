import apiClient from './api-client';

/** Matches DMS_Backend.Common.ApiResponse JSON shape */
export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: { code?: string; message?: string };
  timestamp?: string;
}

export interface SystemSetting {
  id: string;
  settingKey: string;
  settingName: string;
  settingValue?: string;
  settingType: string;
  description?: string;
  category?: string;
  isSystemSetting: boolean;
  isEncrypted: boolean;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateSystemSettingDto {
  settingKey: string;
  settingName: string;
  settingValue?: string;
  settingType: string;
  description?: string;
  category?: string;
  isSystemSetting: boolean;
  isEncrypted: boolean;
  displayOrder: number;
  isActive: boolean;
}

export interface UpdateSystemSettingDto {
  settingKey: string;
  settingName: string;
  settingValue?: string;
  settingType: string;
  description?: string;
  category?: string;
  isSystemSetting: boolean;
  isEncrypted: boolean;
  displayOrder: number;
  isActive: boolean;
}

export interface SystemSettingsResponse {
  settings: SystemSetting[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function pick<T>(obj: Record<string, unknown>, camel: string, pascal: string): T | undefined {
  const v = obj[camel] ?? obj[pascal];
  return v as T | undefined;
}

function normalizeSetting(raw: Record<string, unknown>): SystemSetting {
  return {
    id: String(pick<string>(raw, 'id', 'Id') ?? ''),
    settingKey: String(pick<string>(raw, 'settingKey', 'SettingKey') ?? ''),
    settingName: String(pick<string>(raw, 'settingName', 'SettingName') ?? ''),
    settingValue: pick<string>(raw, 'settingValue', 'SettingValue'),
    settingType: String(pick<string>(raw, 'settingType', 'SettingType') ?? 'String'),
    description: pick<string>(raw, 'description', 'Description'),
    category: pick<string>(raw, 'category', 'Category'),
    isSystemSetting: Boolean(pick(raw, 'isSystemSetting', 'IsSystemSetting')),
    isEncrypted: Boolean(pick(raw, 'isEncrypted', 'IsEncrypted')),
    displayOrder: Number(pick(raw, 'displayOrder', 'DisplayOrder') ?? 0),
    isActive: Boolean(pick(raw, 'isActive', 'IsActive') ?? true),
    createdAt: String(pick<string>(raw, 'createdAt', 'CreatedAt') ?? ''),
    updatedAt: pick<string>(raw, 'updatedAt', 'UpdatedAt'),
  };
}

function parseListPayload(responseData: unknown): SystemSettingsResponse {
  const root = responseData as ApiEnvelope<Record<string, unknown>> | undefined;
  const body = root?.data;
  if (!body || typeof body !== 'object') {
    return { settings: [], totalCount: 0, page: 1, pageSize: 50, totalPages: 0 };
  }
  const rawList = pick<unknown[]>(body, 'settings', 'Settings') ?? [];
  const list = Array.isArray(rawList) ? rawList : [];
  return {
    settings: list.map((row) => normalizeSetting(row as Record<string, unknown>)),
    totalCount: Number(pick(body, 'totalCount', 'TotalCount') ?? 0),
    page: Number(pick(body, 'page', 'Page') ?? 1),
    pageSize: Number(pick(body, 'pageSize', 'PageSize') ?? 50),
    totalPages: Number(pick(body, 'totalPages', 'TotalPages') ?? 0),
  };
}

function assertSuccess<T>(envelope: ApiEnvelope<T> | undefined): void {
  if (!envelope?.success) {
    const msg = envelope?.error?.message ?? 'Request failed';
    throw new Error(msg);
  }
}

export function getSystemSettingsErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const ax = err as { response?: { data?: { error?: { message?: string }; message?: string } } };
    const d = ax.response?.data;
    return d?.error?.message ?? d?.message ?? (err instanceof Error ? err.message : 'Request failed');
  }
  if (err instanceof Error) return err.message;
  return 'Request failed';
}

export const systemSettingsApi = {
  async getAll(
    page: number = 1,
    pageSize: number = 50,
    category?: string,
    search?: string,
    activeOnly?: boolean
  ): Promise<SystemSettingsResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    if (activeOnly !== undefined) params.append('activeOnly', activeOnly.toString());

    const response = await apiClient.get<ApiEnvelope<Record<string, unknown>>>(`/api/system-settings?${params}`);
    assertSuccess(response.data);
    return parseListPayload(response.data);
  },

  async getById(id: string): Promise<SystemSetting> {
    const response = await apiClient.get<ApiEnvelope<Record<string, unknown>>>(`/api/system-settings/${id}`);
    assertSuccess(response.data);
    return normalizeSetting(response.data.data as Record<string, unknown>);
  },

  async getByKey(key: string): Promise<SystemSetting> {
    const response = await apiClient.get<ApiEnvelope<Record<string, unknown>>>(
      `/api/system-settings/key/${encodeURIComponent(key)}`
    );
    assertSuccess(response.data);
    return normalizeSetting(response.data.data as Record<string, unknown>);
  },

  async create(data: CreateSystemSettingDto): Promise<SystemSetting> {
    const response = await apiClient.post<ApiEnvelope<Record<string, unknown>>>('/api/system-settings', data);
    assertSuccess(response.data);
    return normalizeSetting(response.data.data as Record<string, unknown>);
  },

  async update(id: string, data: UpdateSystemSettingDto): Promise<SystemSetting> {
    const response = await apiClient.put<ApiEnvelope<Record<string, unknown>>>(`/api/system-settings/${id}`, data);
    assertSuccess(response.data);
    return normalizeSetting(response.data.data as Record<string, unknown>);
  },

  /** Updates only the value (0/1 for Number-type flag settings). Key is the stable <c>settingKey</c>. */
  async updateValueByKey(settingKey: string, settingValue: string): Promise<SystemSetting> {
    const response = await apiClient.put<ApiEnvelope<Record<string, unknown>>>(
      `/api/system-settings/key/${encodeURIComponent(settingKey)}`,
      { settingValue }
    );
    assertSuccess(response.data);
    return normalizeSetting(response.data.data as Record<string, unknown>);
  },

  async delete(id: string): Promise<void> {
    const response = await apiClient.delete<ApiEnvelope<unknown>>(`/api/system-settings/${id}`);
    assertSuccess(response.data);
  },
};
