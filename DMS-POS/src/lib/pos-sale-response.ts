import type { LocalSale } from './local-db-types'

type ApiLine = {
  productId?: string
  productName?: string
  quantity?: number
  lineTotal?: number
  unitPrice?: number
}

/** Normalizes POST / GET PosSale detail payloads (camelCase from ASP.NET). */
export function parsePosSaleDetailPayload(raw: unknown): {
  saleNo?: string
  serverSaleId?: string
  status?: string
  rejectionReason?: string
  lines?: ApiLine[]
} {
  if (!raw || typeof raw !== 'object') return {}
  const o = raw as Record<string, unknown>
  const id = o.id ?? o.Id
  const linesRaw = o.lines ?? o.Lines
  const lines = Array.isArray(linesRaw) ? (linesRaw as ApiLine[]) : undefined
  return {
    saleNo: o.saleNo != null ? String(o.saleNo) : o.SaleNo != null ? String(o.SaleNo) : undefined,
    serverSaleId: id != null ? String(id) : undefined,
    status: o.status != null ? String(o.status) : o.Status != null ? String(o.Status) : undefined,
    rejectionReason:
      o.rejectionReason != null
        ? String(o.rejectionReason)
        : o.RejectionReason != null
          ? String(o.RejectionReason)
          : undefined,
    lines,
  }
}

export function localLinesFromPosSaleApi(apiLines: ApiLine[]): LocalSale['lines'] {
  return apiLines.map((l) => {
    const qty = Number(l.quantity ?? 0)
    const lt = l.lineTotal != null ? Number(l.lineTotal) : undefined
    const up = l.unitPrice != null ? Number(l.unitPrice) : qty > 0 && lt != null ? lt / qty : 0
    return {
      productId: String(l.productId ?? ''),
      name: String(l.productName ?? ''),
      qty,
      unitPrice: up,
    }
  })
}
