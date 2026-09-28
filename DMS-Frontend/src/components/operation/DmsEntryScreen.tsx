'use client';

import type { ReactNode } from 'react';

/** Classic DMS data-entry chrome: "New … - … No# New Number" plus a white panel. */
export function DmsEntryScreen({
  title,
  documentNo,
  onBack,
  toolbar,
  children,
}: {
  title: string;
  documentNo: string;
  onBack?: () => void;
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="p-3 sm:p-4">
      <div
        className="overflow-hidden border bg-[var(--card)] shadow-sm"
        style={{ borderColor: '#d1d5db' }}
      >
        <div
          className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5"
          style={{ borderColor: '#e5e7eb', backgroundColor: 'var(--card)' }}
        >
          <h1 className="text-base font-semibold sm:text-[1.05rem]" style={{ color: 'var(--foreground)' }}>
            {title}
            <span className="font-normal" style={{ color: '#4b5563' }}>
              {' '}
              - {documentNo}
            </span>
          </h1>
          <div className="flex items-center gap-3">
            {toolbar}
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="text-sm hover:underline"
                style={{ color: '#2563eb' }}
              >
                Back
              </button>
            ) : null}
          </div>
        </div>
        <div className="space-y-4 px-4 py-3">{children}</div>
      </div>
    </div>
  );
}

export function DmsHeaderRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3">{children}</div>
  );
}

export function DmsInlineField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex min-w-0 items-center gap-2 text-sm" style={{ color: 'var(--foreground)' }}>
      <span className="whitespace-nowrap font-medium">{label}</span>
      {children}
    </label>
  );
}

export const dmsControlClass =
  'h-8 min-w-[11rem] rounded-sm border border-neutral-400 bg-[var(--background)] px-2 text-sm text-[var(--foreground)] outline-none focus:border-sky-600';
