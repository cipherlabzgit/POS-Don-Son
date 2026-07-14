'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Select from '@/components/ui/select';
import { ChefHat, Download, Calendar, Loader2, Save } from 'lucide-react';
import { productionPlannerApi, type ComputedProductionItem, type ProductionPlanDetail } from '@/lib/api/production-planner';
import { deliveryPlansApi, type DeliveryPlan } from '@/lib/api/delivery-plans';
import { productionSectionsApi, type ProductionSection } from '@/lib/api/production-sections';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatSlDate } from '@/lib/sri-lanka-time';

interface ProductionItemWithAdjustment extends ComputedProductionItem {
  adjustment?: number;
}

export default function ProductionPlannerEnhancedPage() {
  const [deliveryPlans, setDeliveryPlans] = useState<DeliveryPlan[]>([]);
  const [productionSections, setProductionSections] = useState<ProductionSection[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [useFreezerStock, setUseFreezerStock] = useState(false);
  const [computedItems, setComputedItems] = useState<ProductionItemWithAdjustment[]>([]);
  const [savedPlan, setSavedPlan] = useState<ProductionPlanDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isComputing, setIsComputing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [plansRes, sectionsRes] = await Promise.all([
        deliveryPlansApi.getAll(1, 100),
        productionSectionsApi.getAll(1, 100, undefined, true),
      ]);

      setDeliveryPlans(plansRes.deliveryPlans as any);
      setProductionSections(sectionsRes.productionSections);
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComputeProduction = async () => {
    if (!selectedPlanId) {
      toast.error('Please select a delivery plan');
      return;
    }

    try {
      setIsComputing(true);
      const data = await productionPlannerApi.computeProductionPlan(selectedPlanId, useFreezerStock);
      setComputedItems(data.items.map(item => ({ ...item, adjustment: 0 })));
      toast.success('Production plan computed successfully');
    } catch (error) {
      console.error('Error computing production plan:', error);
      toast.error('Failed to compute production plan');
    } finally {
      setIsComputing(false);
    }
  };

  const handleSavePlan = async () => {
    if (computedItems.length === 0) {
      toast.error('No production items to save');
      return;
    }

    try {
      setIsSaving(true);
      const plan = await productionPlannerApi.createProductionPlan({
        deliveryPlanId: selectedPlanId,
        useFreezerStock,
        items: computedItems.map(item => ({
          productionSectionId: item.productionSectionId,
          productId: item.productId,
          regularFullQty: item.regularFullQty,
          regularMiniQty: item.regularMiniQty,
          customizedFullQty: item.customizedFullQty,
          customizedMiniQty: item.customizedMiniQty,
          freezerStock: item.freezerStock,
          produceQty: item.produceQty + (item.adjustment || 0),
          isExcluded: false,
        })),
      });
      setSavedPlan(plan);
      toast.success('Production plan saved successfully');
    } catch (error) {
      console.error('Error saving production plan:', error);
      toast.error('Failed to save production plan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdjustment = (index: number, adjustment: number) => {
    setComputedItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], adjustment };
      return updated;
    });
  };

  const groupBySection = () => {
    const grouped: { [key: string]: ProductionItemWithAdjustment[] } = {};
    
    computedItems.forEach(item => {
      if (!grouped[item.productionSectionName]) {
        grouped[item.productionSectionName] = [];
      }
      grouped[item.productionSectionName].push(item);
    });

    return grouped;
  };

  const sectionGroups = groupBySection();
  const selectedPlan = deliveryPlans.find(p => p.id === selectedPlanId);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: 'var(--brand-primary)' }} />
          <p style={{ color: 'var(--muted-foreground)' }}>Loading production planner...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            Production Planner
          </h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Section-wise production planning with customized order tracking
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="secondary" size="md" disabled={computedItems.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export Section Reports
          </Button>
        </div>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Production Plan Setup</CardTitle>
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
                Options
              </label>
              <label className="flex items-center space-x-2 cursor-pointer mt-2">
                <input
                  type="checkbox"
                  checked={useFreezerStock}
                  onChange={(e) => setUseFreezerStock(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium" style={{ color: '#1E40AF' }}>
                  Use Freezer Stock
                </span>
              </label>
            </div>

            <div className="flex items-end gap-2">
              <Button
                className="flex-1"
                onClick={handleComputeProduction}
                disabled={!selectedPlanId || isComputing}
              >
                {isComputing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Computing...
                  </>
                ) : (
                  <>
                    <ChefHat className="w-4 h-4 mr-2" />
                    Compute Production
                  </>
                )}
              </Button>

              <Button
                variant="primary"
                onClick={handleSavePlan}
                disabled={computedItems.length === 0 || isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Plan
                  </>
                )}
              </Button>
            </div>
          </div>

          {selectedPlan && (
            <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--dms-info-soft)' }}>
              <div className="flex items-center gap-4 text-sm">
                <span>
                  <strong>Date:</strong> {formatSlDate(selectedPlan.planDate)}
                </span>
                <span>
                  <strong>Day Type:</strong> {selectedPlan.dayTypeName}
                </span>
                <span>
                  <strong>Status:</strong> <Badge variant="info" size="sm">{selectedPlan.status}</Badge>
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section-wise Production */}
      {Object.entries(sectionGroups).map(([sectionName, items]) => (
        <Card key={sectionName}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <ChefHat className="w-5 h-5 mr-2" style={{ color: '#C8102E' }} />
                <span>{sectionName}</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y" style={{ borderColor: 'var(--border)' }}>
                <thead style={{ backgroundColor: 'var(--muted)' }}>
                  <tr>
                    <th
                      className="px-3 py-2 text-left text-xs font-medium"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      Code
                    </th>
                    <th
                      className="px-3 py-2 text-left text-xs font-medium"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      Product
                    </th>
                    <th
                      className="px-3 py-2 text-center text-xs font-medium"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      Regular Full
                    </th>
                    <th
                      className="px-3 py-2 text-center text-xs font-medium"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      Regular Mini
                    </th>
                    <th
                      className="px-3 py-2 text-center text-xs font-medium"
                      style={{ color: '#F59E0B' }}
                    >
                      Custom Full
                    </th>
                    <th
                      className="px-3 py-2 text-center text-xs font-medium"
                      style={{ color: '#F59E0B' }}
                    >
                      Custom Mini
                    </th>
                    <th
                      className="px-3 py-2 text-center text-xs font-medium"
                      style={{ color: 'var(--dms-amber-fg)', backgroundColor: 'var(--dms-amber)' }}
                    >
                      Total Required
                    </th>
                    {useFreezerStock && (
                      <>
                        <th
                          className="px-3 py-2 text-center text-xs font-medium"
                          style={{ color: 'var(--muted-foreground)' }}
                        >
                          Freezer Stock
                        </th>
                        <th
                          className="px-3 py-2 text-center text-xs font-medium"
                          style={{ color: 'var(--dms-blue-fg)', backgroundColor: 'var(--dms-blue)' }}
                        >
                          Produce Qty
                        </th>
                      </>
                    )}
                    <th
                      className="px-3 py-2 text-center text-xs font-medium"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      Adjustment
                    </th>
                  </tr>
                </thead>
                <tbody
                  className="divide-y"
                  style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                >
                  {items.map((item, index) => {
                    const globalIndex = computedItems.findIndex(
                      ci => ci.productId === item.productId && ci.productionSectionId === item.productionSectionId
                    );
                    return (
                      <tr key={`${item.productId}-${item.productionSectionId}`}>
                        <td
                          className="px-3 py-2 text-sm font-mono"
                          style={{ color: 'var(--muted-foreground)' }}
                        >
                          {item.productCode}
                        </td>
                        <td
                          className="px-3 py-2 text-sm font-medium"
                          style={{ color: 'var(--foreground)' }}
                        >
                          {item.productName}
                        </td>
                        <td className="px-3 py-2 text-center text-sm">
                          {item.regularFullQty}
                        </td>
                        <td className="px-3 py-2 text-center text-sm">
                          {item.regularMiniQty}
                        </td>
                        <td
                          className="px-3 py-2 text-center text-sm font-semibold"
                          style={{ color: 'var(--status-warning)', backgroundColor: 'var(--dms-orange)' }}
                        >
                          {item.customizedFullQty}
                        </td>
                        <td
                          className="px-3 py-2 text-center text-sm font-semibold"
                          style={{ color: 'var(--status-warning)', backgroundColor: 'var(--dms-orange)' }}
                        >
                          {item.customizedMiniQty}
                        </td>
                        <td
                          className="px-3 py-2 text-center text-sm font-bold"
                          style={{ color: 'var(--dms-amber-fg)', backgroundColor: 'var(--dms-amber)' }}
                        >
                          {item.totalRequiredQty}
                        </td>
                        {useFreezerStock && (
                          <>
                            <td className="px-3 py-2 text-center text-sm">
                              {item.freezerStock}
                            </td>
                            <td
                              className="px-3 py-2 text-center text-sm font-bold"
                              style={{ color: 'var(--dms-blue-fg)', backgroundColor: 'var(--dms-blue)' }}
                            >
                              {item.produceQty}
                            </td>
                          </>
                        )}
                        <td className="px-3 py-2 text-center">
                          <input
                            type="number"
                            value={item.adjustment || 0}
                            onChange={(e) => handleAdjustment(globalIndex, parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 text-center border rounded"
                            style={{ borderColor: 'var(--input)' }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}

      {computedItems.length === 0 && !isComputing && (
        <div
          className="text-center py-12 rounded-lg border-2 border-dashed"
          style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)' }}
        >
          <ChefHat className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--muted-foreground)' }} />
          <p style={{ color: 'var(--muted-foreground)' }}>
            Select a delivery plan and click "Compute Production" to generate the plan
          </p>
        </div>
      )}

      {savedPlan && (
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--dms-success-callout)', border: '1px solid var(--dms-success-border)' }}>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--dms-success-text)' }}>
            ✓ Production Plan Saved Successfully
          </p>
          <p className="text-sm" style={{ color: 'var(--dms-success-text)' }}>
            Plan ID: {savedPlan.id} • Status: {savedPlan.status} • Products: {savedPlan.totalProducts} • Total Qty: {savedPlan.totalQuantity}
          </p>
        </div>
      )}
    </div>
  );
}
