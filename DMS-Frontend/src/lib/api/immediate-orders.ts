import apiClient from './api-client';

export interface ImmediateOrder {
  id: string;
  orderNo: string;
  orderBillNo?: string;
  outletId: string;
  outletName: string;
  productId: string;
  productName: string;
  deliveryTurnId: string;
  deliveryTurnName: string;
  orderDate: string;
  needByDate?: string;
  needByTime?: string;
  deliveryDate?: string;
  deliveryTime?: string;
  productionStartingDate?: string;
  productionStartingTime?: string;
  recipeRequestNumber?: string;
  fullQuantity: number;
  miniQuantity: number;
  quantity: number;
  status: string;
  requestedBy: string;
  requestedAt: string;
  reason?: string;
  isCustomized?: boolean;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  notes?: string;
}

export interface ImmediateOrderList {
  id: string;
  orderNo: string;
  orderBillNo?: string;
  outletId?: string;
  outletName: string;
  productName: string;
  deliveryTurnName: string;
  orderDate: string;
  needByDate?: string;
  needByTime?: string;
  deliveryDate?: string;
  deliveryTime?: string;
  productionStartingDate?: string;
  productionStartingTime?: string;
  recipeRequestNumber?: string;
  fullQuantity: number;
  miniQuantity: number;
  quantity: number;
  status: string;
  requestedAt: string;
  requestedBy: string;
  isCustomized?: boolean;
}

/** Matches backend CreateImmediateOrderDto — Anytime Order Request / POS parity */
export interface CreateImmediateOrderDto {
  orderBillNo: string;
  orderDate: string;
  needByDate: string;
  needByTime: string;
  deliveryDate: string;
  deliveryTime: string;
  productionStartingDate: string;
  productionStartingTime: string;
  recipeRequestNumber: string;
  deliveryTurnId: string;
  outletId: string;
  productId: string;
  fullQuantity: number;
  miniQuantity: number;
  requestedBy: string;
  reason: string;
  isCustomized: boolean;
  customizationNotes?: string;
}

export interface UpdateImmediateOrderDto {
  orderBillNo: string;
  orderDate: string;
  needByDate: string;
  needByTime: string;
  deliveryDate: string;
  deliveryTime: string;
  productionStartingDate: string;
  productionStartingTime: string;
  recipeRequestNumber: string;
  deliveryTurnId: string;
  outletId: string;
  productId: string;
  fullQuantity: number;
  miniQuantity: number;
  requestedBy: string;
  reason: string;
  isCustomized: boolean;
  customizationNotes?: string;
}

export interface ImmediateOrdersResponse {
  immediateOrders: ImmediateOrderList[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function normalizeImmediateOrder(raw: any): ImmediateOrder {
  const n = (k: string) => raw[k] ?? raw[k.charAt(0).toUpperCase() + k.slice(1)];
  const full = Number(n('fullQuantity') ?? 0);
  const mini = Number(n('miniQuantity') ?? 0);
  return {
    id: n('id'),
    orderNo: n('orderNo') ?? '',
    orderBillNo: n('orderBillNo'),
    outletId: n('outletId') ?? '',
    outletName: n('outletName') ?? '',
    productId: n('productId') ?? '',
    productName: n('productName') ?? '',
    deliveryTurnId: n('deliveryTurnId') ?? '',
    deliveryTurnName: n('deliveryTurnName') ?? '',
    orderDate: n('orderDate') ?? '',
    needByDate: n('needByDate'),
    needByTime: n('needByTime'),
    deliveryDate: n('deliveryDate'),
    deliveryTime: n('deliveryTime'),
    productionStartingDate: n('productionStartingDate'),
    productionStartingTime: n('productionStartingTime'),
    recipeRequestNumber: n('recipeRequestNumber'),
    fullQuantity: full,
    miniQuantity: mini,
    quantity: full + mini,
    status: n('status') ?? 'Pending',
    requestedBy: n('requestedBy') ?? '',
    requestedAt: n('createdAt') ?? n('requestedAt') ?? '',
    reason: n('reason'),
    isCustomized: n('isCustomized'),
    approvedBy: n('approvedBy'),
    approvedAt: n('approvedAt'),
    rejectedBy: n('rejectedBy'),
    rejectedAt: n('rejectedAt'),
    rejectionReason: n('rejectionReason'),
    notes: n('customizationNotes') ?? n('notes'),
  };
}

export const immediateOrdersApi = {
  async getAll(
    page: number = 1,
    pageSize: number = 50,
    fromDate?: string,
    toDate?: string,
    status?: string,
    outletId?: string,
    deliveryTurnId?: string
  ): Promise<ImmediateOrdersResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    if (status) params.append('status', status);
    if (outletId) params.append('outletId', outletId);
    if (deliveryTurnId) params.append('deliveryTurnId', deliveryTurnId);

    const response = await apiClient.get<any>(`/api/immediate-orders?${params}`);
    const raw = response.data?.data ?? response.data;
    const items = (raw?.ImmediateOrders ?? raw?.immediateOrders ?? []).map((row: any) => {
      const o = normalizeImmediateOrder(row);
      return {
        ...o,
        quantity: o.quantity,
      } as ImmediateOrderList;
    });
    return {
      immediateOrders: items,
      totalCount: raw?.TotalCount ?? raw?.totalCount ?? 0,
      page: raw?.Page ?? raw?.page ?? page,
      pageSize: raw?.PageSize ?? raw?.pageSize ?? pageSize,
      totalPages: raw?.TotalPages ?? raw?.totalPages ?? 1,
    };
  },

  async getByDateAndTurn(date: string, turnId: string): Promise<ImmediateOrderList[]> {
    const params = new URLSearchParams();
    params.append('date', date);
    params.append('turnId', turnId);

    const response = await apiClient.get<any>(`/api/immediate-orders/by-date-turn?${params}`);
    const raw = response.data?.data ?? response.data;
    return Array.isArray(raw)
      ? raw.map((row: any) => normalizeImmediateOrder(row) as unknown as ImmediateOrderList)
      : [];
  },

  async getById(id: string): Promise<ImmediateOrder> {
    const response = await apiClient.get<any>(`/api/immediate-orders/${id}`);
    return normalizeImmediateOrder(response.data?.data ?? response.data);
  },

  async create(data: CreateImmediateOrderDto): Promise<ImmediateOrder> {
    const response = await apiClient.post<any>('/api/immediate-orders', data);
    return normalizeImmediateOrder(response.data?.data ?? response.data);
  },

  async update(id: string, data: UpdateImmediateOrderDto): Promise<ImmediateOrder> {
    const response = await apiClient.put<any>(`/api/immediate-orders/${id}`, data);
    return normalizeImmediateOrder(response.data?.data ?? response.data);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/immediate-orders/${id}`);
  },

  async submit(id: string): Promise<ImmediateOrder> {
    const response = await apiClient.post<any>(`/api/immediate-orders/${id}/submit`);
    return normalizeImmediateOrder(response.data?.data ?? response.data);
  },

  async approve(id: string): Promise<ImmediateOrder> {
    const response = await apiClient.post<any>(`/api/immediate-orders/${id}/approve`);
    return normalizeImmediateOrder(response.data?.data ?? response.data);
  },

  async reject(id: string, reason: string): Promise<ImmediateOrder> {
    const response = await apiClient.post<any>(`/api/immediate-orders/${id}/reject`, { reason });
    return normalizeImmediateOrder(response.data?.data ?? response.data);
  },
};
