'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Select from '@/components/ui/select';
import { FileDown, Printer, Calculator, Loader2 } from 'lucide-react';
import { deliverySummaryApi, type DeliverySummary } from '@/lib/api/delivery-summary';
import { deliveryPlansApi, type DeliveryPlan } from '@/lib/api/delivery-plans';
import { deliveryTurnsApi, type DeliveryTurn } from '@/lib/api/delivery-turns';
import { toast } from 'sonner';
import { formatSlDate } from '@/lib/sri-lanka-time';

export default function DeliverySummaryPage() {
  const [deliveryPlans, setDeliveryPlans] = useState<DeliveryPlan[]>([]);
  const [deliveryTurns, setDeliveryTurns] = useState<DeliveryTurn[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTurnId, setSelectedTurnId] = useState<number | null>(null);
  const [summaryData, setSummaryData] = useState<DeliverySummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedTurnId) {
      loadSummary();
    }
  }, [selectedDate, selectedTurnId]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [turnsRes] = await Promise.all([
        deliveryTurnsApi.getAll(1, 100, undefined, true),
      ]);

      setDeliveryTurns(turnsRes.deliveryTurns);

      if (turnsRes.deliveryTurns.length > 0) {
        setSelectedTurnId(parseInt(turnsRes.deliveryTurns[0].id));
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSummary = async () => {
    if (!selectedTurnId) return;

    try {
      setIsLoading(true);
      const data = await deliverySummaryApi.getDeliverySummary(selectedDate, selectedTurnId);
      setSummaryData(data);
    } catch (error) {
      console.error('Error loading delivery summary:', error);
      toast.error('Failed to load delivery summary');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !summaryData) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: 'var(--brand-primary)' }} />
          <p style={{ color: 'var(--muted-foreground)' }}>Loading delivery summary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Delivery Summary</h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>Complete delivery summary with outlet quantities and totals</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="secondary" size="md"><Printer className="w-4 h-4 mr-2" />Print</Button>
          <Button variant="primary" size="md"><FileDown className="w-4 h-4 mr-2" />Export Excel</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Filter Options</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Delivery Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 rounded border"
                style={{ borderColor: 'var(--input)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Delivery Turn
              </label>
              <Select
                value={selectedTurnId?.toString() || ''}
                onChange={(e) => setSelectedTurnId(parseInt(e.target.value))}
                options={deliveryTurns.map(t => ({ value: t.id, label: t.name }))}
                fullWidth
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {summaryData && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Summary - {formatSlDate(summaryData.deliveryDate)} • {summaryData.turnName}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y" style={{ borderColor: 'var(--border)' }}>
                  <thead style={{ backgroundColor: 'var(--muted)' }}>
                    <tr>
                      <th className="sticky left-0 z-10 px-4 py-3 text-left text-xs font-medium" style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', minWidth: '200px' }}>Product</th>
                      
                      {summaryData.outlets.map(outlet => (
                        <th key={outlet.outletId} className="px-3 py-3 text-center text-xs font-medium" style={{ color: 'var(--muted-foreground)', minWidth: '80px' }}>{outlet.outletCode}</th>
                      ))}
                      
                      <th className="px-4 py-3 text-center text-xs font-medium" style={{ color: 'var(--muted-foreground)', minWidth: '100px', backgroundColor: 'var(--dms-amber)' }}>Grand Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                    {summaryData.productTotals.map((productTotal) => (
                      <tr key={productTotal.productId}>
                        <td className="sticky left-0 z-10 px-4 py-3 text-sm font-medium" style={{ color: 'var(--foreground)', backgroundColor: 'var(--card)' }}>
                          {productTotal.productCode} - {productTotal.productName}
                        </td>
                        
                        {summaryData.outlets.map(outlet => {
                          const product = outlet.products.find(p => p.productId === productTotal.productId);
                          const qty = product?.totalQty || 0;
                          return (
                            <td key={outlet.outletId} className="px-3 py-3 text-center text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                              {qty}
                            </td>
                          );
                        })}
                        
                        <td className="px-4 py-3 text-center text-lg font-bold" style={{ color: 'var(--dms-amber-fg)', backgroundColor: 'var(--dms-amber)' }}>
                          {productTotal.grandTotal}
                        </td>
                      </tr>
                    ))}
                    
                    <tr style={{ backgroundColor: 'var(--muted)' }}>
                      <td className="sticky left-0 z-10 px-4 py-4 text-sm font-bold" style={{ color: 'var(--foreground)', backgroundColor: 'var(--muted)' }}>GRAND TOTAL</td>
                      {summaryData.outlets.map(outlet => {
                        const outletTotal = outlet.products.reduce((sum, p) => sum + p.totalQty, 0);
                        return <td key={outlet.outletId} className="px-3 py-4 text-center text-sm font-bold" style={{ color: 'var(--foreground)' }}>{outletTotal}</td>;
                      })}
                      <td className="px-4 py-4 text-center text-xl font-bold" style={{ color: 'var(--dms-amber-fg)', backgroundColor: 'var(--dms-amber)' }}>
                        {summaryData.productTotals.reduce((sum, p) => sum + p.grandTotal, 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Total Products</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: 'var(--foreground)' }}>{summaryData.productTotals.length}</p>
                  </div>
                  <Calculator className="w-10 h-10" style={{ color: '#C8102E' }} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Total Outlets</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: 'var(--foreground)' }}>{summaryData.outlets.length}</p>
                  </div>
                  <Calculator className="w-10 h-10" style={{ color: '#10B981' }} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Overall Total</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: 'var(--foreground)' }}>
                      {summaryData.productTotals.reduce((sum, p) => sum + p.grandTotal, 0)}
                    </p>
                  </div>
                  <Calculator className="w-10 h-10" style={{ color: '#F59E0B' }} />
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {!summaryData && !isLoading && (
        <div
          className="text-center py-12 rounded-lg border-2 border-dashed"
          style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)' }}
        >
          <Calculator className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--muted-foreground)' }} />
          <p style={{ color: 'var(--muted-foreground)' }}>
            Select a date and turn to view delivery summary
          </p>
        </div>
      )}

      <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--dms-notes)', border: '1px solid var(--dms-notes-border)' }}>
        <p className="text-sm font-medium mb-2" style={{ color: 'var(--dms-notes-title)' }}>Notes:</p>
        <ul className="text-sm space-y-1" style={{ color: 'var(--dms-notes-fg)' }}>
          <li>• Summary shows aggregated delivery quantities by outlet and product</li>
          <li>• Data includes both regular and customized orders</li>
          <li>• Grand total shows the sum across all outlets</li>
          <li>• Select different dates and turns to view different summaries</li>
        </ul>
      </div>
    </div>
  );
}
