'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Select from '@/components/ui/select';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { ProtectedPage } from '@/components/auth';
import { usePermissions } from '@/hooks/usePermissions';
import { Users, Plus, Search, Edit2, Info, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import { outletEmployeesApi, type OutletEmployee } from '@/lib/api/outlet-employees';
import { formatSlDate } from '@/lib/sri-lanka-time';

const PAGE_SIZES = [10, 25, 50];

export default function ShowroomEmployeePage() {
  const router = useRouter();
  const { can } = usePermissions();

  const [employees, setEmployees] = useState<OutletEmployee[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);

  // Detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<OutletEmployee | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await outletEmployeesApi.getAll(page, pageSize, undefined, undefined, search || undefined);
      setEmployees(res.outletEmployees);
      setTotalCount(res.totalCount);
    } catch {
      toast.error('Failed to load employees.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const handleSearchChange = (v: string) => {
    setSearch(v);
    setPage(1);
  };

  const openDetail = (emp: OutletEmployee) => {
    setSelected(emp);
    setDetailOpen(true);
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return '-';
    return formatSlDate(iso, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <ProtectedPage permission="employee:view">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: 'var(--foreground)' }}>
              <Users className="w-8 h-8" style={{ color: '#C8102E' }} />
              Showroom Employees
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
              List of showroom employees — cashier details and POS front-end user data map.
            </p>
          </div>
          {can('employee:create') && (
            <Button
              variant="primary"
              size="md"
              onClick={() => router.push('/administrator/showroom-employee/add')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-sm rounded-md"
                    style={{ border: '1px solid var(--input)', backgroundColor: 'var(--background)', color: 'var(--foreground)', width: 200 }}
                  />
                </div>
              </div>
            </div>
          </CardHeader>

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
                        {['Employee ID', 'Employee Name', 'Showroom', 'Job Title', 'Approved', ''].map((h) => (
                          <th
                            key={h}
                            className="px-4 py-3 text-left font-semibold whitespace-nowrap"
                            style={{ color: 'var(--foreground)' }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {employees.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-12 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
                            No employees found.
                          </td>
                        </tr>
                      ) : (
                        employees.map((emp) => (
                          <tr
                            key={emp.id}
                            className="border-t transition-colors"
                            style={{ borderColor: 'var(--border)' }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--muted)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <td className="px-4 py-3 font-mono text-sm" style={{ color: 'var(--foreground)' }}>
                              {emp.employeeCode || '-'}
                            </td>
                            <td className="px-4 py-3" style={{ color: 'var(--foreground)' }}>
                              <span className="font-medium">{emp.userName}</span>
                            </td>
                            <td className="px-4 py-3" style={{ color: 'var(--foreground)' }}>
                              {emp.outletName}
                            </td>
                            <td className="px-4 py-3" style={{ color: 'var(--foreground)' }}>
                              {emp.position || emp.designation || '-'}
                            </td>
                            <td className="px-4 py-3">
                              {emp.isActive ? (
                                <span className="text-sm" style={{ color: '#16a34a' }}>Approved</span>
                              ) : (
                                <Badge variant="danger" size="sm">Inactive</Badge>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                {can('employee:edit') && (
                                  <button
                                    title="Edit"
                                    onClick={() => router.push(`/administrator/showroom-employee/edit/${emp.id}`)}
                                    className="p-1.5 rounded transition-colors"
                                    style={{ color: 'var(--muted-foreground)' }}
                                    onMouseEnter={(e) => (e.currentTarget.style.color = '#2563EB')}
                                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted-foreground)')}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  title="Details"
                                  onClick={() => openDetail(emp)}
                                  className="p-1.5 rounded transition-colors"
                                  style={{ color: 'var(--muted-foreground)' }}
                                  onMouseEnter={(e) => (e.currentTarget.style.color = '#C8102E')}
                                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted-foreground)')}
                                >
                                  <Info className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer: showing + pagination */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
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
                          <span key={`ellipsis-${i}`} className="px-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>…</span>
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

        {/* Detail Modal */}
        {selected && (
          <Modal
            isOpen={detailOpen}
            onClose={() => setDetailOpen(false)}
            title="Employee Details"
            size="md"
          >
            <div className="space-y-3 text-sm">
              <DetailRow label="Employee ID" value={selected.employeeCode || '-'} />
              <DetailRow label="Name" value={selected.userName} />
              <DetailRow label="Email" value={selected.userEmail || '-'} />
              <DetailRow label="Phone" value={selected.phone || '-'} />
              <DetailRow label="Showroom" value={`${selected.outletName}${selected.outletCode ? ` (${selected.outletCode})` : ''}`} />
              <DetailRow label="Job Title" value={selected.position || selected.designation || '-'} />
              <DetailRow label="Manager" value={selected.isManager ? 'Yes' : 'No'} />
              <DetailRow label="Can Receive Deliveries" value={selected.canReceiveDeliveries ? 'Yes' : 'No'} />
              <DetailRow label="Hire Date" value={formatDate(selected.hireDate)} />
              <DetailRow label="Termination Date" value={formatDate(selected.terminationDate)} />
              <DetailRow label="Status" value={selected.isActive ? 'Active / Approved' : 'Inactive'} />
              {selected.notes && <DetailRow label="Notes" value={selected.notes} />}
            </div>
            <ModalFooter>
              <Button variant="ghost" onClick={() => setDetailOpen(false)}>Close</Button>
              {can('employee:edit') && (
                <Button
                  variant="primary"
                  onClick={() => {
                    setDetailOpen(false);
                    router.push(`/administrator/showroom-employee/edit/${selected.id}`);
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
      <span className="w-44 shrink-0 font-medium" style={{ color: 'var(--muted-foreground)' }}>{label}</span>
      <span style={{ color: 'var(--foreground)' }}>{value}</span>
    </div>
  );
}
