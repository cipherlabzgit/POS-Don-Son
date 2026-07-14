import api from './api-client';

export interface Cancellation {
  id: string;
  cancellationNo: string;
  cancellationDate: string;
  deliveryNo: string;
  deliveredDate?: string;
  outletId: string;
  outletName: string;
  outletCode: string;
  outlet?: {
    id: string;
    code: string;
    name: string;
  };
  reason: string;
  status: 'Draft' | 'Pending' | 'Approved' | 'Rejected';
  approvedById?: string;
  approvedBy?: {
    id: string;
    username: string;
    fullName: string;
  };
  approvedByName?: string;
  approvedDate?: string;
  rejectedBy?: {
    id: string;
    username: string;
    fullName: string;
  };
  rejectedByName?: string;
  rejectedDate?: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  updatedById: string;
  updatedByName?: string;
  createdByName?: string;
}

export interface CreateCancellationDto {
  cancellationDate: string;
  deliveryNo: string;
  deliveredDate?: string;
  outletId: string;
  reason: string;
}

export interface UpdateCancellationDto {
  cancellationDate: string;
  deliveryNo: string;
  deliveredDate?: string;
  outletId: string;
  reason: string;
}

export interface CancellationListResponse {
  cancellations: Cancellation[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
}

const BASE_URL = '/api/cancellations';

export const cancellationsApi = {
  getAll: async (page = 1, pageSize = 10, filters?: {
    startDate?: string;
    endDate?: string;
    outletId?: string;
    status?: string;
  }) => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });
    
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.outletId) params.append('outletId', filters.outletId);
    if (filters?.status) params.append('status', filters.status);
    
    const response = await api.get<any>(`${BASE_URL}?${params}`);
    const data = response.data.data || response.data;
    return {
      cancellations: data.Cancellations || data.cancellations || [],
      page: data.Page || data.page || page,
      pageSize: data.PageSize || data.pageSize || pageSize,
      totalPages: data.TotalPages || data.totalPages || 1,
      totalCount: data.TotalCount || data.totalCount || 0,
    };
  },

  getById: async (id: string) => {
    const response = await api.get<Cancellation>(`${BASE_URL}/${id}`);
    return response.data;
  },

  create: async (data: CreateCancellationDto) => {
    const response = await api.post<Cancellation>(BASE_URL, data);
    return response.data;
  },

  update: async (id: string, data: UpdateCancellationDto) => {
    const response = await api.put<Cancellation>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  },

  approve: async (id: string) => {
    const response = await api.post<Cancellation>(`${BASE_URL}/${id}/approve`);
    return response.data;
  },

  reject: async (id: string) => {
    const response = await api.post<Cancellation>(`${BASE_URL}/${id}/reject`);
    return response.data;
  },

  submit: async (id: string) => {
    const response = await api.post<Cancellation>(`${BASE_URL}/${id}/submit`);
    return response.data;
  },
};
