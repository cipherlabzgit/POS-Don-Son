import apiClient from './api-client';

export interface DeliveryTurnSectionTiming {
  id?: string;
  productionSectionId: string;
  productionSectionName?: string;
  productionStartTime: string; // HH:mm format
  productionStartTimeFormatted?: string;
  effectiveDeliveryTime: string; // HH:mm format
  effectiveDeliveryTimeFormatted?: string;
  productionDayOffset: number; // -1 = previous day, 0 = same day
  deliveryDayOffset: number; // -1 = previous day, 0 = same day
}

export interface DeliveryTurn {
  id: string;
  code: string;
  name: string;
  description?: string;
  time: string;
  timeFormatted: string;
  displayOrder: number;
  isActive: boolean;
  sectionTimings?: DeliveryTurnSectionTiming[];
  sectionTimingsCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateDeliveryTurnDto {
  code: string;
  name: string;
  description?: string;
  time: string;
  displayOrder: number;
  isActive: boolean;
  sectionTimings?: DeliveryTurnSectionTiming[];
}

export interface UpdateDeliveryTurnDto {
  code: string;
  name: string;
  description?: string;
  time: string;
  displayOrder: number;
  isActive: boolean;
  sectionTimings?: DeliveryTurnSectionTiming[];
}

export interface DeliveryTurnsResponse {
  deliveryTurns: DeliveryTurn[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function toHHmm(value: string | undefined | null): string {
  if (!value) return '';
  // Trim seconds from TimeSpan strings like "08:00:00" → "08:00"
  return value.length > 5 ? value.substring(0, 5) : value;
}

function normalizeSectionTiming(raw: any): DeliveryTurnSectionTiming {
  const n = (k: string) => raw[k] ?? raw[k.charAt(0).toUpperCase() + k.slice(1)];
  return {
    id: n('id'),
    productionSectionId: n('productionSectionId') ?? '',
    productionSectionName: n('productionSectionName'),
    productionStartTime: toHHmm(n('productionStartTimeFormatted') ?? n('productionStartTime')) ?? '',
    productionStartTimeFormatted: n('productionStartTimeFormatted'),
    effectiveDeliveryTime: toHHmm(n('effectiveDeliveryTimeFormatted') ?? n('effectiveDeliveryTime')) ?? '',
    effectiveDeliveryTimeFormatted: n('effectiveDeliveryTimeFormatted'),
    productionDayOffset: n('productionDayOffset') ?? 0,
    deliveryDayOffset: n('deliveryDayOffset') ?? 0,
  };
}

function normalizeDeliveryTurn(raw: any): DeliveryTurn {
  const n = (k: string) => raw[k] ?? raw[k.charAt(0).toUpperCase() + k.slice(1)];
  const sectionTimings = n('sectionTimings') ?? n('SectionTimings') ?? [];
  return {
    id: n('id'),
    code: n('code') ?? '',
    name: n('name') ?? '',
    description: n('description'),
    time: n('time') ?? '',
    timeFormatted: n('timeFormatted') ?? '',
    displayOrder: n('displayOrder') ?? 0,
    isActive: n('isActive') ?? true,
    sectionTimings: Array.isArray(sectionTimings) ? sectionTimings.map(normalizeSectionTiming) : [],
    sectionTimingsCount: n('sectionTimingsCount') ?? (Array.isArray(sectionTimings) ? sectionTimings.length : 0),
    createdAt: n('createdAt') ?? '',
    updatedAt: n('updatedAt'),
  };
}

export const deliveryTurnsApi = {
  async getAll(
    page: number = 1,
    pageSize: number = 50,
    search?: string,
    activeOnly?: boolean
  ): Promise<DeliveryTurnsResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (search) params.append('search', search);
    if (activeOnly !== undefined) params.append('activeOnly', activeOnly.toString());

    const response = await apiClient.get<any>(`/api/delivery-turns?${params}`);
    const raw = response.data?.data ?? response.data;
    const items: DeliveryTurn[] = (raw?.DeliveryTurns ?? raw?.deliveryTurns ?? []).map(normalizeDeliveryTurn);
    return {
      deliveryTurns: items,
      totalCount: raw?.TotalCount ?? raw?.totalCount ?? 0,
      page: raw?.Page ?? raw?.page ?? page,
      pageSize: raw?.PageSize ?? raw?.pageSize ?? pageSize,
      totalPages: raw?.TotalPages ?? raw?.totalPages ?? 1,
    };
  },

  async getById(id: string): Promise<DeliveryTurn> {
    const response = await apiClient.get<any>(`/api/delivery-turns/${id}`);
    return normalizeDeliveryTurn(response.data?.data ?? response.data);
  },

  async create(data: CreateDeliveryTurnDto): Promise<DeliveryTurn> {
    const response = await apiClient.post<any>('/api/delivery-turns', data);
    return normalizeDeliveryTurn(response.data?.data ?? response.data);
  },

  async update(id: string, data: UpdateDeliveryTurnDto): Promise<DeliveryTurn> {
    const response = await apiClient.put<any>(`/api/delivery-turns/${id}`, data);
    return normalizeDeliveryTurn(response.data?.data ?? response.data);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/delivery-turns/${id}`);
  },
};
