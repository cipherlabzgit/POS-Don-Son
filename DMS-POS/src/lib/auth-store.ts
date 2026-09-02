import { create } from 'zustand'
import type { User } from './types'

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
} catch {
  /* ignore */
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,

  login: (accessToken, refreshToken, user) =>
    set({ accessToken, refreshToken, user }),

  logout: () => set({ accessToken: null, refreshToken: null, user: null }),

  updateTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),

  hasPermission: (code: string) => {
    const u = get().user
    if (!u) return false
    if (u.isSuperAdmin) return true
    return u.permissions.includes(code) || u.permissions.includes('*')
  },
}))
