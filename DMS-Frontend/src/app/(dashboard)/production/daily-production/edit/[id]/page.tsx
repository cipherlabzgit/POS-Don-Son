'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { dailyProductionsApi, type DailyProduction } from '@/lib/api/daily-productions';
import { productsApi, type Product } from '@/lib/api/products';
import { shiftsApi, type Shift } from '@/lib/api/shifts';
import { productionSectionsApi, type ProductionSection } from '@/lib/api/production-sections';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getDateBounds } from '@/lib/date-restrictions';
import toast from 'react-hot-toast';

export default function EditDailyProductionPage() {
  const router = useRouter();
  const params = useParams();
  const productionId = params.id as string;
  const user = useAuthStore((s) => s.user);
  const dateBounds = getDateBounds('today-only', user as any, {
    allowBackDatePermission: 'production:daily:allow-back-date',
    allowFutureDatePermission: 'production:daily:allow-future-date',
  });

  const [production, setProduction] = useState<DailyProduction | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [productionSections, setProductionSections] = useState<ProductionSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    productionDate: '',
    productId: '',
    productionSectionId: '',
    plannedQty: '',
    producedQty: '',
    shiftId: '',
    notes: '',
  });

  useEffect(() => {
    fetchProduction();
    fetchProducts();
    fetchShifts();
    fetchProductionSections();
  }, [productionId]);

  const fetchProduction = async () => {
    try {
      setLoading(true);
      const data = await dailyProductionsApi.getById(productionId);
      setProduction(data);
      setFormData({
        productionDate: data.productionDate
          ? data.productionDate.split('T')[0]
          : '',
        productId: data.productId,
        productionSectionId: data.productionSectionId ?? '',
        plannedQty: String(data.plannedQty),
        producedQty: String(data.producedQty),
        shiftId: data.shiftId,
        notes: data.notes || '',
      });
    } catch (error: any) {
      console.error('Failed to load production:', error);
      toast.error(error.response?.data?.message || 'Failed to load production');
      router.push('/production/daily-production');
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

  const fetchShifts = async () => {
    try {
      const data = await shiftsApi.getActive();
      setShifts(data);
    } catch (error) {
      console.error('Failed to load shifts:', error);
      toast.error('Failed to load shifts');
      setShifts([]);
    }
  };

  const fetchProductionSections = async () => {
    try {
      const response = await productionSectionsApi.getAll(1, 100, undefined, true);
      const sections = Array.isArray(response?.productionSections)
        ? response.productionSections
        : [];
      setProductionSections(sections.filter((s) => s.isActive));
    } catch (error) {
      console.error('Failed to load production sections:', error);
      setProductionSections([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.productionSectionId) {
      toast.error('Please select a production section');
      return;
    }

    try {
      setIsSubmitting(true);
      await dailyProductionsApi.update(productionId, {
        productionDate: formData.productionDate,
        productId: formData.productId,
        productionSectionId: formData.productionSectionId,
        plannedQty: Number(formData.plannedQty),
        producedQty: Number(formData.producedQty),
        shiftId: formData.shiftId,
        notes: formData.notes || undefined,
      });
      toast.success('Production updated successfully');
      router.push('/production/daily-production');
    } catch (error: any) {
      console.error('Failed to update production:', error);
      toast.error(error.response?.data?.message || 'Failed to update production');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p style={{ color: 'var(--muted-foreground)' }}>Loading production...</p>
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
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            Edit Production
          </h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Update production information
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Production Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Production Date"
                type="date"
                value={formData.productionDate}
                onChange={(e) => setFormData({ ...formData, productionDate: e.target.value })}
                min={dateBounds.min}
                max={dateBounds.max}
                helperText={dateBounds.helperText}
                fullWidth
                required
                disabled
              />
              <Select
                label="Shift"
                value={formData.shiftId}
                onChange={(e) => setFormData({ ...formData, shiftId: e.target.value })}
                options={shifts.map((s) => ({ value: s.id, label: s.name }))}
                placeholder="Select shift"
                fullWidth
                required
                disabled
              />
            </div>

            <Select
              label="Product"
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              options={products.map((p) => ({ value: p.id, label: `${p.code} - ${p.name}` }))}
              placeholder="Select product"
              fullWidth
              required
              disabled
            />

            <Select
              label="Production Section"
              value={formData.productionSectionId}
              onChange={(e) => setFormData({ ...formData, productionSectionId: e.target.value })}
              options={productionSections.map((s) => ({ value: s.id, label: s.name }))}
              placeholder="Select production section"
              fullWidth
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Planned Quantity"
                type="number"
                value={formData.plannedQty}
                onChange={(e) => setFormData({ ...formData, plannedQty: e.target.value })}
                placeholder="0"
                fullWidth
                required
                disabled
              />
              <Input
                label="Produced Quantity"
                type="number"
                value={formData.producedQty}
                onChange={(e) => setFormData({ ...formData, producedQty: e.target.value })}
                placeholder="0"
                fullWidth
                required
              />
            </div>

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
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? (
                  'Saving...'
                ) : (
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
