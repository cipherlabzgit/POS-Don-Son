import apiClient, { type ApiEnvelope } from './api-client';

export interface Category {
  id: string;
  code: string;
  name: string;
  description?: string;
  sortOrder: number;
  displayInPOS: boolean;
  isActive: boolean;
  productCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateCategoryDto {
  code: string;
  name: string;
  description?: string;
  sortOrder: number;
  displayInPOS: boolean;
  isActive: boolean;
}

export interface UpdateCategoryDto {
  code: string;
  name: string;
  description?: string;
  sortOrder: number;
  displayInPOS: boolean;
  isActive: boolean;
}

export interface CategoriesResponse {
  categories: Category[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const categoriesApi = {
  async getAll(
    page: number = 1,
    pageSize: number = 50,
    search?: string,
    activeOnly?: boolean
  ): Promise<CategoriesResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (search) params.append('search', search);
    if (activeOnly !== undefined) params.append('activeOnly', activeOnly.toString());

    const response = await apiClient.get<ApiEnvelope<CategoriesResponse>>(`/api/Categories?${params}`);
    return response.data.data;
  },

  async getById(id: string): Promise<Category> {
    const response = await apiClient.get<ApiEnvelope<Category>>(`/api/Categories/${id}`);
    return response.data.data;
  },

  async create(data: CreateCategoryDto): Promise<Category> {
    const response = await apiClient.post<ApiEnvelope<Category>>('/api/Categories', data);
    return response.data.data;
  },

  async update(id: string, data: UpdateCategoryDto): Promise<Category> {
    const response = await apiClient.put<ApiEnvelope<Category>>(`/api/Categories/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/Categories/${id}`);
  },
};
