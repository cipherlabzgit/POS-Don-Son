'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import { Save, Loader2, CheckCircle2, Plus } from 'lucide-react';
import { ordersApi, type BulkUpsertOrderItemDto } from '@/lib/api/orders';
import { productsApi, type Product } from '@/lib/api/products';
import { outletsApi, type Outlet } from '@/lib/api/outlets';
import { deliveryTurnsApi, type DeliveryTurn } from '@/lib/api/delivery-turns';
import { dayTypesApi, type DayType } from '@/lib/api/day-types';
import { freezerStocksApi } from '@/lib/api/freezer-stocks';
import { toast } from 'sonner';

interface CellValue { full: number | string; mini: number | string; }
interface OrderGridData { [productId: string]: { [outletId: string]: { [turnId: string]: CellValue } } }
interface ExtraItems    { [productId: string]: { [turnId: string]: CellValue } }

export default function OrderEntryEnhancedPage() {
  const [products,      setProducts]      = useState<Product[]>([]);
  const [outlets,       setOutlets]       = useState<Outlet[]>([]);
  const [deliveryTurns, setDeliveryTurns] = useState<DeliveryTurn[]>([]);
  const [dayTypes,      setDayTypes]      = useState<DayType[]>([]);

  // ── selected turn filter (B2: "select turn first") ──────────────────
  const [selectedTurnId, setSelectedTurnId] = useState<string>('');

  // ── order header fields ──────────────────────────────────────────────
  const [orderNo,                  setOrderNo]                  = useState('');
  const [selectedDate,             setSelectedDate]             = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDate,             setDeliveryDate]             = useState(new Date().toISOString().split('T')[0]);
  const [deliveryTime,             setDeliveryTime]             = useState('10:00');
  const [productionStartingDate,   setProductionStartingDate]   = useState(new Date().toISOString().split('T')[0]);
  const [productionStartingTime,   setProductionStartingTime]   = useState('08:00');
  const [recipeRequestNumber,      setRecipeRequestNumber]      = useState('');
  const [selectedDayTypeId,        setSelectedDayTypeId]        = useState('');
  const [useFreezerStock,          setUseFreezerStock]          = useState(false);
  const [notes,                    setNotes]                    = useState('');

  // ── grid state ───────────────────────────────────────────────────────
  const [orderData,        setOrderData]        = useState<OrderGridData>({});
  const [extras,           setExtras]           = useState<ExtraItems>({});
  const [activeOutlets,    setActiveOutlets]    = useState<Record<string, boolean>>({});
  const [includedProducts, setIncludedProducts] = useState<Record<string, boolean>>({});
  const [freezerBalances,  setFreezerBalances]  = useState<Record<string, number>>({});

  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [isLoading,      setIsLoading]      = useState(true);
  const [isSubmitting,   setIsSubmitting]   = useState(false);

  useEffect(() => { loadInitialData(); }, []);

  useEffect(() => {
    if (products.length > 0 && outlets.length > 0 && deliveryTurns.length > 0) {
      initializeGridData();
    }
  }, [products, outlets, deliveryTurns]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [productsRes, outletsRes, turnsRes, dayTypesRes, freezerRes] = await Promise.all([
        productsApi.getAll(1, 200, undefined, undefined, true),
        outletsApi.getAll(1, 100, undefined, undefined, true),
        deliveryTurnsApi.getAll(1, 100, undefined, true),
        dayTypesApi.getAll(1, 100, undefined, true),
        freezerStocksApi.getAll(1, 500),
      ]);

      setProducts(productsRes.products);
      setOutlets(outletsRes.outlets);
      setDeliveryTurns(turnsRes.deliveryTurns);
      setDayTypes(dayTypesRes.dayTypes);

      // default: select the first turn so the grid starts focused
      if (turnsRes.deliveryTurns.length > 0) {
        setSelectedTurnId(turnsRes.deliveryTurns[0].id);
      }
      if (dayTypesRes.dayTypes.length > 0) {
        setSelectedDayTypeId(dayTypesRes.dayTypes[0].id);
      }

      const balances: Record<string, number> = {};
      for (const fs of freezerRes.freezerStocks) {
        balances[fs.productId] = (balances[fs.productId] ?? 0) + fs.currentStock;
      }
      setFreezerBalances(balances);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const initializeGridData = () => {
    const data:    OrderGridData               = {};
    const extr:    ExtraItems                  = {};
    const actOutl: Record<string, boolean>     = {};
    const incl:    Record<string, boolean>     = {};

    products.forEach((p) => {
      data[p.id] = {};
      extr[p.id] = {};
      incl[p.id] = true;
      outlets.forEach((o) => {
        data[p.id][o.id] = {};
        deliveryTurns.forEach((t) => { data[p.id][o.id][t.id] = { full: '', mini: '' }; });
      });
      deliveryTurns.forEach((t) => { extr[p.id][t.id] = { full: '', mini: '' }; });
    });
    outlets.forEach((o) => { actOutl[o.id] = true; });

    setOrderData(data);
    setExtras(extr);
    setActiveOutlets(actOutl);
    setIncludedProducts(incl);
  };

  // ── derived: turns visible in grid (filtered to selectedTurnId) ─────
  const visibleTurns = useMemo(
    () => selectedTurnId ? deliveryTurns.filter(t => t.id === selectedTurnId) : deliveryTurns,
    [deliveryTurns, selectedTurnId],
  );

  const visibleOutlets = useMemo(
    () => outlets.filter(o => activeOutlets[o.id]),
    [outlets, activeOutlets],
  );

  // ── cell handlers ────────────────────────────────────────────────────
  const handleCellChange = (productId: string, outletId: string, turnId: string, type: 'full' | 'mini', value: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    let v: number | string = value;
    if (value !== '') {
      v = product.allowDecimal ? value : (isNaN(parseInt(value)) ? '' : parseInt(value));
    }
    setOrderData(prev => ({
      ...prev,
      [productId]: { ...prev[productId], [outletId]: { ...prev[productId][outletId], [turnId]: { ...prev[productId][outletId][turnId], [type]: v } } },
    }));
  };

  const handleExtraChange = (productId: string, turnId: string, type: 'full' | 'mini', value: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    let v: number | string = value;
    if (value !== '') {
      v = product.allowDecimal ? value : (isNaN(parseInt(value)) ? '' : parseInt(value));
    }
    setExtras(prev => ({
      ...prev,
      [productId]: { ...prev[productId], [turnId]: { ...prev[productId][turnId], [type]: v } },
    }));
  };

  // ── totals ───────────────────────────────────────────────────────────
  // Total Full/Mini for a product across all ACTIVE outlets for a given turn
  const productTurnTotal = (productId: string, turnId: string, type: 'full' | 'mini'): number => {
    let t = 0;
    visibleOutlets.forEach(o => {
      const v = orderData[productId]?.[o.id]?.[turnId]?.[type];
      if (v !== '' && v !== undefined) t += parseFloat(v.toString()) || 0;
    });
    return t;
  };

  // Column total (all products, one outlet, one turn)
  const outletTurnTotal = (outletId: string, turnId: string, type: 'full' | 'mini'): number => {
    let t = 0;
    products.forEach(p => {
      if (!includedProducts[p.id]) return;
      const v = orderData[p.id]?.[outletId]?.[turnId]?.[type];
      if (v !== '' && v !== undefined) t += parseFloat(v.toString()) || 0;
    });
    return t;
  };

  // ── save / submit ────────────────────────────────────────────────────
  const handleCreateOrder = async () => {
    try {
      setIsSubmitting(true);
      const order = await ordersApi.create({
        orderNo, orderDate: selectedDate, deliveryDate, deliveryTime,
        productionStartingDate, productionStartingTime, recipeRequestNumber,
        dayTypeId: selectedDayTypeId, useFreezerStock, notes,
      });
      setCurrentOrderId(order.id);
      toast.success('Order created — now fill the grid and save items.');
    } catch {
      toast.error('Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveItems = async () => {
    if (!currentOrderId) { toast.error('Please create an order first'); return; }
    try {
      setIsSubmitting(true);
      const items: BulkUpsertOrderItemDto[] = [];

      products.forEach(product => {
        if (!includedProducts[product.id]) return;
        outlets.forEach(outlet => {
          if (!activeOutlets[outlet.id]) return;
          deliveryTurns.forEach(turn => {
            const cell = orderData[product.id]?.[outlet.id]?.[turn.id];
            if (!cell) return;
            const fullQty = parseFloat(cell.full.toString()) || 0;
            const miniQty = parseFloat(cell.mini.toString()) || 0;
            if (fullQty > 0 || miniQty > 0) {
              items.push({ outletId: outlet.id, productId: product.id, deliveryTurnId: turn.id, fullQuantity: fullQty, miniQuantity: miniQty, isExtraItem: false });
            }
          });
        });
        // extras
        deliveryTurns.forEach(turn => {
          const extra = extras[product.id]?.[turn.id];
          if (!extra) return;
          const fullQty = parseFloat(extra.full.toString()) || 0;
          const miniQty = parseFloat(extra.mini.toString()) || 0;
          if (fullQty > 0 || miniQty > 0) {
            items.push({ outletId: outlets[0].id, productId: product.id, deliveryTurnId: turn.id, fullQuantity: fullQty, miniQuantity: miniQty, isExtraItem: true });
          }
        });
      });

      await ordersApi.bulkUpsertItems(currentOrderId, items);
      toast.success(`Saved ${items.length} items.`);
    } catch {
      toast.error('Failed to save order items');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitOrder = async () => {
    if (!currentOrderId) { toast.error('Please create an order first'); return; }
    try {
      setIsSubmitting(true);
      await ordersApi.submit(currentOrderId);
      toast.success('Order submitted!');
    } catch {
      toast.error('Failed to submit order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand-primary)' }} />
          <p style={{ color: 'var(--muted-foreground)' }}>Loading order entry grid...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Order Entry Grid</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Spreadsheet order entry with per-outlet quantities, extras, and totals
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {!currentOrderId ? (
            <Button variant="primary" size="md" onClick={handleCreateOrder} disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : <><Plus className="w-4 h-4 mr-2" />Create Order</>}
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="md" onClick={handleSaveItems} disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save Items</>}
              </Button>
              <Button variant="primary" size="md" onClick={handleSubmitOrder} disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : <><CheckCircle2 className="w-4 h-4 mr-2" />Submit Order</>}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Order configuration ──────────────────────────────────────── */}
      <Card>
        <CardHeader><CardTitle>Order Configuration</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input label="Order Bill No." value={orderNo} onChange={e => setOrderNo(e.target.value)} disabled={!!currentOrderId} fullWidth />
            <Input label="Order Date" type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} disabled={!!currentOrderId} fullWidth />
            <Input label="Delivery Date" type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} disabled={!!currentOrderId} fullWidth />
            <Input label="Delivery Time" type="time" value={deliveryTime} onChange={e => setDeliveryTime(e.target.value)} disabled={!!currentOrderId} fullWidth />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <Input label="Production Start Date" type="date" value={productionStartingDate} onChange={e => setProductionStartingDate(e.target.value)} disabled={!!currentOrderId} fullWidth />
            <Input label="Production Start Time" type="time" value={productionStartingTime} onChange={e => setProductionStartingTime(e.target.value)} disabled={!!currentOrderId} fullWidth />
            <Select label="Day Type" value={selectedDayTypeId} onChange={e => setSelectedDayTypeId(e.target.value)} options={dayTypes.map(dt => ({ value: dt.id, label: dt.name }))} disabled={!!currentOrderId} fullWidth />
            <Input label="Recipe Request No." value={recipeRequestNumber} onChange={e => setRecipeRequestNumber(e.target.value)} disabled={!!currentOrderId} fullWidth />
          </div>
          <div className="mt-4">
            <Input label="Notes" value={notes} onChange={e => setNotes(e.target.value)} disabled={!!currentOrderId} fullWidth />
          </div>
        </CardContent>
      </Card>

      {/* ── Grid toolbar: turn filter + outlet toggles ───────────────── */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle>
              Order Grid
              {selectedTurnId && (
                <span className="ml-2 text-sm font-normal" style={{ color: 'var(--muted-foreground)' }}>
                  — {deliveryTurns.find(t => t.id === selectedTurnId)?.name}
                </span>
              )}
            </CardTitle>

            <div className="flex flex-wrap items-center gap-4">
              {/* Delivery turn selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Delivery Turn:</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSelectedTurnId('')}
                    className="px-2 py-1 text-xs rounded transition-colors"
                    style={{
                      backgroundColor: selectedTurnId === '' ? 'var(--brand-primary)' : 'var(--muted)',
                      color: selectedTurnId === '' ? '#ffffff' : 'var(--muted-foreground)',
                    }}
                  >
                    All
                  </button>
                  {deliveryTurns.map(turn => (
                    <button
                      key={turn.id}
                      onClick={() => setSelectedTurnId(turn.id)}
                      className="px-2 py-1 text-xs rounded transition-colors"
                      style={{
                        backgroundColor: selectedTurnId === turn.id ? 'var(--brand-primary)' : 'var(--muted)',
                        color: selectedTurnId === turn.id ? '#ffffff' : 'var(--muted-foreground)',
                      }}
                    >
                      {turn.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Outlet toggles */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Outlets:</span>
                <div className="flex items-center gap-1 flex-wrap">
                  {outlets.map(outlet => (
                    <button
                      key={outlet.id}
                      onClick={() => setActiveOutlets(prev => ({ ...prev, [outlet.id]: !prev[outlet.id] }))}
                      className="px-2 py-1 text-xs rounded transition-colors"
                      style={{
                        backgroundColor: activeOutlets[outlet.id] ? '#C8102E' : 'var(--muted)',
                        color: activeOutlets[outlet.id] ? '#ffffff' : 'var(--muted-foreground)',
                      }}
                    >
                      {outlet.code || outlet.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="min-w-full divide-y text-xs" style={{ borderColor: 'var(--border)' }}>
              <thead className="sticky top-0 z-20" style={{ backgroundColor: 'var(--muted)' }}>
                {/* Row 1: fixed columns + outlet names (colspan 2 each) + Extra + Total */}
                <tr>
                  <th rowSpan={2} className="sticky left-0 z-30 px-2 py-2 text-left font-medium border-b" style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', minWidth: '90px', borderColor: 'var(--border)' }} title="Product Code">Code</th>
                  <th rowSpan={2} className="sticky left-[90px] z-30 px-2 py-2 text-left font-medium border-b" style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', minWidth: '140px', borderColor: 'var(--border)' }} title="Product Name">Item</th>
                  <th rowSpan={2} className="px-2 py-2 text-center font-medium border-b" style={{ color: 'var(--muted-foreground)', minWidth: '40px', borderColor: 'var(--border)' }} title="Include — check to include this product when saving">Inc</th>
                  <th rowSpan={2} className="px-2 py-2 text-center font-medium border-b" style={{ color: 'var(--muted-foreground)', minWidth: '50px', borderColor: 'var(--border)' }} title="Freezer Balance — current stock available in the freezer">BAL</th>
                  {visibleTurns.map(turn => (
                    <React.Fragment key={turn.id}>
                      {visibleOutlets.map(outlet => (
                        <th
                          key={outlet.id}
                          colSpan={2}
                          className="px-1 py-1 text-center font-medium border-l border-b"
                          style={{ color: 'var(--foreground)', borderColor: 'var(--border)', minWidth: '112px' }}
                          title={outlet.name}
                        >
                          {outlet.code || outlet.name}
                        </th>
                      ))}
                      <th colSpan={2} className="px-1 py-1 text-center font-medium border-l border-b" style={{ color: '#b45309', borderColor: 'var(--input)', backgroundColor: 'var(--dms-notes)' }}>
                        Extra
                      </th>
                      <th colSpan={2} className="px-1 py-1 text-center font-medium border-l border-r border-b" style={{ color: 'var(--foreground)', borderColor: 'var(--input)', backgroundColor: 'var(--muted)' }}>
                        Total
                      </th>
                    </React.Fragment>
                  ))}
                </tr>
                {/* Row 2: Full / Mini sub-headers under each outlet */}
                <tr style={{ backgroundColor: 'var(--muted)' }}>
                  {visibleTurns.map(turn => (
                    <React.Fragment key={turn.id}>
                      {visibleOutlets.map(outlet => (
                        <React.Fragment key={outlet.id}>
                          <th className="px-1 py-1 text-center font-medium border-l" style={{ color: 'var(--muted-foreground)', borderColor: 'var(--border)', minWidth: '56px' }} title={`${outlet.name} — Full quantity`}>
                            Full
                          </th>
                          <th className="px-1 py-1 text-center font-medium" style={{ color: 'var(--muted-foreground)', minWidth: '56px' }} title={`${outlet.name} — Mini quantity`}>
                            Mini
                          </th>
                        </React.Fragment>
                      ))}
                      <th className="px-1 py-1 text-center font-medium border-l" style={{ color: '#b45309', borderColor: 'var(--input)', backgroundColor: 'var(--dms-notes)', minWidth: '56px' }} title="Extra Full — additional factory production quantity (not outlet-specific)">
                        Full
                      </th>
                      <th className="px-1 py-1 text-center font-medium" style={{ color: '#b45309', backgroundColor: 'var(--dms-notes)', minWidth: '56px' }} title="Extra Mini — additional factory production quantity for mini size">
                        Mini
                      </th>
                      <th className="px-1 py-1 text-center font-medium border-l" style={{ color: 'var(--foreground)', borderColor: 'var(--input)', backgroundColor: 'var(--muted)', minWidth: '56px' }} title="Total Full — sum of all outlet Full quantities + Extra Full">
                        Full
                      </th>
                      <th className="px-1 py-1 text-center font-medium border-r" style={{ color: 'var(--foreground)', borderColor: 'var(--input)', backgroundColor: 'var(--muted)', minWidth: '56px' }} title="Total Mini — sum of all outlet Mini quantities + Extra Mini">
                        Mini
                      </th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                {products.map(product => {
                  const included = includedProducts[product.id];
                  return (
                    <tr key={product.id} style={{ opacity: included ? 1 : 0.45 }}>
                      {/* Code */}
                      <td className="sticky left-0 z-10 px-2 py-1 font-mono font-medium text-xs" style={{ color: 'var(--muted-foreground)', backgroundColor: 'var(--card)', minWidth: '90px' }}>
                        {product.code}
                      </td>
                      {/* Name */}
                      <td className="sticky left-[90px] z-10 px-2 py-1 font-medium" style={{ color: 'var(--foreground)', backgroundColor: 'var(--card)', minWidth: '140px' }}>
                        <div className="flex items-center gap-1">
                          <span className="truncate max-w-[130px]" title={product.name}>{product.name}</span>
                          {product.allowDecimal && (
                            <span className="shrink-0 text-xs px-1 rounded" title="Decimal quantities allowed (e.g. 4.75)" style={{ backgroundColor: 'var(--dms-notes)', color: 'var(--dms-notes-title)' }}>DEC</span>
                          )}
                        </div>
                      </td>
                      {/* Inc */}
                      <td className="px-2 py-1 text-center">
                        <input type="checkbox" checked={included} onChange={() => setIncludedProducts(prev => ({ ...prev, [product.id]: !prev[product.id] }))} className="w-3.5 h-3.5" />
                      </td>
                      {/* BAL */}
                      <td className="px-2 py-1 text-center font-medium" style={{ color: (freezerBalances[product.id] ?? 0) > 0 ? 'var(--brand-primary)' : 'var(--muted-foreground)' }}>
                        {freezerBalances[product.id] ?? 0}
                      </td>

                      {visibleTurns.map(turn => (
                        <React.Fragment key={turn.id}>
                          {/* Per-outlet cells */}
                          {visibleOutlets.map(outlet => (
                            <React.Fragment key={outlet.id}>
                              {/* Full — always shown */}
                              <td className="px-0.5 py-0.5 border-l" style={{ borderColor: 'var(--border)' }}>
                                <input
                                  type="number"
                                  step={product.allowDecimal ? '0.01' : '1'}
                                  min="0"
                                  value={orderData[product.id]?.[outlet.id]?.[turn.id]?.full ?? ''}
                                  onChange={e => handleCellChange(product.id, outlet.id, turn.id, 'full', e.target.value)}
                                  onFocus={e => e.target.select()}
                                  disabled={!included}
                                  className="w-14 px-1 py-0.5 text-xs text-center rounded"
                                  style={{ border: '1px solid var(--input)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                                />
                              </td>
                              {/* Mini — only if product has mini size */}
                              <td className="px-0.5 py-0.5">
                                {product.hasMiniSize ? (
                                  <input
                                    type="number"
                                    step={product.allowDecimal ? '0.01' : '1'}
                                    min="0"
                                    value={orderData[product.id]?.[outlet.id]?.[turn.id]?.mini ?? ''}
                                    onChange={e => handleCellChange(product.id, outlet.id, turn.id, 'mini', e.target.value)}
                                    onFocus={e => e.target.select()}
                                    disabled={!included}
                                    className="w-14 px-1 py-0.5 text-xs text-center rounded"
                                    style={{ border: '1px solid var(--input)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                                  />
                                ) : (
                                  <span className="block w-14 text-center text-xs" style={{ color: 'var(--muted-foreground)' }}>—</span>
                                )}
                              </td>
                            </React.Fragment>
                          ))}

                          {/* Extra Full */}
                          <td className="px-0.5 py-0.5 border-l" style={{ borderColor: 'var(--input)' }}>
                            <input
                              type="number"
                              step={product.allowDecimal ? '0.01' : '1'}
                              min="0"
                              value={extras[product.id]?.[turn.id]?.full ?? ''}
                              onChange={e => handleExtraChange(product.id, turn.id, 'full', e.target.value)}
                              onFocus={e => e.target.select()}
                              disabled={!included}
                              className="w-14 px-1 py-0.5 text-xs text-center rounded"
                              style={{ border: '1px solid var(--input)', backgroundColor: 'var(--dms-notes)', color: 'var(--foreground)' }}
                            />
                          </td>
                          {/* Extra Mini */}
                          <td className="px-0.5 py-0.5">
                            {product.hasMiniSize ? (
                              <input
                                type="number"
                                step={product.allowDecimal ? '0.01' : '1'}
                                min="0"
                                value={extras[product.id]?.[turn.id]?.mini ?? ''}
                                onChange={e => handleExtraChange(product.id, turn.id, 'mini', e.target.value)}
                                onFocus={e => e.target.select()}
                                disabled={!included}
                                className="w-14 px-1 py-0.5 text-xs text-center rounded"
                                style={{ border: '1px solid var(--input)', backgroundColor: 'var(--dms-notes)', color: 'var(--foreground)' }}
                              />
                            ) : (
                              <span className="block w-14 text-center text-xs" style={{ color: 'var(--muted-foreground)' }}>—</span>
                            )}
                          </td>

                          {/* Total Full (outlets + extra) */}
                          <td className="px-2 py-1 text-center font-semibold border-l" style={{ borderColor: 'var(--input)', color: 'var(--foreground)', backgroundColor: 'var(--muted)' }}>
                            {(() => {
                              const tot = productTurnTotal(product.id, turn.id, 'full') + (parseFloat((extras[product.id]?.[turn.id]?.full ?? '').toString()) || 0);
                              return product.allowDecimal ? tot.toFixed(product.decimalPlaces || 2) : tot.toFixed(0);
                            })()}
                          </td>
                          {/* Total Mini */}
                          <td className="px-2 py-1 text-center font-semibold border-r" style={{ borderColor: 'var(--input)', color: 'var(--foreground)', backgroundColor: 'var(--muted)' }}>
                            {product.hasMiniSize ? (() => {
                              const tot = productTurnTotal(product.id, turn.id, 'mini') + (parseFloat((extras[product.id]?.[turn.id]?.mini ?? '').toString()) || 0);
                              return product.allowDecimal ? tot.toFixed(product.decimalPlaces || 2) : tot.toFixed(0);
                            })() : '—'}
                          </td>
                        </React.Fragment>
                      ))}
                    </tr>
                  );
                })}
              </tbody>

              {/* Footer: column totals */}
              <tfoot className="sticky bottom-0 z-20" style={{ backgroundColor: 'var(--muted)' }}>
                <tr>
                  <td colSpan={4} className="px-3 py-2 text-xs font-bold" style={{ color: 'var(--foreground)' }}>Totals</td>
                  {visibleTurns.map(turn => (
                    <React.Fragment key={turn.id}>
                      {visibleOutlets.map(outlet => (
                        <React.Fragment key={outlet.id}>
                          <td className="px-2 py-1 text-center font-semibold border-l text-xs" style={{ color: 'var(--foreground)', borderColor: 'var(--border)' }}>
                            {outletTurnTotal(outlet.id, turn.id, 'full').toFixed(0)}
                          </td>
                          <td className="px-2 py-1 text-center font-semibold text-xs" style={{ color: 'var(--foreground)' }}>
                            {outletTurnTotal(outlet.id, turn.id, 'mini').toFixed(0)}
                          </td>
                        </React.Fragment>
                      ))}
                      <td colSpan={4} className="px-2 py-1 text-center text-xs border-l border-r" style={{ color: 'var(--muted-foreground)', borderColor: 'var(--input)' }}>
                        —
                      </td>
                    </React.Fragment>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Info callout */}
      <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--dms-notes)', border: '1px solid var(--dms-notes-border)' }}>
        <p className="text-sm font-medium mb-2" style={{ color: 'var(--dms-notes-title)' }}>How to use:</p>
        <ul className="text-sm space-y-1" style={{ color: 'var(--dms-notes-fg)' }}>
          <li>• Select a <strong>Delivery Turn</strong> to focus the grid on one turn (e.g. 5:00 AM Delivery)</li>
          <li>• Toggle <strong>Outlets</strong> buttons to show/hide outlet columns</li>
          <li>• Products with only a Full variant show <strong>—</strong> in Mini columns</li>
          <li>• Products marked <strong>DEC</strong> accept decimal quantities (e.g. 4.75)</li>
          <li>• <strong>Extra F/M</strong> columns are for factory-only quantities (not outlet-specific)</li>
          <li>• <strong>Total F/M</strong> = sum of all outlet quantities + extra for that product/turn</li>
          <li>• <strong>BAL</strong> = current freezer balance; <strong>Inc</strong> = include product in save</li>
        </ul>
      </div>
    </div>
  );
}
