'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { outletEmployeesApi, type UpdateOutletEmployeeDto } from '@/lib/api/outlet-employees';
import { outletsApi, type Outlet } from '@/lib/api/outlets';
import toast from 'react-hot-toast';

export default function EditShowroomEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [outlets, setOutlets] = useState<Outlet[]>([]);

  const [form, setForm] = useState({
    outletId: '',
    userId: '',
    employeeCode: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    designation: '',
    isManager: false,
    canReceiveDeliveries: true,
    hireDate: '',
    terminationDate: '',
    notes: '',
    isActive: true,
  });

  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [employee, outletsRes] = await Promise.all([
        outletEmployeesApi.getById(employeeId),
        outletsApi.getAll(1, 200, undefined, undefined, true),
      ]);

      let list: Outlet[] = outletsRes.outlets ?? [];
      if (!list.some((o) => o.id === employee.outletId)) {
        list = [
          {
            id: employee.outletId,
            code: employee.outletCode ?? '—',
            name: employee.outletName || 'Current outlet',
            address: '',
            displayOrder: -1,
            hasVariants: false,
            isDeliveryPoint: false,
            employeeCount: 0,
            isActive: false,
            createdAt: '',
          },
          ...list,
        ];
      }
      setOutlets(list);

      setForm({
        outletId: employee.outletId,
        userId: employee.userId,
        employeeCode: employee.employeeCode ?? '',
        firstName: employee.firstName ?? '',
        lastName: employee.lastName ?? '',
        email: employee.userEmail ?? '',
        phone: employee.phone ?? '',
        position: employee.position ?? '',
        designation: employee.designation ?? '',
        isManager: employee.isManager,
        canReceiveDeliveries: employee.canReceiveDeliveries,
        hireDate: employee.hireDate ? employee.hireDate.split('T')[0] : '',
        terminationDate: employee.terminationDate ? employee.terminationDate.split('T')[0] : '',
        notes: employee.notes ?? '',
        isActive: employee.isActive,
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load employee.');
      router.push('/administrator/showroom-employee');
    } finally {
      setLoading(false);
    }
  }, [employeeId, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const outletOptions = useMemo(
    () =>
      [...outlets]
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.name.localeCompare(b.name))
        .map((o) => ({ value: o.id, label: `${o.code} — ${o.name}` })),
    [outlets]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.outletId) { toast.error('Please select a showroom.'); return; }
    if (!form.employeeCode.trim()) { toast.error('Employee ID is required.'); return; }
    if (!form.firstName.trim()) { toast.error('First name is required.'); return; }
    if (!form.lastName.trim()) { toast.error('Last name is required.'); return; }
    if (!form.email.trim()) { toast.error('Email is required.'); return; }

    try {
      setSubmitting(true);
      const dto: UpdateOutletEmployeeDto = {
        outletId: form.outletId,
        userId: form.userId,
        employeeCode: form.employeeCode.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        fullName: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        position: form.position.trim() || undefined,
        designation: form.designation.trim() || undefined,
        isManager: form.isManager,
        canReceiveDeliveries: form.canReceiveDeliveries,
        hireDate: form.hireDate || undefined,
        terminationDate: form.terminationDate || undefined,
        notes: form.notes.trim() || undefined,
        isActive: form.isActive,
      };
      await outletEmployeesApi.update(employeeId, dto);
      toast.success('Employee updated successfully.');
      router.push('/administrator/showroom-employee');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to update employee.');
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
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Edit Showroom Employee</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Update employee assignment information.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Showroom assignment */}
        <Card>
          <CardHeader><CardTitle>Showroom Assignment</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Showroom *"
                value={form.outletId}
                onChange={(e) => set('outletId', e.target.value)}
                options={outletOptions}
                placeholder="Select showroom"
                fullWidth
                required
                disabled={outletOptions.length === 0}
              />
              <Input
                label="Employee ID *"
                value={form.employeeCode}
                onChange={(e) => set('employeeCode', e.target.value)}
                placeholder="e.g. 0001, 1278"
                fullWidth
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Personal details */}
        <Card>
          <CardHeader><CardTitle>Employee Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name *"
                value={form.firstName}
                onChange={(e) => set('firstName', e.target.value)}
                placeholder="First name"
                fullWidth
                required
              />
              <Input
                label="Last Name *"
                value={form.lastName}
                onChange={(e) => set('lastName', e.target.value)}
                placeholder="Last name"
                fullWidth
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Email *"
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="employee@example.com"
                fullWidth
                required
              />
              <Input
                label="Phone"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="+94 71 234 5678"
                fullWidth
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Job Title / Position"
                value={form.position}
                onChange={(e) => set('position', e.target.value)}
                placeholder="e.g. Cashier"
                fullWidth
              />
              <Input
                label="Designation"
                value={form.designation}
                onChange={(e) => set('designation', e.target.value)}
                placeholder="e.g. Senior Cashier"
                fullWidth
              />
            </div>
          </CardContent>
        </Card>

        {/* Employment details */}
        <Card>
          <CardHeader><CardTitle>Employment Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Hire Date"
                type="date"
                value={form.hireDate}
                onChange={(e) => set('hireDate', e.target.value)}
                fullWidth
              />
              <Input
                label="Termination Date (optional)"
                type="date"
                value={form.terminationDate}
                onChange={(e) => set('terminationDate', e.target.value)}
                fullWidth
              />
            </div>
            <Input
              label="Notes (optional)"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Any additional notes"
              fullWidth
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <Toggle
                checked={form.isManager}
                onChange={(v) => set('isManager', v)}
                label="Is Manager"
              />
              <Toggle
                checked={form.canReceiveDeliveries}
                onChange={(v) => set('canReceiveDeliveries', v)}
                label="Can Receive Deliveries"
              />
              <Toggle
                checked={form.isActive}
                onChange={(v) => set('isActive', v)}
                label="Active / Approved"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => router.back()} disabled={submitting}>
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
    </div>
  );
}
