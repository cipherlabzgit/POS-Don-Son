import { isElectronPos } from './print-receipt'

export type TransferNoteLine = {
  code: string
  name: string
  qty: number
}

export type TransferNoteOpts = {
  transferNo: string
  submittedAt: string
  fromShowroom: string
  toShowroom: string
  submittedBy: string
  lines: TransferNoteLine[]
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildTransferNoteHtml(opts: TransferNoteOpts, variant: 'original' | 'copy'): string {
  const header = variant === 'original' ? 'TRANSFER ORIGINAL' : 'TRANSFER COPY'
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

  const signatures =
    variant === 'original'
      ? `<div class="divider"></div>
<div class="info-line"><strong>Submitted by</strong></div>
<div class="info-line">${escapeHtml(opts.submittedBy)}</div>
<div class="sig">Submitted by signature<br>______________________________</div>
<div class="sig">Received by<br>______________________________</div>
<div class="sig">Received By Signature<br>______________________________</div>`
      : `<div class="divider"></div>
<div class="info-line"><strong>Submitted by</strong></div>
<div class="info-line">${escapeHtml(opts.submittedBy)}</div>`

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${header}</title>
<style>
html,body{width:80mm;max-width:80mm;height:auto!important;overflow:visible!important;background:#fff}
@media print {
  @page { margin: 0; size: 80mm auto; }
  html,body{width:80mm;max-width:80mm;height:auto!important;overflow:visible!important;margin:0}
}
body{font-family:'Courier New',monospace;padding:4mm 3mm 12mm;margin:0;color:#000;font-size:11px;line-height:1.4;box-sizing:border-box}
.header{text-align:center;margin-bottom:8px}
.note-title{font-size:15px;font-weight:bold;letter-spacing:0.04em;margin:4px 0 8px}
.divider{border-top:1px dashed #000;margin:6px 0}
.info-line{font-size:10px;margin:2px 0}
table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:10px;margin:6px 0}
th{padding:3px 0;font-weight:bold;border-bottom:1px dashed #000;vertical-align:bottom;text-align:left}
td{padding:5px 0;vertical-align:top}
.code{width:28%;text-align:left;white-space:nowrap}
.item{width:52%;text-align:left;white-space:normal;word-wrap:break-word;overflow-wrap:anywhere;padding-right:6px}
.qty{width:20%;text-align:right;white-space:nowrap}
.sig{margin-top:14px;font-size:10px;line-height:1.35}
</style></head><body>
<div class="header">
  <div class="note-title">${header}</div>
</div>
<div class="divider"></div>
<div class="info-line">Submitted: ${escapeHtml(opts.submittedAt)}</div>
<div class="info-line">Transfer Note: ${escapeHtml(opts.transferNo)}</div>
<div class="info-line">Showroom From: ${escapeHtml(opts.fromShowroom)}</div>
<div class="info-line">Showroom To: ${escapeHtml(opts.toShowroom)}</div>
<div class="divider"></div>
<table>
  <thead>
    <tr>
      <th class="code">Item Code</th>
      <th class="item">Item</th>
      <th class="qty">Qty</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>
${signatures}
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

async function printOne(html: string): Promise<void> {
  if (isElectronPos() && window.dmsPos?.printSilent) {
    try {
      const result = await window.dmsPos.printSilent(html)
      if (result?.success) return
      console.warn('[PRINT] Transfer note silent print failed:', result?.error)
    } catch (error) {
      console.warn('[PRINT] Transfer note silent print exception:', error)
    }
  }
  await printViaIframe(html)
}

/** Prints TRANSFER ORIGINAL then TRANSFER COPY. */
export async function printTransferNotes(opts: TransferNoteOpts): Promise<void> {
  await printOne(buildTransferNoteHtml(opts, 'original'))
  await new Promise((r) => setTimeout(r, 600))
  await printOne(buildTransferNoteHtml(opts, 'copy'))
}
