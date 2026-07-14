'use client';

import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import Button from '@/components/ui/button';

interface PermissionGuardProps {
  children: ReactNode;
  /**
   * Required permission(s) to view the content
   * Can be a single permission or array of permissions
   */
  permission?: string | string[];
  /**
   * Required role(s) to view the content
   * Can be a single role or array of roles
   */
  role?: string | string[];
  /**
   * Check mode: 'any' (default) or 'all'
   * - 'any': User needs at least one of the permissions/roles
   * - 'all': User needs all of the permissions/roles
   */
  mode?: 'any' | 'all';
  /**
   * What to show when user doesn't have permission
   * - 'hide': Don't render anything (default)
   * - 'message': Show access denied message
   * - custom ReactNode: Show custom content
   */
  fallback?: 'hide' | 'message' | ReactNode;
  /**
   * Custom access denied message
   */
  deniedMessage?: string;
}

function AccessDeniedMessage({ message, showBackButton = true }: { message?: string; showBackButton?: boolean }) {
  const router = useRouter();

  return (
    <div
      className="rounded-lg border p-8 text-center"
      style={{
        backgroundColor: 'var(--card)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="flex justify-center mb-4">
        <div
          className="rounded-full p-3"
          style={{ backgroundColor: 'var(--destructive/10)' }}
        >
          <AlertCircle className="w-8 h-8" style={{ color: 'var(--destructive)' }} />
        </div>
      </div>
      <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
        Access Denied
      </h2>
      <p className="mb-6" style={{ color: 'var(--muted-foreground)' }}>
        {message || 'You do not have permission to view this content. Please contact your administrator if you believe this is an error.'}
      </p>
      {showBackButton && (
        <Button variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
      )}
    </div>
  );
}

/**
 * PermissionGuard - Conditionally render content based on user permissions or roles
 * 
 * @example
 * // Require specific permission
 * <PermissionGuard permission="operation:delivery:approve">
 *   <ApprovalButtons />
 * </PermissionGuard>
 * 
 * @example
 * // Require any of multiple permissions
 * <PermissionGuard permission={["admin:view", "manager:view"]} mode="any">
 *   <AdminPanel />
 * </PermissionGuard>
 * 
 * @example
 * // Require specific role
 * <PermissionGuard role="Manager" fallback="message">
 *   <ManagerDashboard />
 * </PermissionGuard>
 * 
 * @example
 * // Multiple roles with custom fallback
 * <PermissionGuard 
 *   role={["Admin", "Supervisor"]} 
 *   mode="any"
 *   fallback={<div>Please contact an administrator</div>}
 * >
 *   <AdminTools />
 * </PermissionGuard>
 */
export default function PermissionGuard({
  children,
  permission,
  role,
  mode = 'any',
  fallback = 'hide',
  deniedMessage,
}: PermissionGuardProps) {
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
    return <>{children}</>;
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

  // Check roles (if permissions passed)
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

  // If user has access, render children
  if (hasAccess) {
    return <>{children}</>;
  }

  // Handle fallback
  if (fallback === 'hide') {
    return null;
  }

  if (fallback === 'message') {
    return <AccessDeniedMessage message={deniedMessage} />;
  }

  // Custom fallback
  return <>{fallback}</>;
}
