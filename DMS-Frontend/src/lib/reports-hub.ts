import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Factory,
  Package,
  Receipt,
  Trash2,
  Truck,
} from 'lucide-react';

export type ReportCategoryId =
  | 'sales'
  | 'pos'
  | 'delivery'
  | 'disposal'
  | 'production'
  | 'inventory';

export interface ReportHubItem {
  id: string;
  title: string;
  description: string;
  /** Set when the report screen exists; otherwise card is preview-only. */
  href?: string;
}

export interface ReportCategoryDef {
  id: ReportCategoryId;
  title: string;
  description: string;
  icon: LucideIcon;
  /** User sees the category if they hold any of these permissions (or are admin). */
  anyOfPermissions: string[];
  reports: ReportHubItem[];
}

export const REPORT_CATEGORIES: ReportCategoryDef[] = [
  {
    id: 'sales',
    title: 'Sales',
    description: 'Sales performance and settlement checks.',
    icon: BarChart3,
    anyOfPermissions: ['reports:sales', 'reports:daily', 'reports:showroom', 'reports:view'],
    reports: [
      {
        id: 'sales-summary',
        title: 'Sales Summary Report',
        description: 'Showroom cashier showroom sale, system sale, difference.',
      },
      {
        id: 'daily-showroom-totals',
        title: 'Daily Showroom Totals',
        description: 'Daily totals grouped by showroom.',
      },
      {
        id: 'daily-sales-system-balance',
        title: 'Daily Sales (System Balance)',
        description: 'System-balanced daily sales summary.',
      },
      {
        id: 'stock-bf',
        title: 'Stock BF Report',
        description: 'Stock BF quantities by item and showroom for a selected date.',
      },
      {
        id: 'daily-sale-report',
        title: 'Daily Sale Report',
        description: 'Item-wise system balance for a showroom/date.',
      },
      {
        id: 'daily-sale-of-item',
        title: 'Daily Sale Of Item',
        description: 'Item quantities across a date range.',
      },
    ],
  },
  {
    id: 'pos',
    title: 'POS',
    description: 'POS sales views and item breakdowns.',
    icon: Receipt,
    anyOfPermissions: ['reports:showroom', 'reports:daily', 'reports:view'],
    reports: [
      {
        id: 'pos-sale-summary',
        title: 'POS Sale Summary',
        description: 'Daily totals and cashier summary.',
      },
      {
        id: 'pos-sale-item-wise',
        title: 'POS Sale Of Item Wise',
        description: 'Item-wise POS sales totals.',
      },
      {
        id: 'pos-sale-detail-wise',
        title: 'POS Sale By Detail Wise',
        description: 'Bill-wise POS sales details by showroom.',
      },
      {
        id: 'system-vs-pos-item',
        title: 'System Sale vs POS Sale By Item Wise',
        description: 'System vs POS quantities by item for a showroom.',
      },
    ],
  },
  {
    id: 'delivery',
    title: 'Delivery',
    description: 'Delivery movement and document views.',
    icon: Truck,
    anyOfPermissions: ['reports:delivery', 'reports:view'],
    reports: [
      {
        id: 'delivery-detail-showroom',
        title: 'Delivery Detail By Showroom',
        description: 'Delivery details grouped by delivery number.',
      },
      {
        id: 'delivery-detail-item-wise',
        title: 'Delivery Detail Item Wise',
        description: 'Item-wise delivery quantities by showroom.',
      },
      {
        id: 'delivery-detail-of-item',
        title: 'Delivery Detail Of Item',
        description: 'Delivery totals for a selected item.',
      },
      {
        id: 'delivery-note-view',
        title: 'Delivery Note View Report',
        description: 'Printable delivery note history.',
      },
    ],
  },
  {
    id: 'disposal',
    title: 'Disposal',
    description: 'Disposal values and category totals.',
    icon: Trash2,
    anyOfPermissions: ['reports:disposal', 'reports:view'],
    reports: [
      {
        id: 'disposal-summary-category',
        title: 'Disposal Summary Category Wise',
        description: 'Category totals for disposals.',
      },
      {
        id: 'disposal-summary-showroom-values',
        title: 'Disposal Summary Showroom Values',
        description: 'Showroom value totals for disposals.',
      },
      {
        id: 'disposal-summary-showroom',
        title: 'Disposal Summary Showroom',
        description: 'Showroom totals by disposal date.',
      },
      {
        id: 'disposal-summary-item-wise',
        title: 'Disposal Summary Item Wise',
        description: 'Item-wise disposal summaries.',
      },
    ],
  },
  {
    id: 'production',
    title: 'Production',
    description: 'Production totals and reconciliation reports.',
    icon: Factory,
    anyOfPermissions: ['reports:production', 'reports:product', 'reports:view'],
    reports: [
      {
        id: 'daily-production',
        title: 'Daily Production',
        description: 'Totals by item for a production date.',
      },
      {
        id: 'production-reconcile',
        title: 'Production Reconcile',
        description: 'Compare planned vs actual production.',
      },
      {
        id: 'production-detail-item-wise',
        title: 'Production Detail Item Wise',
        description: 'Item-wise production totals by date.',
      },
      {
        id: 'daily-production-of-item',
        title: 'Daily Production Of Item',
        description: 'Daily production quantities for a selected item.',
      },
    ],
  },
  {
    id: 'inventory',
    title: 'Inventory',
    description: 'Inventory listings and item status.',
    icon: Package,
    anyOfPermissions: ['reports:inventory', 'reports:product', 'reports:view'],
    reports: [
      {
        id: 'items-report',
        title: 'Items Report',
        description: 'Full item list with pricing and status.',
      },
    ],
  },
];

export function getReportCategory(id: string): ReportCategoryDef | undefined {
  return REPORT_CATEGORIES.find((c) => c.id === id);
}
