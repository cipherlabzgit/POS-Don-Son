'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import Checkbox from '@/components/ui/checkbox';
import ImmediateOrderProductLines, {
  type ImmediateOrderLineItem,
} from '@/components/dms/ImmediateOrderProductLines';
import { ArrowLeft, Plus, Loader2, Zap } from 'lucide-react';
import { immediateOrdersApi } from '@/lib/api/immediate-orders';
import { productsApi, type Product } from '@/lib/api/products';
import { outletsApi, type Outlet } from '@/lib/api/outlets';
import { deliveryTurnsApi, type DeliveryTurn } from '@/lib/api/delivery-turns';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';

const today = () => new Date().toISOString().split('T')[0];

export default function AddImmediateOrderPage() {
  const router = useRouter();
  const { userDisplayName, user, isSuperAdmin } = usePermissions();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [deliveryTurns, setDeliveryTurns] = useState<DeliveryTurn[]>([]);

  const [orderBillNo, setOrderBillNo] = useState('');
  const [orderDate, setOrderDate] = useState(today);
  const [needByDate, setNeedByDate] = useState(today());
  const [needByTime, setNeedByTime] = useState('12:00');
  const [deliveryDate, setDeliveryDate] = useState(today);
  const [deliveryTime, setDeliveryTime] = useState('10:00');
  const [productionStartingDate, setProductionStartingDate] = useState(today);
  const [productionStartingTime, setProductionStartingTime] = useState('08:00');
  const [recipeRequestNumber, setRecipeRequestNumber] = useState('');

  const [outletId, setOutletId] = useState('');
  const [deliveryTurnId, setDeliveryTurnId] = useState('');
  const [orderLines, setOrderLines] = useState<ImmediateOrderLineItem[]>([]);

  const [reason, setReason] = useState('');
  const [isCustomized, setIsCustomized] = useState(false);
  const [customizationNotes, setCustomizationNotes] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const outletLocked =
    Boolean(user?.assignedOutletId) && !isSuperAdmin;

  useEffect(() => {
    if (!user || outlets.length === 0) return;
    if (user.assignedOutletId && !user.isSuperAdmin) {
      setOutletId(user.assignedOutletId);
      return;
    }
    setOutletId((prev) => prev || outlets[0]?.id || '');
  }, [user, outlets]);

  const productById = useCallback(
    (id: string) => products.find((p) => p.id === id),
    [products],
  );

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [productsRes, outletsRes, turnsRes] = await Promise.all([
        productsApi.getAll(1, 500, undefined, undefined, true),
        outletsApi.getAll(1, 100, undefined, undefined, true),
        deliveryTurnsApi.getAll(1, 100, undefined, true),
      ]);

      setProducts(productsRes.products);
      setOutlets(outletsRes.outlets);
      setDeliveryTurns(turnsRes.deliveryTurns);

      if (turnsRes.deliveryTurns.length > 0) setDeliveryTurnId(turnsRes.deliveryTurns[0].id);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderBillNo.trim()) {
      toast.error('Order Bill No. is required');
      return;
    }
    if (!needByDate || !needByTime.trim()) {
      toast.error('Need-by date and time are required');
      return;
    }
    if (!deliveryDate || !deliveryTime.trim()) {
      toast.error('Delivery date and time are required');
      return;
    }
    if (!productionStartingDate || !productionStartingTime.trim()) {
      toast.error('Production starting date and time are required');
      return;
    }
    if (!outletId || !deliveryTurnId) {
      toast.error('Outlet and delivery turn are required');
      return;
    }
    if (!recipeRequestNumber.trim()) {
      toast.error('Recipe request no. is required');
      return;
    }
    if (!reason.trim()) {
      toast.error('Reason is required');
      return;
    }
    if (isCustomized && !customizationNotes.trim()) {
      toast.error('Customization notes are required when the order is customized');
      return;
    }

    if (orderLines.length === 0) {
      toast.error('Add at least one product using search and Add to list');
      return;
    }

    for (const line of orderLines) {
      const p = productById(line.productId);
      const full = line.fullQuantity;
      const mini = p?.hasMiniSize ? line.miniQuantity : 0;
      if (full <= 0 && mini <= 0) {
        toast.error('Each product needs a quantity (full and/or mini)');
        return;
      }
    }

    const requestedBy =
      userDisplayName?.trim() ||
      [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
      user?.email ||
      'DMS User';

    const payloadBase = {
      orderBillNo: orderBillNo.trim(),
      orderDate,
      needByDate,
      needByTime: needByTime.trim(),
      deliveryDate,
      deliveryTime: deliveryTime.trim(),
      productionStartingDate,
      productionStartingTime: productionStartingTime.trim(),
      recipeRequestNumber: recipeRequestNumber.trim(),
      deliveryTurnId,
      outletId,
      requestedBy,
      reason: reason.trim(),
      isCustomized,
      customizationNotes: isCustomized ? customizationNotes.trim() : undefined,
    };

    try {
      setIsSubmitting(true);
      await Promise.all(
        orderLines.map((line) => {
          const p = productById(line.productId);
          const fullQty = line.fullQuantity;
          const miniQty = p?.hasMiniSize ? line.miniQuantity : 0;
          return immediateOrdersApi.create({
            ...payloadBase,
            productId: line.productId,
            fullQuantity: fullQty,
            miniQuantity: miniQty,
          });
        }),
      );

      toast.success(`Created ${orderLines.length} immediate order${orderLines.length === 1 ? '' : 's'}`);
      router.push('/dms/immediate-orders');
    } catch {
      toast.error('Failed to create immediate order(s)');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p style={{ color: 'var(--muted-foreground)' }}>Loading...</p>
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
            Add Immediate Order
          </h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Search products, enter quantities, add to list — same pattern as daily production &amp; stock forms
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div
              className="space-y-4 p-4 rounded-lg"
              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}
            >
              <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                Required details
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input
                  label="Order Bill No."
                  value={orderBillNo}
                  onChange={(e) => setOrderBillNo(e.target.value)}
                  placeholder="Showroom / POS bill reference"
                  fullWidth
                  required
                />
                <Input
                  label="Need by date"
                  type="date"
                  value={needByDate}
                  onChange={(e) => setNeedByDate(e.target.value)}
                  min={orderDate}
                  fullWidth
                  required
                />
                <Input
                  label="Need by time"
                  type="time"
                  value={needByTime}
                  onChange={(e) => setNeedByTime(e.target.value)}
                  fullWidth
                  required
                />
                <Input
                  label="Production starting date"
                  type="date"
                  value={productionStartingDate}
                  onChange={(e) => setProductionStartingDate(e.target.value)}
                  fullWidth
                  required
                />
                <Input
                  label="Production starting time"
                  type="time"
                  value={productionStartingTime}
                  onChange={(e) => setProductionStartingTime(e.target.value)}
                  fullWidth
                  required
                />
                <Input
                  label="Recipe request no."
                  value={recipeRequestNumber}
                  onChange={(e) => setRecipeRequestNumber(e.target.value)}
                  placeholder="Reference number"
                  fullWidth
                  required
                />
              </div>
            </div>

            <div
              className="space-y-4 p-4 rounded-lg"
              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}
            >
              <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                Delivery &amp; order date
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Order date"
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  fullWidth
                  required
                />
                <Input
                  label="Delivery date"
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  fullWidth
                  required
                />
                <Input
                  label="Delivery time"
                  type="time"
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  fullWidth
                  required
                />
              </div>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                Delivery date and time are chosen by whoever creates the request—they are not tied to a single default
                plan (for example a 5:00 AM run).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {outletLocked && user?.assignedOutletId ? (
                <Select
                  label="Showroom"
                  value={user.assignedOutletId}
                  onChange={() => {}}
                  options={[{ value: user.assignedOutletId, label: user.assignedOutletName ?? 'Your showroom' }]}
                  fullWidth
                  required
                  disabled
                />
              ) : (
                <Select
                  label="Showroom"
                  value={outletId}
                  onChange={(e) => setOutletId(e.target.value)}
                  options={outlets.map((o) => ({ value: o.id, label: o.name }))}
                  fullWidth
                  required
                />
              )}

              <Select
                label="Delivery turn"
                value={deliveryTurnId}
                onChange={(e) => setDeliveryTurnId(e.target.value)}
                options={deliveryTurns.map((t) => ({ value: t.id, label: t.name }))}
                fullWidth
                required
              />
            </div>
            <p className="text-xs -mt-2" style={{ color: 'var(--muted-foreground)' }}>
              {outletLocked
                ? 'Your account is linked to this showroom; orders are created for this location only.'
                : 'Choose the showroom this request belongs to. Choose the turn that matches production and dispatch (morning, evening, etc.)—not a fixed plan time unless you select it.'}
            </p>

            <ImmediateOrderProductLines products={products} items={orderLines} onItemsChange={setOrderLines} />

            <Input
              label="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why this immediate order is needed"
              fullWidth
              required
            />

            <Checkbox label="Customized order" checked={isCustomized} onChange={(e) => setIsCustomized(e.target.checked)} />

            {isCustomized && (
              <Input
                label="Customization notes"
                value={customizationNotes}
                onChange={(e) => setCustomizationNotes(e.target.value)}
                placeholder="e.g. Extra egg filling, double garnish"
                fullWidth
                required
              />
            )}

            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--dms-warn-box)', border: '1px solid var(--dms-warn-box-border)' }}>
              <div className="flex items-start space-x-2">
                <Zap className="w-5 h-5 mt-0.5 shrink-0" style={{ color: 'var(--brand-primary)' }} />
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--dms-notes-title)' }}>
                    Immediate order
                  </p>
                  <p className="text-sm" style={{ color: 'var(--dms-notes-fg)' }}>
                    Status starts as <strong>Pending</strong> until a manager approves. Delivery date, time, and turn are
                    whatever the creator selected above so the order is tied to the correct run—no fixed plan is imposed.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Submit orders
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
