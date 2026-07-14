import apiClient, { type ApiEnvelope } from './api-client';

export interface DefaultQuantity {
  id: string;
  outletId: string;
  outletName: string;
  dayTypeId: string;
  dayTypeName: string;
  productId: string;
  productName: string;
  fullQuantity: number;
  miniQuantity: number;
  updatedAt: string;
}

export interface CreateDefaultQuantityDto {
  outletId: string;
  dayTypeId: string;
  productId: string;
  fullQuantity: number;
  miniQuantity: number;
}

export interface UpdateDefaultQuantityDto {
  fullQuantity: number;
  miniQuantity: number;
}

export interface BulkUpsertDefaultQuantityDto {
  id?: string;
  outletId: string;
  dayTypeId: string;
  productId: string;
  fullQuantity: number;
  miniQuantity: number;
}

export interface DefaultQuantitiesResponse {
  defaultQuantities: DefaultQuantity[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const defaultQuantitiesApi = {
  async getAll(
    page: number = 1,
    pageSize: number = 100,
    outletId?: string,
    dayTypeId?: string,
    productId?: string
  ): Promise<DefaultQuantitiesResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (outletId) params.append('outletId', outletId);
    if (dayTypeId) params.append('dayTypeId', dayTypeId);
    if (productId) params.append('productId', productId);

    const response = await apiClient.get<ApiEnvelope<DefaultQuantitiesResponse>>(
      `/api/default-quantities?${params}`
    );
    return response.data.data;
  },

  async getById(id: string): Promise<DefaultQuantity> {
    const response = await apiClient.get<ApiEnvelope<DefaultQuantity>>(
      `/api/default-quantities/${id}`
    );
    return response.data.data;
  },

  async getByCompositeKey(
    outletId: string,
    dayTypeId: string,
    productId: string
  ): Promise<DefaultQuantity> {
    const params = new URLSearchParams();
    params.append('outletId', outletId);
    params.append('dayTypeId', dayTypeId);
    params.append('productId', productId);

    const response = await apiClient.get<ApiEnvelope<DefaultQuantity>>(
      `/api/default-quantities/by-key?${params}`
    );
    return response.data.data;
  },

  async create(data: CreateDefaultQuantityDto): Promise<DefaultQuantity> {
    const response = await apiClient.post<ApiEnvelope<DefaultQuantity>>(
      '/api/default-quantities',
      data
    );
    return response.data.data;
  },

  async update(id: string, data: UpdateDefaultQuantityDto): Promise<DefaultQuantity> {
    const response = await apiClient.put<ApiEnvelope<DefaultQuantity>>(
      `/api/default-quantities/${id}`,
      data
    );
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/default-quantities/${id}`);
  },

  async bulkUpsert(data: BulkUpsertDefaultQuantityDto[]): Promise<DefaultQuantity[]> {
    const response = await apiClient.post<ApiEnvelope<DefaultQuantity[]>>(
      '/api/default-quantities/bulk-upsert',
      data
    );
    return response.data.data;
  },
};
