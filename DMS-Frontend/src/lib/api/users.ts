import apiClient from './api-client';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  lastLoginAt?: string;
  roles: RoleInfo[];
  permissions?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RoleInfo {
  id: string;
  name: string;
  description: string;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  password: string;
  isActive: boolean;
  roleIds: string[];
}

export interface UpdateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
}

export interface AssignRolesRequest {
  roleIds: string[];
}

export interface AdminResetPasswordRequest {
  newPassword: string;
}

export interface UserListResponse {
  users: User[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const usersApi = {
  getAll: async (page: number = 1, pageSize: number = 50, search?: string, isActive?: boolean): Promise<UserListResponse> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (search) params.append('search', search);
    if (isActive !== undefined) params.append('isActive', isActive.toString());

    const response = await apiClient.get(`/api/users?${params.toString()}`);
    return response.data.data;
  },

  getById: async (id: string): Promise<User> => {
    const response = await apiClient.get(`/api/users/${id}`);
    return response.data.data;
  },

  create: async (data: CreateUserRequest): Promise<User> => {
    const response = await apiClient.post('/api/users', data);
    return response.data.data;
  },

  update: async (id: string, data: UpdateUserRequest): Promise<User> => {
    const response = await apiClient.put(`/api/users/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/users/${id}`);
  },

  assignRoles: async (id: string, roleIds: string[]): Promise<void> => {
    await apiClient.post(`/api/users/${id}/roles`, { roleIds });
  },

  resetPassword: async (id: string, newPassword: string): Promise<void> => {
    await apiClient.post(`/api/users/${id}/reset-password`, { newPassword });
  },
};
