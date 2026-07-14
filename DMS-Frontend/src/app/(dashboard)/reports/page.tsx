'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ChevronDown, FileText, Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { DailyProductionReportModal } from '@/components/reports/DailyProductionReportModal';
import { DailyShowroomTotalsReportModal } from '@/components/reports/DailyShowroomTotalsReportModal';
import { DailySalesSystemBalanceReportModal } from '@/components/reports/DailySalesSystemBalanceReportModal';
import { StockBfReportModal } from '@/components/reports/StockBfReportModal';
import { DailySaleReportModal } from '@/components/reports/DailySaleReportModal';
import { DailySaleOfItemReportModal } from '@/components/reports/DailySaleOfItemReportModal';
import { SalesSummaryReportModal } from '@/components/reports/SalesSummaryReportModal';
import { useTheme } from '@/lib/theme/theme-context';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useDayEndStore } from '@/lib/stores/day-end-store';
import { isAdminUser } from '@/lib/date-restrictions';
import { REPORT_CATEGORIES } from '@/lib/reports-hub';

function ReportCardBody({
  title,
  description,
  href,
  pageColor,
  onActivate,
}: {
  title: string;
  description: string;
  href?: string;
  pageColor: string;
  /** When set (and no href), the card behaves as a button (e.g. open report modal). */
  onActivate?: () => void;
}) {
  const inner = (
    <>
      <p className="font-semibold leading-snug" style={{ color: 'var(--foreground)' }}>
        {title}
      </p>
      <p className="mt-1 text-xs leading-snug sm:text-sm" style={{ color: 'var(--muted-foreground)' }}>
        {description}
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
    </>
  );

  const cardClass =
    'block rounded-lg border p-3 text-left shadow-sm transition-shadow sm:p-3.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--page-accent-color)]';

  if (onActivate && !href) {
    return (
      <button
        type="button"
        className={`${cardClass} w-full hover:shadow-md`}
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}
        onClick={onActivate}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = `0 8px 20px -8px color-mix(in srgb, ${pageColor} 28%, transparent)`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '';
        }}
      >
        {inner}
      </button>
    );
  }

  if (href) {
    return (
      <Link
        href={href}
        className={`${cardClass} hover:shadow-md`}
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = `0 8px 20px -8px color-mix(in srgb, ${pageColor} 28%, transparent)`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '';
        }}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div className={cardClass} style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}>
      {inner}
    </div>
  );
}

export default function ReportsPage() {
  const { pageColor } = useTheme();
  const user = useAuthStore((s) => s.user);
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const isAdmin = isAdminUser(user);
  const lastDayEndProcessDate = useDayEndStore((s) => s.lastDayEndProcessDate);
  const getMinReportDate = useDayEndStore((s) => s.getMinReportDate);

  const canSeeLegacy = isAdmin || hasPermission('reports:view');

  const dayEndFloor = useMemo(() => getMinReportDate(), [getMinReportDate, lastDayEndProcessDate]);
  const canBypassReportDayEnd = isAdmin || hasPermission('reports:allow-back-date');

  const categoryAccess = useMemo(() => {
    return REPORT_CATEGORIES.map((c) => {
      const allowed =
        isAdmin ||
        c.anyOfPermissions.length === 0 ||
        hasAnyPermission(c.anyOfPermissions);
      return { ...c, allowed };
    });
  }, [isAdmin, hasAnyPermission]);

  const [sectionOpen, setSectionOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(REPORT_CATEGORIES.map((c) => [c.id, false])),
  );

  const [dailyProductionModalOpen, setDailyProductionModalOpen] = useState(false);
  const [salesSummaryModalOpen, setSalesSummaryModalOpen] = useState(false);
  const [dailyShowroomTotalsModalOpen, setDailyShowroomTotalsModalOpen] = useState(false);
  const [dailySalesSystemBalanceModalOpen, setDailySalesSystemBalanceModalOpen] = useState(false);
  const [stockBfReportModalOpen, setStockBfReportModalOpen] = useState(false);
  const [dailySaleReportModalOpen, setDailySaleReportModalOpen] = useState(false);
  const [dailySaleOfItemReportModalOpen, setDailySaleOfItemReportModalOpen] = useState(false);

  return (
    <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">

      {!canBypassReportDayEnd && dayEndFloor && (
        <div
          className="flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs sm:text-sm"
          style={{
            backgroundColor: 'var(--dms-warn-box)',
            borderColor: 'var(--dms-warn-box-border)',
            color: 'var(--dms-warn-label)',
          }}
        >
          <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            Report dates are limited after the last Day-End Process ({lastDayEndProcessDate || 'N/A'}). Earliest
            selectable date: <strong>{dayEndFloor}</strong>. Users with Back Date permission are exempt.
          </p>
        </div>
      )}

      {!canBypassReportDayEnd && !dayEndFloor && (
        <div
          className="flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs sm:text-sm"
          style={{
            backgroundColor: 'var(--dms-success-callout)',
            borderColor: 'var(--dms-success-border)',
            color: 'var(--dms-success-text)',
          }}
        >
          <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            No Day-End Process recorded yet. Historical dates stay available until day-end sets a minimum report date.
          </p>
        </div>
      )}

      {canBypassReportDayEnd && (
        <div
          className="flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs sm:text-sm"
          style={{
            backgroundColor: 'var(--dms-info-soft)',
            borderColor: 'var(--dms-info-soft-border)',
            color: 'var(--dms-blue-fg)',
          }}
        >
          <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            Day-end date floor does not apply to your account. Last Day-End: <strong>{lastDayEndProcessDate || 'N/A'}</strong>.
          </p>
        </div>
      )}

      <Card className="rounded-2xl shadow-md" padding="md">
        <h2 className="font-serif text-lg font-bold tracking-tight sm:text-xl" style={{ color: 'var(--brand-primary)' }}>
          Reports Dashboard
        </h2>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-start">
          {categoryAccess.map((cat) => {
            if (!cat.allowed) {
              return (
                <div
                  key={cat.id}
                  className="rounded-xl border p-4 opacity-60"
                  style={{
                    borderColor: 'var(--border)',
                    backgroundColor: 'var(--card)',
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold leading-tight" style={{ color: 'var(--foreground)' }}>
                        {cat.title}
                      </p>
                      <p className="mt-1 text-xs leading-snug sm:text-sm" style={{ color: 'var(--muted-foreground)' }}>
                        {cat.description}
                      </p>
                    </div>
                    <Lock className="h-5 w-5 shrink-0 text-[var(--muted-foreground)]" aria-hidden />
                  </div>
                  <p className="mt-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    No permission for this section.
                  </p>
                </div>
              );
            }

            return (
              <details
                key={cat.id}
                className="overflow-hidden rounded-xl border open:[&>summary>svg]:rotate-180"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}
                open={sectionOpen[cat.id] ?? false}
                onToggle={(e) => {
                  const el = e.target as HTMLDetailsElement | null;
                  if (!el) return;
                  const nextOpen = el.open;
                  setSectionOpen((prev) => ({ ...prev, [cat.id]: nextOpen }));
                }}
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-tight" style={{ color: 'var(--foreground)' }}>
                      {cat.title}
                    </p>
                    <p className="mt-1 text-xs leading-snug sm:text-sm" style={{ color: 'var(--muted-foreground)' }}>
                      {cat.description}
                    </p>
                  </div>
                  <ChevronDown
                    className="mt-0.5 h-5 w-5 shrink-0 transition-transform duration-200"
                    style={{ color: pageColor }}
                    aria-hidden
                  />
                </summary>
                <div
                  className="border-t px-3 pb-4 pt-2 sm:px-4"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="flex flex-col gap-2.5">
                    {cat.reports.map((r) => (
                      <ReportCardBody
                        key={r.id}
                        title={r.title}
                        description={r.description}
                        href={r.href}
                        pageColor={pageColor}
                        onActivate={
                          r.id === 'daily-production'
                            ? () => setDailyProductionModalOpen(true)
                            : r.id === 'sales-summary'
                              ? () => setSalesSummaryModalOpen(true)
                              : r.id === 'daily-showroom-totals'
                                ? () => setDailyShowroomTotalsModalOpen(true)
                                : r.id === 'daily-sales-system-balance'
                                  ? () => setDailySalesSystemBalanceModalOpen(true)
                                  : r.id === 'stock-bf'
                                    ? () => setStockBfReportModalOpen(true)
                                    : r.id === 'daily-sale-report'
                                      ? () => setDailySaleReportModalOpen(true)
                                      : r.id === 'daily-sale-of-item'
                                        ? () => setDailySaleOfItemReportModalOpen(true)
                                        : undefined
                        }
                      />
                    ))}
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      </Card>

      <DailyProductionReportModal
        isOpen={dailyProductionModalOpen}
        onClose={() => setDailyProductionModalOpen(false)}
        minReportDate={dayEndFloor}
        canBypassReportDayEnd={canBypassReportDayEnd}
      />

      <SalesSummaryReportModal
        isOpen={salesSummaryModalOpen}
        onClose={() => setSalesSummaryModalOpen(false)}
        minReportDate={dayEndFloor}
        canBypassReportDayEnd={canBypassReportDayEnd}
      />

      <DailyShowroomTotalsReportModal
        isOpen={dailyShowroomTotalsModalOpen}
        onClose={() => setDailyShowroomTotalsModalOpen(false)}
        minReportDate={dayEndFloor}
        canBypassReportDayEnd={canBypassReportDayEnd}
      />

      <DailySalesSystemBalanceReportModal
        isOpen={dailySalesSystemBalanceModalOpen}
        onClose={() => setDailySalesSystemBalanceModalOpen(false)}
        minReportDate={dayEndFloor}
        canBypassReportDayEnd={canBypassReportDayEnd}
      />

      <StockBfReportModal
        isOpen={stockBfReportModalOpen}
        onClose={() => setStockBfReportModalOpen(false)}
        minReportDate={dayEndFloor}
        canBypassReportDayEnd={canBypassReportDayEnd}
      />

      <DailySaleReportModal
        isOpen={dailySaleReportModalOpen}
        onClose={() => setDailySaleReportModalOpen(false)}
        minReportDate={dayEndFloor}
        canBypassReportDayEnd={canBypassReportDayEnd}
      />

      <DailySaleOfItemReportModal
        isOpen={dailySaleOfItemReportModalOpen}
        onClose={() => setDailySaleOfItemReportModalOpen(false)}
        minReportDate={dayEndFloor}
        canBypassReportDayEnd={canBypassReportDayEnd}
      />
    </div>
  );
}
