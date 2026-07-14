/**
 * Don & Sons Brand Colors
 * Based on company logo and brand identity
 */

export const brandColors = {
  // Primary brand color - Red from logo
  primary: {
    DEFAULT: '#C8102E',
    light: '#E31837',
    dark: '#A00D26',
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#C8102E', // Brand primary
    700: '#A00D26',
    800: '#7F1D1D',
    900: '#5F0F16',
  },
  
  // Accent color - Yellow from logo
  accent: {
    DEFAULT: '#FFD100',
    light: '#FFDC33',
    dark: '#CCAA00',
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FFD100', // Brand accent
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  // Neutral colors for UI elements
  neutral: {
    white: '#FFFFFF',
    black: '#000000',
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Status colors
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
} as const;

/**
 * Get page-specific theme color
 * This can be overridden via admin settings for per-page color coding
 */
export const getPageThemeColor = (pageName: string): string => {
  // Default to primary brand color
  // This will be enhanced to fetch from system settings in later implementation
  return brandColors.primary.DEFAULT;
};

export type BrandColors = typeof brandColors;
