/**
 * Sidebar navigation, derived from the canonical PERMISSION_SECTIONS catalog
 * (see `@/lib/auth/permission-map`). DO NOT add new menu items here directly —
 * add them to the permission map and they will appear in the sidebar
 * automatically.
 *
 * Permission codes use COLON notation (e.g. `products:view`,
 * `operation:delivery:view`) to match the backend `[HasPermission(...)]`
 * attributes.
 */

import { type LucideIcon } from 'lucide-react';
import { PERMISSION_SECTIONS, type SubsectionDef } from '@/lib/auth/permission-map';

export interface MenuItem {
  name: string;
  href?: string;
  icon: LucideIcon;
  /** Permission required to see this item. */
  permission?: string;
  children?: MenuItem[];
  badge?: string | number;
}

function subsectionToMenu(sub: SubsectionDef): MenuItem {
  return {
    name: sub.name,
    href: sub.href,
    icon: sub.icon,
    permission: sub.actions.view,
    badge: sub.badge,
  };
}

export const navigationMenu: MenuItem[] = PERMISSION_SECTIONS.filter((section) => !section.hideFromSidebar).map(
  (section) => {
    const visibleSubs = section.subsections.filter((s) => !s.hideFromSidebar);

    // Single subsection sections collapse into a leaf menu entry.
    if (visibleSubs.length === 1 && visibleSubs[0].href) {
      const only = visibleSubs[0];
      return {
        name: section.name,
        href: only.href,
        icon: section.icon,
        permission: section.modulePermission ?? only.actions.view,
      };
    }

    return {
      name: section.name,
      icon: section.icon,
      permission: section.modulePermission,
      children: visibleSubs.map(subsectionToMenu),
    };
  },
);

/**
 * Recursively filter the menu so users only see items for which they have
 * permission. Super admins see everything.
 */
export function filterMenuByPermissions(
  menu: MenuItem[],
  hasPermission: (permission: string) => boolean,
  isSuperAdmin: boolean,
): MenuItem[] {
  return menu
    .map((item): MenuItem | null => {
      const hasAccess = !item.permission || isSuperAdmin || hasPermission(item.permission);

      if (item.children) {
        const filteredChildren = filterMenuByPermissions(item.children, hasPermission, isSuperAdmin);

        // Hide section entirely if no children pass and the section itself
        // does not point to a navigable page.
        if (filteredChildren.length === 0) return null;

        // Section-level permission still gates if explicitly set.
        if (item.permission && !isSuperAdmin && !hasPermission(item.permission)) {
          return null;
        }

        return { ...item, children: filteredChildren };
      }

      if (!hasAccess) return null;
      return item;
    })
    .filter((item): item is MenuItem => item !== null);
}
