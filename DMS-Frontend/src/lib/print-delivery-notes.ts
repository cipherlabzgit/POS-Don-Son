import type { Delivery, DeliveryItem } from '@/lib/api/deliveries';
import { formatSlDateTime } from './sri-lanka-time';

function pick<T = unknown>(raw: Record<string, unknown>, ...keys: string[]): T | undefined {
  for (const k of keys) {
    if (raw[k] !== undefined && raw[k] !== null) return raw[k] as T;
  }
  return undefined;
}

/** API may return PascalCase; normalize so print HTML always has data. */
function normalizeDeliveryFromApi(raw: Record<string, unknown>): Delivery {
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

function buildDeliverySection(d: Delivery): string {
  const showroom = d.outletName || d.outlet?.name || '—';
  const rows =
    d.items && d.items.length > 0
      ? d.items
          .map((line: DeliveryItem) => {
            const code = line.product?.code || '';
            const name = line.productName || line.product?.name || '—';
            const label = code
              ? `${escapeHtml(code)} - ${escapeHtml(name)}`
              : escapeHtml(name);
            return `<tr>
          <td>${label}</td>
          <td class="num">${Number(line.quantity).toLocaleString()}</td>
          <td class="num">${fmtMoney(Number(line.unitPrice))}</td>
          <td class="num">${fmtMoney(Number(line.total))}</td>
        </tr>`;
          })
          .join('')
      : `<tr><td colspan="4" class="muted">No line items.</td></tr>`;

  return `
    <section class="dn">
      <h1>Delivery Note</h1>
      <div class="grid">
        <div><span class="lab">Delivery No</span><span class="val">${escapeHtml(d.deliveryNo)}</span></div>
        <div><span class="lab">Date</span><span class="val">${fmtDate(d.deliveryDate)}</span></div>
        <div><span class="lab">Showroom</span><span class="val">${escapeHtml(showroom)}</span></div>
        <div><span class="lab">Status</span><span class="val">${escapeHtml(d.status)}</span></div>
      </div>
      ${d.notes ? `<p class="notes"><span class="lab">Notes</span> ${escapeHtml(d.notes)}</p>` : ''}
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th class="num">Qty</th>
            <th class="num">Unit Price</th>
            <th class="num">Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr>
            <th colspan="3">Total (${d.totalItems ?? d.items?.length ?? 0} items)</th>
            <th class="num">${fmtMoney(Number(d.totalValue || 0))}</th>
          </tr>
        </tfoot>
      </table>
    </section>`;
}

function buildFullHtml(deliveries: Delivery[]): string {
  const sections = deliveries.map(buildDeliverySection).join('');
  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Don &amp; Sons – Delivery Notes</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<style>
  :root {
    --ink: #111827;
    --muted: #6b7280;
    --border: #e5e7eb;
    --surface: #f9fafb;
    --brand: #a51c30;
  }
  * { box-sizing: border-box; }
  body {
    margin: 24px;
    color: var(--ink);
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 13px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }
  .dn { margin-bottom: 48px; page-break-after: always; }
  .dn:last-of-type { page-break-after: auto; }
  h1 {
    font-size: 1.375rem;
    font-weight: 700;
    letter-spacing: -0.03em;
    margin: 0 0 1.25rem;
    color: var(--brand);
  }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 28px; margin-bottom: 20px; }
  .lab {
    display: block;
    font-size: 0.65rem;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 2px;
  }
  .val { font-size: 0.95rem; font-weight: 600; color: var(--ink); }
  .notes {
    font-size: 0.8125rem;
    margin: 14px 0;
    padding: 12px 14px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--ink);
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8125rem;
    margin-top: 8px;
  }
  th, td {
    border: 1px solid var(--border);
    padding: 10px 12px;
    text-align: left;
    vertical-align: top;
  }
  thead th {
    background: var(--surface);
    font-weight: 600;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--muted);
  }
  tbody td { font-weight: 500; }
  tbody td.num { font-variant-numeric: tabular-nums; font-weight: 600; }
  tfoot th {
    background: #fff;
    font-weight: 700;
    font-size: 0.8125rem;
    color: var(--ink);
  }
  tfoot .num {
    font-variant-numeric: tabular-nums;
    font-weight: 700;
    color: var(--brand);
  }
  .num { text-align: right; white-space: nowrap; }
  .muted { color: var(--muted); text-align: center; padding: 20px; font-weight: 500; }
  @media print {
    body { margin: 12mm; }
    .dn { page-break-after: always; }
    .dn:last-of-type { page-break-after: auto; }
  }
</style>
</head><body>${sections}</body></html>`;
}

/**
 * Print from a hidden iframe (same document). Works when pop-ups are blocked
 * or when a new window cannot be written to.
 */
function printViaHiddenIframe(html: string): void {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', 'Print delivery note');
  iframe.style.cssText =
    'position:fixed;left:-9999px;top:0;width:816px;height:1056px;border:0;opacity:0;pointer-events:none';
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = iframe.contentDocument;
  if (!win || !doc) {
    document.body.removeChild(iframe);
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  const run = () => {
    try {
      win.focus();
      win.print();
    } finally {
      setTimeout(() => {
        try {
          document.body.removeChild(iframe);
        } catch {
          /* ignore */
        }
      }, 2000);
    }
  };

  setTimeout(run, 300);
}

/**
 * Opens print content in a new window via blob URL (avoids about:blank + document.write issues).
 * Do not use noopener: some browsers block the opener from populating the child document.
 * @returns false only if the popup was blocked before we could use iframe fallback
 */
export function printDeliveries(deliveries: Delivery[]): boolean {
  if (!deliveries.length) return false;

  const normalized = deliveries.map((d) =>
    normalizeDeliveryFromApi(d as unknown as Record<string, unknown>)
  );
  const html = buildFullHtml(normalized);

  try {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    // Intentionally no noopener/noreferrer — they can leave the tab stuck on about:blank
    // when combined with document.write in some browsers.
    const w = window.open(url, '_blank', 'width=960,height=720');

    if (w) {
      let triggered = false;
      const revokeLater = () => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          /* ignore */
        }
      };

      const triggerPrint = () => {
        if (triggered) return;
        triggered = true;
        try {
          w.focus();
          w.print();
        } catch {
          printViaHiddenIframe(html);
        }
        setTimeout(revokeLater, 120_000);
      };

      w.addEventListener('load', () => setTimeout(triggerPrint, 200));
      setTimeout(() => {
        if (!triggered) triggerPrint();
      }, 900);

      return true;
    }

    URL.revokeObjectURL(url);
  } catch {
    /* fall through to iframe */
  }

  printViaHiddenIframe(html);
  return true;
}
