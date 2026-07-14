import { apiClient } from './api-client';

export interface StoresIssueNoteItem {
  id: string;
  storesIssueNoteId: string;
  ingredientId: string;
  ingredientCode: string;
  ingredientName: string;
  unit: string;
  productionQty: number;
  extraQty: number;
  totalQty: number;
  notes?: string;
}

export interface StoresIssueNoteDetail {
  id: string;
  issueNoteNo: string;
  productionPlanId: string;
  productionSectionId: string;
  productionSectionName: string;
  issueDate: string;
  status: 'Draft' | 'Issued' | 'Received';
  issuedBy?: string;
  issuedByName?: string;
  receivedBy?: string;
  receivedByName?: string;
  receivedAt?: string;
  createdAt: string;
  updatedAt?: string;
  items: StoresIssueNoteItem[];
}

export interface ComputedIngredient {
  ingredientId: string;
  ingredientCode: string;
  ingredientName: string;
  unit: string;
  productionQty: number;
  extraPercentage: number;
  extraQty: number;
  totalQty: number;
  usedInProducts: string[];
}

export interface ComputeStoresIssueNoteResponse {
  productionPlanId: string;
  productionSectionId: string;
  productionSectionName: string;
  ingredients: ComputedIngredient[];
}

export interface CreateStoresIssueNote {
  productionPlanId: string;
  productionSectionId: string;
  issueDate: string;
  items: {
    ingredientId: string;
    productionQty: number;
    extraQty: number;
    totalQty: number;
    notes?: string;
  }[];
}

export const storesIssueNotesApi = {
  computeStoresIssueNote: async (productionPlanId: string, productionSectionId: string): Promise<ComputeStoresIssueNoteResponse> => {
    const response = await apiClient.post('/api/stores-issue-notes/compute', null, {
      params: { productionPlanId, productionSectionId }
    });
    return response.data;
  },

  createStoresIssueNote: async (data: CreateStoresIssueNote): Promise<StoresIssueNoteDetail> => {
    const response = await apiClient.post('/api/stores-issue-notes', data);
    return response.data;
  },

  getStoresIssueNoteById: async (id: string): Promise<StoresIssueNoteDetail> => {
    const response = await apiClient.get(`/api/stores-issue-notes/${id}`);
    return response.data;
  },

  getBySection: async (planId: string, sectionId: string): Promise<StoresIssueNoteDetail> => {
    const response = await apiClient.get('/api/stores-issue-notes/by-section', {
      params: { planId, sectionId }
    });
    return response.data;
  },

  getAllStoresIssueNotes: async (): Promise<any[]> => {
    const response = await apiClient.get('/api/stores-issue-notes');
    return response.data;
  },

  updateStoresIssueNote: async (id: string, data: any): Promise<StoresIssueNoteDetail> => {
    const response = await apiClient.put(`/api/stores-issue-notes/${id}`, data);
    return response.data;
  },

  deleteStoresIssueNote: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/stores-issue-notes/${id}`);
  },

  issueNote: async (id: string, userId: string): Promise<StoresIssueNoteDetail> => {
    const response = await apiClient.post(`/api/stores-issue-notes/${id}/issue`, { userId });
    return response.data;
  },

  receiveNote: async (id: string, userId: string): Promise<StoresIssueNoteDetail> => {
    const response = await apiClient.post(`/api/stores-issue-notes/${id}/receive`, { userId });
    return response.data;
  }
};
