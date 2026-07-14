import { apiClient } from './api-client';

export interface SalesTrendPoint {
  date: string;
  totalValue: number;
  deliveryCount: number;
}

export interface SalesTrend {
  points: SalesTrendPoint[];
  grandTotal: number;
}

export interface DisposalBySectionItem {
  name: string;
  value: number;
}

export interface DisposalBySection {
  date: string;
  items: DisposalBySectionItem[];
  totalDisposal: number;
}

export interface TopDeliveryOutlet {
  outletCode: string;
  outletName: string;
  deliveryCount: number;
  totalQuantity: number;
}

export interface TopDeliveries {
  date: string;
  outlets: TopDeliveryOutlet[];
}

export interface DeliveryVsDisposalItem {
  category: string;
  deliveryQty: number;
  disposalQty: number;
}

export interface DeliveryVsDisposal {
  fromDate: string;
  toDate: string;
  items: DeliveryVsDisposalItem[];
}

export const dashboardStatsApi = {
  getSalesTrend: async (days = 7): Promise<SalesTrend> => {
    const res = await apiClient.get('/api/dashboard/sales-trend', { params: { days } });
    return res.data.data;
  },

  getDisposalBySection: async (date?: string): Promise<DisposalBySection> => {
    const res = await apiClient.get('/api/dashboard/disposal-by-section', {
      params: date ? { date } : undefined,
    });
    return res.data.data;
  },

  getTopDeliveries: async (date?: string): Promise<TopDeliveries> => {
    const res = await apiClient.get('/api/dashboard/top-deliveries', {
      params: date ? { date } : undefined,
    });
    return res.data.data;
  },

  getDeliveryVsDisposal: async (days = 7): Promise<DeliveryVsDisposal> => {
    const res = await apiClient.get('/api/dashboard/delivery-vs-disposal', { params: { days } });
    return res.data.data;
  },
};
