'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { dashboardStatsApi, type DisposalBySectionItem } from '@/lib/api/dashboard-stats';

const COLORS = [
  '#C8102E', '#FFD100', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6B7280', '#3B82F6',
];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function DisposalBySectionWidget() {
  const [items, setItems] = useState<DisposalBySectionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    dashboardStatsApi.getDisposalBySection()
      .then(res => {
        setItems(res.items);
        setTotal(res.totalDisposal);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const chartData = items.map((item, i) => ({ ...item, color: COLORS[i % COLORS.length] }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Disposal by Section - Yesterday</CardTitle>
        <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
          {loading
            ? 'Loading...'
            : error
            ? 'Failed to load data'
            : `Total disposal: ${total.toLocaleString()} items`}
        </p>
      </CardHeader>
      <CardContent>
        {!loading && !error && items.length === 0 ? (
          <div className="flex items-center justify-center h-[300px]" style={{ color: '#6B7280' }}>
            No disposal data for yesterday
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={100}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                formatter={(value: number) => [`${value.toLocaleString()} items`, 'Quantity']}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value) => <span style={{ color: '#374151', fontSize: '12px' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
