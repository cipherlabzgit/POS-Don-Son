import { apiClient } from './api-client';

export interface ProductionAdjustment {
  id: string;
  productionPlanItemId: string;
  adjustmentQty: number;
  reason?: string;
  adjustedBy: string;
  adjustedByName: string;
  adjustedAt: string;
}

export interface ProductionPlanItem {
  id: string;
  productionPlanId: string;
  productionSectionId: string;
  productionSectionName: string;
  productId: string;
  productCode: string;
  productName: string;
  regularFullQty: number;
  regularMiniQty: number;
  customizedFullQty: number;
  customizedMiniQty: number;
  freezerStock: number;
  produceQty: number;
  isExcluded: boolean;
  adjustments: ProductionAdjustment[];
}

export interface ProductionPlanDetail {
  id: string;
  deliveryPlanId: string;
  computedDate: string;
  status: 'Draft' | 'Finalized' | 'InProduction' | 'Completed';
  useFreezerStock: boolean;
  totalProducts: number;
  totalQuantity: number;
  createdAt: string;
  updatedAt?: string;
  items: ProductionPlanItem[];
}

export interface ComputedProductionItem {
  productionSectionId: string;
  productionSectionName: string;
  productId: string;
  productCode: string;
  productName: string;
  regularFullQty: number;
  regularMiniQty: number;
  customizedFullQty: number;
  customizedMiniQty: number;
  totalRequiredQty: number;
  freezerStock: number;
  produceQty: number;
}

export interface ComputeProductionPlanResponse {
  deliveryPlanId: string;
  useFreezerStock: boolean;
  items: ComputedProductionItem[];
  totalProducts: number;
  totalQuantity: number;
}

export interface CreateProductionPlan {
  deliveryPlanId: string;
  useFreezerStock: boolean;
  items: {
    productionSectionId: string;
    productId: string;
    regularFullQty: number;
    regularMiniQty: number;
    customizedFullQty: number;
    customizedMiniQty: number;
    freezerStock: number;
    produceQty: number;
    isExcluded: boolean;
  }[];
}

export interface CreateProductionAdjustment {
  productionPlanItemId: string;
  adjustmentQty: number;
  reason?: string;
  adjustedBy: string;
}

export const productionPlannerApi = {
  computeProductionPlan: async (deliveryPlanId: string, useFreezerStock: boolean): Promise<ComputeProductionPlanResponse> => {
    const response = await apiClient.post('/api/production-planners/compute', null, {
      params: { deliveryPlanId, useFreezerStock }
    });
    return response.data;
  },

  createProductionPlan: async (data: CreateProductionPlan): Promise<ProductionPlanDetail> => {
    const response = await apiClient.post('/api/production-planners', data);
    return response.data;
  },

  getProductionPlanById: async (id: string): Promise<ProductionPlanDetail> => {
    const response = await apiClient.get(`/api/production-planners/${id}`);
    return response.data;
  },

  getProductionPlanByDeliveryPlanId: async (deliveryPlanId: string): Promise<ProductionPlanDetail> => {
    const response = await apiClient.get(`/api/production-planners/by-delivery-plan/${deliveryPlanId}`);
    return response.data;
  },

  getAllProductionPlans: async (): Promise<any[]> => {
    const response = await apiClient.get('/api/production-planners');
    return response.data;
  },

  updateProductionPlan: async (id: string, data: any): Promise<ProductionPlanDetail> => {
    const response = await apiClient.put(`/api/production-planners/${id}`, data);
    return response.data;
  },

  deleteProductionPlan: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/production-planners/${id}`);
  },

  applyAdjustment: async (data: CreateProductionAdjustment): Promise<ProductionAdjustment> => {
    const response = await apiClient.post('/api/production-planners/adjustments', data);
    return response.data;
  }
};
