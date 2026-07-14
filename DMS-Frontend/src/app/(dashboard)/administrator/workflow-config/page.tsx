'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Select from '@/components/ui/select';
import { ProtectedPage } from '@/components/auth';
import { usePermissions } from '@/hooks/usePermissions';
import { Workflow, Search, Edit2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { workflowConfigsApi, type WorkflowConfig } from '@/lib/api/workflow-configs';

const PAGE_SIZES = [10, 25, 50];

export default function WorkflowConfigPage() {
  const router = useRouter();
  const { can } = usePermissions();

  const [configs, setConfigs] = useState<WorkflowConfig[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await workflowConfigsApi.getAll(page, pageSize, search || undefined);
      setConfigs(res.workflowConfigs);
      setTotalCount(res.totalCount);
    } catch {
      toast.error('Failed to load workflow configurations.');
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
    <ProtectedPage permission="workflow-config:view">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: 'var(--foreground)' }}>
            <Workflow className="w-8 h-8" style={{ color: '#C8102E' }} />
            WorkFlow Configuration
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Set up user groups for roles &amp; capabilities to receive approvals for each operation.
          </p>
        </div>

        <Card>
          {/* Table controls */}
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
                      <tr
                        style={{
                          backgroundColor: 'var(--muted)',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        <th
                          className="px-4 py-3 text-left font-semibold"
                          style={{ color: 'var(--foreground)' }}
                        >
                          Operation Name
                          <span className="ml-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>▲</span>
                        </th>
                        <th className="px-4 py-3 w-16" />
                      </tr>
                    </thead>
                    <tbody>
                      {configs.length === 0 ? (
                        <tr>
                          <td
                            colSpan={2}
                            className="px-4 py-12 text-center text-sm"
                            style={{ color: 'var(--muted-foreground)' }}
                          >
                            No workflow operations found.
                          </td>
                        </tr>
                      ) : (
                        configs.map((cfg) => (
                          <tr
                            key={cfg.id}
                            className="border-t transition-colors"
                            style={{ borderColor: 'var(--border)' }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor = 'var(--muted)')
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor = 'transparent')
                            }
                          >
                            {/* Operation Name */}
                            <td className="px-4 py-3" style={{ color: 'var(--foreground)' }}>
                              {cfg.name}
                            </td>

                            {/* Edit icon */}
                            <td className="px-4 py-3 text-right">
                              {can('workflow-config:edit') && (
                                <button
                                  title="Configure"
                                  onClick={() =>
                                    router.push(`/administrator/workflow-config/edit/${cfg.id}`)
                                  }
                                  className="p-1.5 rounded transition-colors"
                                  style={{ color: 'var(--muted-foreground)' }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.color = '#2563EB')
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.color = 'var(--muted-foreground)')
                                  }
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              )}
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
                      : `Showing ${(page - 1) * pageSize + 1} to ${Math.min(
                          page * pageSize,
                          totalCount
                        )} of ${totalCount} entries`}
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
                      .filter(
                        (p) =>
                          p === 1 || p === totalPages || Math.abs(p - page) <= 1
                      )
                      .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                        if (idx > 0 && p - (arr[idx - 1] as number) > 1)
                          acc.push('...');
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
      </div>
    </ProtectedPage>
  );
}
