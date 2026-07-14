import api from './api-client';

export interface Shift {
  id: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShiftDto {
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface UpdateShiftDto {
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
}

export const shiftsApi = {
  getAll: async (includeInactive = false): Promise<Shift[]> => {
    const { data } = await api.get<Shift[]>('/api/shifts', {
      params: { includeInactive },
    });
    return data;
  },

  getActive: async (): Promise<Shift[]> => {
    const { data } = await api.get<Shift[]>('/api/shifts/active');
    return data;
  },

  getById: async (id: string): Promise<Shift> => {
    const { data } = await api.get<Shift>(`/api/shifts/${id}`);
    return data;
  },

  create: async (dto: CreateShiftDto): Promise<Shift> => {
    const { data } = await api.post<Shift>('/api/shifts', dto);
    return data;
  },

  update: async (id: string, dto: UpdateShiftDto): Promise<Shift> => {
    const { data } = await api.put<Shift>(`/api/shifts/${id}`, dto);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/shifts/${id}`);
  },
};
