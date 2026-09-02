import api from './api-client';

export interface PosSaleLine {
  productId: string;
  productName?: string;
  productCode?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface PosSale {
  id: string;
  saleNo: string;
  soldAt: string;
  outletId: string;
  outletName?: string;
  outlet?: {
    id: string;
    code: string;
    name: string;
  };
  paymentMethod: string;
  totalAmount: number;
  status?: string;
  lines?: PosSaleLine[];
  createdById: string;
  createdByName?: string;
  approvedAt?: string;
  approvedByName?: string;
  rejectedAt?: string;
  rejectedByName?: string;
  rejectionReason?: string;
  cancelRequested?: boolean;
  cancellationReason?: string;
  clientMutationId?: string;
}

export interface PosSaleListResponse {
  sales: PosSale[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
}

const BASE_URL = '/api/pos-sales';

export const posSalesApi = {
  getAll: async (
    page = 1,
    pageSize = 20,
    filters?: { outletId?: string; startDate?: string; endDate?: string; search?: string },
  ): Promise<PosSaleListResponse> => {
    const params = new URLSearchParams({ page: page.toString(), pageSize: pageSize.toString() });
    if (filters?.outletId) params.append('outletId', filters.outletId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.search) params.append('search', filters.search);

    const response = await api.get<any>(`${BASE_URL}?${params}`);
    const data = response.data.data || response.data;
    return {
      sales: data.Sales || data.sales || [],
      page: data.Page || data.page || page,
      pageSize: data.PageSize || data.pageSize || pageSize,
      totalPages: data.TotalPages || data.totalPages || 1,
      totalCount: data.TotalCount || data.totalCount || 0,
    };
  },

  getById: async (id: string): Promise<PosSale> => {
    const response = await api.get<any>(`${BASE_URL}/${id}`);
    return response.data.data || response.data;
  },

  approve: async (id: string): Promise<PosSale> => {
    const response = await api.post<any>(`${BASE_URL}/${id}/approve`);
    return response.data.data || response.data;
  },

  reject: async (id: string, reason?: string): Promise<PosSale> => {
    const response = await api.post<any>(`${BASE_URL}/${id}/reject`, { reason: reason ?? null });
    return response.data.data || response.data;
  },

  requestCancel: async (id: string, reason: string): Promise<PosSale> => {
    const response = await api.post<any>(`${BASE_URL}/${id}/request-cancel`, { reason });
    return response.data.data || response.data;
  },

  approveCancelRequest: async (queueId: string, reason?: string): Promise<PosSale> => {
    const response = await api.post<any>(`${BASE_URL}/cancel-requests/${queueId}/approve`, {
      reason: reason ?? null,
    });
    return response.data.data || response.data;
  },

  rejectCancelRequest: async (queueId: string, reason: string): Promise<void> => {
    await api.post(`${BASE_URL}/cancel-requests/${queueId}/reject`, { reason });
  },
};
