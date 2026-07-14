'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { priceListsApi, type UpdatePriceListDto } from '@/lib/api/price-lists';
import toast from 'react-hot-toast';

export default function EditPriceRecordPage() {
  const router = useRouter();
  const params = useParams();
  const priceListId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    code: '',
    name: '',
    priceListType: 'Standard',
    currency: 'LKR',
    effectiveFrom: '',
    effectiveTo: '',
    comment: '',
    isDefault: false,
    priority: 0,
    isActive: true,
  });

  const set = (k: keyof typeof form, v: string | boolean | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const pl = await priceListsApi.getById(priceListId);
      setForm({
        code: pl.code,
        name: pl.name,
        priceListType: pl.priceListType || 'Standard',
        currency: pl.currency,
        effectiveFrom: pl.effectiveFrom.split('T')[0] ?? '',
        effectiveTo: pl.effectiveTo ? pl.effectiveTo.split('T')[0] : '',
        comment: pl.description || pl.name,
        isDefault: pl.isDefault,
        priority: pl.priority,
        isActive: pl.isActive,
      });
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
    if (!form.effectiveFrom) { toast.error('Effective date is required.'); return; }
    if (!form.comment.trim()) { toast.error('Comment is required.'); return; }

    try {
      setSubmitting(true);
      const dto: UpdatePriceListDto = {
        code: form.code,
        name: form.comment.trim(),
        description: form.comment.trim(),
        priceListType: form.priceListType,
        currency: form.currency,
        effectiveFrom: form.effectiveFrom,
        effectiveTo: form.effectiveTo || undefined,
        isDefault: form.isDefault,
        priority: form.priority,
        isActive: form.isActive,
      };
      await priceListsApi.update(priceListId, dto);
      toast.success('Price record updated successfully.');
      router.push('/administrator/price-manager');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to update price record.');
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
            Update the effective date or comment for this price update.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Price Update Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Effected From *"
                type="date"
                value={form.effectiveFrom}
                onChange={(e) => set('effectiveFrom', e.target.value)}
                fullWidth
                required
                helperText="Date when the price update takes effect"
              />
              <Input
                label="Effected To (optional)"
                type="date"
                value={form.effectiveTo}
                onChange={(e) => set('effectiveTo', e.target.value)}
                min={form.effectiveFrom}
                fullWidth
                helperText='Leave empty for "Up to Date"'
              />
            </div>

            <Input
              label="Comment *"
              value={form.comment}
              onChange={(e) => set('comment', e.target.value)}
              placeholder="e.g. Changed in Product Master"
              fullWidth
              required
              helperText="Describe the reason for this price update"
            />

            <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
                disabled={submitting}
              >
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
