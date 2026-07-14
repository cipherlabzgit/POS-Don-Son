import { apiClient, type ApiEnvelope } from './api-client';

export interface RecipeIngredient {
  id?: string;
  ingredientId: string;
  ingredientCode?: string;
  ingredientName?: string;
  qtyPerUnit: number;
  extraQtyPerUnit: number;
  storesOnly: boolean;
  showExtraInStores: boolean;
  isPercentage: boolean;
  percentageSourceProductId?: string;
  percentageValue?: number;
  sortOrder: number;
}

export interface RecipeComponent {
  id?: string;
  productionSectionId: string;
  productionSectionName?: string;
  componentName: string;
  sortOrder: number;
  isPercentageBased: boolean;
  baseRecipeId?: string;
  percentageOfBase?: number;
  recipeIngredients: RecipeIngredient[];
}

export interface Recipe {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  recipeName?: string;
  templateId?: string;
  templateName?: string;
  version: number;
  effectiveFrom: string;
  effectiveTo?: string;
  applyRoundOff: boolean;
  roundOffValue?: number;
  roundOffNotes?: string;
  isActive: boolean;
  recipeComponents: RecipeComponent[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecipeDto {
  productId: string;
  recipeName?: string;
  templateId?: string;
  version: number;
  effectiveFrom: string;
  effectiveTo?: string;
  applyRoundOff: boolean;
  roundOffValue?: number;
  roundOffNotes?: string;
  isActive: boolean;
  recipeComponents: RecipeComponent[];
}

export interface UpdateRecipeDto extends CreateRecipeDto {}

export interface RecipesResponse {
  recipes: Recipe[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CalculatedIngredient {
  ingredientId: string;
  ingredientCode: string;
  ingredientName: string;
  componentName: string;
  requiredQuantity: number;
  extraQuantity: number;
  totalQuantity: number;
  unit: string;
  storesOnly: boolean;
  showExtraInStores: boolean;
}

export interface RecipeCalculation {
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  ingredients: CalculatedIngredient[];
}

export const recipesApi = {
  async getAll(
    page: number = 1,
    pageSize: number = 50,
    search?: string,
    activeOnly?: boolean,
    productId?: string
  ): Promise<RecipesResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (search) params.append('search', search);
    if (activeOnly !== undefined) params.append('activeOnly', activeOnly.toString());
    if (productId) params.append('productId', productId);

    const response = await apiClient.get<ApiEnvelope<RecipesResponse>>(`/api/Recipes?${params}`);
    return response.data.data;
  },

  async getById(id: string): Promise<Recipe> {
    const response = await apiClient.get<ApiEnvelope<Recipe>>(`/api/Recipes/${id}`);
    return response.data.data;
  },

  async getByProductId(productId: string): Promise<Recipe> {
    const response = await apiClient.get<ApiEnvelope<Recipe>>(`/api/Recipes/by-product/${productId}`);
    return response.data.data;
  },

  async create(dto: CreateRecipeDto): Promise<Recipe> {
    const response = await apiClient.post<ApiEnvelope<Recipe>>('/api/Recipes', dto);
    return response.data.data;
  },

  async update(id: string, dto: UpdateRecipeDto): Promise<Recipe> {
    const response = await apiClient.put<ApiEnvelope<Recipe>>(`/api/Recipes/${id}`, dto);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/Recipes/${id}`);
  },

  async calculateIngredients(productId: string, quantity: number): Promise<RecipeCalculation> {
    const response = await apiClient.post<ApiEnvelope<RecipeCalculation>>(`/api/Recipes/${productId}/calculate`, null, {
      params: { qty: quantity }
    });
    return response.data.data;
  },
};
