import { apiClient } from './api-client';

export interface DashboardPivotCell {
  date: string;
  quantity: number;
  outletCount: number;
  orderCount: number;
}

export interface DashboardPivotRow {
  productId: string;
  productCode: string;
  productName: string;
  dateValues: Record<string, DashboardPivotCell>;
  rowTotal: number;
}

export interface DashboardPivot {
  fromDate: string;
  toDate: string;
  dateColumns: string[];
  rows: DashboardPivotRow[];
  productTotals: Record<string, number>;
}

export const dashboardPivotApi = {
  getDashboardPivot: async (fromDate: string, toDate: string): Promise<DashboardPivot> => {
    const response = await apiClient.get('/api/dashboard-pivot', {
      params: { fromDate, toDate }
    });
    return response.data;
  }
};
