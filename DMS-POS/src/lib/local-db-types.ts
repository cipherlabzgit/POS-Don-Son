/** Local sale record (stored when offline or for history) */
export interface LocalSale {
  id: string
  outletId: string
  paymentMethod: string
  total: number
  lines: { productId: string; name: string; qty: number; unitPrice: number }[]
  createdAt: number
  synced: boolean
  saleNo?: string
  /** Server PosSale.Id after sync */
  serverSaleId?: string
  /** Last known workflow status from API (e.g. Pending, Approved, Rejected) */
  status?: string
  rejectionReason?: string
}

/** Local stock-BF record */
export interface LocalStockBf {
  id: string
  outletId: string
  processDate: string
  lines: { productId: string; code: string; name: string; qty: number }[]
  createdAt: number
  synced: boolean
}

/** Local transfer record (reserved for future offline transfers) */
export interface LocalTransfer {
  id: string
  fromOutletId: string
  toOutletId: string
  transferDate: string
  notes?: string
  lines: { productId: string; code: string; name: string; quantity: number }[]
  createdAt: number
  synced: boolean
}

/** Pending mutation removed after max retries */
export interface DroppedMutationRecord {
  id: string
  type: string
  payload: unknown
  createdAt: number
  droppedAt: number
  retryCount: number
}
