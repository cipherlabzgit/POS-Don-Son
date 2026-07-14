import { ReactNode } from 'react';
import { useTheme } from '@/lib/theme/theme-context';
import { brandColors } from '@/lib/theme/colors';

interface BadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Badge({ children, variant = 'neutral', size = 'md', className = '' }: BadgeProps) {
  const { pageColor } = useTheme();

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: pageColor, color: 'white' };
      case 'success':
        return { backgroundColor: brandColors.status.success, color: 'white' };
      case 'warning':
        return { backgroundColor: brandColors.status.warning, color: 'white' };
      case 'danger':
        return { backgroundColor: brandColors.status.error, color: 'white' };
      case 'info':
        return { backgroundColor: brandColors.status.info, color: 'white' };
      case 'neutral':
        return { backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' };
      default:
        return {};
    }
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sizeClasses[size]} ${className}`}
      style={getVariantStyle()}
    >
      {children}
    </span>
  );
}
