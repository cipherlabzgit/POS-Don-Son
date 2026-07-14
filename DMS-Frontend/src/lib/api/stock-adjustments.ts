import api from './api-client';

export interface StockAdjustment {
  id: string;
  adjustmentNo: string;
  adjustmentDate: string;
  productId: string;
  product?: {
    id: string;
    code: string;
    name: string;
  };
  adjustmentType: 'Increase' | 'Decrease';
  quantity: number;
  reason: string;
  status: 'Draft' | 'Pending' | 'Approved' | 'Rejected';
  notes?: string;
  approvedById?: string;
  approvedByName?: string;
  approvedBy?: {
    id: string;
    username: string;
    fullName: string;
  };
  approvedDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  createdByName?: string;
  updatedById: string;
  updatedByName?: string;
}

export interface CreateStockAdjustmentDto {
  adjustmentDate: string;
  productId: string;
  adjustmentType: 'Increase' | 'Decrease';
  quantity: number;
  reason: string;
  notes?: string;
}

export interface UpdateStockAdjustmentDto {
  adjustmentDate: string;
  productId: string;
  adjustmentType: 'Increase' | 'Decrease';
  quantity: number;
  reason: string;
  notes?: string;
}

export interface StockAdjustmentListResponse {
  data: StockAdjustment[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
}

const BASE_URL = '/api/stock-adjustments';

function normalizeStockAdjustmentPayload(raw: any): StockAdjustment {
  if (!raw || typeof raw !== 'object') return raw as StockAdjustment;
  return {
    ...raw,
    product:
      raw?.product ??
      (raw?.productId
        ? {
            id: String(raw.productId),
            code: raw.productCode ?? raw.product?.code ?? '',
            name: raw.productName ?? raw.product?.name ?? '',
          }
        : undefined),
  };
}

export const stockAdjustmentsApi = {
  getAll: async (page = 1, pageSize = 10, filters?: {
    fromDate?: string;
    toDate?: string;
    productId?: string;
    status?: string;
  }) => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });
    
    if (filters?.fromDate) params.append('fromDate', filters.fromDate);
    if (filters?.toDate) params.append('toDate', filters.toDate);
    if (filters?.productId) params.append('productId', filters.productId);
    if (filters?.status) params.append('status', filters.status);
    
    const response = await api.get<any>(`${BASE_URL}?${params}`);
    const body = response.data?.data ?? response.data;
    const rawList = body?.adjustments ?? body?.Adjustments ?? body?.data ?? body?.Data;
    const items: unknown[] = Array.isArray(rawList) ? rawList : [];

    const normalized = items.map((raw: any) => normalizeStockAdjustmentPayload(raw));

    return {
      data: normalized,
      page: body?.page ?? body?.Page ?? page,
      pageSize: body?.pageSize ?? body?.PageSize ?? pageSize,
      totalPages: body?.totalPages ?? body?.TotalPages ?? 1,
      totalCount: body?.totalCount ?? body?.TotalCount ?? 0,
    };
  },

  getById: async (id: string) => {
    const response = await api.get<any>(`${BASE_URL}/${id}`);
    const raw = response.data?.data ?? response.data;
    return normalizeStockAdjustmentPayload(raw);
  },

  getByAdjustmentNo: async (adjustmentNo: string) => {
    const response = await api.get<any>(`${BASE_URL}/by-adjustment-no/${adjustmentNo}`);
    const raw = response.data?.data ?? response.data;
    return normalizeStockAdjustmentPayload(raw);
  },

  create: async (data: CreateStockAdjustmentDto) => {
    const response = await api.post<any>(BASE_URL, data);
    const raw = response.data?.data ?? response.data;
    return normalizeStockAdjustmentPayload(raw);
  },

  update: async (id: string, data: UpdateStockAdjustmentDto) => {
    const response = await api.put<any>(`${BASE_URL}/${id}`, data);
    const raw = response.data?.data ?? response.data;
    return normalizeStockAdjustmentPayload(raw);
  },

  delete: async (id: string) => {
    const response = await api.delete<any>(`${BASE_URL}/${id}`);
    const raw = response.data?.data ?? response.data;
    return raw;
  },

  submit: async (id: string) => {
    const response = await api.post<any>(`${BASE_URL}/${id}/submit`);
    const raw = response.data?.data ?? response.data;
    return normalizeStockAdjustmentPayload(raw);
  },

  approve: async (id: string) => {
    const response = await api.post<any>(`${BASE_URL}/${id}/approve`);
    const raw = response.data?.data ?? response.data;
    return normalizeStockAdjustmentPayload(raw);
  },

  reject: async (id: string) => {
    const response = await api.post<any>(`${BASE_URL}/${id}/reject`);
    const raw = response.data?.data ?? response.data;
    return normalizeStockAdjustmentPayload(raw);
  },
};
