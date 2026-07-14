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
          <td style="padding:4px 0">${escapeHtml(l.name)}</td>
          <td style="text-align:right;padding:4px 8px">${l.unitPrice.toFixed(2)}</td>
          <td style="text-align:center;padding:4px 8px">${l.qty}</td>
          <td style="text-align:right;padding:4px 0">${l.amount.toFixed(2)}</td>
        </tr>`,
    )
    .join('')
  
  const totalItems = opts.lines.length
  const totalQty = opts.lines.reduce((sum, l) => sum + l.qty, 0)
  
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
table{width:100%;border-collapse:collapse;font-size:10px;margin:6px 0}
th{text-align:left;padding:3px 0;font-weight:bold;border-bottom:1px dashed #000}
th.center{text-align:center}
th.right{text-align:right}
td{padding:4px 0}
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
      <th>Item</th>
      <th class="right">Each</th>
      <th class="center">Qty</th>
      <th class="right">Total</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>
<div class="divider"></div>
<div class="totals">
  <div class="total-row main">
    <span>TOTAL</span>
    <span>${opts.total.toFixed(2)}</span>
  </div>
  <div class="total-row">
    <span>CASH</span>
    <span>${opts.cash.toFixed(2)}</span>
  </div>
  <div class="total-row">
    <span>CHANGE</span>
    <span>${opts.change.toFixed(2)}</span>
  </div>
</div>
<div class="divider"></div>
<div class="item-count">No of Items : ${totalItems}  Total Qty : ${totalQty}</div>
<div class="divider"></div>
${extraFooter}
<div class="thank-you">THANK YOU!</div>
</body></html>`
}

/**
 * Prints a receipt silently (direct to printer without dialog) when in Electron,
 * or opens the system print dialog in web/dev mode.
 *
 * Uses a hidden iframe instead of `window.open('')` so Electron’s
 * `setWindowOpenHandler` + `shell.openExternal` does not receive `about:blank`
 * (which triggers Windows “open this about link” errors).
 */
export async function printReceiptHtml(opts: PrintReceiptOpts): Promise<boolean> {
  const html = buildReceiptDocumentHtml(opts)

  console.log('[PRINT] Environment check - window.dmsPos:', !!window.dmsPos)
  console.log('[PRINT] window.dmsPos.printSilent:', !!window.dmsPos?.printSilent)
  console.log('[PRINT] window.dmsPos.mode:', window.dmsPos?.mode)

  // Check if running in Electron with silent print capability
  if (window.dmsPos?.printSilent) {
    try {
      console.log('[PRINT] Using Electron print...')
      console.log('[PRINT] Receipt data:', { 
        total: opts.total, 
        cash: opts.cash, 
        change: opts.change, 
        lines: opts.lines.length 
      })
      const result = await window.dmsPos.printSilent(html)
      console.log('[PRINT] Electron print result:', result)
      
      if (!result || !result.success) {
        console.error('[PRINT] Print failed or was cancelled:', result?.error)
        alert('Print failed: ' + (result?.error || 'Unknown error. Check if a printer is configured.'))
        return false
      }
      
      return true
    } catch (error) {
      console.error('[PRINT] Electron print exception:', error)
      alert('Print error: ' + error)
      return false
    }
  }
  
  // Fallback for browser/dev mode
  console.log('[PRINT] Using browser print dialog')

  // Fallback to regular print dialog (web mode or if silent print fails)
  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.cssText =
    'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none'
  document.body.appendChild(iframe)

  const win = iframe.contentWindow
  const doc = iframe.contentDocument
  if (!win || !doc) {
    iframe.remove()
    return false
  }

  doc.open()
  doc.write(html)
  doc.close()

  const cleanup = () => {
    iframe.remove()
  }

  let leakGuard: ReturnType<typeof setTimeout> | undefined

  const printNow = () => {
    try {
      win.focus()
      win.print()
    } catch {
      cleanup()
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

  return true
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
