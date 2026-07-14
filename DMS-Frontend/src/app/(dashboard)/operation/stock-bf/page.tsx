'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { InlineDetailPanel } from '@/components/ui/inline-detail-panel';
import { Plus, Search, Edit, Eye, EyeOff, Info, Loader2, Trash2, CheckCircle2, XCircle, Clock, AlertCircle, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { stockBfApi, type StockBFGroup } from '@/lib/api/stock-bf';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useThemeStore } from '@/lib/stores/theme-store';
import { isAdminUser } from '@/lib/date-restrictions';
import { usePermissions } from '@/hooks/usePermissions';
import { ProtectedPage } from '@/components/auth';
import toast from 'react-hot-toast';
import { formatSlDate, formatSlDateTime } from '@/lib/sri-lanka-time';

export default function StockBFPage() {
  return (
    <ProtectedPage permission="operation:stock-bf:view">
      <StockBFPageContent />
    </ProtectedPage>
  );
}

function StockBFPageContent() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { canAction } = usePermissions();
  const canCreate = canAction('/operation/stock-bf', 'create');
  const canEditBf = canAction('/operation/stock-bf', 'edit');
  const canDeleteBf = canAction('/operation/stock-bf', 'delete');
  const isAdmin = isAdminUser(user);
  const pageTheme = useThemeStore((s) => s.getPageTheme('stock-bf'));

  const [stockBFGroups, setStockBFGroups] = useState<StockBFGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<StockBFGroup | null>(null);
  const [showPreviousRecords, setShowPreviousRecords] = useState(false);
  const [editingGroup, setEditingGroup] = useState<StockBFGroup | null>(null);
  const [editedItems, setEditedItems] = useState<{ [key: string]: number }>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchStockBFs();
  }, [currentPage, pageSize, showPreviousRecords, isAdmin]);

  const fetchStockBFs = async () => {
    try {
      setIsLoading(true);
      const response = await stockBfApi.getAll(currentPage, pageSize, {
        showPreviousRecords: !isAdmin && showPreviousRecords,
        grouped: true,
      }) as any;
      setStockBFGroups(response.groups || []);
      setTotalPages(response.totalPages || 1);
      setTotalCount(response.totalCount ?? response.groups?.length ?? 0);
    } catch (error: any) {
      const isNetwork =
        error?.code === 'ERR_NETWORK' || error?.message === 'Network Error';
      toast.error(
        isNetwork
          ? 'Could not connect to the server. Check your connection and try again.'
          : error.response?.data?.message || 'Failed to load stock BF records'
      );
      setStockBFGroups([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStockBFGroups = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return stockBFGroups;
    return stockBFGroups.filter((g) => {
      return (
        g.outletCode.toLowerCase().includes(q) ||
        g.outletName.toLowerCase().includes(q) ||
        g.items.some(item => 
          (item.productName || '').toLowerCase().includes(q) ||
          (item.product?.code || '').toLowerCase().includes(q) ||
          (item.bfNo || '').toLowerCase().includes(q)
        )
      );
    });
  }, [stockBFGroups, searchTerm]);

  const paginatedStockBFGroups = filteredStockBFGroups;

  const handleDeleteGroup = async (group: StockBFGroup) => {
    if (!confirm(`Are you sure you want to delete this stock BF with ${group.itemCount} item(s)?`)) return;
    
    try {
      await Promise.all(group.items.map(item => stockBfApi.delete(item.id)));
      toast.success('Stock BF deleted successfully');
      fetchStockBFs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete stock BF');
    }
  };

  const handleEditGroup = (group: StockBFGroup) => {
    setSelectedGroup(group);
    setEditingGroup(group);
    // Initialize edited quantities
    const initialQuantities: { [key: string]: number } = {};
    group.items.forEach(item => {
      initialQuantities[item.id] = item.quantity;
    });
    setEditedItems(initialQuantities);
  };

  const handleCancelEdit = () => {
    setEditingGroup(null);
    setEditedItems({});
    setSelectedGroup(null);
  };

  const handleSaveEdit = async () => {
    if (!editingGroup || isSaving) return;

    // Validation
    for (const item of editingGroup.items) {
      const quantity = editedItems[item.id] !== undefined ? editedItems[item.id] : item.quantity;
      if (quantity <= 0) {
        toast.error(`Quantity for ${item.productName} must be greater than 0`);
        return;
      }
    }

    try {
      setIsSaving(true);
      // Update each item that has changed
      const updatePromises = editingGroup.items
        .filter(item => {
          const newQty = editedItems[item.id] !== undefined ? editedItems[item.id] : item.quantity;
          return newQty !== item.quantity;
        })
        .map(item =>
          stockBfApi.update(item.id, {
            productId: item.productId,
            quantity: editedItems[item.id] !== undefined ? editedItems[item.id] : item.quantity,
            bfDate: editingGroup.bfDate,
          })
        );

      if (updatePromises.length === 0) {
        toast('No changes to save', { icon: 'ℹ️' });
        setEditingGroup(null);
        setEditedItems({});
        setSelectedGroup(null);
        setIsSaving(false);
        return;
      }

      await Promise.all(updatePromises);
      toast.success('Stock B/F updated successfully');
      setEditingGroup(null);
      setEditedItems({});
      setSelectedGroup(null);
      fetchStockBFs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update Stock B/F');
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuantityChange = (itemId: string, value: string) => {
    const numValue = value === '' ? 0 : Number.parseFloat(value);
    if (!Number.isNaN(numValue)) {
      setEditedItems(prev => ({ ...prev, [itemId]: numValue }));
    }
  };

  const renderStockBfStatus = (status: string, hasMixedStatus?: boolean) => {
    if (hasMixedStatus) {
      return (
        <Badge variant="neutral" size="sm">
          <AlertCircle className="mr-1 h-3 w-3" />
          Mixed
        </Badge>
      );
    }
    
    const s = status === 'Active' ? 'Approved' : status;
    const label =
      s === 'Pending'
        ? 'Pending'
        : s === 'Approved'
          ? 'Approved'
          : s === 'Rejected'
            ? 'Rejected'
            : s === 'Adjusted'
              ? 'Adjusted'
              : status;
    let variant: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' = 'neutral';
    if (s === 'Pending') variant = 'warning';
    else if (s === 'Approved') variant = 'success';
    else if (s === 'Rejected') variant = 'danger';
    else if (s === 'Adjusted') variant = 'warning';
    return (
      <Badge variant={variant} size="sm">
        {s === 'Pending' && <Clock className="mr-1 h-3 w-3" />}
        {(s === 'Approved' || status === 'Active') && <CheckCircle2 className="mr-1 h-3 w-3" />}
        {s === 'Rejected' && <XCircle className="mr-1 h-3 w-3" />}
        {s === 'Adjusted' && <AlertCircle className="mr-1 h-3 w-3" />}
        {label}
      </Badge>
    );
  };

  const formatApproverCell = (group: StockBFGroup) => {
    const st = group.status === 'Active' ? 'Approved' : group.status;
    if (st === 'Approved' && group.approvedByName) {
      const d = group.approvedDate ? formatSlDate(group.approvedDate) : '';
      return (
        <span className="text-sm">
          {d ? `${group.approvedByName} — ${d}` : group.approvedByName}
        </span>
      );
    }
    if (st === 'Rejected' && group.rejectedByName) {
      const d = group.rejectedDate ? formatSlDate(group.rejectedDate) : '';
      return (
        <span className="text-sm">
          {d ? `${group.rejectedByName} — ${d}` : group.rejectedByName}
        </span>
      );
    }
    return <span className="text-sm">-</span>;
  };

  const openViewStockBF = async (group: StockBFGroup) => {
    if (selectedGroup?.groupId === group.groupId) {
      closeViewPanel();
      return;
    }
    setSelectedGroup(group);
  };

  const closeViewPanel = () => {
    setSelectedGroup(null);
    setEditingGroup(null);
    setEditedItems({});
  };

  const columns = [
    {
      key: 'bfDate',
      label: 'Date',
      render: (group: StockBFGroup) => (
        <span className="font-medium">{formatSlDate(group.bfDate)}</span>
      ),
    },
    {
      key: 'outlet',
      label: 'Outlet',
      render: (group: StockBFGroup) => (
        <span className="font-medium">{group.outletCode || '-'}</span>
      ),
    },
    {
      key: 'showroom',
      label: 'Showroom',
      render: (group: StockBFGroup) => (
        <span className="font-medium">{group.outletName || '-'}</span>
      ),
    },
    {
      key: 'items',
      label: 'Items',
      render: (group: StockBFGroup) => (
        <span className="text-sm font-medium">{group.itemCount} product{group.itemCount !== 1 ? 's' : ''}</span>
      ),
    },
    {
      key: 'quantity',
      label: 'Total Qty',
      render: (group: StockBFGroup) => (
        <span className="text-sm font-medium">{group.totalQuantity}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (group: StockBFGroup) => renderStockBfStatus(group.status, group.hasMixedStatus),
    },
    {
      key: 'editUser',
      label: 'Edit User',
      render: (group: StockBFGroup) => (
        <span className="text-sm">{group.updatedByName || '-'}</span>
      ),
    },
    {
      key: 'editDate',
      label: 'Edit Date',
      render: (group: StockBFGroup) => (
        <span className="text-sm">{formatSlDateTime(group.updatedAt)}</span>
      ),
    },
    {
      key: 'approvedBy',
      label: 'Approved/Rejected By',
      render: (group: StockBFGroup) => formatApproverCell(group),
    },
    {
      key: 'actions',
      label: '',
      render: (group: StockBFGroup) => (
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => openViewStockBF(group)}
            className="rounded p-1.5 transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F9FAFB';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title={selectedGroup?.groupId === group.groupId ? 'Hide details' : 'View details'}
          >
            {selectedGroup?.groupId === group.groupId ? (
              <Eye className="h-4 w-4" aria-hidden />
            ) : (
              <EyeOff className="h-4 w-4" aria-hidden />
            )}
          </button>
          {canEditBf && group.status?.toLowerCase() === 'pending' && !group.hasMixedStatus && (
            <button
              type="button"
              onClick={() => handleEditGroup(group)}
              className="rounded p-1.5 transition-colors"
              style={{ color: 'var(--muted-foreground)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F9FAFB';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
          {canDeleteBf && group.status?.toLowerCase() === 'pending' && !group.hasMixedStatus && (
            <button
              type="button"
              onClick={() => handleDeleteGroup(group)}
              className="rounded p-1.5 transition-colors"
              style={{ color: '#DC2626' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FEF2F2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            Stock B/F
          </h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            {searchTerm.trim()
              ? `Opening stock balances (${filteredStockBFGroups.length} matching in view)`
              : `Opening stock balances (${totalCount} record${totalCount === 1 ? '' : 's'} in view)`}
          </p>
          <div className="mt-2">
            <Badge variant={isAdmin ? 'primary' : 'neutral'} size="sm">
              <Info className="mr-1 h-3 w-3" />
              {isAdmin
                ? 'Admin: All records visible. Any date allowed.'
                : 'You see your own records. Back date up to 3 days.'}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {!isAdmin && (
            <Button
              variant={showPreviousRecords ? 'primary' : 'secondary'}
              size="md"
              onClick={() => {
                setShowPreviousRecords(!showPreviousRecords);
                setCurrentPage(1);
              }}
            >
              {showPreviousRecords ? 'Hide Previous Records' : 'Show Previous Records'}
            </Button>
          )}
          {canCreate && (
            <Button variant="primary" size="md" onClick={() => router.push('/operation/stock-bf/add')}>
              <Plus className="mr-2 h-4 w-4" />
              Add stock B/F
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <CardTitle>Stock B/F list</CardTitle>
              <p className="mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                History closing balance
              </p>
            </div>
            <div className="relative w-full sm:w-auto">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform"
                style={{ color: 'var(--muted-foreground)' }}
              />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search records"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoComplete="off"
                className="w-full rounded-lg py-2 pr-4 pl-10 text-sm sm:w-64"
                style={{ border: '1px solid var(--input)' }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
            </div>
          ) : (
            <DataTable
              data={paginatedStockBFGroups}
              columns={columns}
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              expandedRowKey={selectedGroup?.groupId ?? null}
              getRowKey={(row) => row.groupId}
              renderExpandedRow={() =>
                selectedGroup ? (
                  <InlineDetailPanel
                    title={editingGroup?.groupId === selectedGroup.groupId ? "Edit Stock BF" : "Stock BF Details"}
                    open
                    onClose={closeViewPanel}
                    contentClassName="max-w-[min(100%,80rem)] w-full"
                    footer={
                      editingGroup?.groupId === selectedGroup.groupId ? (
                        <div className="flex space-x-2">
                          <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
                            Cancel
                          </Button>
                          <Button variant="primary" onClick={handleSaveEdit} disabled={isSaving} isLoading={isSaving}>
                            <Save className="h-4 w-4 mr-2" />
                            {isSaving ? 'Saving...' : 'Save Changes'}
                          </Button>
                        </div>
                      ) : (
                        <Button variant="ghost" onClick={closeViewPanel}>
                          Close
                        </Button>
                      )
                    }
                  >
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>BF Date</p>
                          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{formatSlDate(selectedGroup.bfDate)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Status</p>
                          {renderStockBfStatus(selectedGroup.status, selectedGroup.hasMixedStatus)}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Showroom</p>
                        <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                          {selectedGroup.outletCode ?? '-'}{' '}
                          {selectedGroup.outletName ? (
                            <span style={{ color: 'var(--muted-foreground)' }}>
                              ({selectedGroup.outletName})
                            </span>
                          ) : null}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium mb-2" style={{ color: 'var(--muted-foreground)' }}>
                          Products ({selectedGroup.itemCount})
                        </p>
                        <div className="rounded-lg border overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
                          <table className="w-full text-sm">
                            <thead>
                              <tr style={{ backgroundColor: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                                <th className="text-left px-3 py-2 font-medium">BF No</th>
                                <th className="text-left px-3 py-2 font-medium">Product</th>
                                <th className="text-right px-3 py-2 font-medium">Quantity</th>
                                <th className="text-left px-3 py-2 font-medium">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedGroup.items.map((item) => {
                                return (
                                  <tr
                                    key={item.id}
                                    style={{
                                      borderBottom: '1px solid var(--border)',
                                    }}
                                  >
                                    <td className="px-3 py-2 font-mono font-semibold align-middle" style={{ color: pageTheme?.secondaryColor || '#C8102E' }}>
                                      {item.bfNo}
                                    </td>
                                    <td className="px-3 py-2 align-middle">
                                      {item.product?.code ? `${item.product.code} · ` : ''}
                                      {item.productName || item.product?.name || '-'}
                                    </td>
                                    <td className="px-3 py-2 text-right align-middle font-medium">
                                      {editingGroup?.groupId === selectedGroup.groupId ? (
                                        <Input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          value={editedItems[item.id] !== undefined ? editedItems[item.id] : item.quantity}
                                          onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                          className="w-24 text-right"
                                        />
                                      ) : (
                                        item.quantity
                                      )}
                                    </td>
                                    <td className="px-3 py-2 align-middle">
                                      {renderStockBfStatus(item.status)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            {selectedGroup.items.length > 1 && (
                              <tfoot>
                                <tr style={{ borderTop: '2px solid var(--border)', backgroundColor: 'var(--background)' }}>
                                  <td colSpan={2} className="px-3 py-2 text-right font-medium" style={{ color: 'var(--muted-foreground)' }}>
                                    Total quantity
                                  </td>
                                  <td className="px-3 py-2 text-right font-semibold">
                                    {editingGroup?.groupId === selectedGroup.groupId
                                      ? selectedGroup.items.reduce((sum, item) => {
                                          const qty = editedItems[item.id] !== undefined ? editedItems[item.id] : item.quantity;
                                          return sum + qty;
                                        }, 0)
                                      : selectedGroup.totalQuantity}
                                  </td>
                                  <td />
                                </tr>
                              </tfoot>
                            )}
                          </table>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                        <div>
                          <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Edit User</p>
                          <p className="text-sm">{selectedGroup.updatedByName || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Edit Date</p>
                          <p className="text-sm">{formatSlDateTime(selectedGroup.updatedAt)}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Approved/Rejected By</p>
                        <div className="text-sm">{formatApproverCell(selectedGroup)}</div>
                      </div>
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Created</p>
                        <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                          {selectedGroup.createdByName || '-'} · {formatSlDateTime(selectedGroup.createdAt)}
                        </p>
                      </div>
                    </div>
                  </InlineDetailPanel>
                ) : null
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
