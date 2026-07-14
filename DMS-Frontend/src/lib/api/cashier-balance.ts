import api from './api-client';
import type { ApiEnvelope } from './api-client';
import { isAxiosError } from 'axios';

const BASE = '/api/cashier-balance';

function pick<T>(obj: Record<string, unknown>, camel: string, pascal: string): T | undefined {
  const v = obj[camel] ?? obj[pascal];
  return v as T | undefined;
}

export interface CashierBalanceOutletRow {
  outletId: string;
  code: string;
  name: string;
  isShowroomClosed: boolean;
  outletEmployeeId: string | null;
  cashierBalance: number | null;
  balanceCash?: number | null;
  balanceCard?: number | null;
  balanceUber?: number | null;
  balancePickme?: number | null;
}

export interface CashierBalanceContext {
  processDate: string;
  isSubmitted: boolean;
  isApproved: boolean;
  submittedAt: string | null;
  submittedByName: string | null;
  outlets: CashierBalanceOutletRow[];
}

export interface DayEndCashierOption {
  outletEmployeeId: string;
  displayName: string;
}

export interface CashierBalanceRecent {
  processDate: string;
  submittedAt: string;
  submittedByName: string | null;
  closedShowroomCount: number;
  totalBalance: number;
}

export interface SubmitCashierBalanceLine {
  outletId: string;
  isShowroomClosed: boolean;
  outletEmployeeId?: string | null;
  cashierBalance?: number | null;
  balanceCash?: number | null;
  balanceCard?: number | null;
  balanceUber?: number | null;
  balancePickme?: number | null;
}

function parseContextPayload(raw: Record<string, unknown>): CashierBalanceContext {
  const outletsRaw = pick<unknown[]>(raw, 'outlets', 'Outlets') ?? [];
  const list = Array.isArray(outletsRaw) ? outletsRaw : [];
  const outlets: CashierBalanceOutletRow[] = list.map((row) => {
    const o = row as Record<string, unknown>;
    const emp = pick<string | null>(o, 'outletEmployeeId', 'OutletEmployeeId');
    const bal = pick<number | null>(o, 'cashierBalance', 'CashierBalance');
    const bc = pick<number | null>(o, 'balanceCash', 'BalanceCash');
    const bd = pick<number | null>(o, 'balanceCard', 'BalanceCard');
    const bu = pick<number | null>(o, 'balanceUber', 'BalanceUber');
    const bp = pick<number | null>(o, 'balancePickme', 'BalancePickme');
    return {
      outletId: String(pick<string>(o, 'outletId', 'OutletId') ?? ''),
      code: String(pick<string>(o, 'code', 'Code') ?? ''),
      name: String(pick<string>(o, 'name', 'Name') ?? ''),
      isShowroomClosed: Boolean(pick(o, 'isShowroomClosed', 'IsShowroomClosed')),
      outletEmployeeId: emp != null && String(emp) !== '' ? String(emp) : null,
      cashierBalance: bal != null && bal !== undefined ? Number(bal) : null,
      balanceCash: bc != null && bc !== undefined ? Number(bc) : null,
      balanceCard: bd != null && bd !== undefined ? Number(bd) : null,
      balanceUber: bu != null && bu !== undefined ? Number(bu) : null,
      balancePickme: bp != null && bp !== undefined ? Number(bp) : null,
    };
  });

  const pd = pick<string>(raw, 'processDate', 'ProcessDate');
  const submittedAt = pick<string | null>(raw, 'submittedAt', 'SubmittedAt');

  return {
    processDate: pd ? pd.slice(0, 10) : '',
    isSubmitted: Boolean(pick(raw, 'isSubmitted', 'IsSubmitted')),
    isApproved: Boolean(pick(raw, 'isApproved', 'IsApproved')),
    submittedAt: submittedAt ? String(submittedAt) : null,
    submittedByName: pick<string | null>(raw, 'submittedByName', 'SubmittedByName') ?? null,
    outlets,
  };
}

function unwrapObject<T>(response: { data: unknown }, parser: (body: Record<string, unknown>) => T): T {
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
  return parser(inner as Record<string, unknown>);
}

function parseCashierRow(o: Record<string, unknown>): DayEndCashierOption {
  return {
    outletEmployeeId: String(pick<string>(o, 'outletEmployeeId', 'OutletEmployeeId') ?? ''),
    displayName: String(pick<string>(o, 'displayName', 'DisplayName') ?? ''),
  };
}

function unwrapCashiersList(response: { data: unknown }): DayEndCashierOption[] {
  const envelope = response.data as ApiEnvelope<unknown> | undefined;
  if (!envelope?.success) {
    const msg =
      envelope && typeof envelope === 'object' && envelope.error && typeof envelope.error === 'object'
        ? String((envelope.error as { message?: string }).message ?? 'Request failed')
        : 'Request failed';
    throw new Error(msg);
  }
  const data = envelope.data;
  if (!Array.isArray(data)) return [];
  return (data as Record<string, unknown>[]).map(parseCashierRow);
}

function unwrapRecentList(response: { data: unknown }): CashierBalanceRecent[] {
  const envelope = response.data as ApiEnvelope<unknown> | undefined;
  if (!envelope?.success) {
    const msg =
      envelope && typeof envelope === 'object' && envelope.error && typeof envelope.error === 'object'
        ? String((envelope.error as { message?: string }).message ?? 'Request failed')
        : 'Request failed';
    throw new Error(msg);
  }
  const data = envelope.data;
  if (!Array.isArray(data)) return [];
  return (data as Record<string, unknown>[]).map((o) => ({
    processDate: String(pick<string>(o, 'processDate', 'ProcessDate') ?? '').slice(0, 10),
    submittedAt: String(pick<string>(o, 'submittedAt', 'SubmittedAt') ?? ''),
    submittedByName: pick<string | null>(o, 'submittedByName', 'SubmittedByName') ?? null,
    closedShowroomCount: Number(pick(o, 'closedShowroomCount', 'ClosedShowroomCount') ?? 0),
    totalBalance: Number(pick(o, 'totalBalance', 'TotalBalance') ?? 0),
  }));
}

export function getCashierBalanceApiErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as { error?: { message?: string }; message?: string } | undefined;
    return data?.error?.message ?? data?.message ?? err.message ?? 'Request failed';
  }
  if (err instanceof Error) return err.message;
  return 'Request failed';
}

export const cashierBalanceApi = {
  async getContext(processDate: string): Promise<CashierBalanceContext> {
    const res = await api.get(`${BASE}/context`, { params: { processDate } });
    return unwrapObject(res, parseContextPayload);
  },

  async getCashiersForOutlet(outletId: string): Promise<DayEndCashierOption[]> {
    const res = await api.get(`${BASE}/outlets/${outletId}/cashiers`);
    return unwrapCashiersList(res);
  },

  async submit(payload: { processDate: string; lines: SubmitCashierBalanceLine[] }): Promise<void> {
    const res = await api.post(`${BASE}/submit`, {
      processDate: payload.processDate,
      lines: payload.lines.map((l) => {
        if (l.isShowroomClosed) {
          return {
            outletId: l.outletId,
            isShowroomClosed: true,
          };
        }
        return {
          outletId: l.outletId,
          isShowroomClosed: false,
          outletEmployeeId: l.outletEmployeeId ?? null,
          balanceCash: l.balanceCash ?? null,
          balanceCard: l.balanceCard ?? null,
          balanceUber: l.balanceUber ?? null,
          balancePickme: l.balancePickme ?? null,
          cashierBalance: l.cashierBalance ?? null,
        };
      }),
    });
    const envelope = res.data as ApiEnvelope<unknown> | undefined;
    if (!envelope?.success) {
      const msg =
        envelope && typeof envelope === 'object' && envelope.error && typeof envelope.error === 'object'
          ? String((envelope.error as { message?: string }).message ?? 'Submit failed')
          : 'Submit failed';
      throw new Error(msg);
    }
  },

  async getRecent(count = 10): Promise<CashierBalanceRecent[]> {
    const res = await api.get(`${BASE}/recent`, { params: { count } });
    return unwrapRecentList(res);
  },
};
