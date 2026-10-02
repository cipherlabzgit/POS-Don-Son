import { isElectronPos } from './print-receipt'
import { RECEIPT_COMPANY_NAME } from './receipt-company'
import { formatStockBfQty } from './stock-bf-qty'
import { signatureWriteFieldHtml, extraLineFeedsHtml, THERMAL_SLIP_CSS, THERMAL_WIDTH_PX } from './thermal-slip'

export type StockBfPrintLine = {
  code: string
  name: string
  qty: number
}

export type StockBfPrintOpts = {
  companyName?: string
  /** Showroom / branch name (second header line). */
  showroom: string
  user: string
  dateLabel: string
  bfNo: string
  lines: StockBfPrintLine[]
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildStockBfDocumentHtml(opts: StockBfPrintOpts): string {
  const company = opts.companyName?.trim() || RECEIPT_COMPANY_NAME
  const bfNoLine = opts.bfNo.trim() ? escapeHtml(opts.bfNo.trim()) : '—'

  const rows = opts.lines
    .map(
      (l) =>
        `<tr>
          <td class="code">${escapeHtml(l.code)}</td>
          <td class="item">${escapeHtml(l.name)}</td>
          <td class="qty">${formatStockBfQty(Number(l.qty))}</td>
        </tr>`,
    )
    .join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Stock BF</title>
<style>
${THERMAL_SLIP_CSS}
body{
  font-family:Arial,Helvetica,'Segoe UI',sans-serif;
  font-weight:400;
  color:#000;
  font-size:14px;
  line-height:1.45;
}
.header{text-align:center;margin-bottom:4px}
.company-name{font-size:17px;font-weight:800;margin:2px 0;letter-spacing:0.01em;text-align:center}
.showroom-line{font-size:14px;font-weight:700;margin:2px 0 6px;text-align:center}
.title{font-size:16px;font-weight:800;margin:6px 0 8px;letter-spacing:0.02em;text-align:center}
.divider{border-top:2px dashed #000;margin:6px 0}
.info-line{font-size:13px;font-weight:400;margin:4px 0;overflow-wrap:anywhere}
.info-line strong{font-weight:700}
table{font-size:14px;margin:8px 0;border-collapse:collapse;width:100%}
th{padding:5px 3px;font-weight:700;border:1px solid #000;vertical-align:middle;font-size:13px;background:#fff}
td{padding:6px 3px;vertical-align:top;font-weight:400;font-size:14px;border:1px solid #000}
.code{text-align:left;white-space:nowrap}
.item{text-align:left;white-space:normal;padding-right:3px}
.qty{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums;font-weight:600}
.sig{margin-top:12px;font-size:13px;font-weight:400;line-height:1.35;text-align:center}
.sig .name{font-weight:700;margin-bottom:2px;text-align:center}
.sig .cashier{margin-bottom:2mm;text-align:center}
</style></head><body>
<div class="slip cols-3">
<div class="header">
  <div class="company-name">${escapeHtml(company)}</div>
  <div class="showroom-line">${escapeHtml(opts.showroom)}</div>
  <div class="title">Stock BF Details</div>
</div>
<div class="divider"></div>
<div class="info-line"><strong>Date</strong> : ${escapeHtml(opts.dateLabel)}</div>
<div class="info-line"><strong>BF No</strong> : ${bfNoLine}</div>
<div class="info-line"><strong>User</strong> : ${escapeHtml(opts.user)}</div>
<div class="divider"></div>
<table>
  <colgroup>
    <col style="width:18mm">
    <col>
    <col style="width:14mm">
  </colgroup>
  <thead>
    <tr>
      <th class="code">Code</th>
      <th class="item">Item</th>
      <th class="qty">Qty</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>
<div class="divider"></div>
<div class="sig">
  <div class="name">Entered By</div>
  <div class="cashier">${escapeHtml(opts.user)}</div>
  ${signatureWriteFieldHtml('Entered By Signature')}
</div>
<div class="sig">
  <div class="name">Accepted By</div>
  ${signatureWriteFieldHtml('Accepted By Name')}
  ${signatureWriteFieldHtml('Accepted By Signature')}
</div>
${extraLineFeedsHtml(2)}
</div>
</body></html>`
}

function printViaIframe(html: string): Promise<boolean> {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe')
    iframe.setAttribute('aria-hidden', 'true')
    iframe.style.cssText =
      `position:fixed;left:-10000px;top:0;width:${THERMAL_WIDTH_PX}px;height:1200px;border:0;opacity:0;pointer-events:none`
    document.body.appendChild(iframe)
    const win = iframe.contentWindow
    const doc = iframe.contentDocument
    if (!win || !doc) {
      iframe.remove()
      resolve(false)
      return
    }
    doc.open()
    doc.write(html)
    doc.close()
    const printNow = () => {
      try {
        win.focus()
        win.print()
        iframe.remove()
        resolve(true)
      } catch {
        iframe.remove()
        resolve(false)
      }
    }
    const schedulePrint = () => setTimeout(printNow, 50)
    if (doc.readyState === 'complete') schedulePrint()
    else win.addEventListener('load', schedulePrint, { once: true })
  })
}

export async function printStockBfHtml(opts: StockBfPrintOpts): Promise<boolean> {
  const html = buildStockBfDocumentHtml(opts)
  if (isElectronPos() && window.dmsPos?.printSilent) {
    try {
      const result = await window.dmsPos.printSilent(html)
      if (result?.success) return true
      console.warn('[PRINT] Stock BF silent print failed:', result?.error)
    } catch (error) {
      console.warn('[PRINT] Stock BF silent print exception:', error)
    }
    return false
  }
  return printViaIframe(html)
}

export function extractBfNoFromBulkResponse(res: unknown): string {
  if (!res || typeof res !== 'object') return ''
  const envelope = res as Record<string, unknown>
  const list = envelope.stockBFs ?? envelope.StockBFs ?? envelope.data ?? envelope
  if (!Array.isArray(list) || list.length === 0) return ''
  const first = list[0] as Record<string, unknown>
  return String(first.bfNo ?? first.BFNo ?? '').trim()
}
