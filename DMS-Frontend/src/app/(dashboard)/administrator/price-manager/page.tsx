'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Select from '@/components/ui/select';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { ProtectedPage } from '@/components/auth';
import { usePermissions } from '@/hooks/usePermissions';
import { DollarSign, Plus, Search, Edit2, Info, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { priceListsApi, type PriceList } from '@/lib/api/price-lists';

const PAGE_SIZES = [10, 25, 50];

/** Format date as dd/Mon/yyyy (e.g. 01/Jan/2015) matching the screenshot */
function fmtEffectiveFrom(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const day = String(d.getUTCDate()).padStart(2, '0');
  const mon = d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
  const yr = d.getUTCFullYear();
  return `${day}/${mon}/${yr}`;
}

/** Format edit date as M/D/YYYY H:MM:SS AM/PM */
function fmtEditDate(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

export default function PriceManagerPage() {
  const router = useRouter();
  const { can, canAction } = usePermissions();
  const canCreate = can('pricing:create') || canAction('/administrator/price-manager', 'create');

  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);

  // Detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<PriceList | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await priceListsApi.getAll(page, pageSize, search || undefined);
      setPriceLists(res.priceLists);
      setTotalCount(res.totalCount);
    } catch {
      toast.error('Failed to load price manager records.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSearchChange = (v: string) => {
    setSearch(v);
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <ProtectedPage permission="pricing:view">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: 'var(--foreground)' }}>
              <DollarSign className="w-8 h-8" style={{ color: '#C8102E' }} />
              Price Manager
              <span className="text-base font-normal" style={{ color: 'var(--muted-foreground)' }}>
                List pricing
              </span>
            </h1>
          </div>
          {canCreate && (
            <Button
              variant="primary"
              size="md"
              onClick={() => router.push('/administrator/price-manager/add')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New
            </Button>
          )}
        </div>

        <Card>
          {/* Table controls header */}
          <div
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            {/* Records per page */}
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
              <Select
                value={String(pageSize)}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                options={PAGE_SIZES.map((s) => ({ value: String(s), label: String(s) }))}
              />
              <span>records per page</span>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Search:</span>
              <div className="relative">
                <Search
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: 'var(--muted-foreground)' }}
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-sm rounded-md"
                  style={{
                    border: '1px solid var(--input)',
                    backgroundColor: 'var(--background)',
                    color: 'var(--foreground)',
                    width: 200,
                  }}
                />
              </div>
            </div>
          </div>

          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#C8102E' }} />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                        {[
                          { label: 'Effected From', sortable: true },
                          { label: 'Effected To', sortable: true },
                          { label: 'Comment', sortable: true },
                          { label: 'User', sortable: true },
                          { label: 'Edit Date', sortable: true },
                          { label: '' },
                        ].map((h) => (
                          <th
                            key={h.label}
                            className="px-4 py-3 text-left font-semibold whitespace-nowrap"
                            style={{ color: 'var(--foreground)' }}
                          >
                            {h.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {priceLists.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-12 text-center text-sm"
                            style={{ color: 'var(--muted-foreground)' }}
                          >
                            No price records found.
                          </td>
                        </tr>
                      ) : (
                        priceLists.map((pl) => (
                          <tr
                            key={pl.id}
                            className="border-t transition-colors"
                            style={{ borderColor: 'var(--border)' }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--muted)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            {/* Effected From */}
                            <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--foreground)' }}>
                              {fmtEffectiveFrom(pl.effectiveFrom)}
                            </td>

                            {/* Effected To — null = "Up to Date" */}
                            <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--foreground)' }}>
                              {pl.effectiveTo ? fmtEffectiveFrom(pl.effectiveTo) : 'Up to Date'}
                            </td>

                            {/* Comment = name or description */}
                            <td className="px-4 py-3" style={{ color: 'var(--foreground)' }}>
                              {pl.description || pl.name}
                            </td>

                            {/* User = createdByName */}
                            <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--foreground)' }}>
                              {pl.createdByName || '-'}
                            </td>

                            {/* Edit Date = updatedAt */}
                            <td
                              className="px-4 py-3 whitespace-nowrap text-xs"
                              style={{ color: 'var(--muted-foreground)' }}
                            >
                              {fmtEditDate(pl.updatedAt || pl.createdAt)}
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <button
                                  title="Details"
                                  onClick={() => { setSelected(pl); setDetailOpen(true); }}
                                  className="p-1.5 rounded transition-colors"
                                  style={{ color: 'var(--muted-foreground)' }}
                                  onMouseEnter={(e) => (e.currentTarget.style.color = '#C8102E')}
                                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted-foreground)')}
                                >
                                  <Info className="w-4 h-4" />
                                </button>
                                {can('pricing:edit') && (
                                  <button
                                    title="Edit"
                                    onClick={() => router.push(`/administrator/price-manager/edit/${pl.id}`)}
                                    className="p-1.5 rounded transition-colors"
                                    style={{ color: 'var(--muted-foreground)' }}
                                    onMouseEnter={(e) => (e.currentTarget.style.color = '#2563EB')}
                                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted-foreground)')}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer: showing + pagination */}
                <div
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    {totalCount === 0
                      ? 'No entries'
                      : `Showing ${(page - 1) * pageSize + 1} to ${Math.min(page * pageSize, totalCount)} of ${totalCount} entries`}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      Previous
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                        if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, i) =>
                        p === '...' ? (
                          <span
                            key={`e-${i}`}
                            className="px-2 text-sm"
                            style={{ color: 'var(--muted-foreground)' }}
                          >
                            …
                          </span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => setPage(p as number)}
                            className="w-8 h-8 rounded text-sm font-medium transition-colors"
                            style={{
                              backgroundColor: page === p ? '#C8102E' : 'transparent',
                              color: page === p ? 'white' : 'var(--foreground)',
                              border: '1px solid var(--border)',
                            }}
                          >
                            {p}
                          </button>
                        )
                      )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Detail modal */}
        {selected && (
          <Modal
            isOpen={detailOpen}
            onClose={() => setDetailOpen(false)}
            title="Price Record Details"
            size="md"
          >
            <div className="space-y-3 text-sm">
              <DetailRow label="Effected From" value={fmtEffectiveFrom(selected.effectiveFrom)} />
              <DetailRow
                label="Effected To"
                value={selected.effectiveTo ? fmtEffectiveFrom(selected.effectiveTo) : 'Up to Date'}
              />
              <DetailRow label="Comment" value={selected.description || selected.name} />
              <DetailRow label="User" value={selected.createdByName || '-'} />
              <DetailRow label="Edit Date" value={fmtEditDate(selected.updatedAt || selected.createdAt)} />
              <DetailRow label="Code" value={selected.code} />
              <DetailRow label="Type" value={selected.priceListType || '-'} />
              <DetailRow label="Currency" value={selected.currency} />
              <DetailRow label="Status" value={selected.isActive ? 'Active' : 'Inactive'} />
            </div>
            <ModalFooter>
              <Button variant="ghost" onClick={() => setDetailOpen(false)}>
                Close
              </Button>
              {can('pricing:edit') && (
                <Button
                  variant="primary"
                  onClick={() => {
                    setDetailOpen(false);
                    router.push(`/administrator/price-manager/edit/${selected.id}`);
                  }}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </ModalFooter>
          </Modal>
        )}
      </div>
    </ProtectedPage>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="w-36 shrink-0 font-medium" style={{ color: 'var(--muted-foreground)' }}>
        {label}
      </span>
      <span style={{ color: 'var(--foreground)' }}>{value}</span>
    </div>
  );
}
