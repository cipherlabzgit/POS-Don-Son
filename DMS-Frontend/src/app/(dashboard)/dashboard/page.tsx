'use client';

import { useAuthStore } from '@/lib/stores/auth-store';
import { SalesTrendWidget } from '@/components/dashboard/sales-trend-widget';
import { DisposalBySectionWidget } from '@/components/dashboard/disposal-by-section-widget';
import { TopDeliveriesWidget } from '@/components/dashboard/top-deliveries-widget';
import { DeliveryVsDisposalWidget } from '@/components/dashboard/delivery-vs-disposal-widget';
import { formatSlDate } from '@/lib/sri-lanka-time';

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-sm sm:text-base mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Here's what's happening with your business today.
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs sm:text-sm" style={{ color: 'var(--muted-foreground)' }}>Today's Date</p>
          <p className="text-base sm:text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
            {formatSlDate(new Date(), {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* 4-Quadrant Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Widget 1: Sales Trend */}
        <SalesTrendWidget />

        {/* Widget 2: Disposal by Section */}
        <DisposalBySectionWidget />

        {/* Widget 3: Top Deliveries */}
        <TopDeliveriesWidget />

        {/* Widget 4: Delivery vs Disposal */}
        <DeliveryVsDisposalWidget />
      </div>
    </div>
  );
}
