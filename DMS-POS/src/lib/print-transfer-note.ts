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
  comment?: string
  lines: TransferNoteLine[]
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatQty(qty: number): string {
  return Number(qty).toFixed(2)
}

/** Match sample: Sep 07, 2026 03:05:12 PM */
function formatDateTime(value: string): string {
  const parsed = new Date(value)
  const d = Number.isNaN(parsed.getTime()) ? new Date() : parsed
  const formatted = d.toLocaleString('en-US', {
    timeZone: 'Asia/Colombo',
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
  return formatted.replace(',', '')
}

function commentText(comment?: string): string {
  const t = (comment ?? '').trim()
  return t || '-'
}

function dottedLine(caption: string): string {
  return `<div class="sig-block">
  <div class="dots"></div>
  <div class="sig-caption">${escapeHtml(caption)}</div>
</div>`
}

function buildTransferNoteHtml(opts: TransferNoteOpts, variant: 'original' | 'copy'): string {
  const stamp = variant === 'original' ? 'TRANSFER ORIGINAL' : 'TRANSFER COPY'
  const rows = opts.lines
    .map(
      (l) =>
        `<tr>
          <td class="code">${escapeHtml(l.code)}</td>
          <td class="item">${escapeHtml(l.name)}</td>
          <td class="qty">${formatQty(l.qty)}</td>
        </tr>`,
    )
    .join('')

  const footer =
    variant === 'original'
      ? `<div class="meta">Send By : ${escapeHtml(opts.submittedBy)}</div>
<div class="sig-row">
  <div class="sig-label">Send By :</div>
  ${dottedLine('Signature')}
</div>
<div class="sig-row">
  <div class="sig-label">Received By :</div>
  ${dottedLine('Name')}
</div>
<div class="sig-row">
  <div class="sig-label">Received By :</div>
  ${dottedLine('Signature')}
</div>`
      : `<div class="meta">Send By : ${escapeHtml(opts.submittedBy)}</div>`

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${stamp}</title>
<style>
html,body{width:80mm;max-width:80mm;height:auto!important;overflow:visible!important;background:#fff}
@media print {
  @page { margin: 0; size: 80mm auto; }
  html,body{width:80mm;max-width:80mm;height:auto!important;overflow:visible!important;margin:0}
  *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
}
*{box-sizing:border-box;color:#000!important;-webkit-font-smoothing:none;font-smooth:never;text-rendering:geometricPrecision}
body{
  width:80mm;
  font-family:'Times New Roman',Times,Georgia,serif;
  font-weight:400;
  padding:2mm 3mm 14mm;
  margin:0;
  color:#000;
  font-size:13px;
  line-height:1.35;
}
.title{text-align:center;font-size:20px;font-weight:700;margin:2px 0 8px}
.stamp{text-align:center;font-size:15px;font-weight:700;letter-spacing:0.04em;margin:8px 0 6px}
.meta{font-size:13px;margin:2px 0}
table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:12px;margin:4px 0 10px}
th,td{border:1px solid #000;padding:4px 3px;vertical-align:top}
th{font-weight:700;text-align:center}
td.code{width:18%;text-align:left;white-space:nowrap}
td.item{width:62%;text-align:left;white-space:normal;word-wrap:break-word;overflow-wrap:anywhere}
td.qty{width:20%;text-align:right;white-space:nowrap}
.sig-row{display:flex;align-items:flex-end;gap:4px;margin-top:12px}
.sig-label{flex:0 0 auto;white-space:nowrap;padding-bottom:2px}
.sig-block{flex:1;min-width:0}
.dots{border-bottom:1px dotted #000;height:16px}
.sig-caption{text-align:right;font-size:11px;margin-top:1px}
.cut-feed{height:16mm}
</style></head><body>
<div class="title">Transfer Note</div>
<div class="meta">Transfer No : ${escapeHtml(opts.transferNo)}</div>
<div class="meta">Transfer From : ${escapeHtml(opts.fromShowroom)}</div>
<div class="meta">Date &amp; Time : ${escapeHtml(formatDateTime(opts.submittedAt))}</div>
<div class="meta">Transfer To : ${escapeHtml(opts.toShowroom)}</div>
<div class="meta">Comment : ${escapeHtml(commentText(opts.comment))}</div>
<div class="stamp">${stamp}</div>
<table>
  <thead>
    <tr>
      <th class="code">CODE</th>
      <th class="item">ITEM</th>
      <th class="qty">QTY</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>
${footer}
<div class="cut-feed"></div>
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

/** Prints TRANSFER ORIGINAL, waits for the cutter, then prints TRANSFER COPY. */
export async function printTransferNotes(opts: TransferNoteOpts): Promise<void> {
  await printOne(buildTransferNoteHtml(opts, 'original'))
  await new Promise((r) => setTimeout(r, 3500))
  await printOne(buildTransferNoteHtml(opts, 'copy'))
}
