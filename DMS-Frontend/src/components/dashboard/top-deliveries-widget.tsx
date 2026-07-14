'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { brandColors } from '@/lib/theme/colors';
import { dashboardStatsApi, type TopDeliveryOutlet } from '@/lib/api/dashboard-stats';

export function TopDeliveriesWidget() {
  const [outlets, setOutlets] = useState<TopDeliveryOutlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    dashboardStatsApi.getTopDeliveries()
      .then(res => setOutlets(res.outlets))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const chartData = outlets.map(o => ({ showroom: o.outletCode, count: o.deliveryCount }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today Top Deliveries</CardTitle>
        <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
          {loading
            ? 'Loading...'
            : error
            ? 'Failed to load data'
            : 'Showrooms ranked by delivery count'}
        </p>
      </CardHeader>
      <CardContent>
        {!loading && !error && outlets.length === 0 ? (
          <div className="flex items-center justify-center h-[300px]" style={{ color: '#6B7280' }}>
            No deliveries approved today
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Table */}
            <div>
              <div className="overflow-hidden rounded-lg" style={{ border: '1px solid #E5E7EB' }}>
                <table className="min-w-full divide-y" style={{ borderColor: '#E5E7EB' }}>
                  <thead style={{ backgroundColor: '#F9FAFB' }}>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>
                        Showroom
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>
                        Deliveries
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y" style={{ borderColor: '#E5E7EB' }}>
                    {outlets.map((item, index) => (
                      <tr key={item.outletCode} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#F9FAFB' }}>
                        <td className="px-4 py-3 text-sm font-medium" style={{ color: '#111827' }}>
                          {item.outletCode}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold" style={{ color: '#C8102E' }}>
                          {item.deliveryCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bar Chart */}
            <div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={{ stroke: '#E5E7EB' }} />
                  <YAxis
                    type="category"
                    dataKey="showroom"
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    axisLine={{ stroke: '#E5E7EB' }}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value: number) => [`${value} deliveries`, 'Count']}
                  />
                  <Bar dataKey="count" fill={brandColors.primary.DEFAULT} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
