import { apiClient } from './api-client';

export interface PriceList {
  id: string;
  code: string;
  name: string;
  description?: string;
  priceListType?: string;
  currency: string;
  effectiveFrom: string;
  effectiveTo?: string;
  isDefault: boolean;
  priority: number;
  isActive: boolean;
  itemCount: number;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePriceListDto {
  code: string;
  name: string;
  description?: string;
  priceListType?: string;
  currency: string;
  effectiveFrom: string;
  effectiveTo?: string;
  isDefault: boolean;
  priority: number;
  isActive: boolean;
}

export interface UpdatePriceListDto extends CreatePriceListDto {}

export interface PriceListsResponse {
  priceLists: PriceList[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function normalizePriceList(raw: any): PriceList {
  const n = (k: string) => raw[k] ?? raw[k.charAt(0).toUpperCase() + k.slice(1)];
  return {
    id: n('id'),
    code: n('code') ?? '',
    name: n('name') ?? '',
    description: n('description'),
    priceListType: n('priceListType'),
    currency: n('currency') ?? 'LKR',
    effectiveFrom: n('effectiveFrom') ?? '',
    effectiveTo: n('effectiveTo'),
    isDefault: n('isDefault') ?? false,
    priority: n('priority') ?? 0,
    isActive: n('isActive') ?? true,
    itemCount: n('itemCount') ?? 0,
    createdByName: n('createdByName'),
    createdAt: n('createdAt') ?? '',
    updatedAt: n('updatedAt') ?? '',
  };
}

export const priceListsApi = {
  async getAll(
    page: number = 1,
    pageSize: number = 10,
    search?: string,
    activeOnly?: boolean
  ): Promise<PriceListsResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (search) params.append('search', search);
    if (activeOnly !== undefined) params.append('activeOnly', activeOnly.toString());

    const response = await apiClient.get<any>(`/api/pricelists?${params}`);
    const raw = response.data?.data ?? response.data;
    const lists: PriceList[] = (raw?.PriceLists ?? raw?.priceLists ?? []).map(normalizePriceList);
    return {
      priceLists: lists,
      totalCount: raw?.TotalCount ?? raw?.totalCount ?? 0,
      page: raw?.Page ?? raw?.page ?? page,
      pageSize: raw?.PageSize ?? raw?.pageSize ?? pageSize,
      totalPages: raw?.TotalPages ?? raw?.totalPages ?? 1,
    };
  },

  async getById(id: string): Promise<PriceList> {
    const response = await apiClient.get<any>(`/api/pricelists/${id}`);
    return normalizePriceList(response.data?.data ?? response.data);
  },

  async create(data: CreatePriceListDto): Promise<PriceList> {
    const response = await apiClient.post<any>('/api/pricelists', data);
    return normalizePriceList(response.data?.data ?? response.data);
  },

  async update(id: string, data: UpdatePriceListDto): Promise<PriceList> {
    const response = await apiClient.put<any>(`/api/pricelists/${id}`, data);
    return normalizePriceList(response.data?.data ?? response.data);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/pricelists/${id}`);
  },
};
