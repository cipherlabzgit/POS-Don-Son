'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { ArrowLeft, Save, Loader2, LayoutDashboard } from 'lucide-react';
import { outletsApi, type Outlet, type UpdateOutletDto } from '@/lib/api/outlets';
import { usersApi, type User } from '@/lib/api/users';
import toast from 'react-hot-toast';

// Helper function to convert 12-hour time to 24-hour format
const convertTo24Hour = (time12h: string): string => {
  if (!time12h) return '';
  
  // Handle formats: "8:00 AM", "08:00", "8:00"
  const time12hTrimmed = time12h.trim().toUpperCase();
  
  // If already in 24-hour format (no AM/PM), return as is
  if (!time12hTrimmed.includes('AM') && !time12hTrimmed.includes('PM')) {
    // Ensure it has leading zero (e.g., "8:00" -> "08:00")
    const parts = time12hTrimmed.split(':');
    if (parts.length === 2) {
      const hours = parts[0].padStart(2, '0');
      return `${hours}:${parts[1]}`;
    }
    return time12hTrimmed;
  }
  
  const isPM = time12hTrimmed.includes('PM');
  const timeWithoutPeriod = time12hTrimmed.replace(/\s*(AM|PM)/g, '').trim();
  const [hoursStr, minutes] = timeWithoutPeriod.split(':');
  let hours = parseInt(hoursStr, 10);
  
  if (isPM && hours !== 12) {
    hours += 12;
  } else if (!isPM && hours === 12) {
    hours = 0;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

// Helper function to convert 24-hour time to 12-hour format
const convertTo12Hour = (time24h: string): string => {
  if (!time24h) return '';
  
  const [hoursStr, minutes] = time24h.split(':');
  let hours = parseInt(hoursStr, 10);
  const period = hours >= 12 ? 'PM' : 'AM';
  
  if (hours === 0) {
    hours = 12;
  } else if (hours > 12) {
    hours -= 12;
  }
  
  return `${hours}:${minutes} ${period}`;
};

export default function EditShowroomPage() {
  const router = useRouter();
  const params = useParams();
  const outletId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const [managers, setManagers] = useState<User[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(true);
  
  const [formData, setFormData] = useState<Partial<UpdateOutletDto & { isActive?: boolean }>>({
    code: '',
    name: '',
    address: '',
    phone: '',
    contactPerson: '',
    operatingHours: '',
    displayOrder: 0,
    hasVariants: true,
    isDeliveryPoint: true,
    isActive: true,
    showInDashboard: true,
  });

  const [openingTime, setOpeningTime] = useState('');
  const [closingTime, setClosingTime] = useState('');

  useEffect(() => {
    fetchOutlet();
    fetchManagers();
  }, [outletId]);

  const fetchManagers = async () => {
    try {
      setLoadingManagers(true);
      const response = await usersApi.getAll(1, 100, '', true);
      // Filter users who have the "Manager" role
      const managerUsers = response.users.filter(user => 
        user.roles.some(role => role.name.toLowerCase() === 'manager')
      );
      setManagers(managerUsers);
    } catch (error: any) {
      console.error('Failed to load managers:', error);
      toast.error('Failed to load managers');
    } finally {
      setLoadingManagers(false);
    }
  };

  const fetchOutlet = async () => {
    try {
      setLoading(true);
      const showroom = await outletsApi.getById(outletId);
      setOutlet(showroom);
      
      setFormData({
        code: showroom.code,
        name: showroom.name,
        address: showroom.address,
        phone: showroom.phone,
        contactPerson: showroom.contactPerson,
        operatingHours: showroom.operatingHours,
        displayOrder: showroom.displayOrder,
        hasVariants: showroom.hasVariants,
        isDeliveryPoint: showroom.isDeliveryPoint,
        isActive: showroom.isActive,
        showInDashboard: showroom.showInDashboard ?? true,
      });
      
      // Parse operating hours if it exists (handles both "8:00 AM - 10:00 PM" and "08:00 - 20:00" formats)
      if (showroom.operatingHours && showroom.operatingHours.trim()) {
        const times = showroom.operatingHours.split('-').map(t => t.trim());
        if (times.length === 2 && times[0] && times[1]) {
          // Convert to 24-hour format for HTML time input
          const opening24 = convertTo24Hour(times[0]);
          const closing24 = convertTo24Hour(times[1]);
          setOpeningTime(opening24);
          setClosingTime(closing24);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load showroom');
      router.push('/showroom');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      // Combine opening and closing times and convert to 12-hour format
      let operatingHours = formData.operatingHours;
      if (openingTime && closingTime) {
        const opening12 = convertTo12Hour(openingTime);
        const closing12 = convertTo12Hour(closingTime);
        operatingHours = `${opening12} - ${closing12}`;
      }

      const updateData: UpdateOutletDto = {
        code: formData.code!,
        name: formData.name!,
        address: formData.address?.trim() || undefined,
        phone: formData.phone,
        contactPerson: formData.contactPerson,
        operatingHours: operatingHours,
        displayOrder: formData.displayOrder || 0,
        hasVariants: formData.hasVariants ?? true,
        isDeliveryPoint: formData.isDeliveryPoint ?? true,
        isActive: formData.isActive ?? true,
        showInDashboard: formData.showInDashboard ?? true,
      };
      await outletsApi.update(outletId, updateData);
      toast.success('Outlet updated successfully');
      router.push('/showroom');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update outlet');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p style={{ color: 'var(--muted-foreground)' }}>Loading showroom...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Edit Showroom</h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Update showroom information
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Showroom Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Showroom Code"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., DAL, RAG"
                fullWidth
                required
              />
              <Input
                label="Showroom Name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full showroom name"
                fullWidth
                required
              />
            </div>

            <Input
              label="Address"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Full address"
              fullWidth
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Phone Number"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="011-2345678"
                fullWidth
              />
              <div className="flex flex-col">
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                  Contact Person
                </label>
                {loadingManagers ? (
                  <div className="flex items-center justify-center py-2 px-3 rounded-lg" style={{ border: '1px solid var(--input)', minHeight: '42px' }}>
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
                  </div>
                ) : (
                  <select
                    value={formData.contactPerson || ''}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{ 
                      border: '1px solid var(--input)',
                      backgroundColor: 'var(--background)',
                      color: 'var(--foreground)'
                    }}
                  >
                    <option value="">Select a manager</option>
                    {managers.map((manager) => (
                      <option key={manager.id} value={manager.fullName}>
                        {manager.fullName} ({manager.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Opening Time"
                type="time"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
                fullWidth
                required
              />
              <Input
                label="Closing Time"
                type="time"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                fullWidth
                required
              />
              <Input
                label="Display Order"
                type="number"
                value={formData.displayOrder?.toString() || '0'}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                placeholder="0"
                fullWidth
              />
            </div>

            <div className="pt-2 space-y-3">
              <Toggle
                checked={formData.isActive ?? true}
                onChange={(checked) => setFormData({ ...formData, isActive: checked })}
                label="Active Status"
              />
              <div className="flex items-center gap-2 mt-2">
                <LayoutDashboard className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  Show in Dashboard
                </span>
              </div>
              <Toggle
                checked={formData.showInDashboard ?? true}
                onChange={(checked) => setFormData({ ...formData, showInDashboard: checked })}
                label='If enabled, this showroom appears in the "Today Top Deliveries" dashboard widget'
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting}
              >
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
