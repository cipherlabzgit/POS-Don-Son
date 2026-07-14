'use client';

import Link from 'next/link';
import { FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import ThemeToggle from '@/components/theme/theme-toggle';
import { useTheme } from '@/lib/theme/theme-context';

export default function ReportsLegacyPage() {
  const { pageColor } = useTheme();

  return (
    <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
      <Card
        className="flex flex-col gap-4 rounded-2xl p-4 shadow-md sm:flex-row sm:items-center sm:justify-between sm:p-5"
        padding="none"
      >
        <div className="flex items-start gap-3 sm:items-center">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
            style={{ backgroundColor: pageColor }}
            aria-hidden
          >
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-serif text-xl font-bold tracking-tight sm:text-2xl" style={{ color: 'var(--foreground)' }}>
              Classic report generator
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Legacy all-in-one reporting tool.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center justify-end gap-2 self-end sm:self-auto">
          <ThemeToggle />
        </div>
      </Card>

      <Card className="rounded-2xl p-6 text-center shadow-md" padding="none">
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          This area is being rebuilt. Use the new{' '}
          <Link href="/reports" className="font-medium underline-offset-2 hover:underline" style={{ color: pageColor }}>
            Reports hub
          </Link>{' '}
          for category-based access.
        </p>
      </Card>
    </div>
  );
}
