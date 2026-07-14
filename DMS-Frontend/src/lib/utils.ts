// Utility functions

import { formatSlDate } from './sri-lanka-time';

/**
 * Combine multiple class names
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = 'LKR'): string {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Format date
 */
export function formatDate(date: Date | string, format: 'short' | 'long' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (format === 'short') {
    return formatSlDate(d, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  return formatSlDate(d, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format time
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-LK', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Colombo',
  });
}

/**
 * Debounce function
 */
export function debounce<TArgs extends unknown[]>(
  func: (...args: TArgs) => void,
  wait: number
): (...args: TArgs) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: TArgs) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 */
export function throttle<TArgs extends unknown[]>(
  func: (...args: TArgs) => void,
  limit: number
): (...args: TArgs) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: TArgs) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Round to nearest value (for bakery items rounding to 5, etc.)
 */
export function roundToNearest(value: number, nearest: number): number {
  return Math.round(value / nearest) * nearest;
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, percentage: number): number {
  return value * (1 + percentage / 100);
}

/**
 * Safe number parse
 */
export function parseNumber(value: string | number, defaultValue: number = 0): number {
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}
