'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Clock, Plus, Search, Edit, X, Check, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { shiftsApi, type Shift, type UpdateShiftDto } from '@/lib/api/shifts';
import toast from 'react-hot-toast';

export default function ShiftsPage() {
  const router = useRouter();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [includeInactive, setIncludeInactive] = useState(false);

  useEffect(() => {
    loadShifts();
  }, [includeInactive]);

  const loadShifts = async () => {
    try {
      setLoading(true);
      const data = await shiftsApi.getAll(includeInactive);
      setShifts(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load shifts');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (shift: Shift) => {
    try {
      const updateData: UpdateShiftDto = {
        name: shift.name,
        code: shift.code,
        startTime: shift.startTime,
        endTime: shift.endTime,
        description: shift.description,
        displayOrder: shift.displayOrder,
        isActive: !shift.isActive,
      };
      await shiftsApi.update(shift.id, updateData);
      toast.success(`Shift ${shift.isActive ? 'deactivated' : 'activated'}`);
      loadShifts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update shift');
    }
  };

  const handleDelete = async (shift: Shift) => {
    if (!confirm(`Are you sure you want to delete "${shift.name}"?`)) {
      return;
    }

    try {
      await shiftsApi.delete(shift.id);
      toast.success('Shift deleted successfully');
      loadShifts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete shift');
    }
  };

  const formatTime = (timeString: string) => {
    // TimeString is in format "HH:mm:ss"
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const columns = [
    {
      key: 'code',
      label: 'Code',
      render: (item: Shift) => (
        <span className="font-mono font-semibold" style={{ color: '#C8102E' }}>
          {item.code}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'Shift Name',
      render: (item: Shift) => (
        <div>
          <span className="font-medium">{item.name}</span>
          {item.description && (
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {item.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'time',
      label: 'Time Range',
      render: (item: Shift) => (
        <div className="flex items-center gap-1 text-sm">
          <Clock className="w-3 h-3" style={{ color: 'var(--muted-foreground)' }} />
          <span>{formatTime(item.startTime)} - {formatTime(item.endTime)}</span>
        </div>
      ),
    },
    {
      key: 'displayOrder',
      label: 'Order',
      render: (item: Shift) => (
        <Badge variant="neutral" size="sm">{item.displayOrder}</Badge>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (item: Shift) => (
        item.isActive ? (
          <Badge variant="success" size="sm">Active</Badge>
        ) : (
          <Badge variant="danger" size="sm">Inactive</Badge>
        )
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: Shift) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => router.push(`/administrator/shifts/edit/${item.id}`)}
            className="p-1.5 rounded transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleToggleActive(item)}
            className="p-1.5 rounded transition-colors"
            style={{ color: item.isActive ? '#DC2626' : '#10B981' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = item.isActive ? '#FEF2F2' : '#F0FDF4'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title={item.isActive ? 'Deactivate' : 'Activate'}
          >
            {item.isActive ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            <Clock className="w-8 h-8 inline-block mr-3" style={{ color: '#C8102E' }} />
            Production Shifts
          </h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Manage production shifts and their schedules ({shifts.length} shifts)
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => router.push('/administrator/shifts/add')}>
          <Plus className="w-4 h-4 mr-2" />
          Add Shift
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Shift List</CardTitle>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Show inactive</span>
            </label>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#C8102E' }} />
            </div>
          ) : shifts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Clock className="w-12 h-12 mb-4" style={{ color: 'var(--muted-foreground)' }} />
              <p className="text-lg font-medium" style={{ color: 'var(--muted-foreground)' }}>
                No shifts found
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                Create your first shift to get started
              </p>
            </div>
          ) : (
            <DataTable
              data={shifts}
              columns={columns}
              currentPage={1}
              totalPages={1}
              pageSize={shifts.length}
              onPageChange={() => {}}
              onPageSizeChange={() => {}}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
