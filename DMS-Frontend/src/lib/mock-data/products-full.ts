// Complete product catalog from Excel workbook
// Task E1.3 — Seed actual product master from xlsm SKU list (~80 SKUs)

import { ProductionSection } from './enhanced-models';

export interface ProductFull {
  id: number;
  code: string;
  name: string;
  section: ProductionSection;
  hasFull: boolean;
  hasMini: boolean;
  allowDecimal: boolean;
  decimalPlaces: number;
  roundingValue: number; // e.g., 5 for bakery, 1 for others
  defaultDeliveryTurns: number[]; // Turn IDs
  availableInTurns: number[]; // Which turns can produce this
  isPlainRollItem: boolean; // For Plain Roll Production mode
  sortOrder: number;
  isActive: boolean;
}

// Bakery items (BR codes)
export const bakeryProducts: ProductFull[] = [
  { id: 1, code: 'BR1', name: 'White Bread Large', section: 'Bakery 1', hasFull: true, hasMini: true, allowDecimal: false, decimalPlaces: 0, roundingValue: 5, defaultDeliveryTurns: [1], availableInTurns: [1, 2], isPlainRollItem: false, sortOrder: 1, isActive: true },
  { id: 2, code: 'BR2', name: 'Sandwich Bread Large', section: 'Bakery 1', hasFull: true, hasMini: true, allowDecimal: false, decimalPlaces: 0, roundingValue: 5, defaultDeliveryTurns: [1], availableInTurns: [1, 2], isPlainRollItem: false, sortOrder: 2, isActive: true },
  { id: 3, code: 'BR3', name: 'Sandwich Bread Small', section: 'Bakery 1', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 5, defaultDeliveryTurns: [1], availableInTurns: [1, 2], isPlainRollItem: false, sortOrder: 3, isActive: true },
  { id: 4, code: 'BR4', name: 'Toast Bread', section: 'Bakery 1', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 5, defaultDeliveryTurns: [1], availableInTurns: [1, 2], isPlainRollItem: false, sortOrder: 4, isActive: true },
  { id: 5, code: 'BR5', name: 'Hot Dog Bread', section: 'Bakery 1', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 5, defaultDeliveryTurns: [1], availableInTurns: [1, 2], isPlainRollItem: false, sortOrder: 5, isActive: true },
  { id: 6, code: 'BR6', name: 'French Bread', section: 'Bakery 1', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 5, defaultDeliveryTurns: [1], availableInTurns: [1, 2], isPlainRollItem: false, sortOrder: 6, isActive: true },
  { id: 7, code: 'BR7', name: 'Milk Bread', section: 'Bakery 1', hasFull: true, hasMini: true, allowDecimal: false, decimalPlaces: 0, roundingValue: 5, defaultDeliveryTurns: [1], availableInTurns: [1, 2], isPlainRollItem: false, sortOrder: 7, isActive: true },
  { id: 8, code: 'BR8', name: 'Currant Bread', section: 'Bakery 1', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 5, defaultDeliveryTurns: [1], availableInTurns: [1, 2], isPlainRollItem: false, sortOrder: 8, isActive: true },
  { id: 9, code: 'BR9', name: 'Kurakkan Sandwich Slice Pack', section: 'Bakery 1', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 5, defaultDeliveryTurns: [1], availableInTurns: [1, 2], isPlainRollItem: false, sortOrder: 9, isActive: true },
  { id: 10, code: 'BR10', name: 'Burger Bun', section: 'Bakery 1', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 5, defaultDeliveryTurns: [1], availableInTurns: [1, 2], isPlainRollItem: false, sortOrder: 10, isActive: true },
  { id: 11, code: 'BR11', name: 'Butter Bread', section: 'Bakery 1', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 5, defaultDeliveryTurns: [1], availableInTurns: [1, 2], isPlainRollItem: false, sortOrder: 11, isActive: true },
];

// Bun items (BU codes) - many are plain roll items
export const bunProducts: ProductFull[] = [
  { id: 20, code: 'BU1', name: 'Plain Roll / Plain Bun', section: 'Plain Roll Section', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 2], availableInTurns: [1, 2], isPlainRollItem: true, sortOrder: 20, isActive: true },
  { id: 21, code: 'BU2', name: 'Seeni Sambol Bun', section: 'Plain Roll Section', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 2], availableInTurns: [1, 2], isPlainRollItem: true, sortOrder: 21, isActive: true },
  { id: 22, code: 'BU3', name: 'Fish Bun', section: 'Filling Section', hasFull: true, hasMini: true, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 2], availableInTurns: [1, 2, 3], isPlainRollItem: true, sortOrder: 22, isActive: true },
  { id: 23, code: 'BU4', name: 'Cuttlefish Bun', section: 'Filling Section', hasFull: true, hasMini: true, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 2], availableInTurns: [1, 2], isPlainRollItem: true, sortOrder: 23, isActive: true },
  { id: 24, code: 'BU5', name: 'Chicken Sausage Bun', section: 'Filling Section', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 2], availableInTurns: [1, 2], isPlainRollItem: true, sortOrder: 24, isActive: true },
  { id: 25, code: 'BU6', name: 'Egg Bun', section: 'Filling Section', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 2], availableInTurns: [1, 2], isPlainRollItem: true, sortOrder: 25, isActive: true },
  { id: 26, code: 'BU7', name: 'Omelette Bun', section: 'Filling Section', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 2], availableInTurns: [1, 2], isPlainRollItem: true, sortOrder: 26, isActive: true },
  { id: 27, code: 'BU8', name: 'Egg Burger', section: 'Filling Section', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 2], availableInTurns: [1, 2], isPlainRollItem: true, sortOrder: 27, isActive: true },
  { id: 28, code: 'BU9', name: 'Fish Curry Bun', section: 'Filling Section', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 2], availableInTurns: [1, 2], isPlainRollItem: true, sortOrder: 28, isActive: true },
  { id: 29, code: 'BU10', name: 'Hot Dog', section: 'Filling Section', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 2], availableInTurns: [1, 2], isPlainRollItem: true, sortOrder: 29, isActive: true },
  { id: 30, code: 'BU11', name: 'Honey Sausage Bun', section: 'Filling Section', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 2], availableInTurns: [1, 2], isPlainRollItem: true, sortOrder: 30, isActive: true },
  { id: 31, code: 'BU12', name: 'Cheese Chicken Curry Bun', section: 'Filling Section', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 2], availableInTurns: [1, 2], isPlainRollItem: true, sortOrder: 31, isActive: true },
  { id: 32, code: 'BU13', name: 'Chicken Bun', section: 'Filling Section', hasFull: true, hasMini: true, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 2], availableInTurns: [1, 2, 3], isPlainRollItem: true, sortOrder: 32, isActive: true },
  { id: 33, code: 'BU14', name: 'Prawn Bun', section: 'Filling Section', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 2], availableInTurns: [1, 2], isPlainRollItem: true, sortOrder: 33, isActive: true },
  { id: 34, code: 'BU15', name: 'Dinner Bun (35g)', section: 'Plain Roll Section', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 2], availableInTurns: [1, 2], isPlainRollItem: true, sortOrder: 34, isActive: true },
  { id: 35, code: 'BU16', name: 'Soya Bun', section: 'Plain Roll Section', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 2], availableInTurns: [1, 2], isPlainRollItem: false, sortOrder: 35, isActive: true },
  { id: 36, code: 'BU17', name: 'Vegetable Bun', section: 'Filling Section', hasFull: true, hasMini: true, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 2], availableInTurns: [1, 2, 3], isPlainRollItem: false, sortOrder: 36, isActive: true },
  { id: 37, code: 'BU18', name: 'Roast Bread M', section: 'Bakery 1', hasFull: false, hasMini: true, allowDecimal: false, decimalPlaces: 0, roundingValue: 5, defaultDeliveryTurns: [1], availableInTurns: [1, 2], isPlainRollItem: false, sortOrder: 37, isActive: true },
  { id: 38, code: 'BU19', name: 'Viyana Roll', section: 'Bakery 1', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 5, defaultDeliveryTurns: [1], availableInTurns: [1, 2], isPlainRollItem: false, sortOrder: 38, isActive: true },
];

// Pastry items (PTY codes)
export const pastryProducts: ProductFull[] = [
  { id: 50, code: 'PTY1', name: 'Fish Pastry', section: 'Pastry Section', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 3], availableInTurns: [1, 3], isPlainRollItem: false, sortOrder: 50, isActive: true },
  { id: 51, code: 'PTY2', name: 'Cheese Chicken Pastry', section: 'Pastry Section', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 3], availableInTurns: [1, 3], isPlainRollItem: false, sortOrder: 51, isActive: true },
  { id: 52, code: 'PTY3', name: 'Seafood Pie', section: 'Pastry Section', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 3], availableInTurns: [1, 3], isPlainRollItem: false, sortOrder: 52, isActive: true },
  { id: 53, code: 'PTY4', name: 'Chicken Pie', section: 'Pastry Section', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 3], availableInTurns: [1, 3], isPlainRollItem: false, sortOrder: 53, isActive: true },
  { id: 54, code: 'PTY5', name: 'Chicken Sausage Pastry', section: 'Pastry Section', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 3], availableInTurns: [1, 3], isPlainRollItem: false, sortOrder: 54, isActive: true },
  { id: 55, code: 'PTY6', name: 'Bacon Pastry', section: 'Pastry Section', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 3], availableInTurns: [1, 3], isPlainRollItem: false, sortOrder: 55, isActive: true },
  { id: 56, code: 'PTY7', name: 'Vegetable Pastry', section: 'Pastry Section', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 3], availableInTurns: [1, 3], isPlainRollItem: false, sortOrder: 56, isActive: true },
];

// Sandwich items (SAN codes)
export const sandwichProducts: ProductFull[] = [
  { id: 70, code: 'SAN1', name: 'Egg Sandwich', section: 'Short-Eats 1', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 3], availableInTurns: [1, 3], isPlainRollItem: false, sortOrder: 70, isActive: true },
  { id: 71, code: 'SAN2', name: 'Fish Sandwich', section: 'Short-Eats 1', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 3], availableInTurns: [1, 3], isPlainRollItem: false, sortOrder: 71, isActive: true },
  { id: 72, code: 'SAN3', name: 'Chicken Sandwich', section: 'Short-Eats 1', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 3], availableInTurns: [1, 3], isPlainRollItem: false, sortOrder: 72, isActive: true },
  { id: 73, code: 'SAN4', name: 'Vegetable Sandwich', section: 'Short-Eats 1', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 3], availableInTurns: [1, 3], isPlainRollItem: false, sortOrder: 73, isActive: true },
];

// Short-eats items (SE codes)
export const shortEatsProducts: ProductFull[] = [
  { id: 90, code: 'SE1', name: 'Fish Cutlet', section: 'Short-Eats 1', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 3], availableInTurns: [1, 3], isPlainRollItem: false, sortOrder: 90, isActive: true },
  { id: 91, code: 'SE2', name: 'Egg Cutlet', section: 'Short-Eats 1', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 3], availableInTurns: [1, 3], isPlainRollItem: false, sortOrder: 91, isActive: true },
  { id: 92, code: 'SE3', name: 'Vegetable Cutlet', section: 'Short-Eats 1', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 3], availableInTurns: [1, 3], isPlainRollItem: false, sortOrder: 92, isActive: true },
  { id: 93, code: 'SE4', name: 'Fish Pattie', section: 'Short-Eats 1', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 3], availableInTurns: [1, 3], isPlainRollItem: false, sortOrder: 93, isActive: true },
  { id: 94, code: 'SE5', name: 'Vegetable Pattie', section: 'Short-Eats 1', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 3], availableInTurns: [1, 3], isPlainRollItem: false, sortOrder: 94, isActive: true },
  { id: 95, code: 'SE6', name: 'Fish Chinese Roll', section: 'Short-Eats 2', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 3], availableInTurns: [1, 3], isPlainRollItem: false, sortOrder: 95, isActive: true },
  { id: 96, code: 'SE7', name: 'Vegetable Chinese Roll', section: 'Short-Eats 2', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 3], availableInTurns: [1, 3], isPlainRollItem: false, sortOrder: 96, isActive: true },
  { id: 97, code: 'SE8', name: 'Vegetable Burger Mini', section: 'Short-Eats 1', hasFull: false, hasMini: true, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 3], availableInTurns: [1, 3], isPlainRollItem: false, sortOrder: 97, isActive: true },
];

// Rotty items (RO codes)
export const rottyProducts: ProductFull[] = [
  { id: 110, code: 'RO1', name: 'Egg Plain Rotty', section: 'Rotty Section', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 3], availableInTurns: [1, 3], isPlainRollItem: false, sortOrder: 110, isActive: true },
  { id: 111, code: 'RO2', name: 'Vegetable Rotty', section: 'Rotty Section', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 3], availableInTurns: [1, 3], isPlainRollItem: false, sortOrder: 111, isActive: true },
  { id: 112, code: 'RO3', name: 'Fish Rotty', section: 'Rotty Section', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 3], availableInTurns: [1, 3], isPlainRollItem: false, sortOrder: 112, isActive: true },
  { id: 113, code: 'RO4', name: 'Chicken Rotty', section: 'Rotty Section', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 3], availableInTurns: [1, 3], isPlainRollItem: false, sortOrder: 113, isActive: true },
  { id: 114, code: 'RO5', name: 'Beef Rotty', section: 'Rotty Section', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 3], availableInTurns: [1, 3], isPlainRollItem: false, sortOrder: 114, isActive: true },
  { id: 115, code: 'RO6', name: 'Beef Rotty (Alt)', section: 'Rotty Section', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 3], availableInTurns: [1, 3], isPlainRollItem: false, sortOrder: 115, isActive: true },
];

// Pizza items (PZ codes)
export const pizzaProducts: ProductFull[] = [
  { id: 130, code: 'PZ1', name: 'Vegetable Pizza', section: 'Pastry Section', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 3], availableInTurns: [1, 3], isPlainRollItem: false, sortOrder: 130, isActive: true },
  { id: 131, code: 'PZ2', name: 'Chicken Pizza', section: 'Pastry Section', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 3], availableInTurns: [1, 3], isPlainRollItem: false, sortOrder: 131, isActive: true },
  { id: 132, code: 'PZ3', name: 'Sausage Pizza', section: 'Pastry Section', hasFull: true, hasMini: false, allowDecimal: false, decimalPlaces: 0, roundingValue: 1, defaultDeliveryTurns: [1, 3], availableInTurns: [1, 3], isPlainRollItem: false, sortOrder: 132, isActive: true },
];

// Special items (PS codes - example decimals)
export const specialProducts: ProductFull[] = [
  { id: 150, code: 'PR5', name: 'Special Cake (kg)', section: 'Pastry Section', hasFull: true, hasMini: false, allowDecimal: true, decimalPlaces: 2, roundingValue: 0.25, defaultDeliveryTurns: [1], availableInTurns: [1, 3], isPlainRollItem: false, sortOrder: 150, isActive: true },
];

// Combine all products
export const allProducts: ProductFull[] = [
  ...bakeryProducts,
  ...bunProducts,
  ...pastryProducts,
  ...sandwichProducts,
  ...shortEatsProducts,
  ...rottyProducts,
  ...pizzaProducts,
  ...specialProducts
];

// Helper functions
export function getPlainRollProducts(): ProductFull[] {
  return allProducts.filter(p => p.isPlainRollItem);
}

export function getProductsBySection(section: ProductionSection): ProductFull[] {
  return allProducts.filter(p => p.section === section);
}

export function getProductsByTurn(turnId: number): ProductFull[] {
  return allProducts.filter(p => p.availableInTurns.includes(turnId));
}

export function getProductByCode(code: string): ProductFull | undefined {
  return allProducts.find(p => p.code === code);
}

export function getBakeryRoundingProducts(): ProductFull[] {
  return allProducts.filter(p => p.roundingValue === 5);
}
