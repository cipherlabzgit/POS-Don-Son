'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { InlineDetailPanel } from '@/components/ui/inline-detail-panel';
import Select from '@/components/ui/select';
import { Plus, Eye, EyeOff, Loader2, Check, ListOrdered } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { deliveryPlansApi, type DeliveryPlan } from '@/lib/api/delivery-plans';
import { toast } from 'sonner';
import { formatSlDate, formatSlDateTime } from '@/lib/sri-lanka-time';

export default function DeliveryPlanPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<DeliveryPlan[]>([]);
  
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedPlan, setSelectedPlan] = useState<DeliveryPlan | null>(null);

  useEffect(() => {
    loadPlans();
  }, [currentPage, pageSize, statusFilter]);

  const loadPlans = async () => {
    try {
      setIsLoading(true);
      const response = await deliveryPlansApi.getAll(
        currentPage,
        pageSize,
        undefined,
        undefined,
        statusFilter || undefined
      );
      setPlans(response.deliveryPlans as any);
      setTotalCount(response.totalCount);
    } catch (error) {
      console.error('Error loading plans:', error);
      toast.error('Failed to load delivery plans');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitPlan = async (planId: string) => {
    try {
      await deliveryPlansApi.submit(planId);
      toast.success('Plan submitted successfully!');
      await loadPlans();
    } catch (error) {
      console.error('Error submitting plan:', error);
      toast.error('Failed to submit plan');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered': return <Badge variant="success" size="sm">Delivered</Badge>;
      case 'Completed': return <Badge variant="success" size="sm">Completed</Badge>;
      case 'InProduction': return <Badge variant="warning" size="sm">In Production</Badge>;
      default: return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  const getDayTypeBadge = (dayTypeName: string) => {
    const colors: { [key: string]: string } = {
      'Weekday': '#3B82F6',
      'Saturday': '#F59E0B',
      'Sunday': '#10B981',
      'Holiday': '#DC2626',
    };
    const color = colors[dayTypeName] || '#6B7280';
    return <span className="inline-flex items-center font-medium rounded-full px-2.5 py-1 text-xs text-white" style={{ backgroundColor: color }}>{dayTypeName}</span>;
  };

  const columns = [
    { 
      key: 'planDate', 
      label: 'Plan Date', 
      render: (item: any) => <span className="font-medium">{formatSlDate(item.planDate)}</span> 
    },
    { 
      key: 'planNo', 
      label: 'Plan No', 
      render: (item: any) => <span className="font-mono font-semibold" style={{ color: 'var(--brand-primary)' }}>{item.planNo}</span> 
    },
    { 
      key: 'dayType', 
      label: 'Day Type', 
      render: (item: any) => getDayTypeBadge(item.dayTypeName) 
    },
    { 
      key: 'status', 
      label: 'Status', 
      render: (item: any) => getStatusBadge(item.status) 
    },
    { 
      key: 'totalItems', 
      label: 'Items', 
      render: (item: any) => <span className="font-medium">{item.totalItems || 0}</span> 
    },
    { 
      key: 'totalQuantity', 
      label: 'Total Qty', 
      render: (item: any) => <span className="font-medium">{item.totalQuantity || 0}</span> 
    },
    { 
      key: 'actions', 
      label: 'Actions', 
      render: (item: any) => (
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => router.push(`/dms/delivery-plan/edit/${item.id}`)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-opacity hover:opacity-90"
            style={{
              color: 'var(--brand-primary)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--card)',
            }}
            title="Open full plan: all outlets, products, and quantities"
          >
            <ListOrdered className="w-3.5 h-3.5 shrink-0" aria-hidden />
            Full details
          </button>
          <button 
            type="button" 
            onClick={() => {
              if (selectedPlan?.id === item.id) setSelectedPlan(null);
              else setSelectedPlan(item);
            }} 
            className="p-1.5 rounded transition-colors" 
            style={{ color: 'var(--muted-foreground)' }} 
            title={selectedPlan?.id === item.id ? 'Hide summary' : 'Summary in panel'}
          >
            {selectedPlan?.id === item.id ? (
              <Eye className="w-4 h-4" aria-hidden />
            ) : (
              <EyeOff className="w-4 h-4" aria-hidden />
            )}
          </button>
          {item.status === 'Pending' && (
            <button 
              type="button" 
              onClick={() => handleSubmitPlan(item.id)} 
              className="p-1.5 rounded transition-colors" 
              style={{ color: 'var(--success)' }} 
              title="Submit plan"
            >
              <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    },
  ];

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand-primary)' }} />
          <p style={{ color: 'var(--muted-foreground)' }}>Loading delivery plans...</p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Delivery Plan Creation</h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Create and manage delivery plans ({totalCount} plans). Open <strong>Full details</strong> to review every
            outlet × product line before delivery.
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => router.push('/dms/delivery-plan/add')}>
          <Plus className="w-4 h-4 mr-2" />
          Create Plan
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Delivery Plans</CardTitle>
            <div className="flex items-center space-x-3">
              <Select 
                value={statusFilter} 
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} 
                options={[
                  { value: '', label: 'All Status' }, 
                  { value: 'Pending', label: 'Pending' }, 
                  { value: 'InProduction', label: 'In Production' }, 
                  { value: 'Completed', label: 'Completed' }, 
                  { value: 'Delivered', label: 'Delivered' }
                ]} 
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable 
            data={plans} 
            columns={columns} 
            currentPage={currentPage} 
            totalPages={totalPages} 
            pageSize={pageSize} 
            onPageChange={setCurrentPage} 
            onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }} 
            expandedRowKey={selectedPlan?.id ?? null}
            getRowKey={(row) => row.id}
            renderExpandedRow={(plan) => (
              <InlineDetailPanel
                title="Delivery Plan Details"
                open
                onClose={() => setSelectedPlan(null)}
                footer={
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => router.push(`/dms/delivery-plan/edit/${plan.id}`)}
                    >
                      <ListOrdered className="w-4 h-4 mr-2" />
                      Full details &amp; line items
                    </Button>
                    <Button variant="ghost" onClick={() => setSelectedPlan(null)}>
                      Close
                    </Button>
                  </div>
                }
              >
                <div className="space-y-4">
                  <p className="text-xs leading-relaxed p-2 rounded-md" style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                    This is a quick summary. Use <strong>Full details &amp; line items</strong> below to verify every
                    outlet and product line before delivery.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Plan No</p>
                      <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{plan.planNo}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Status</p>
                      {getStatusBadge(plan.status)}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Plan Date</p>
                    <p className="text-sm" style={{ color: 'var(--foreground)' }}>{formatSlDate(plan.planDate)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Day Type</p>
                      {getDayTypeBadge(plan.dayTypeName)}
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Freezer Stock</p>
                      <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{plan.useFreezerStock ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                  {plan.notes && (
                    <div>
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Notes</p>
                      <p className="text-sm" style={{ color: 'var(--foreground)' }}>{plan.notes}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Created</p>
                    <p className="text-sm" style={{ color: 'var(--foreground)' }}>{formatSlDateTime(plan.createdAt)}</p>
                  </div>
                </div>
              </InlineDetailPanel>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
