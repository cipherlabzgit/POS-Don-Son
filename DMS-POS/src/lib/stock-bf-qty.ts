/** Thermal Stock BF qty — legacy format e.g. 01.00, 12.00 */
export function formatStockBfQty(q: number): string {
  if (!Number.isFinite(q)) return '00.00'
  const fixed = q.toFixed(2)
  const [intPart, decPart] = fixed.split('.')
  return `${intPart.padStart(2, '0')}.${decPart}`
}

export function normalizeStockBfQtyInput(raw: string): string {
  const qn = parseFloat(String(raw).trim().replace(',', '.'))
  if (!Number.isFinite(qn) || qn <= 0) return raw.trim()
  return formatStockBfQty(qn)
}

export function parseStockBfQty(raw: string): number | null {
  const qn = parseFloat(String(raw).trim().replace(',', '.'))
  if (!Number.isFinite(qn) || qn <= 0) return null
  return qn
}
