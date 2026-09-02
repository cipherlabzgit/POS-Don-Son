import apiClient from './api-client';

const POS_VERIFY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Uncommon till-bind key — not the public showroom Code. */
export function generatePosVerificationCode(): string {
  const pick = (n: number) =>
    Array.from({ length: n }, () => POS_VERIFY_ALPHABET[Math.floor(Math.random() * POS_VERIFY_ALPHABET.length)]).join('');
  return `PV-${pick(4)}-${pick(4)}-${pick(4)}`;
}

export interface Outlet {
  id: string;
  code: string;
  posVerificationCode?: string;
  name: string;
  description?: string;
  address: string;
  phone?: string;
  contactPerson?: string;
  displayOrder: number; // ⭐ Rank column for numbering showrooms
  locationType?: string;
  hasVariants: boolean;
  isDeliveryPoint: boolean;
  defaultDeliveryTurnId?: string;
  defaultDeliveryTurnName?: string;
  latitude?: number;
  longitude?: number;
  operatingHours?: string;
  notes?: string;
  employeeCount: number;
  isActive: boolean;
  showInDashboard: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateOutletDto {
  code: string;
  posVerificationCode?: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  contactPerson?: string;
  displayOrder: number;
  locationType?: string;
  hasVariants: boolean;
  isDeliveryPoint: boolean;
  defaultDeliveryTurnId?: string;
  latitude?: number;
  longitude?: number;
  operatingHours?: string;
  notes?: string;
  isActive: boolean;
  showInDashboard?: boolean;
}

export interface UpdateOutletDto {
  code: string;
  posVerificationCode?: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  contactPerson?: string;
  displayOrder: number;
  locationType?: string;
  hasVariants: boolean;
  isDeliveryPoint: boolean;
  defaultDeliveryTurnId?: string;
  latitude?: number;
  longitude?: number;
  operatingHours?: string;
  notes?: string;
  isActive: boolean;
  showInDashboard?: boolean;
}

export interface OutletsResponse {
  outlets: Outlet[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function normalizeOutlet(raw: any): Outlet {
  const n = (k: string) => raw[k] ?? raw[k.charAt(0).toUpperCase() + k.slice(1)];
  return {
    id: n('id'),
    code: n('code') ?? '',
    posVerificationCode: n('posVerificationCode') ?? raw.PosVerificationCode ?? '',
    name: n('name') ?? '',
    description: n('description'),
    address: n('address') ?? '',
    phone: n('phone'),
    contactPerson: n('contactPerson'),
    displayOrder: n('displayOrder') ?? 0,
    locationType: n('locationType'),
    hasVariants: n('hasVariants') ?? false,
    isDeliveryPoint: n('isDeliveryPoint') ?? false,
    defaultDeliveryTurnId: n('defaultDeliveryTurnId'),
    defaultDeliveryTurnName: n('defaultDeliveryTurnName'),
    latitude: n('latitude'),
    longitude: n('longitude'),
    operatingHours: n('operatingHours'),
    notes: n('notes'),
    employeeCount: n('employeeCount') ?? 0,
    isActive: n('isActive') ?? true,
    showInDashboard: n('showInDashboard') ?? false,
    createdAt: n('createdAt') ?? '',
    updatedAt: n('updatedAt'),
  };
}

export const outletsApi = {
  async getAll(
    page: number = 1,
    pageSize: number = 50,
    search?: string,
    locationType?: string,
    activeOnly?: boolean
  ): Promise<OutletsResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (search) params.append('search', search);
    if (locationType) params.append('locationType', locationType);
    if (activeOnly !== undefined) params.append('activeOnly', activeOnly.toString());

    const response = await apiClient.get<any>(`/api/outlets?${params}`);
    const data = response.data?.data ?? response.data;
    const items: Outlet[] = (data?.Outlets ?? data?.outlets ?? []).map(normalizeOutlet);
    return {
      outlets: items,
      page: data?.Page ?? data?.page ?? page,
      pageSize: data?.PageSize ?? data?.pageSize ?? pageSize,
      totalPages: data?.TotalPages ?? data?.totalPages ?? 1,
      totalCount: data?.TotalCount ?? data?.totalCount ?? 0,
    };
  },

  async getById(id: string): Promise<Outlet> {
    const response = await apiClient.get<any>(`/api/outlets/${id}`);
    return normalizeOutlet(response.data?.data ?? response.data);
  },

  async create(data: CreateOutletDto): Promise<Outlet> {
    const response = await apiClient.post<any>('/api/outlets', data);
    return normalizeOutlet(response.data?.data ?? response.data);
  },

  async update(id: string, data: UpdateOutletDto): Promise<Outlet> {
    const response = await apiClient.put<any>(`/api/outlets/${id}`, data);
    return normalizeOutlet(response.data?.data ?? response.data);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/outlets/${id}`);
  },
};
