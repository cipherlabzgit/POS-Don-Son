import apiClient from './api-client';

export interface Permission {
  id: string;
  code: string;
  name: string;
  module: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
}

export interface PermissionsByModule {
  module: string;
  permissions: Permission[];
}

export const permissionsApi = {
  getAll: async (isActive?: boolean): Promise<Permission[]> => {
    const params = new URLSearchParams();
    if (isActive !== undefined) params.append('isActive', isActive.toString());

    const response = await apiClient.get(`/api/permissions?${params.toString()}`);
    return response.data.data;
  },

  getGroupedByModule: async (isActive?: boolean): Promise<PermissionsByModule[]> => {
    const params = new URLSearchParams();
    if (isActive !== undefined) params.append('isActive', isActive.toString());

    const response = await apiClient.get(`/api/permissions/grouped?${params.toString()}`);
    return response.data.data;
  },
};
