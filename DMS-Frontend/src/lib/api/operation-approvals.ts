import api from './api-client';

export interface OperationApprovalItem {
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

export interface OperationApprovalsSummary {
  deliveries: OperationApprovalItem[];
  transfers: OperationApprovalItem[];
  disposals: OperationApprovalItem[];
  cancellations: OperationApprovalItem[];
  labelPrintRequests: OperationApprovalItem[];
  stockBFs: OperationApprovalItem[];
  deliveryReturns: OperationApprovalItem[];
  posSales: OperationApprovalItem[];
  posCancellationRequests: OperationApprovalItem[];
  showroomLabelRequests: OperationApprovalItem[];
  dailyProductions: OperationApprovalItem[];
  productionCancels: OperationApprovalItem[];
  stockAdjustments: OperationApprovalItem[];
  dailyProductionPlans: OperationApprovalItem[];
  immediateOrders: OperationApprovalItem[];
  adminApprovals: OperationApprovalItem[];
  totalPendingCount: number;
}

const BASE_URL = '/api/operation-approvals';
const SHOWROOM_LABEL_URL = '/api/showroom-label-requests';

export const operationApprovalsApi = {
  approveShowroomLabel: async (id: string) => {
    const response = await api.post(`${SHOWROOM_LABEL_URL}/${id}/approve`);
    return response.data;
  },
  rejectShowroomLabel: async (id: string) => {
    const response = await api.post(`${SHOWROOM_LABEL_URL}/${id}/reject`);
    return response.data;
  },
  getPending: async () => {
    const response = await api.get<any>(`${BASE_URL}/pending`);
    const raw = response.data.data || response.data;
    return {
      deliveries: raw.deliveries ?? raw.Deliveries ?? [],
      transfers: raw.transfers ?? raw.Transfers ?? [],
      disposals: raw.disposals ?? raw.Disposals ?? [],
      cancellations: raw.cancellations ?? raw.Cancellations ?? [],
      labelPrintRequests: raw.labelPrintRequests ?? raw.LabelPrintRequests ?? [],
      stockBFs: raw.stockBFs ?? raw.StockBFs ?? [],
      deliveryReturns: raw.deliveryReturns ?? raw.DeliveryReturns ?? [],
      posSales: raw.posSales ?? raw.PosSales ?? [],
      posCancellationRequests: raw.posCancellationRequests ?? raw.PosCancellationRequests ?? [],
      showroomLabelRequests: raw.showroomLabelRequests ?? raw.ShowroomLabelRequests ?? [],
      dailyProductions: raw.dailyProductions ?? raw.DailyProductions ?? [],
      productionCancels: raw.productionCancels ?? raw.ProductionCancels ?? [],
      stockAdjustments: raw.stockAdjustments ?? raw.StockAdjustments ?? [],
      dailyProductionPlans: raw.dailyProductionPlans ?? raw.DailyProductionPlans ?? [],
      immediateOrders: raw.immediateOrders ?? raw.ImmediateOrders ?? [],
      adminApprovals: raw.adminApprovals ?? raw.AdminApprovals ?? [],
      totalPendingCount: raw.totalPendingCount ?? raw.TotalPendingCount ?? 0,
    } as OperationApprovalsSummary;
  },
};
