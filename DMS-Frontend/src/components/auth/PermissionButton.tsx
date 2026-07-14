'use client';

import { ComponentProps } from 'react';
import Button from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionButtonProps extends ComponentProps<typeof Button> {
  /**
   * Required permission(s) to show this button
   */
  permission?: string | string[];
  /**
   * Required role(s) to show this button
   */
  role?: string | string[];
  /**
   * Check mode: 'any' (default) or 'all'
   */
  mode?: 'any' | 'all';
  /**
   * If true, button is rendered but disabled when user lacks permission
   * If false (default), button is hidden when user lacks permission
   */
  showDisabled?: boolean;
  /**
   * Tooltip to show when button is disabled due to permissions
   */
  disabledTooltip?: string;
}

/**
 * PermissionButton - Button component that respects user permissions
 * Automatically hides or disables based on user's permissions
 * 
 * @example
 * <PermissionButton 
 *   permission="operation:delivery:approve"
 *   onClick={handleApprove}
 * >
 *   Approve
 * </PermissionButton>
 */
export default function PermissionButton({
  permission,
  role,
  mode = 'any',
  showDisabled = false,
  disabledTooltip,
  disabled,
  children,
  ...buttonProps
}: PermissionButtonProps) {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isSuperAdmin,
  } = usePermissions();

  // Super admins bypass all checks
  if (isSuperAdmin) {
    return (
      <Button {...buttonProps} disabled={disabled}>
        {children}
      </Button>
    );
  }

  let hasAccess = true;

  // Check permissions
  if (permission) {
    if (Array.isArray(permission)) {
      if (mode === 'all') {
        hasAccess = hasAllPermissions(permission);
      } else {
        hasAccess = hasAnyPermission(permission);
      }
    } else {
      hasAccess = hasPermission(permission);
    }
  }

  // Check roles
  if (hasAccess && role) {
    if (Array.isArray(role)) {
      if (mode === 'all') {
        hasAccess = role.every((r) => hasRole(r));
      } else {
        hasAccess = hasAnyRole(role);
      }
    } else {
      hasAccess = hasRole(role);
    }
  }

  // Hide button if no access and showDisabled is false
  if (!hasAccess && !showDisabled) {
    return null;
  }

  // Show disabled button if no access and showDisabled is true
  const isDisabled = !hasAccess || disabled;
  const title = !hasAccess && disabledTooltip ? disabledTooltip : buttonProps.title;

  return (
    <Button {...buttonProps} disabled={isDisabled} title={title}>
      {children}
    </Button>
  );
}
