import { apiClient } from './api-client';

export interface GridConfiguration {
  id: string;
  gridName: string;
  userId?: string;
  configurationName?: string;
  columnSettings?: string;
  sortSettings?: string;
  filterSettings?: string;
  pageSize?: number;
  isDefault: boolean;
  isShared: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateGridConfigurationDto {
  gridName: string;
  userId?: string;
  configurationName?: string;
  columnSettings?: string;
  sortSettings?: string;
  filterSettings?: string;
  pageSize?: number;
  isDefault: boolean;
  isShared: boolean;
  isActive: boolean;
}

export interface UpdateGridConfigurationDto extends CreateGridConfigurationDto {}

export interface GridConfigurationsResponse {
  gridConfigurations: GridConfiguration[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const gridConfigurationsApi = {
  async getAll(
    page: number = 1,
    pageSize: number = 50,
    search?: string,
    gridName?: string,
    activeOnly?: boolean
  ): Promise<GridConfigurationsResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (search) params.append('search', search);
    if (gridName) params.append('gridName', gridName);
    if (activeOnly !== undefined) params.append('activeOnly', activeOnly.toString());

    const response = await apiClient.get<GridConfigurationsResponse>(`/gridconfigurations?${params}`);
    return response.data.data;
  },

  async getById(id: string): Promise<GridConfiguration> {
    const response = await apiClient.get<GridConfiguration>(`/gridconfigurations/${id}`);
    return response.data.data;
  },

  async create(data: CreateGridConfigurationDto): Promise<GridConfiguration> {
    const response = await apiClient.post<GridConfiguration>('/gridconfigurations', data);
    return response.data.data;
  },

  async update(id: string, data: UpdateGridConfigurationDto): Promise<GridConfiguration> {
    const response = await apiClient.put<GridConfiguration>(`/gridconfigurations/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/gridconfigurations/${id}`);
  },
};
