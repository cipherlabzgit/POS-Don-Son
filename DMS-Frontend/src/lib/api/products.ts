import apiClient from './api-client';

export interface ProductSectionAssignment {
  id: string;
  productionSectionId: string;
  productionSectionCode: string;
  productionSectionName: string;
  role?: string;
  sortOrder: number;
}

export interface UpsertProductSectionAssignment {
  productionSectionId: string;
  role?: string;
  sortOrder: number;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  description?: string;
  categoryId: string;
  categoryName: string;
  unitOfMeasureId: string;
  unitOfMeasure: string;
  unitPrice: number;
  productType?: string;
  productionSection?: string;
  productionSectionId?: string;
  productionSectionName?: string;
  sectionAssignments?: ProductSectionAssignment[];
  hasFullSize?: boolean;
  hasMiniSize?: boolean;
  allowDecimal?: boolean;
  decimalPlaces?: number;
  roundingValue?: number;
  isPlainRollItem?: boolean;
  requireOpenStock: boolean;
  displayInPOS: boolean;
  enableLabelPrint: boolean;
  allowFutureLabelPrint: boolean;
  labelTemplateId?: string | null;
  labelTemplateCode?: string | null;
  labelTemplateName?: string | null;
  sortOrder?: number;
  defaultDeliveryTurns?: number[];
  availableInTurns?: number[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  /** Optional / future API fields (shown in delivery item details when present) */
  weightGrams?: number | null;
  standardQuantity?: number | null;
  showInPos?: boolean | null;
  favorite?: boolean | null;
  expiryDays?: number | null;
  expiryHours?: number | null;
}

export interface CreateProductDto {
  code: string;
  name: string;
  description?: string;
  categoryId: string;
  unitOfMeasureId: string;
  unitPrice: number;
  productType?: string;
  productionSection?: string;
  productionSectionId?: string;
  sectionAssignments: UpsertProductSectionAssignment[];
  hasFullSize: boolean;
  hasMiniSize: boolean;
  allowDecimal: boolean;
  decimalPlaces: number;
  roundingValue: number;
  isPlainRollItem: boolean;
  requireOpenStock: boolean;
  displayInPOS: boolean;
  enableLabelPrint: boolean;
  allowFutureLabelPrint: boolean;
  labelTemplateId?: string | null;
  sortOrder: number;
  defaultDeliveryTurns: number[];
  availableInTurns: number[];
  isActive: boolean;
}

export interface UpdateProductDto {
  code: string;
  name: string;
  description?: string;
  categoryId: string;
  unitOfMeasureId: string;
  unitPrice: number;
  productType?: string;
  productionSection?: string;
  productionSectionId?: string;
  sectionAssignments: UpsertProductSectionAssignment[];
  hasFullSize: boolean;
  hasMiniSize: boolean;
  allowDecimal: boolean;
  decimalPlaces: number;
  roundingValue: number;
  isPlainRollItem: boolean;
  requireOpenStock: boolean;
  displayInPOS: boolean;
  enableLabelPrint: boolean;
  allowFutureLabelPrint: boolean;
  labelTemplateId?: string | null;
  sortOrder: number;
  defaultDeliveryTurns: number[];
  availableInTurns: number[];
  isActive: boolean;
}

export interface ProductsResponse {
  products: Product[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function normalizeProduct(raw: any): Product {
  const n = (k: string) => raw[k] ?? raw[k.charAt(0).toUpperCase() + k.slice(1)];
  return {
    id: n('id'),
    code: n('code') ?? '',
    name: n('name') ?? '',
    description: n('description'),
    categoryId: n('categoryId') ?? '',
    categoryName: n('categoryName') ?? '',
    unitOfMeasureId: n('unitOfMeasureId') ?? '',
    unitOfMeasure: n('unitOfMeasure') ?? '',
    unitPrice: n('unitPrice') ?? 0,
    productType: n('productType'),
    productionSection: n('productionSection'),
    productionSectionId: n('productionSectionId'),
    productionSectionName: n('productionSectionName'),
    sectionAssignments: n('sectionAssignments') ?? [],
    hasFullSize: n('hasFullSize'),
    hasMiniSize: n('hasMiniSize'),
    allowDecimal: n('allowDecimal'),
    decimalPlaces: n('decimalPlaces'),
    roundingValue: n('roundingValue'),
    isPlainRollItem: n('isPlainRollItem'),
    requireOpenStock: n('requireOpenStock') ?? false,
    displayInPOS: n('displayInPOS') ?? n('displayInPOS') ?? true,
    enableLabelPrint: n('enableLabelPrint') ?? false,
    allowFutureLabelPrint: n('allowFutureLabelPrint') ?? false,
    labelTemplateId: n('labelTemplateId'),
    labelTemplateCode: n('labelTemplateCode'),
    labelTemplateName: n('labelTemplateName'),
    sortOrder: n('sortOrder'),
    defaultDeliveryTurns: n('defaultDeliveryTurns'),
    availableInTurns: n('availableInTurns'),
    isActive: n('isActive') ?? true,
    createdAt: n('createdAt'),
    updatedAt: n('updatedAt'),
    weightGrams: n('weightGrams'),
    standardQuantity: n('standardQuantity'),
    showInPos: n('showInPos') ?? n('showInPOS') ?? n('ShowInPos'),
    favorite: n('favorite') ?? n('isFavorite') ?? n('Favorite'),
    expiryDays: n('expiryDays') ?? n('ExpiryDays'),
    expiryHours: n('expiryHours') ?? n('ExpiryHours'),
  };
}

export const productsApi = {
  async getAll(
    page: number = 1,
    pageSize: number = 50,
    search?: string,
    categoryId?: string,
    activeOnly?: boolean
  ): Promise<ProductsResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (search) params.append('search', search);
    if (categoryId) params.append('categoryId', categoryId);
    if (activeOnly !== undefined) params.append('activeOnly', activeOnly.toString());

    try {
      const response = await apiClient.get<any>(`/api/Products?${params}`);
      const payload = response.data?.data ?? response.data;
      const rawList = payload?.Products ?? payload?.products;
      const products: Product[] = Array.isArray(rawList) ? rawList.map(normalizeProduct) : [];
      return {
        products,
        page: payload?.Page ?? payload?.page ?? page,
        pageSize: payload?.PageSize ?? payload?.pageSize ?? pageSize,
        totalPages: payload?.TotalPages ?? payload?.totalPages ?? 1,
        totalCount: payload?.TotalCount ?? payload?.totalCount ?? products.length,
      };
    } catch (error: any) {
      // If the backend returns 404 or "no records", return empty results instead of throwing
      if (
        error.response?.status === 404 ||
        error.response?.data?.message?.toLowerCase().includes('no records found') ||
        error.response?.data?.message?.toLowerCase().includes('not found')
      ) {
        return {
          products: [],
          page,
          pageSize,
          totalPages: 1,
          totalCount: 0,
        };
      }
      // Re-throw other errors
      throw error;
    }
  },

  async getById(id: string): Promise<Product> {
    const response = await apiClient.get<any>(`/api/Products/${id}`);
    return normalizeProduct(response.data?.data ?? response.data);
  },

  async create(data: CreateProductDto): Promise<Product> {
    const response = await apiClient.post<any>('/api/Products', data);
    return normalizeProduct(response.data?.data ?? response.data);
  },

  async update(id: string, data: UpdateProductDto): Promise<Product> {
    const response = await apiClient.put<any>(`/api/Products/${id}`, data);
    return normalizeProduct(response.data?.data ?? response.data);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/Products/${id}`);
  },
};

const productDetailsCache = new Map<string, Product>();

export async function resolveProductionSectionId(product: Product): Promise<string | undefined> {
  if (product.productionSectionId) {
    return product.productionSectionId;
  }

  if (product.sectionAssignments?.length === 1) {
    return product.sectionAssignments[0].productionSectionId;
  }

  if (product.sectionAssignments?.length > 1) {
    return undefined;
  }

  const cachedProduct = productDetailsCache.get(product.id);
  const fullProduct = cachedProduct ?? (await productsApi.getById(product.id));
  if (!cachedProduct) {
    productDetailsCache.set(product.id, fullProduct);
  }

  if (fullProduct.productionSectionId) {
    return fullProduct.productionSectionId;
  }

  if (fullProduct.sectionAssignments?.length === 1) {
    return fullProduct.sectionAssignments[0].productionSectionId;
  }

  return undefined;
}
