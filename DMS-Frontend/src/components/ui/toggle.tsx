'use client';

import { useTheme } from '@/lib/theme/theme-context';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, disabled = false }: ToggleProps) {
  const { pageColor } = useTheme();

  return (
    <div className="flex items-center space-x-3">
      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: checked ? pageColor : 'var(--input)',
        }}
      >
        <span
          className="inline-block h-5 w-5 transform rounded-full shadow-lg ring-0 transition duration-200 ease-in-out"
          style={{
            transform: checked ? 'translateX(1.25rem)' : 'translateX(0)',
            backgroundColor: 'var(--background)',
          }}
        />
      </button>
      {label && (
        <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          {label}
        </span>
      )}
    </div>
  );
}
