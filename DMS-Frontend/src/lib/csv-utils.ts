/**
 * Minimal CSV parsing / generation for bulk uploads (RFC 4180-style quoting).
 */

export function stripBom(text: string): string {
  if (text.charCodeAt(0) === 0xfeff) return text.slice(1);
  return text;
}

export function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * RFC 4180-style CSV with configurable field separator (comma or semicolon for Excel locales).
 */
export function parseCsv(text: string, delimiter: ',' | ';' = ','): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let i = 0;
  let inQuotes = false;
  const s = stripBom(text);

  while (i < s.length) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      cell += c;
      i += 1;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (c === delimiter) {
      row.push(cell);
      cell = '';
      i += 1;
      continue;
    }
    if (c === '\r') {
      i += 1;
      continue;
    }
    if (c === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      i += 1;
      continue;
    }
    cell += c;
    i += 1;
  }
  row.push(cell);
  if (row.length > 1 || row[0] !== '') {
    rows.push(row);
  }
  return rows;
}

/**
 * Prefer comma-separated; if the first row parses as a single cell containing `;`,
 * re-parse as semicolon-separated (common Excel export on EU/Windows locales).
 */
export function parseCsvAuto(text: string): string[][] {
  const normalized = stripBom(text);
  const commaMatrix = parseCsv(normalized, ',');
  if (commaMatrix.length === 0) return commaMatrix;
  const first = commaMatrix[0];
  if (first.length === 1 && first[0].includes(';')) {
    return parseCsv(normalized, ';');
  }
  return commaMatrix;
}

export function buildCsvTemplate(headers: string[], exampleRows: string[][] = []): string {
  const lines: string[] = [];
  lines.push(headers.map(escapeCsvCell).join(','));
  for (const r of exampleRows) {
    const cells = [...r];
    while (cells.length < headers.length) cells.push('');
    lines.push(cells.slice(0, headers.length).map(escapeCsvCell).join(','));
  }
  return lines.join('\r\n');
}

export function downloadTextFile(filename: string, content: string, mime = 'text/csv;charset=utf-8'): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export type CsvRowRecord = Record<string, string>;

/**
 * Parse the first row as headers and data rows into objects.
 * If `canonicalHeaders` is set, each row is keyed by those names (Excel-friendly case-insensitive header match).
 * Otherwise keys match the file header strings exactly.
 */
export function csvMatrixToRecords(
  matrix: string[][],
  canonicalHeaders?: string[],
): { headers: string[]; rows: CsvRowRecord[]; error?: string } {
  if (!matrix.length) {
    return { headers: [], rows: [], error: 'The file is empty.' };
  }
  const trimmedHeaderRow = matrix[0].map((h) => h.trim());
  let last = trimmedHeaderRow.length - 1;
  while (last >= 0 && trimmedHeaderRow[last] === '') last -= 1;
  if (last < 0) {
    return { headers: [], rows: [], error: 'The file is empty.' };
  }
  const fileHeaders = trimmedHeaderRow.slice(0, last + 1);
  if (fileHeaders.some((h) => !h)) {
    return { headers: fileHeaders, rows: [], error: 'CSV header row cannot contain empty column names.' };
  }

  if (canonicalHeaders?.length) {
    const colIndex: number[] = [];
    for (const req of canonicalHeaders) {
      const idx = fileHeaders.findIndex((fh) => fh.toLowerCase() === req.toLowerCase());
      if (idx < 0) {
        const missing = canonicalHeaders.filter(
          (h) => !fileHeaders.some((fh) => fh.toLowerCase() === h.toLowerCase()),
        );
        return {
          headers: canonicalHeaders,
          rows: [],
          error: `Missing required column(s): ${missing.join(', ')}`,
        };
      }
      colIndex.push(idx);
    }
    if (new Set(colIndex).size !== colIndex.length) {
      return {
        headers: canonicalHeaders,
        rows: [],
        error: 'CSV has ambiguous headers: more than one column matches the same required field.',
      };
    }

    const rows: CsvRowRecord[] = [];
    for (let r = 1; r < matrix.length; r++) {
      const line = matrix[r];
      const allEmpty = line.every((c) => c.trim() === '');
      if (allEmpty) continue;
      const rec: CsvRowRecord = {};
      for (let i = 0; i < canonicalHeaders.length; i++) {
        rec[canonicalHeaders[i]] = (line[colIndex[i]] ?? '').trim();
      }
      rows.push(rec);
    }
    return { headers: canonicalHeaders, rows };
  }

  const rows: CsvRowRecord[] = [];
  for (let r = 1; r < matrix.length; r++) {
    const line = matrix[r];
    const allEmpty = line.every((c) => c.trim() === '');
    if (allEmpty) continue;
    const rec: CsvRowRecord = {};
    for (let c = 0; c < fileHeaders.length; c++) {
      rec[fileHeaders[c]] = (line[c] ?? '').trim();
    }
    rows.push(rec);
  }
  return { headers: fileHeaders, rows };
}

/** Case-sensitive check (file keys must match `required` exactly). Prefer csvMatrixToRecords(matrix, required). */
export function assertHeadersPresent(required: string[], found: string[]): string | undefined {
  const f = new Set(found);
  const missing = required.filter((h) => !f.has(h));
  if (missing.length) {
    return `Missing required column(s): ${missing.join(', ')}`;
  }
  return undefined;
}
