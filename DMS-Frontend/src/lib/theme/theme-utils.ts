/**
 * Theme Utilities for Don & Sons DMS
 * Provides helper functions for theme management and color utilities
 */

export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Get the resolved theme based on system preference
 */
export function getResolvedTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode !== 'system') return mode;
  
  if (typeof window === 'undefined') return 'light';
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/**
 * Apply theme to document
 */
export function applyTheme(mode: ThemeMode): void {
  const root = document.documentElement;
  const resolvedTheme = getResolvedTheme(mode);
  
  root.classList.remove('light', 'dark');
  root.classList.add(resolvedTheme);
}

/**
 * Listen for system theme changes
 */
export function watchSystemTheme(callback: (isDark: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches);
  };
  
  mediaQuery.addEventListener('change', handler);
  
  return () => mediaQuery.removeEventListener('change', handler);
}

/**
 * Get CSS variable value
 */
export function getCSSVariable(name: string): string {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * Set CSS variable value
 */
export function setCSSVariable(name: string, value: string): void {
  if (typeof window === 'undefined') return;
  document.documentElement.style.setProperty(name, value);
}

/**
 * Check if current theme is dark
 */
export function isDarkTheme(): boolean {
  if (typeof window === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}
