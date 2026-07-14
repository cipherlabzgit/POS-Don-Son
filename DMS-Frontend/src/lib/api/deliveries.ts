import api from './api-client';

export interface DeliveryItem {
  id: string;
  productId: string;
  productName: string;
  product?: {
    id: string;
    code: string;
    name: string;
  };
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Delivery {
  id: string;
  deliveryNo: string;
  deliveryDate: string;
  outletId: string;
  outletName: string;
  outlet?: {
    id: string;
    code: string;
    name: string;
  };
  status: 'Draft' | 'Pending' | 'Approved' | 'Rejected';
  totalItems: number;
  totalValue: number;
  notes?: string;
  items?: DeliveryItem[];
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

export interface CreateDeliveryItemDto {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateDeliveryDto {
  deliveryDate: string;
  outletId: string;
  notes?: string;
  items: CreateDeliveryItemDto[];
}

export interface UpdateDeliveryItemDto {
  id?: string;
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface UpdateDeliveryDto {
  deliveryDate: string;
  outletId: string;
  notes?: string;
  items: UpdateDeliveryItemDto[];
}

export interface DeliveryListResponse {
  deliveries: Delivery[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
}

const BASE_URL = '/api/deliveries';

export const deliveriesApi = {
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
    
    // Backend expects fromDate and toDate, not startDate and endDate
    if (filters?.startDate) params.append('fromDate', filters.startDate);
    if (filters?.endDate) params.append('toDate', filters.endDate);
    if (filters?.outletId) params.append('outletId', filters.outletId);
    if (filters?.status) params.append('status', filters.status);
    
    const response = await api.get<any>(`${BASE_URL}?${params}`);
    const data = response.data.data || response.data;
    return {
      deliveries: data.Deliveries || data.deliveries || [],
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

  getByDeliveryNo: async (deliveryNo: string) => {
    const response = await api.get<Delivery>(`${BASE_URL}/by-delivery-no/${deliveryNo}`);
    return response.data;
  },

  create: async (data: CreateDeliveryDto) => {
    const response = await api.post<Delivery>(BASE_URL, data);
    return response.data;
  },

  update: async (id: string, data: UpdateDeliveryDto) => {
    const response = await api.put<Delivery>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  },

  submit: async (id: string) => {
    const response = await api.post<Delivery>(`${BASE_URL}/${id}/submit`);
    return response.data;
  },

  approve: async (id: string) => {
    const response = await api.post<Delivery>(`${BASE_URL}/${id}/approve`);
    return response.data;
  },

  reject: async (id: string) => {
    const response = await api.post<Delivery>(`${BASE_URL}/${id}/reject`);
    return response.data;
  },
};
