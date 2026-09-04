import { apiClient } from './client';

export interface PosThemeConfig {
  id: string;
  themeName: string;
  description?: string;
  primaryColor: string;
  primaryLight?: string;
  primaryDark?: string;
  accentColor: string;
  accentLight?: string;
  accentDark?: string;
  categoryColors?: string[];
  isActive: boolean;
  isSystem: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreatePosThemeDto {
  themeName: string;
  description?: string;
  primaryColor: string;
  primaryLight?: string;
  primaryDark?: string;
  accentColor: string;
  accentLight?: string;
  accentDark?: string;
  categoryColors?: string[];
  displayOrder?: number;
}

export interface UpdatePosThemeDto {
  themeName?: string;
  description?: string;
  primaryColor?: string;
  primaryLight?: string;
  primaryDark?: string;
  accentColor?: string;
  accentLight?: string;
  accentDark?: string;
  categoryColors?: string[];
  displayOrder?: number;
}

function themeApiError(err: unknown, fallback: string) {
  const data = (err as { response?: { data?: { error?: { message?: string }; message?: string } } })?.response?.data;
  return data?.error?.message ?? data?.message ?? (err instanceof Error ? err.message : fallback);
}

export const posThemeApi = {
  async getAll(params?: { page?: number; pageSize?: number; search?: string; activeOnly?: boolean }) {
    try {
      const response = await apiClient.get<{
        data: {
          themes?: PosThemeConfig[];
          Themes?: PosThemeConfig[];
          totalCount?: number;
          TotalCount?: number;
          page?: number;
          Page?: number;
          pageSize?: number;
          PageSize?: number;
          totalPages?: number;
          TotalPages?: number;
        }
      }>('/api/pos-theme-configs', { params });
      const payload = response.data?.data ?? {};
      return {
        themes: payload.themes ?? payload.Themes ?? [],
        totalCount: payload.totalCount ?? payload.TotalCount ?? 0,
        page: payload.page ?? payload.Page ?? 1,
        pageSize: payload.pageSize ?? payload.PageSize ?? 100,
        totalPages: payload.totalPages ?? payload.TotalPages ?? 0,
      };
    } catch (err) {
      throw new Error(themeApiError(err, 'Failed to load themes'));
    }
  },

  async getById(id: string) {
    const response = await apiClient.get<{ data: PosThemeConfig }>(`/api/pos-theme-configs/${id}`);
    return response.data.data;
  },

  async getActive() {
    const response = await apiClient.get<{
      data: {
        primaryColor: string;
        primaryLight: string;
        primaryDark: string;
        accentColor: string;
        accentLight: string;
        accentDark: string;
        categoryColors: string[];
      }
    }>('/api/pos-theme-configs/active');
    return response.data.data;
  },

  async create(data: CreatePosThemeDto) {
    try {
      const response = await apiClient.post<{ data: PosThemeConfig }>('/api/pos-theme-configs', data);
      return response.data.data;
    } catch (err) {
      throw new Error(themeApiError(err, 'Failed to create theme'));
    }
  },

  async update(id: string, data: UpdatePosThemeDto) {
    try {
      const response = await apiClient.put<{ data: PosThemeConfig }>(`/api/pos-theme-configs/${id}`, data);
      return response.data.data;
    } catch (err) {
      throw new Error(themeApiError(err, 'Failed to update theme'));
    }
  },

  async delete(id: string) {
    await apiClient.delete(`/api/pos-theme-configs/${id}`);
  },

  async setActive(id: string) {
    const response = await apiClient.post<{ data: PosThemeConfig }>(`/api/pos-theme-configs/${id}/activate`);
    return response.data.data;
  },
};
