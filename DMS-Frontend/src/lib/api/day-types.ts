import apiClient from './api-client';

export interface DayType {
  id: string;
  code: string;
  name: string;
  description?: string;
  multiplier: number;
  color?: string;
  isActive: boolean;
  applicableDays: number[]; // 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat
  createdAt: string;
  updatedAt?: string;
}

export interface CreateDayTypeDto {
  code: string;
  name: string;
  description?: string;
  multiplier: number;
  color?: string;
  isActive: boolean;
  applicableDays: number[];
}

export interface UpdateDayTypeDto {
  code: string;
  name: string;
  description?: string;
  multiplier: number;
  color?: string;
  isActive: boolean;
  applicableDays: number[];
}

export interface DayTypesResponse {
  dayTypes: DayType[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function normalizeDayType(raw: any): DayType {
  const n = (k: string) => raw[k] ?? raw[k.charAt(0).toUpperCase() + k.slice(1)];
  const rawDays = n('applicableDays') ?? n('ApplicableDays') ?? [];
  return {
    id: n('id'),
    code: n('code') ?? '',
    name: n('name') ?? '',
    description: n('description'),
    multiplier: n('multiplier') ?? 1,
    color: n('color'),
    isActive: n('isActive') ?? true,
    applicableDays: Array.isArray(rawDays) ? rawDays.map(Number) : [],
    createdAt: n('createdAt') ?? '',
    updatedAt: n('updatedAt'),
  };
}

export const dayTypesApi = {
  async getAll(
    page: number = 1,
    pageSize: number = 50,
    search?: string,
    activeOnly?: boolean
  ): Promise<DayTypesResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (search) params.append('search', search);
    if (activeOnly !== undefined) params.append('activeOnly', activeOnly.toString());

    const response = await apiClient.get<any>(`/api/day-types?${params}`);
    const raw = response.data?.data ?? response.data;
    const items: DayType[] = (raw?.DayTypes ?? raw?.dayTypes ?? []).map(normalizeDayType);
    return {
      dayTypes: items,
      totalCount: raw?.TotalCount ?? raw?.totalCount ?? 0,
      page: raw?.Page ?? raw?.page ?? page,
      pageSize: raw?.PageSize ?? raw?.pageSize ?? pageSize,
      totalPages: raw?.TotalPages ?? raw?.totalPages ?? 1,
    };
  },

  async getById(id: string): Promise<DayType> {
    const response = await apiClient.get<any>(`/api/day-types/${id}`);
    return normalizeDayType(response.data?.data ?? response.data);
  },

  async create(data: CreateDayTypeDto): Promise<DayType> {
    const response = await apiClient.post<any>('/api/day-types', data);
    return normalizeDayType(response.data?.data ?? response.data);
  },

  async update(id: string, data: UpdateDayTypeDto): Promise<DayType> {
    const response = await apiClient.put<any>(`/api/day-types/${id}`, data);
    return normalizeDayType(response.data?.data ?? response.data);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/day-types/${id}`);
  },
};
