'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { ArrowLeft, Plus } from 'lucide-react';
import { roundingRulesApi, type CreateRoundingRuleDto } from '@/lib/api/rounding-rules';
import toast from 'react-hot-toast';
import { RoundingRulePreviewCard } from '../components/RoundingRulePreviewCard';

export default function AddRoundingRulePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    appliesTo: 'Product',
    roundingMethod: 'Nearest',
    decimalPlaces: 2,
    roundingIncrement: 1,
    minValue: undefined as number | undefined,
    maxValue: undefined as number | undefined,
    ratioBaseQuantity: undefined as number | undefined,
    ratioYieldQuantity: undefined as number | undefined,
    sortOrder: 0,
    isDefault: false,
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code || !formData.name) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const createData: CreateRoundingRuleDto = {
        code: formData.code,
        name: formData.name,
        description: formData.description,
        appliesTo: formData.appliesTo,
        roundingMethod: formData.roundingMethod,
        decimalPlaces: formData.decimalPlaces,
        roundingIncrement: formData.roundingIncrement,
        minValue: formData.minValue,
        maxValue: formData.maxValue,
        ratioBaseQuantity: formData.ratioBaseQuantity,
        ratioYieldQuantity: formData.ratioYieldQuantity,
        sortOrder: formData.sortOrder,
        isDefault: formData.isDefault,
        isActive: formData.isActive,
      };
      await roundingRulesApi.create(createData);
      toast.success('Rounding rule created successfully');
      router.push('/administrator/rounding-rules');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create rounding rule');
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
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Add Rounding Rule</h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Create a new rounding rule for prices and quantities
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rounding Rule Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Rule Code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., RND001"
                fullWidth
                required
              />
              <Input
                label="Rule Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Standard Rounding"
                fullWidth
                required
              />
            </div>

            <Input
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
              fullWidth
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                  Applies To <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.appliesTo}
                  onChange={(e) => setFormData({ ...formData, appliesTo: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ border: '1px solid var(--input)' }}
                >
                  <option value="Product">Product</option>
                  <option value="Price">Price</option>
                  <option value="Quantity">Quantity</option>
                  <option value="Ingredient">Ingredient</option>
                  <option value="Total">Total</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                  Rounding Method <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.roundingMethod}
                  onChange={(e) => setFormData({ ...formData, roundingMethod: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ border: '1px solid var(--input)' }}
                >
                  <option value="Nearest">Nearest</option>
                  <option value="Up">Up</option>
                  <option value="Down">Down</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Decimal Places"
                type="number"
                value={formData.decimalPlaces.toString()}
                onChange={(e) => setFormData({ ...formData, decimalPlaces: parseInt(e.target.value) || 0 })}
                fullWidth
                required
              />
              <Input
                label="Rounding Increment"
                type="number"
                step="0.01"
                value={formData.roundingIncrement.toString()}
                onChange={(e) => setFormData({ ...formData, roundingIncrement: parseFloat(e.target.value) || 1 })}
                fullWidth
                required
              />
              <Input
                label="Sort Order"
                type="number"
                value={formData.sortOrder.toString()}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                fullWidth
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Min Value (Optional)"
                type="number"
                step="0.01"
                value={formData.minValue?.toString() || ''}
                onChange={(e) => setFormData({ ...formData, minValue: e.target.value ? parseFloat(e.target.value) : undefined })}
                fullWidth
              />
              <Input
                label="Max Value (Optional)"
                type="number"
                step="0.01"
                value={formData.maxValue?.toString() || ''}
                onChange={(e) => setFormData({ ...formData, maxValue: e.target.value ? parseFloat(e.target.value) : undefined })}
                fullWidth
              />
            </div>

            <div className="rounded-lg p-4 space-y-3" style={{ border: '1px solid var(--input)', background: '#FAFAFA' }}>
              <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                Item-level ratio (optional)
              </p>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Example: 4 patties use 1 egg for garnish — set base 4 and yield 1. Leave blank for simple quantity rounding without a ratio.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Ratio base (primary units)"
                  type="number"
                  step="any"
                  min="0"
                  value={formData.ratioBaseQuantity?.toString() ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ratioBaseQuantity: e.target.value === '' ? undefined : parseFloat(e.target.value),
                    })
                  }
                  placeholder="e.g. 4"
                  fullWidth
                />
                <Input
                  label="Ratio yield (dependent units)"
                  type="number"
                  step="any"
                  min="0"
                  value={formData.ratioYieldQuantity?.toString() ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ratioYieldQuantity: e.target.value === '' ? undefined : parseFloat(e.target.value),
                    })
                  }
                  placeholder="e.g. 1"
                  fullWidth
                />
              </div>
            </div>

            <RoundingRulePreviewCard
              roundingMethod={formData.roundingMethod}
              decimalPlaces={formData.decimalPlaces}
              roundingIncrement={formData.roundingIncrement}
              minValue={formData.minValue}
              maxValue={formData.maxValue}
              ratioBaseQuantity={formData.ratioBaseQuantity}
              ratioYieldQuantity={formData.ratioYieldQuantity}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <Toggle
                checked={formData.isDefault}
                onChange={(checked) => setFormData({ ...formData, isDefault: checked })}
                label="Set as Default"
              />
              <Toggle
                checked={formData.isActive}
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
                    Add Rounding Rule
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
