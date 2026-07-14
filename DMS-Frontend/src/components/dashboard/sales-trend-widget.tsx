'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { brandColors } from '@/lib/theme/colors';
import { dashboardStatsApi, type SalesTrendPoint } from '@/lib/api/dashboard-stats';

export function SalesTrendWidget() {
  const [data, setData] = useState<SalesTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    dashboardStatsApi.getSalesTrend(7)
      .then(res => setData(res.points))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const grandTotal = data.reduce((sum, p) => sum + p.totalValue, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Trend for Last 7 Days</CardTitle>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          {loading
            ? 'Loading...'
            : error
            ? 'Failed to load data'
            : `Total: Rs. ${grandTotal.toLocaleString()}`}
        </p>
      </CardHeader>
      <CardContent>
        {!loading && !error && data.length === 0 ? (
          <div className="flex items-center justify-center h-[300px]" style={{ color: 'var(--muted-foreground)' }}>
            No delivery data for this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.map(p => ({ date: p.date, value: p.totalValue }))}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={brandColors.primary.DEFAULT} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={brandColors.primary.DEFAULT} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                axisLine={{ stroke: 'var(--border)' }}
              />
              <YAxis
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                axisLine={{ stroke: 'var(--border)' }}
                tickFormatter={(v) =>
                  v >= 1_000_000
                    ? `${(v / 1_000_000).toFixed(1)}M`
                    : v >= 1_000
                    ? `${(v / 1_000).toFixed(0)}K`
                    : String(v)
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--popover)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  color: 'var(--popover-foreground)',
                }}
                formatter={(value: number) => [`Rs. ${value.toLocaleString()}`, 'Sales']}
                labelStyle={{ color: 'var(--foreground)', fontWeight: 'bold' }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={brandColors.primary.DEFAULT}
                strokeWidth={2}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
