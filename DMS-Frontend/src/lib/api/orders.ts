import apiClient, { type ApiEnvelope } from './api-client';

export interface OrderItem {
  id: string;
  orderHeaderId: string;
  outletId: string;
  outletName: string;
  productId: string;
  productName: string;
  deliveryTurnId: string;
  deliveryTurnName: string;
  fullQuantity: number;
  miniQuantity: number;
  totalQuantity: number;
  isExtraItem: boolean;
}

export interface Order {
  id: string;
  orderNo: string;
  orderDate: string;
  deliveryDate: string;
  deliveryTime: string;
  productionStartingDate: string;
  productionStartingTime: string;
  recipeRequestNumber?: string;
  dayTypeId: string;
  dayTypeName: string;
  deliveryPlanId?: string;
  deliveryPlanNo?: string;
  status: string;
  useFreezerStock: boolean;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  items: OrderItem[];
  isCustomOrder?: boolean;
}

export interface OrderList {
  id: string;
  orderNo: string;
  orderDate: string;
  deliveryDate: string;
  deliveryTime: string;
  productionStartingDate: string;
  productionStartingTime: string;
  recipeRequestNumber?: string;
  dayTypeName: string;
  deliveryPlanNo?: string;
  status: string;
  totalItems: number;
  totalQuantity: number;
  createdAt: string;
  /** Off-plan order (no delivery plan). */
  isCustomOrder?: boolean;
}

export interface CreateOrderDto {
  orderNo: string;
  orderDate: string;
  deliveryDate: string;
  deliveryTime: string;
  productionStartingDate: string;
  productionStartingTime: string;
  recipeRequestNumber?: string;
  dayTypeId: string;
  deliveryPlanId?: string;
  useFreezerStock: boolean;
  notes?: string;
}

export interface UpdateOrderDto {
  orderNo: string;
  orderDate: string;
  deliveryDate: string;
  deliveryTime: string;
  productionStartingDate: string;
  productionStartingTime: string;
  recipeRequestNumber?: string;
  dayTypeId: string;
  deliveryPlanId?: string;
  useFreezerStock: boolean;
  notes?: string;
}

export interface BulkUpsertOrderItemDto {
  id?: string;
  outletId: string;
  productId: string;
  deliveryTurnId: string;
  fullQuantity: number;
  miniQuantity: number;
  isExtraItem: boolean;
}

export interface OrdersResponse {
  orders: OrderList[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const ordersApi = {
  async getAll(
    page: number = 1,
    pageSize: number = 50,
    fromDate?: string,
    toDate?: string,
    status?: string,
    deliveryPlanId?: string,
    customOrdersOnly?: boolean
  ): Promise<OrdersResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    if (status) params.append('status', status);
    if (deliveryPlanId) params.append('deliveryPlanId', deliveryPlanId);
    if (customOrdersOnly) params.append('customOrdersOnly', 'true');

    const response = await apiClient.get<ApiEnvelope<OrdersResponse>>(
      `/api/orders?${params}`
    );
    return response.data.data;
  },

  async getById(id: string): Promise<Order> {
    const response = await apiClient.get<ApiEnvelope<Order>>(`/api/orders/${id}`);
    return response.data.data;
  },

  async getByOrderNo(orderNo: string): Promise<Order> {
    const response = await apiClient.get<ApiEnvelope<Order>>(
      `/api/orders/by-order-no/${orderNo}`
    );
    return response.data.data;
  },

  async getByDateAndTurn(date: string, turnId: string): Promise<OrderList[]> {
    const params = new URLSearchParams();
    params.append('date', date);
    params.append('turnId', turnId);

    const response = await apiClient.get<ApiEnvelope<OrderList[]>>(
      `/api/orders/by-date-turn?${params}`
    );
    return response.data.data;
  },

  async create(data: CreateOrderDto): Promise<Order> {
    const response = await apiClient.post<ApiEnvelope<Order>>('/api/orders', data);
    return response.data.data;
  },

  async update(id: string, data: UpdateOrderDto): Promise<Order> {
    const response = await apiClient.put<ApiEnvelope<Order>>(`/api/orders/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/orders/${id}`);
  },

  async submit(id: string): Promise<Order> {
    const response = await apiClient.post<ApiEnvelope<Order>>(`/api/orders/${id}/submit`);
    return response.data.data;
  },

  async bulkUpsertItems(orderId: string, items: BulkUpsertOrderItemDto[]): Promise<OrderItem[]> {
    const response = await apiClient.post<ApiEnvelope<OrderItem[]>>(
      `/api/orders/${orderId}/items/bulk-upsert`,
      items
    );
    return response.data.data;
  },
};
