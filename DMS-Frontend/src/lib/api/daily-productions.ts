import api from './api-client';

export interface DailyProductionLineItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  productionSectionId: string;
  productionSectionName: string;
  plannedQty: number;
  producedQty: number;
  notes?: string;
}

export interface DailyProduction {
  id: string;
  productionNo: string;
  productionDate: string;
  shiftId: string;
  shiftName: string;
  status: 'Draft' | 'Pending' | 'Approved' | 'Rejected';
  batchId?: string;
  totalItems: number;
  totalProducedQty: number;
  lines: DailyProductionLineItem[];
  approvedById?: string;
  approvedByName?: string;
  approvedDate?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt: string;
  createdById?: string;
  createdByName?: string;
  updatedById?: string;
  updatedByName?: string;
}

export interface CreateDailyProductionDto {
  productionDate: string;
  productId: string;
  productionSectionId: string;
  plannedQty: number;
  producedQty: number;
  shiftId: string;
  notes?: string;
  batchId?: string;
}

export interface UpdateDailyProductionDto {
  productionDate: string;
  productId: string;
  productionSectionId: string;
  plannedQty: number;
  producedQty: number;
  shiftId: string;
  notes?: string;
}

export interface DailyProductionListResponse {
  data: DailyProduction[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
}

const BASE_URL = '/api/daily-productions';

export const dailyProductionsApi = {
  getAll: async (
    page = 1,
    pageSize = 10,
    filters?: {
      fromDate?: string;
      toDate?: string;
      productId?: string;
      status?: string;
      showPreviousRecords?: boolean;
    },
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    if (filters?.fromDate) params.append('fromDate', filters.fromDate);
    if (filters?.toDate) params.append('toDate', filters.toDate);
    if (filters?.productId) params.append('productId', filters.productId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.showPreviousRecords) params.append('showPreviousRecords', 'true');

    const response = await api.get<any>(`${BASE_URL}?${params}`);
    const body = response.data?.data ?? response.data;
    const rawList = body?.productions ?? body?.Productions ?? body?.data ?? body?.Data;
    const items: unknown[] = Array.isArray(rawList) ? rawList : [];

    const normalized = items.map((raw: any) => ({
      ...raw,
      product:
        raw?.product ??
        (raw?.productId
          ? {
              id: raw.productId,
              code: raw.productCode ?? raw.product?.code ?? '',
              name: raw.productName ?? raw.product?.name ?? '',
            }
          : undefined),
      shiftName: raw.shiftName ?? raw.shift ?? '',
    }));

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
    return response.data.data || response.data;
  },

  getByProductionNo: async (productionNo: string) => {
    const response = await api.get<any>(`${BASE_URL}/by-production-no/${productionNo}`);
    return response.data.data || response.data;
  },

  create: async (data: CreateDailyProductionDto) => {
    const response = await api.post<any>(BASE_URL, data);
    return response.data.data || response.data;
  },

  update: async (id: string, data: UpdateDailyProductionDto) => {
    const response = await api.put<any>(`${BASE_URL}/${id}`, data);
    return response.data.data || response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data.data || response.data;
  },

  approve: async (id: string) => {
    const response = await api.post<any>(`${BASE_URL}/${id}/approve`);
    return response.data.data || response.data;
  },

  reject: async (id: string) => {
    const response = await api.post<any>(`${BASE_URL}/${id}/reject`);
    return response.data.data || response.data;
  },

  submit: async (id: string) => {
    const response = await api.post<any>(`${BASE_URL}/${id}/submit`);
    return response.data.data || response.data;
  },

  getProductionNumbers: async () => {
    const response = await api.get<any>(`${BASE_URL}/production-numbers`);
    console.log('[API] Production numbers response:', response.data);
    const result = response.data?.data || response.data || [];
    console.log('[API] Parsed production numbers:', result);
    return Array.isArray(result) ? result : [];
  },
};
