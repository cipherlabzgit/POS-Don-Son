import api from './api-client';
import { isAxiosError } from 'axios';

const BASE = '/api/day-end';

function pick<T>(obj: Record<string, unknown>, camel: string, pascal: string): T | undefined {
  const v = obj[camel] ?? obj[pascal];
  return v as T | undefined;
}

export interface DayEndOutletRow {
  outletId: string;
  outletName: string;
  systemBalance: number;
  rowStatus: string;
}

export interface DayEndContext {
  processDate: string;
  cashierBalanceApproved: boolean;
  dayLocked: boolean;
  lastDayEndProcessDate: string | null;
  outlets: DayEndOutletRow[];
}

export interface DayEndCashierOption {
  outletEmployeeId: string;
  displayName: string;
}

export interface SubmitDayEndLine {
  outletId: string;
  outletEmployeeId: string;
  cashierBalance: number;
}

function parseOutletRow(o: Record<string, unknown>): DayEndOutletRow {
  const outletId = String(
    pick<string>(o, 'outletId', 'OutletId') ??
      pick<string>(o, 'id', 'Id') ??
      ''
  );
  const outletName = String(
    pick<string>(o, 'outletName', 'OutletName') ??
      pick<string>(o, 'name', 'Name') ??
      pick<string>(o, 'showroomName', 'ShowroomName') ??
      ''
  );
  return {
    outletId,
    outletName,
    systemBalance: Number(pick(o, 'systemBalance', 'SystemBalance') ?? 0),
    rowStatus: String(pick<string>(o, 'rowStatus', 'RowStatus') ?? 'Pending'),
  };
}

function parseContextPayload(raw: Record<string, unknown>): DayEndContext {
  const outletsRaw = pick<unknown[]>(raw, 'outlets', 'Outlets') ?? [];
  const list = Array.isArray(outletsRaw) ? outletsRaw : [];
  const outlets: DayEndOutletRow[] = list
    .map((row) => parseOutletRow(row as Record<string, unknown>))
    .filter((r) => r.outletId.length > 0 && r.outletName.length > 0);

  const pd = pick<string>(raw, 'processDate', 'ProcessDate');
  const last = pick<string | null>(raw, 'lastDayEndProcessDate', 'LastDayEndProcessDate');

  return {
    processDate: pd ? pd.slice(0, 10) : '',
    cashierBalanceApproved: Boolean(pick(raw, 'cashierBalanceApproved', 'CashierBalanceApproved')),
    dayLocked: Boolean(pick(raw, 'dayLocked', 'DayLocked')),
    lastDayEndProcessDate: last ? last.slice(0, 10) : null,
    outlets,
  };
}

function unwrapData<T>(response: { data: unknown }, parser: (body: Record<string, unknown>) => T): T {
  const body = response.data as Record<string, unknown> | undefined;
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid response');
  }
  const success = Boolean(body.success ?? body.Success);
  if (!success) {
    const err = (body.error ?? body.Error) as { message?: string } | undefined;
    const msg =
      err && typeof err === 'object' && 'message' in err
        ? String(err.message ?? 'Request failed')
        : 'Request failed';
    throw new Error(msg);
  }
  const innerRaw = body.data ?? body.Data;
  const inner = innerRaw as Record<string, unknown> | null | undefined;
  if (!inner || typeof inner !== 'object' || Array.isArray(inner)) {
    throw new Error('Invalid response payload');
  }
  return parser(inner);
}

function parseCashierRow(o: Record<string, unknown>): DayEndCashierOption {
  return {
    outletEmployeeId: String(pick<string>(o, 'outletEmployeeId', 'OutletEmployeeId') ?? ''),
    displayName: String(pick<string>(o, 'displayName', 'DisplayName') ?? ''),
  };
}

function unwrapCashiersList(response: { data: unknown }): DayEndCashierOption[] {
  const body = response.data as Record<string, unknown> | undefined;
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid response');
  }
  const success = Boolean(body.success ?? body.Success);
  if (!success) {
    const err = (body.error ?? body.Error) as { message?: string } | undefined;
    const msg =
      err && typeof err === 'object' && 'message' in err
        ? String(err.message ?? 'Request failed')
        : 'Request failed';
    throw new Error(msg);
  }
  const data = body.data ?? body.Data;
  if (!Array.isArray(data)) return [];
  return (data as Record<string, unknown>[]).map(parseCashierRow);
}

export function getDayEndApiErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as
      | { error?: { message?: string }; message?: string }
      | undefined;
    return data?.error?.message ?? data?.message ?? err.message ?? 'Request failed';
  }
  if (err instanceof Error) return err.message;
  return 'Request failed';
}

export const dayEndApi = {
  async getContext(processDate: string): Promise<DayEndContext> {
    const res = await api.get(`${BASE}/context`, {
      params: { processDate },
    });
    return unwrapData(res, parseContextPayload);
  },

  async getCashiersForOutlet(outletId: string): Promise<DayEndCashierOption[]> {
    const res = await api.get(`${BASE}/outlets/${outletId}/cashiers`);
    return unwrapCashiersList(res);
  },

  async approveCashierBalance(processDate: string): Promise<void> {
    const res = await api.post(`${BASE}/cashier-balance/approve`, {}, {
      params: { processDate },
    });
    const body = res.data as Record<string, unknown> | undefined;
    const success = Boolean(body?.success ?? body?.Success);
    if (!success) {
      const err = (body?.error ?? body?.Error) as { message?: string } | undefined;
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String(err.message ?? 'Approve failed')
          : 'Approve failed';
      throw new Error(msg);
    }
  },

  async submit(payload: { processDate: string; lines: SubmitDayEndLine[] }): Promise<void> {
    const res = await api.post(`${BASE}/submit`, {
      processDate: payload.processDate,
      lines: payload.lines.map((l) => ({
        outletId: l.outletId,
        outletEmployeeId: l.outletEmployeeId,
        cashierBalance: l.cashierBalance,
      })),
    });
    const body = res.data as Record<string, unknown> | undefined;
    const success = Boolean(body?.success ?? body?.Success);
    if (!success) {
      const err = (body?.error ?? body?.Error) as { message?: string } | undefined;
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String(err.message ?? 'Submit failed')
          : 'Submit failed';
      throw new Error(msg);
    }
  },
};
