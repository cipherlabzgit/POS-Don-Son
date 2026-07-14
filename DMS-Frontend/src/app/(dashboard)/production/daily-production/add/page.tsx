'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import { ArrowLeft, Plus, Loader2 } from 'lucide-react';
import { dailyProductionsApi } from '@/lib/api/daily-productions';
import { productsApi, type Product } from '@/lib/api/products';
import { shiftsApi, type Shift } from '@/lib/api/shifts';
import { productionSectionsApi, type ProductionSection } from '@/lib/api/production-sections';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useThemeStore } from '@/lib/stores/theme-store';
import { getDateBounds, todayISO } from '@/lib/date-restrictions';
import ProductionLineItemsEntry, {
  type ProductionLineItem,
  type ProductionLineProduct,
  type ProductionSection as ProdSection,
} from '@/components/production/ProductionLineItemsEntry';
import toast from 'react-hot-toast';

export default function AddDailyProductionPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const pageTheme = useThemeStore((s) => s.getPageTheme('daily-production'));
  const dateBounds = getDateBounds('today-only', user as any, {
    allowBackDatePermission: 'production:daily:allow-back-date',
    allowFutureDatePermission: 'production:daily:allow-future-date',
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [productionSections, setProductionSections] = useState<ProductionSection[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    productionDate: todayISO(),
    shiftId: '',
    notes: '',
  });

  const [lineItems, setLineItems] = useState<ProductionLineItem[]>([]);

  useEffect(() => {
    void fetchProducts();
    void fetchShifts();
    void fetchProductionSections();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productsApi.getAll(1, 1000, undefined, undefined, true);
      const productsList = Array.isArray(response.products) ? response.products : [];
      const activeProducts = productsList.filter((p: Product) => p.isActive);
      setProducts(activeProducts);
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
      if (data.length > 0) {
        setFormData((prev) => (prev.shiftId ? prev : { ...prev, shiftId: data[0].id }));
      }
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
      const activeSections = sections.filter((s) => s.isActive);
      setProductionSections(activeSections);
      
      if (activeSections.length === 0) {
        toast.error('No production sections available. Please add production sections first.');
      }
    } catch (error) {
      console.error('Failed to load production sections:', error);
      toast.error('Failed to load production sections');
      setProductionSections([]);
    }
  };

  const linesValid =
    lineItems.filter((l) => l.productId && l.productionSectionId).length > 0;
  const isFormValid = Boolean(formData.productionDate && formData.shiftId && linesValid);

  const handleSubmit = async () => {
    if (!formData.shiftId) {
      toast.error('Please select a shift');
      return;
    }

    const lines = lineItems.filter((l) => l.productId && l.productionSectionId);
    if (lines.length === 0) {
      toast.error('Please add at least one product line with a production section');
      return;
    }

    const batchId = crypto.randomUUID();
    let savedCount = 0;
    try {
      setIsSubmitting(true);
      for (const line of lines) {
        await dailyProductionsApi.create({
          productionDate: formData.productionDate,
          productId: line.productId,
          productionSectionId: line.productionSectionId,
          plannedQty: line.plannedQty,
          producedQty: line.producedQty,
          shiftId: formData.shiftId,
          notes: formData.notes || undefined,
          batchId,
        });
        savedCount++;
      }
      toast.success(
        savedCount === 1
          ? 'Production created successfully'
          : `${savedCount} production entries created successfully`,
      );
      router.push('/production/daily-production');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('Failed to create production:', error);
      const baseMsg =
        error instanceof Error
          ? error.message
          : err.response?.data?.message || 'Failed to create production';
      toast.error(
        savedCount > 0
          ? `${baseMsg} (${savedCount} line(s) were saved — review the list before retrying.)`
          : baseMsg,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            Add New Production
          </h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Same date, shift, and notes for each product line — each line becomes its own pending
            production entry
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Production Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
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
              />
              <Select
                label="Shift"
                value={formData.shiftId}
                onChange={(e) => setFormData({ ...formData, shiftId: e.target.value })}
                options={shifts.map((s) => ({ value: s.id, label: s.name }))}
                placeholder="Select shift"
                fullWidth
                required
              />
            </div>

            <Input
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional notes (applied to every line)"
              fullWidth
            />

            <div className="border-t pt-4">
              <ProductionLineItemsEntry
                products={products.map((p): ProductionLineProduct => ({
                  id: p.id,
                  code: p.code,
                  name: p.name,
                  categoryName: p.categoryName,
                  productionSectionId: p.productionSectionId,
                  sectionAssignments: p.sectionAssignments?.map((a) => ({
                    productionSectionId: a.productionSectionId,
                    productionSectionName: a.productionSectionName,
                  })),
                  requiresOpenStock: p.requiresOpenStock,
                  isActive: p.isActive,
                  displayInPOS: p.displayInPOS,
                  isFavorite: p.isFavorite,
                  unitPrice: p.unitPrice,
                  enableLabelPrint: p.enableLabelPrint,
                  expiryDays: p.expiryDays,
                  expiryHours: p.expiryHours,
                }))}
                productionSections={productionSections.map((s): ProdSection => ({ id: s.id, name: s.name }))}
                items={lineItems}
                onItemsChange={setLineItems}
                primaryColor={pageTheme?.primaryColor}
                enableExcelImport={true}
              />
            </div>

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
                type="button"
                variant="primary"
                disabled={isSubmitting || !isFormValid}
                onClick={handleSubmit}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create production (
                    {lineItems.filter((l) => l.productId && l.productionSectionId).length || 0}{' '}
                    product
                    {(lineItems.filter((l) => l.productId && l.productionSectionId).length || 0) === 1
                      ? ''
                      : 's'}
                    )
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
