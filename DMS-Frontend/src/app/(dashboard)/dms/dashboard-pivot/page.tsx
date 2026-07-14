'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { FileBarChart, Download, Loader2 } from 'lucide-react';
import { dashboardPivotApi, type DashboardPivot } from '@/lib/api/dashboard-pivot';
import { toast } from 'sonner';
import { formatSlDate } from '@/lib/sri-lanka-time';

export default function DashboardPivotPage() {
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [pivotData, setPivotData] = useState<DashboardPivot | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGeneratePivot = async () => {
    try {
      setIsLoading(true);
      const data = await dashboardPivotApi.getDashboardPivot(dateFrom, dateTo);
      setPivotData(data);
      toast.success('Pivot data generated successfully');
    } catch (error) {
      console.error('Error generating pivot:', error);
      toast.error('Failed to generate pivot data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <FileBarChart className="w-8 h-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pivot Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Multi-dimensional analysis with date range filtering
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Date Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div className="flex items-end">
              <Button className="w-full" onClick={handleGeneratePivot} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileBarChart className="w-4 h-4 mr-2" />
                    Generate Pivot
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pivot Grid */}
      {pivotData && pivotData.rows.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pivot Grid - Products × Dates</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Download className="w-4 h-4 mr-1" />
                  Excel
                </Button>
                <Button size="sm" variant="outline">
                  <Download className="w-4 h-4 mr-1" />
                  PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ backgroundColor: 'var(--muted)' }}>
                    <th className="border p-2 text-left font-semibold" style={{ borderColor: 'var(--border)' }}>Product</th>
                    {pivotData.dateColumns.map(date => (
                      <th key={date} className="border p-2 text-center font-semibold text-xs" style={{ borderColor: 'var(--border)' }}>
                        {formatSlDate(date, {  month: 'short', day: 'numeric'  })}
                      </th>
                    ))}
                    <th className="border p-2 text-center font-semibold bg-blue-100">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {pivotData.rows.map((row, idx) => (
                    <tr key={idx} className="[&:hover]:bg-[var(--muted)]" style={{ backgroundColor: 'var(--card)' }}>
                      <td className="border p-2 font-medium text-sm" style={{ borderColor: 'var(--border)' }}>
                        {row.productCode} - {row.productName}
                      </td>
                      {pivotData.dateColumns.map(date => {
                        const cellData = row.dateValues[date];
                        return (
                          <td key={date} className="border p-2 text-center text-sm" style={{ borderColor: 'var(--border)' }}>
                            {cellData?.quantity || 0}
                          </td>
                        );
                      })}
                      <td
                        className="border p-2 text-center font-bold text-sm"
                        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--dms-blue)' }}
                      >
                        {row.rowTotal}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: 'var(--muted)' }}>
                    <td className="border p-2 font-bold" style={{ borderColor: 'var(--border)' }}>TOTAL</td>
                    {pivotData.dateColumns.map(date => {
                      const total = pivotData.rows.reduce((sum, row) => sum + (row.dateValues[date]?.quantity || 0), 0);
                      return (
                        <td key={date} className="border p-2 text-center font-bold text-sm" style={{ borderColor: 'var(--border)' }}>
                          {total}
                        </td>
                      );
                    })}
                    <td
                      className="border p-2 text-center font-bold"
                      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--dms-blue)' }}
                    >
                      {pivotData.rows.reduce((sum, row) => sum + row.rowTotal, 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {(!pivotData || pivotData.rows.length === 0) && !isLoading && (
        <div
          className="text-center py-12 rounded-lg border-2 border-dashed"
          style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)' }}
        >
          <FileBarChart className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--muted-foreground)' }} />
          <p style={{ color: 'var(--muted-foreground)' }}>
            Select a date range and generate the pivot to see the analysis
          </p>
        </div>
      )}
    </div>
  );
}
