'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { brandColors } from '@/lib/theme/colors';
import { dashboardStatsApi, type DeliveryVsDisposalItem } from '@/lib/api/dashboard-stats';

export function DeliveryVsDisposalWidget() {
  const [items, setItems] = useState<DeliveryVsDisposalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    dashboardStatsApi.getDeliveryVsDisposal(7)
      .then(res => setItems(res.items))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery vs Disposal Trend - 7 Days</CardTitle>
        <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
          {loading
            ? 'Loading...'
            : error
            ? 'Failed to load data'
            : 'Comparison by production section'}
        </p>
      </CardHeader>
      <CardContent>
        {!loading && !error && items.length === 0 ? (
          <div className="flex items-center justify-center h-[300px]" style={{ color: '#6B7280' }}>
            No data for this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={items.map(i => ({ category: i.category, delivery: i.deliveryQty, disposal: i.disposalQty }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="category"
                tick={{ fill: '#6B7280', fontSize: 11 }}
                axisLine={{ stroke: '#E5E7EB' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={{ stroke: '#E5E7EB' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                formatter={(value: number) => [`${value.toLocaleString()} items`, '']}
              />
              <Legend
                wrapperStyle={{ paddingTop: '10px' }}
                iconType="rect"
                formatter={(value) => (
                  <span style={{ color: '#374151', fontSize: '13px' }}>
                    {value === 'delivery' ? 'Delivery Quantity' : 'Disposal Quantity'}
                  </span>
                )}
              />
              <Bar dataKey="delivery" fill={brandColors.primary.DEFAULT} radius={[4, 4, 0, 0]} />
              <Bar dataKey="disposal" fill={brandColors.accent.DEFAULT} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
