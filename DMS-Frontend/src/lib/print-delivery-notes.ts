import type { Delivery, DeliveryItem } from '@/lib/api/deliveries';
import { formatSlDateTime } from './sri-lanka-time';

export const DN_PAGE_ROWS = 12;
export const DN_PAGE_WIDTH_IN = 5;
export const DN_PAGE_HEIGHT_IN = 5;

function pick<T = unknown>(raw: Record<string, unknown>, ...keys: string[]): T | undefined {
  for (const k of keys) {
    if (raw[k] !== undefined && raw[k] !== null) return raw[k] as T;
  }
  return undefined;
}

/** API may return PascalCase; normalize so print HTML always has data. */
export function normalizeDeliveryFromApi(raw: Record<string, unknown>): Delivery {
  const itemsRaw = pick<unknown[]>(raw, 'items', 'Items');
  const items: DeliveryItem[] | undefined = Array.isArray(itemsRaw)
    ? itemsRaw.map((row: Record<string, unknown>) => ({
        id: String(pick(row, 'id', 'Id') ?? ''),
        productId: String(pick(row, 'productId', 'ProductId') ?? ''),
        productName: String(pick(row, 'productName', 'ProductName') ?? ''),
        quantity: Number(pick(row, 'quantity', 'Quantity') ?? 0),
        unitPrice: Number(pick(row, 'unitPrice', 'UnitPrice') ?? 0),
        total: Number(pick(row, 'total', 'Total') ?? 0),
        product: pick(row, 'product', 'Product') as DeliveryItem['product'],
      }))
    : undefined;

  return {
    id: String(pick(raw, 'id', 'Id') ?? ''),
    deliveryNo: String(pick(raw, 'deliveryNo', 'DeliveryNo') ?? ''),
    deliveryDate: String(pick(raw, 'deliveryDate', 'DeliveryDate') ?? ''),
    outletId: String(pick(raw, 'outletId', 'OutletId') ?? ''),
    outletName: String(pick(raw, 'outletName', 'OutletName') ?? ''),
    outlet: pick(raw, 'outlet', 'Outlet') as Delivery['outlet'],
    status: (pick(raw, 'status', 'Status') as Delivery['status']) || 'Draft',
    totalItems: Number(pick(raw, 'totalItems', 'TotalItems') ?? 0),
    totalValue: Number(pick(raw, 'totalValue', 'TotalValue') ?? 0),
    notes: pick(raw, 'notes', 'Notes') as string | undefined,
    items,
    approvedById: pick(raw, 'approvedById', 'ApprovedById') as string | undefined,
    approvedByName: pick(raw, 'approvedByName', 'ApprovedByName') as string | undefined,
    approvedDate: pick(raw, 'approvedDate', 'ApprovedDate') as string | undefined,
    createdAt: String(pick(raw, 'createdAt', 'CreatedAt') ?? ''),
    updatedAt: String(pick(raw, 'updatedAt', 'UpdatedAt') ?? ''),
    createdById: String(pick(raw, 'createdById', 'CreatedById') ?? ''),
    createdByName: pick(raw, 'createdByName', 'CreatedByName') as string | undefined,
    updatedById: String(pick(raw, 'updatedById', 'UpdatedById') ?? ''),
  };
}

function escapeHtml(s: string | undefined | null): string {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtDate(iso: string | undefined): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return formatSlDateTime(iso);
  } catch {
    return '—';
  }
}

function fmtMoney(n: number): string {
  return `Rs. ${Number(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function chunkRows<T>(items: T[], size: number): T[][] {
  if (items.length === 0) return [[]];
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    pages.push(items.slice(i, i + size));
  }
  return pages;
}

function buildLineRows(lines: DeliveryItem[], padTo: number): string {
  const cells = lines.map((line) => {
    const code = line.product?.code || '';
    const name = line.productName || line.product?.name || '—';
    const label = code ? `${escapeHtml(code)} - ${escapeHtml(name)}` : escapeHtml(name);
    return `<tr>
      <td class="item">${label}</td>
      <td class="num">${Number(line.quantity).toLocaleString()}</td>
      <td class="num">${fmtMoney(Number(line.unitPrice))}</td>
      <td class="num">${fmtMoney(Number(line.total))}</td>
    </tr>`;
  });

  while (cells.length < padTo) {
    cells.push(`<tr class="empty"><td class="item">&nbsp;</td><td class="num"></td><td class="num"></td><td class="num"></td></tr>`);
  }
  return cells.join('');
}

function buildDeliveryPages(d: Delivery, printedBy: string, printedAtLabel: string): string {
  const showroom = d.outletName || d.outlet?.name || '—';
  const lines = d.items ?? [];
  const pages = chunkRows(lines, DN_PAGE_ROWS);
  const pageCount = pages.length;

  return pages
    .map((pageLines, pageIndex) => {
      const pageNo = pageIndex + 1;
      const isLast = pageNo === pageCount;
      const bodyRows = buildLineRows(pageLines, DN_PAGE_ROWS);

      const totalsBlock = isLast
        ? `<div class="totals">
            <span>Items: <strong>${d.totalItems ?? lines.length}</strong></span>
            <span>Total: <strong>${fmtMoney(Number(d.totalValue || 0))}</strong></span>
          </div>`
        : `<div class="totals muted">Continued…</div>`;

      const signatures = isLast
        ? `<div class="sigs">
            <div class="sig"><span></span><em>Prepared By</em></div>
            <div class="sig"><span></span><em>Checked By</em></div>
            <div class="sig"><span></span><em>Received By</em></div>
          </div>`
        : '';

      return `
      <section class="dn-page">
        <header class="dn-head">
          <div class="brand">Don &amp; Sons</div>
          <h1>Delivery Note</h1>
          <div class="meta">
            <div><span class="lab">DN No</span><span class="val">${escapeHtml(d.deliveryNo)}</span></div>
            <div><span class="lab">Date</span><span class="val">${fmtDate(d.deliveryDate)}</span></div>
            <div><span class="lab">Showroom</span><span class="val">${escapeHtml(showroom)}</span></div>
            <div><span class="lab">Status</span><span class="val">${escapeHtml(d.status)}</span></div>
          </div>
          ${d.notes && pageNo === 1 ? `<p class="notes">${escapeHtml(d.notes)}</p>` : ''}
        </header>
        <table class="lines">
          <thead>
            <tr>
              <th>Product</th>
              <th class="num">Qty</th>
              <th class="num">Price</th>
              <th class="num">Total</th>
            </tr>
          </thead>
          <tbody>${bodyRows}</tbody>
        </table>
        ${totalsBlock}
        ${signatures}
        <footer class="dn-foot">
          <span>Printed by ${escapeHtml(printedBy)} · ${escapeHtml(printedAtLabel)}</span>
          <span>Page ${pageNo} / ${pageCount}</span>
        </footer>
      </section>`;
    })
    .join('');
}

function buildFullHtml(deliveries: Delivery[], printedBy: string): string {
  const printedAtLabel = formatSlDateTime(new Date().toISOString());
  const sections = deliveries
    .map((d) => buildDeliveryPages(d, printedBy || d.createdByName || 'System', printedAtLabel))
    .join('');

  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"/>
<title>Don &amp; Sons – Delivery Notes</title>
<style>
  @page {
    size: ${DN_PAGE_WIDTH_IN}in ${DN_PAGE_HEIGHT_IN}in;
    margin: 0.18in;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    color: #111;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 8.5pt;
    line-height: 1.25;
  }
  .dn-page {
    width: ${DN_PAGE_WIDTH_IN}in;
    height: ${DN_PAGE_HEIGHT_IN}in;
    padding: 0.18in;
    page-break-after: always;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .dn-page:last-of-type { page-break-after: auto; }
  .dn-head { flex: 0 0 auto; }
  .brand {
    font-size: 7pt;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #a51c30;
  }
  h1 {
    margin: 2px 0 6px;
    font-size: 12pt;
    font-weight: 700;
    color: #a51c30;
  }
  .meta {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px 10px;
    margin-bottom: 4px;
  }
  .lab {
    display: block;
    font-size: 6.5pt;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .val { font-weight: 700; font-size: 8pt; }
  .notes {
    margin: 2px 0 4px;
    padding: 3px 5px;
    border: 1px solid #ddd;
    font-size: 7.5pt;
    background: #fafafa;
  }
  table.lines {
    width: 100%;
    border-collapse: collapse;
    flex: 1 1 auto;
    table-layout: fixed;
  }
  table.lines th, table.lines td {
    border: 1px solid #ccc;
    padding: 2px 4px;
    vertical-align: middle;
  }
  table.lines th {
    background: #f3f4f6;
    font-size: 6.5pt;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #555;
  }
  table.lines td.item {
    font-size: 7.5pt;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  table.lines td.num, table.lines th.num {
    text-align: right;
    width: 0.72in;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  tr.empty td { height: 14px; border-color: #e5e7eb; }
  .totals {
    display: flex;
    justify-content: space-between;
    margin-top: 4px;
    font-size: 8pt;
  }
  .totals.muted { color: #777; font-style: italic; }
  .sigs {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
    margin-top: 8px;
  }
  .sig span {
    display: block;
    border-bottom: 1px solid #333;
    height: 18px;
    margin-bottom: 2px;
  }
  .sig em {
    font-style: normal;
    font-size: 6.5pt;
    color: #555;
  }
  .dn-foot {
    margin-top: auto;
    padding-top: 4px;
    border-top: 1px solid #ccc;
    display: flex;
    justify-content: space-between;
    font-size: 6.5pt;
    color: #444;
  }
  @media print {
    .dn-page {
      width: auto;
      height: auto;
      min-height: 0;
      padding: 0;
    }
  }
</style>
</head><body>${sections}</body></html>`;
}

/**
 * Print from a hidden iframe (same document). No visible preview tab —
 * only the browser print dialog. Works when pop-ups are blocked.
 */
function printViaHiddenIframe(html: string): Promise<void> {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('title', 'Print delivery note');
    iframe.style.cssText =
      'position:fixed;left:-9999px;top:0;width:5in;height:5in;border:0;opacity:0;pointer-events:none';
    document.body.appendChild(iframe);

    const win = iframe.contentWindow;
    const doc = iframe.contentDocument;
    if (!win || !doc) {
      document.body.removeChild(iframe);
      resolve();
      return;
    }

    doc.open();
    doc.write(html);
    doc.close();

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
      setTimeout(() => {
        try {
          document.body.removeChild(iframe);
        } catch {
          /* ignore */
        }
      }, 500);
    };

    const run = () => {
      try {
        win.addEventListener('afterprint', finish, { once: true });
        setTimeout(finish, 120_000);
        win.focus();
        win.print();
      } catch {
        finish();
      }
    };

    setTimeout(run, 300);
  });
}

/**
 * Browser fallback print (5×5 in, 12 rows/page). Prefer hybrid DN Print Client enqueue.
 */
export async function printDeliveries(
  deliveries: Delivery[],
  printedBy = 'System'
): Promise<boolean> {
  if (!deliveries.length) return false;

  const normalized = deliveries.map((d) =>
    normalizeDeliveryFromApi(d as unknown as Record<string, unknown>)
  );
  const html = buildFullHtml(normalized, printedBy);
  await printViaHiddenIframe(html);
  return true;
}
