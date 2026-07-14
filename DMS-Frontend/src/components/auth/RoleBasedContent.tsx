'use client';

import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface ContentVariant {
  /**
   * Permission(s) required to show this variant
   */
  permission?: string | string[];
  /**
   * Role(s) required to show this variant
   */
  role?: string | string[];
  /**
   * Content to render for this variant
   */
  content: ReactNode;
  /**
   * Optional priority (higher priority variants are checked first)
   */
  priority?: number;
}

interface RoleBasedContentProps {
  /**
   * Array of content variants with their permission/role requirements
   */
  variants: ContentVariant[];
  /**
   * Fallback content to show if no variant matches
   */
  fallback?: ReactNode;
}

/**
 * RoleBasedContent - Render different content based on user's permissions or roles
 * Checks variants in order of priority (highest first), then array order
 * 
 * @example
 * <RoleBasedContent
 *   variants={[
 *     {
 *       permission: 'operation:delivery:approve',
 *       content: <ApprovalView />
 *     },
 *     {
 *       permission: 'operation:delivery:create',
 *       content: <SubmissionView />
 *     }
 *   ]}
 *   fallback={<ReadOnlyView />}
 * />
 */
export default function RoleBasedContent({ variants, fallback = null }: RoleBasedContentProps) {
  const { hasPermission, hasAnyPermission, hasRole, hasAnyRole, isSuperAdmin } = usePermissions();

  // Sort variants by priority (highest first)
  const sortedVariants = [...variants].sort((a, b) => {
    const priorityA = a.priority || 0;
    const priorityB = b.priority || 0;
    return priorityB - priorityA;
  });

  // Super admins see the first variant
  if (isSuperAdmin && sortedVariants.length > 0) {
    return <>{sortedVariants[0].content}</>;
  }

  // Find the first matching variant
  for (const variant of sortedVariants) {
    let matches = true;

    // Check permissions
    if (variant.permission) {
      if (Array.isArray(variant.permission)) {
        matches = hasAnyPermission(variant.permission);
      } else {
        matches = hasPermission(variant.permission);
      }
    }

    // Check roles (if permissions passed)
    if (matches && variant.role) {
      if (Array.isArray(variant.role)) {
        matches = hasAnyRole(variant.role);
      } else {
        matches = hasRole(variant.role);
      }
    }

    if (matches) {
      return <>{variant.content}</>;
    }
  }

  // No variant matched, return fallback
  return <>{fallback}</>;
}
