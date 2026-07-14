import apiClient from './api-client';

export interface Approval {
  id: string;
  approvalType: string;
  entityId: string;
  entityReference?: string;
  requestedById: string;
  requestedByName: string;
  requestedByEmail?: string;
  requestedAt: string;
  status: string;
  approvedById?: string;
  approvedByName?: string;
  approvedByEmail?: string;
  approvedAt?: string;
  rejectionReason?: string;
  requestData?: string;
  priority: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  /** StockAdjustment pending rows: adjustment document date (ISO). */
  adjustmentDate?: string;
  /** StockAdjustment pending rows: entity `UpdatedAt` (ISO). */
  entityUpdatedAt?: string;
  /** StockAdjustment pending rows: last editor display name. */
  entityUpdatedByName?: string;
}

export interface CreateApprovalDto {
  approvalType: string;
  entityId: string;
  entityReference?: string;
  requestedById: string;
  requestData?: string;
  priority: number;
  notes?: string;
  isActive: boolean;
}

export interface ApproveApprovalDto {
  notes?: string;
}

export interface RejectApprovalDto {
  rejectionReason: string;
  notes?: string;
}

export interface ApprovalsResponse {
  approvals: Approval[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function parseApprovalsListPayload(responseData: unknown): ApprovalsResponse {
  const root = responseData as { data?: Record<string, unknown> } | Record<string, unknown> | undefined;
  const body =
    root && typeof root === 'object' && 'data' in root && root.data != null && typeof root.data === 'object'
      ? (root.data as Record<string, unknown>)
      : (root as Record<string, unknown>) ?? {};
  const rawList = body.approvals ?? body.Approvals ?? [];
  const list = Array.isArray(rawList) ? rawList : [];
  return {
    approvals: list as Approval[],
    totalCount: Number(body.totalCount ?? body.TotalCount ?? 0),
    page: Number(body.page ?? body.Page ?? 1),
    pageSize: Number(body.pageSize ?? body.PageSize ?? 50),
    totalPages: Number(body.totalPages ?? body.TotalPages ?? 1),
  };
}

export const approvalsApi = {
  async getPending(
    page: number = 1,
    pageSize: number = 50,
    approvalType?: string
  ): Promise<ApprovalsResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (approvalType) params.append('approvalType', approvalType);

    const response = await apiClient.get<unknown>(`/api/approvals/pending?${params}`);
    return parseApprovalsListPayload(response.data);
  },

  async getAll(
    page: number = 1,
    pageSize: number = 50,
    approvalType?: string,
    status?: string
  ): Promise<ApprovalsResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (approvalType) params.append('approvalType', approvalType);
    if (status) params.append('status', status);

    const response = await apiClient.get<unknown>(`/api/approvals?${params}`);
    return parseApprovalsListPayload(response.data);
  },

  async getById(id: string): Promise<Approval> {
    const response = await apiClient.get<unknown>(`/api/approvals/${id}`);
    const root = response.data as { data?: Approval } | undefined;
    const inner = root && typeof root === 'object' && 'data' in root ? root.data : undefined;
    if (!inner) {
      throw new Error('Invalid approval response');
    }
    return inner as Approval;
  },

  async approve(id: string, data: ApproveApprovalDto): Promise<Approval> {
    const response = await apiClient.post<unknown>(`/api/approvals/${id}/approve`, data);
    const root = response.data as { data?: Approval } | undefined;
    const inner = root && typeof root === 'object' && 'data' in root ? root.data : undefined;
    if (!inner) {
      throw new Error('Invalid approval response');
    }
    return inner as Approval;
  },

  async reject(id: string, data: RejectApprovalDto): Promise<Approval> {
    const response = await apiClient.post<unknown>(`/api/approvals/${id}/reject`, data);
    const root = response.data as { data?: Approval } | undefined;
    const inner = root && typeof root === 'object' && 'data' in root ? root.data : undefined;
    if (!inner) {
      throw new Error('Invalid approval response');
    }
    return inner as Approval;
  },
};
