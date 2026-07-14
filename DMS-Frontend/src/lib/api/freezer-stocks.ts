import apiClient, { type ApiEnvelope } from './api-client';

export interface FreezerStock {
  id: string;
  productId: string;
  productName: string;
  productionSectionId: string;
  productionSectionName: string;
  currentStock: number;
  lastAdjustedBy?: string;
  lastAdjustedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface FreezerStockHistory {
  id: string;
  freezerStockId: string;
  productName: string;
  productionSectionName: string;
  transactionType: string;
  previousStock: number;
  adjustmentQuantity: number;
  newStock: number;
  reason?: string;
  referenceId?: string;
  referenceType?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export interface AdjustFreezerStockDto {
  productId: string;
  productionSectionId: string;
  adjustmentQuantity: number;
  reason?: string;
}

export interface FreezerStocksResponse {
  freezerStocks: FreezerStock[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const freezerStocksApi = {
  async getAll(
    page: number = 1,
    pageSize: number = 100,
    productId?: string,
    productionSectionId?: string
  ): Promise<FreezerStocksResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (productId) params.append('productId', productId);
    if (productionSectionId) params.append('productionSectionId', productionSectionId);

    const response = await apiClient.get<ApiEnvelope<FreezerStocksResponse>>(
      `/api/freezer-stocks?${params}`
    );
    return response.data.data;
  },

  async getById(id: string): Promise<FreezerStock> {
    const response = await apiClient.get<ApiEnvelope<FreezerStock>>(
      `/api/freezer-stocks/${id}`
    );
    return response.data.data;
  },

  async getCurrentStock(productId: string, productionSectionId: string): Promise<FreezerStock> {
    const params = new URLSearchParams();
    params.append('productId', productId);
    params.append('productionSectionId', productionSectionId);

    const response = await apiClient.get<ApiEnvelope<FreezerStock>>(
      `/api/freezer-stocks/current?${params}`
    );
    return response.data.data;
  },

  async adjustStock(data: AdjustFreezerStockDto): Promise<FreezerStock> {
    const response = await apiClient.post<ApiEnvelope<FreezerStock>>(
      '/api/freezer-stocks/adjust',
      {
        productId: data.productId,
        productionSectionId: data.productionSectionId,
        quantity: data.adjustmentQuantity,
        transactionType: 'Adjustment',
        reason: (data.reason ?? '').trim() || 'Manual freezer stock adjustment',
      }
    );
    return response.data.data;
  },

  async getHistory(
    productId: string,
    productionSectionId: string,
    fromDate?: string,
    toDate?: string
  ): Promise<FreezerStockHistory[]> {
    const params = new URLSearchParams();
    params.append('productId', productId);
    params.append('productionSectionId', productionSectionId);
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);

    const response = await apiClient.get<ApiEnvelope<FreezerStockHistory[]>>(
      `/api/freezer-stocks/history?${params}`
    );
    return response.data.data;
  },
};
