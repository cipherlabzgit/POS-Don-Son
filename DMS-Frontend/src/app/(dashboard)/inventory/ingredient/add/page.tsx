'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { ArrowLeft, Plus } from 'lucide-react';
import { ingredientsApi, type CreateIngredientDto } from '@/lib/api/ingredients';
import { categoriesApi, type Category } from '@/lib/api/categories';
import { uomsApi, type UnitOfMeasure } from '@/lib/api/uoms';
import toast from 'react-hot-toast';

export default function AddIngredientPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [uoms, setUOMs] = useState<UnitOfMeasure[]>([]);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<Partial<CreateIngredientDto>>({
    code: '',
    name: '',
    description: '',
    categoryId: '',
    unitOfMeasureId: '',
    ingredientType: 'Raw',
    isSemiFinishedItem: false,
    extraPercentageApplicable: false,
    extraPercentage: 0,
    allowDecimal: false,
    decimalPlaces: 2,
    unitPrice: 0,
    sortOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchCategories();
    fetchUOMs();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoriesApi.getAll(1, 100, undefined, true);
      setCategories(response.categories);
    } catch (err: any) {
      console.error('Failed to load categories:', err);
    }
  };

  const fetchUOMs = async () => {
    try {
      const response = await uomsApi.getAll(1, 100, undefined, true);
      setUOMs(response.unitOfMeasures);
    } catch (err: any) {
      console.error('Failed to load UOMs:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      const dto: CreateIngredientDto = {
        code: formData.code!,
        name: formData.name!,
        description: formData.description,
        categoryId: formData.categoryId!,
        unitOfMeasureId: formData.unitOfMeasureId!,
        ingredientType: formData.ingredientType!,
        isSemiFinishedItem: formData.isSemiFinishedItem!,
        extraPercentageApplicable: formData.extraPercentageApplicable!,
        extraPercentage: Number(formData.extraPercentage),
        allowDecimal: formData.allowDecimal!,
        decimalPlaces: Number(formData.decimalPlaces),
        unitPrice: Number(formData.unitPrice),
        sortOrder: Number(formData.sortOrder),
        isActive: formData.isActive!,
      };
      
      await ingredientsApi.create(dto);
      toast.success('Ingredient created successfully');
      router.push('/inventory/ingredient');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to create ingredient';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Add New Ingredient</h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Create a new ingredient in your inventory
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ingredient Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Ingredient Code"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., FLOUR, SUGAR"
                fullWidth
                required
              />
              <Input
                label="Ingredient Name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full ingredient name"
                fullWidth
                required
              />
            </div>

            <Input
              label="Description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ingredient description (optional)"
              fullWidth
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Category"
                value={formData.categoryId || ''}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                options={categories.map(c => ({ value: c.id, label: c.name }))}
                placeholder="Select category"
                fullWidth
                required
              />
              <Select
                label="Unit of Measure"
                value={formData.unitOfMeasureId || ''}
                onChange={(e) => setFormData({ ...formData, unitOfMeasureId: e.target.value })}
                options={uoms.map(u => ({ value: u.id, label: `${u.code} - ${u.description}` }))}
                placeholder="Select UOM"
                fullWidth
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Ingredient Type"
                value={formData.ingredientType || 'Raw'}
                onChange={(e) => setFormData({ ...formData, ingredientType: e.target.value })}
                options={[
                  { value: 'Raw', label: 'Raw Material' },
                  { value: 'Semi-Finished', label: 'Semi-Finished' }
                ]}
                fullWidth
                required
              />
              <Input
                label="Unit Price (Rs.)"
                type="number"
                step="0.01"
                value={formData.unitPrice?.toString() || '0'}
                onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                placeholder="0.00"
                fullWidth
              />
            </div>

            <div className="pt-2">
              <Toggle
                checked={formData.isActive || false}
                onChange={(checked) => setFormData({ ...formData, isActive: checked })}
                label="Active Status"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting}
              >
                {submitting ? 'Creating...' : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Ingredient
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
