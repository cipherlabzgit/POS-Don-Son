'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import { useTheme } from '@/lib/theme/theme-context';
import { Check } from 'lucide-react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const { pageColor } = useTheme();
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={`flex items-start ${className}`}>
        <div className="flex items-center h-5">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className="sr-only peer"
            {...props}
          />
          <label
            htmlFor={checkboxId}
            className="w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all peer-checked:border-0"
            style={{
              borderColor: error ? '#DC2626' : 'var(--input)',
              backgroundColor: props.checked ? pageColor : 'var(--background)',
            }}
          >
            {props.checked && <Check className="w-4 h-4 text-white" />}
          </label>
        </div>
        {label && (
          <div className="ml-3">
            <label htmlFor={checkboxId} className="text-sm cursor-pointer" style={{ color: 'var(--foreground)' }}>
              {label}
            </label>
            {error && (
              <p className="text-sm mt-1" style={{ color: '#DC2626' }}>
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
