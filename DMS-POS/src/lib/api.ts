import axios, { type AxiosError } from 'axios'
import type { ApiEnvelope, LoginResponse } from './types'
import { useAuthStore } from './auth-store'
import { useSettingsStore } from './settings-store'

export function getApiBaseUrl(): string {
  return useSettingsStore.getState().apiBaseUrl.replace(/\/$/, '')
}

export const api = axios.create({
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((cfg) => {
  const token = useAuthStore.getState().accessToken
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  cfg.baseURL = getApiBaseUrl()
  return cfg
})

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as typeof error.config & { _retry?: boolean }
    if (!original || error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }
    original._retry = true
    const refresh = useAuthStore.getState().refreshToken
    if (!refresh) {
      useAuthStore.getState().logout()
      return Promise.reject(error)
    }
    try {
      const { data } = await axios.post<LoginResponse>(
        `${getApiBaseUrl()}/api/auth/refresh`,
        { refreshToken: refresh },
      )
      useAuthStore.getState().updateTokens(data.accessToken, data.refreshToken)
      original.headers.Authorization = `Bearer ${data.accessToken}`
      return api(original)
    } catch {
      useAuthStore.getState().logout()
      return Promise.reject(error)
    }
  },
)

export function unwrap<T>(env: ApiEnvelope<T> | Record<string, unknown>): T {
  const root = env as Record<string, unknown>
  const success = root.success ?? root.Success
  if (success === false) {
    const err = root.error ?? root.Error
    const msg =
      err && typeof err === 'object' && 'message' in (err as object)
        ? String((err as { message?: string }).message ?? '')
        : ''
    throw new Error(msg || 'Request failed')
  }
  const data = root.data ?? root.Data
  return data as T
}

export function recordId(row: unknown): string {
  if (!row || typeof row !== 'object') return ''
  const r = row as Record<string, unknown>
  return String(r.id ?? r.Id ?? '').trim()
}

/** Parse { success, data: { products/Products, totalCount/TotalCount } } like DMS Web does. */
export function readPagedPayload(
  body: unknown,
  listKeys: [string, string],
  countKeys: [string, string],
): { items: unknown[]; totalCount: number } {
  const root = (body ?? {}) as Record<string, unknown>
  const success = root.success ?? root.Success
  if (success === false) {
    const err = root.error ?? root.Error
    const msg =
      err && typeof err === 'object' && 'message' in (err as object)
        ? String((err as { message?: string }).message ?? '')
        : ''
    throw new Error(msg || 'Request failed')
  }
  const payload = (root.data ?? root.Data ?? root) as Record<string, unknown>
  const rawList = payload[listKeys[0]] ?? payload[listKeys[1]]
  const items = Array.isArray(rawList) ? rawList : []
  const countRaw = payload[countKeys[0]] ?? payload[countKeys[1]]
  const totalCount =
    typeof countRaw === 'number' ? countRaw : Number(countRaw ?? items.length)
  return { items, totalCount }
}

export async function loginRequest(email: string, password: string): Promise<LoginResponse> {
  const { data } = await axios.post<LoginResponse & Record<string, unknown>>(
    `${getApiBaseUrl()}/api/auth/login`,
    { email, password, client: 'pos' },
  )
  const root = (data ?? {}) as Record<string, unknown>
  const inner = (root.data ?? root.Data ?? data) as LoginResponse & Record<string, unknown>
  const userRaw = (inner.user ?? inner.User ?? {}) as Record<string, unknown>
  return {
    accessToken: String(inner.accessToken ?? inner.AccessToken ?? ''),
    refreshToken: String(inner.refreshToken ?? inner.RefreshToken ?? ''),
    expiresIn: Number(inner.expiresIn ?? inner.ExpiresIn ?? 0),
    user: {
      id: String(userRaw.id ?? userRaw.Id ?? ''),
      email: String(userRaw.email ?? userRaw.Email ?? ''),
      firstName: String(userRaw.firstName ?? userRaw.FirstName ?? ''),
      lastName: String(userRaw.lastName ?? userRaw.LastName ?? ''),
      isSuperAdmin: Boolean(userRaw.isSuperAdmin ?? userRaw.IsSuperAdmin),
      isActive: userRaw.isActive !== false && userRaw.IsActive !== false,
      permissions: (userRaw.permissions ?? userRaw.Permissions ?? []) as string[],
      roles: (userRaw.roles ?? userRaw.Roles ?? []) as LoginResponse['user']['roles'],
    },
  }
}

export async function fetchProductsPage(
  page: number,
  pageSize: number,
  opts?: { posVisibleOnly?: boolean },
) {
  const posVisibleOnly = opts?.posVisibleOnly !== false
  const { data } = await api.get('/api/products', {
    params: { page, pageSize, activeOnly: true },
  })
  const { items, totalCount } = readPagedPayload(data, ['products', 'Products'], [
    'totalCount',
    'TotalCount',
  ])
  const products = posVisibleOnly
    ? items.filter((p) => {
        const r = p as Record<string, unknown>
        const d = r.displayInPOS ?? r.DisplayInPOS
        return d === undefined || d === null || Boolean(d)
      })
    : items
  // rawCount = unfiltered page size from API (for pagination; do not use filtered length)
  return { products, totalCount, rawCount: items.length }
}

export async function fetchCategoriesPage(page: number, pageSize: number) {
  const { data } = await api.get('/api/categories', {
    params: { page, pageSize, activeOnly: true },
  })
  const { items, totalCount } = readPagedPayload(data, ['categories', 'Categories'], [
    'totalCount',
    'TotalCount',
  ])
  const categories = items.filter((c) => {
    const r = c as Record<string, unknown>
    const d = r.displayInPOS ?? r.DisplayInPOS
    return d === undefined || d === null || Boolean(d)
  })
  return { categories, totalCount, rawCount: items.length }
}

export async function resolveOutletByPosVerificationCode(code: string) {
  const { data } = await api.get<ApiEnvelope<{
    id?: string
    Id?: string
    code?: string
    Code?: string
    name?: string
    Name?: string
    address?: string
    Address?: string
    phone?: string
    Phone?: string
  }>>('/api/outlets/by-pos-verification-code', {
    params: { code: code.trim() },
  })
  const row = unwrap(data)
  const r = row as Record<string, unknown>
  return {
    id: String(r.id ?? r.Id ?? ''),
    code: String(r.code ?? r.Code ?? ''),
    name: String(r.name ?? r.Name ?? ''),
    address: String(r.address ?? r.Address ?? ''),
    phone: r.phone != null || r.Phone != null ? String(r.phone ?? r.Phone) : undefined,
  }
}

export async function fetchOutletsPage(page: number, pageSize: number) {
  const { data } = await api.get('/api/outlets', {
    params: { page, pageSize, activeOnly: true },
  })
  const { items, totalCount } = readPagedPayload(data, ['outlets', 'Outlets'], [
    'totalCount',
    'TotalCount',
  ])
  return { outlets: items, totalCount }
}

export async function fetchDeliveryTurnsPage(page: number, pageSize: number) {
  const { data } = await api.get<ApiEnvelope<{ deliveryTurns: unknown[]; totalCount: number }>>(
    '/api/delivery-turns',
    { params: { page, pageSize, activeOnly: true } },
  )
  return unwrap(data)
}

export async function createOrderRequest(body: {
  orderNo: string
  orderDate: string
  deliveryDate: string
  deliveryTime: string
  productionStartingDate: string
  productionStartingTime: string
  recipeRequestNumber?: string
  useFreezerStock: boolean
  notes?: string
}) {
  const { data } = await api.post<ApiEnvelope<unknown>>('/api/orders', body)
  return unwrap(data)
}

export async function bulkUpsertOrderItems(orderId: string, items: { outletId: string; productId: string; deliveryTurnId: string; fullQuantity: number; miniQuantity: number; isExtraItem: boolean }[]) {
  const { data } = await api.post<ApiEnvelope<unknown>>(`/api/orders/${encodeURIComponent(orderId)}/items/bulk-upsert`, items)
  return unwrap(data)
}

export async function postPosSale(body: object) {
  const { data } = await api.post<ApiEnvelope<unknown>>('/api/pos-sales', body)
  return unwrap(data)
}

export async function postPosSalesBulk(sales: object[]) {
  const { data} = await api.post<ApiEnvelope<unknown>>('/api/pos-sales/bulk', { sales })
  return unwrap(data)
}

export async function fetchActivePosTheme() {
  const { data } = await api.get<ApiEnvelope<{
    primaryColor: string
    primaryLight: string
    primaryDark: string
    accentColor: string
    accentLight: string
    accentDark: string
    categoryColors: string[]
  }>>('/api/pos-theme-configs/active')
  return unwrap(data)
}

export async function postStockBfBulk(body: object) {
  const { data } = await api.post<ApiEnvelope<unknown>>('/api/stock-bf/bulk', body)
  return unwrap(data)
}

export async function fetchStockBfRecords(params: {
  outletId: string
  fromDate: string
  toDate: string
  page?: number
  pageSize?: number
}) {
  const { data } = await api.get<ApiEnvelope<Record<string, unknown>>>('/api/stock-bf', {
    params: {
      outletId: params.outletId,
      fromDate: params.fromDate,
      toDate: params.toDate,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 100,
    },
  })
  return unwrap(data)
}

export async function fetchTransfers(params: Record<string, string | number | undefined>) {
  const { data } = await api.get<
    ApiEnvelope<{ transfers: unknown[]; totalCount: number }>
  >('/api/transfers', { params })
  return unwrap(data)
}

export async function fetchTransferDetail(id: string) {
  const { data } = await api.get<ApiEnvelope<unknown>>(`/api/transfers/${id}`)
  return unwrap(data)
}

export async function completeTransferReceipt(id: string) {
  const { data } = await api.post<ApiEnvelope<unknown>>(`/api/transfers/${id}/complete-receipt`)
  return unwrap(data)
}

export async function createTransfer(body: {
  transferDate: string
  fromOutletId: string
  toOutletId: string
  notes?: string
  items: { productId: string; quantity: number }[]
}) {
  const { data } = await api.post<ApiEnvelope<unknown>>('/api/transfers', body)
  return unwrap(data)
}

export async function createDeliveryReturn(body: {
  returnDate: string
  deliveryNo: string
  deliveredDate: string
  outletId: string
  reason: string
  items: { productId: string; quantity: number }[]
}) {
  const { data } = await api.post<ApiEnvelope<unknown>>('/api/delivery-returns', body)
  return unwrap(data)
}

export async function fetchCashierBalanceContext(processDateIsoDate: string) {
  const { data } = await api.get<ApiEnvelope<Record<string, unknown>>>(
    '/api/cashier-balance/context',
    { params: { processDate: processDateIsoDate } },
  )
  return unwrap(data)
}

export async function fetchCashiersForOutlet(outletId: string) {
  const { data } = await api.get<ApiEnvelope<{ outletEmployeeId: string; displayName: string }[]>>(
    `/api/cashier-balance/outlets/${outletId}/cashiers`,
  )
  return unwrap(data)
}

export async function submitCashierBalance(body: {
  processDate: string
  lines: {
    outletId: string
    isShowroomClosed: boolean
    outletEmployeeId?: string | null
    cashierBalance?: number | null
    balanceCash?: number | null
    balanceCard?: number | null
    balanceUber?: number | null
    balancePickme?: number | null
  }[]
}) {
  const { data } = await api.post<ApiEnvelope<unknown>>('/api/cashier-balance/submit', body)
  return unwrap(data)
}

export async function fetchPosSales(params: {
  page?: number
  pageSize?: number
  outletId?: string
}) {
  const { data } = await api.get<
    ApiEnvelope<{ sales: unknown[]; totalCount: number; page: number; pageSize: number }>
  >('/api/pos-sales', { params })
  return unwrap(data)
}

/** Latest sale detail from server (approval status, lines, etc.). */
export async function fetchPosSaleById(id: string) {
  const { data } = await api.get<ApiEnvelope<unknown>>(`/api/pos-sales/${encodeURIComponent(id)}`)
  return unwrap(data)
}

export async function requestPosSaleCancel(id: string, reason: string) {
  const { data } = await api.post<ApiEnvelope<unknown>>(
    `/api/pos-sales/${encodeURIComponent(id)}/request-cancel`,
    { reason },
  )
  return unwrap(data)
}

export async function createImmediateOrder(body: {
  orderBillNo: string
  orderDate: string
  needByDate: string
  needByTime: string
  deliveryDate: string
  deliveryTime: string
  productionStartingDate: string
  productionStartingTime: string
  recipeRequestNumber: string
  deliveryTurnId: string
  outletId: string
  productId: string
  fullQuantity: number
  miniQuantity: number
  requestedBy: string
  reason: string
  isCustomized: boolean
  customizationNotes?: string
}) {
  const { data } = await api.post<ApiEnvelope<unknown>>('/api/immediate-orders', body)
  return unwrap(data)
}

export type PosSaleRecordDay = {
  date: string
  difference: number | null
  showroomName: string | null
  available: boolean
}

export type PosSaleRecordWeek = {
  weekStart: string
  weekEnd: string
  total: number
  days: PosSaleRecordDay[]
}

export type PosSaleRecords = {
  cashierName: string
  weekStartDay: number
  weeksToShow: number
  periodStart: string
  periodEnd: string
  unreadCount: number
  weeks: PosSaleRecordWeek[]
}

function pickRec<T>(row: Record<string, unknown>, camel: string, pascal: string): T | undefined {
  return (row[camel] ?? row[pascal]) as T | undefined
}

export async function fetchPosSaleRecords(): Promise<PosSaleRecords> {
  const { data } = await api.get<ApiEnvelope<Record<string, unknown>>>('/api/pos/sale-records')
  const raw = (unwrap(data) ?? {}) as Record<string, unknown>
  const weeksRaw = (pickRec<unknown[]>(raw, 'weeks', 'Weeks') ?? []) as Record<string, unknown>[]
  return {
    cashierName: String(pickRec(raw, 'cashierName', 'CashierName') ?? ''),
    weekStartDay: Number(pickRec(raw, 'weekStartDay', 'WeekStartDay') ?? 3),
    weeksToShow: Number(pickRec(raw, 'weeksToShow', 'WeeksToShow') ?? 2),
    periodStart: String(pickRec(raw, 'periodStart', 'PeriodStart') ?? ''),
    periodEnd: String(pickRec(raw, 'periodEnd', 'PeriodEnd') ?? ''),
    unreadCount: Number(pickRec(raw, 'unreadCount', 'UnreadCount') ?? 0),
    weeks: weeksRaw.map((w) => {
      const daysRaw = (pickRec<unknown[]>(w, 'days', 'Days') ?? []) as Record<string, unknown>[]
      return {
        weekStart: String(pickRec(w, 'weekStart', 'WeekStart') ?? ''),
        weekEnd: String(pickRec(w, 'weekEnd', 'WeekEnd') ?? ''),
        total: Number(pickRec(w, 'total', 'Total') ?? 0),
        days: daysRaw.map((d) => {
          const diff = pickRec<number | null>(d, 'difference', 'Difference')
          const name = pickRec<string | null>(d, 'showroomName', 'ShowroomName')
          return {
            date: String(pickRec(d, 'date', 'Date') ?? ''),
            difference: diff == null ? null : Number(diff),
            showroomName: name == null || name === '' ? null : String(name),
            available: Boolean(pickRec(d, 'available', 'Available')),
          }
        }),
      }
    }),
  }
}

export async function fetchPosSaleRecordsUnreadCount(): Promise<number> {
  const { data } = await api.get<ApiEnvelope<Record<string, unknown>>>('/api/pos/sale-records/unread-count')
  const raw = unwrap(data) as Record<string, unknown>
  return Number(pickRec(raw, 'unreadCount', 'UnreadCount') ?? 0)
}

export async function markPosSaleRecordsRead(): Promise<void> {
  const { data } = await api.post<ApiEnvelope<unknown>>('/api/pos/sale-records/mark-read')
  unwrap(data)
}
