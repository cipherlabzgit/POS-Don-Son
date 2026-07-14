import { apiClient, assertApiSuccess, type ApiEnvelope } from './api-client';

export interface AdministratorDeliverySchedule {
  dayTypeId: string;
  displayName: string;
  code: string;
  sortOrder: number;
}

export interface AdministratorDeliveryTurnOption {
  id: string;
  name: string;
  deliveryTimeDisplay: string;
}

export interface AdministratorPlanningWindow {
  allowedPlanDates: string[];
  minPlanDate: string;
  maxPlanDate: string;
  availableDeliveryTurns: AdministratorDeliveryTurnOption[];
}

export interface AdministratorUpcomingPlan {
  id: string;
  planNo: string;
  planDate: string;
  deliveryTurnId: string;
  deliveryTurnName: string;
  dayTypeId: string;
  dayTypeName: string;
  status: string;
  useFreezerStock: boolean;
  totalItems: number;
  updatedAt: string;
}

export interface AdministratorQuickCreateDto {
  planDate: string;
  dayTypeId: string;
  deliveryTurnId: string;
  useFreezerStock?: boolean;
  notes?: string;
}

function pick<T>(obj: Record<string, unknown>, camel: string, pascal: string): T | undefined {
  const v = obj[camel] ?? obj[pascal];
  return v as T | undefined;
}

function normalizeTurnOption(raw: Record<string, unknown>): AdministratorDeliveryTurnOption {
  return {
    id: String(pick<string>(raw, 'id', 'Id') ?? ''),
    name: String(pick<string>(raw, 'name', 'Name') ?? ''),
    deliveryTimeDisplay: String(
      pick<string>(raw, 'deliveryTimeDisplay', 'DeliveryTimeDisplay') ?? ''
    ),
  };
}

function normalizeSchedule(raw: Record<string, unknown>): AdministratorDeliverySchedule {
  return {
    dayTypeId: String(pick<string>(raw, 'dayTypeId', 'DayTypeId') ?? ''),
    displayName: String(pick<string>(raw, 'displayName', 'DisplayName') ?? ''),
    code: String(pick<string>(raw, 'code', 'Code') ?? ''),
    sortOrder: Number(pick(raw, 'sortOrder', 'SortOrder') ?? 0),
  };
}

function normalizeWindow(envelopeData: Record<string, unknown>): AdministratorPlanningWindow {
  const datesRaw = pick<unknown[]>(envelopeData, 'allowedPlanDates', 'AllowedPlanDates') ?? [];
  const dates = Array.isArray(datesRaw) ? datesRaw.map((d) => String(d)) : [];
  const turnsRaw =
    pick<unknown[]>(envelopeData, 'availableDeliveryTurns', 'AvailableDeliveryTurns') ?? [];
  const turns = Array.isArray(turnsRaw)
    ? turnsRaw.map((row) => normalizeTurnOption(row as Record<string, unknown>))
    : [];
  return {
    allowedPlanDates: dates,
    minPlanDate: String(pick<string>(envelopeData, 'minPlanDate', 'MinPlanDate') ?? ''),
    maxPlanDate: String(pick<string>(envelopeData, 'maxPlanDate', 'MaxPlanDate') ?? ''),
    availableDeliveryTurns: turns,
  };
}

function normalizeUpcomingPlan(raw: Record<string, unknown>): AdministratorUpcomingPlan {
  return {
    id: String(pick<string>(raw, 'id', 'Id') ?? ''),
    planNo: String(pick<string>(raw, 'planNo', 'PlanNo') ?? ''),
    planDate: String(pick<string>(raw, 'planDate', 'PlanDate') ?? ''),
    deliveryTurnId: String(pick<string>(raw, 'deliveryTurnId', 'DeliveryTurnId') ?? ''),
    deliveryTurnName: String(pick<string>(raw, 'deliveryTurnName', 'DeliveryTurnName') ?? ''),
    dayTypeId: String(pick<string>(raw, 'dayTypeId', 'DayTypeId') ?? ''),
    dayTypeName: String(pick<string>(raw, 'dayTypeName', 'DayTypeName') ?? ''),
    status: String(pick<string>(raw, 'status', 'Status') ?? ''),
    useFreezerStock: Boolean(pick(raw, 'useFreezerStock', 'UseFreezerStock')),
    totalItems: Number(pick(raw, 'totalItems', 'TotalItems') ?? 0),
    updatedAt: String(pick<string>(raw, 'updatedAt', 'UpdatedAt') ?? ''),
  };
}

export function getAdministratorDeliveryPlanErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const ax = err as { response?: { data?: { error?: { message?: string }; message?: string } } };
    const d = ax.response?.data;
    return d?.error?.message ?? d?.message ?? (err instanceof Error ? err.message : 'Request failed');
  }
  if (err instanceof Error) return err.message;
  return 'Request failed';
}

export const administratorDeliveryPlanApi = {
  async getSchedules(): Promise<AdministratorDeliverySchedule[]> {
    const response = await apiClient.get<ApiEnvelope<Record<string, unknown>>>(
      '/api/administrator/delivery-plan/schedules'
    );
    assertApiSuccess(response.data);
    const body = response.data.data as Record<string, unknown>;
    const rawList = pick<unknown[]>(body, 'schedules', 'Schedules') ?? [];
    if (!Array.isArray(rawList)) return [];
    return rawList.map((row) => normalizeSchedule(row as Record<string, unknown>));
  },

  async getWindow(): Promise<AdministratorPlanningWindow> {
    const response = await apiClient.get<ApiEnvelope<Record<string, unknown>>>(
      '/api/administrator/delivery-plan/window'
    );
    assertApiSuccess(response.data);
    return normalizeWindow(response.data.data as Record<string, unknown>);
  },

  async getUpcomingPlans(): Promise<AdministratorUpcomingPlan[]> {
    const response = await apiClient.get<ApiEnvelope<Record<string, unknown>>>(
      '/api/administrator/delivery-plan/upcoming-plans'
    );
    assertApiSuccess(response.data);
    const body = response.data.data as Record<string, unknown>;
    const rawList = pick<unknown[]>(body, 'deliveryPlans', 'DeliveryPlans') ?? [];
    if (!Array.isArray(rawList)) return [];
    return rawList.map((row) => normalizeUpcomingPlan(row as Record<string, unknown>));
  },

  async quickCreate(dto: AdministratorQuickCreateDto): Promise<Record<string, unknown>> {
    const response = await apiClient.post<ApiEnvelope<Record<string, unknown>>>(
      '/api/administrator/delivery-plan/quick-create',
      dto
    );
    assertApiSuccess(response.data);
    return response.data.data as Record<string, unknown>;
  },
};
