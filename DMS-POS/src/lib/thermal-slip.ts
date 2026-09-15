/** 80mm thermal paper. Keep page size and content width the same. */
export const THERMAL_WIDTH_MM = 80
export const THERMAL_WIDTH_PX = Math.round((THERMAL_WIDTH_MM / 25.4) * 96)

/**
 * Shared 80mm slip for every POS bill: sale, Stock BF, transfer, return.
 * XP-80C clips ~12–16mm on the right of the roll. Keep the sheet 80mm and
 * inset the slip so Total / Qty / CASH / CHANGE stay on the printable area.
 */
export const THERMAL_SLIP_CSS = `
html,body{
  width:80mm;
  max-width:80mm;
  margin:0;
  padding:0;
  background:#fff;
  overflow-x:hidden!important;
  height:auto!important;
}
@media print {
  @page { margin: 0; size: 80mm auto; }
  html,body{width:80mm;max-width:80mm;margin:0;padding:0;overflow-x:hidden!important;height:auto!important}
  *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
}
*{box-sizing:border-box;color:#000!important;-webkit-font-smoothing:none;font-smooth:never;text-rendering:geometricPrecision}
.slip{
  width:80mm;
  max-width:80mm;
  margin:0;
  padding:1mm 14mm 5mm 2.5mm;
  overflow-x:hidden;
}
.slip table{width:100%;max-width:100%;border-collapse:collapse;table-layout:fixed}
.slip th,.slip td{overflow-wrap:anywhere;word-wrap:break-word}
.slip tbody td{font-weight:400!important}
.slip .item{text-align:left;white-space:normal;padding-right:2px}
.slip .each,.slip .tot,.slip .qty{white-space:nowrap;font-variant-numeric:tabular-nums}
.slip .each,.slip .tot{text-align:right}
.slip .code{text-align:left;white-space:normal;overflow-wrap:anywhere}
.slip.cols-4 .item{width:auto}
.slip.cols-4 .each{width:15mm;padding-right:2px}
.slip.cols-4 .qty{width:8mm;text-align:center;padding-right:2px}
.slip.cols-4 .tot{width:16mm}
.slip.cols-3 .code{width:16mm}
.slip.cols-3 .item{width:auto;padding-right:3px}
.slip.cols-3 .qty{width:12mm;text-align:right}
.sig-field{width:100%;margin:2mm 0 1mm}
.slip table.sig-pad{
  width:100%;
  border-collapse:collapse;
  table-layout:fixed;
  margin:0;
}
.slip table.sig-pad td{
  padding:0 !important;
  border:none !important;
  font-size:8mm !important;
  line-height:8mm !important;
  height:8mm !important;
  vertical-align:top;
}
.slip table.sig-pad td.bar{
  width:3px;
  overflow:hidden;
}
.sig-dots{
  border-bottom:1px dotted #000;
  width:100%;
  font-size:10px;
  line-height:4mm;
  height:4mm;
  margin:0;
}
.sig-cap{
  text-align:center;
  font-size:11px;
  margin:1.5mm 0 7mm;
}
`

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Signature write-gap. XP-80C drops empty CSS / &lt;br&gt; / empty cells.
 * Four ink glyphs (`|`) at 8mm keep ~32mm of paper for a name or signature.
 */
export function signatureWriteFieldHtml(caption: string): string {
  const gapRows = Array.from(
    { length: 4 },
    () =>
      `<tr><td class="bar" style="font-size:8mm;line-height:8mm;height:8mm">|</td><td class="gap" style="font-size:8mm;line-height:8mm;height:8mm">&nbsp;</td></tr>`,
  ).join('')
  return `<div class="sig-field">
  <table class="sig-pad">
    <colgroup><col style="width:3px"><col></colgroup>
    ${gapRows}
  </table>
  <div class="sig-dots">&nbsp;</div>
  <div class="sig-cap">${escapeHtml(caption)}</div>
</div>`
}
