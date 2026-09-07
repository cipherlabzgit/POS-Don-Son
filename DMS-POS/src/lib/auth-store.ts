import { create } from 'zustand'
import type { User } from './types'

function normalizePermissions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const codes: string[] = []
  for (const item of raw) {
    if (typeof item === 'string' && item.trim()) {
      codes.push(item.trim())
      continue
    }
    if (item && typeof item === 'object') {
      const rec = item as Record<string, unknown>
      const code = rec.code ?? rec.Code
      if (typeof code === 'string' && code.trim()) codes.push(code.trim())
    }
  }
  return codes
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  login: (accessToken: string, refreshToken: string, user: User) => void
  logout: () => void
  updateTokens: (accessToken: string, refreshToken: string) => void
  hasPermission: (code: string) => boolean
}

try {
  localStorage.removeItem('dms-pos-auth')
  localStorage.removeItem('dms-pos-auth-token')
} catch {
  /* ignore */
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,

  login: (accessToken, refreshToken, user) =>
    set({
      accessToken,
      refreshToken,
      user: {
        ...user,
        permissions: normalizePermissions(user.permissions),
        roles: (user.roles ?? []).map((r) => ({
          id: String((r as { id?: string; Id?: string }).id ?? (r as { Id?: string }).Id ?? ''),
          name: String((r as { name?: string; Name?: string }).name ?? (r as { Name?: string }).Name ?? ''),
        })),
      },
    }),

  logout: () => set({ accessToken: null, refreshToken: null, user: null }),

  updateTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),

  hasPermission: (code: string) => {
    const u = get().user
    if (!u) return false
    if (u.isSuperAdmin) return true
    return u.permissions.includes(code) || u.permissions.includes('*')
  },
}))

/** POS till: cashier role, or any POS sale permission, or Super Admin. */
export function canUsePosTill(user: User | null): boolean {
  if (!user) return false
  if (user.isSuperAdmin) return true
  if (user.roles.some((r) => /cashier/i.test(r.name || ''))) return true
  return user.permissions.some((p) => p === '*' || p.startsWith('pos:sale:'))
}
