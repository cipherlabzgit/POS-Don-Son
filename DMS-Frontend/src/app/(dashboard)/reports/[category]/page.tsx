'use client';

import { useState } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { ArrowLeft, ChevronDown, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import ThemeToggle from '@/components/theme/theme-toggle';
import { useTheme } from '@/lib/theme/theme-context';
import { useAuthStore } from '@/lib/stores/auth-store';
import { isAdminUser } from '@/lib/date-restrictions';
import { getReportCategory } from '@/lib/reports-hub';

export default function ReportCategoryPage() {
  const params = useParams();
  const raw = typeof params.category === 'string' ? params.category : '';
  const { pageColor } = useTheme();
  const user = useAuthStore((s) => s.user);
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);
  const isAdmin = isAdminUser(user);
  const [detailsOpen, setDetailsOpen] = useState(true);

  const category = getReportCategory(raw);
  if (!category) {
    notFound();
  }

  const allowed =
    isAdmin ||
    category.anyOfPermissions.length === 0 ||
    hasAnyPermission(category.anyOfPermissions);

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
            <h1
              className="text-xl font-bold tracking-tight sm:text-2xl font-serif"
              style={{ color: 'var(--foreground)' }}
            >
              {category.title}
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {category.description}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 self-end sm:self-auto">
          <Link
            href="/reports"
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'var(--card)',
              color: 'var(--foreground)',
            }}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            All reports
          </Link>
          <ThemeToggle />
        </div>
      </Card>

      {!allowed ? (
        <Card className="rounded-2xl border p-6 text-center shadow-sm" padding="none">
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            You do not have permission to view this report section.
          </p>
          <Link href="/reports" className="mt-3 inline-block text-sm font-medium underline-offset-2 hover:underline" style={{ color: pageColor }}>
            Back to Reports
          </Link>
        </Card>
      ) : (
        <section>
          <details
            className="overflow-hidden rounded-xl border open:[&>summary>svg]:rotate-180"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}
            open={detailsOpen}
            onToggle={(e) => {
              const el = e.target as HTMLDetailsElement | null;
              if (!el) return;
              setDetailsOpen(el.open);
            }}
          >
            <summary className="flex cursor-pointer list-none items-start justify-between gap-3 p-4 sm:p-5 [&::-webkit-details-marker]:hidden">
              <div className="min-w-0 flex-1">
                <h2 className="font-serif text-lg font-bold sm:text-xl" style={{ color: 'var(--brand-primary)' }}>
                  {category.title}
                </h2>
                <p className="mt-1 text-xs sm:text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  {category.description}
                </p>
              </div>
              <ChevronDown
                className="mt-1 h-5 w-5 shrink-0 transition-transform duration-200"
                style={{ color: pageColor }}
                aria-hidden
              />
            </summary>
            <div className="border-t px-3 pb-4 pt-2 sm:px-5" style={{ borderColor: 'var(--border)' }}>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {category.reports.map((r) => {
                  const inner = (
                    <div className="flex h-full flex-col rounded-lg border p-3.5 text-left shadow-sm sm:p-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}>
                      <p className="font-semibold leading-snug" style={{ color: 'var(--foreground)' }}>
                        {r.title}
                      </p>
                      <p className="mt-1 flex-1 text-xs leading-snug sm:text-sm" style={{ color: 'var(--muted-foreground)' }}>
                        {r.description}
                      </p>
                      <div className="mt-3">
                        <span
                          className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: 'var(--dms-success-callout)',
                            color: 'var(--dms-success-text)',
                            border: '1px solid var(--dms-success-border)',
                          }}
                        >
                          Available
                        </span>
                      </div>
                    </div>
                  );

                  if (r.href) {
                    return (
                      <Link key={r.id} href={r.href} className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--page-accent-color)]">
                        {inner}
                      </Link>
                    );
                  }

                  return <div key={r.id}>{inner}</div>;
                })}
              </div>
              <p className="mt-4 text-center text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Report actions for this section will be wired in as we implement each export.
              </p>
            </div>
          </details>
        </section>
      )}
    </div>
  );
}
