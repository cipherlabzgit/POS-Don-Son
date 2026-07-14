import api, { type ApiEnvelope } from './api-client';

export interface ProductionApprovalItem {
  id: string;
  approvalType: string;
  referenceNo: string;
  requestDate: string;
  outletName: string;
  status: string;
  requestedByName?: string;
  description?: string;
  totalValue?: number;
  itemCount?: number;
}

export interface ProductionApprovalsSummary {
  dailyProductions: ProductionApprovalItem[];
  productionCancels: ProductionApprovalItem[];
  stockAdjustments: ProductionApprovalItem[];
  dailyProductionPlans: ProductionApprovalItem[];
  totalPendingCount: number;
}

const BASE_URL = '/api/production-approvals';

function normalizeSummary(raw: Record<string, unknown>): ProductionApprovalsSummary {
  const num = (v: unknown) => (typeof v === 'number' ? v : 0);
  const arr = (v: unknown): ProductionApprovalItem[] => (Array.isArray(v) ? (v as ProductionApprovalItem[]) : []);

  return {
    dailyProductions: arr(raw.dailyProductions ?? raw.DailyProductions),
    productionCancels: arr(raw.productionCancels ?? raw.ProductionCancels),
    stockAdjustments: arr(raw.stockAdjustments ?? raw.StockAdjustments),
    dailyProductionPlans: arr(raw.dailyProductionPlans ?? raw.DailyProductionPlans),
    totalPendingCount: num(raw.totalPendingCount ?? raw.TotalPendingCount),
  };
}

export const productionApprovalsApi = {
  getPending: async (): Promise<ProductionApprovalsSummary> => {
    const response = await api.get<ApiEnvelope<Record<string, unknown>>>(`${BASE_URL}/pending`);
    return normalizeSummary(response.data.data ?? {});
  },
};
