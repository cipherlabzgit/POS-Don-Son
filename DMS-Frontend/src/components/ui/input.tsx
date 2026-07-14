'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  variant?: 'default' | 'yellow';
  /** Tighter label, helper, and control padding for dense forms */
  compact?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      className = '',
      variant = 'default',
      compact = false,
      ...props
    },
    ref
  ) => {
    const getBackgroundColor = () => {
      if (variant === 'yellow') {
        return '#FEF3C4';
      }
      return 'var(--background)';
    };

    const getBorderColor = () => {
      if (variant === 'yellow') {
        return '#FFD100';
      }
      return error ? '#DC2626' : 'var(--form-field-border)';
    };

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label
            className={`block text-sm font-medium ${compact ? 'mb-1' : 'mb-2'}`}
            style={{ color: 'var(--foreground)' }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`block rounded-lg text-sm transition-[border-color,outline,box-shadow] focus:outline-none ${
            compact ? 'px-3 py-2' : 'px-4 py-2.5'
          } ${fullWidth ? 'w-full' : ''} ${className}`}
          style={{
            border: `1px solid ${getBorderColor()}`,
            backgroundColor: getBackgroundColor(),
            color: 'var(--foreground)',
            boxShadow: 'inset 0 1px 2px rgba(15, 23, 42, 0.04)',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--form-focus-ring)';
            e.currentTarget.style.outline = '2px solid var(--form-focus-ring)';
            e.currentTarget.style.outlineOffset = '2px';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = getBorderColor();
            e.currentTarget.style.outline = 'none';
          }}
          {...props}
        />
        {error && (
          <p className={`text-sm ${compact ? 'mt-1' : 'mt-1.5'}`} style={{ color: '#DC2626' }}>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            className={compact ? 'mt-1 text-xs' : 'mt-1.5 text-sm'}
            style={{ color: 'var(--muted-foreground)' }}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
