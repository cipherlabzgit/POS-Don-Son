import api from './api-client';

export interface DeliveryReturnItem {
  id: string;
  productId: string;
  product: {
    id: string;
    code: string;
    name: string;
  };
  quantity: number;
}

export interface DeliveryReturn {
  id: string;
  returnNo: string;
  returnDate: string;
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
  reason?: string;
  status: 'Draft' | 'Pending' | 'Approved' | 'Processed';
  totalItems: number;
  items?: DeliveryReturnItem[];
  approvedById?: string;
  approvedBy?: {
    id: string;
    username: string;
    fullName: string;
  };
  approvedByName?: string;
  approvedDate?: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  createdByName?: string;
  updatedById: string;
  updatedByName?: string;
}

export interface CreateDeliveryReturnItemDto {
  productId: string;
  quantity: number;
}

export interface CreateDeliveryReturnDto {
  returnDate: string;
  deliveryNo: string;
  deliveredDate?: string;
  outletId: string;
  reason: string;
  items: CreateDeliveryReturnItemDto[];
}

export interface UpdateDeliveryReturnItemDto {
  id?: string;
  productId: string;
  quantity: number;
}

export interface UpdateDeliveryReturnDto {
  returnDate: string;
  deliveryNo: string;
  deliveredDate?: string;
  outletId: string;
  reason: string;
  items: UpdateDeliveryReturnItemDto[];
}

export interface DeliveryReturnListResponse {
  deliveryReturns: DeliveryReturn[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
}

const BASE_URL = '/api/delivery-returns';

export const deliveryReturnsApi = {
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
      deliveryReturns: data.DeliveryReturns || data.deliveryReturns || [],
      page: data.Page || data.page || page,
      pageSize: data.PageSize || data.pageSize || pageSize,
      totalPages: data.TotalPages || data.totalPages || 1,
      totalCount: data.TotalCount || data.totalCount || 0,
    };
  },

  getById: async (id: string) => {
    const response = await api.get<any>(`${BASE_URL}/${id}`);
    return (response.data?.data ?? response.data) as DeliveryReturn;
  },

  create: async (data: CreateDeliveryReturnDto) => {
    const response = await api.post<DeliveryReturn>(BASE_URL, data);
    return response.data;
  },

  update: async (id: string, data: UpdateDeliveryReturnDto) => {
    const response = await api.put<DeliveryReturn>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  },

  submit: async (id: string) => {
    const response = await api.post<DeliveryReturn>(`${BASE_URL}/${id}/submit`);
    return response.data;
  },

  approve: async (id: string) => {
    const response = await api.post<DeliveryReturn>(`${BASE_URL}/${id}/approve`);
    return response.data;
  },

  reject: async (id: string) => {
    const response = await api.post<DeliveryReturn>(`${BASE_URL}/${id}/reject`);
    return response.data;
  },
};
