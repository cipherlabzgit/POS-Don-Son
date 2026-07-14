'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { stockAdjustmentsApi, type StockAdjustment } from '@/lib/api/stock-adjustments';
import { productsApi, type Product } from '@/lib/api/products';
import toast from 'react-hot-toast';

export default function EditStockAdjustmentPage() {
  const router = useRouter();
  const params = useParams();
  const adjustmentId = params.id as string;

  const [adjustment, setAdjustment] = useState<StockAdjustment | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    adjustmentDate: '',
    productId: '',
    adjustmentType: 'Increase' as 'Increase' | 'Decrease',
    quantity: '',
    reason: '',
    notes: '',
  });

  useEffect(() => {
    fetchAdjustment();
    fetchProducts();
  }, [adjustmentId]);

  const fetchAdjustment = async () => {
    try {
      setLoading(true);
      const data = await stockAdjustmentsApi.getById(adjustmentId);
      setAdjustment(data);
      setFormData({
        adjustmentDate: data.adjustmentDate,
        productId: data.productId,
        adjustmentType: data.adjustmentType,
        quantity: String(data.quantity),
        reason: data.reason,
        notes: data.notes || '',
      });
    } catch (error: any) {
      console.error('Failed to load stock adjustment:', error);
      toast.error(error.response?.data?.message || 'Failed to load stock adjustment');
      router.push('/production/stock-adjustment');
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
      await stockAdjustmentsApi.update(adjustmentId, {
        adjustmentDate: formData.adjustmentDate,
        productId: formData.productId,
        adjustmentType: formData.adjustmentType,
        quantity: Number(formData.quantity),
        reason: formData.reason,
        notes: formData.notes || undefined,
      });
      toast.success('Stock adjustment updated successfully');
      router.push('/production/stock-adjustment');
    } catch (error: any) {
      console.error('Failed to update stock adjustment:', error);
      toast.error(error.response?.data?.message || 'Failed to update stock adjustment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p style={{ color: 'var(--muted-foreground)' }}>Loading stock adjustment...</p>
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
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Edit Stock Adjustment</h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Update stock adjustment information
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock Adjustment Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Adjustment Date"
              type="date"
              value={formData.adjustmentDate}
              onChange={(e) => setFormData({ ...formData, adjustmentDate: e.target.value })}
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
            <Select
              label="Adjustment Type"
              value={formData.adjustmentType}
              onChange={(e) => setFormData({ ...formData, adjustmentType: e.target.value as any })}
              options={[
                { value: 'Increase', label: 'Increase Stock' },
                { value: 'Decrease', label: 'Decrease Stock' }
              ]}
              fullWidth
              required
              disabled
            />
            <Input
              label="Quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              placeholder="0"
              fullWidth
              required
            />
            <Input
              label="Reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Reason for adjustment..."
              fullWidth
              required
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
