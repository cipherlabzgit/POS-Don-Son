import api from './api-client';

export interface ProductionCancel {
  id: string;
  cancelNo: string;
  cancelDate: string;
  productionNo: string;
  productId: string;
  product?: {
    id: string;
    code: string;
    name: string;
  };
  cancelledQty: number;
  reason: string;
  status: 'Draft' | 'Pending' | 'Approved' | 'Rejected';
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

export interface CreateProductionCancelDto {
  cancelDate: string;
  productionNo: string;
  productId: string;
  cancelledQty: number;
  reason: string;
}

export interface UpdateProductionCancelDto {
  cancelDate: string;
  productionNo: string;
  productId: string;
  cancelledQty: number;
  reason: string;
}

export interface ProductionCancelListResponse {
  data: ProductionCancel[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
}

const BASE_URL = '/api/production-cancels';

export const productionCancelsApi = {
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
    
    // Debug: Log the response to console
    console.log('Production Cancels API Response:', response.data);
    
    // Handle different response formats from backend
    let result = response.data;
    
    // If response has a 'data' property, use it
    if (result.data !== undefined) {
      result = result.data;
    }
    
    // Extract items array
    let items: any[] = [];
    if (Array.isArray(result)) {
      // Response is directly an array
      items = result;
    } else if (result.cancellations && Array.isArray(result.cancellations)) {
      // Response has cancellations property (production cancels specific)
      items = result.cancellations;
    } else if (result.Data && Array.isArray(result.Data)) {
      // Response has Data property (capital D)
      items = result.Data;
    } else if (result.data && Array.isArray(result.data)) {
      // Response has data property (lowercase d)
      items = result.data;
    } else if (result.productionCancels && Array.isArray(result.productionCancels)) {
      // Response has productionCancels property
      items = result.productionCancels;
    }
    
    console.log('Extracted items:', items);
    
    // Transform items to ensure product object exists
    const transformedItems = items.map((item: any) => {
      // If product object doesn't exist but we have productCode/productName, create it
      if (!item.product && (item.productCode || item.productName)) {
        item.product = {
          id: item.productId,
          code: item.productCode || '',
          name: item.productName || '',
        };
      }
      return item;
    });
    
    return {
      data: transformedItems,
      page: result.page || page,
      pageSize: result.pageSize || pageSize,
      totalPages: result.totalPages || Math.ceil((result.totalCount || transformedItems.length) / pageSize),
      totalCount: result.totalCount || transformedItems.length,
    };
  },

  getById: async (id: string) => {
    const response = await api.get<any>(`${BASE_URL}/${id}`);
    return response.data.data || response.data;
  },

  getByCancelNo: async (cancelNo: string) => {
    const response = await api.get<any>(`${BASE_URL}/by-cancel-no/${cancelNo}`);
    return response.data.data || response.data;
  },

  create: async (data: CreateProductionCancelDto) => {
    const response = await api.post<any>(BASE_URL, data);
    return response.data.data || response.data;
  },

  update: async (id: string, data: UpdateProductionCancelDto) => {
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
};
