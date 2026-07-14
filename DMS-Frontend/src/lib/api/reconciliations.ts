import { apiClient } from './api-client';

export interface ReconciliationItem {
  id: string;
  reconciliationId: string;
  productId: string;
  productCode: string;
  productName: string;
  expectedQty: number;
  actualQty: number;
  varianceQty: number;
  varianceType: 'Match' | 'Shortage' | 'Excess';
  reason?: string;
}

export interface ReconciliationDetail {
  id: string;
  reconciliationNo: string;
  reconciliationDate: string;
  deliveryPlanId: string;
  deliveryPlanName: string;
  outletId: string;
  outletCode: string;
  outletName: string;
  status: 'InProgress' | 'Submitted' | 'Approved';
  submittedBy?: string;
  submittedByName?: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt?: string;
  items: ReconciliationItem[];
}

export interface CreateReconciliation {
  reconciliationDate: string;
  deliveryPlanId: string;
  outletId: string;
}

export interface UpdateActualQuantities {
  items: {
    itemId: string;
    actualQty: number;
    reason?: string;
  }[];
}

export const reconciliationsApi = {
  createReconciliation: async (data: CreateReconciliation): Promise<ReconciliationDetail> => {
    const response = await apiClient.post('/api/reconciliations', data);
    return response.data;
  },

  getReconciliationById: async (id: string): Promise<ReconciliationDetail> => {
    const response = await apiClient.get(`/api/reconciliations/${id}`);
    return response.data;
  },

  getByOutlet: async (planId: string, outletId: string): Promise<ReconciliationDetail> => {
    const response = await apiClient.get('/api/reconciliations/by-outlet', {
      params: { planId, outletId }
    });
    return response.data;
  },

  getAllReconciliations: async (): Promise<any[]> => {
    const response = await apiClient.get('/api/reconciliations');
    return response.data;
  },

  updateReconciliation: async (id: string, data: any): Promise<ReconciliationDetail> => {
    const response = await apiClient.put(`/api/reconciliations/${id}`, data);
    return response.data;
  },

  deleteReconciliation: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/reconciliations/${id}`);
  },

  updateActualQuantities: async (id: string, data: UpdateActualQuantities): Promise<ReconciliationDetail> => {
    const response = await apiClient.put(`/api/reconciliations/${id}/actual-quantities`, data);
    return response.data;
  },

  submitReconciliation: async (id: string, submittedBy: string): Promise<ReconciliationDetail> => {
    const response = await apiClient.post(`/api/reconciliations/${id}/submit`, { submittedBy });
    return response.data;
  }
};
