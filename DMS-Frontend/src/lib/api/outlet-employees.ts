import apiClient from './api-client';

export interface OutletEmployee {
  id: string;
  outletId: string;
  outletName: string;
  outletCode?: string;
  userId: string;
  employeeCode: string;
  userName: string;
  userEmail?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  position?: string;
  designation?: string;
  isManager: boolean;
  canReceiveDeliveries: boolean;
  hireDate?: string;
  terminationDate?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateOutletEmployeeDto {
  outletId: string;
  userId?: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  phone?: string;
  position?: string;
  designation?: string;
  isManager: boolean;
  canReceiveDeliveries: boolean;
  hireDate?: string;
  terminationDate?: string;
  notes?: string;
  isActive: boolean;
}

export interface UpdateOutletEmployeeDto {
  outletId: string;
  userId?: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  phone?: string;
  position?: string;
  designation?: string;
  isManager: boolean;
  canReceiveDeliveries: boolean;
  hireDate?: string;
  terminationDate?: string;
  notes?: string;
  isActive: boolean;
}

export interface OutletEmployeesResponse {
  outletEmployees: OutletEmployee[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function normalizeEmployee(raw: any): OutletEmployee {
  const n = (k: string) => raw[k] ?? raw[k.charAt(0).toUpperCase() + k.slice(1)];
  return {
    id: n('id'),
    outletId: n('outletId'),
    outletName: n('outletName') ?? '',
    outletCode: n('outletCode'),
    userId: n('userId'),
    employeeCode: n('employeeCode') ?? '',
    userName: n('userName') ?? '',
    userEmail: n('userEmail'),
    firstName: n('firstName'),
    lastName: n('lastName'),
    phone: n('phone'),
    position: n('position'),
    designation: n('designation'),
    isManager: n('isManager') ?? false,
    canReceiveDeliveries: n('canReceiveDeliveries') ?? true,
    hireDate: n('hireDate'),
    terminationDate: n('terminationDate'),
    notes: n('notes'),
    isActive: n('isActive') ?? true,
    createdAt: n('createdAt') ?? '',
    updatedAt: n('updatedAt'),
  };
}

export const outletEmployeesApi = {
  async getAll(
    page: number = 1,
    pageSize: number = 10,
    outletId?: string,
    userId?: string,
    search?: string,
    activeOnly?: boolean
  ): Promise<OutletEmployeesResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (outletId) params.append('outletId', outletId);
    if (userId) params.append('userId', userId);
    if (search) params.append('search', search);
    if (activeOnly !== undefined) params.append('activeOnly', activeOnly.toString());

    const response = await apiClient.get<any>(`/api/outlet-employees?${params}`);
    const raw = response.data?.data ?? response.data;
    const employees: OutletEmployee[] = (raw?.OutletEmployees ?? raw?.outletEmployees ?? []).map(normalizeEmployee);
    return {
      outletEmployees: employees,
      totalCount: raw?.TotalCount ?? raw?.totalCount ?? 0,
      page: raw?.Page ?? raw?.page ?? page,
      pageSize: raw?.PageSize ?? raw?.pageSize ?? pageSize,
      totalPages: raw?.TotalPages ?? raw?.totalPages ?? 1,
    };
  },

  async getById(id: string): Promise<OutletEmployee> {
    const response = await apiClient.get<any>(`/api/outlet-employees/${id}`);
    return normalizeEmployee(response.data?.data ?? response.data);
  },

  async create(data: CreateOutletEmployeeDto): Promise<OutletEmployee> {
    const response = await apiClient.post<any>('/api/outlet-employees', data);
    return normalizeEmployee(response.data?.data ?? response.data);
  },

  async update(id: string, data: UpdateOutletEmployeeDto): Promise<OutletEmployee> {
    const response = await apiClient.put<any>(`/api/outlet-employees/${id}`, data);
    return normalizeEmployee(response.data?.data ?? response.data);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/outlet-employees/${id}`);
  },
};
