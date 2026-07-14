import * as XLSX from 'xlsx';

export interface ParsedDeliveryRow {
  code: string;
  quantity: number;
}

function normalizeHeader(key: string): string {
  return key.toLowerCase().replace(/[\s_\-]/g, '');
}

function rowToParsed(row: Record<string, unknown>): ParsedDeliveryRow | null {
  let code = '';
  let quantity: number | null = null;

  for (const [k, v] of Object.entries(row)) {
    const nk = normalizeHeader(String(k));
    if (nk === 'itemcode' || nk === 'productcode' || nk === 'code' || nk === 'sku') {
      code = String(v ?? '').trim();
    } else if (nk === 'quantity' || nk === 'qty' || nk === 'qtyunits') {
      const n = Number(String(v ?? '').replace(/,/g, ''));
      if (!Number.isNaN(n)) quantity = n;
    }
  }

  if (!code || quantity === null || quantity <= 0) return null;
  return { code, quantity };
}

export function downloadDeliveryImportTemplate(): void {
  const ws = XLSX.utils.aoa_to_sheet([['ItemCode', 'Quantity']]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Items');
  XLSX.writeFile(wb, 'delivery_items_template.xlsx');
}

export async function parseDeliveryImportFile(file: File): Promise<ParsedDeliveryRow[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  const out: ParsedDeliveryRow[] = [];
  for (const row of rows) {
    const parsed = rowToParsed(row);
    if (parsed) out.push(parsed);
  }
  return out;
}
