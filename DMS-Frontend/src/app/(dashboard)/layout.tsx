'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { authApi } from '@/lib/api/auth';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { ThemeProvider } from '@/lib/theme/theme-context';
import { IdleLogoutBanner } from '@/components/dms/idle-logout-banner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, accessToken, refreshToken, logout, setUser, _hasHydrated } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    if (!_hasHydrated) return;

    const validateSession = async () => {
      if (!isAuthenticated || !accessToken) {
        setIsValidating(false);
        router.push('/login');
        return;
      }

      try {
        const user = await authApi.getCurrentUser();
        const cashierOnly =
          !user.isSuperAdmin &&
          user.roles.length > 0 &&
          user.roles.every((r) => r.name.toLowerCase() === 'cashier');
        if (cashierOnly) {
          logout();
          router.push('/login');
          return;
        }
        setUser(user);
        setIsValidating(false);
      } catch (error) {
        logout();
        router.push('/login');
      }
    };

    validateSession();
  }, [_hasHydrated]);

  const handleIdleLogout = useCallback(async () => {
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch (error) {
      console.error('Idle logout failed:', error);
    } finally {
      logout();
      router.push('/login');
    }
  }, [refreshToken, logout, router]);

  if (isValidating || !isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--muted)' }}>
        <div className="text-center">
          <div
            className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-r-transparent"
            style={{ borderColor: '#C8102E', borderRightColor: 'transparent' }}
          ></div>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className="h-screen flex overflow-hidden" style={{ backgroundColor: 'var(--muted)' }}>
        {/* Mobile Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 cursor-pointer bg-black bg-opacity-50 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
        )}

        {/* Fixed Sidebar */}
        <Sidebar mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden w-full min-w-0">
          {/* Fixed Header */}
          <Header onMenuClick={() => setMobileMenuOpen(true)} />

          {/* Scrollable Page Content */}
          <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
            <div className="h-full">
              {children}
            </div>
          </main>
        </div>

        <IdleLogoutBanner idleTimeoutMinutes={15} onLogout={handleIdleLogout} />
      </div>
    </ThemeProvider>
  );
}
