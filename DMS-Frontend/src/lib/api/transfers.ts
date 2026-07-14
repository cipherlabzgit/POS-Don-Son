import api from './api-client';

export interface TransferItem {
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
}

export interface Transfer {
  id: string;
  transferNo: string;
  transferDate: string;
  fromOutletId: string;
  fromOutletName?: string;
  fromOutlet?: {
    id: string;
    code: string;
    name: string;
  };
  toOutletId: string;
  toOutletName?: string;
  toOutlet?: {
    id: string;
    code: string;
    name: string;
  };
  status: 'Draft' | 'Pending' | 'Approved' | 'Rejected';
  totalItems: number;
  notes?: string;
  items?: TransferItem[];
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

export interface CreateTransferItemDto {
  productId: string;
  quantity: number;
}

export interface CreateTransferDto {
  transferDate: string;
  fromOutletId: string;
  toOutletId: string;
  notes?: string;
  items: CreateTransferItemDto[];
}

export interface UpdateTransferItemDto {
  id?: string;
  productId: string;
  quantity: number;
}

export interface UpdateTransferDto {
  transferDate: string;
  fromOutletId: string;
  toOutletId: string;
  notes?: string;
  items: UpdateTransferItemDto[];
}

export interface TransferListResponse {
  transfers: Transfer[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
}

const BASE_URL = '/api/transfers';

export const transfersApi = {
  getAll: async (page = 1, pageSize = 10, filters?: {
    startDate?: string;
    endDate?: string;
    fromOutletId?: string;
    toOutletId?: string;
    status?: string;
  }) => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });
    
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.fromOutletId) params.append('fromOutletId', filters.fromOutletId);
    if (filters?.toOutletId) params.append('toOutletId', filters.toOutletId);
    if (filters?.status) params.append('status', filters.status);
    
    const response = await api.get<any>(`${BASE_URL}?${params}`);
    const data = response.data.data || response.data;
    return {
      transfers: data.Transfers || data.transfers || [],
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

  create: async (data: CreateTransferDto) => {
    const response = await api.post<Transfer>(BASE_URL, data);
    return response.data;
  },

  update: async (id: string, data: UpdateTransferDto) => {
    const response = await api.put<Transfer>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  },

  submit: async (id: string) => {
    const response = await api.post<Transfer>(`${BASE_URL}/${id}/submit`);
    return response.data;
  },

  approve: async (id: string) => {
    const response = await api.post<Transfer>(`${BASE_URL}/${id}/approve`);
    return response.data;
  },

  reject: async (id: string) => {
    const response = await api.post<Transfer>(`${BASE_URL}/${id}/reject`);
    return response.data;
  },
};
