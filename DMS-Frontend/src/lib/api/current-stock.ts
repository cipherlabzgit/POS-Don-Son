import api from './api-client';

export interface CurrentStock {
  productId: string;
  product?: {
    id: string;
    code: string;
    name: string;
  };
  productCode: string;
  productName: string;
  openBalance: number;
  todayProduction: number;
  todayProductionCancelled: number;
  todayDelivery: number;
  deliveryCancelled: number;
  deliveryReturned: number;
  stockAdjustment: number;
  todayBalance: number;
}

const BASE_URL = '/api/current-stock';

export const currentStockApi = {
  getAll: async (forDate?: string) => {
    const params = new URLSearchParams();
    if (forDate) params.append('forDate', forDate);
    
    const response = await api.get<any>(`${BASE_URL}${forDate ? '?' + params : ''}`);
    const data = response.data.data || response.data;
    return Array.isArray(data) ? data : [];
  },

  getByProduct: async (productId: string, forDate?: string) => {
    const params = new URLSearchParams();
    if (forDate) params.append('forDate', forDate);
    
    const response = await api.get<any>(`${BASE_URL}/${productId}${forDate ? '?' + params : ''}`);
    return response.data.data || response.data;
  },
};
