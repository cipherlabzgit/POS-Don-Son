import apiClient, { type ApiEnvelope } from './api-client';

export interface Ingredient {
  id: string;
  code: string;
  name: string;
  description?: string;
  categoryId: string;
  categoryName: string;
  unitOfMeasureId: string;
  unitOfMeasure: string;
  ingredientType: string;
  isSemiFinishedItem: boolean;
  extraPercentageApplicable: boolean;
  extraPercentage: number;
  allowDecimal: boolean;
  decimalPlaces: number;
  unitPrice: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateIngredientDto {
  code: string;
  name: string;
  description?: string;
  categoryId: string;
  unitOfMeasureId: string;
  ingredientType: string;
  isSemiFinishedItem: boolean;
  extraPercentageApplicable: boolean;
  extraPercentage: number;
  allowDecimal: boolean;
  decimalPlaces: number;
  unitPrice: number;
  sortOrder: number;
  isActive: boolean;
}

export interface UpdateIngredientDto {
  code: string;
  name: string;
  description?: string;
  categoryId: string;
  unitOfMeasureId: string;
  ingredientType: string;
  isSemiFinishedItem: boolean;
  extraPercentageApplicable: boolean;
  extraPercentage: number;
  allowDecimal: boolean;
  decimalPlaces: number;
  unitPrice: number;
  sortOrder: number;
  isActive: boolean;
}

export interface IngredientsResponse {
  ingredients: Ingredient[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const ingredientsApi = {
  async getAll(
    page: number = 1,
    pageSize: number = 50,
    search?: string,
    categoryId?: string,
    ingredientType?: string,
    activeOnly?: boolean
  ): Promise<IngredientsResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (search) params.append('search', search);
    if (categoryId) params.append('categoryId', categoryId);
    if (ingredientType) params.append('ingredientType', ingredientType);
    if (activeOnly !== undefined) params.append('activeOnly', activeOnly.toString());

    const response = await apiClient.get<ApiEnvelope<IngredientsResponse>>(`/api/Ingredients?${params}`);
    return response.data.data;
  },

  async getById(id: string): Promise<Ingredient> {
    const response = await apiClient.get<ApiEnvelope<Ingredient>>(`/api/Ingredients/${id}`);
    return response.data.data;
  },

  async create(data: CreateIngredientDto): Promise<Ingredient> {
    const response = await apiClient.post<ApiEnvelope<Ingredient>>('/api/Ingredients', data);
    return response.data.data;
  },

  async update(id: string, data: UpdateIngredientDto): Promise<Ingredient> {
    const response = await apiClient.put<ApiEnvelope<Ingredient>>(`/api/Ingredients/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/Ingredients/${id}`);
  },
};
