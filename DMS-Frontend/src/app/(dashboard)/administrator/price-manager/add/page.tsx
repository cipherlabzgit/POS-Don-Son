'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { ArrowLeft, Plus, Info, Loader2 } from 'lucide-react';
import { priceListsApi, type CreatePriceListDto } from '@/lib/api/price-lists';
import { productsApi, type Product } from '@/lib/api/products';
import { PriceChangeLinesEditor, type PriceChangeLine } from '@/components/administrator/PriceChangeLinesEditor';
import { formatCalendarDateInZone } from '@/lib/sri-lanka-time';
import toast from 'react-hot-toast';

async function loadAllProducts(): Promise<Product[]> {
  const pageSize = 200;
  const first = await productsApi.getAll(1, pageSize, undefined, undefined, true);
  const all = [...first.products];
  for (let page = 2; page <= first.totalPages; page++) {
    const next = await productsApi.getAll(page, pageSize, undefined, undefined, true);
    all.push(...next.products);
  }
  return all;
}

export default function AddPriceRecordPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [effectiveFrom, setEffectiveFrom] = useState(formatCalendarDateInZone(new Date()));
  const [comment, setComment] = useState('');
  const [lines, setLines] = useState<PriceChangeLine[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const list = await loadAllProducts();
        if (!cancelled) setProducts(list);
      } catch {
        toast.error('Failed to load products.');
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveFrom) {
      toast.error('Effective date is required.');
      return;
    }
    if (!comment.trim()) {
      toast.error('Comment is required.');
      return;
    }
    if (lines.length === 0) {
      toast.error('Add at least one item.');
      return;
    }

    try {
      setSubmitting(true);
      const ts = Date.now().toString(36).toUpperCase();
      const code = `PM-${effectiveFrom.replace(/-/g, '')}-${ts}`.slice(0, 50);
      const dto: CreatePriceListDto = {
        code,
        name: comment.trim().slice(0, 100),
        description: comment.trim(),
        priceListType: 'Pending',
        currency: 'LKR',
        effectiveFrom,
        isDefault: false,
        priority: 0,
        isActive: true,
        items: lines.map((l) => ({ productId: l.productId, unitPrice: l.newPrice })),
      };
      await priceListsApi.create(dto);
      toast.success('Price change submitted. After approval it applies from the effective date at 12:00 AM.');
      router.push('/administrator/price-manager');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to submit price change.');
    } finally {
      setSubmitting(false);
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
            Add Price Update
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Search items, set new prices, and submit for approval. Catalog prices do not change until approved.
          </p>
        </div>
      </div>

      <div
        className="p-4 rounded-lg flex items-start gap-3"
        style={{ backgroundColor: '#FFFBEB', border: '1px solid #FFD100' }}
      >
        <Info className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#92400E' }} />
        <p className="text-sm" style={{ color: '#92400E' }}>
          POS / catalog prices take effect from the <strong>Effective Date at 12:00 AM (Sri Lanka)</strong>,
          and only after Approvals. Data entry modules show the price that matches the date you select
          (the day before stays on the previous price).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Price Update Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Effective Date *"
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                fullWidth
                required
                helperText="New prices apply from this calendar day at 12:00 AM (Sri Lanka), after approval"
              />
            </div>

            <Input
              label="Comment *"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Seasonal price revision"
              fullWidth
              required
            />

            {loadingProducts ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#C8102E' }} />
              </div>
            ) : (
              <PriceChangeLinesEditor products={products} lines={lines} onChange={setLines} canImport />
            )}

            <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <Button type="button" variant="ghost" onClick={() => router.back()} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={submitting || loadingProducts}>
                {submitting ? (
                  'Submitting…'
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Submit for Approval
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
