'use client';

import { useState } from 'react';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import { Plus, XCircle, Edit2, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

export interface Product {
  id: string;
  code: string;
  name: string;
  /** When present (e.g. from products API), used to prefill unit price on selection */
  unitPrice?: number;
}

export interface ItemManagementItem {
  productId: string;
  quantity: number;
  unitPrice?: number;
  reason?: string;
}

interface ItemManagementTableProps {
  products: Product[];
  items: ItemManagementItem[];
  onItemsChange: (items: ItemManagementItem[]) => void;
  showUnitPrice?: boolean;
  showReason?: boolean;
  showTotal?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  primaryColor?: string;
  /** Label for the quantity field and table column (default "Quantity"). */
  quantityLabel?: string;
}

export default function ItemManagementTable({
  products,
  items,
  onItemsChange,
  showUnitPrice = false,
  showReason = false,
  showTotal = true,
  reasonLabel = 'Reason',
  reasonPlaceholder = 'Reason for item',
  primaryColor = '#C8102E',
  quantityLabel = 'Quantity',
}: ItemManagementTableProps) {
  const [currentItem, setCurrentItem] = useState({
    productId: '',
    quantity: '',
    unitPrice: '',
    reason: '',
  });

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editItem, setEditItem] = useState({
    quantity: '',
    unitPrice: '',
    reason: '',
  });

  const handleAddItem = () => {
    if (!currentItem.productId || !currentItem.quantity) {
      toast.error('Please select product and enter quantity');
      return;
    }

    const quantity = parseFloat(currentItem.quantity);
    const unitPrice = showUnitPrice ? parseFloat(currentItem.unitPrice) : 0;

    if (quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    if (showUnitPrice && unitPrice <= 0) {
      toast.error('Unit price must be greater than 0');
      return;
    }

    if (showReason && !currentItem.reason?.trim()) {
      toast.error('Please enter a reason');
      return;
    }

    const existingItem = items.find(item => item.productId === currentItem.productId);
    if (existingItem) {
      toast.error('Product already added. Remove it first to add again.');
      return;
    }

    const newItem: ItemManagementItem = {
      productId: currentItem.productId,
      quantity,
    };

    if (showUnitPrice) newItem.unitPrice = unitPrice;
    if (showReason) newItem.reason = currentItem.reason;

    onItemsChange([...items, newItem]);
    setCurrentItem({ productId: '', quantity: '', unitPrice: '', reason: '' });
    toast.success('Item added');
  };

  const handleRemoveItem = (productId: string) => {
    onItemsChange(items.filter(item => item.productId !== productId));
    setEditingIndex(null);
    toast.success('Item removed');
  };

  const handleEditItem = (index: number) => {
    const item = items[index];
    setEditingIndex(index);
    setEditItem({
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice?.toString() || '',
      reason: item.reason || '',
    });
  };

  const handleSaveEdit = (index: number) => {
    const quantity = parseFloat(editItem.quantity);
    const unitPrice = showUnitPrice ? parseFloat(editItem.unitPrice) : undefined;

    if (quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    if (showUnitPrice && unitPrice && unitPrice <= 0) {
      toast.error('Unit price must be greater than 0');
      return;
    }

    if (showReason && !editItem.reason?.trim()) {
      toast.error('Please enter a reason');
      return;
    }

    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      quantity,
      ...(showUnitPrice && { unitPrice }),
      ...(showReason && { reason: editItem.reason }),
    };

    onItemsChange(updatedItems);
    setEditingIndex(null);
    toast.success('Item updated');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
  };

  const calculateTotals = () => {
    const totalItems = items.length;
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = showUnitPrice
      ? items.reduce((sum, item) => sum + (item.quantity * (item.unitPrice || 0)), 0)
      : 0;
    return { totalItems, totalQuantity, totalValue };
  };

  const { totalItems, totalQuantity, totalValue } = calculateTotals();

  return (
    <div className="space-y-4">
      {/* Add Item Form */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className={showUnitPrice && showReason ? 'md:col-span-3' : showUnitPrice || showReason ? 'md:col-span-4' : 'md:col-span-5'}>
          <Select
            label="Product"
            value={currentItem.productId}
            onChange={(e) => {
              const productId = e.target.value;
              const selected = products.find((p) => p.id === productId);
              setCurrentItem((prev) => ({
                ...prev,
                productId,
                unitPrice: !showUnitPrice
                  ? prev.unitPrice
                  : !productId
                    ? ''
                    : selected?.unitPrice != null && !Number.isNaN(selected.unitPrice)
                      ? String(selected.unitPrice)
                      : '',
              }));
            }}
            options={products.map(p => ({ value: p.id, label: `${p.code} - ${p.name}` }))}
            placeholder="Select product"
            fullWidth
          />
        </div>
        <div className={showUnitPrice && showReason ? 'md:col-span-2' : showUnitPrice || showReason ? 'md:col-span-3' : 'md:col-span-3'}>
          <Input
            label={quantityLabel}
            type="number"
            value={currentItem.quantity}
            onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })}
            placeholder="0"
            fullWidth
            min="0"
            step="0.01"
          />
        </div>
        {showUnitPrice && (
          <div className={showReason ? 'md:col-span-2' : 'md:col-span-3'}>
            <Input
              label="Unit Price"
              type="number"
              value={currentItem.unitPrice}
              onChange={(e) => setCurrentItem({ ...currentItem, unitPrice: e.target.value })}
              placeholder="0.00"
              fullWidth
              min="0"
              step="0.01"
            />
          </div>
        )}
        {showReason && (
          <div className={showUnitPrice ? 'md:col-span-3' : 'md:col-span-3'}>
            <Input
              label={reasonLabel}
              value={currentItem.reason}
              onChange={(e) => setCurrentItem({ ...currentItem, reason: e.target.value })}
              placeholder={reasonPlaceholder}
              fullWidth
            />
          </div>
        )}
        <div className="md:col-span-2 flex items-end">
          <Button
            variant="primary"
            size="md"
            onClick={handleAddItem}
            className="w-full"
            disabled={!currentItem.productId || !currentItem.quantity || (showUnitPrice && !currentItem.unitPrice) || (showReason && !currentItem.reason?.trim())}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>
      </div>

      {/* Items Table */}
      {items.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead style={{ backgroundColor: 'var(--muted)' }}>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Product</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">{quantityLabel}</th>
                {showUnitPrice && <th className="px-4 py-3 text-right text-sm font-semibold">Unit Price</th>}
                {showTotal && showUnitPrice && <th className="px-4 py-3 text-right text-sm font-semibold">Total</th>}
                {showReason && <th className="px-4 py-3 text-left text-sm font-semibold">{reasonLabel}</th>}
                <th className="px-4 py-3 text-center text-sm font-semibold">Action</th>
              </tr>
            </thead>
                    <tbody>
                      {items.map((item, index) => {
                        const product = products.find(p => p.id === item.productId);
                        const itemTotal = showUnitPrice ? item.quantity * (item.unitPrice || 0) : 0;
                        const isEditing = editingIndex === index;
                        
                        return (
                          <tr key={index} className="border-t">
                            <td className="px-4 py-3 text-sm">{product ? `${product.code} - ${product.name}` : 'Unknown'}</td>
                            <td className="px-4 py-3 text-sm text-right">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editItem.quantity}
                                  onChange={(e) => setEditItem({ ...editItem, quantity: e.target.value })}
                                  className="w-20 px-2 py-1 text-right border rounded"
                                  min="0"
                                  step="0.01"
                                />
                              ) : (
                                item.quantity.toFixed(2)
                              )}
                            </td>
                            {showUnitPrice && (
                              <td className="px-4 py-3 text-sm text-right">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editItem.unitPrice}
                                    onChange={(e) => setEditItem({ ...editItem, unitPrice: e.target.value })}
                                    className="w-24 px-2 py-1 text-right border rounded"
                                    min="0"
                                    step="0.01"
                                  />
                                ) : (
                                  `Rs. ${(item.unitPrice || 0).toFixed(2)}`
                                )}
                              </td>
                            )}
                            {showTotal && showUnitPrice && <td className="px-4 py-3 text-sm text-right font-semibold">Rs. {itemTotal.toFixed(2)}</td>}
                            {showReason && (
                              <td className="px-4 py-3 text-sm">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editItem.reason}
                                    onChange={(e) => setEditItem({ ...editItem, reason: e.target.value })}
                                    className="w-full px-2 py-1 border rounded"
                                    placeholder="Reason"
                                  />
                                ) : (
                                  item.reason || '-'
                                )}
                              </td>
                            )}
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {isEditing ? (
                                  <>
                                    <button
                                      onClick={() => handleSaveEdit(index)}
                                      className="text-green-600 hover:text-green-800"
                                      title="Save"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={handleCancelEdit}
                                      className="text-gray-600 hover:text-gray-800"
                                      title="Cancel"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleEditItem(index)}
                                      className="text-blue-600 hover:text-blue-800"
                                      title="Edit"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleRemoveItem(item.productId)}
                                      className="text-red-600 hover:text-red-800"
                                      title="Remove"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
            </tbody>
            {showTotal && (
              <tfoot className="border-t" style={{ backgroundColor: 'var(--muted)' }}>
                <tr>
                  <td className="px-4 py-3 text-sm font-bold">Total</td>
                  <td className="px-4 py-3 text-sm text-right font-bold">{totalQuantity.toFixed(2)}</td>
                  {showUnitPrice && <td className="px-4 py-3"></td>}
                  {showUnitPrice && (
                    <td className="px-4 py-3 text-sm text-right font-bold" style={{ color: primaryColor }}>
                      Rs. {totalValue.toFixed(2)}
                    </td>
                  )}
                  {showReason && <td className="px-4 py-3"></td>}
                  <td className="px-4 py-3 text-sm text-center text-muted-foreground">{totalItems} items</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      ) : (
        <div className="text-center py-8 border rounded-lg" style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}>
          <p>No items added yet. Add products above.</p>
        </div>
      )}
    </div>
  );
}
