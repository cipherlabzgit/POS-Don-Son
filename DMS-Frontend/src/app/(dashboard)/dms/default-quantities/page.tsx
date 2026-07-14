'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { Save, RotateCcw, Loader2 } from 'lucide-react';
import { defaultQuantitiesApi, type BulkUpsertDefaultQuantityDto } from '@/lib/api/default-quantities';
import { productsApi, type Product } from '@/lib/api/products';
import { outletsApi, type Outlet } from '@/lib/api/outlets';
import { dayTypesApi, type DayType } from '@/lib/api/day-types';
import { toast } from 'sonner';

export default function DefaultQuantitiesPage() {
  const [dayTypes, setDayTypes] = useState<DayType[]>([]);
  const [selectedDayType, setSelectedDayType] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [quantities, setQuantities] = useState<{ [productId: string]: { [outletId: string]: { full: number; mini: number; id?: string } } }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedDayType && products.length > 0 && outlets.length > 0) {
      loadDefaultQuantities();
    }
  }, [selectedDayType]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [dayTypesRes, productsRes, outletsRes] = await Promise.all([
        dayTypesApi.getAll(1, 100, undefined, true),
        productsApi.getAll(1, 100, undefined, undefined, true),
        outletsApi.getAll(1, 100, undefined, undefined, true),
      ]);

      setDayTypes(dayTypesRes.dayTypes);
      setProducts(productsRes.products);
      setOutlets(outletsRes.outlets);

      if (dayTypesRes.dayTypes.length > 0) {
        setSelectedDayType(dayTypesRes.dayTypes[0].id);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDefaultQuantities = async () => {
    try {
      const response = await defaultQuantitiesApi.getAll(1, 1000, undefined, selectedDayType);
      
      const quantitiesMap: { [productId: string]: { [outletId: string]: { full: number; mini: number; id?: string } } } = {};
      
      products.forEach(product => {
        quantitiesMap[product.id] = {};
        outlets.forEach(outlet => {
          quantitiesMap[product.id][outlet.id] = { full: 0, mini: 0 };
        });
      });

      response.defaultQuantities.forEach(dq => {
        if (quantitiesMap[dq.productId] && quantitiesMap[dq.productId][dq.outletId]) {
          quantitiesMap[dq.productId][dq.outletId] = {
            full: dq.fullQuantity,
            mini: dq.miniQuantity,
            id: dq.id,
          };
        }
      });

      setQuantities(quantitiesMap);
    } catch (error) {
      console.error('Error loading default quantities:', error);
      toast.error('Failed to load default quantities');
    }
  };

  const handleQuantityChange = (productId: string, outletId: string, type: 'full' | 'mini', value: string) => {
    const numValue = value === '' ? 0 : parseInt(value) || 0;
    setQuantities(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [outletId]: {
          ...prev[productId]?.[outletId] || { full: 0, mini: 0 },
          [type]: numValue,
        },
      },
    }));
  };

  const handleSave = async () => {
    if (!selectedDayType) {
      toast.error('Please select a day type');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const bulkData: BulkUpsertDefaultQuantityDto[] = [];
      
      products.forEach(product => {
        outlets.forEach(outlet => {
          const qty = quantities[product.id]?.[outlet.id];
          if (qty) {
            bulkData.push({
              id: qty.id,
              outletId: outlet.id,
              dayTypeId: selectedDayType,
              productId: product.id,
              fullQuantity: qty.full,
              miniQuantity: qty.mini,
            });
          }
        });
      });

      await defaultQuantitiesApi.bulkUpsert(bulkData);
      
      toast.success('Default quantities saved successfully!');
      
      await loadDefaultQuantities();
    } catch (error) {
      console.error('Error saving default quantities:', error);
      toast.error('Failed to save default quantities');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all quantities to zero?')) {
      const resetQtys: { [productId: string]: { [outletId: string]: { full: number; mini: number; id?: string } } } = {};
      products.forEach(product => {
        resetQtys[product.id] = {};
        outlets.forEach(outlet => {
          const existingId = quantities[product.id]?.[outlet.id]?.id;
          resetQtys[product.id][outlet.id] = { full: 0, mini: 0, id: existingId };
        });
      });
      setQuantities(resetQtys);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand-primary)' }} />
          <p style={{ color: 'var(--muted-foreground)' }}>Loading default quantities...</p>
        </div>
      </div>
    );
  }

  const selectedDayTypeName = dayTypes.find(dt => dt.id === selectedDayType)?.name || '';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Default Quantities Management</h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>Configure default outlet quantities per day type</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="md" onClick={handleReset} disabled={isSubmitting}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button variant="primary" size="md" onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Defaults
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {dayTypes.map((dayType) => (
          <button
            key={dayType.id}
            onClick={() => setSelectedDayType(dayType.id)}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: selectedDayType === dayType.id ? 'var(--brand-primary)' : 'var(--dms-pill-off-bg)',
              color: selectedDayType === dayType.id ? '#ffffff' : 'var(--dms-pill-off-fg)',
              border: `2px solid ${selectedDayType === dayType.id ? 'var(--brand-primary)' : 'var(--dms-pill-off-border)'}`,
              opacity: isSubmitting ? 0.6 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            {dayType.name}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{selectedDayTypeName} Default Quantities - {products.length} Products × {outlets.length} Outlets</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y" style={{ borderColor: 'var(--border)' }}>
              <thead style={{ backgroundColor: 'var(--muted)' }}>
                <tr>
                  <th className="sticky left-0 z-10 px-4 py-3 text-left text-xs font-medium" style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', minWidth: '200px' }}>Product</th>
                  <th className="px-3 py-3 text-left text-xs font-medium" style={{ color: 'var(--muted-foreground)', minWidth: '80px' }}>Code</th>
                  
                  {outlets.map(outlet => (
                    <th key={outlet.id} colSpan={2} className="px-3 py-3 text-center text-xs font-medium border-l" style={{ color: 'var(--muted-foreground)', borderColor: 'var(--input)', minWidth: '120px' }}>
                      {outlet.name}
                    </th>
                  ))}
                </tr>
                <tr style={{ backgroundColor: 'var(--muted)' }}>
                  <th colSpan={2}></th>
                  {outlets.map(outlet => (
                    <>
                      <th key={`${outlet.id}-f`} className="px-2 py-2 text-center text-xs" style={{ color: 'var(--muted-foreground)' }}>Full</th>
                      <th key={`${outlet.id}-m`} className="px-2 py-2 text-center text-xs border-r" style={{ color: 'var(--muted-foreground)', borderColor: 'var(--input)' }}>Mini</th>
                    </>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="sticky left-0 z-10 px-4 py-2 text-sm font-medium" style={{ color: 'var(--foreground)', backgroundColor: 'var(--card)' }}>{product.name}</td>
                    <td className="px-3 py-2 text-sm font-mono" style={{ color: 'var(--muted-foreground)' }}>{product.code}</td>
                    
                    {outlets.map(outlet => (
                      <>
                        <td key={`${product.id}-${outlet.id}-f`} className="px-1 py-1">
                          <input
                            type="number"
                            min="0"
                            value={quantities[product.id]?.[outlet.id]?.full || 0}
                            onChange={(e) => handleQuantityChange(product.id, outlet.id, 'full', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            disabled={isSubmitting}
                            className="w-full px-2 py-1 text-sm text-center rounded"
                            style={{ border: '1px solid var(--input)', backgroundColor: 'var(--background)', color: 'var(--foreground)', opacity: isSubmitting ? 0.6 : 1 }}
                          />
                        </td>
                        <td key={`${product.id}-${outlet.id}-m`} className="px-1 py-1 border-r" style={{ borderColor: 'var(--input)' }}>
                          <input
                            type="number"
                            min="0"
                            value={quantities[product.id]?.[outlet.id]?.mini || 0}
                            onChange={(e) => handleQuantityChange(product.id, outlet.id, 'mini', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            disabled={isSubmitting}
                            className="w-full px-2 py-1 text-sm text-center rounded"
                            style={{ border: '1px solid var(--input)', backgroundColor: 'var(--background)', color: 'var(--foreground)', opacity: isSubmitting ? 0.6 : 1 }}
                          />
                        </td>
                      </>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--dms-success-callout)', border: '1px solid var(--dms-success-border)' }}>
        <p className="text-sm font-medium mb-2" style={{ color: 'var(--dms-success-text)' }}>How it works:</p>
        <ul className="text-sm space-y-1" style={{ color: 'var(--dms-success-text)' }}>
          <li>• Configure default quantities for each day type (Weekday, Saturday, Sunday, Holiday)</li>
          <li>• When creating a delivery plan, quantities will auto-load based on the selected day type</li>
          <li>• You can still modify quantities after auto-loading in the Order Entry Grid</li>
          <li>• Click <strong>Save Defaults</strong> to save your changes for the selected day type</li>
        </ul>
      </div>
    </div>
  );
}
