import api from './api-client';

export interface LabelPrintData {
  requestId: string;
  displayNo: string;
  labelCount: number;
  productName: string;
  productCode: string;
  barcode: string;
  category: string;
  uom: string;
  price: string;
  mrp: string;
  priceList: string;
  printDate: string;
  startDate: string;
  expiryDate: string;
  expiryDays: number;
  outlet: string;
  companyName: string;
}

export interface LabelPrintRequest {
  id: string;
  displayNo: string;
  date: string;
  productId: string;
  productName: string;
  productCode: string;
  product?: {
    id: string;
    code: string;
    name: string;
    enableLabelPrint: boolean;
    allowFutureLabelPrint: boolean;
  };
  labelCount: number;
  startDate: string;
  expiryDays: number;
  priceOverride?: number;
  status: 'Draft' | 'Pending' | 'Approved' | 'Rejected';
  approvedById?: string;
  approvedBy?: {
    id: string;
    username: string;
    fullName: string;
  };
  approvedByName?: string;
  approvedDate?: string;
  rejectedByName?: string;
  rejectedDate?: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  updatedById: string;
  updatedByName?: string;
}

export interface CreateLabelPrintRequestDto {
  date: string;
  productId: string;
  labelCount: number;
  startDate: string;
  expiryDays: number;
  priceOverride?: number;
}

export interface UpdateLabelPrintRequestDto {
  date: string;
  productId: string;
  labelCount: number;
  startDate: string;
  expiryDays: number;
  priceOverride?: number;
}

export interface LabelPrintRequestListResponse {
  labelPrintRequests: LabelPrintRequest[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
}

const BASE_URL = '/api/label-print-requests';

export const labelPrintingApi = {
  getAll: async (page = 1, pageSize = 10, filters?: {
    startDate?: string;
    endDate?: string;
    productId?: string;
    status?: string;
  }) => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });
    
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.productId) params.append('productId', filters.productId);
    if (filters?.status) params.append('status', filters.status);
    
    const response = await api.get<any>(`${BASE_URL}?${params}`);
    const data = response.data.data || response.data;
    return {
      labelPrintRequests: data.LabelPrintRequests || data.labelPrintRequests || [],
      page: data.Page || data.page || page,
      pageSize: data.PageSize || data.pageSize || pageSize,
      totalPages: data.TotalPages || data.totalPages || 1,
      totalCount: data.TotalCount || data.totalCount || 0,
    };
  },

  getById: async (id: string) => {
    const response = await api.get<LabelPrintRequest>(`${BASE_URL}/${id}`);
    return response.data;
  },

  create: async (data: CreateLabelPrintRequestDto) => {
    const response = await api.post<LabelPrintRequest>(BASE_URL, data);
    return response.data;
  },

  update: async (id: string, data: UpdateLabelPrintRequestDto) => {
    const response = await api.put<LabelPrintRequest>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  },

  approve: async (id: string) => {
    const response = await api.post<LabelPrintRequest>(`${BASE_URL}/${id}/approve`);
    return response.data;
  },

  reject: async (id: string) => {
    const response = await api.post<LabelPrintRequest>(`${BASE_URL}/${id}/reject`);
    return response.data;
  },

  submit: async (id: string) => {
    const response = await api.post<LabelPrintRequest>(`${BASE_URL}/${id}/submit`);
    return response.data;
  },

  generatePrintData: async (requestId: string) => {
    const response = await api.get<LabelPrintData[]>(`/api/labels/print?requestId=${requestId}`);
    return response.data;
  },

  getPrintData: async (id: string): Promise<LabelPrintData> => {
    const response = await api.get<any>(`/api/label-print-requests/${id}/print-data`);
    const raw = response.data?.data ?? response.data;
    return {
      requestId:   raw.requestId   ?? raw.RequestId   ?? '',
      displayNo:   raw.displayNo   ?? raw.DisplayNo   ?? '',
      labelCount:  raw.labelCount  ?? raw.LabelCount  ?? 1,
      productName: raw.productName ?? raw.ProductName ?? '',
      productCode: raw.productCode ?? raw.ProductCode ?? '',
      barcode:     raw.barcode     ?? raw.Barcode     ?? '',
      category:    raw.category    ?? raw.Category    ?? '',
      uom:         raw.uom         ?? raw.Uom         ?? '',
      price:       raw.price       ?? raw.Price       ?? '',
      mrp:         raw.mrp         ?? raw.Mrp         ?? '',
      priceList:   raw.priceList   ?? raw.PriceList   ?? '',
      printDate:   raw.printDate   ?? raw.PrintDate   ?? '',
      startDate:   raw.startDate   ?? raw.StartDate   ?? '',
      expiryDate:  raw.expiryDate  ?? raw.ExpiryDate  ?? '',
      expiryDays:  raw.expiryDays  ?? raw.ExpiryDays  ?? 0,
      outlet:      raw.outlet      ?? raw.Outlet      ?? '',
      companyName: raw.companyName ?? raw.CompanyName ?? '',
    };
  },
};
