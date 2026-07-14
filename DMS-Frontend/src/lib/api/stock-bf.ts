import api from './api-client';



/** Mirrors backend StockBFStatus after approval workflow */

export type StockBFStatus = 'Draft' | 'Pending' | 'Approved' | 'Rejected' | 'Adjusted' | 'Active';



export interface StockBF {

  id: string;

  bfNo: string;

  bfDate: string;

  outletId: string;

  /** Flat fields from list/detail API */

  outletName?: string;

  outletCode?: string;

  productName?: string;

  outlet?: {

    id: string;

    code: string;

    name: string;

  };

  productId: string;

  product?: {

    id: string;

    code: string;

    name: string;

  };

  quantity: number;

  status: StockBFStatus;

  approvedById?: string;

  approvedByName?: string;

  approvedBy?: {

    id: string;

    username: string;

    fullName: string;

  };

  approvedDate?: string;

  rejectedByName?: string;

  rejectedDate?: string;

  updatedByName?: string;

  createdByName?: string;

  createdAt: string;

  updatedAt: string;

  createdById?: string;

  updatedById?: string;

}

export interface StockBFGroup {
  groupId: string;
  bfDate: string;
  outletId: string;
  outletCode: string;
  outletName: string;
  itemCount: number;
  totalQuantity: number;
  status: StockBFStatus;
  hasMixedStatus: boolean;
  createdByName?: string;
  createdAt: string;
  updatedByName?: string;
  updatedAt: string;
  approvedByName?: string;
  approvedDate?: string;
  rejectedByName?: string;
  rejectedDate?: string;
  items: StockBF[];
}



export interface CreateStockBFDto {

  bfDate: string;

  outletId: string;

  productId: string;

  quantity: number;

}

export interface StockBFItemDto {

  productId: string;

  quantity: number;

}

export interface CreateBulkStockBFDto {

  bfDate: string;

  outletId: string;

  items: StockBFItemDto[];

}



export interface UpdateStockBFDto {

  bfDate: string;

  outletId: string;

  productId: string;

  quantity: number;

}



export interface StockBFListResponse {

  stockBFs: StockBF[];

  page: number;

  pageSize: number;

  totalPages: number;

  totalCount: number;

}

export interface StockBFGroupedResponse {
  groups: StockBFGroup[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
}



const BASE_URL = '/api/stock-bf';



export const stockBfApi = {

  getAll: async (page = 1, pageSize = 10, filters?: {

    /** Backend: fromDate */

    startDate?: string;

    /** Backend: toDate */

    endDate?: string;

    outletId?: string;

    productId?: string;

    status?: string;

    /** Non-admin: include own BF rows older than the last 3 days (matches Show Previous Records). */

    showPreviousRecords?: boolean;

    /** Request grouped view (one row per outlet/date/creation time) */
    grouped?: boolean;

  }) => {

    const params = new URLSearchParams({

      page: page.toString(),

      pageSize: pageSize.toString(),

    });



    if (filters?.startDate) params.append('fromDate', filters.startDate);

    if (filters?.endDate) params.append('toDate', filters.endDate);

    if (filters?.outletId) params.append('outletId', filters.outletId);

    if (filters?.productId) params.append('productId', filters.productId);

    if (filters?.status) params.append('status', filters.status);

    if (filters?.showPreviousRecords === true) params.append('showPreviousRecords', 'true');
    
    if (filters?.grouped === true) params.append('grouped', 'true');



    const response = await api.get<any>(`${BASE_URL}?${params}`);

    const data = response.data.data || response.data;
    
    if (filters?.grouped) {
      return {
        groups: data.Groups || data.groups || [],
        page: data.Page || data.page || page,
        pageSize: data.PageSize || data.pageSize || pageSize,
        totalPages: data.TotalPages || data.totalPages || 1,
        totalCount: data.TotalCount || data.totalCount || 0,
      };
    }

    return {

      stockBFs: data.StockBFs || data.stockBFs || [],

      page: data.Page || data.page || page,

      pageSize: data.PageSize || data.pageSize || pageSize,

      totalPages: data.TotalPages || data.totalPages || 1,

      totalCount: data.TotalCount || data.totalCount || 0,

    };

  },



  getById: async (id: string) => {

    const response = await api.get<any>(`${BASE_URL}/${id}`);

    return response.data?.data ?? response.data;

  },

  getAllByBFNo: async (bfNo: string) => {

    const response = await api.get<any>(`${BASE_URL}/by-bfno/${bfNo}`);

    return response.data?.data ?? response.data;

  },



  create: async (data: CreateStockBFDto) => {

    const response = await api.post<StockBF>(BASE_URL, data);

    return response.data;

  },

  createBulk: async (data: CreateBulkStockBFDto) => {

    const response = await api.post<any>(`${BASE_URL}/bulk`, data);

    return response.data?.data ?? response.data;

  },



  update: async (id: string, data: UpdateStockBFDto) => {

    const response = await api.put<StockBF>(`${BASE_URL}/${id}`, data);

    return response.data;

  },



  delete: async (id: string) => {

    const response = await api.delete(`${BASE_URL}/${id}`);

    return response.data;

  },



  approve: async (id: string) => {

    const response = await api.post<any>(`${BASE_URL}/${id}/approve`);

    return response.data?.data ?? response.data;

  },



  reject: async (id: string) => {

    const response = await api.post<any>(`${BASE_URL}/${id}/reject`);

    return response.data?.data ?? response.data;

  },

  submit: async (id: string) => {

    const response = await api.post<any>(`${BASE_URL}/${id}/submit`);

    return response.data?.data ?? response.data;

  },

};


