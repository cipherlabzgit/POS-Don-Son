'use client';

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useThemeStore, DEFAULT_BRAND_COLOR } from '@/lib/stores/theme-store';

interface ThemeContextType {
  /** The resolved accent color for the current page. */
  pageColor: string;
  /** Manually override the color for the current path (persisted to store). */
  setPageColor: (color: string) => void;
  /** Reset the current page's color back to the brand default. */
  resetToDefault: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { getPageColor, setPageColor: storeSet, resetPageColor, _hasHydrated } = useThemeStore();

  // Resolve colour for the current path (falls back to brand red until hydrated)
  const pageColor = _hasHydrated ? getPageColor(pathname) : DEFAULT_BRAND_COLOR;

  // Keep the CSS custom property in sync so sidebar/header can use it
  useEffect(() => {
    document.documentElement.style.setProperty('--page-accent-color', pageColor);
  }, [pageColor]);

  const setPageColor = (color: string) => storeSet(pathname, color);
  const resetToDefault = () => resetPageColor(pathname);

  return (
    <ThemeContext.Provider value={{ pageColor, setPageColor, resetToDefault }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
