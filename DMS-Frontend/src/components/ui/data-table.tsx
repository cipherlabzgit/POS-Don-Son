'use client';

import { Fragment, ReactNode, type CSSProperties } from 'react';
import { useTheme } from '@/lib/theme/theme-context';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function expandedKeysMatch(
  expanded: string | number | null | undefined,
  key: string | number,
) {
  if (expanded === null || expanded === undefined) return false;
  return String(expanded) === String(key);
}

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  currentPage?: number;
  totalPages?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  isLoading?: boolean;
  /** Optional left border / status tint per row */
  rowClassName?: (item: T, index: number) => string | undefined;
  /** Server-side total; when set, footer shows "Showing X to Y of Z" on the left. */
  totalCount?: number;
  /** Hide the rows-per-page control in the footer (e.g. when it is rendered above the table). */
  hideRowsPerPage?: boolean;
  /** Message when `data` is empty (after loading). */
  emptyMessage?: string;
  /** Nest inside a parent Card: no outer border/radius/shadow. */
  embedded?: boolean;
  /** When set with `renderExpandedRow`, detail renders in a full-width row directly under that record. */
  expandedRowKey?: string | number | null;
  /** Defaults to `item.id ?? index` when `expandedRowKey` / `renderExpandedRow` are used. */
  getRowKey?: (item: T, index: number) => string | number;
  renderExpandedRow?: (item: T) => ReactNode;
}

export function DataTable<T extends { id?: string | number }>({
  data,
  columns,
  currentPage = 1,
  totalPages = 1,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
  rowClassName,
  totalCount: totalCountProp,
  hideRowsPerPage = false,
  emptyMessage = 'No data available',
  embedded = false,
  expandedRowKey = null,
  getRowKey,
  renderExpandedRow,
}: DataTableProps<T>) {
  const { pageColor } = useTheme();

  const renderPagination = () => {
    const pages = [];
    const maxVisible = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    const totalCount = totalCountProp ?? data.length;
    const startRow = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endRow = Math.min(currentPage * pageSize, totalCount);
    const showRangeFooter = typeof totalCountProp === 'number';

    return (
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex flex-wrap items-center gap-2">
          {showRangeFooter && (
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Showing {startRow} to {endRow} of {totalCount} entries
            </span>
          )}
          {!hideRowsPerPage && (
            <>
              <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Rows per page:
              </span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
                className="px-3 py-1.5 rounded-lg text-sm focus:outline-none"
                style={{ border: '1px solid var(--input)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm sm:ml-2" style={{ color: 'var(--muted-foreground)' }}>
                Page {currentPage} of {totalPages}
              </span>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage === 1}
            className="rounded-lg px-2 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={{ color: 'var(--foreground)' }}
            onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = 'var(--muted)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <span className="inline-flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
            </span>
          </button>

          {startPage > 1 && (
            <>
              <button
                type="button"
                onClick={() => onPageChange?.(1)}
                className="px-3 py-1.5 text-sm rounded-lg transition-colors"
                style={{ color: 'var(--foreground)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--muted)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                1
              </button>
              {startPage > 2 && <span className="px-2" style={{ color: 'var(--muted-foreground)' }}>...</span>}
            </>
          )}

          {pages.map((page) => (
            <button
              type="button"
              key={page}
              onClick={() => onPageChange?.(page)}
              className="px-3 py-1.5 text-sm rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: page === currentPage ? pageColor : 'transparent',
                color: page === currentPage ? 'white' : 'var(--foreground)',
              }}
              onMouseEnter={(e) => {
                if (page !== currentPage) {
                  e.currentTarget.style.backgroundColor = 'var(--muted)';
                }
              }}
              onMouseLeave={(e) => {
                if (page !== currentPage) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {page}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="px-2" style={{ color: 'var(--muted-foreground)' }}>...</span>}
              <button
                type="button"
                onClick={() => onPageChange?.(totalPages)}
                className="px-3 py-1.5 text-sm rounded-lg transition-colors"
                style={{ color: 'var(--foreground)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--muted)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="rounded-lg px-2 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={{ color: 'var(--foreground)' }}
            onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = 'var(--muted)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <span className="inline-flex items-center gap-1">
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4" />
            </span>
          </button>
        </div>
      </div>
    );
  };

  const frameClass = 'overflow-hidden';
  const frameStyle: CSSProperties = {
    backgroundColor: 'var(--card)',
    ...(embedded
      ? {}
      : {
          border: '1px solid var(--border)',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        }),
  };

  if (isLoading) {
    return (
      <div className={frameClass} style={frameStyle}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y" style={{ borderColor: 'var(--border)' }}>
            <thead>
              <tr style={{ backgroundColor: pageColor }}>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
          </table>
        </div>
        <div className="flex items-center justify-center py-12">
          <div 
            className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-r-transparent"
            style={{ borderColor: pageColor, borderRightColor: 'transparent' }}
          ></div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={frameClass} style={frameStyle}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y" style={{ borderColor: 'var(--border)' }}>
            <thead>
              <tr style={{ backgroundColor: pageColor }}>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
          </table>
        </div>
        <div className="text-center py-12">
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={frameClass} style={frameStyle}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y" style={{ borderColor: 'var(--border)' }}>
          <thead>
            <tr style={{ backgroundColor: pageColor }}>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white ${column.className || ''}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
            {data.map((item, index) => {
              const rowKey = getRowKey ? getRowKey(item, index) : item.id ?? index;
              const isExpanded =
                !!renderExpandedRow && expandedKeysMatch(expandedRowKey, rowKey);
              const stripeBg = index % 2 === 0 ? 'var(--card)' : 'var(--muted)';
              return (
                <Fragment key={String(rowKey)}>
                  <tr
                    className={`transition-colors ${rowClassName?.(item, index) ?? ''}`}
                    style={{
                      backgroundColor: isExpanded
                        ? `color-mix(in srgb, ${pageColor} 12%, var(--muted))`
                        : stripeBg,
                      boxShadow: isExpanded ? `inset 4px 0 0 ${pageColor}` : undefined,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--muted)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isExpanded
                        ? `color-mix(in srgb, ${pageColor} 12%, var(--muted))`
                        : stripeBg;
                    }}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-6 py-5 whitespace-nowrap text-sm ${column.className || ''}`}
                        style={{ color: 'var(--foreground)' }}
                      >
                        {column.render ? column.render(item) : (item as any)[column.key]}
                      </td>
                    ))}
                  </tr>
                  {isExpanded && renderExpandedRow ? (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="p-0 align-top"
                        style={{
                          backgroundColor: 'color-mix(in srgb, #3b82f6 9%, var(--card))',
                          borderTop: '2px solid color-mix(in srgb, var(--foreground) 22%, var(--border))',
                          borderBottom: '3px solid color-mix(in srgb, var(--foreground) 28%, var(--border))',
                        }}
                      >
                        <div className="px-3 py-4 sm:px-6 sm:py-5">{renderExpandedRow(item)}</div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {(onPageChange || onPageSizeChange) && renderPagination()}
    </div>
  );
}
