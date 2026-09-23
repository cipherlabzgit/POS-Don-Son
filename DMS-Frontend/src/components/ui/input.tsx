'use client';

import { InputHTMLAttributes, forwardRef, useRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  variant?: 'default' | 'yellow';
  /** Tighter label, helper, and control padding for dense forms */
  compact?: boolean;
}

function isNativePickerType(type: string | undefined): boolean {
  return (
    type === 'date' ||
    type === 'datetime-local' ||
    type === 'time' ||
    type === 'month' ||
    type === 'week'
  );
}

function openNativePicker(el: HTMLInputElement) {
  try {
    if (typeof el.showPicker === 'function') {
      void el.showPicker();
    }
  } catch {
    /* NotAllowedError / unsupported — ignore */
  }
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
      disabled,
      type,
      onClick,
      onFocus,
      onBlur,
      id,
      ...props
    },
    ref
  ) => {
    const localRef = useRef<HTMLInputElement | null>(null);
    const inputId = id;

    const setRefs = (node: HTMLInputElement | null) => {
      localRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    };

    const getBackgroundColor = () => {
      if (disabled) {
        return '#F3F4F6';
      }
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

    const pickerType = isNativePickerType(type);

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label
            htmlFor={inputId}
            className={`block text-sm font-medium ${compact ? 'mb-1' : 'mb-2'}`}
            style={{ color: 'var(--foreground)', cursor: disabled ? undefined : 'pointer' }}
            onClick={() => {
              if (disabled || !pickerType) return;
              const el = localRef.current;
              if (!el) return;
              el.focus();
              openNativePicker(el);
            }}
          >
            {label}
          </label>
        )}
        <input
          ref={setRefs}
          id={inputId}
          type={type}
          className={`block rounded-lg text-sm transition-[border-color,outline,box-shadow] focus:outline-none ${
            compact ? 'px-3 py-2' : 'px-4 py-2.5'
          } ${fullWidth ? 'w-full' : ''} ${className}`}
          style={{
            border: `1px solid ${getBorderColor()}`,
            backgroundColor: getBackgroundColor(),
            color: disabled ? '#6B7280' : 'var(--foreground)',
            cursor: disabled ? 'not-allowed' : pickerType ? 'pointer' : undefined,
            boxShadow: 'inset 0 1px 2px rgba(15, 23, 42, 0.04)',
          }}
          onFocus={(e) => {
            if (!disabled) {
              e.currentTarget.style.borderColor = 'var(--form-focus-ring)';
              e.currentTarget.style.outline = '2px solid var(--form-focus-ring)';
              e.currentTarget.style.outlineOffset = '2px';
            }
            onFocus?.(e);
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = getBorderColor();
            e.currentTarget.style.outline = 'none';
            onBlur?.(e);
          }}
          onClick={(e) => {
            onClick?.(e);
            if (!disabled && pickerType) {
              openNativePicker(e.currentTarget);
            }
          }}
          {...props}
          disabled={disabled}
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
