import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '../api/auth';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
  setRefreshToken: (token: string) => void;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
  updateTokens: (accessToken: string, refreshToken: string) => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      setUser: (user) => set({ user, isAuthenticated: true }),

      setAccessToken: (token) => set({ accessToken: token }),

      setRefreshToken: (token) => set({ refreshToken: token }),

      login: (accessToken, refreshToken, user) =>
        set({
          accessToken,
          refreshToken,
          user,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        }),

      updateTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),

      hasPermission: (permission: string) => {
        const { user } = get();
        if (!user) return false;
        if (user.isSuperAdmin) return true;
        return user.permissions.includes(permission) || user.permissions.includes('*');
      },

      hasAnyPermission: (permissions: string[]) => {
        const { user } = get();
        if (!user) return false;
        if (user.isSuperAdmin) return true;
        return permissions.some(
          (p) => user.permissions.includes(p) || user.permissions.includes('*')
        );
      },

      hasAllPermissions: (permissions: string[]) => {
        const { user } = get();
        if (!user) return false;
        if (user.isSuperAdmin) return true;
        return permissions.every(
          (p) => user.permissions.includes(p) || user.permissions.includes('*')
        );
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
