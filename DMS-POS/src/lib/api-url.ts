/** Normalize API base URL (no trailing slash). */
export function normalizeApiBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '')
}

/** True when the host is localhost or 127.0.0.1 (local dev / misconfigured remote POS). */
export function isLocalApiUrl(url: string): boolean {
  try {
    const u = new URL(normalizeApiBaseUrl(url))
    return u.hostname === 'localhost' || u.hostname === '127.0.0.1'
  } catch {
    return false
  }
}
