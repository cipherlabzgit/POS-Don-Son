import apiClient from './api-client';

export interface SectionConsumable {
  id: string;
  productionSectionId: string;
  productionSectionName: string;
  ingredientId: string;
  ingredientName: string;
  ingredientCode?: string;
  quantityPerUnit: number;
  formula?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateSectionConsumableDto {
  productionSectionId: string;
  ingredientId: string;
  quantityPerUnit: number;
  formula?: string;
  notes?: string;
  isActive: boolean;
}

export interface UpdateSectionConsumableDto {
  productionSectionId: string;
  ingredientId: string;
  quantityPerUnit: number;
  formula?: string;
  notes?: string;
  isActive: boolean;
}

export interface SectionConsumablesResponse {
  sectionConsumables: SectionConsumable[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const sectionConsumablesApi = {
  async getAll(
    page: number = 1,
    pageSize: number = 50,
    productionSectionId?: string,
    ingredientId?: string,
    search?: string,
    activeOnly?: boolean
  ): Promise<SectionConsumablesResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (productionSectionId) params.append('productionSectionId', productionSectionId);
    if (ingredientId) params.append('ingredientId', ingredientId);
    if (search) params.append('search', search);
    if (activeOnly !== undefined) params.append('activeOnly', activeOnly.toString());

    const response = await apiClient.get<SectionConsumablesResponse>(`/api/section-consumables?${params}`);
    return response.data.data;
  },

  async getById(id: string): Promise<SectionConsumable> {
    const response = await apiClient.get<SectionConsumable>(`/api/section-consumables/${id}`);
    return response.data.data;
  },

  async create(data: CreateSectionConsumableDto): Promise<SectionConsumable> {
    const response = await apiClient.post<SectionConsumable>('/api/section-consumables', data);
    return response.data.data;
  },

  async update(id: string, data: UpdateSectionConsumableDto): Promise<SectionConsumable> {
    const response = await apiClient.put<SectionConsumable>(`/api/section-consumables/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/section-consumables/${id}`);
  },
};
