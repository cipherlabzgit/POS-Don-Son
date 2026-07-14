'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Select from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Printer, Search, Eye, Loader2 } from 'lucide-react';
import { printApi, type PrintReceiptCard } from '@/lib/api/print';
import { deliveryPlansApi, type DeliveryPlan } from '@/lib/api/delivery-plans';
import { outletsApi, type Outlet } from '@/lib/api/outlets';
import { toast } from 'sonner';
import { formatSlDate, formatSlDateTime } from '@/lib/sri-lanka-time';

export default function PrintReceiptCardsPage() {
  const [deliveryPlans, setDeliveryPlans] = useState<DeliveryPlan[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [selectedOutletId, setSelectedOutletId] = useState<string>('');
  const [receiptCard, setReceiptCard] = useState<PrintReceiptCard | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [plansRes, outletsRes] = await Promise.all([
        deliveryPlansApi.getAll(1, 100),
        outletsApi.getAll(1, 100, undefined, undefined, true),
      ]);

      setDeliveryPlans(plansRes.deliveryPlans as any);
      setOutlets(outletsRes.outlets);
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReceipt = async () => {
    if (!selectedPlanId || !selectedOutletId) {
      toast.error('Please select a delivery plan and outlet');
      return;
    }

    try {
      setIsGenerating(true);
      const card = await printApi.getReceiptCard(selectedPlanId, selectedOutletId);
      setReceiptCard(card);
      toast.success('Receipt card generated successfully');
    } catch (error) {
      console.error('Error generating receipt card:', error);
      toast.error('Failed to generate receipt card');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    if (!receiptCard) {
      toast.error('No receipt card to print');
      return;
    }
    window.print();
  };

  const filteredOutlets = outlets.filter(o =>
    o.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: 'var(--brand-primary)' }} />
          <p style={{ color: 'var(--muted-foreground)' }}>Loading print receipt cards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Print Receipt Cards</h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Generate per-outlet receipt cards from confirmed delivery plans
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="primary" size="md" onClick={handlePrint} disabled={!receiptCard}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      <Card className="no-print">
        <CardHeader>
          <CardTitle>Select Delivery Plan and Outlet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Delivery Plan
              </label>
              <Select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                options={[
                  { value: '', label: 'Select a delivery plan' },
                  ...deliveryPlans.map(p => ({
                    value: p.id,
                    label: `${p.planNo} - ${formatSlDate(p.planDate)} (${p.status})`,
                  })),
                ]}
                fullWidth
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Outlet
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                <input
                  type="text"
                  placeholder="Search outlets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoComplete="off"
                  className="w-full pl-10 pr-4 py-2 rounded-lg text-sm"
                  style={{ border: '1px solid var(--input)' }}
                />
              </div>
            </div>

            <div className="flex items-end">
              <Button
                className="w-full"
                onClick={handleGenerateReceipt}
                disabled={!selectedPlanId || !selectedOutletId || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Receipt'
                )}
              </Button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
            {filteredOutlets.map(outlet => (
              <button
                key={outlet.id}
                onClick={() => setSelectedOutletId(outlet.id)}
                className="p-3 rounded-lg text-left transition-all"
                style={{
                  border: selectedOutletId === outlet.id ? '2px solid var(--brand-primary)' : '1px solid var(--border)',
                  backgroundColor: selectedOutletId === outlet.id ? 'var(--dms-destructive-soft)' : 'var(--dms-surface)',
                }}
              >
                <Badge variant={selectedOutletId === outlet.id ? 'primary' : 'neutral'} size="sm">
                  {outlet.code}
                </Badge>
                <p className="text-sm mt-1 font-medium truncate" style={{ color: 'var(--foreground)' }}>
                  {outlet.name}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {receiptCard && (
        <Card className="print-only">
          <CardContent className="p-8">
            <div className="space-y-4" style={{ fontFamily: 'monospace' }}>
              <div className="text-center">
                <h2 className="text-2xl font-bold">DON & SONS</h2>
                <p className="text-sm">Delivery Receipt Card</p>
                <p className="text-xs mt-2">
                  Date: {formatSlDate(receiptCard.deliveryDate)} • Turn: {receiptCard.turnName}
                </p>
              </div>

              <div className="text-sm border-t border-b border-dashed py-2">
                <p><strong>Outlet:</strong> {receiptCard.outletCode} - {receiptCard.outletName}</p>
                <p><strong>Address:</strong> {receiptCard.outletAddress}</p>
                {receiptCard.contactPerson && (
                  <p><strong>Contact:</strong> {receiptCard.contactPerson} {receiptCard.contactPhone && `(${receiptCard.contactPhone})`}</p>
                )}
              </div>

              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: '1px solid #ddd' }}>
                    <th className="text-left py-1">Code</th>
                    <th className="text-left py-1">Product</th>
                    <th className="text-right py-1">Full</th>
                    <th className="text-right py-1">Mini</th>
                    {receiptCard.products.some(p => p.isCustomized) && (
                      <th className="text-left py-1">Notes</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {receiptCard.products.map(p => (
                    <tr
                      key={p.productId}
                      style={{
                        borderBottom: '1px dotted #eee',
                        backgroundColor: p.isCustomized ? '#FEF3C7' : 'transparent'
                      }}
                    >
                      <td className="py-1">{p.productCode}</td>
                      <td className="py-1">{p.productName}</td>
                      <td className="text-right py-1">{p.fullQty}</td>
                      <td className="text-right py-1">{p.miniQty}</td>
                      {receiptCard.products.some(p => p.isCustomized) && (
                        <td className="text-xs py-1 italic">{p.customizationNotes || '-'}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between text-sm pt-2 border-t-2 border-black">
                <span><strong>TOTAL ITEMS</strong></span>
                <span><strong>{receiptCard.totalQuantity}</strong></span>
              </div>

              <div className="grid grid-cols-2 gap-8 text-xs pt-6">
                <div>
                  <p className="border-t border-black pt-1">Delivered By</p>
                  <p className="text-xs mt-4">Date: _____________ Time: _______</p>
                </div>
                <div>
                  <p className="border-t border-black pt-1">Received By</p>
                  <p className="text-xs mt-4">Date: _____________ Time: _______</p>
                </div>
              </div>

              <div className="text-center pt-4">
                <p className="text-xs">Printed: {formatSlDateTime(receiptCard.printedAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!receiptCard && !isGenerating && (
        <div
          className="text-center py-12 rounded-lg border-2 border-dashed no-print"
          style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)' }}
        >
          <Printer className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--muted-foreground)' }} />
          <p style={{ color: 'var(--muted-foreground)' }}>
            Select a delivery plan and outlet to generate receipt card
          </p>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-only, .print-only * {
            visibility: visible;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
