/** Case-insensitive fold so BI2 and bi2 match the same product (locale-safe for letter I). */
export function foldProductSearch(value: string): string {
  return value.trim().normalize('NFKC').toLocaleLowerCase('en-US');
}

/** Lower rank is a better match. `Infinity` means no match. */
export function rankCodeNameMatch(
  code: string | null | undefined,
  name: string | null | undefined,
  query: string,
): number {
  const q = foldProductSearch(query);
  if (!q) return Infinity;
  const c = foldProductSearch(code ?? '');
  const n = foldProductSearch(name ?? '');
  if (c === q) return 0;
  if (n === q) return 1;
  if (c.startsWith(q)) return 2;
  if (n.startsWith(q)) return 3;
  if (c.includes(q)) return 4;
  if (n.includes(q)) return 5;
  return Infinity;
}

type CodeNameItem = { code?: string | null; name?: string | null };

export function filterByCodeOrName<T>(
  items: T[],
  search: string,
  options?: {
    limit?: number;
    whenEmpty?: 'all' | 'none';
    code?: (item: T) => string | null | undefined;
    name?: (item: T) => string | null | undefined;
  },
): T[] {
  const q = foldProductSearch(search);
  if (!q) {
    if (options?.whenEmpty === 'none') return [];
    return options?.limit != null ? items.slice(0, options.limit) : items;
  }

  const getCode = options?.code ?? ((item: T) => (item as CodeNameItem).code);
  const getName = options?.name ?? ((item: T) => (item as CodeNameItem).name);

  const ranked = items
    .map((item, index) => ({
      item,
      index,
      rank: rankCodeNameMatch(getCode(item), getName(item), q),
    }))
    .filter((row) => row.rank !== Infinity)
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((row) => row.item);

  return options?.limit != null ? ranked.slice(0, options.limit) : ranked;
}
