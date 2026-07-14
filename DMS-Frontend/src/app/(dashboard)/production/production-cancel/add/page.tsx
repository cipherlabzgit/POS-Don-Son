'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import { ArrowLeft, Plus, Loader2, AlertCircle } from 'lucide-react';
import { productionCancelsApi } from '@/lib/api/production-cancels';
import { dailyProductionsApi } from '@/lib/api/daily-productions';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useThemeStore } from '@/lib/stores/theme-store';
import { getDateBounds, todayISO } from '@/lib/date-restrictions';
import toast from 'react-hot-toast';

interface ProductionItem {
  productId: string;
  productCode: string;
  productName: string;
  productionSectionId: string;
  productionSectionName: string;
  producedQty: number;
  cancelledQty: number;
}

export default function AddProductionCancelPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const pageTheme = useThemeStore((s) => s.getPageTheme('production-cancel'));
  const dateBounds = getDateBounds('today-only', user as any, {
    allowBackDatePermission: 'production:cancel:allow-back-date',
    allowFutureDatePermission: 'production:cancel:allow-future-date',
  });

  const [productionNumbers, setProductionNumbers] = useState<string[]>([]);
  const [items, setItems] = useState<ProductionItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingNumbers, setIsLoadingNumbers] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [formData, setFormData] = useState({
    cancelDate: todayISO(),
    productionNo: '',
    reason: '',
  });

  useEffect(() => {
    void fetchProductionNumbers();
  }, []);

  const fetchProductionNumbers = async () => {
    try {
      setIsLoadingNumbers(true);
      console.log('[Production Cancel] Fetching production numbers...');
      const numbers = await dailyProductionsApi.getProductionNumbers();
      console.log('[Production Cancel] Received production numbers:', numbers);
      
      if (Array.isArray(numbers)) {
        setProductionNumbers(numbers);
        console.log(`[Production Cancel] Loaded ${numbers.length} production numbers`);
        if (numbers.length === 0) {
          toast.error('No approved production records found');
        }
      } else {
        console.error('[Production Cancel] Invalid response format:', numbers);
        setProductionNumbers([]);
        toast.error('Invalid response format from server');
      }
    } catch (error) {
      console.error('[Production Cancel] Failed to load production numbers:', error);
      toast.error('Failed to load production numbers. Check console for details.');
      setProductionNumbers([]);
    } finally {
      setIsLoadingNumbers(false);
    }
  };

  const loadProductionItems = async (productionNo: string) => {
    if (!productionNo) {
      setItems([]);
      return;
    }

    try {
      setIsLoadingItems(true);
      console.log(`[Production Cancel] Loading items for production: ${productionNo}`);
      const production = await dailyProductionsApi.getByProductionNo(productionNo);
      console.log('[Production Cancel] Production details:', production);
      
      if (production) {
        const newItem: ProductionItem = {
          productId: production.productId,
          productCode: production.product?.code || production.productCode || '',
          productName: production.product?.name || production.productName || '',
          productionSectionId: production.productionSectionId || '',
          productionSectionName: production.productionSectionName || '',
          producedQty: production.producedQty,
          cancelledQty: production.producedQty, // Default to full quantity
        };
        
        console.log('[Production Cancel] Created item:', newItem);
        setItems([newItem]);
        
        // Auto-focus first quantity input after a short delay
        setTimeout(() => {
          if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
            inputRefs.current[0].select();
          }
        }, 100);
        
        toast.success(`Loaded production: ${newItem.productName}`);
      } else {
        console.warn('[Production Cancel] No production found for:', productionNo);
        toast.error('Production not found');
        setItems([]);
      }
    } catch (error) {
      console.error('[Production Cancel] Failed to load production details:', error);
      toast.error('Failed to load production details. Check console for details.');
      setItems([]);
    } finally {
      setIsLoadingItems(false);
    }
  };

  const handleProductionNoChange = (value: string) => {
    setFormData({ ...formData, productionNo: value });
    void loadProductionItems(value);
  };

  const handleQuantityChange = (index: number, value: string) => {
    const qty = parseFloat(value) || 0;
    const newItems = [...items];
    newItems[index].cancelledQty = qty;
    setItems(newItems);
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      
      // Move to next item
      if (index < items.length - 1) {
        inputRefs.current[index + 1]?.focus();
        inputRefs.current[index + 1]?.select();
      } else {
        // Last item - focus on reason if empty, otherwise submit
        if (!formData.reason.trim()) {
          const reasonInput = document.querySelector<HTMLInputElement>('textarea[placeholder*="Reason"]');
          reasonInput?.focus();
        }
      }
    }
  };

  const isFormValid = Boolean(
    formData.productionNo?.trim() &&
    formData.reason?.trim() &&
    items.length > 0 &&
    items.every((item) => item.cancelledQty > 0 && item.cancelledQty <= item.producedQty)
  );

  const handleSubmit = async () => {
    if (!formData.productionNo?.trim() || !formData.reason?.trim()) {
      toast.error('Please fill all required fields');
      return;
    }

    if (items.length === 0) {
      toast.error('Please select a production number to load items');
      return;
    }

    const invalidItems = items.filter((item) => item.cancelledQty <= 0 || item.cancelledQty > item.producedQty);
    if (invalidItems.length > 0) {
      toast.error(`Invalid quantities. Cancelled qty must be between 1 and produced qty.`);
      return;
    }

    try {
      setIsSubmitting(true);
      
      await productionCancelsApi.create({
        cancelDate: formData.cancelDate,
        productionNo: formData.productionNo.trim(),
        reason: formData.reason.trim(),
        lines: items.map((item) => ({
          productId: item.productId,
          productionSectionId: item.productionSectionId,
          cancelledQty: item.cancelledQty,
        })),
      });
      
      const totalQty = items.reduce((sum, item) => sum + item.cancelledQty, 0);
      toast.success(
        `Production cancellation created with ${items.length} item(s), total qty: ${totalQty.toFixed(2)}`,
      );
      router.push('/production/production-cancel');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('Failed to create production cancellation:', error);
      const baseMsg = err.response?.data?.message || 'Failed to create production cancellation';
      toast.error(baseMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            Request Production Cancel
          </h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Select a production number, modify quantities (Enter to move to next), and submit
          </p>
        </div>
      </div>

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
              <Select
                label="Production No"
                value={formData.productionNo}
                onChange={(e) => handleProductionNoChange(e.target.value)}
                options={[
                  { value: '', label: isLoadingNumbers ? 'Loading...' : 'Select production number' },
                  ...productionNumbers.map((pn) => ({ value: pn, label: pn })),
                ]}
                disabled={isLoadingNumbers || isLoadingItems}
                fullWidth
                required
              />
            </div>

            {isLoadingItems && (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading production items...
              </div>
            )}

            {!isLoadingItems && items.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Products to Cancel</h3>
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-4 items-center p-4 rounded-lg"
                      style={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div className="col-span-1 font-bold text-muted-foreground">
                        {index + 1}
                      </div>
                      <div className="col-span-5">
                        <div className="font-medium">{item.productName}</div>
                        <div className="text-sm text-muted-foreground">
                          Code: {item.productCode}
                        </div>
                      </div>
                      <div className="col-span-3">
                        <div className="text-sm text-muted-foreground">Section</div>
                        <div className="font-medium">{item.productionSectionName}</div>
                      </div>
                      <div className="col-span-1">
                        <div className="text-sm text-muted-foreground">Produced</div>
                        <div className="font-medium">{item.producedQty.toFixed(2)}</div>
                      </div>
                      <div className="col-span-2">
                        <Input
                          label="Cancel Qty"
                          type="number"
                          value={item.cancelledQty}
                          onChange={(e) => handleQuantityChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          ref={(el) => {
                            inputRefs.current[index] = el;
                          }}
                          min={0}
                          max={item.producedQty}
                          step={0.01}
                          fullWidth
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isLoadingItems && formData.productionNo && items.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mb-2" />
                <p>No production found for the selected production number</p>
              </div>
            )}

            {!isLoadingItems && !formData.productionNo && (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <p>Select a production number to load items</p>
              </div>
            )}

            <div className="border-t pt-4">
              <label className="block text-sm font-medium mb-2">
                Cancellation Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Reason for cancellation (applies to all lines)..."
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{
                  borderColor: 'var(--border)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)',
                }}
                rows={3}
                required
              />
            </div>

            <div className="flex justify-end gap-3 border-t pt-4">
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Submit Request ({items.filter((i) => i.cancelledQty > 0).length} product
                    {items.filter((i) => i.cancelledQty > 0).length === 1 ? '' : 's'})
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
