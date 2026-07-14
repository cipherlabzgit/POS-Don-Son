'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { productionCancelsApi, type ProductionCancel } from '@/lib/api/production-cancels';
import { productsApi, type Product } from '@/lib/api/products';
import { productionSectionsApi, type ProductionSection } from '@/lib/api/production-sections';
import ProductionCancelItemsEntry, {
  type ProductionCancelItem,
  type ProductionCancelProduct,
  type ProductionSection as ProdSection,
} from '@/components/production/ProductionCancelItemsEntry';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useThemeStore } from '@/lib/stores/theme-store';
import { getDateBounds } from '@/lib/date-restrictions';
import toast from 'react-hot-toast';

export default function EditProductionCancelPage() {
  const router = useRouter();
  const params = useParams();
  const cancelId = params.id as string;
  const user = useAuthStore((s) => s.user);
  const pageTheme = useThemeStore((s) => s.pageThemes['production/production-cancel']);
  
  const dateBounds = getDateBounds('today-only', user as any, {
    allowBackDatePermission: 'production:cancel:allow-back-date',
    allowFutureDatePermission: 'production:cancel:allow-future-date',
  });

  const [cancel, setCancel] = useState<ProductionCancel | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productionSections, setProductionSections] = useState<ProductionSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    cancelDate: '',
    productionNo: '',
    reason: '',
  });

  const [cancelLines, setCancelLines] = useState<ProductionCancelItem[]>([]);

  useEffect(() => {
    fetchCancel();
    fetchProducts();
    fetchProductionSections();
  }, [cancelId]);

  const fetchCancel = async () => {
    try {
      setLoading(true);
      const data = await productionCancelsApi.getById(cancelId);
      setCancel(data);
      setFormData({
        cancelDate: data.cancelDate,
        productionNo: data.productionNo,
        reason: data.reason,
      });
      
      // Convert lines from API response to component format
      if (data.lines && data.lines.length > 0) {
        setCancelLines(
          data.lines.map((line: any) => ({
            productId: line.productId,
            productionSectionId: line.productionSectionId,
            cancelledQty: line.cancelledQty,
          }))
        );
      }
    } catch (error: any) {
      console.error('Failed to load production cancellation:', error);
      toast.error(error.response?.data?.message || 'Failed to load production cancellation');
      router.push('/production/production-cancel');
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

  const fetchProductionSections = async () => {
    try {
      const response = await productionSectionsApi.getAll(1, 100);
      const sections = Array.isArray(response.sections) ? response.sections : [];
      setProductionSections(sections.filter((s) => s.isActive));
    } catch (error) {
      console.error('Failed to load production sections:', error);
      toast.error('Failed to load production sections');
      setProductionSections([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const lines = cancelLines.filter(
      (item) => item.productId && item.productionSectionId && item.cancelledQty > 0,
    );

    if (lines.length === 0) {
      toast.error('Please add at least one product with a production section and cancelled quantity');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Send all lines in a single update request
      await productionCancelsApi.update(cancelId, {
        cancelDate: formData.cancelDate,
        productionNo: formData.productionNo.trim(),
        reason: formData.reason.trim(),
        lines: lines.map((item) => ({
          productId: item.productId,
          productionSectionId: item.productionSectionId,
          cancelledQty: item.cancelledQty,
        })),
      });
      
      const totalQty = lines.reduce((sum, item) => sum + item.cancelledQty, 0);
      toast.success(
        `Production cancellation updated with ${lines.length} item(s), total qty: ${totalQty}`,
      );
      router.push('/production/production-cancel');
    } catch (error: any) {
      console.error('Failed to update production cancellation:', error);
      toast.error(error.response?.data?.message || 'Failed to update production cancellation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    const validLines = cancelLines.filter(
      (item) => item.productId && item.productionSectionId && item.cancelledQty > 0,
    );
    return (
      formData.cancelDate &&
      formData.productionNo.trim() &&
      formData.reason.trim() &&
      validLines.length > 0
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p style={{ color: 'var(--muted-foreground)' }}>Loading production cancellation...</p>
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
            Edit Production Cancel
          </h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Update products with production sections — same cancel date, production number, and reason apply to every line
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Production Cancellation Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Cancel Date"
                  type="date"
                  value={formData.cancelDate}
                  onChange={(e) => setFormData({ ...formData, cancelDate: e.target.value })}
                  min={dateBounds.min}
                  max={dateBounds.max}
                  helperText={dateBounds.helperText}
                  fullWidth
                  required
                />
                <Input
                  label="Production No"
                  value={formData.productionNo}
                  onChange={(e) => setFormData({ ...formData, productionNo: e.target.value })}
                  placeholder="PRO0000001"
                  fullWidth
                  required
                />
              </div>
              <Input
                label="Reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Enter reason for cancellation"
                fullWidth
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Products to Cancel</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductionCancelItemsEntry
              products={products.map((p): ProductionCancelProduct => ({
                id: p.id,
                code: p.code,
                name: p.name,
                productionSection: p.productionSection || '',
                category: p.categoryName || '',
                unitPrice: p.unitPrice,
                weight: p.weight,
              }))}
              productionSections={productionSections.map((s): ProdSection => ({
                id: s.id,
                name: s.name,
              }))}
              items={cancelLines}
              onItemsChange={setCancelLines}
              primaryColor={pageTheme?.primaryColor}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!isFormValid() || isSubmitting}
            style={{
              backgroundColor: isFormValid() && !isSubmitting ? pageTheme?.primaryColor : undefined,
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating {cancelLines.filter((i) => i.productId && i.cancelledQty > 0).length}{' '}
                product(s)...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Update Production Cancel (
                {cancelLines.filter((i) => i.productId && i.cancelledQty > 0).length} product(s))
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
