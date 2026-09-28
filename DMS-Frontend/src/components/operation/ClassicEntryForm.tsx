'use client';

import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface ClassicEntryFormProps {
  /** e.g. New Stock B/F */
  title: string;
  /** e.g. Stock B/F No# */
  documentLabel: string;
  backHref: string;
  header: ReactNode;
  children: ReactNode;
  footer: ReactNode;
  extraHeader?: ReactNode;
}

/** Compact add-form chrome matching the live DMS 2.0 data-entry screens. */
export default function ClassicEntryForm({
  title,
  documentLabel,
  backHref,
  header,
  children,
  footer,
  extraHeader,
}: ClassicEntryFormProps) {
  const router = useRouter();

  return (
    <div className="space-y-3 p-3 sm:p-4">
      <Card padding="sm">
        <CardContent className="space-y-3 pb-4 pt-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-base font-semibold sm:text-lg" style={{ color: 'var(--foreground)' }}>
              {title}
              <span className="font-normal" style={{ color: 'var(--muted-foreground)' }}>
                {' '}
                — {documentLabel} New Number
              </span>
            </h1>
            <div className="flex items-center gap-2">
              {extraHeader}
              <Button variant="ghost" size="sm" onClick={() => router.push(backHref)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{header}</div>

          {children}

          <div
            className="flex flex-wrap justify-end gap-2 border-t pt-3"
            style={{ borderColor: 'var(--border)' }}
          >
            {footer}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
