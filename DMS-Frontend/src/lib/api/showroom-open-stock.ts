import api from './api-client';

export interface ShowroomOpenStock {
  id: string;
  outletId: string;
  outletCode: string;
  outletName: string;
  /** Latest approved/adjusted Stock BF date — null when none yet */
  stockAsAt?: string | null;
  bfLineCount?: number | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt: string;
  createdById?: string;
  updatedById?: string;
}

export interface CreateShowroomOpenStockDto {
  outletId: string;
  stockAsAt: string;
}

export interface UpdateShowroomOpenStockDto {
  stockAsAt: string;
}

const BASE_URL = '/api/showroom-open-stocks';

export const showroomOpenStockApi = {
  getAll: async () => {
    const response = await api.get<any>(BASE_URL);
    const data = response.data.data || response.data;
    return Array.isArray(data) ? data : [];
  },

  getById: async (id: string) => {
    const response = await api.get<any>(`${BASE_URL}/${id}`);
    return response.data.data || response.data;
  },

  getByOutletId: async (outletId: string) => {
    const response = await api.get<any>(`${BASE_URL}/by-outlet/${outletId}`);
    return response.data.data || response.data;
  },

  create: async (data: CreateShowroomOpenStockDto) => {
    const response = await api.post<any>(BASE_URL, data);
    return response.data.data || response.data;
  },

  update: async (id: string, data: UpdateShowroomOpenStockDto) => {
    const response = await api.put<any>(`${BASE_URL}/${id}`, data);
    return response.data.data || response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<any>(`${BASE_URL}/${id}`);
    return response.data.data || response.data;
  },
};
