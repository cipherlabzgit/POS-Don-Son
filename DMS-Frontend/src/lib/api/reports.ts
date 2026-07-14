import api from './api-client';

export interface ReportRequest {
  reportType: string;
  fromDate: string;
  toDate: string;
  outletId?: string;
  productId?: string;
  categoryId?: string;
}

export interface DeliveryReportRow {
  deliveryNo: string;
  deliveryDate: string;
  outletName: string;
  status: string;
  totalItems: number;
  totalValue: number;
  createdByName?: string;
  approvedByName?: string;
}

export interface DisposalReportRow {
  disposalNo: string;
  disposalDate: string;
  outletName: string;
  status: string;
  totalItems: number;
  createdByName?: string;
  approvedByName?: string;
}

export interface SalesReportRow {
  saleNo: string;
  soldAt: string;
  outletName: string;
  paymentMethod: string;
  status: string;
  totalAmount: number;
  cashierName?: string;
}

export interface InventoryReportRow {
  productCode: string;
  productName: string;
  categoryName: string;
  currentStock: number;
  sectionName: string;
}

export interface ProductWiseReportRow {
  productCode: string;
  productName: string;
  categoryName: string;
  totalDelivered: number;
  totalDisposed: number;
  totalSold: number;
  totalValue: number;
}

export interface ShowroomWiseReportRow {
  outletCode: string;
  outletName: string;
  totalDeliveries: number;
  totalDeliveryValue: number;
  totalDisposals: number;
  totalSalesAmount: number;
}

export interface CategoryWiseReportRow {
  categoryName: string;
  totalDelivered: number;
  totalDisposed: number;
  totalValue: number;
}

export interface DailySummaryRow {
  date: string;
  totalDeliveries: number;
  totalDeliveryValue: number;
  totalDisposals: number;
  totalSalesAmount: number;
}

export interface MonthlySummaryRow {
  year: number;
  month: number;
  monthName: string;
  totalDeliveries: number;
  totalDeliveryValue: number;
  totalDisposals: number;
  totalSalesAmount: number;
}

export interface ReportResponse<T> {
  reportType: string;
  fromDate: string;
  toDate: string;
  generatedAt: string;
  totalRows: number;
  data: T[];
}

function normalize<T>(raw: any): ReportResponse<T> {
  return {
    reportType: raw.reportType ?? raw.ReportType ?? '',
    fromDate: raw.fromDate ?? raw.FromDate ?? '',
    toDate: raw.toDate ?? raw.ToDate ?? '',
    generatedAt: raw.generatedAt ?? raw.GeneratedAt ?? '',
    totalRows: raw.totalRows ?? raw.TotalRows ?? 0,
    data: (raw.data ?? raw.Data ?? []).map((row: any) => {
      const normalized: any = {};
      Object.keys(row).forEach((key) => {
        const camel = key.charAt(0).toLowerCase() + key.slice(1);
        normalized[camel] = row[key];
      });
      return normalized as T;
    }),
  };
}

async function post<T>(endpoint: string, request: ReportRequest): Promise<ReportResponse<T>> {
  const response = await api.post<any>(`/api/reports/${endpoint}`, {
    fromDate: request.fromDate,
    toDate: request.toDate,
    outletId: request.outletId ?? null,
    productId: request.productId ?? null,
    categoryId: request.categoryId ?? null,
  });
  const raw = response.data?.data ?? response.data;
  return normalize<T>(raw);
}

export const reportsApi = {
  getDeliveryReport: (req: ReportRequest) => post<DeliveryReportRow>('delivery', req),
  getDisposalReport: (req: ReportRequest) => post<DisposalReportRow>('disposal', req),
  getSalesReport: (req: ReportRequest) => post<SalesReportRow>('sales', req),
  getInventoryReport: (req: ReportRequest) => post<InventoryReportRow>('inventory', req),
  getProductWiseReport: (req: ReportRequest) => post<ProductWiseReportRow>('product-wise', req),
  getShowroomWiseReport: (req: ReportRequest) => post<ShowroomWiseReportRow>('showroom-wise', req),
  getCategoryWiseReport: (req: ReportRequest) => post<CategoryWiseReportRow>('category-wise', req),
  getDailySummaryReport: (req: ReportRequest) => post<DailySummaryRow>('daily-summary', req),
  getMonthlySummaryReport: (req: ReportRequest) => post<MonthlySummaryRow>('monthly-summary', req),
};
