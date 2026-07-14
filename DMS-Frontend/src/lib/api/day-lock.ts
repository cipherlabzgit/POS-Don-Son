import api from './api-client';

export interface DayLockRangeResponse {
  lockedDates: string[];
}

async function getLockedDates(from: string, to: string): Promise<string[]> {
  const res = await api.get<any>('/api/day-lock/range', { params: { from, to } });
  const data = res.data?.data ?? res.data;
  const raw: string[] = data?.lockedDates ?? data?.LockedDates ?? [];
  return raw;
}

async function lockDate(date: string): Promise<void> {
  await api.post('/api/day-lock/lock', null, { params: { date } });
}

async function unlockDate(date: string): Promise<void> {
  await api.post('/api/day-lock/unlock', null, { params: { date } });
}

export const dayLockApi = { getLockedDates, lockDate, unlockDate };
