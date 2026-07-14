'use client';

import { useEffect, ReactNode } from 'react';
import { useThemeStore } from '@/lib/stores/theme-store';

interface ThemeProviderProps {
  children: ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const { mode, _hasHydrated } = useThemeStore();

  useEffect(() => {
    if (!_hasHydrated) return;

    const root = document.documentElement;
    root.classList.remove('light', 'dark');

    if (mode === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(mode);
    }
  }, [mode, _hasHydrated]);

  useEffect(() => {
    if (!_hasHydrated || mode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode, _hasHydrated]);

  return <>{children}</>;
}
