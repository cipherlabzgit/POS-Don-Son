import { useAuthStore } from '@/lib/stores/auth-store';
import { useMemo, useCallback } from 'react';
import { getActionsForRoute, type ActionKey } from '@/lib/auth/permission-map';

/**
 * Hook for checking the current user's permissions and roles.
 *
 * Permission codes are stored on the user (from JWT) using COLON notation
 * (e.g. `products:view`, `operation:delivery:approve`). All helpers in this
 * hook operate on those raw codes — we no longer construct codes from
 * `module.action`-style dotted strings.
 *
 * Convenience helpers:
 *   - `can(code)` / `canAny([codes])` / `canAll([codes])` — direct checks.
 *   - `canAction(href, 'create' | 'edit' | ...)` — looks up the permission
 *     code for a page action via the canonical permission map.
 */
export function usePermissions() {
  const { user, hasPermission, hasAnyPermission, hasAllPermissions } = useAuthStore();

  const isSuperAdmin = useMemo(() => user?.isSuperAdmin || false, [user]);

  const hasRole = useCallback(
    (roleName: string): boolean => {
      if (!user || !user.roles) return false;
      if (isSuperAdmin) return true;
      return user.roles.some((role) => role.name.toLowerCase() === roleName.toLowerCase());
    },
    [user, isSuperAdmin],
  );

  const hasAnyRole = useCallback(
    (roleNames: string[]): boolean => {
      if (!user || !user.roles) return false;
      if (isSuperAdmin) return true;
      return roleNames.some((roleName) =>
        user.roles.some((role) => role.name.toLowerCase() === roleName.toLowerCase()),
      );
    },
    [user, isSuperAdmin],
  );

  /** Direct permission code check (alias of hasPermission). */
  const can = useCallback(
    (code: string): boolean => {
      if (!code) return false;
      if (isSuperAdmin) return true;
      return hasPermission(code);
    },
    [hasPermission, isSuperAdmin],
  );

  const canAny = useCallback(
    (codes: string[]): boolean => {
      if (isSuperAdmin) return true;
      return hasAnyPermission(codes);
    },
    [hasAnyPermission, isSuperAdmin],
  );

  const canAll = useCallback(
    (codes: string[]): boolean => {
      if (isSuperAdmin) return true;
      return hasAllPermissions(codes);
    },
    [hasAllPermissions, isSuperAdmin],
  );

  /**
   * Look up the permission code for an action on the page at `href`
   * and return whether the current user has it.
   *
   * Returns `false` if the action is not declared for that page.
   */
  const canAction = useCallback(
    (href: string, action: ActionKey): boolean => {
      if (isSuperAdmin) return true;
      const code = getActionsForRoute(href)[action];
      return code ? hasPermission(code) : false;
    },
    [hasPermission, isSuperAdmin],
  );

  const userDisplayName = useMemo(() => {
    if (!user) return 'Guest';
    return `${user.firstName} ${user.lastName}`;
  }, [user]);

  const primaryRole = useMemo(() => {
    if (!user) return null;
    if (user.isSuperAdmin) return 'Super Admin';
    if (!user.roles || user.roles.length === 0) return 'User';
    return user.roles[0].name;
  }, [user]);

  return {
    user,
    isSuperAdmin,
    userDisplayName,
    primaryRole,

    // Role helpers
    hasRole,
    hasAnyRole,

    // Permission code helpers (raw colon-notation codes)
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    can,
    canAny,
    canAll,

    // Page-action helper using the permission map
    canAction,
  };
}
