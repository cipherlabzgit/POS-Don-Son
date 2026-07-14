// Mock data for DMS Order & Delivery modules

export interface Outlet {
  id: number;
  code: string;
  name: string;
  active: boolean;
  sortOrder: number;
}

export interface OrderProduct {
  id: number;
  code: string;
  name: string;
  hasFull: boolean;
  hasMini: boolean;
  hasMultiTurn: boolean;
  allowDecimal: boolean;
  freezerBalance: number;
  isIncluded: boolean;
  isCustomized: boolean;
}

export interface OrderEntry {
  productId: number;
  full: { [outletId: number]: number };
  mini: { [outletId: number]: number };
  extraFull: number;
  extraMini: number;
  totalFull: number;
  totalMini: number;
  freezerBalance: number;
}

export interface DeliveryPlan {
  id: number;
  planNo: string;
  planDate: string;
  dayType: 'Weekday' | 'Saturday' | 'Sunday' | 'Holiday' | 'Special Event';
  deliveryTurn: '5:00 AM' | '10:30 AM' | '3:30 PM';
  status: 'Draft' | 'Confirmed' | 'InProduction' | 'Delivered';
  createdBy: string;
  createdAt: string;
}

export interface ImmediateOrder {
  id: number;
  orderNo: string;
  orderDate: string;
  productId: number;
  productCode: string;
  productName: string;
  qtyFull: number;
  qtyMini: number;
  isCustomized: boolean;
  customizationNotes?: string;
  status: 'Pending' | 'Confirmed' | 'Cancelled';
  requestedBy: string;
  deliveryPlanId?: number;
}

export interface DefaultQuantity {
  productId: number;
  dayType: 'Weekday' | 'Saturday' | 'Sunday' | 'Holiday';
  outletId: number;
  qtyFull: number;
  qtyMini: number;
}

export const mockOutlets: Outlet[] = [
  { id: 1, code: 'DLM', name: 'Dalmeny', active: true, sortOrder: 1 },
  { id: 2, code: 'RGM', name: 'Ragama', active: true, sortOrder: 2 },
  { id: 3, code: 'RNL', name: 'Ranala', active: true, sortOrder: 3 },
  { id: 4, code: 'DHW', name: 'Dehiwala', active: true, sortOrder: 4 },
  { id: 5, code: 'KDW', name: 'Kaduwela', active: true, sortOrder: 5 },
  { id: 6, code: 'MLG', name: 'Maligawatta', active: true, sortOrder: 6 },
  { id: 7, code: 'PTL', name: 'Pettah', active: true, sortOrder: 7 },
  { id: 8, code: 'KND', name: 'Kandy', active: true, sortOrder: 8 },
  { id: 9, code: 'GLM', name: 'Galle', active: true, sortOrder: 9 },
  { id: 10, code: 'MTR', name: 'Matara', active: true, sortOrder: 10 },
  { id: 11, code: 'KLT', name: 'Kalutara', active: true, sortOrder: 11 },
  { id: 12, code: 'NGM', name: 'Negombo', active: true, sortOrder: 12 },
  { id: 13, code: 'ANP', name: 'Anuradhapura', active: true, sortOrder: 13 },
  { id: 14, code: 'JFN', name: 'Jaffna', active: true, sortOrder: 14 },
];

export const mockOrderProducts: OrderProduct[] = [
  { id: 1, code: 'BR2', name: 'Sandwich Bread Large', hasFull: true, hasMini: true, hasMultiTurn: false, allowDecimal: false, freezerBalance: 45, isIncluded: true, isCustomized: false },
  { id: 2, code: 'BR3', name: 'Sandwich Bread Small', hasFull: true, hasMini: false, hasMultiTurn: false, allowDecimal: false, freezerBalance: 30, isIncluded: true, isCustomized: false },
  { id: 3, code: 'BR8', name: 'Milk Bread', hasFull: true, hasMini: true, hasMultiTurn: false, allowDecimal: false, freezerBalance: 25, isIncluded: true, isCustomized: false },
  { id: 4, code: 'BR10', name: 'Butter Bread', hasFull: true, hasMini: false, hasMultiTurn: false, allowDecimal: false, freezerBalance: 20, isIncluded: true, isCustomized: false },
  { id: 5, code: 'BU10', name: 'Vegetable Bun', hasFull: true, hasMini: true, hasMultiTurn: true, allowDecimal: false, freezerBalance: 60, isIncluded: true, isCustomized: false },
  { id: 6, code: 'BU12', name: 'Fish Bun', hasFull: true, hasMini: true, hasMultiTurn: true, allowDecimal: false, freezerBalance: 50, isIncluded: true, isCustomized: false },
  { id: 7, code: 'BU15', name: 'Chicken Bun', hasFull: true, hasMini: true, hasMultiTurn: true, allowDecimal: false, freezerBalance: 55, isIncluded: true, isCustomized: false },
  { id: 8, code: 'PZ5', name: 'Vegetable Pizza Small', hasFull: true, hasMini: false, hasMultiTurn: false, allowDecimal: false, freezerBalance: 12, isIncluded: true, isCustomized: false },
  { id: 9, code: 'PZ8', name: 'Chicken Pizza Large', hasFull: true, hasMini: false, hasMultiTurn: false, allowDecimal: false, freezerBalance: 8, isIncluded: true, isCustomized: false },
  { id: 10, code: 'RT2', name: 'Chicken Rotty', hasFull: true, hasMini: false, hasMultiTurn: false, allowDecimal: false, freezerBalance: 35, isIncluded: true, isCustomized: false },
];

export const mockDeliveryPlans: DeliveryPlan[] = [
  { id: 1, planNo: 'DP-2026-001', planDate: '2026-04-22', dayType: 'Weekday', deliveryTurn: '5:00 AM', status: 'Draft', createdBy: 'admin', createdAt: '2026-04-21 14:30' },
  { id: 2, planNo: 'DP-2026-002', planDate: '2026-04-21', dayType: 'Weekday', deliveryTurn: '5:00 AM', status: 'InProduction', createdBy: 'admin', createdAt: '2026-04-20 16:00' },
  { id: 3, planNo: 'DP-2026-003', planDate: '2026-04-20', dayType: 'Sunday', deliveryTurn: '5:00 AM', status: 'Delivered', createdBy: 'admin', createdAt: '2026-04-19 15:45' },
];

export const mockImmediateOrders: ImmediateOrder[] = [
  { id: 1, orderNo: 'IO-2026-001', orderDate: '2026-04-21', productId: 9, productCode: 'PZ8', productName: 'Chicken Pizza Large', qtyFull: 10, qtyMini: 0, isCustomized: false, status: 'Pending', requestedBy: 'cashier1' },
  { id: 2, orderNo: 'IO-2026-002', orderDate: '2026-04-21', productId: 1, productCode: 'BR2', productName: 'Sandwich Bread Large', qtyFull: 5, qtyMini: 3, isCustomized: true, customizationNotes: 'Extra soft, no crust', status: 'Confirmed', requestedBy: 'cashier2', deliveryPlanId: 2 },
  { id: 3, orderNo: 'IO-2026-003', orderDate: '2026-04-20', productId: 7, productCode: 'BU15', productName: 'Chicken Bun', qtyFull: 20, qtyMini: 10, isCustomized: false, status: 'Confirmed', requestedBy: 'cashier1', deliveryPlanId: 3 },
];

export const mockDefaultQuantities: DefaultQuantity[] = [
  // Weekday defaults for BR2 - Sandwich Bread Large
  { productId: 1, dayType: 'Weekday', outletId: 1, qtyFull: 50, qtyMini: 30 },
  { productId: 1, dayType: 'Weekday', outletId: 2, qtyFull: 45, qtyMini: 25 },
  { productId: 1, dayType: 'Weekday', outletId: 3, qtyFull: 40, qtyMini: 20 },
  { productId: 1, dayType: 'Weekday', outletId: 4, qtyFull: 55, qtyMini: 35 },
  // Saturday defaults for BR2
  { productId: 1, dayType: 'Saturday', outletId: 1, qtyFull: 60, qtyMini: 35 },
  { productId: 1, dayType: 'Saturday', outletId: 2, qtyFull: 50, qtyMini: 30 },
  // Sunday defaults for BR2
  { productId: 1, dayType: 'Sunday', outletId: 1, qtyFull: 70, qtyMini: 40 },
  { productId: 1, dayType: 'Sunday', outletId: 2, qtyFull: 65, qtyMini: 35 },
  // Add more defaults for other products...
];

export function getDefaultQuantitiesForDayType(dayType: string, productId: number): { [outletId: number]: { full: number; mini: number } } {
  const defaults: { [outletId: number]: { full: number; mini: number } } = {};
  const filtered = mockDefaultQuantities.filter(dq => dq.dayType === dayType && dq.productId === productId);
  
  filtered.forEach(dq => {
    defaults[dq.outletId] = { full: dq.qtyFull, mini: dq.qtyMini };
  });
  
  return defaults;
}
