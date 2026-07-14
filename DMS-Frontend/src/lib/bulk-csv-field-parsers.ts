/** Shared parsers for bulk CSV imports */

export function req(row: Record<string, string>, key: string): string {
  const v = row[key]?.trim();
  if (!v) throw new Error(`"${key}" is required`);
  return v;
}

export function opt(row: Record<string, string>, key: string): string | undefined {
  const v = row[key]?.trim();
  return v === '' || v === undefined ? undefined : v;
}

export function parseBool(row: Record<string, string>, key: string, defaultVal: boolean): boolean {
  const raw = row[key];
  if (raw === undefined || raw.trim() === '') return defaultVal;
  const s = raw.trim().toLowerCase();
  if (['true', 'yes', '1', 'y'].includes(s)) return true;
  if (['false', 'no', '0', 'n'].includes(s)) return false;
  throw new Error(`"${key}" must be true/false or yes/no (got "${raw}")`);
}

export function parseIntField(row: Record<string, string>, key: string, defaultVal?: number): number {
  const raw = row[key]?.trim();
  if (raw === undefined || raw === '') {
    if (defaultVal !== undefined) return defaultVal;
    throw new Error(`"${key}" is required`);
  }
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n)) throw new Error(`"${key}" must be an integer`);
  return n;
}

export function parseDecimal(row: Record<string, string>, key: string, defaultVal?: number): number {
  const raw = row[key]?.trim();
  if (raw === undefined || raw === '') {
    if (defaultVal !== undefined) return defaultVal;
    throw new Error(`"${key}" is required`);
  }
  const n = Number(raw);
  if (Number.isNaN(n)) throw new Error(`"${key}" must be a number`);
  return n;
}

/** Semicolon- or comma-separated list of integers, e.g. "1;2;3" */
export function parseIntList(row: Record<string, string>, key: string): number[] {
  const raw = row[key]?.trim();
  if (!raw) return [];
  const parts = raw.split(/[;,]/).map((p) => p.trim()).filter(Boolean);
  const out: number[] = [];
  for (const p of parts) {
    const n = Number.parseInt(p, 10);
    if (Number.isNaN(n)) throw new Error(`"${key}" contains invalid number "${p}"`);
    out.push(n);
  }
  return out;
}
