'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { labelPrintingApi } from '@/lib/api/label-printing';
import { productsApi, type Product } from '@/lib/api/products';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getDateBounds, todayISO } from '@/lib/date-restrictions';
import toast from 'react-hot-toast';

export default function EditLabelPrintingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const user = useAuthStore((s) => s.user);
  const dateBounds = getDateBounds('today-only', user as any, {
    allowBackDatePermission: 'operation:label-printing:allow-back-date',
    allowFutureDatePermission: 'operation:label-printing:allow-future-date',
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    productId: '',
    date: todayISO(),
    labelCount: '1',
    startDate: todayISO(),
    expiryDays: '7',
    priceOverride: '',
  });

  useEffect(() => {
    fetchProducts();
    fetchLabelPrintRequest();
  }, [id]);

  const fetchProducts = async () => {
    try {
      const response = await productsApi.getAll(1, 1000);
      const labelPrintProducts = (response.products || []).filter(
        (p: Product) => p.isActive && p.enableLabelPrint,
      );
      setProducts(labelPrintProducts);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load products');
    }
  };

  const fetchLabelPrintRequest = async () => {
    try {
      setIsLoading(true);
      const request = await labelPrintingApi.getById(id);
      setFormData({
        productId: request.productId || '',
        date: request.date?.split('T')[0] || todayISO(),
        labelCount: String(request.labelCount || 1),
        startDate: request.startDate?.split('T')[0] || todayISO(),
        expiryDays: String(request.expiryDays || 7),
        priceOverride: request.priceOverride ? String(request.priceOverride) : '',
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load label print request');
      router.push('/operation/label-printing');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === formData.productId);
  }, [products, formData.productId]);

  const hasAllowFutureLabelPrint = selectedProduct?.allowFutureLabelPrint || false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      await labelPrintingApi.update(id, {
        date: formData.date,
        productId: formData.productId,
        labelCount: Number(formData.labelCount),
        startDate: formData.startDate,
        expiryDays: Number(formData.expiryDays),
        priceOverride: formData.priceOverride ? Number(formData.priceOverride) : undefined,
      });
      toast.success('Label print request updated successfully');
      router.push('/operation/label-printing');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update label print request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
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
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Edit Label Print Request</h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Update label printing request
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Label Print Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Select
                label="Product"
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                options={products.map(p => ({ 
                  value: p.id, 
                  label: `${p.code} - ${p.name}${p.allowFutureLabelPrint ? ' ☀️' : ''}` 
                }))}
                placeholder={products.length === 0 ? "No products available" : "Select product"}
                fullWidth
                required
              />
              {products.length === 0 && (
                <p className="text-xs mt-1 text-amber-600">
                  No products with label printing enabled. Please enable "Label Print" for products in Inventory settings.
                </p>
              )}
              {products.length > 0 && (
                <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                  {products.length} product{products.length !== 1 ? 's' : ''} available
                </p>
              )}
            </div>
            
            <Input
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              min={dateBounds.min}
              max={dateBounds.max}
              helperText={hasAllowFutureLabelPrint ? 'Future dates allowed for this product' : dateBounds.helperText}
              style={hasAllowFutureLabelPrint ? { backgroundColor: '#FEF3C7' } : {}}
              fullWidth
              required
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Label Count"
                type="number"
                min="1"
                value={formData.labelCount}
                onChange={(e) => setFormData({ ...formData, labelCount: e.target.value })}
                fullWidth
                required
              />
              <Input
                label="Expiry Days"
                type="number"
                min="1"
                value={formData.expiryDays}
                onChange={(e) => setFormData({ ...formData, expiryDays: e.target.value })}
                fullWidth
                required
              />
            </div>
            
            <Input
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              fullWidth
              required
            />
            
            <Input
              label="Price Override (Optional)"
              type="number"
              min="0"
              step="0.01"
              value={formData.priceOverride}
              onChange={(e) => setFormData({ ...formData, priceOverride: e.target.value })}
              placeholder="Leave blank to use product price"
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
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
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
