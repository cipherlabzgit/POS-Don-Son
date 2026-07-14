import { apiClient } from './api-client';

export interface AutoApprovalConfig {
  id: string;
  subsectionCode: string;
  subsectionName: string;
  module: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface UpdateAutoApprovalConfigRequest {
  isEnabled: boolean;
}

function normalize(raw: any): AutoApprovalConfig {
  const n = (k: string) => raw[k] ?? raw[k.charAt(0).toUpperCase() + k.slice(1)];
  return {
    id: n('id'),
    subsectionCode: n('subsectionCode') ?? '',
    subsectionName: n('subsectionName') ?? '',
    module: n('module') ?? '',
    isEnabled: n('isEnabled') ?? false,
    createdAt: n('createdAt') ?? '',
    updatedAt: n('updatedAt'),
    updatedBy: n('updatedBy'),
  };
}

export const autoApprovalConfigsApi = {
  async getAll(): Promise<AutoApprovalConfig[]> {
    const response = await apiClient.get<any>('/api/autoapprovalconfigs');
    const raw = response.data?.data ?? response.data;
    return Array.isArray(raw) ? raw.map(normalize) : [];
  },

  async getById(id: string): Promise<AutoApprovalConfig> {
    const response = await apiClient.get<any>(`/api/autoapprovalconfigs/${id}`);
    return normalize(response.data?.data ?? response.data);
  },

  async update(id: string, isEnabled: boolean): Promise<AutoApprovalConfig> {
    const response = await apiClient.put<any>(
      `/api/autoapprovalconfigs/${id}`,
      { isEnabled } as UpdateAutoApprovalConfigRequest
    );
    return normalize(response.data?.data ?? response.data);
  },
};
