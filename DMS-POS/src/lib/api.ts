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

export function unwrap<T>(env: ApiEnvelope<T>): T {
  if (!env?.success) {
    const msg =
      env?.error && typeof env.error === 'object' && 'message' in env.error
        ? String((env.error as { message?: string }).message ?? '')
        : ''
    throw new Error(msg || 'Request failed')
  }
  return env.data
}

export async function loginRequest(email: string, password: string): Promise<LoginResponse> {
  const { data } = await axios.post<LoginResponse>(`${getApiBaseUrl()}/api/auth/login`, {
    email,
    password,
  })
  return data
}

export async function fetchProductsPage(page: number, pageSize: number) {
  const { data } = await api.get<ApiEnvelope<{ products: unknown[]; totalCount: number }>>(
    '/api/products',
    { params: { page, pageSize, activeOnly: true, displayInPosOnly: true } },
  )
  return unwrap(data)
}

export async function fetchCategoriesPage(page: number, pageSize: number) {
  const { data } = await api.get<ApiEnvelope<{ categories: unknown[]; totalCount: number }>>(
    '/api/categories',
    { params: { page, pageSize, activeOnly: true, displayInPosOnly: true } },
  )
  return unwrap(data)
}

export async function fetchOutletsPage(page: number, pageSize: number) {
  const { data } = await api.get<ApiEnvelope<{ outlets: unknown[]; totalCount: number }>>(
    '/api/outlets',
    { params: { page, pageSize, activeOnly: true } },
  )
  return unwrap(data)
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

export async function submitTransfer(id: string) {
  const { data } = await api.post<ApiEnvelope<unknown>>(`/api/transfers/${id}/submit`)
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

export async function submitDeliveryReturn(id: string) {
  const { data } = await api.post<ApiEnvelope<unknown>>(`/api/delivery-returns/${id}/submit`)
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
