'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Modal, ModalFooter } from '@/components/ui/modal';
import Input from '@/components/ui/input';
import { CheckCircle, XCircle, Search, Check, X, Loader2, Clock, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  operationApprovalsApi,
  type OperationApprovalItem,
  type OperationApprovalsSummary,
} from '@/lib/api/operation-approvals';
import { deliveriesApi, type Delivery } from '@/lib/api/deliveries';
import { transfersApi, type Transfer } from '@/lib/api/transfers';
import { disposalsApi, type Disposal } from '@/lib/api/disposals';
import { cancellationsApi, type Cancellation } from '@/lib/api/cancellations';
import { labelPrintingApi } from '@/lib/api/label-printing';
import { stockBfApi } from '@/lib/api/stock-bf';
import { deliveryReturnsApi } from '@/lib/api/delivery-returns';
import { posSalesApi, type PosSale } from '@/lib/api/pos-sales';
import { dailyProductionsApi, type DailyProduction } from '@/lib/api/daily-productions';
import { productionCancelsApi } from '@/lib/api/production-cancels';
import { stockAdjustmentsApi } from '@/lib/api/stock-adjustments';
import { productionPlansApi } from '@/lib/api/production-plans';
import { immediateOrdersApi, type ImmediateOrder } from '@/lib/api/immediate-orders';
import { approvalsApi, type ApproveApprovalDto, type RejectApprovalDto } from '@/lib/api/approvals';
import { usePermissions } from '@/hooks/usePermissions';
import { ProtectedPage } from '@/components/auth';
import toast from 'react-hot-toast';
import { formatSlDate, formatSlDateTime } from '@/lib/sri-lanka-time';

// ─── Section / subsection config ──────────────────────────────────────────────

type SubsectionKey =
  | 'deliveries' | 'transfers' | 'disposals' | 'cancellations' | 'labelPrintRequests'
  | 'stockBFs' | 'deliveryReturns' | 'posSales' | 'showroomLabelRequests'
  | 'dailyProductions' | 'productionCancels' | 'stockAdjustments' | 'dailyProductionPlans'
  | 'immediateOrders' | 'adminApprovals';

interface Subsection {
  key: SubsectionKey;
  label: string;
  approvalType: string;
}

interface Section {
  id: string;
  label: string;
  subsections: Subsection[];
}

const SECTIONS: Section[] = [
  {
    id: 'operation',
    label: 'Operation',
    subsections: [
      { key: 'deliveries',           label: 'Deliveries',           approvalType: 'Delivery' },
      { key: 'transfers',            label: 'Transfers',            approvalType: 'Transfer' },
      { key: 'disposals',            label: 'Disposals',            approvalType: 'Disposal' },
      { key: 'cancellations',        label: 'Cancellations',        approvalType: 'Cancellation' },
      { key: 'labelPrintRequests',   label: 'Label Print Requests', approvalType: 'Label Print' },
      { key: 'stockBFs',             label: 'Stock BF',             approvalType: 'Stock BF' },
      { key: 'deliveryReturns',      label: 'Delivery Returns',     approvalType: 'Delivery Return' },
      { key: 'posSales',             label: 'POS Sales',            approvalType: 'POS Sale' },
      { key: 'showroomLabelRequests',label: 'Showroom Labels',      approvalType: 'Showroom Label' },
    ],
  },
  {
    id: 'production',
    label: 'Production',
    subsections: [
      { key: 'dailyProductions',    label: 'Daily Production',  approvalType: 'Daily Production' },
      { key: 'productionCancels',   label: 'Production Cancel', approvalType: 'Production Cancel' },
      { key: 'stockAdjustments',    label: 'Stock Adjustment',  approvalType: 'Stock Adjustment' },
      { key: 'dailyProductionPlans',label: 'Production Plan',   approvalType: 'Production Plan' },
    ],
  },
  {
    id: 'dms',
    label: 'DMS',
    subsections: [
      { key: 'immediateOrders', label: 'Immediate Orders', approvalType: 'Immediate Order' },
    ],
  },
  {
    id: 'administrator',
    label: 'Administrator',
    subsections: [
      { key: 'adminApprovals', label: 'Admin / Generic', approvalType: 'Generic' },
    ],
  },
];

const APPROVAL_TYPE_PERMISSIONS: Record<string, { approve: string; reject?: string }> = {
  Delivery:          { approve: 'operation:delivery:approve',        reject: 'operation:delivery:reject' },
  Transfer:          { approve: 'operation:transfer:approve',        reject: 'operation:transfer:reject' },
  Disposal:          { approve: 'operation:disposal:approve',        reject: 'operation:disposal:reject' },
  Cancellation:      { approve: 'operation:cancellation:approve',    reject: 'operation:cancellation:reject' },
  'Label Print':     { approve: 'operation:label-printing:approve',  reject: 'operation:label-printing:reject' },
  'Stock BF':        { approve: 'operation:stock-bf:approve',        reject: 'operation:stock-bf:reject' },
  'Delivery Return': { approve: 'operation:delivery-return:approve', reject: 'operation:delivery-return:reject' },
  'POS Sale':        { approve: 'pos:sale:approve',                  reject: 'pos:sale:reject' },
  'Showroom Label':  { approve: 'operation:approvals:approve',       reject: 'operation:approvals:approve' },
  'Daily Production':  { approve: 'production:daily:approve',           reject: 'production:daily:reject' },
  'Production Cancel': { approve: 'production:cancel:approve',          reject: 'production:cancel:reject' },
  'Stock Adjustment':  { approve: 'production:stock-adjustment:approve',reject: 'production:stock-adjustment:reject' },
  'Production Plan':   { approve: 'production:plan:approve' },
  'Immediate Order':   { approve: 'order:approve',                      reject: 'order:reject' },
  Generic:             { approve: 'approval:approve',                    reject: 'approval:reject' },
};

// Helper – sum counts for a section
function sectionCount(summary: OperationApprovalsSummary | null, section: Section) {
  if (!summary) return 0;
  return section.subsections.reduce((acc, s) => acc + (summary[s.key]?.length ?? 0), 0);
}

// Helper – all items across every section
function allItems(summary: OperationApprovalsSummary | null): OperationApprovalItem[] {
  if (!summary) return [];
  return SECTIONS.flatMap(sec => sec.subsections.flatMap(s => summary[s.key] ?? []));
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ApprovalsPage() {
  const { can } = usePermissions();
  const [summary, setSummary] = useState<OperationApprovalsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Section / subsection selection. null sectionId = "All"
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedSubsectionKey, setSelectedSubsectionKey] = useState<SubsectionKey | null>(null);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Expanded detail row
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [selectedApproval, setSelectedApproval] = useState<OperationApprovalItem | null>(null);
  const [detailsData, setDetailsData] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Submitting
  const [submittingIds, setSubmittingIds] = useState<Set<string>>(new Set());

  // POS reject modal
  const [posRejectOpen, setPosRejectOpen] = useState(false);
  const [posRejectSaleId, setPosRejectSaleId] = useState<string | null>(null);
  const [posRejectReason, setPosRejectReason] = useState('');

  // Admin-queue approve/reject modals
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [modalApproval, setModalApproval] = useState<OperationApprovalItem | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setIsLoading(true);
      const data = await operationApprovalsApi.getPending();
      setSummary(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load approvals');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Derived data ──────────────────────────────────────────────────────────

  const currentSection = SECTIONS.find(s => s.id === selectedSectionId) ?? null;

  // Items shown in the table
  const tableItems = (() => {
    let items: OperationApprovalItem[];
    if (!selectedSectionId) {
      items = allItems(summary);
    } else if (!selectedSubsectionKey) {
      // whole section
      items = currentSection
        ? currentSection.subsections.flatMap(s => summary?.[s.key] ?? [])
        : [];
    } else {
      items = summary?.[selectedSubsectionKey] ?? [];
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      items = items.filter(
        i =>
          i.referenceNo?.toLowerCase().includes(q) ||
          i.outletName?.toLowerCase().includes(q) ||
          i.requestedByName?.toLowerCase().includes(q) ||
          i.approvalType?.toLowerCase().includes(q),
      );
    }

    return items;
  })();

  const totalPending = summary
    ? SECTIONS.flatMap(s => s.subsections).reduce((acc, s) => acc + (summary[s.key]?.length ?? 0), 0)
    : 0;

  // ── Navigation helpers ────────────────────────────────────────────────────

  const selectSection = (sectionId: string | null) => {
    setSelectedSectionId(sectionId);
    setSelectedSubsectionKey(null);
    setExpandedItemId(null);
    setSelectedApproval(null);
    setDetailsData(null);
    setSearchTerm('');
  };

  const selectSubsection = (key: SubsectionKey) => {
    setSelectedSubsectionKey(key);
    setExpandedItemId(null);
    setSelectedApproval(null);
    setDetailsData(null);
  };

  // ── Detail row ────────────────────────────────────────────────────────────

  const handleViewDetails = async (item: OperationApprovalItem) => {
    if (expandedItemId === item.id) {
      setExpandedItemId(null);
      setSelectedApproval(null);
      setDetailsData(null);
      return;
    }
    try {
      setIsLoadingDetails(true);
      setExpandedItemId(item.id);
      setSelectedApproval(item);
      setDetailsData(null);
      let data: any;
      switch (item.approvalType) {
        case 'Delivery':          data = await deliveriesApi.getById(item.id); break;
        case 'Transfer':          data = await transfersApi.getById(item.id); break;
        case 'Disposal':          data = await disposalsApi.getById(item.id); break;
        case 'Cancellation':      data = await cancellationsApi.getById(item.id); break;
        case 'Label Print':       data = await labelPrintingApi.getById(item.id); break;
        case 'Stock BF':
          // Fetch all items in the group by BFNo (referenceNo contains BFNo)
          const stockBFItems = await stockBfApi.getAllByBFNo(item.referenceNo);
          data = { items: stockBFItems };
          break;
        case 'Delivery Return':   data = await deliveryReturnsApi.getById(item.id); break;
        case 'POS Sale':          data = await posSalesApi.getById(item.id); break;
        case 'Immediate Order':   data = await immediateOrdersApi.getById(item.id); break;
        case 'Daily Production':  data = await dailyProductionsApi.getById(item.id); break;
        case 'Production Cancel': data = await productionCancelsApi.getById(item.id); break;
        case 'Stock Adjustment':  data = await stockAdjustmentsApi.getById(item.id); break;
        case 'Production Plan':   data = await productionPlansApi.getById(item.id); break;
        case 'Generic':
        case 'Admin':             data = await approvalsApi.getById(item.id); break;
        case 'Showroom Label':
          setDetailsData(item);
          setIsLoadingDetails(false);
          return;
        default:
          toast.error('Details view not available for this approval type');
          setExpandedItemId(null);
          setSelectedApproval(null);
          return;
      }
      setDetailsData(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load approval details');
      setExpandedItemId(null);
      setSelectedApproval(null);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // ── Approve / Reject ──────────────────────────────────────────────────────

  const handleApprove = async (type: string, id: string) => {
    try {
      setSubmittingIds(prev => new Set(prev).add(id));
      switch (type) {
        case 'Delivery':          await deliveriesApi.approve(id); break;
        case 'Transfer':          await transfersApi.approve(id); break;
        case 'Disposal':          await disposalsApi.approve(id); break;
        case 'Cancellation':      await cancellationsApi.approve(id); break;
        case 'Label Print':       await labelPrintingApi.approve(id); break;
        case 'Stock BF':          await stockBfApi.approve(id); break;
        case 'Delivery Return':   await deliveryReturnsApi.approve(id); break;
        case 'POS Sale':          await posSalesApi.approve(id); break;
        case 'Showroom Label':    await operationApprovalsApi.approveShowroomLabel(id); break;
        case 'Immediate Order':   await immediateOrdersApi.approve(id); break;
        case 'Daily Production':  await dailyProductionsApi.approve(id); break;
        case 'Production Cancel': await productionCancelsApi.approve(id); break;
        case 'Stock Adjustment':  await stockAdjustmentsApi.approve(id); break;
        case 'Production Plan':   await productionPlansApi.approve(id); break;
        case 'Generic':
        case 'Admin':
          // open modal for notes
          setModalApproval(selectedApproval);
          setShowApproveModal(true);
          return;
        default:
          throw new Error('Unknown approval type');
      }
      toast.success(`${type} approved successfully`);
      clearDetail();
      fetchAll();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to approve ${type.toLowerCase()}`);
    } finally {
      setSubmittingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  const submitAdminApprove = async () => {
    if (!modalApproval) return;
    try {
      setSubmittingIds(prev => new Set(prev).add(modalApproval.id));
      const dto: ApproveApprovalDto = { notes: approvalNotes };
      await approvalsApi.approve(modalApproval.id, dto);
      toast.success('Approval granted successfully');
      setShowApproveModal(false);
      setApprovalNotes('');
      setModalApproval(null);
      clearDetail();
      fetchAll();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve');
    } finally {
      setSubmittingIds(prev => { const n = new Set(prev); if (modalApproval) n.delete(modalApproval.id); return n; });
    }
  };

  const handleReject = async (type: string, id: string) => {
    if (type === 'Production Plan') {
      toast.error('Reject is not available for production plans.');
      return;
    }
    if (type === 'POS Sale') {
      setPosRejectSaleId(id);
      setPosRejectReason('');
      setPosRejectOpen(true);
      return;
    }
    if (type === 'Generic' || type === 'Admin') {
      setModalApproval(selectedApproval);
      setShowRejectModal(true);
      return;
    }
    if (!confirm(`Are you sure you want to reject this ${type.toLowerCase()}?`)) return;
    try {
      setSubmittingIds(prev => new Set(prev).add(id));
      switch (type) {
        case 'Delivery':          await deliveriesApi.reject(id); break;
        case 'Transfer':          await transfersApi.reject(id); break;
        case 'Disposal':          await disposalsApi.reject(id); break;
        case 'Cancellation':      await cancellationsApi.reject(id); break;
        case 'Label Print':       await labelPrintingApi.reject(id); break;
        case 'Stock BF':          await stockBfApi.reject(id); break;
        case 'Delivery Return':   await deliveryReturnsApi.reject(id); break;
        case 'Showroom Label':    await operationApprovalsApi.rejectShowroomLabel(id); break;
        case 'Immediate Order':   await immediateOrdersApi.reject(id, 'Rejected'); break;
        case 'Daily Production':  await dailyProductionsApi.reject(id); break;
        case 'Production Cancel': await productionCancelsApi.reject(id); break;
        case 'Stock Adjustment':  await stockAdjustmentsApi.reject(id); break;
        default:                  throw new Error('Unknown approval type');
      }
      toast.success(`${type} rejected`);
      clearDetail();
      fetchAll();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to reject ${type.toLowerCase()}`);
    } finally {
      setSubmittingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  const submitAdminReject = async () => {
    if (!modalApproval || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    try {
      setSubmittingIds(prev => new Set(prev).add(modalApproval.id));
      const dto: RejectApprovalDto = { rejectionReason, notes: approvalNotes };
      await approvalsApi.reject(modalApproval.id, dto);
      toast.success('Approval rejected');
      setShowRejectModal(false);
      setRejectionReason('');
      setApprovalNotes('');
      setModalApproval(null);
      clearDetail();
      fetchAll();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject');
    } finally {
      setSubmittingIds(prev => { const n = new Set(prev); if (modalApproval) n.delete(modalApproval.id); return n; });
    }
  };

  const submitPosReject = async () => {
    const id = posRejectSaleId;
    if (!id) return;
    try {
      setSubmittingIds(prev => new Set(prev).add(id));
      await posSalesApi.reject(id, posRejectReason.trim() || undefined);
      toast.success('POS Sale rejected');
      setPosRejectOpen(false);
      setPosRejectSaleId(null);
      setPosRejectReason('');
      clearDetail();
      fetchAll();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject POS sale');
    } finally {
      setSubmittingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  const clearDetail = () => {
    setExpandedItemId(null);
    setSelectedApproval(null);
    setDetailsData(null);
  };

  // ── Table columns ─────────────────────────────────────────────────────────

  const columns = [
    {
      key: 'approvalType',
      label: 'Type',
      render: (item: OperationApprovalItem) => (
        <Badge variant="neutral" size="sm">{item.approvalType}</Badge>
      ),
    },
    {
      key: 'referenceNo',
      label: 'Reference',
      render: (item: OperationApprovalItem) => {
        const isExpanded = expandedItemId === item.id;
        return (
          <button
            onClick={() => handleViewDetails(item)}
            className="font-mono font-semibold hover:underline cursor-pointer text-left flex items-center gap-2 px-2 py-1 rounded transition-all"
            style={{
              color: isExpanded ? '#dc2626' : '#C8102E',
              backgroundColor: isExpanded ? '#fee2e2' : 'transparent',
            }}
          >
            <span style={{ color: isExpanded ? '#dc2626' : 'transparent' }}>▼</span>
            {item.referenceNo}
          </button>
        );
      },
    },
    {
      key: 'requestDate',
      label: 'Date',
      render: (item: OperationApprovalItem) => (
        <span className="text-sm">{formatSlDate(item.requestDate)}</span>
      ),
    },
    {
      key: 'outletName',
      label: 'Outlet / Details',
      render: (item: OperationApprovalItem) => (
        <div>
          <span className="font-medium">{item.outletName || '-'}</span>
          {item.description && (
            <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{item.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'requestedBy',
      label: 'Requested By',
      render: (item: OperationApprovalItem) => (
        <span className="text-sm">{item.requestedByName || '-'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item: OperationApprovalItem) => (
        <Badge variant="warning" size="sm">
          <Clock className="w-3 h-3 mr-1" />
          {item.status}
        </Badge>
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <ProtectedPage
      permission={['approval:view', 'operation:approvals:view', 'production:approvals:view']}
      mode="any"
      deniedMessage="You need Approval (Administrator), Operation Approvals, or Production Approvals view permission to open the unified approval queue."
    >
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            <CheckCircle className="w-8 h-8 inline-block mr-3" style={{ color: '#C8102E' }} />
            Approvals
          </h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Unified queue for Operation, Production, DMS, and Administrator — {totalPending} pending
          </p>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-muted rounded-xl w-fit">
        {/* All tab */}
        <button
          onClick={() => selectSection(null)}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
            selectedSectionId === null
              ? 'bg-white shadow-md transform scale-105'
              : 'text-muted-foreground hover:bg-white/50'
          }`}
          style={{ color: selectedSectionId === null ? '#C8102E' : undefined }}
        >
          All
          {totalPending > 0 && (
            <span
              className="px-2 py-0.5 rounded-full text-[10px]"
              style={{
                backgroundColor: selectedSectionId === null ? '#C8102E' : undefined,
                color: selectedSectionId === null ? 'white' : undefined,
                ...(selectedSectionId !== null ? { backgroundColor: 'rgba(0,0,0,0.1)' } : {}),
              }}
            >
              {totalPending}
            </span>
          )}
        </button>

        {SECTIONS.map(section => {
          const isActive = selectedSectionId === section.id;
          const count = sectionCount(summary, section);
          return (
            <button
              key={section.id}
              onClick={() => selectSection(section.id)}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
                isActive
                  ? 'bg-white shadow-md transform scale-105'
                  : 'text-muted-foreground hover:bg-white/50'
              }`}
              style={{ color: isActive ? '#C8102E' : undefined }}
            >
              {section.label}
              {count > 0 && (
                <span
                  className="px-2 py-0.5 rounded-full text-[10px]"
                  style={{
                    backgroundColor: isActive ? '#C8102E' : 'rgba(0,0,0,0.1)',
                    color: isActive ? 'white' : undefined,
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Subsection selector (visible when a section is selected) */}
      {currentSection && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedSubsectionKey(null)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              selectedSubsectionKey === null
                ? 'text-white border-transparent'
                : 'border-current text-current hover:opacity-80'
            }`}
            style={{
              backgroundColor: selectedSubsectionKey === null ? '#C8102E' : 'transparent',
              borderColor: selectedSubsectionKey === null ? '#C8102E' : undefined,
              color: selectedSubsectionKey === null ? 'white' : '#C8102E',
            }}
          >
            All {currentSection.label} ({sectionCount(summary, currentSection)})
          </button>
          {currentSection.subsections.map(sub => {
            const count = summary?.[sub.key]?.length ?? 0;
            const isActive = selectedSubsectionKey === sub.key;
            return (
              <button
                key={sub.key}
                onClick={() => selectSubsection(sub.key)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  isActive ? 'text-white border-transparent' : 'hover:opacity-80'
                }`}
                style={{
                  backgroundColor: isActive ? '#C8102E' : 'transparent',
                  borderColor: '#C8102E',
                  color: isActive ? 'white' : '#C8102E',
                }}
              >
                {sub.label} {count > 0 ? `(${count})` : '(0)'}
              </button>
            );
          })}
        </div>
      )}

      {/* Main card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CardTitle>
                  {selectedSectionId === null
                    ? 'All Approval Requests'
                    : selectedSubsectionKey
                      ? `${currentSection?.subsections.find(s => s.key === selectedSubsectionKey)?.label} Requests`
                      : `${currentSection?.label} Requests`}
                </CardTitle>
                {tableItems.length > 0 && !searchTerm && (
                  <Badge variant="warning" size="sm">
                    <Clock className="w-3 h-3 mr-1" />
                    {tableItems.length} Pending
                  </Badge>
                )}
              </div>
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                <input
                  type="text"
                  placeholder="Search approvals..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  autoComplete="off"
                  className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-lg text-sm"
                  style={{ border: '1px solid var(--input)' }}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#C8102E' }} />
            </div>
          ) : tableItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="w-16 h-16 mb-4" style={{ color: 'var(--muted-foreground)' }} />
              <p className="text-lg font-medium" style={{ color: 'var(--foreground)' }}>
                {searchTerm ? 'No results found' : 'No pending approvals'}
              </p>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {searchTerm ? 'Try a different search term' : 'All requests have been processed'}
              </p>
            </div>
          ) : (
            <DataTable
              data={tableItems}
              columns={columns}
              currentPage={1}
              totalPages={1}
              pageSize={tableItems.length}
              onPageChange={() => {}}
              onPageSizeChange={() => {}}
              expandedRowKey={expandedItemId}
              getRowKey={row => row.id}
              renderExpandedRow={item =>
                expandedItemId === item.id ? (
                  <div
                    className="rounded-xl p-1 sm:p-1.5"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--foreground) 8%, var(--border))',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)',
                    }}
                  >
                    <Card className="rounded-[10px] border-0 shadow-md" padding="md">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>
                          {selectedApproval
                            ? `${selectedApproval.approvalType} Details — ${selectedApproval.referenceNo}`
                            : 'Details'}
                        </CardTitle>
                        <button
                          type="button"
                          onClick={clearDetail}
                          className="text-sm px-3 py-1 rounded hover:bg-gray-100"
                          style={{ color: 'var(--muted-foreground)' }}
                        >
                          Close
                        </button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isLoadingDetails ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#C8102E' }} />
                        </div>
                      ) : detailsData && selectedApproval ? (
                        <>
                          <div className="space-y-6">
                            {selectedApproval.approvalType === 'Delivery' && (
                              <DeliveryDetailsView delivery={detailsData as Delivery} />
                            )}
                            {selectedApproval.approvalType === 'Transfer' && (
                              <TransferDetailsView transfer={detailsData as Transfer} />
                            )}
                            {selectedApproval.approvalType === 'Disposal' && (
                              <DisposalDetailsView disposal={detailsData as Disposal} />
                            )}
                            {selectedApproval.approvalType === 'Cancellation' && (
                              <CancellationDetailsView cancellation={detailsData as Cancellation} />
                            )}
                            {(selectedApproval.approvalType === 'Label Print' ||
                              selectedApproval.approvalType === 'Stock BF' ||
                              selectedApproval.approvalType === 'Delivery Return' ||
                              selectedApproval.approvalType === 'Production Cancel' ||
                              selectedApproval.approvalType === 'Stock Adjustment' ||
                              selectedApproval.approvalType === 'Production Plan') && (
                              <GenericDetailsView item={selectedApproval} details={detailsData} />
                            )}
                            {selectedApproval.approvalType === 'POS Sale' && (
                              <PosSaleDetailsView sale={detailsData as PosSale} />
                            )}
                            {selectedApproval.approvalType === 'Showroom Label' && (
                              <ShowroomLabelDetailsView item={selectedApproval} />
                            )}
                            {selectedApproval.approvalType === 'Immediate Order' && (
                              <ImmediateOrderDetailsView order={detailsData as ImmediateOrder} />
                            )}
                            {selectedApproval.approvalType === 'Daily Production' && (
                              <ProductionDetailsView production={detailsData as DailyProduction} />
                            )}
                            {(selectedApproval.approvalType === 'Generic' ||
                              selectedApproval.approvalType === 'Admin') && (
                              <AdminApprovalDetailsView approval={detailsData} />
                            )}
                          </div>

                          {/* Approve / Reject buttons */}
                          {(() => {
                            const perms = APPROVAL_TYPE_PERMISSIONS[selectedApproval.approvalType];
                            const canApprove = perms ? can(perms.approve) : false;
                            const canReject  = perms?.reject ? can(perms.reject) : false;

                            if (!canApprove && !canReject) {
                              return (
                                <div className="flex items-center justify-center gap-3 pt-6 mt-6 border-t">
                                  <div className="flex items-center gap-2 px-4 py-3 rounded-lg" style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}>
                                    <XCircle className="w-5 h-5" style={{ color: '#b45309' }} />
                                    <p className="text-sm font-semibold" style={{ color: '#b45309' }}>
                                      You do not have permission to approve or reject this {selectedApproval.approvalType.toLowerCase()}
                                    </p>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div className="flex justify-end gap-3 pt-6 mt-6 border-t">
                                {canReject && (
                                  <Button
                                    variant="danger"
                                    onClick={() => void handleReject(selectedApproval.approvalType, selectedApproval.id)}
                                    disabled={submittingIds.has(selectedApproval.id)}
                                  >
                                    {submittingIds.has(selectedApproval.id)
                                      ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      : <XCircle className="w-4 h-4 mr-2" />}
                                    Reject
                                  </Button>
                                )}
                                {canApprove && (
                                  <button
                                    type="button"
                                    onClick={() => void handleApprove(selectedApproval.approvalType, selectedApproval.id)}
                                    disabled={submittingIds.has(selectedApproval.id)}
                                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white hover:opacity-90"
                                    style={{ backgroundColor: '#16a34a' }}
                                  >
                                    {submittingIds.has(selectedApproval.id)
                                      ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      : <CheckCircle className="w-4 h-4 mr-2" />}
                                    Approve
                                  </button>
                                )}
                              </div>
                            );
                          })()}
                        </>
                      ) : null}
                    </CardContent>
                  </Card>
                  </div>
                ) : null
              }
            />
          )}
        </CardContent>
      </Card>

      {/* POS reject modal */}
      <Modal
        isOpen={posRejectOpen}
        onClose={() => {
          if (posRejectSaleId && submittingIds.has(posRejectSaleId)) return;
          setPosRejectOpen(false);
          setPosRejectSaleId(null);
          setPosRejectReason('');
        }}
        title="Reject POS Sale"
        size="sm"
      >
        <p className="text-sm mb-2" style={{ color: 'var(--muted-foreground)' }}>
          Optional note stored with the sale for audit and showroom feedback.
        </p>
        <textarea
          value={posRejectReason}
          onChange={e => setPosRejectReason(e.target.value)}
          className="w-full min-h-[100px] rounded-md border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
          placeholder="Reason for rejection"
          maxLength={500}
        />
        <ModalFooter>
          <Button variant="secondary" type="button"
            disabled={Boolean(posRejectSaleId && submittingIds.has(posRejectSaleId))}
            onClick={() => { setPosRejectOpen(false); setPosRejectSaleId(null); setPosRejectReason(''); }}>
            Cancel
          </Button>
          <Button variant="danger" type="button"
            disabled={!posRejectSaleId || Boolean(posRejectSaleId && submittingIds.has(posRejectSaleId))}
            onClick={() => void submitPosReject()}>
            Reject sale
          </Button>
        </ModalFooter>
      </Modal>

      {/* Admin approve modal */}
      <Modal
        isOpen={showApproveModal}
        onClose={() => { setShowApproveModal(false); setModalApproval(null); setApprovalNotes(''); }}
        title="Approve Request"
        size="md"
      >
        {modalApproval && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                Type: {modalApproval.approvalType}
              </p>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Reference: {modalApproval.referenceNo}
              </p>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Requested by: {modalApproval.requestedByName}
              </p>
            </div>
            <Input label="Notes (Optional)" value={approvalNotes}
              onChange={e => setApprovalNotes(e.target.value)}
              placeholder="Add any notes..." fullWidth />
          </div>
        )}
        <ModalFooter>
          <Button variant="ghost" onClick={() => { setShowApproveModal(false); setModalApproval(null); setApprovalNotes(''); }}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => void submitAdminApprove()}>
            <Check className="w-4 h-4 mr-2" />
            Approve
          </Button>
        </ModalFooter>
      </Modal>

      {/* Admin reject modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => { setShowRejectModal(false); setModalApproval(null); setRejectionReason(''); setApprovalNotes(''); }}
        title="Reject Request"
        size="md"
      >
        {modalApproval && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                Type: {modalApproval.approvalType}
              </p>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Reference: {modalApproval.referenceNo}
              </p>
            </div>
            <Input label="Rejection Reason" value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="Please provide a reason..." fullWidth required />
            <Input label="Additional Notes (Optional)" value={approvalNotes}
              onChange={e => setApprovalNotes(e.target.value)}
              placeholder="Add any notes..." fullWidth />
          </div>
        )}
        <ModalFooter>
          <Button variant="ghost" onClick={() => { setShowRejectModal(false); setModalApproval(null); setRejectionReason(''); setApprovalNotes(''); }}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => void submitAdminReject()}>
            <X className="w-4 h-4 mr-2" />
            Reject
          </Button>
        </ModalFooter>
      </Modal>
    </div>
    </ProtectedPage>
  );
}

// ─── Detail sub-components ─────────────────────────────────────────────────────

/** Shared shell for approval detail bodies (matches transfer-style panel). */
function DetailPanel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`space-y-6 rounded-xl border p-4 sm:p-5 shadow-sm ${className}`}
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}
    >
      {children}
    </div>
  );
}

/** Grouped fields on a slightly tinted surface so they read as one block. */
function DetailSectionTint({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
        {title}
      </p>
      {subtitle ? (
        <p className="mb-3 text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
          {subtitle}
        </p>
      ) : null}
      <div
        className="rounded-lg border p-4 sm:p-5"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'color-mix(in srgb, var(--foreground) 4%, var(--card))',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function InfoGrid({ children, plain }: { children: React.ReactNode; plain?: boolean }) {
  return (
    <div
      className={
        plain
          ? 'grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-x-6 lg:gap-x-8'
          : 'grid grid-cols-1 gap-4 rounded-lg p-4 md:grid-cols-3 md:gap-x-6 lg:gap-x-8'
      }
      style={plain ? undefined : { backgroundColor: 'var(--muted)' }}
    >
      {children}
    </div>
  );
}

function InfoField({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
      <p className="text-sm font-semibold" style={{ color: highlight ? '#C8102E' : 'var(--foreground)' }}>{value}</p>
    </div>
  );
}

function ItemsTable({ headers, rows }: { headers: string[]; rows: (string | number | React.ReactNode)[][] }) {
  return (
    <div
      className="w-full max-w-5xl overflow-x-auto rounded-lg border"
      style={{ borderColor: 'var(--border)' }}
    >
      <table className="w-full border-collapse text-sm">
        <thead style={{ backgroundColor: 'var(--muted)' }}>
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className={`px-4 py-3 text-left text-xs font-semibold ${i > 0 ? 'whitespace-nowrap text-right' : ''}`}
                style={{
                  color: 'var(--foreground)',
                  ...(i > 0 ? { width: '1%', whiteSpace: 'nowrap' as const } : {}),
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-t" style={{ borderColor: 'var(--border)' }}>
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={`align-top px-4 py-3 text-sm leading-relaxed ${ci > 0 ? 'whitespace-nowrap text-right font-medium' : 'min-w-[12rem]'}`}
                  style={{
                    color: 'var(--foreground)',
                    ...(ci > 0 ? { width: '1%', whiteSpace: 'nowrap' as const } : {}),
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DeliveryDetailsView({ delivery }: { delivery: Delivery }) {
  return (
    <DetailPanel>
      <div className="space-y-6">
        <DetailSectionTint title="Delivery overview">
          <InfoGrid plain>
            <InfoField label="Delivery No" value={delivery.deliveryNo} highlight />
            <InfoField label="Date" value={formatSlDate(delivery.deliveryDate)} />
            <InfoField label="Showroom" value={delivery.outletName || delivery.outlet?.name || '-'} />
          </InfoGrid>
        </DetailSectionTint>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-x-6">
          <InfoField label="Total Items" value={delivery.totalItems || 0} />
          <InfoField label="Total Value" value={`Rs. ${(delivery.totalValue || 0).toLocaleString()}`} highlight />
        </div>
        <InfoField label="Requested By" value={`${delivery.createdByName} • ${formatSlDateTime(delivery.createdAt)}`} />
        {delivery.notes && <InfoField label="Notes" value={delivery.notes} />}
        {delivery.items?.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
              Delivery items
            </p>
            <ItemsTable
              headers={['Product', 'Qty', 'Unit Price', 'Total']}
              rows={delivery.items.map((item: any) => [
                <div key={item.id}>
                  <p className="font-medium">{item.productName || item.product?.name || 'Unknown'}</p>
                  {item.product?.code && <p className="text-xs text-muted-foreground">{item.product.code}</p>}
                </div>,
                Number(item.quantity).toLocaleString(),
                `Rs. ${Number(item.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                `Rs. ${Number(item.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              ])}
            />
          </div>
        )}
      </div>
    </DetailPanel>
  );
}

function transferItemProductName(item: Record<string, unknown>): string {
  return (
    (item.productName as string) ||
    (item.ProductName as string) ||
    (item.product as { name?: string } | undefined)?.name ||
    (item.Product as { Name?: string } | undefined)?.Name ||
    '—'
  );
}

function transferItemProductCode(item: Record<string, unknown>): string {
  return (
    (item.productCode as string) ||
    (item.ProductCode as string) ||
    (item.product as { code?: string } | undefined)?.code ||
    (item.Product as { Code?: string } | undefined)?.Code ||
    ''
  );
}

function transferItemQuantity(item: Record<string, unknown>): number {
  const q = item.quantity ?? item.Quantity;
  return typeof q === 'number' ? q : Number(q) || 0;
}

function approvalStatusBadgeVariant(status: string | undefined): 'warning' | 'success' | 'danger' | 'neutral' {
  const s = (status || '').toLowerCase();
  if (s === 'pending') return 'warning';
  if (s === 'approved') return 'success';
  if (s === 'rejected') return 'danger';
  return 'neutral';
}

function TransferDetailsView({ transfer }: { transfer: Transfer }) {
  const raw = transfer as unknown as Record<string, unknown>;
  const fromName = transfer.fromOutletName || transfer.fromOutlet?.name || '—';
  const toName = transfer.toOutletName || transfer.toOutlet?.name || '—';
  const fromCode = transfer.fromOutlet?.code ?? (raw.fromOutletCode as string | undefined);
  const toCode = transfer.toOutlet?.code ?? (raw.toOutletCode as string | undefined);
  const items = Array.isArray(transfer.items) ? transfer.items : [];
  const totalQty = items.reduce((sum, row) => sum + transferItemQuantity(row as unknown as Record<string, unknown>), 0);
  const status = transfer.status || (raw.status as string) || '';

  return (
    <DetailPanel>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
            Stock transfer
          </p>
          <p className="mt-1 text-lg font-bold tracking-tight" style={{ color: '#C8102E' }}>
            {transfer.transferNo}
          </p>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {formatSlDate(transfer.transferDate, {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Badge variant={approvalStatusBadgeVariant(status)} size="md">
            {status || '—'}
          </Badge>
          <span className="text-sm tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
            {items.length} line{items.length === 1 ? '' : 's'} · {totalQty.toLocaleString()} units total
          </span>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
          Movement
        </p>
        <div className="flex flex-col items-stretch gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:gap-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--muted)' }}>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
              From showroom
            </p>
            <p className="truncate text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              {fromName}
            </p>
            {fromCode ? (
              <p className="text-xs tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
                Code: {fromCode}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center justify-center sm:px-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border bg-[var(--card)]" style={{ borderColor: 'var(--border)' }}>
              <ArrowRight className="h-5 w-5" style={{ color: '#C8102E' }} aria-hidden />
            </span>
          </div>
          <div className="min-w-0 flex-1 sm:text-right">
            <p className="text-xs font-medium sm:text-right" style={{ color: 'var(--muted-foreground)' }}>
              To showroom
            </p>
            <p className="truncate text-sm font-semibold sm:text-right" style={{ color: 'var(--foreground)' }}>
              {toName}
            </p>
            {toCode ? (
              <p className="text-xs tabular-nums sm:text-right" style={{ color: 'var(--muted-foreground)' }}>
                Code: {toCode}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border p-3" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
            Requested by
          </p>
          <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            {transfer.createdByName || '—'}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {formatSlDateTime(transfer.createdAt)}
          </p>
        </div>
        {(transfer.approvedByName || transfer.approvedDate) && (
          <div className="rounded-lg border p-3" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
              Last approval
            </p>
            <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              {transfer.approvedByName || '—'}
            </p>
            {transfer.approvedDate ? (
              <p className="mt-0.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {formatSlDateTime(transfer.approvedDate)}
              </p>
            ) : null}
          </div>
        )}
      </div>

      {transfer.notes ? (
        <div className="rounded-lg border border-dashed p-3" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
            Notes for approver
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
            {transfer.notes}
          </p>
        </div>
      ) : null}

      <div>
        <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
              Products on this transfer
            </p>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Check SKU, name, and quantities before approving.
            </p>
          </div>
        </div>
        {items.length > 0 ? (
          <div
            className="w-full max-w-5xl overflow-x-auto rounded-lg border"
            style={{ borderColor: 'var(--border)' }}
          >
            <table className="w-full border-collapse text-sm">
              <colgroup>
                <col style={{ width: '2.75rem' }} />
                <col style={{ width: '1%' }} />
                <col />
                <col style={{ width: '1%' }} />
              </colgroup>
              <thead style={{ backgroundColor: 'var(--muted)' }}>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
                    #
                  </th>
                  <th
                    className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold"
                    style={{ color: 'var(--foreground)', width: '1%' }}
                  >
                    SKU
                  </th>
                  <th className="min-w-[12rem] px-4 py-3 text-left text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
                    Product
                  </th>
                  <th
                    className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold"
                    style={{ color: 'var(--foreground)', width: '1%' }}
                  >
                    Quantity
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, idx) => {
                  const r = row as unknown as Record<string, unknown>;
                  const code = transferItemProductCode(r);
                  const name = transferItemProductName(r);
                  const qty = transferItemQuantity(r);
                  const key = (r.id as string) || (r.Id as string) || `row-${idx}`;
                  return (
                    <tr key={key} className="border-t" style={{ borderColor: 'var(--border)' }}>
                      <td
                        className="px-4 py-3 tabular-nums text-sm leading-relaxed"
                        style={{ color: 'var(--muted-foreground)' }}
                      >
                        {idx + 1}
                      </td>
                      <td
                        className="whitespace-nowrap px-4 py-3 font-mono text-sm font-medium leading-relaxed"
                        style={{ color: 'var(--foreground)', width: '1%' }}
                      >
                        {code || '—'}
                      </td>
                      <td className="min-w-[12rem] px-4 py-3 leading-relaxed" style={{ color: 'var(--foreground)' }}>
                        <span className="font-medium">{name}</span>
                      </td>
                      <td
                        className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold tabular-nums leading-relaxed"
                        style={{ color: 'var(--foreground)', width: '1%' }}
                      >
                        {qty.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
            No line items were returned for this transfer. If this looks wrong, reload or contact support.
          </div>
        )}
      </div>

      <p className="text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
        Approving confirms that the listed quantities may move from <strong style={{ color: 'var(--foreground)' }}>{fromName}</strong> to{' '}
        <strong style={{ color: 'var(--foreground)' }}>{toName}</strong> according to your stock policies.
      </p>
    </DetailPanel>
  );
}

function DisposalDetailsView({ disposal }: { disposal: Disposal }) {
  return (
    <DetailPanel>
      <div className="space-y-6">
      <DetailSectionTint title="Disposal overview">
      <InfoGrid plain>
        <InfoField label="Disposal No" value={disposal.disposalNo} highlight />
        <InfoField label="Date" value={formatSlDate(disposal.disposalDate)} />
        <InfoField label="Outlet" value={disposal.outletName || disposal.outlet?.name || '-'} />
      </InfoGrid>
      </DetailSectionTint>
      <InfoField label="Requested By" value={`${disposal.createdByName} • ${formatSlDateTime(disposal.createdAt)}`} />
      {disposal.notes && <InfoField label="Notes" value={disposal.notes} />}
      {disposal.items?.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
            Disposal items
          </p>
          <ItemsTable
            headers={['Product', 'Qty', 'Reason']}
            rows={disposal.items.map((item: any) => [
              <div key={item.id}>
                <p className="font-medium">{item.productName || item.product?.name || 'Unknown'}</p>
              </div>,
              Number(item.quantity).toLocaleString(),
              item.reason || '-',
            ])}
          />
        </div>
      )}
      </div>
    </DetailPanel>
  );
}

function CancellationDetailsView({ cancellation }: { cancellation: Cancellation }) {
  return (
    <DetailPanel>
      <div className="space-y-6">
      <DetailSectionTint title="Cancellation overview">
      <InfoGrid plain>
        <InfoField label="Cancellation No" value={cancellation.cancellationNo} highlight />
        <InfoField label="Date" value={formatSlDate(cancellation.cancellationDate)} />
        <InfoField label="Outlet" value={cancellation.outletName || cancellation.outlet?.name || '-'} />
      </InfoGrid>
      </DetailSectionTint>
      <InfoField label="Delivery No" value={cancellation.deliveryNo} />
      <InfoField label="Requested By" value={`${cancellation.createdByName} • ${formatSlDateTime(cancellation.createdAt)}`} />
      <InfoField label="Reason" value={cancellation.reason || '-'} />
      </div>
    </DetailPanel>
  );
}

function PosSaleDetailsView({ sale }: { sale: PosSale }) {
  return (
    <DetailPanel>
      <div className="space-y-6">
      <DetailSectionTint title="Sale overview">
      <InfoGrid plain>
        <InfoField label="Sale No" value={sale.saleNo} highlight />
        <InfoField label="Sold At" value={sale.soldAt ? formatSlDateTime(sale.soldAt) : '—'} />
        <InfoField label="Outlet" value={sale.outletName || sale.outlet?.name || '—'} />
      </InfoGrid>
      </DetailSectionTint>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-x-6">
        <InfoField label="Payment" value={sale.paymentMethod} />
        <InfoField label="Total" value={`Rs. ${Number(sale.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} highlight />
      </div>
      {sale.lines?.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
            Line items
          </p>
          <ItemsTable
            headers={['Product', 'Qty', 'Line Total']}
            rows={sale.lines.map((line: any) => [
              <div key={line.id}>
                <p className="font-medium">{line.productName || '—'}</p>
                {line.productCode && <p className="text-xs text-muted-foreground">{line.productCode}</p>}
              </div>,
              Number(line.quantity).toLocaleString(),
              `Rs. ${Number(line.lineTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            ])}
          />
        </div>
      )}
      </div>
    </DetailPanel>
  );
}

function ShowroomLabelDetailsView({ item }: { item: OperationApprovalItem }) {
  return (
    <DetailPanel>
      <div className="space-y-6">
      <DetailSectionTint title="Label request">
      <InfoGrid plain>
        <InfoField label="Label Text" value={item.referenceNo} highlight />
        <InfoField label="Request Date" value={formatSlDate(item.requestDate)} />
        <InfoField label="Label Count" value={item.itemCount ?? '-'} />
      </InfoGrid>
      </DetailSectionTint>
      <InfoField label="Showroom" value={item.outletName || '-'} />
      {item.description && <InfoField label="Description" value={item.description} />}
      </div>
    </DetailPanel>
  );
}

function ImmediateOrderDetailsView({ order }: { order: ImmediateOrder }) {
  if (!order) return null;
  const fmtDate = (v?: string) => (v ? formatSlDate(v) : '—');
  const status = order.status || '';
  const fullQty = Number(order.fullQuantity ?? order.quantity ?? 0);
  const miniQty = Number(order.miniQuantity ?? 0);

  return (
    <DetailPanel>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
            Immediate order
          </p>
          <p className="mt-1 text-lg font-bold tracking-tight" style={{ color: '#C8102E' }}>
            {order.orderNo}
          </p>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {formatSlDate(order.orderDate, {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Badge variant={approvalStatusBadgeVariant(status)} size="md">
            {status || '—'}
          </Badge>
        </div>
      </div>

      <DetailSectionTint
        title="Schedule & logistics"
        subtitle="Production window, delivery, and showroom details."
      >
        <InfoGrid plain>
          <InfoField label="Order Bill No." value={order.orderBillNo || '—'} highlight />
          <InfoField label="System ref" value={order.orderNo} />
          <InfoField label="Order Date" value={formatSlDate(order.orderDate)} />
          <InfoField label="Need by" value={`${fmtDate(order.needByDate)} ${order.needByTime ?? ''}`.trim() || '—'} />
          <InfoField label="Delivery date" value={fmtDate(order.deliveryDate)} />
          <InfoField label="Delivery time" value={order.deliveryTime || '—'} />
          <InfoField
            label="Production start"
            value={`${fmtDate(order.productionStartingDate)} ${order.productionStartingTime ?? ''}`.trim() || '—'}
          />
          <InfoField label="Recipe request no." value={order.recipeRequestNumber || '—'} />
          <InfoField label="Showroom" value={order.outletName} />
          <InfoField label="Delivery Turn" value={order.deliveryTurnName} />
        </InfoGrid>
      </DetailSectionTint>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
          Product & quantities
        </p>
        <ItemsTable
          headers={['Product', 'Full (F)', 'Mini (M)']}
          rows={[
            [
              <span key="name" className="font-medium">
                {order.productName}
              </span>,
              fullQty.toLocaleString(),
              miniQty.toLocaleString(),
            ],
          ]}
        />
      </div>

      {order.reason ? (
        <div className="rounded-lg border border-dashed p-3" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
            Reason
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm font-medium leading-relaxed" style={{ color: 'var(--foreground)' }}>
            {order.reason}
          </p>
        </div>
      ) : null}

      {order.isCustomized ? (
        <div className="rounded-lg border p-3" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
            Customization
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
            {order.notes || '—'}
          </p>
        </div>
      ) : null}
    </DetailPanel>
  );
}

function ProductionDetailsView({ production }: { production: DailyProduction }) {
  if (!production) return null;
  return (
    <DetailPanel>
      <div className="space-y-6">
        <DetailSectionTint title="Production overview">
          <InfoGrid plain>
            <InfoField label="Production No" value={production.productionNo} highlight />
            <InfoField label="Date" value={formatSlDate(production.productionDate)} />
            <InfoField label="Shift" value={production.shiftName} />
          </InfoGrid>
        </DetailSectionTint>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-x-6">
          <InfoField label="Product" value={production.productName || production.product?.name || '-'} />
          <InfoField label="Requested By" value={production.createdByName} />
        </div>
        <DetailSectionTint title="Quantities" subtitle="Planned vs produced for this run.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border px-5 py-6 text-center sm:py-7" style={{ borderColor: 'var(--border)' }}>
              <p className="mb-2 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                Planned
              </p>
              <p className="text-2xl font-bold tabular-nums">{production.plannedQty}</p>
            </div>
            <div className="rounded-lg border px-5 py-6 text-center sm:py-7" style={{ borderColor: '#C8102E' }}>
              <p className="mb-2 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                Produced
              </p>
              <p className="text-2xl font-bold tabular-nums" style={{ color: '#C8102E' }}>
                {production.producedQty}
              </p>
            </div>
          </div>
        </DetailSectionTint>
        {production.notes && <InfoField label="Notes" value={production.notes} />}
      </div>
    </DetailPanel>
  );
}

function AdminApprovalDetailsView({ approval }: { approval: any }) {
  if (!approval) return null;
  return (
    <DetailPanel>
      <div className="space-y-6">
        <DetailSectionTint title="Admin approval">
          <InfoGrid plain>
            <InfoField label="Type" value={approval.approvalType} highlight />
            <InfoField label="Reference" value={approval.entityReference || approval.entityId} />
            <InfoField label="Requested At" value={formatSlDateTime(approval.requestedAt)} />
          </InfoGrid>
        </DetailSectionTint>
        <InfoField label="Requested By" value={approval.requestedByName} />
        {approval.notes && (
          <div className="rounded-lg border border-dashed p-3" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
              Notes / data
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
              {approval.notes}
            </p>
          </div>
        )}
      </div>
    </DetailPanel>
  );
}

function GenericDetailsView({ item, details }: { item: OperationApprovalItem; details: any }) {
  const core = details?.data ?? details;
  const rawItems = core?.items;
  const lineItems = Array.isArray(rawItems) ? rawItems : [];

  return (
    <DetailPanel>
      <div className="space-y-6">
        <DetailSectionTint title="Request overview">
          <InfoGrid plain>
            <InfoField label="Reference" value={item.referenceNo} highlight />
            <InfoField label="Date" value={formatSlDate(item.requestDate)} />
            <InfoField label="Type" value={item.approvalType} />
          </InfoGrid>
        </DetailSectionTint>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-x-6">
          <InfoField label="Outlet / Product" value={item.outletName || '-'} />
          <InfoField label="Requested By" value={item.requestedByName || '-'} />
        </div>
        {item.approvalType === 'Delivery Return' && core?.deliveryNo != null && core.deliveryNo !== '' && (
          <InfoField label="Delivery No" value={String(core.deliveryNo)} />
        )}
        {item.description && <InfoField label="Description" value={item.description} />}
        {core?.notes != null && core.notes !== '' && (
          <div className="rounded-lg border border-dashed p-3" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
              Notes
            </p>
            <p className="mt-1 text-sm italic leading-relaxed" style={{ color: 'var(--foreground)' }}>
              {String(core.notes)}
            </p>
          </div>
        )}
        {lineItems.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
              {item.approvalType === 'Delivery Return' ? 'Returned items' : 'Line items'}
            </p>
            <ItemsTable
              headers={['Product', 'Quantity']}
              rows={lineItems.map((row: any, idx: number) => {
                const name =
                  row.productName ??
                  row.product?.name ??
                  row.ProductName ??
                  row.Product?.Name ??
                  'Unknown';
                const code = row.product?.code ?? row.Product?.Code;
                const qty = row.quantity ?? row.Quantity;
                return [
                  <div key={row.id ?? row.Id ?? idx}>
                    <p className="font-medium">{name}</p>
                    {code ? <p className="text-xs text-muted-foreground">{code}</p> : null}
                  </div>,
                  typeof qty === 'number' ? qty.toLocaleString() : String(qty ?? '-'),
                ];
              })}
            />
          </div>
        )}
      </div>
    </DetailPanel>
  );
}
