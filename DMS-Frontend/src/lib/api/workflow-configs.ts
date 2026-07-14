import { apiClient } from './api-client';

export interface WorkflowConfig {
  id: string;
  code: string;
  name: string;
  description?: string;
  entityType: string;
  workflowType: string;
  requiresApproval: boolean;
  approvalLevels: number;
  autoApproveThreshold?: number;
  approvalSteps?: string;
  notificationSettings?: string;
  timeoutHours?: number;
  escalationConfig?: string;
  isEnabled: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateWorkflowConfigDto {
  code: string;
  name: string;
  description?: string;
  entityType: string;
  workflowType: string;
  requiresApproval: boolean;
  approvalLevels: number;
  autoApproveThreshold?: number;
  approvalSteps?: string;
  notificationSettings?: string;
  timeoutHours?: number;
  escalationConfig?: string;
  isEnabled: boolean;
  isActive: boolean;
}

export interface UpdateWorkflowConfigDto extends CreateWorkflowConfigDto {}

export interface WorkflowConfigsResponse {
  workflowConfigs: WorkflowConfig[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function normalize(raw: any): WorkflowConfig {
  const n = (k: string) => raw[k] ?? raw[k.charAt(0).toUpperCase() + k.slice(1)];
  return {
    id: n('id'),
    code: n('code') ?? '',
    name: n('name') ?? '',
    description: n('description'),
    entityType: n('entityType') ?? '',
    workflowType: n('workflowType') ?? 'Approval',
    requiresApproval: n('requiresApproval') ?? true,
    approvalLevels: n('approvalLevels') ?? 1,
    autoApproveThreshold: n('autoApproveThreshold'),
    approvalSteps: n('approvalSteps'),
    notificationSettings: n('notificationSettings'),
    timeoutHours: n('timeoutHours'),
    escalationConfig: n('escalationConfig'),
    isEnabled: n('isEnabled') ?? true,
    isActive: n('isActive') ?? true,
    createdAt: n('createdAt') ?? '',
    updatedAt: n('updatedAt'),
  };
}

export const workflowConfigsApi = {
  async getAll(
    page: number = 1,
    pageSize: number = 10,
    search?: string,
    entityType?: string,
    activeOnly?: boolean
  ): Promise<WorkflowConfigsResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (search) params.append('search', search);
    if (entityType) params.append('entityType', entityType);
    if (activeOnly !== undefined) params.append('activeOnly', activeOnly.toString());

    const response = await apiClient.get<any>(`/api/workflowconfigs?${params}`);
    const raw = response.data?.data ?? response.data;
    const configs: WorkflowConfig[] = (raw?.WorkflowConfigs ?? raw?.workflowConfigs ?? []).map(normalize);
    return {
      workflowConfigs: configs,
      totalCount: raw?.TotalCount ?? raw?.totalCount ?? 0,
      page: raw?.Page ?? raw?.page ?? page,
      pageSize: raw?.PageSize ?? raw?.pageSize ?? pageSize,
      totalPages: raw?.TotalPages ?? raw?.totalPages ?? 1,
    };
  },

  async getById(id: string): Promise<WorkflowConfig> {
    const response = await apiClient.get<any>(`/api/workflowconfigs/${id}`);
    return normalize(response.data?.data ?? response.data);
  },

  async create(data: CreateWorkflowConfigDto): Promise<WorkflowConfig> {
    const response = await apiClient.post<any>('/api/workflowconfigs', data);
    return normalize(response.data?.data ?? response.data);
  },

  async update(id: string, data: UpdateWorkflowConfigDto): Promise<WorkflowConfig> {
    const response = await apiClient.put<any>(`/api/workflowconfigs/${id}`, data);
    return normalize(response.data?.data ?? response.data);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/workflowconfigs/${id}`);
  },
};
