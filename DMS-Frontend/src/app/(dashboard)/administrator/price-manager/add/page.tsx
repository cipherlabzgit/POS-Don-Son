'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { ArrowLeft, Plus, Info } from 'lucide-react';
import { priceListsApi, type CreatePriceListDto } from '@/lib/api/price-lists';
import toast from 'react-hot-toast';

function todayIso() {
  return new Date().toISOString().split('T')[0]!;
}

export default function AddPriceRecordPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    effectiveFrom: todayIso(),
    effectiveTo: '',
    comment: '',
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.effectiveFrom) {
      toast.error('Effective date is required.');
      return;
    }
    if (!form.comment.trim()) {
      toast.error('Comment is required.');
      return;
    }

    try {
      setSubmitting(true);

      // Auto-generate a unique code from the date + timestamp
      const ts = Date.now().toString(36).toUpperCase();
      const code = `PM-${form.effectiveFrom.replace(/-/g, '')}-${ts}`.slice(0, 50);

      const dto: CreatePriceListDto = {
        code,
        name: form.comment.trim(),
        description: form.comment.trim(),
        priceListType: 'Standard',
        currency: 'LKR',
        effectiveFrom: form.effectiveFrom,
        effectiveTo: form.effectiveTo || undefined,
        isDefault: false,
        priority: 0,
        isActive: true,
      };

      await priceListsApi.create(dto);
      toast.success('Price record created. Prices will update automatically from the effective date.');
      router.push('/administrator/price-manager');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to create price record.');
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
            Schedule a product price update to become effective on a selected date.
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div
        className="p-4 rounded-lg flex items-start gap-3"
        style={{ backgroundColor: '#FFFBEB', border: '1px solid #FFD100' }}
      >
        <Info className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#92400E' }} />
        <p className="text-sm" style={{ color: '#92400E' }}>
          Select a future date to schedule a price update. Prices will update <strong>automatically</strong> from
          that date onwards. The <strong>Effected To</strong> date is optional — leave it empty to make the
          change effective indefinitely ("Up to Date").
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
                min={form.effectiveFrom || todayIso()}
                fullWidth
                helperText='Leave empty for "Up to Date" (indefinite)'
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
                  'Creating…'
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Price Record
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
