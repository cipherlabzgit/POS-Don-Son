'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { Loader2, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/button';

interface ProtectedPageProps {
  children: ReactNode;
  /**
   * Required permission(s) to access this page
   */
  permission?: string | string[];
  /**
   * Required role(s) to access this page
   */
  role?: string | string[];
  /**
   * Check mode: 'any' (default) or 'all'
   */
  mode?: 'any' | 'all';
  /**
   * Where to redirect if user doesn't have permission
   * Default: '/dashboard'
   */
  redirectTo?: string;
  /**
   * Whether to show access denied message instead of redirecting
   * Default: true
   */
  showDeniedMessage?: boolean;
  /**
   * Custom access denied message
   */
  deniedMessage?: string;
}

/**
 * ProtectedPage - Wrapper component for pages that require specific permissions
 * Use this at the top level of pages that need access control
 * 
 * @example
 * export default function ApprovalPage() {
 *   return (
 *     <ProtectedPage permission="operation:delivery:approve">
 *       <ApprovalContent />
 *     </ProtectedPage>
 *   );
 * }
 */
export default function ProtectedPage({
  children,
  permission,
  role,
  mode = 'any',
  redirectTo = '/dashboard',
  showDeniedMessage = true,
  deniedMessage,
}: ProtectedPageProps) {
  const router = useRouter();
  const {
    user,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isSuperAdmin,
  } = usePermissions();

  // Check if user has access
  const checkAccess = (): boolean => {
    if (isSuperAdmin) return true;

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

    return hasAccess;
  };

  const hasAccess = checkAccess();

  useEffect(() => {
    // If user doesn't have access and we're not showing denied message, redirect
    if (!hasAccess && !showDeniedMessage) {
      router.push(redirectTo);
    }
  }, [hasAccess, showDeniedMessage, redirectTo, router]);

  // Show loading state while checking
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
      </div>
    );
  }

  // Show access denied if no permission
  if (!hasAccess) {
    if (showDeniedMessage) {
      return (
        <div className="p-6">
          <div
            className="rounded-lg border p-8 text-center max-w-md mx-auto mt-20"
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
              {deniedMessage ||
                'You do not have permission to access this page. Please contact your administrator if you believe this is an error.'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => router.back()}>
                Go Back
              </Button>
              <Button variant="primary" onClick={() => router.push('/dashboard')}>
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }
    // Redirect is handled by useEffect
    return null;
  }

  // User has access, render the page
  return <>{children}</>;
}
