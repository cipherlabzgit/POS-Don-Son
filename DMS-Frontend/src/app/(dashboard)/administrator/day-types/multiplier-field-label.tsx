'use client';

import { CircleHelp } from 'lucide-react';

export const MULTIPLIER_HELPER_TEXT =
  '1 = normal baseline. Higher values increase planned quantities for this day type; lower values reduce them. Allowed: greater than 0, up to 10.';

export const MULTIPLIER_TOOLTIP =
  'The multiplier scales quantity planning for this day category (for example default or baseline amounts used in delivery planning). A value of 1 leaves quantities unchanged. Values above 1 increase them proportionally; values below 1 decrease them. Your administrator may use this for higher-demand days (such as weekends or holidays). Must be greater than 0 and at most 10.';

export function MultiplierFieldLabel({ inputId = 'day-type-multiplier' }: { inputId?: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      <label htmlFor={inputId} className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
        Multiplier
      </label>
      <button
        type="button"
        className="inline-flex shrink-0 rounded-full p-0.5 outline-none transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ color: 'var(--muted-foreground)' }}
        title={MULTIPLIER_TOOLTIP}
        aria-label={`About multiplier: ${MULTIPLIER_TOOLTIP}`}
      >
        <CircleHelp className="h-4 w-4" strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}
