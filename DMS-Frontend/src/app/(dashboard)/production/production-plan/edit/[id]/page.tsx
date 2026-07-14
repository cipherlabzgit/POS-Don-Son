'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { productionPlansApi, type ProductionPlan } from '@/lib/api/production-plans';
import { productsApi, type Product } from '@/lib/api/products';
import toast from 'react-hot-toast';

export default function EditProductionPlanPage() {
  const router = useRouter();
  const params = useParams();
  const planId = params.id as string;

  const [plan, setPlan] = useState<ProductionPlan | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    planDate: '',
    productId: '',
    plannedQty: '',
    priority: 'Medium' as 'Low' | 'Medium' | 'High',
    reference: '',
    comment: '',
    notes: '',
  });

  useEffect(() => {
    fetchPlan();
    fetchProducts();
  }, [planId]);

  const fetchPlan = async () => {
    try {
      setLoading(true);
      const data = await productionPlansApi.getById(planId);
      setPlan(data);
      setFormData({
        planDate: data.planDate,
        productId: data.productId,
        plannedQty: String(data.plannedQty),
        priority: data.priority,
        reference: data.reference || '',
        comment: data.comment || '',
        notes: data.notes || '',
      });
    } catch (error: any) {
      console.error('Failed to load production plan:', error);
      toast.error(error.response?.data?.message || 'Failed to load production plan');
      router.push('/production/production-plan');
    } finally {
      setLoading(false);
    }
  };

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

    try {
      setIsSubmitting(true);
      await productionPlansApi.update(planId, {
        planDate: formData.planDate,
        productId: formData.productId,
        plannedQty: Number(formData.plannedQty),
        priority: formData.priority,
        reference: formData.reference || undefined,
        comment: formData.comment || undefined,
        notes: formData.notes || undefined,
      });
      toast.success('Production plan updated successfully');
      router.push('/production/production-plan');
    } catch (error: any) {
      console.error('Failed to update production plan:', error);
      toast.error(error.response?.data?.message || 'Failed to update production plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p style={{ color: 'var(--muted-foreground)' }}>Loading production plan...</p>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Edit Production Plan</h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Update production plan information
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
              disabled
            />
            <Select
              label="Product"
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              options={products.map(p => ({ value: p.id, label: `${p.code} - ${p.name}` }))}
              placeholder="Select product"
              fullWidth
              required
              disabled
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
                {isSubmitting ? 'Saving...' : (
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
