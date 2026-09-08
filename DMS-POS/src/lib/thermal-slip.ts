/**
 * 80mm thermal rolls have a smaller printable area than the paper width.
 * Keep the page at 80mm and center a narrower slip so both edges stay clear.
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
  width:62mm;
  max-width:62mm;
  margin:0 auto;
  padding:2mm 0 12mm;
  overflow-x:hidden;
}
.slip table{width:100%;max-width:100%;border-collapse:collapse;table-layout:fixed}
.slip th,.slip td{overflow-wrap:anywhere;word-wrap:break-word}
`
