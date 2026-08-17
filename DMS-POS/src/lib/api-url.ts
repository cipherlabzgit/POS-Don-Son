/** Normalize API base URL (no trailing slash; strip junk prefixes / backslashes). */
export function normalizeApiBaseUrl(url: string): string {
  let s = (url ?? '').trim()
  if (!s) return s

  // Accidental paste like: D:\DMS\http:\\123.231.10.22:5126
  const embedded = s.match(/https?:[/\\]+[^\s]+/i)
  if (embedded) {
    s = embedded[0]
  }

  // Windows-style slashes in URL: http:\\host -> http://host
  s = s.replace(/^https?:[/\\]+/i, (m) => (m.toLowerCase().startsWith('https') ? 'https://' : 'http://'))
  s = s.replace(/\\/g, '/')

  return s.replace(/\/+$/, '')
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
