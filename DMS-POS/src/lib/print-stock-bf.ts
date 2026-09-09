import { isElectronPos } from './print-receipt'
import { THERMAL_SLIP_CSS } from './thermal-slip'

export type StockBfPrintLine = {
  code: string
  name: string
  qty: number
}

export type StockBfPrintOpts = {
  showroom: string
  cashier: string
  submittedAt: string
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
  const rows = opts.lines
    .map(
      (l) =>
        `<tr>
          <td class="code">${escapeHtml(l.code)}</td>
          <td class="item">${escapeHtml(l.name)}</td>
          <td class="qty">${Number(l.qty)}</td>
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
  font-size:13px;
  line-height:1.4;
}
.header{text-align:center;margin-bottom:6px}
.title{font-size:16px;font-weight:800;margin:4px 0 8px;letter-spacing:0.02em;text-align:center}
.divider{border-top:2px dashed #000;margin:6px 0}
.info-line{font-size:12px;font-weight:400;margin:3px 0;overflow-wrap:anywhere}
table{font-size:12px;margin:6px 0}
th{padding:4px 2px;font-weight:700;border-bottom:2px dashed #000;vertical-align:bottom;font-size:11px}
td{padding:5px 2px;vertical-align:top;font-weight:400;font-size:12px}
.code{width:24%;text-align:left;white-space:nowrap}
.item{width:52%;text-align:left;white-space:normal;padding-right:3px}
.qty{width:24%;text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
.sig{margin-top:12px;font-size:12px;font-weight:400;line-height:1.35}
.sig .name{font-weight:700;margin-bottom:4px;text-align:center}
.sig .dots{border-bottom:1px dotted #000;height:14px;width:100%;margin-top:8px}
.sig .cap{text-align:center;font-size:11px;margin-top:2px}
</style></head><body>
<div class="slip">
<div class="header">
  <div class="title">STOCK BF</div>
</div>
<div class="divider"></div>
<div class="info-line">Showroom: ${escapeHtml(opts.showroom)}</div>
<div class="info-line">Cashier: ${escapeHtml(opts.cashier)}</div>
<div class="info-line">Submitted: ${escapeHtml(opts.submittedAt)}</div>
<div class="divider"></div>
<table>
  <colgroup>
    <col style="width:24%">
    <col style="width:52%">
    <col style="width:24%">
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
  <div class="name">Submitted By</div>
  <div>${escapeHtml(opts.cashier)}</div>
  <div class="dots"></div>
  <div class="cap">Submitted By Signature</div>
</div>
<div class="sig">
  <div class="name">Accepted By</div>
  <div class="dots"></div>
  <div class="cap">Accepted By Name</div>
  <div class="dots"></div>
  <div class="cap">Accepted By Signature</div>
</div>
</div>
</body></html>`
}

function printViaIframe(html: string): Promise<boolean> {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe')
    iframe.setAttribute('aria-hidden', 'true')
    iframe.style.cssText =
      'position:fixed;left:-10000px;top:0;width:320px;height:1200px;border:0;opacity:0;pointer-events:none'
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
