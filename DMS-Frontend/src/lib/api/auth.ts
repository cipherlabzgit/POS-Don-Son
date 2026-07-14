import apiClient from './api-client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isSuperAdmin: boolean;
  isActive: boolean;
  roles: Role[];
  permissions: string[];
  /** Set when the user is linked to a showroom via outlet employees (manager/staff). */
  assignedOutletId?: string;
  assignedOutletName?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/api/auth/login', credentials);
    return response.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/api/auth/logout', { refreshToken });
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/api/auth/me');
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    const response = await apiClient.post<RefreshTokenResponse>('/api/auth/refresh', { refreshToken });
    return response.data;
  },

  changePassword: async (request: ChangePasswordRequest): Promise<{ message: string }> => {
    const response = await apiClient.post('/api/auth/change-password', request);
    return response.data;
  },

  forgotPassword: async (request: ForgotPasswordRequest): Promise<{ message: string }> => {
    const response = await apiClient.post('/api/auth/forgot-password', request);
    return response.data;
  },

  resetPassword: async (request: ResetPasswordRequest): Promise<{ message: string }> => {
    const response = await apiClient.post('/api/auth/reset-password', request);
    return response.data;
  },
};
