'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { showroomOpenStockApi } from '@/lib/api/showroom-open-stock';
import { ProtectedPage } from '@/components/auth';
import toast from 'react-hot-toast';

function toDateInputValue(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function EditShowroomOpenStockPage() {
  return (
    <ProtectedPage permission="operation:showroom-open-stock:update">
      <EditShowroomOpenStockPageContent />
    </ProtectedPage>
  );
}

function EditShowroomOpenStockPageContent() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showroom, setShowroom] = useState<{
    outletCode: string;
    outletName: string;
    stockAsAt?: string | null;
    bfLineCount?: number | null;
  } | null>(null);
  const [newStockAsAt, setNewStockAsAt] = useState('');

  useEffect(() => {
    void fetchShowroom();
  }, [id]);

  const fetchShowroom = async () => {
    try {
      setIsLoading(true);
      const detail = await showroomOpenStockApi.getById(id);
      if (!detail) {
        toast.error('Showroom not found');
        router.push('/operation/showroom-open-stock');
        return;
      }
      setShowroom({
        outletCode: detail.outletCode,
        outletName: detail.outletName,
        stockAsAt: detail.stockAsAt ?? null,
        bfLineCount: detail.bfLineCount ?? null,
      });
      setNewStockAsAt(toDateInputValue(detail.stockAsAt ?? null));
    } catch (error: unknown) {
      const message =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
          ? (error as { response: { data: { message: string } } }).response.data.message
          : 'Failed to load showroom';
      toast.error(message);
      router.push('/operation/showroom-open-stock');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!showroom?.stockAsAt) {
      toast.error('There is no approved Stock B/F to re-date for this showroom.');
      return;
    }

    if (!newStockAsAt) {
      toast.error('Please select a stock as at date');
      return;
    }

    try {
      setIsSubmitting(true);
      await showroomOpenStockApi.update(id, {
        stockAsAt: newStockAsAt,
      });
      toast.success('Stock as at date updated. All B/F lines for the latest snapshot were moved to the new effective date.');
      router.push('/operation/showroom-open-stock');
    } catch (error: unknown) {
      const message =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
          ? (error as { response: { data: { message: string } } }).response.data.message
          : 'Failed to update stock as at date';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            Edit Last Stock BF Date
          </h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Assign a new calendar date to the showroom&apos;s latest approved B/F quantities so they serve as opening
            stock from that date (skipping intervening closure days).
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Showroom information</CardTitle>
        </CardHeader>
        <CardContent>
          {!showroom?.stockAsAt ? (
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
              This showroom has no approved or adjusted Stock B/F yet. Enter B/F via Stock B/F first; approval is required
              before the open-stock date can be maintained here.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
                  Showroom
                </p>
                <p className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                  {showroom?.outletCode} — {showroom?.outletName}
                </p>
                {typeof showroom?.bfLineCount === 'number' ? (
                  <p className="mt-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {showroom.bfLineCount} B/F line(s) are on the current effective date; they will all move to the new
                    date you choose.
                  </p>
                ) : null}
              </div>

              <Input
                label="Stock as at (new effective date)"
                type="date"
                value={newStockAsAt}
                onChange={(e) => setNewStockAsAt(e.target.value)}
                fullWidth
                required
                helperText="Balances stay the same — only the B/F snapshot date changes for downstream stock calculations."
              />

              <div className="flex justify-end gap-3 border-t pt-4">
                <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save date
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
