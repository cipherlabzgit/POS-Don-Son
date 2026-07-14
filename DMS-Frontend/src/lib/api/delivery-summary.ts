import { apiClient } from './api-client';

export interface DeliveryProductSummary {
  productId: string;
  productCode: string;
  productName: string;
  regularFullQty: number;
  regularMiniQty: number;
  customizedFullQty: number;
  customizedMiniQty: number;
  totalQty: number;
}

export interface DeliveryOutletSummary {
  outletId: string;
  outletCode: string;
  outletName: string;
  products: DeliveryProductSummary[];
}

export interface DeliveryProductTotal {
  productId: string;
  productCode: string;
  productName: string;
  totalRegularFull: number;
  totalRegularMini: number;
  totalCustomizedFull: number;
  totalCustomizedMini: number;
  grandTotal: number;
}

export interface DeliverySummary {
  deliveryDate: string;
  turnId: number;
  turnName: string;
  outlets: DeliveryOutletSummary[];
  productTotals: DeliveryProductTotal[];
}

export const deliverySummaryApi = {
  getDeliverySummary: async (date: string, turnId: number): Promise<DeliverySummary> => {
    const response = await apiClient.get('/api/delivery-summary', {
      params: { date, turnId }
    });
    return response.data;
  }
};
