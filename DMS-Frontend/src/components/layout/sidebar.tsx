'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { navigationMenu, filterMenuByPermissions, type MenuItem } from '@/lib/navigation/menu-items';
import { useTheme } from '@/lib/theme/theme-context';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export default function Sidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const pathname = usePathname();
  const { user, hasPermission } = useAuthStore();
  const { pageColor } = useTheme();

  // Filter navigation based on user permissions
  const visibleNavigation = filterMenuByPermissions(
    navigationMenu,
    hasPermission,
    user?.isSuperAdmin || false
  );

  // Toggle expanded state for menu items with children
  const toggleExpanded = (itemName: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemName)
        ? prev.filter((name) => name !== itemName)
        : [...prev, itemName]
    );
  };

  const handleNavClick = () => {
    // Close mobile menu when clicking a nav item
    if (window.innerWidth < 1024) {
      setMobileOpen(false);
    }
  };

  const pathMatchesHref = (href: string | undefined): boolean => {
    if (!href || href === '#') return false;
    if (pathname === href) return true;
    // Highlight section parents and nested routes (e.g. …/rounding-rules/add).
    return pathname.startsWith(`${href}/`);
  };

  // Check if current path matches item or its children
  const isItemActive = (item: MenuItem): boolean => {
    if (pathMatchesHref(item.href)) return true;
    if (item.children) {
      return item.children.some((child) => pathMatchesHref(child.href));
    }
    return false;
  };

  // Render individual menu item
  const renderMenuItem = (item: MenuItem, level = 0) => {
    const isActive = isItemActive(item);
    const isExpanded = expandedItems.includes(item.name);
    const hasChildren = item.children && item.children.length > 0;

    if (hasChildren) {
      return (
        <div key={item.name}>
          <button
            onClick={() => toggleExpanded(item.name)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
              isActive
                ? 'font-medium'
                : ''
            }`}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'var(--muted)';
                e.currentTarget.style.color = 'var(--foreground)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--card-foreground)';
              }
            }}
            style={
              isActive
                ? { backgroundColor: pageColor, color: 'white' }
                : { color: 'var(--card-foreground)' }
            }
            title={collapsed ? item.name : ''}
          >
            <div className="flex items-center space-x-3">
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
            </div>
            {!collapsed && (
              isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )
            )}
          </button>
          {isExpanded && !collapsed && (
            <div className="ml-4 mt-1 space-y-1 border-l-2 pl-2" style={{ borderColor: 'var(--border)' }}>
              {item.children?.map((child) => renderMenuItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.name}
        href={item.href || '#'}
        onClick={handleNavClick}
        className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${
          isActive
            ? 'font-medium'
            : ''
        }`}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = 'var(--muted)';
            e.currentTarget.style.color = 'var(--foreground)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--card-foreground)';
          }
        }}
        style={
          isActive
            ? { backgroundColor: pageColor, color: 'white' }
            : { color: 'var(--card-foreground)' }
        }
        title={collapsed ? item.name : ''}
      >
        <item.icon className="w-5 h-5 flex-shrink-0" />
        {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
        {item.badge && !collapsed && (
          <span className="ml-auto px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div
      className={`text-white transition-all duration-300 flex flex-col flex-shrink-0 ${
        collapsed ? 'w-16' : 'w-64'
      } fixed lg:static inset-y-0 left-0 z-50 transform ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}
      style={{ 
        backgroundColor: 'var(--card)',
        borderRight: '1px solid var(--border)'
      }}
    >
      {/* Header with Don & Sons branding */}
      <div className="h-16 flex items-center justify-between px-4" style={{ borderBottom: '1px solid var(--border)' }}>
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: pageColor }}
            >
              <span className="text-white font-bold">D&S</span>
            </div>
            <span className="font-semibold text-lg" style={{ color: 'var(--foreground)' }}>Don & Sons</span>
          </div>
        )}
        {collapsed && (
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto"
            style={{ backgroundColor: pageColor }}
          >
            <span className="text-white font-bold text-sm">D&S</span>
          </div>
        )}
      </div>

      {/* Desktop Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:block absolute top-5 -right-3 rounded-full p-1 transition-colors border"
        style={{ 
          backgroundColor: 'var(--card)',
          borderColor: 'var(--border)',
          color: 'var(--foreground)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--muted)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--card)';
        }}
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-2 space-y-1">
          {visibleNavigation.map((item) => renderMenuItem(item))}
        </div>
      </nav>

      {/* User Info */}
      <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
        {!collapsed ? (
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: pageColor }}
            >
              <span className="text-white font-semibold text-sm">
                {user?.firstName?.charAt(0)}
                {user?.lastName?.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>{user?.email}</p>
            </div>
          </div>
        ) : (
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center mx-auto"
            style={{ backgroundColor: pageColor }}
          >
            <span className="text-white font-semibold text-sm">
              {user?.firstName?.charAt(0)}
              {user?.lastName?.charAt(0)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
