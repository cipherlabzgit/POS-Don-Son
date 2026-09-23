'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { labelTemplatesApi, type LabelTemplate } from '@/lib/api/label-templates';

export type ProductLabelPreviewSource = {
  labelTemplateId?: string | null;
  labelTemplateCode?: string | null;
  labelTemplateName?: string | null;
  enableLabelPrint?: boolean;
  code?: string;
  name?: string;
  categoryName?: string;
  unitOfMeasure?: string;
  unitPrice?: number | null;
};

function resolveZplForProduct(zpl: string, p: ProductLabelPreviewSource): string {
  const price =
    p.unitPrice != null && !Number.isNaN(Number(p.unitPrice))
      ? `Rs. ${Number(p.unitPrice).toFixed(2)}`
      : '';
  const map: Record<string, string> = {
    '{{product_name}}': p.name ?? '',
    '{{product_code}}': p.code ?? '',
    '{{barcode}}': p.code ?? '',
    '{{category}}': p.categoryName ?? '',
    '{{uom}}': p.unitOfMeasure ?? '',
    '{{price}}': price,
    '{{mrp}}': price,
    '{{price_list}}': '',
    '{{print_date}}': new Date().toISOString().slice(0, 10),
    '{{display_no}}': '',
    '{{company_name}}': '',
    '{{outlet}}': '',
  };
  let out = zpl;
  for (const [token, value] of Object.entries(map)) {
    out = out.replaceAll(token, value);
  }
  return out;
}

export function formatAssignedLabelTemplate(p: ProductLabelPreviewSource): string {
  const code = p.labelTemplateCode?.trim();
  const name = p.labelTemplateName?.trim();
  if (code && name) return `${code} — ${name}`;
  if (name) return name;
  if (code) return code;
  return '—';
}

export function hasAssignedLabelTemplate(p: ProductLabelPreviewSource): boolean {
  return Boolean(p.labelTemplateId?.trim() || p.labelTemplateCode?.trim() || p.labelTemplateName?.trim());
}

type Props = {
  product: ProductLabelPreviewSource;
  /** Accent for section title */
  primaryColor?: string;
};

/**
 * Loads the product's assigned label template and shows a ZPL print preview image.
 */
export default function ProductLabelTemplateView({ product, primaryColor }: Props) {
  const templateId = product.labelTemplateId?.trim() || null;
  const [template, setTemplate] = useState<LabelTemplate | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    setTemplate(null);
    setPreviewUrl(null);
    setError(null);

    if (!templateId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    void (async () => {
      try {
        const full = await labelTemplatesApi.getById(templateId);
        if (cancelled) return;
        setTemplate(full);
        if (!full.layoutDesign?.trim()) {
          setError('This template has no design to preview');
          return;
        }
        const zpl = resolveZplForProduct(full.layoutDesign, product);
        const url = await labelTemplatesApi.zplPreview(zpl, full.widthMm, full.heightMm);
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setPreviewUrl(url);
      } catch {
        if (!cancelled) setError('Failed to load label template preview');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // product identity for substitution — template id is the fetch key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, product.code, product.name, product.unitPrice, product.categoryName]);

  if (!templateId && !hasAssignedLabelTemplate(product)) {
    return null;
  }

  const sizeLabel =
    template && template.widthMm > 0 && template.heightMm > 0
      ? `${template.widthMm} × ${template.heightMm} mm`
      : null;

  return (
    <div
      className="mt-4 space-y-3 rounded-md border p-3"
      style={{
        borderColor: 'var(--form-field-border)',
        backgroundColor: 'var(--muted)',
      }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3
          className="text-sm font-semibold"
          style={{ color: primaryColor ?? 'var(--foreground)' }}
        >
          Label template preview
        </h3>
        {sizeLabel ? (
          <span className="text-xs tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
            {sizeLabel}
          </span>
        ) : null}
      </div>
      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
        {formatAssignedLabelTemplate(product)}
        {product.enableLabelPrint === false ? ' · Label print disabled on product' : ''}
      </p>

      <div
        className="flex min-h-[10rem] items-center justify-center rounded-lg border p-4"
        style={{
          borderColor: 'var(--form-field-border)',
          backgroundColor: 'var(--background)',
        }}
      >
        {loading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Generating preview…
            </p>
          </div>
        ) : error ? (
          <p className="text-sm italic" style={{ color: 'var(--muted-foreground)' }}>
            {error}
          </p>
        ) : previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Assigned label template preview"
            className="max-h-[min(50vh,22rem)] max-w-full rounded shadow-md"
            style={{ objectFit: 'contain' }}
          />
        ) : !templateId ? (
          <p className="text-sm italic" style={{ color: 'var(--muted-foreground)' }}>
            Template name is set but no template id was returned — reopen after saving the product.
          </p>
        ) : (
          <p className="text-sm italic" style={{ color: 'var(--muted-foreground)' }}>
            No preview available
          </p>
        )}
      </div>
    </div>
  );
}
