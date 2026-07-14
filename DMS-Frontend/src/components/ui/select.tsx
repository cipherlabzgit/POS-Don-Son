'use client';

import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      placeholder,
      fullWidth = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseBorder = error ? '#DC2626' : 'var(--form-field-border)';

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`block rounded-lg px-4 py-2.5 text-sm transition-[border-color,outline,box-shadow] focus:outline-none ${
            fullWidth ? 'w-full' : ''
          } ${className}`}
          style={{
            border: `1px solid ${baseBorder}`,
            backgroundColor: 'var(--background)',
            color: 'var(--foreground)',
            boxShadow: 'inset 0 1px 2px rgba(15, 23, 42, 0.04)',
          }}
          onFocus={(e) => {
            if (error) return;
            e.currentTarget.style.borderColor = 'var(--form-focus-ring)';
            e.currentTarget.style.outline = '2px solid var(--form-focus-ring)';
            e.currentTarget.style.outlineOffset = '2px';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? '#DC2626' : 'var(--form-field-border)';
            e.currentTarget.style.outline = 'none';
          }}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1.5 text-sm" style={{ color: '#DC2626' }}>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
