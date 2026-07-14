import api from './api-client';

export interface DisposalItem {
  id: string;
  productId: string;
  productCode?: string;
  productName?: string;
  product?: {
    id: string;
    code: string;
    name: string;
  };
  quantity: number;
  reason: string;
}

export interface Disposal {
  id: string;
  disposalNo: string;
  disposalDate: string;
  outletId: string;
  outletName?: string;
  outlet?: {
    id: string;
    code: string;
    name: string;
  };
  status: 'Draft' | 'Pending' | 'Approved' | 'Rejected';
  totalItems: number;
  notes?: string;
  items?: DisposalItem[];
  approvedById?: string;
  approvedByName?: string;
  approvedBy?: {
    id: string;
    username: string;
    fullName: string;
  };
  approvedDate?: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  createdByName?: string;
  updatedById: string;
}

export interface CreateDisposalItemDto {
  productId: string;
  quantity: number;
  reason: string;
}

export interface CreateDisposalDto {
  disposalDate: string;
  outletId: string;
  notes?: string;
  items: CreateDisposalItemDto[];
}

export interface UpdateDisposalItemDto {
  id?: string;
  productId: string;
  quantity: number;
  reason: string;
}

export interface UpdateDisposalDto {
  disposalDate: string;
  outletId: string;
  notes?: string;
  items: UpdateDisposalItemDto[];
}

export interface DisposalListResponse {
  disposals: Disposal[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
}

const BASE_URL = '/api/disposals';

export const disposalsApi = {
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
      disposals: data.Disposals || data.disposals || [],
      page: data.Page || data.page || page,
      pageSize: data.PageSize || data.pageSize || pageSize,
      totalPages: data.TotalPages || data.totalPages || 1,
      totalCount: data.TotalCount || data.totalCount || 0,
    };
  },

  getById: async (id: string) => {
    const response = await api.get<any>(`${BASE_URL}/${id}`);
    return response.data.data || response.data;
  },

  create: async (data: CreateDisposalDto) => {
    const response = await api.post<Disposal>(BASE_URL, data);
    return response.data;
  },

  update: async (id: string, data: UpdateDisposalDto) => {
    const response = await api.put<Disposal>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  },

  submit: async (id: string) => {
    const response = await api.post<Disposal>(`${BASE_URL}/${id}/submit`);
    return response.data;
  },

  approve: async (id: string) => {
    const response = await api.post<Disposal>(`${BASE_URL}/${id}/approve`);
    return response.data;
  },

  reject: async (id: string) => {
    const response = await api.post<Disposal>(`${BASE_URL}/${id}/reject`);
    return response.data;
  },
};
