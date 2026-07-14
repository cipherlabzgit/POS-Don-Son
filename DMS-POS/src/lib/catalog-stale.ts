const TWENTY_FOUR_H_MS = 24 * 60 * 60 * 1000

export function isCatalogStale(cacheUpdatedAt: number | null): boolean {
  if (cacheUpdatedAt == null || cacheUpdatedAt <= 0) return true
  return Date.now() - cacheUpdatedAt > TWENTY_FOUR_H_MS
}
