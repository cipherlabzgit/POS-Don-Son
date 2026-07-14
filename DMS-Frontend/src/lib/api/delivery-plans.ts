import apiClient, { type ApiEnvelope } from './api-client';

export interface DeliveryPlanItem {
  id: string;
  deliveryPlanId: string;
  outletId: string;
  outletName: string;
  productId: string;
  productName: string;
  deliveryTurnId: string;
  deliveryTurnName: string;
  fullQuantity: number;
  miniQuantity: number;
  extraQuantity: number;
  isExcluded: boolean;
  notes?: string;
}

export interface DeliveryPlan {
  id: string;
  planNo: string;
  planDate: string;
  dayTypeId: string;
  dayTypeName: string;
  deliveryTurnId: string;
  deliveryTurnName: string;
  status: string;
  useFreezerStock: boolean;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
  items: DeliveryPlanItem[];
}

export interface DeliveryPlanList {
  id: string;
  planNo: string;
  planDate: string;
  dayTypeName: string;
  deliveryTurnName: string;
  status: string;
  totalItems: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateDeliveryPlanDto {
  planDate: string;
  dayTypeId: string;
  deliveryTurnId: string;
  useFreezerStock: boolean;
  notes?: string;
}

export interface UpdateDeliveryPlanDto {
  planDate: string;
  dayTypeId: string;
  deliveryTurnId: string;
  useFreezerStock: boolean;
  notes?: string;
}

export interface BulkUpsertDeliveryPlanItemDto {
  id?: string;
  outletId: string;
  productId: string;
  deliveryTurnId: string;
  fullQuantity: number;
  miniQuantity: number;
  extraQuantity?: number;
  isExcluded: boolean;
  notes?: string;
}

export interface DeliveryTurnOption {
  id: string;
  name: string;
  deliveryTimeDisplay: string;
}

/** Allowed SL dates + 5:00 AM preload turns only (matches backend rules). */
export interface DeliveryPlanningWindow {
  allowedPlanDates: string[];
  minPlanDate: string;
  maxPlanDate: string;
  availableDeliveryTurns: DeliveryTurnOption[];
}

export interface DeliveryPlansResponse {
  deliveryPlans: DeliveryPlanList[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}


export const deliveryPlansApi = {
  async getPlanningWindow(): Promise<DeliveryPlanningWindow> {
    const response = await apiClient.get<ApiEnvelope<DeliveryPlanningWindow>>(
      '/api/delivery-plans/planning-window'
    );
    return response.data.data;
  },

  async getAll(
    page: number = 1,
    pageSize: number = 50,
    fromDate?: string,
    toDate?: string,
    status?: string,
    deliveryTurnId?: string
  ): Promise<DeliveryPlansResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    if (status) params.append('status', status);
    if (deliveryTurnId) params.append('deliveryTurnId', deliveryTurnId);

    const response = await apiClient.get<ApiEnvelope<DeliveryPlansResponse>>(
      `/api/delivery-plans?${params}`
    );
    return response.data.data;
  },

  async getById(id: string): Promise<DeliveryPlan> {
    const response = await apiClient.get<ApiEnvelope<DeliveryPlan>>(
      `/api/delivery-plans/${id}`
    );
    return response.data.data;
  },

  async getByPlanNo(planNo: string): Promise<DeliveryPlan> {
    const response = await apiClient.get<ApiEnvelope<DeliveryPlan>>(
      `/api/delivery-plans/by-plan-no/${planNo}`
    );
    return response.data.data;
  },

  async create(data: CreateDeliveryPlanDto): Promise<DeliveryPlan> {
    const response = await apiClient.post<ApiEnvelope<DeliveryPlan>>(
      '/api/delivery-plans',
      data
    );
    return response.data.data;
  },

  async update(id: string, data: UpdateDeliveryPlanDto): Promise<DeliveryPlan> {
    const response = await apiClient.put<ApiEnvelope<DeliveryPlan>>(
      `/api/delivery-plans/${id}`,
      data
    );
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/delivery-plans/${id}`);
  },

  async submit(id: string): Promise<DeliveryPlan> {
    const response = await apiClient.post<ApiEnvelope<DeliveryPlan>>(
      `/api/delivery-plans/${id}/submit`
    );
    return response.data.data;
  },

  async bulkUpsertItems(
    planId: string,
    items: BulkUpsertDeliveryPlanItemDto[]
  ): Promise<DeliveryPlanItem[]> {
    const response = await apiClient.post<ApiEnvelope<DeliveryPlanItem[]>>(
      `/api/delivery-plans/${planId}/items/bulk-upsert`,
      items
    );
    return response.data.data;
  },
};
