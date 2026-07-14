'use client';

import { Fragment, useMemo, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { InlineDetailPanel } from '@/components/ui/inline-detail-panel';
import { AlertCircle, SquarePen, Info, Loader2 } from 'lucide-react';
import { showroomOpenStockApi, type ShowroomOpenStock } from '@/lib/api/showroom-open-stock';
import { useAuthStore } from '@/lib/stores/auth-store';
import { isAdminUser } from '@/lib/date-restrictions';
import { usePermissions } from '@/hooks/usePermissions';
import { ProtectedPage } from '@/components/auth';
import toast from 'react-hot-toast';
import { formatSlDate, formatSlDateTime } from '@/lib/sri-lanka-time';

function formatDdMmYyyy(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return formatSlDate(d, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function ShowroomOpenStockPage() {
  return (
    <ProtectedPage permission="operation:showroom-open-stock:view">
      <ShowroomOpenStockPageContent />
    </ProtectedPage>
  );
}

function ShowroomOpenStockPageContent() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAdmin = isAdminUser(user);
  const { canAction } = usePermissions();
  const canEditOpenStock = canAction('/operation/showroom-open-stock', 'edit');

  const [showrooms, setShowrooms] = useState<ShowroomOpenStock[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [selected, setSelected] = useState<ShowroomOpenStock | null>(null);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchShowrooms();
  }, []);

  const fetchShowrooms = async () => {
    try {
      setIsLoading(true);
      const response = await showroomOpenStockApi.getAll();
      setShowrooms(response);
    } catch (error: unknown) {
      const message =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
          ? (error as { response: { data: { message: string } } }).response.data.message
          : 'Failed to load showroom open stock';
      toast.error(message);
      setShowrooms([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return showrooms.filter((s) => {
      const matchesSearch =
        (s.outletCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.outletName || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [showrooms, searchTerm]);

  const toggleInfo = (showroom: ShowroomOpenStock) => {
    if (selected?.id === showroom.id) {
      setSelected(null);
      return;
    }
    setSelected(showroom);
  };

  const canShowEditControls = isAdmin || canEditOpenStock;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
          Showroom Open Stock
        </h1>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
          Each row shows the latest approved Stock B/F date for that showroom (opening stock snapshot). Administrators
          may change this date when the showroom was closed for several days — the same quantities are carried forward
          as the opening balance for the new effective date without recording B/F on the skipped calendar days (for
          example, B/F dated 01/01/2026 can be set as opening for 04/01/2026 after closures on 02/01 and 03/01).
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Open stock dates by showroom</CardTitle>
            <div className="relative w-full sm:w-auto sm:max-w-xs">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search showroom code or name…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoComplete="off"
                className="w-full rounded-lg py-2 pl-4 pr-4 text-sm"
                style={{ border: '1px solid var(--input)' }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th className="p-3 text-left font-semibold" style={{ color: 'var(--foreground)' }}>
                      Showroom
                    </th>
                    <th className="p-3 text-left font-semibold" style={{ color: 'var(--foreground)' }}>
                      Stock as at
                    </th>
                    <th className="p-3 text-center font-semibold" style={{ color: 'var(--foreground)' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-8 text-center" style={{ color: 'var(--muted-foreground)' }}>
                        <AlertCircle className="mx-auto mb-2 h-8 w-8" style={{ color: 'var(--muted-foreground)' }} />
                        <p>No showrooms found</p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((s) => (
                      <Fragment key={s.id}>
                        <tr
                          style={{ borderBottom: '1px solid var(--border)' }}
                          className="transition-colors hover:bg-gray-50"
                        >
                          <td className="p-3">
                            <span className="font-mono font-semibold">{s.outletCode || '—'}</span>
                            {s.outletName ? (
                              <span className="ml-2 hidden text-[var(--muted-foreground)] sm:inline">{s.outletName}</span>
                            ) : null}
                          </td>
                          <td className="p-3 font-medium">{formatDdMmYyyy(s.stockAsAt ?? null)}</td>
                          <td className="p-3">
                            <div className="flex justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => toggleInfo(s)}
                                className="inline-flex rounded-md p-2 transition-opacity hover:opacity-90"
                                style={{
                                  backgroundColor: 'var(--primary)',
                                  color: 'var(--primary-foreground)',
                                }}
                                title="Showroom details"
                                aria-label="Show showroom details"
                              >
                                <Info className="h-4 w-4" aria-hidden />
                              </button>
                              {canShowEditControls && (
                                <button
                                  type="button"
                                  onClick={() => router.push(`/operation/showroom-open-stock/edit/${s.outletId}`)}
                                  className="inline-flex rounded-md p-2 transition-opacity hover:opacity-90 disabled:opacity-40"
                                  style={{
                                    backgroundColor: 'var(--primary)',
                                    color: 'var(--primary-foreground)',
                                  }}
                                  disabled={!s.stockAsAt}
                                  title={
                                    s.stockAsAt ? 'Edit stock as at date' : 'No approved Stock B/F exists for this showroom'
                                  }
                                  aria-label={s.stockAsAt ? 'Edit stock as at date' : 'Edit unavailable — no Stock B/F'}
                                >
                                  <SquarePen className="h-4 w-4" aria-hidden />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {selected?.id === s.id ? (
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            <td colSpan={3} className="p-0 align-top" style={{ backgroundColor: 'var(--muted)' }}>
                              <div className="px-2 py-2 sm:px-3 sm:py-3">
                                <InlineDetailPanel
                                  title="Showroom details"
                                  open
                                  onClose={() => setSelected(null)}
                                  footer={
                                    <Button variant="ghost" onClick={() => setSelected(null)}>
                                      Close
                                    </Button>
                                  }
                                >
                                  <div className="space-y-4">
                                    <div>
                                      <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                                        Showroom
                                      </p>
                                      <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                                        {s.outletCode} — {s.outletName || '—'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                                        Stock as at
                                      </p>
                                      <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                                        {formatDdMmYyyy(s.stockAsAt ?? null)}
                                      </p>
                                    </div>
                                    {typeof s.bfLineCount === 'number' && s.stockAsAt ? (
                                      <div>
                                        <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                                          B/F lines on this date
                                        </p>
                                        <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                                          {s.bfLineCount}
                                        </p>
                                      </div>
                                    ) : null}
                                    <div>
                                      <p className="mb-1 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                                        Last updated (B/F batch)
                                      </p>
                                      <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                                        {formatSlDateTime(s.updatedAt)}
                                      </p>
                                    </div>
                                  </div>
                                </InlineDetailPanel>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
