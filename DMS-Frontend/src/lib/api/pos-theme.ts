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

export const posThemeApi = {
  async getAll(params?: { page?: number; pageSize?: number; search?: string; activeOnly?: boolean }) {
    const response = await apiClient.get<{
      data: {
        Themes: PosThemeConfig[];
        TotalCount: number;
        Page: number;
        PageSize: number;
        TotalPages: number;
      }
    }>('/api/pos-theme-configs', { params });
    // Convert PascalCase to camelCase
    return {
      themes: response.data.data.Themes,
      totalCount: response.data.data.TotalCount,
      page: response.data.data.Page,
      pageSize: response.data.data.PageSize,
      totalPages: response.data.data.TotalPages
    };
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
    const response = await apiClient.post<{ data: PosThemeConfig }>('/api/pos-theme-configs', data);
    return response.data.data;
  },

  async update(id: string, data: UpdatePosThemeDto) {
    const response = await apiClient.put<{ data: PosThemeConfig }>(`/api/pos-theme-configs/${id}`, data);
    return response.data.data;
  },

  async delete(id: string) {
    await apiClient.delete(`/api/pos-theme-configs/${id}`);
  },

  async setActive(id: string) {
    const response = await apiClient.post<{ data: PosThemeConfig }>(`/api/pos-theme-configs/${id}/activate`);
    return response.data.data;
  },
};
