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

    const response = await apiClient.get<any>(`/api/Ingredients?${params}`);
    const payload = response.data?.data ?? response.data;
    const rawList = payload?.Ingredients ?? payload?.ingredients ?? [];
    const ingredients: Ingredient[] = Array.isArray(rawList)
      ? rawList.map((raw: any) => ({
          id: raw.id ?? raw.Id,
          code: raw.code ?? raw.Code ?? '',
          name: raw.name ?? raw.Name ?? '',
          description: raw.description ?? raw.Description,
          categoryId: raw.categoryId ?? raw.CategoryId ?? '',
          categoryName: raw.categoryName ?? raw.CategoryName ?? '',
          unitOfMeasureId: raw.unitOfMeasureId ?? raw.UnitOfMeasureId ?? '',
          unitOfMeasure: raw.unitOfMeasure ?? raw.UnitOfMeasure ?? '',
          ingredientType: raw.ingredientType ?? raw.IngredientType ?? '',
          isSemiFinishedItem: raw.isSemiFinishedItem ?? raw.IsSemiFinishedItem ?? false,
          extraPercentageApplicable: raw.extraPercentageApplicable ?? raw.ExtraPercentageApplicable ?? false,
          extraPercentage: raw.extraPercentage ?? raw.ExtraPercentage ?? 0,
          allowDecimal: raw.allowDecimal ?? raw.AllowDecimal ?? false,
          decimalPlaces: raw.decimalPlaces ?? raw.DecimalPlaces ?? 2,
          unitPrice: raw.unitPrice ?? raw.UnitPrice ?? 0,
          sortOrder: raw.sortOrder ?? raw.SortOrder ?? 0,
          isActive: raw.isActive ?? raw.IsActive ?? true,
          createdAt: raw.createdAt ?? raw.CreatedAt ?? '',
          updatedAt: raw.updatedAt ?? raw.UpdatedAt,
        }))
      : [];
    return {
      ingredients,
      page: payload?.Page ?? payload?.page ?? page,
      pageSize: payload?.PageSize ?? payload?.pageSize ?? pageSize,
      totalPages: payload?.TotalPages ?? payload?.totalPages ?? 1,
      totalCount: payload?.TotalCount ?? payload?.totalCount ?? ingredients.length,
    };
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
