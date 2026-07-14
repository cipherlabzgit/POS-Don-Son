'use client';

import { Check, X, Send, Clock } from 'lucide-react';
import PermissionButton from './PermissionButton';

interface WorkflowButtonsProps {
  /**
   * Module/feature key for permission checking, in colon notation
   * (e.g., `operation:delivery`, `production:cancel`).
   *
   * The component derives `${module}:update` (and `:create` as alternate) for Submit for Approval.
   * Approve/reject actions belong on Administrator › Approvals only.
   */
  module: string;
  /**
   * Current status of the item
   */
  status: 'Draft' | 'Pending' | 'Approved' | 'Rejected';
  /**
   * Callback when item is submitted for approval
   */
  onSubmit?: () => void;
  /**
   * Loading state
   */
  isLoading?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * WorkflowButtons - Smart button group for approval workflows
 *
 * Automatically shows appropriate buttons based on status and the user's
 * permissions. Permission codes use the canonical colon notation that
 * matches the backend `[HasPermission(...)]` attributes.
 *
 * Approve and reject are handled only on Administrator › Approvals.
 *
 * @example
 * <WorkflowButtons
 *   module="operation:delivery"
 *   status={delivery.status}
 *   onSubmit={() => handleSubmit(delivery.id)}
 * />
 */
export default function WorkflowButtons({
  module,
  status,
  onSubmit,
  isLoading = false,
  className = '',
}: WorkflowButtonsProps) {
  // Normalise legacy dot-notation modules (e.g. "operation.delivery") to
  // colon-notation. This keeps existing call-sites working while we migrate.
  const moduleKey = module.replace(/\./g, ':');

  return (
    <div className={`flex gap-2 ${className}`}>
      {/* Submit for Approval - shown for Draft status */}
      {status === 'Draft' && onSubmit && (
        <PermissionButton
          permission={[`${moduleKey}:update`, `${moduleKey}:create`]}
          mode="any"
          variant="primary"
          size="sm"
          onClick={onSubmit}
          disabled={isLoading}
        >
          <Send className="w-4 h-4 mr-1" />
          Submit for Approval
        </PermissionButton>
      )}

      {/* Status Indicator - shown for final statuses */}
      {status === 'Approved' && (
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-green-100 text-green-700 text-sm">
          <Check className="w-4 h-4" />
          <span>Approved</span>
        </div>
      )}

      {status === 'Rejected' && (
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-red-100 text-red-700 text-sm">
          <X className="w-4 h-4" />
          <span>Rejected</span>
        </div>
      )}

      {status === 'Pending' && (
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-amber-100 text-amber-700 text-sm">
          <Clock className="w-4 h-4" />
          <span>Pending Approval</span>
        </div>
      )}
    </div>
  );
}
