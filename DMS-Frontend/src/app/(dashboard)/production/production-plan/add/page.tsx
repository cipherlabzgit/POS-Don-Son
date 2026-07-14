'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import { ArrowLeft, Plus } from 'lucide-react';
import { productionPlansApi } from '@/lib/api/production-plans';
import { productsApi, type Product } from '@/lib/api/products';
import { todayISO } from '@/lib/date-restrictions';
import toast from 'react-hot-toast';

export default function AddProductionPlanPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    planDate: todayISO(),
    productId: '',
    plannedQty: '',
    priority: 'Medium' as 'Low' | 'Medium' | 'High',
    reference: '',
    comment: '',
    notes: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productsApi.getAll(1, 1000);
      const productsList = Array.isArray(response.products) ? response.products : [];
      setProducts(productsList.filter((p: Product) => p.isActive));
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('Failed to load products');
      setProducts([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productId || !formData.plannedQty) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      await productionPlansApi.create({
        planDate: formData.planDate,
        productId: formData.productId,
        plannedQty: Number(formData.plannedQty),
        priority: formData.priority,
        reference: formData.reference || undefined,
        comment: formData.comment || undefined,
        notes: formData.notes || undefined,
      });
      toast.success('Production plan created successfully');
      router.push('/production/production-plan');
    } catch (error: any) {
      console.error('Failed to create production plan:', error);
      toast.error(error.response?.data?.message || 'Failed to create production plan');
    } finally {
      setIsSubmitting(false);
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
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Add Production Plan</h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Create a new production plan
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Production Plan Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Plan Date"
              type="date"
              value={formData.planDate}
              onChange={(e) => setFormData({ ...formData, planDate: e.target.value })}
              fullWidth
              required
            />
            <Select
              label="Product"
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              options={products.map(p => ({ value: p.id, label: `${p.code} - ${p.name}` }))}
              placeholder="Select product"
              fullWidth
              required
            />
            <Input
              label="Planned Quantity"
              type="number"
              value={formData.plannedQty}
              onChange={(e) => setFormData({ ...formData, plannedQty: e.target.value })}
              placeholder="0"
              fullWidth
              required
            />
            <Select
              label="Priority"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              options={[
                { value: 'Low', label: 'Low Priority' },
                { value: 'Medium', label: 'Medium Priority' },
                { value: 'High', label: 'High Priority' }
              ]}
              fullWidth
              required
            />
            <Input
              label="Reference"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              placeholder="Optional reference"
              fullWidth
            />
            <Input
              label="Comment"
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              placeholder="Optional comment"
              fullWidth
            />
            <Input
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional notes"
              fullWidth
            />

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Plan
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
