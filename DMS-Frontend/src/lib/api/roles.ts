import apiClient from './api-client';

export interface Role {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  permissionCount?: number;
  permissions?: PermissionInfo[];
  createdAt: string;
  updatedAt: string;
}

export interface PermissionInfo {
  id: string;
  code: string;
  module: string;
  description: string;
}

export interface CreateRoleRequest {
  name: string;
  description: string;
  isActive: boolean;
  permissionIds: string[];
}

export interface UpdateRoleRequest {
  name: string;
  description: string;
  isActive: boolean;
}

export interface AssignPermissionsRequest {
  permissionIds: string[];
}

export interface RoleListResponse {
  roles: Role[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const rolesApi = {
  getAll: async (page: number = 1, pageSize: number = 50, search?: string, isActive?: boolean): Promise<RoleListResponse> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (search) params.append('search', search);
    if (isActive !== undefined) params.append('isActive', isActive.toString());

    const response = await apiClient.get(`/api/roles?${params.toString()}`);
    return response.data.data;
  },

  getById: async (id: string): Promise<Role> => {
    const response = await apiClient.get(`/api/roles/${id}`);
    return response.data.data;
  },

  create: async (data: CreateRoleRequest): Promise<Role> => {
    const response = await apiClient.post('/api/roles', data);
    return response.data.data;
  },

  update: async (id: string, data: UpdateRoleRequest): Promise<Role> => {
    const response = await apiClient.put(`/api/roles/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/roles/${id}`);
  },

  assignPermissions: async (id: string, permissionIds: string[]): Promise<void> => {
    await apiClient.post(`/api/roles/${id}/permissions`, { permissionIds });
  },
};
