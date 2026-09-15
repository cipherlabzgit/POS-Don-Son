'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { priceListsApi, type UpdatePriceListDto } from '@/lib/api/price-lists';
import { productsApi, type Product } from '@/lib/api/products';
import { PriceChangeLinesEditor, type PriceChangeLine } from '@/components/administrator/PriceChangeLinesEditor';
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

function isPendingStatus(type?: string) {
  const t = (type || '').toLowerCase();
  return t === 'pending' || t === 'standard' || t === '';
}

export default function EditPriceRecordPage() {
  const router = useRouter();
  const params = useParams();
  const priceListId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [code, setCode] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [comment, setComment] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [lines, setLines] = useState<PriceChangeLine[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pl, productList] = await Promise.all([priceListsApi.getById(priceListId), loadAllProducts()]);
      if (!isPendingStatus(pl.priceListType)) {
        toast.error('Only pending price changes can be edited.');
        router.push('/administrator/price-manager');
        return;
      }
      setProducts(productList);
      setCode(pl.code);
      setEffectiveFrom(pl.effectiveFrom.split('T')[0] ?? '');
      setComment(pl.description || pl.name);
      setIsActive(pl.isActive);
      setLines(
        (pl.items ?? []).map((item) => ({
          productId: item.productId,
          productCode: item.productCode,
          productName: item.productName,
          previousPrice: item.previousPrice,
          newPrice: item.newPrice,
        })),
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load price record.');
      router.push('/administrator/price-manager');
    } finally {
      setLoading(false);
    }
  }, [priceListId, router]);

  useEffect(() => {
    void load();
  }, [load]);

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
      const dto: UpdatePriceListDto = {
        code,
        name: comment.trim().slice(0, 100),
        description: comment.trim(),
        priceListType: 'Pending',
        currency: 'LKR',
        effectiveFrom,
        isDefault: false,
        priority: 0,
        isActive,
        items: lines.map((l) => ({ productId: l.productId, unitPrice: l.newPrice })),
      };
      await priceListsApi.update(priceListId, dto);
      toast.success('Pending price change updated.');
      router.push('/administrator/price-manager');
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error?.message ??
          err?.response?.data?.detail ??
          err?.response?.data?.message ??
          'Failed to update price record.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#C8102E' }} />
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
            Edit Price Record
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Pending requests can be edited until they are approved or rejected.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Price Update Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Effective Date *"
              type="date"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
              fullWidth
              required
            />
            <Input
              label="Comment *"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              fullWidth
              required
            />
            <PriceChangeLinesEditor products={products} lines={lines} onChange={setLines} canImport />
            <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <Button type="button" variant="ghost" onClick={() => router.back()} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving…
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
