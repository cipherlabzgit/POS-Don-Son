'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Select from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Printer, Download, Eye, Loader2, ChefHat } from 'lucide-react';
import { printApi, type SectionPrintBundle } from '@/lib/api/print';
import { productionPlannerApi } from '@/lib/api/production-planner';
import { productionSectionsApi, type ProductionSection } from '@/lib/api/production-sections';
import { toast } from 'sonner';
import { formatSlDate, formatSlDateTime } from '@/lib/sri-lanka-time';

export default function SectionPrintBundlePage() {
  const [productionPlans, setProductionPlans] = useState<any[]>([]);
  const [productionSections, setProductionSections] = useState<ProductionSection[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [bundleData, setBundleData] = useState<SectionPrintBundle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [plansRes, sectionsRes] = await Promise.all([
        productionPlannerApi.getAllProductionPlans(),
        productionSectionsApi.getAll(1, 100, undefined, true),
      ]);

      setProductionPlans(plansRes);
      setProductionSections(sectionsRes.productionSections);
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateBundle = async () => {
    if (!selectedPlanId || !selectedSectionId) {
      toast.error('Please select a production plan and section');
      return;
    }

    try {
      setIsGenerating(true);
      const bundle = await printApi.getSectionBundle(selectedPlanId, selectedSectionId);
      setBundleData(bundle);
      toast.success('Section bundle generated successfully');
    } catch (error) {
      console.error('Error generating section bundle:', error);
      toast.error('Failed to generate section bundle');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    if (!bundleData) {
      toast.error('No bundle to print');
      return;
    }
    window.print();
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: 'var(--brand-primary)' }} />
          <p style={{ color: 'var(--muted-foreground)' }}>Loading section print bundle...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Section Print Bundle</h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Generate consolidated print packs per production section
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="md" disabled={!bundleData}>
            <Download className="w-4 h-4 mr-2" />
            Save as PDF
          </Button>
          <Button variant="primary" size="md" onClick={handlePrint} disabled={!bundleData}>
            <Printer className="w-4 h-4 mr-2" />
            Print Bundle
          </Button>
        </div>
      </div>

      <Card className="no-print">
        <CardHeader>
          <CardTitle>Bundle Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Production Plan
              </label>
              <Select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                options={[
                  { value: '', label: 'Select a production plan' },
                  ...productionPlans.map(p => ({
                    value: p.id,
                    label: `${p.id.substring(0, 8)} - ${p.status}`,
                  })),
                ]}
                fullWidth
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Production Section
              </label>
              <Select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                options={[
                  { value: '', label: 'Select a section' },
                  ...productionSections.map(s => ({
                    value: s.id,
                    label: s.name,
                  })),
                ]}
                fullWidth
              />
            </div>

            <div className="flex items-end">
              <Button
                className="w-full"
                onClick={handleGenerateBundle}
                disabled={!selectedPlanId || !selectedSectionId || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <ChefHat className="w-4 h-4 mr-2" />
                    Generate Bundle
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {bundleData && (
        <div className="print-only">
          {/* Cover Page */}
          <Card className="mb-6">
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold">DON & SONS</h1>
                <h2 className="text-2xl font-semibold">Production Section Bundle</h2>
                <div className="mt-8 space-y-2">
                  <p className="text-xl font-bold">{bundleData.productionSectionName}</p>
                  <p className="text-lg">Production Date: {formatSlDate(bundleData.productionDate)}</p>
                  <p className="text-md">Total Products: {bundleData.products.length}</p>
                  <p className="text-md">Total Quantity: {bundleData.totalQuantity}</p>
                </div>
                <div className="mt-12 text-sm text-gray-600">
                  <p>Printed: {formatSlDateTime(bundleData.printedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Production Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Production Summary - {bundleData.productionSectionName}</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr style={{ backgroundColor: 'var(--muted)' }}>
                    <th className="border p-2 text-left">Product Code</th>
                    <th className="border p-2 text-left">Product Name</th>
                    <th className="border p-2 text-center">Produce Quantity</th>
                    <th className="border p-2 text-center">Has Recipe</th>
                  </tr>
                </thead>
                <tbody>
                  {bundleData.products.map(product => (
                    <tr key={product.productId}>
                      <td className="border p-2 font-mono">{product.productCode}</td>
                      <td className="border p-2">{product.productName}</td>
                      <td className="border p-2 text-center font-bold">{product.produceQty}</td>
                      <td className="border p-2 text-center">
                        <Badge variant={product.hasRecipe ? 'success' : 'neutral'} size="sm">
                          {product.hasRecipe ? 'Yes' : 'No'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: 'var(--muted)' }}>
                    <td colSpan={2} className="border p-2 font-bold">TOTAL</td>
                    <td className="border p-2 text-center font-bold">{bundleData.totalQuantity}</td>
                    <td className="border p-2"></td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>

          {/* Recipe Breakdown */}
          {bundleData.products.filter(p => p.hasRecipe && p.ingredients.length > 0).map(product => (
            <Card key={`recipe-${product.productId}`} className="mb-6 page-break">
              <CardHeader>
                <CardTitle>Recipe: {product.productCode} - {product.productName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <p className="text-lg font-semibold">Production Quantity: {product.produceQty}</p>
                </div>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr style={{ backgroundColor: 'var(--muted)' }}>
                      <th className="border p-2 text-left">Ingredient Code</th>
                      <th className="border p-2 text-left">Ingredient Name</th>
                      <th className="border p-2 text-center">Quantity</th>
                      <th className="border p-2 text-center">Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.ingredients.map(ing => (
                      <tr key={ing.ingredientId}>
                        <td className="border p-2 font-mono">{ing.ingredientCode}</td>
                        <td className="border p-2">{ing.ingredientName}</td>
                        <td className="border p-2 text-center font-semibold">{ing.quantity}</td>
                        <td className="border p-2 text-center">{ing.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!bundleData && !isGenerating && (
        <div
          className="text-center py-12 rounded-lg border-2 border-dashed no-print"
          style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)' }}
        >
          <ChefHat className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--muted-foreground)' }} />
          <p style={{ color: 'var(--muted-foreground)' }}>
            Select a production plan and section to generate the bundle
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
          .page-break {
            page-break-before: always;
          }
        }
      `}</style>
    </div>
  );
}
