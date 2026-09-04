export type PrintReceiptOpts = {
  title: string
  companyAddress?: string
  companyPhone?: string
  outletLabel: string
  lines: { name: string; unitPrice: number; qty: number; amount: number }[]
  total: number
  cash: number
  change: number
  paymentMethod?: string
  saleNo?: string
  cashier?: string
  dateTime?: string
  /** Extra lines above the default thank-you footer (e.g. returns policy) */
  footerLines?: string[]
}

/** Full HTML document for the receipt (no inline print script — caller triggers print). */
function buildReceiptDocumentHtml(opts: PrintReceiptOpts): string {
  const rows = opts.lines
    .map(
      (l) =>
        `<tr>
          <td class="item">${escapeHtml(l.name)}</td>
          <td class="each">${Number(l.unitPrice).toFixed(2)}</td>
          <td class="qty">${Number(l.qty)}</td>
          <td class="tot">${Number(l.amount).toFixed(2)}</td>
        </tr>`,
    )
    .join('')

  const totalItems = opts.lines.length
  const totalQty = opts.lines.reduce((sum, l) => sum + Number(l.qty || 0), 0)

  const extraFooter = (opts.footerLines ?? [])
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => `<div style="text-align:center;font-size:10px;line-height:1.3;margin:2px 0">${escapeHtml(l)}</div>`)
    .join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receipt</title>
<style>
@media print {
  @page { margin: 5mm; size: 80mm auto; }
  body { margin: 0; }
}
body{font-family:'Courier New',monospace;padding:8px;max-width:300px;margin:0 auto;color:#000;font-size:11px;line-height:1.4}
.header{text-align:center;margin-bottom:8px}
.company-name{font-size:14px;font-weight:bold;margin:2px 0}
.company-info{font-size:9px;margin:2px 0}
.divider{border-top:1px dashed #000;margin:6px 0}
.info-line{font-size:10px;margin:2px 0}
table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:10px;margin:6px 0}
th{padding:3px 0;font-weight:bold;border-bottom:1px dashed #000;vertical-align:bottom}
td{padding:5px 0;vertical-align:top}
.item{width:46%;text-align:left;white-space:normal;word-wrap:break-word;overflow-wrap:anywhere;padding-right:8px}
.each{width:20%;text-align:right;padding-left:10px;white-space:nowrap}
.qty{width:12%;text-align:center;padding-left:8px;padding-right:8px;white-space:nowrap}
.tot{width:22%;text-align:right;padding-left:10px;white-space:nowrap}
.totals{margin-top:6px;border-top:1px dashed #000;padding-top:6px}
.total-row{display:flex;justify-content:space-between;margin:3px 0;font-size:11px}
.total-row.main{font-weight:bold;font-size:12px}
.item-count{font-size:10px;margin:6px 0;text-align:left}
.footer{text-align:center;margin-top:12px;font-size:10px;line-height:1.3}
.thank-you{font-weight:bold;font-size:12px;margin:8px 0}
.powered-by{font-size:9px;font-style:italic;margin-top:8px}
</style></head><body>
<div class="header">
  <div class="company-name">${escapeHtml(opts.title)}</div>
  ${opts.companyAddress ? `<div class="company-info">${escapeHtml(opts.companyAddress).replace(/\n/g, '<br>')}</div>` : ''}
  ${opts.companyPhone ? `<div class="company-info">${escapeHtml(opts.companyPhone)}</div>` : ''}
</div>
<div class="divider"></div>
<div class="info-line">Showroom : ${escapeHtml(opts.outletLabel)}</div>
${opts.dateTime ? `<div class="info-line">Date: ${escapeHtml(opts.dateTime)}</div>` : ''}
${opts.cashier ? `<div class="info-line">Cashier: ${escapeHtml(opts.cashier)}</div>` : ''}
${opts.saleNo ? `<div class="info-line">Bill No: ${escapeHtml(opts.saleNo)}</div>` : ''}
<div class="divider"></div>
<table>
  <thead>
    <tr>
      <th class="item">Item</th>
      <th class="each">Each</th>
      <th class="qty">Qty</th>
      <th class="tot">Total</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>
<div class="divider"></div>
<div class="totals">
  <div class="total-row main">
    <span>TOTAL</span>
    <span>${Number(opts.total).toFixed(2)}</span>
  </div>
  <div class="total-row">
    <span>CASH</span>
    <span>${Number(opts.cash).toFixed(2)}</span>
  </div>
  <div class="total-row">
    <span>CHANGE</span>
    <span>${Number(opts.change).toFixed(2)}</span>
  </div>
</div>
<div class="divider"></div>
<div class="item-count">No of Items : ${totalItems}  Total Qty : ${totalQty}</div>
<div class="divider"></div>
${extraFooter}
<div class="thank-you">THANK YOU!</div>
</body></html>`
}

function printViaIframe(html: string): Promise<boolean> {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe')
    iframe.setAttribute('aria-hidden', 'true')
    iframe.style.cssText =
      'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none'
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

    const cleanup = () => {
      iframe.remove()
    }

    let leakGuard: ReturnType<typeof setTimeout> | undefined
    let settled = false
    const finish = (ok: boolean) => {
      if (settled) return
      settled = true
      if (leakGuard) clearTimeout(leakGuard)
      cleanup()
      resolve(ok)
    }

    const printNow = () => {
      try {
        win.focus()
        win.print()
        // Dialog opened — treat as success (cancel is still a successful open)
        finish(true)
      } catch {
        finish(false)
      }
    }

    win.addEventListener(
      'afterprint',
      () => {
        if (leakGuard) clearTimeout(leakGuard)
        cleanup()
      },
      { once: true },
    )

    leakGuard = setTimeout(() => {
      leakGuard = undefined
      cleanup()
    }, 120_000)

    const schedulePrint = () => setTimeout(printNow, 50)

    if (doc.readyState === 'complete') {
      schedulePrint()
    } else {
      win.addEventListener('load', schedulePrint, { once: true })
    }
  })
}

/**
 * Prints a receipt: Electron sends silently to the default printer;
 * browser mode falls back to the system print dialog.
 */
/** Desktop POS client (Electron). Browser/sample UI is everything else. */
export function isElectronPos() {
  return typeof window !== 'undefined' && window.dmsPos?.mode === 'electron'
}

export async function printReceiptHtml(
  opts: PrintReceiptOpts,
  flags?: { silentOnly?: boolean },
): Promise<boolean> {
  const html = buildReceiptDocumentHtml(opts)

  if (isElectronPos() && window.dmsPos?.printSilent) {
    try {
      const result = await window.dmsPos.printSilent(html)
      if (result?.success) return true
      console.warn('[PRINT] Silent print failed:', result?.error)
    } catch (error) {
      console.warn('[PRINT] Silent print exception:', error)
    }
    return false
  }

  if (flags?.silentOnly) return false
  return printViaIframe(html)
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
