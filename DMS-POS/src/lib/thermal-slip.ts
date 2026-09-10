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
`
