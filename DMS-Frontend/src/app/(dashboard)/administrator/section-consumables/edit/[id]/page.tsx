'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { ArrowLeft, Save } from 'lucide-react';
import { sectionConsumablesApi, type UpdateSectionConsumableDto } from '@/lib/api/section-consumables';
import { productionSectionsApi, type ProductionSection } from '@/lib/api/production-sections';
import { ingredientsApi, type Ingredient } from '@/lib/api/ingredients';
import toast from 'react-hot-toast';

export default function EditSectionConsumablePage() {
  const router = useRouter();
  const params = useParams();
  const consumableId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sections, setSections] = useState<ProductionSection[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  const [formData, setFormData] = useState({
    productionSectionId: '',
    ingredientId: '',
    quantityPerUnit: 1,
    formula: '',
    notes: '',
    isActive: true,
  });

  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);
        const [consumable, sectionsRes, ingredientsRes] = await Promise.all([
          sectionConsumablesApi.getById(consumableId),
          productionSectionsApi.getAll(1, 200, undefined, true),
          ingredientsApi.getAll(1, 500, undefined, undefined, undefined, true),
        ]);
        setFormData({
          productionSectionId: consumable.productionSectionId,
          ingredientId: consumable.ingredientId,
          quantityPerUnit: consumable.quantityPerUnit,
          formula: consumable.formula || '',
          notes: consumable.notes || '',
          isActive: consumable.isActive,
        });
        setSections(sectionsRes.productionSections);
        setIngredients(ingredientsRes.ingredients);
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to load section consumable');
        router.push('/administrator/section-consumables');
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [consumableId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.productionSectionId || !formData.ingredientId) {
      toast.error('Please select a production section and ingredient');
      return;
    }

    try {
      setSubmitting(true);
      const updateData: UpdateSectionConsumableDto = {
        productionSectionId: formData.productionSectionId,
        ingredientId: formData.ingredientId,
        quantityPerUnit: formData.quantityPerUnit,
        formula: formData.formula,
        notes: formData.notes,
        isActive: formData.isActive,
      };
      await sectionConsumablesApi.update(consumableId, updateData);
      toast.success('Section consumable updated successfully');
      router.push('/administrator/section-consumables');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update section consumable');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p style={{ color: 'var(--muted-foreground)' }}>Loading section consumable...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Edit Section Consumable</h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Update section consumable information
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Consumable Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                  Production Section <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.productionSectionId}
                  onChange={(e) => setFormData({ ...formData, productionSectionId: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ border: '1px solid var(--input)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                >
                  <option value="">Select a section</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                  Ingredient <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.ingredientId}
                  onChange={(e) => setFormData({ ...formData, ingredientId: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ border: '1px solid var(--input)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                >
                  <option value="">Select an ingredient</option>
                  {ingredients.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.code} — {i.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Input
              label="Quantity Per Unit"
              type="number"
              step="0.001"
              min="0.001"
              value={formData.quantityPerUnit.toString()}
              onChange={(e) => setFormData({ ...formData, quantityPerUnit: parseFloat(e.target.value) || 1 })}
              fullWidth
              required
            />
            <Input
              label="Formula"
              value={formData.formula}
              onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
              placeholder="Optional formula expression"
              fullWidth
            />
            <Input
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional notes"
              fullWidth
            />
            <div className="pt-2">
              <Toggle
                checked={formData.isActive}
                onChange={(checked) => setFormData({ ...formData, isActive: checked })}
                label="Active Status"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="ghost" onClick={() => router.back()} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? 'Saving...' : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
