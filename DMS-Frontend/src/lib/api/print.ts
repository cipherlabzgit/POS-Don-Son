import { apiClient } from './api-client';

export interface ReceiptCardProduct {
  productId: string;
  productCode: string;
  productName: string;
  fullQty: number;
  miniQty: number;
  isCustomized: boolean;
  customizationNotes?: string;
}

export interface PrintReceiptCard {
  deliveryPlanId: string;
  deliveryDate: string;
  turnName: string;
  outletId: string;
  outletCode: string;
  outletName: string;
  outletAddress: string;
  contactPerson: string;
  contactPhone: string;
  products: ReceiptCardProduct[];
  totalQuantity: number;
  printedAt: string;
}

export interface SectionBundleIngredient {
  ingredientId: string;
  ingredientCode: string;
  ingredientName: string;
  quantity: number;
  unit: string;
}

export interface SectionBundleProduct {
  productId: string;
  productCode: string;
  productName: string;
  produceQty: number;
  hasRecipe: boolean;
  ingredients: SectionBundleIngredient[];
}

export interface SectionPrintBundle {
  productionPlanId: string;
  productionDate: string;
  productionSectionId: string;
  productionSectionName: string;
  products: SectionBundleProduct[];
  totalQuantity: number;
  printedAt: string;
}

export const printApi = {
  getReceiptCard: async (deliveryPlanId: string, outletId: string): Promise<PrintReceiptCard> => {
    const response = await apiClient.get('/api/print/receipt-cards', {
      params: { deliveryPlanId, outletId }
    });
    return response.data;
  },

  getSectionBundle: async (productionPlanId: string, sectionId: string): Promise<SectionPrintBundle> => {
    const response = await apiClient.get('/api/print/section-bundle', {
      params: { productionPlanId, sectionId }
    });
    return response.data;
  }
};
