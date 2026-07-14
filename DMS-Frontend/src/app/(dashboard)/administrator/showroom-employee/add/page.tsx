'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { ArrowLeft, Plus } from 'lucide-react';
import { outletEmployeesApi, type CreateOutletEmployeeDto } from '@/lib/api/outlet-employees';
import { outletsApi, type Outlet } from '@/lib/api/outlets';
import toast from 'react-hot-toast';

export default function AddShowroomEmployeePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [outletsLoading, setOutletsLoading] = useState(true);

  const loadOutlets = useCallback(async () => {
    try {
      setOutletsLoading(true);
      const res = await outletsApi.getAll(1, 200, undefined, undefined, true);
      setOutlets(res.outlets ?? []);
    } catch {
      toast.error('Could not load showrooms.');
    } finally {
      setOutletsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOutlets();
  }, [loadOutlets]);

  const outletOptions = useMemo(
    () =>
      [...outlets]
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.name.localeCompare(b.name))
        .map((o) => ({ value: o.id, label: `${o.code} — ${o.name}` })),
    [outlets]
  );

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
    hireDate: new Date().toISOString().split('T')[0],
    terminationDate: '',
    notes: '',
    isActive: true,
  });

  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.outletId) { toast.error('Please select a showroom.'); return; }
    if (!form.employeeCode.trim()) { toast.error('Employee ID is required.'); return; }
    if (!form.firstName.trim()) { toast.error('First name is required.'); return; }
    if (!form.lastName.trim()) { toast.error('Last name is required.'); return; }
    if (!form.email.trim()) { toast.error('Email is required.'); return; }

    try {
      setSubmitting(true);
      const dto: CreateOutletEmployeeDto = {
        outletId: form.outletId,
        ...(form.userId ? { userId: form.userId } : {}),
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
      await outletEmployeesApi.create(dto);
      toast.success('Employee added successfully.');
      router.push('/administrator/showroom-employee');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to add employee.');
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
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Add Showroom Employee</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Register a new employee and assign them to a showroom.
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
                placeholder={outletsLoading ? 'Loading…' : 'Select showroom'}
                fullWidth
                required
                disabled={outletsLoading}
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
            {submitting ? 'Adding…' : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Employee
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
