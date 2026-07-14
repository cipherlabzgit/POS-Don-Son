import apiClient from './api-client';

export interface ProductionSection {
  id: string;
  code: string;
  name: string;
  description?: string;
  location?: string;
  capacity?: number;
  displayOrder: number;
  consumableCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateProductionSectionDto {
  code: string;
  name: string;
  description?: string;
  location?: string;
  capacity?: number;
  displayOrder: number;
  isActive: boolean;
}

export interface UpdateProductionSectionDto {
  code: string;
  name: string;
  description?: string;
  location?: string;
  capacity?: number;
  displayOrder: number;
  isActive: boolean;
}

export interface ProductionSectionsResponse {
  productionSections: ProductionSection[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const productionSectionsApi = {
  async getAll(
    page: number = 1,
    pageSize: number = 50,
    search?: string,
    activeOnly?: boolean
  ): Promise<ProductionSectionsResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (search) params.append('search', search);
    if (activeOnly !== undefined) params.append('activeOnly', activeOnly.toString());

    const response = await apiClient.get<ProductionSectionsResponse>(`/api/production-sections?${params}`);
    return response.data.data;
  },

  async getById(id: string): Promise<ProductionSection> {
    const response = await apiClient.get<ProductionSection>(`/api/production-sections/${id}`);
    return response.data.data;
  },

  async create(data: CreateProductionSectionDto): Promise<ProductionSection> {
    const response = await apiClient.post<ProductionSection>('/api/production-sections', data);
    return response.data.data;
  },

  async update(id: string, data: UpdateProductionSectionDto): Promise<ProductionSection> {
    const response = await apiClient.put<ProductionSection>(`/api/production-sections/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/production-sections/${id}`);
  },
};
