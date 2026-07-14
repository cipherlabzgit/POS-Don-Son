import apiClient, { type ApiEnvelope } from './api-client';

export interface UnitOfMeasure {
  id: string;
  code: string;
  description: string;
  isActive: boolean;
  productCount: number;
  ingredientCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateUnitOfMeasureDto {
  code: string;
  description: string;
  isActive: boolean;
}

export interface UpdateUnitOfMeasureDto {
  code: string;
  description: string;
  isActive: boolean;
}

export interface UnitOfMeasuresResponse {
  unitOfMeasures: UnitOfMeasure[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const uomsApi = {
  async getAll(
    page: number = 1,
    pageSize: number = 50,
    search?: string,
    activeOnly?: boolean
  ): Promise<UnitOfMeasuresResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (search) params.append('search', search);
    if (activeOnly !== undefined) params.append('activeOnly', activeOnly.toString());

    const response = await apiClient.get<ApiEnvelope<UnitOfMeasuresResponse>>(`/api/UnitOfMeasures?${params}`);
    return response.data.data;
  },

  async getById(id: string): Promise<UnitOfMeasure> {
    const response = await apiClient.get<ApiEnvelope<UnitOfMeasure>>(`/api/UnitOfMeasures/${id}`);
    return response.data.data;
  },

  async create(data: CreateUnitOfMeasureDto): Promise<UnitOfMeasure> {
    const response = await apiClient.post<ApiEnvelope<UnitOfMeasure>>('/api/UnitOfMeasures', data);
    return response.data.data;
  },

  async update(id: string, data: UpdateUnitOfMeasureDto): Promise<UnitOfMeasure> {
    const response = await apiClient.put<ApiEnvelope<UnitOfMeasure>>(`/unitofmeasures/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/UnitOfMeasures/${id}`);
  },
};
