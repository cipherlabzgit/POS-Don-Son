export interface ApiEnvelope<T> {
  success: boolean
  data: T
  error?: { message?: string; code?: string }
  timestamp: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: User
  expiresIn: number
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  isSuperAdmin: boolean
  isActive: boolean
  permissions: string[]
  roles: { id: string; name: string }[]
}

export interface ProductRow {
  id: string
  code: string
  name: string
  unitPrice: number
  categoryId: string
  categoryName: string
  sortOrder: number
  /** When false, product must not appear on Stock BF entry (synced from server). */
  requireOpenStock: boolean
}

export interface CategoryRow {
  id: string
  name: string
  code?: string
  sortOrder: number
}

export interface OutletRow {
  id: string
  code: string
  name: string
}

export interface CartLine {
  productId: string
  code: string
  name: string
  unitPrice: number
  qty: number
}

export interface CreatePosSalePayload {
  outletId: string
  soldAt?: string
  paymentMethod: string
  clientMutationId?: string
  lines: { productId: string; quantity: number; unitPrice: number }[]
}

export type PendingMutationType =
  | 'pos-sale'
  | 'stock-bf-bulk'
  | 'transfer'
  | 'delivery-return'
  | 'cashier-balance'

export interface PendingMutation {
  id: string
  type: PendingMutationType
  payload: unknown
  createdAt: number
  retryCount: number
}
