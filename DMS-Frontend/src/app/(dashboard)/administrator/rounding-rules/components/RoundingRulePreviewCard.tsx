'use client';

import { useState, useEffect } from 'react';
import Input from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { roundingRulesApi, type RoundingRulePreviewRequest } from '@/lib/api/rounding-rules';
import { Loader2 } from 'lucide-react';

function axiosErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const data = (error as { response?: { data?: { error?: { message?: string } } } }).response?.data;
    const msg = data?.error?.message;
    if (typeof msg === 'string' && msg.length > 0) return msg;
  }
  return 'Could not compute preview';
}

export type RoundingRulePreviewCardProps = {
  roundingMethod: string;
  decimalPlaces: number;
  roundingIncrement: number;
  minValue?: number;
  maxValue?: number;
  ratioBaseQuantity?: number;
  ratioYieldQuantity?: number;
};

export function RoundingRulePreviewCard(props: RoundingRulePreviewCardProps) {
  const hasRatio =
    props.ratioBaseQuantity != null &&
    props.ratioBaseQuantity > 0 &&
    props.ratioYieldQuantity != null &&
    props.ratioYieldQuantity >= 0;

  const [sampleItemQty, setSampleItemQty] = useState(4);
  const [sampleStandard, setSampleStandard] = useState(0.75);

  const [standardValue, setStandardValue] = useState<number | null>(null);
  const [roundedValue, setRoundedValue] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const body: RoundingRulePreviewRequest = {
        roundingMethod: props.roundingMethod,
        decimalPlaces: props.decimalPlaces,
        roundingIncrement: props.roundingIncrement,
      };
      if (props.minValue != null) body.minValue = props.minValue;
      if (props.maxValue != null) body.maxValue = props.maxValue;

      if (hasRatio) {
        body.ratioBaseQuantity = props.ratioBaseQuantity;
        body.ratioYieldQuantity = props.ratioYieldQuantity;
        body.sampleItemQuantity = sampleItemQty;
      } else {
        body.sampleStandardValue = sampleStandard;
      }

      try {
        setLoading(true);
        setError(null);
        const res = await roundingRulesApi.preview(body);
        if (!cancelled) {
          setStandardValue(res.standardValue);
          setRoundedValue(res.roundedValue);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setError(axiosErrorMessage(e));
          setStandardValue(null);
          setRoundedValue(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    props.roundingMethod,
    props.decimalPlaces,
    props.roundingIncrement,
    props.minValue,
    props.maxValue,
    props.ratioBaseQuantity,
    props.ratioYieldQuantity,
    hasRatio,
    sampleItemQty,
    sampleStandard,
  ]);

  const decimals = Math.min(6, Math.max(0, props.decimalPlaces));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Preview — standard vs rounded</CardTitle>
        <p className="text-sm font-normal" style={{ color: 'var(--muted-foreground)' }}>
          Values below use the same rounding logic as the API. Adjust sample inputs to verify item-level ratios (e.g. 4 patties → 1 egg).
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasRatio ? (
          <Input
            label="Sample primary item quantity"
            type="number"
            step="any"
            value={Number.isFinite(sampleItemQty) ? String(sampleItemQty) : ''}
            onChange={(e) => setSampleItemQty(parseFloat(e.target.value) || 0)}
            fullWidth
          />
        ) : (
          <Input
            label="Sample standard value (raw)"
            type="number"
            step="any"
            value={Number.isFinite(sampleStandard) ? String(sampleStandard) : ''}
            onChange={(e) => setSampleStandard(parseFloat(e.target.value) || 0)}
            fullWidth
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            className="rounded-lg p-4 border"
            style={{ borderColor: 'var(--input)', background: 'var(--muted)' }}
          >
            <div className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--muted-foreground)' }}>
              Standard value
            </div>
            <div className="text-2xl font-mono font-semibold" style={{ color: 'var(--foreground)' }}>
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin inline" />
              ) : error ? (
                '—'
              ) : standardValue != null ? (
                standardValue.toFixed(decimals)
              ) : (
                '—'
              )}
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>
              Exact proportional or entered amount before rounding.
            </p>
          </div>
          <div
            className="rounded-lg p-4 border"
            style={{ borderColor: '#C8102E33', background: '#FEF2F2' }}
          >
            <div className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: '#991B1B' }}>
              Rounded value
            </div>
            <div className="text-2xl font-mono font-semibold" style={{ color: '#C8102E' }}>
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin inline" />
              ) : error ? (
                '—'
              ) : roundedValue != null ? (
                roundedValue.toFixed(decimals)
              ) : (
                '—'
              )}
            </div>
            <p className="text-xs mt-2" style={{ color: '#991B1B' }}>
              Result after applying increment and rounding method.
            </p>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
