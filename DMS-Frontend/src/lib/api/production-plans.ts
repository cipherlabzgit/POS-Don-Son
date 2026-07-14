import api from './api-client';

export interface ProductionPlan {
  id: string;
  planNo: string;
  planDate: string;
  productId: string;
  product?: {
    id: string;
    code: string;
    name: string;
  };
  plannedQty: number;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Draft' | 'PendingApproval' | 'Approved' | 'InProgress' | 'Completed';
  reference?: string;
  comment?: string;
  notes?: string;
  approvedById?: string;
  approvedByName?: string;
  approvedBy?: {
    id: string;
    username: string;
    fullName: string;
  };
  approvedDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  createdByName?: string;
  updatedById?: string;
  updatedByName?: string;
}

export interface CreateProductionPlanDto {
  planDate: string;
  productId: string;
  plannedQty: number;
  priority: 'Low' | 'Medium' | 'High';
  reference?: string;
  comment?: string;
  notes?: string;
}

export interface UpdateProductionPlanDto {
  planDate: string;
  productId: string;
  plannedQty: number;
  priority: 'Low' | 'Medium' | 'High';
  reference?: string;
  comment?: string;
  notes?: string;
}

export interface ProductionPlanListResponse {
  data: ProductionPlan[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
}

const BASE_URL = '/api/production-plans';

function pick<T>(obj: Record<string, unknown>, camel: string, pascal: string): T | undefined {
  const v = obj[camel] ?? obj[pascal];
  return v as T | undefined;
}

function normalizePlan(raw: Record<string, unknown>): ProductionPlan {
  const id = String(pick<string>(raw, 'id', 'Id') ?? '');
  const productId = String(pick<string>(raw, 'productId', 'ProductId') ?? '');
  const productCode = pick<string>(raw, 'productCode', 'ProductCode');
  const productName = pick<string>(raw, 'productName', 'ProductName');
  const nested = raw.product ?? raw.Product;
  const nestedObj =
    nested && typeof nested === 'object' && !Array.isArray(nested) ? (nested as Record<string, unknown>) : null;

  return {
    id,
    planNo: String(pick<string>(raw, 'planNo', 'PlanNo') ?? ''),
    planDate: String(pick<string>(raw, 'planDate', 'PlanDate') ?? ''),
    productId,
    product:
      nestedObj != null
        ? {
            id: String(nestedObj.id ?? nestedObj.Id ?? productId),
            code: String(nestedObj.code ?? nestedObj.Code ?? productCode ?? ''),
            name: String(nestedObj.name ?? nestedObj.Name ?? productName ?? ''),
          }
        : productId
          ? {
              id: productId,
              code: productCode ?? '',
              name: productName ?? '',
            }
          : undefined,
    plannedQty: Number(pick(raw, 'plannedQty', 'PlannedQty') ?? 0),
    priority: (pick<string>(raw, 'priority', 'Priority') ?? 'Medium') as ProductionPlan['priority'],
    status: (pick<string>(raw, 'status', 'Status') ?? 'Draft') as ProductionPlan['status'],
    reference: pick<string>(raw, 'reference', 'Reference'),
    comment: pick<string>(raw, 'comment', 'Comment'),
    notes: pick<string>(raw, 'notes', 'Notes'),
    approvedById: pick<string>(raw, 'approvedById', 'ApprovedById'),
    approvedByName: pick<string>(raw, 'approvedByName', 'ApprovedByName'),
    approvedDate: pick<string>(raw, 'approvedDate', 'ApprovedDate'),
    isActive: Boolean(pick(raw, 'isActive', 'IsActive') ?? true),
    createdAt: String(pick<string>(raw, 'createdAt', 'CreatedAt') ?? ''),
    updatedAt: String(pick<string>(raw, 'updatedAt', 'UpdatedAt') ?? ''),
    createdById: String(pick<string>(raw, 'createdById', 'CreatedById') ?? ''),
    createdByName: pick<string>(raw, 'createdByName', 'CreatedByName'),
    updatedById: pick<string>(raw, 'updatedById', 'UpdatedById'),
    updatedByName: pick<string>(raw, 'updatedByName', 'UpdatedByName'),
  };
}

function parseListResponse(responseData: unknown): ProductionPlanListResponse {
  const root = responseData as { data?: Record<string, unknown> } | Record<string, unknown> | undefined;
  const body =
    root && typeof root === 'object' && 'data' in root && root.data != null && typeof root.data === 'object'
      ? (root.data as Record<string, unknown>)
      : (root as Record<string, unknown>) ?? {};
  const rawList = body.plans ?? body.Plans ?? body.data ?? body.Data ?? [];
  const items: unknown[] = Array.isArray(rawList) ? rawList : [];
  const normalized = items.map((row) => normalizePlan(row as Record<string, unknown>));
  return {
    data: normalized,
    page: Number(body.page ?? body.Page ?? 1),
    pageSize: Number(body.pageSize ?? body.PageSize ?? 10),
    totalPages: Number(body.totalPages ?? body.TotalPages ?? 1),
    totalCount: Number(body.totalCount ?? body.TotalCount ?? 0),
  };
}

function unwrapEnvelopePayload(response: { data: unknown }): Record<string, unknown> {
  const envelope = response.data as { data?: Record<string, unknown> } | undefined;
  const inner = envelope?.data;
  if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
    return inner as Record<string, unknown>;
  }
  return {};
}

export const productionPlansApi = {
  getAll: async (
    page = 1,
    pageSize = 10,
    filters?: {
      fromDate?: string;
      toDate?: string;
      productId?: string;
      status?: string;
      priority?: string;
    }
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    if (filters?.fromDate) params.append('fromDate', filters.fromDate);
    if (filters?.toDate) params.append('toDate', filters.toDate);
    if (filters?.productId) params.append('productId', filters.productId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);

    const response = await api.get<unknown>(`${BASE_URL}?${params}`);
    return parseListResponse(response.data);
  },

  getById: async (id: string) => {
    const response = await api.get<unknown>(`${BASE_URL}/${id}`);
    const raw = unwrapEnvelopePayload(response as { data: unknown });
    return normalizePlan(raw);
  },

  getByPlanNo: async (planNo: string) => {
    const response = await api.get<unknown>(`${BASE_URL}/by-plan-no/${encodeURIComponent(planNo)}`);
    const raw = unwrapEnvelopePayload(response as { data: unknown });
    return normalizePlan(raw);
  },

  create: async (data: CreateProductionPlanDto) => {
    const response = await api.post<unknown>(BASE_URL, data);
    const raw = unwrapEnvelopePayload(response as { data: unknown });
    return normalizePlan(raw);
  },

  update: async (id: string, data: UpdateProductionPlanDto) => {
    const response = await api.put<unknown>(`${BASE_URL}/${id}`, data);
    const raw = unwrapEnvelopePayload(response as { data: unknown });
    return normalizePlan(raw);
  },

  delete: async (id: string) => {
    const response = await api.delete<unknown>(`${BASE_URL}/${id}`);
    return unwrapEnvelopePayload(response as { data: unknown });
  },

  submit: async (id: string) => {
    const response = await api.post<unknown>(`${BASE_URL}/${id}/submit`);
    const raw = unwrapEnvelopePayload(response as { data: unknown });
    return normalizePlan(raw);
  },

  approve: async (id: string) => {
    const response = await api.post<unknown>(`${BASE_URL}/${id}/approve`);
    const raw = unwrapEnvelopePayload(response as { data: unknown });
    return normalizePlan(raw);
  },

  start: async (id: string) => {
    const response = await api.post<unknown>(`${BASE_URL}/${id}/start`);
    const raw = unwrapEnvelopePayload(response as { data: unknown });
    return normalizePlan(raw);
  },

  complete: async (id: string) => {
    const response = await api.post<unknown>(`${BASE_URL}/${id}/complete`);
    const raw = unwrapEnvelopePayload(response as { data: unknown });
    return normalizePlan(raw);
  },
};
