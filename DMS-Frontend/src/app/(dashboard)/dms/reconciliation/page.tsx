'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, AlertTriangle, CheckCircle, Search, Download, Loader2, Plus, Save } from 'lucide-react';
import { reconciliationsApi, type ReconciliationDetail, type ReconciliationItem } from '@/lib/api/reconciliations';
import { deliveryPlansApi, type DeliveryPlan } from '@/lib/api/delivery-plans';
import { outletsApi, type Outlet } from '@/lib/api/outlets';
import { toast } from 'sonner';
import { formatSlDate } from '@/lib/sri-lanka-time';

type ReconciliationListItem = {
  id: string;
  reconciliationNo: string;
  reconciliationDate: string;
  outletName: string;
  status: 'InProgress' | 'Submitted' | 'Approved';
  itemsCount: number;
  varianceCount: number;
};

export default function ReconciliationPage() {
  const [reconciliations, setReconciliations] = useState<ReconciliationListItem[]>([]);
  const [deliveryPlans, setDeliveryPlans] = useState<DeliveryPlan[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedReconciliationId, setSelectedReconciliationId] = useState<string | null>(null);
  const [reconciliationDetail, setReconciliationDetail] = useState<ReconciliationDetail | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [selectedOutletId, setSelectedOutletId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [reconciliationsRes, plansRes, outletsRes] = await Promise.all([
        reconciliationsApi.getAllReconciliations(),
        deliveryPlansApi.getAll(1, 100),
        outletsApi.getAll(1, 100, undefined, undefined, true),
      ]);

      const mappedReconciliations: ReconciliationListItem[] = reconciliationsRes.map((r: any) => ({
        id: r.id,
        reconciliationNo: r.reconciliationNo,
        reconciliationDate: r.reconciliationDate,
        outletName: r.outletName,
        status: r.status,
        itemsCount: r.items?.length || 0,
        varianceCount: r.items?.filter((i: any) => i.varianceType !== 'Match').length || 0,
      }));

      setReconciliations(mappedReconciliations);
      setDeliveryPlans(plansRes.deliveryPlans as any);
      setOutlets(outletsRes.outlets);
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitialize = async () => {
    if (!selectedPlanId || !selectedOutletId) {
      toast.error('Please select a delivery plan and outlet');
      return;
    }

    try {
      setIsInitializing(true);
      const reconciliation = await reconciliationsApi.createReconciliation({
        reconciliationDate: selectedDate,
        deliveryPlanId: selectedPlanId,
        outletId: selectedOutletId,
      });
      setReconciliationDetail(reconciliation);
      setIsCreatingNew(false);
      await loadInitialData();
      toast.success('Reconciliation initialized successfully');
    } catch (error) {
      console.error('Error initializing reconciliation:', error);
      toast.error('Failed to initialize reconciliation');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleLoadReconciliation = async (id: string) => {
    try {
      setIsLoading(true);
      const detail = await reconciliationsApi.getReconciliationById(id);
      setReconciliationDetail(detail);
      setSelectedReconciliationId(id);
    } catch (error) {
      console.error('Error loading reconciliation:', error);
      toast.error('Failed to load reconciliation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateActualQty = (itemId: string, actualQty: number) => {
    if (!reconciliationDetail) return;
    
    setReconciliationDetail(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        items: prev.items.map(item => {
          if (item.id === itemId) {
            const variance = actualQty - item.expectedQty;
            let varianceType: 'Match' | 'Shortage' | 'Excess' = 'Match';
            if (variance < 0) varianceType = 'Shortage';
            else if (variance > 0) varianceType = 'Excess';
            
            return {
              ...item,
              actualQty,
              varianceQty: variance,
              varianceType,
            };
          }
          return item;
        }),
      };
    });
  };

  const handleUpdateReason = (itemId: string, reason: string) => {
    if (!reconciliationDetail) return;
    
    setReconciliationDetail(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        items: prev.items.map(item => 
          item.id === itemId ? { ...item, reason } : item
        ),
      };
    });
  };

  const handleSaveActualQuantities = async () => {
    if (!reconciliationDetail) return;

    try {
      setIsSaving(true);
      const updated = await reconciliationsApi.updateActualQuantities(reconciliationDetail.id, {
        items: reconciliationDetail.items.map(item => ({
          itemId: item.id,
          actualQty: item.actualQty,
          reason: item.reason,
        })),
      });
      setReconciliationDetail(updated);
      toast.success('Actual quantities saved successfully');
    } catch (error) {
      console.error('Error saving actual quantities:', error);
      toast.error('Failed to save actual quantities');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!reconciliationDetail) return;

    try {
      setIsSubmitting(true);
      const updated = await reconciliationsApi.submitReconciliation(reconciliationDetail.id, 'current-user-id');
      setReconciliationDetail(updated);
      await loadInitialData();
      toast.success('Reconciliation submitted successfully');
    } catch (error) {
      console.error('Error submitting reconciliation:', error);
      toast.error('Failed to submit reconciliation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredReconciliations = useMemo(() => {
    return reconciliations.filter(r => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        r.reconciliationNo.toLowerCase().includes(term) ||
        r.outletName.toLowerCase().includes(term)
      );
    });
  }, [reconciliations, searchTerm]);

  const varianceItems = reconciliationDetail?.items.filter(i => i.varianceType !== 'Match') || [];

  if (isLoading && !reconciliationDetail) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: 'var(--brand-primary)' }} />
          <p style={{ color: 'var(--muted-foreground)' }}>Loading reconciliations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Reconciliation</h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Match delivery quantities against actual deliveries and track variances
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="md">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="primary" size="md" onClick={() => setIsCreatingNew(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Reconciliation
          </Button>
        </div>
      </div>

      {isCreatingNew && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Initialize New Reconciliation</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setIsCreatingNew(false)}>
                Cancel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  style={{ borderColor: 'var(--input)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Delivery Plan</label>
                <Select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  options={[
                    { value: '', label: 'Select plan' },
                    ...deliveryPlans.map(p => ({
                      value: p.id,
                      label: `${p.planNo} - ${formatSlDate(p.planDate)}`,
                    })),
                  ]}
                  fullWidth
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Outlet</label>
                <Select
                  value={selectedOutletId}
                  onChange={(e) => setSelectedOutletId(e.target.value)}
                  options={[
                    { value: '', label: 'Select outlet' },
                    ...outlets.map(o => ({
                      value: o.id,
                      label: `${o.code} - ${o.name}`,
                    })),
                  ]}
                  fullWidth
                />
              </div>

              <div className="flex items-end">
                <Button
                  className="w-full"
                  onClick={handleInitialize}
                  disabled={!selectedPlanId || !selectedOutletId || isInitializing}
                >
                  {isInitializing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    'Initialize'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!reconciliationDetail && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Reconciliation List ({filteredReconciliations.length})</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoComplete="off"
                  className="pl-10 pr-4 py-2 rounded-lg text-sm"
                  style={{ border: '1px solid var(--input)' }}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredReconciliations.map(recon => (
                <div
                  key={recon.id}
                  className="p-4 rounded-lg border cursor-pointer transition-colors hover:bg-[var(--muted)]"
                  style={{ borderColor: 'var(--border)' }}
                  onClick={() => handleLoadReconciliation(recon.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{recon.reconciliationNo}</span>
                        <Badge
                          variant={
                            recon.status === 'InProgress' ? 'warning' :
                            recon.status === 'Submitted' ? 'info' : 'success'
                          }
                          size="sm"
                        >
                          {recon.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                        <span>{formatSlDate(recon.reconciliationDate)}</span>
                        <span>•</span>
                        <span>{recon.outletName}</span>
                        <span>•</span>
                        <span>{recon.itemsCount} items</span>
                        {recon.varianceCount > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-red-600 font-semibold">{recon.varianceCount} variances</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {filteredReconciliations.length === 0 && (
                <div className="text-center py-8" style={{ color: 'var(--muted-foreground)' }}>
                  No reconciliations found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {reconciliationDetail && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3">
                    {reconciliationDetail.reconciliationNo}
                    <Badge
                      variant={
                        reconciliationDetail.status === 'InProgress' ? 'warning' :
                        reconciliationDetail.status === 'Submitted' ? 'info' : 'success'
                      }
                      size="md"
                    >
                      {reconciliationDetail.status}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                    {formatSlDate(reconciliationDetail.reconciliationDate)} • {reconciliationDetail.outletName}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setReconciliationDetail(null)}>
                    Back to List
                  </Button>
                  {reconciliationDetail.status === 'InProgress' && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleSaveActualQuantities}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save
                          </>
                        )}
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Submit
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {varianceItems.length > 0 && (
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--dms-error-callout)', border: '1px solid var(--dms-error-border)' }}>
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 mt-0.5" style={{ color: 'var(--dms-error-text)' }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--dms-error-text)' }}>
                    {varianceItems.length} variance{varianceItems.length !== 1 ? 's' : ''} detected
                  </p>
                  <p className="text-sm mt-1" style={{ color: 'var(--dms-error-text)' }}>
                    Please review and provide reasons for variances before submitting.
                  </p>
                </div>
              </div>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Reconciliation Items ({reconciliationDetail.items.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y" style={{ borderColor: 'var(--border)' }}>
                  <thead style={{ backgroundColor: 'var(--muted)' }}>
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                        Product
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                        Expected Qty
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                        Actual Qty
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                        Variance
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                        Status
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                        Reason
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                    {reconciliationDetail.items.map(item => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 text-sm">
                          <div>
                            <span className="font-mono text-xs">{item.productCode}</span>
                            <p className="font-medium">{item.productName}</p>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center text-sm font-semibold">
                          {item.expectedQty}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="number"
                            value={item.actualQty}
                            onChange={(e) => handleUpdateActualQty(item.id, parseInt(e.target.value) || 0)}
                            disabled={reconciliationDetail.status !== 'InProgress'}
                            className="w-20 px-2 py-1 text-center border rounded"
                            style={{ borderColor: 'var(--input)' }}
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className="font-bold text-sm"
                            style={{
                              color: item.varianceQty === 0 ? '#10B981' : item.varianceQty < 0 ? '#DC2626' : '#F59E0B',
                            }}
                          >
                            {item.varianceQty > 0 ? `+${item.varianceQty}` : item.varianceQty}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Badge
                            variant={
                              item.varianceType === 'Match' ? 'success' :
                              item.varianceType === 'Shortage' ? 'danger' : 'warning'
                            }
                            size="sm"
                          >
                            {item.varianceType}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={item.reason || ''}
                            onChange={(e) => handleUpdateReason(item.id, e.target.value)}
                            disabled={reconciliationDetail.status !== 'InProgress' || item.varianceType === 'Match'}
                            placeholder={item.varianceType !== 'Match' ? 'Enter reason...' : '-'}
                            className="w-full px-2 py-1 text-sm border rounded"
                            style={{ borderColor: 'var(--input)' }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
