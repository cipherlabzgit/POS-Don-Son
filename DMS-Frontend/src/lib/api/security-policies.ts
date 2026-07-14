import { apiClient } from './api-client';

export interface SecurityPolicy {
  id: string;
  policyKey: string;
  policyName: string;
  description?: string;
  category: string;
  policyValue?: string;
  valueType: string;
  isEnforced: boolean;
  isSystemPolicy: boolean;
  severityLevel?: string;
  lastReviewedAt?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateSecurityPolicyDto {
  policyKey: string;
  policyName: string;
  description?: string;
  category: string;
  policyValue?: string;
  valueType: string;
  isEnforced: boolean;
  isSystemPolicy: boolean;
  severityLevel?: string;
  lastReviewedAt?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface UpdateSecurityPolicyDto extends CreateSecurityPolicyDto {}

export interface SecurityPoliciesResponse {
  securityPolicies: SecurityPolicy[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const securityPoliciesApi = {
  async getAll(
    page: number = 1,
    pageSize: number = 50,
    search?: string,
    category?: string,
    activeOnly?: boolean
  ): Promise<SecurityPoliciesResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    if (activeOnly !== undefined) params.append('activeOnly', activeOnly.toString());

    const response = await apiClient.get<SecurityPoliciesResponse>(`/securitypolicies?${params}`);
    return response.data.data;
  },

  async getById(id: string): Promise<SecurityPolicy> {
    const response = await apiClient.get<SecurityPolicy>(`/securitypolicies/${id}`);
    return response.data.data;
  },

  async create(data: CreateSecurityPolicyDto): Promise<SecurityPolicy> {
    const response = await apiClient.post<SecurityPolicy>('/securitypolicies', data);
    return response.data.data;
  },

  async update(id: string, data: UpdateSecurityPolicyDto): Promise<SecurityPolicy> {
    const response = await apiClient.put<SecurityPolicy>(`/securitypolicies/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/securitypolicies/${id}`);
  },
};
