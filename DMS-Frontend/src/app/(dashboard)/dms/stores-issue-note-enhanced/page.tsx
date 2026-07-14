'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Select from '@/components/ui/select';
import { FileText, Download, AlertTriangle, Loader2, Save, CheckCircle } from 'lucide-react';
import { storesIssueNotesApi, type ComputedIngredient, type StoresIssueNoteDetail } from '@/lib/api/stores-issue-notes';
import { productionPlannerApi } from '@/lib/api/production-planner';
import { productionSectionsApi, type ProductionSection } from '@/lib/api/production-sections';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatSlDate } from '@/lib/sri-lanka-time';

export default function StoresIssueNoteEnhancedPage() {
  const [productionPlans, setProductionPlans] = useState<any[]>([]);
  const [productionSections, setProductionSections] = useState<ProductionSection[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [computedIngredients, setComputedIngredients] = useState<ComputedIngredient[]>([]);
  const [savedNote, setSavedNote] = useState<StoresIssueNoteDetail | null>(null);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [isComputing, setIsComputing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);

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

  const handleComputeSIN = async () => {
    if (!selectedPlanId || !selectedSectionId) {
      toast.error('Please select a production plan and section');
      return;
    }

    try {
      setIsComputing(true);
      const data = await storesIssueNotesApi.computeStoresIssueNote(selectedPlanId, selectedSectionId);
      setComputedIngredients(data.ingredients);
      toast.success('Stores Issue Note computed successfully');
    } catch (error) {
      console.error('Error computing SIN:', error);
      toast.error('Failed to compute stores issue note');
    } finally {
      setIsComputing(false);
    }
  };

  const handleSaveSIN = async () => {
    if (computedIngredients.length === 0) {
      toast.error('No ingredients to save');
      return;
    }

    try {
      setIsSaving(true);
      const note = await storesIssueNotesApi.createStoresIssueNote({
        productionPlanId: selectedPlanId,
        productionSectionId: selectedSectionId,
        issueDate,
        items: computedIngredients.map(ing => ({
          ingredientId: ing.ingredientId,
          productionQty: ing.productionQty,
          extraQty: ing.extraQty,
          totalQty: ing.totalQty,
        })),
      });
      setSavedNote(note);
      setComputedIngredients([]);
      toast.success('Stores Issue Note saved successfully');
    } catch (error) {
      console.error('Error saving SIN:', error);
      toast.error('Failed to save stores issue note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleIssueNote = async () => {
    if (!savedNote) return;

    try {
      setIsIssuing(true);
      const updated = await storesIssueNotesApi.issueNote(savedNote.id, 'current-user-id');
      setSavedNote(updated);
      toast.success('Stores Issue Note issued successfully');
    } catch (error) {
      console.error('Error issuing note:', error);
      toast.error('Failed to issue note');
    } finally {
      setIsIssuing(false);
    }
  };

  const handleReceiveNote = async () => {
    if (!savedNote) return;

    try {
      setIsReceiving(true);
      const updated = await storesIssueNotesApi.receiveNote(savedNote.id, 'current-user-id');
      setSavedNote(updated);
      toast.success('Stores Issue Note received successfully');
    } catch (error) {
      console.error('Error receiving note:', error);
      toast.error('Failed to receive note');
    } finally {
      setIsReceiving(false);
    }
  };

  const selectedSection = productionSections.find(s => s.id === selectedSectionId);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: 'var(--brand-primary)' }} />
          <p style={{ color: 'var(--muted-foreground)' }}>Loading stores issue notes...</p>
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
            Stores Issue Note
          </h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Section-wise ingredient requirements with extra quantities
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="secondary" size="md" disabled={!savedNote}>
            <Download className="w-4 h-4 mr-2" />
            Export Section Report
          </Button>
        </div>
      </div>

      {/* Control Panel */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
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
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
                Section
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

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
                Issue Date
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 rounded border"
                style={{ borderColor: 'var(--input)' }}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button
                className="flex-1"
                onClick={handleComputeSIN}
                disabled={!selectedPlanId || !selectedSectionId || isComputing}
                size="sm"
              >
                {isComputing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Computing...
                  </>
                ) : (
                  'Compute SIN'
                )}
              </Button>

              <Button
                variant="primary"
                onClick={handleSaveSIN}
                disabled={computedIngredients.length === 0 || isSaving}
                size="sm"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save SIN
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Notice */}
      <div
        className="p-4 rounded-lg"
        style={{ backgroundColor: 'var(--dms-warn-box)', border: '1px solid var(--dms-warn-box-border)' }}
      >
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 mt-0.5" style={{ color: 'var(--dms-warn-label)' }} />
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--dms-warn-label)' }}>
              Extra Quantity Display Rules:
            </p>
            <ul className="text-sm mt-2 space-y-1" style={{ color: 'var(--dms-warn-label)' }}>
              <li>
                • <strong>Stores Issue Note:</strong> Shows BOTH production quantity AND extra
                quantity (total to be issued)
              </li>
              <li>
                • <strong>Production Sheet:</strong> Shows ONLY production quantity (correct
                recipe values)
              </li>
              <li>
                • <strong>Reason:</strong> Extra quantity is for handling loss (cleaning,
                spillage) - stores needs total, production needs recipe value
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Ingredients with Extra Quantities */}
      {computedIngredients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ingredient Requirements - {selectedSection?.name}</CardTitle>
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
                      Ingredient Code
                    </th>
                    <th
                      className="px-3 py-2 text-left text-xs font-medium"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      Ingredient Name
                    </th>
                    <th
                      className="px-3 py-2 text-center text-xs font-medium"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      Production Qty
                    </th>
                    <th
                      className="px-3 py-2 text-center text-xs font-medium"
                      style={{ color: 'var(--status-warning)' }}
                    >
                      Extra Qty
                    </th>
                    <th
                      className="px-3 py-2 text-center text-xs font-medium"
                      style={{ color: 'var(--dms-amber-fg)', backgroundColor: 'var(--dms-amber)' }}
                    >
                      Total Qty
                    </th>
                    <th
                      className="px-3 py-2 text-center text-xs font-medium"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      Unit
                    </th>
                    <th
                      className="px-3 py-2 text-left text-xs font-medium"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      Used In Products
                    </th>
                  </tr>
                </thead>
                <tbody
                  className="divide-y"
                  style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                >
                  {computedIngredients.map((ingredient) => (
                    <tr key={ingredient.ingredientId}>
                      <td className="px-3 py-2 text-sm font-mono" style={{ color: 'var(--muted-foreground)' }}>
                        {ingredient.ingredientCode}
                      </td>
                      <td className="px-3 py-2 text-sm" style={{ color: 'var(--foreground)' }}>
                        {ingredient.ingredientName}
                      </td>
                      <td className="px-3 py-2 text-center text-sm font-semibold">
                        {ingredient.productionQty.toFixed(2)}
                      </td>
                      <td
                        className="px-3 py-2 text-center text-sm font-semibold"
                        style={{
                          color: ingredient.extraQty > 0 ? 'var(--status-warning)' : 'var(--muted-foreground)',
                          backgroundColor: ingredient.extraQty > 0 ? 'var(--dms-orange)' : 'transparent',
                        }}
                      >
                        {ingredient.extraQty > 0 ? `+${ingredient.extraQty.toFixed(2)} (${ingredient.extraPercentage}%)` : '-'}
                      </td>
                      <td
                        className="px-3 py-2 text-center text-sm font-bold"
                        style={{ color: 'var(--dms-amber-fg)', backgroundColor: 'var(--dms-amber)' }}
                      >
                        {ingredient.totalQty.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
                        {ingredient.unit}
                      </td>
                      <td className="px-3 py-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        {ingredient.usedInProducts.join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved Note Details */}
      {savedNote && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Saved Stores Issue Note</CardTitle>
              <div className="flex gap-2">
                <Badge
                  variant={
                    savedNote.status === 'Draft' ? 'neutral' :
                    savedNote.status === 'Issued' ? 'warning' : 'success'
                  }
                  size="lg"
                >
                  {savedNote.status}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Issue Note No</p>
                  <p className="font-semibold">{savedNote.issueNoteNo}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Section</p>
                  <p className="font-semibold">{savedNote.productionSectionName}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Issue Date</p>
                  <p className="font-semibold">{formatSlDate(savedNote.issueDate)}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Items</p>
                  <p className="font-semibold">{savedNote.items.length}</p>
                </div>
              </div>

              <div className="flex gap-2">
                {savedNote.status === 'Draft' && (
                  <Button
                    variant="primary"
                    onClick={handleIssueNote}
                    disabled={isIssuing}
                  >
                    {isIssuing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Issuing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Issue Note
                      </>
                    )}
                  </Button>
                )}

                {savedNote.status === 'Issued' && (
                  <Button
                    variant="primary"
                    onClick={handleReceiveNote}
                    disabled={isReceiving}
                  >
                    {isReceiving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Receiving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Receive Note
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {computedIngredients.length === 0 && !savedNote && !isComputing && (
        <div
          className="text-center py-12 rounded-lg border-2 border-dashed"
          style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)' }}
        >
          <FileText className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--muted-foreground)' }} />
          <p style={{ color: 'var(--muted-foreground)' }}>
            Select a production plan and section, then click "Compute SIN" to generate the note
          </p>
        </div>
      )}
    </div>
  );
}
