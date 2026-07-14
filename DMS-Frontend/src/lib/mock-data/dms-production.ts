// Mock data for DMS Production & Recipe modules

export type ProductionSection = 'Bakery 1' | 'Bakery 2' | 'Filling Section' | 'Short-Eats 1' | 'Short-Eats 2' | 'Rotty Section' | 'Plain Roll Section' | 'Pastry Section';

export interface ProductionItem {
  productId: number;
  productCode: string;
  productName: string;
  qtyFull: number;
  qtyMini: number;
  section: ProductionSection;
}

export interface IngredientTotal {
  ingredientId: number;
  ingredientCode: string;
  ingredientName: string;
  unit: string;
  totalQty: number;
  extraQty: number;
  storesQty: number;
}

export interface RecipeIngredient {
  id: number;
  ingredientId: number;
  ingredientCode: string;
  ingredientName: string;
  qtyPerUnit: number;
  extraQtyPerUnit: number;
  unit: string;
  storesOnly: boolean;
  isPercentage: boolean;
  percentageSourceProductId?: number;
  sortOrder: number;
}

export interface Recipe {
  id: number;
  productId: number;
  productCode: string;
  productName: string;
  subRecipeName?: string;
  ingredients: RecipeIngredient[];
  version: number;
  effectiveFrom: string;
  isActive: boolean;
}

export interface RecipeTemplate {
  id: number;
  name: string;
  description: string;
  ingredientCount: number;
  ingredients: { ingredientId: number; ingredientCode: string; ingredientName: string; qtyPerUnit: number; unit: string }[];
  active: boolean;
}

export interface FreezerStock {
  id: number;
  productId: number;
  productCode: string;
  productName: string;
  section?: ProductionSection;
  quantity: number;
  stockDate: string;
  notes?: string;
  lastUpdated: string;
}

export const mockProductionItems: ProductionItem[] = [
  // Bakery 1
  { productId: 1, productCode: 'BR2', productName: 'Sandwich Bread Large', qtyFull: 200, qtyMini: 150, section: 'Bakery 1' },
  { productId: 2, productCode: 'BR3', productName: 'Sandwich Bread Small', qtyFull: 180, qtyMini: 0, section: 'Bakery 1' },
  { productId: 3, productCode: 'BR8', productName: 'Milk Bread', qtyFull: 160, qtyMini: 120, section: 'Bakery 1' },
  
  // Bakery 2
  { productId: 4, productCode: 'BR10', productName: 'Butter Bread', qtyFull: 140, qtyMini: 0, section: 'Bakery 2' },
  { productId: 11, productCode: 'BR15', productName: 'Coconut Bread', qtyFull: 100, qtyMini: 80, section: 'Bakery 2' },
  
  // Short-Eats 1
  { productId: 5, productCode: 'BU10', productName: 'Vegetable Bun', qtyFull: 300, qtyMini: 250, section: 'Short-Eats 1' },
  { productId: 6, productCode: 'BU12', productName: 'Fish Bun', qtyFull: 280, qtyMini: 220, section: 'Short-Eats 1' },
  
  // Short-Eats 2
  { productId: 7, productCode: 'BU15', productName: 'Chicken Bun', qtyFull: 320, qtyMini: 260, section: 'Short-Eats 2' },
  { productId: 12, productCode: 'BU20', productName: 'Egg Bun', qtyFull: 200, qtyMini: 150, section: 'Short-Eats 2' },
  
  // Rotty Section
  { productId: 10, productCode: 'RT2', productName: 'Chicken Rotty', qtyFull: 150, qtyMini: 0, section: 'Rotty Section' },
  { productId: 13, productCode: 'RT5', productName: 'Vegetable Rotty', qtyFull: 120, qtyMini: 0, section: 'Rotty Section' },
  
  // Pastry Section
  { productId: 8, productCode: 'PZ5', productName: 'Vegetable Pizza Small', qtyFull: 80, qtyMini: 0, section: 'Pastry Section' },
  { productId: 9, productCode: 'PZ8', productName: 'Chicken Pizza Large', qtyFull: 60, qtyMini: 0, section: 'Pastry Section' },
];

export const mockIngredientTotals: IngredientTotal[] = [
  { ingredientId: 1, ingredientCode: 'FLR001', ingredientName: 'Wheat Flour', unit: 'kg', totalQty: 450, extraQty: 25, storesQty: 475 },
  { ingredientId: 2, ingredientCode: 'SGR001', ingredientName: 'Sugar', unit: 'kg', totalQty: 85, extraQty: 5, storesQty: 90 },
  { ingredientId: 3, ingredientCode: 'YST001', ingredientName: 'Yeast', unit: 'g', totalQty: 2500, extraQty: 200, storesQty: 2700 },
  { ingredientId: 4, ingredientCode: 'BHV001', ingredientName: 'Beehive (Butter)', unit: 'kg', totalQty: 65, extraQty: 5, storesQty: 70 },
  { ingredientId: 5, ingredientCode: 'SLT001', ingredientName: 'Salt', unit: 'kg', totalQty: 12, extraQty: 1, storesQty: 13 },
  { ingredientId: 6, ingredientCode: 'EGG001', ingredientName: 'Eggs', unit: 'Nos', totalQty: 450, extraQty: 30, storesQty: 480 },
  { ingredientId: 7, ingredientCode: 'MLK001', ingredientName: 'Milk Powder', unit: 'kg', totalQty: 18, extraQty: 2, storesQty: 20 },
  { ingredientId: 8, ingredientCode: 'SSM001', ingredientName: 'Sesame Seeds', unit: 'g', totalQty: 800, extraQty: 50, storesQty: 850 },
];

export const mockRecipes: Recipe[] = [
  {
    id: 1,
    productId: 1,
    productCode: 'BR2',
    productName: 'Sandwich Bread Large',
    ingredients: [
      { id: 1, ingredientId: 1, ingredientCode: 'FLR001', ingredientName: 'Wheat Flour', qtyPerUnit: 1.2, extraQtyPerUnit: 0.05, unit: 'kg', storesOnly: false, isPercentage: false, sortOrder: 1 },
      { id: 2, ingredientId: 2, ingredientCode: 'SGR001', ingredientName: 'Sugar', qtyPerUnit: 0.15, extraQtyPerUnit: 0.01, unit: 'kg', storesOnly: false, isPercentage: false, sortOrder: 2 },
      { id: 3, ingredientId: 3, ingredientCode: 'YST001', ingredientName: 'Yeast', qtyPerUnit: 25, extraQtyPerUnit: 2, unit: 'g', storesOnly: false, isPercentage: false, sortOrder: 3 },
      { id: 4, ingredientId: 4, ingredientCode: 'BHV001', ingredientName: 'Beehive (Butter)', qtyPerUnit: 0.08, extraQtyPerUnit: 0.005, unit: 'kg', storesOnly: false, isPercentage: false, sortOrder: 4 },
      { id: 5, ingredientId: 5, ingredientCode: 'SLT001', ingredientName: 'Salt', qtyPerUnit: 0.02, extraQtyPerUnit: 0, unit: 'kg', storesOnly: false, isPercentage: false, sortOrder: 5 },
      { id: 6, ingredientId: 6, ingredientCode: 'EGG001', ingredientName: 'Eggs', qtyPerUnit: 1, extraQtyPerUnit: 0, unit: 'Nos', storesOnly: true, isPercentage: false, sortOrder: 6 },
    ],
    version: 1,
    effectiveFrom: '2026-01-01',
    isActive: true,
  },
  {
    id: 2,
    productId: 5,
    productCode: 'BU10',
    productName: 'Vegetable Bun',
    subRecipeName: 'Dough',
    ingredients: [
      { id: 7, ingredientId: 1, ingredientCode: 'FLR001', ingredientName: 'Wheat Flour', qtyPerUnit: 0.8, extraQtyPerUnit: 0.04, unit: 'kg', storesOnly: false, isPercentage: false, sortOrder: 1 },
      { id: 8, ingredientId: 2, ingredientCode: 'SGR001', ingredientName: 'Sugar', qtyPerUnit: 0.1, extraQtyPerUnit: 0.005, unit: 'kg', storesOnly: false, isPercentage: false, sortOrder: 2 },
      { id: 9, ingredientId: 3, ingredientCode: 'YST001', ingredientName: 'Yeast', qtyPerUnit: 20, extraQtyPerUnit: 1, unit: 'g', storesOnly: false, isPercentage: false, sortOrder: 3 },
      { id: 10, ingredientId: 4, ingredientCode: 'BHV001', ingredientName: 'Beehive (Butter)', qtyPerUnit: 0.05, extraQtyPerUnit: 0, unit: 'kg', storesOnly: false, isPercentage: false, sortOrder: 4 },
    ],
    version: 1,
    effectiveFrom: '2026-01-01',
    isActive: true,
  },
];

export const mockRecipeTemplates: RecipeTemplate[] = [
  {
    id: 1,
    name: 'Basic Bread Template',
    description: 'Standard template for bread products',
    ingredientCount: 5,
    ingredients: [
      { ingredientId: 1, ingredientCode: 'FLR001', ingredientName: 'Wheat Flour', qtyPerUnit: 1.0, unit: 'kg' },
      { ingredientId: 2, ingredientCode: 'SGR001', ingredientName: 'Sugar', qtyPerUnit: 0.12, unit: 'kg' },
      { ingredientId: 3, ingredientCode: 'YST001', ingredientName: 'Yeast', qtyPerUnit: 20, unit: 'g' },
      { ingredientId: 4, ingredientCode: 'BHV001', ingredientName: 'Beehive (Butter)', qtyPerUnit: 0.06, unit: 'kg' },
      { ingredientId: 5, ingredientCode: 'SLT001', ingredientName: 'Salt', qtyPerUnit: 0.015, unit: 'kg' },
    ],
    active: true,
  },
  {
    id: 2,
    name: 'Vegetable Curry Template',
    description: 'Standard vegetable curry filling',
    ingredientCount: 8,
    ingredients: [
      { ingredientId: 20, ingredientCode: 'VEG001', ingredientName: 'Mixed Vegetables', qtyPerUnit: 2.0, unit: 'kg' },
      { ingredientId: 21, ingredientCode: 'OIL001', ingredientName: 'Cooking Oil', qtyPerUnit: 0.5, unit: 'L' },
      { ingredientId: 22, ingredientCode: 'ONI001', ingredientName: 'Onions', qtyPerUnit: 0.8, unit: 'kg' },
      { ingredientId: 23, ingredientCode: 'CHL001', ingredientName: 'Green Chilies', qtyPerUnit: 0.1, unit: 'kg' },
      { ingredientId: 24, ingredientCode: 'CUR001', ingredientName: 'Curry Powder', qtyPerUnit: 0.05, unit: 'kg' },
      { ingredientId: 25, ingredientCode: 'TUR001', ingredientName: 'Turmeric Powder', qtyPerUnit: 0.02, unit: 'kg' },
      { ingredientId: 5, ingredientCode: 'SLT001', ingredientName: 'Salt', qtyPerUnit: 0.03, unit: 'kg' },
      { ingredientId: 26, ingredientCode: 'COR001', ingredientName: 'Coriander Leaves', qtyPerUnit: 0.05, unit: 'kg' },
    ],
    active: true,
  },
  {
    id: 3,
    name: 'Fish Filling Template',
    description: 'Standard fish curry filling',
    ingredientCount: 7,
    ingredients: [
      { ingredientId: 30, ingredientCode: 'FSH001', ingredientName: 'Fish', qtyPerUnit: 1.5, unit: 'kg' },
      { ingredientId: 21, ingredientCode: 'OIL001', ingredientName: 'Cooking Oil', qtyPerUnit: 0.4, unit: 'L' },
      { ingredientId: 22, ingredientCode: 'ONI001', ingredientName: 'Onions', qtyPerUnit: 0.6, unit: 'kg' },
      { ingredientId: 24, ingredientCode: 'CUR001', ingredientName: 'Curry Powder', qtyPerUnit: 0.06, unit: 'kg' },
      { ingredientId: 25, ingredientCode: 'TUR001', ingredientName: 'Turmeric Powder', qtyPerUnit: 0.02, unit: 'kg' },
      { ingredientId: 5, ingredientCode: 'SLT001', ingredientName: 'Salt', qtyPerUnit: 0.03, unit: 'kg' },
      { ingredientId: 31, ingredientCode: 'TML001', ingredientName: 'Tamarind', qtyPerUnit: 0.05, unit: 'kg' },
    ],
    active: true,
  },
];

export const mockFreezerStock: FreezerStock[] = [
  { id: 1, productId: 1, productCode: 'BR2', productName: 'Sandwich Bread Large', section: 'Bakery 1', quantity: 45, stockDate: '2026-04-21', notes: 'From previous day production', lastUpdated: '2026-04-21 06:30' },
  { id: 2, productId: 5, productCode: 'BU10', productName: 'Vegetable Bun', section: 'Short-Eats 1', quantity: 60, stockDate: '2026-04-21', lastUpdated: '2026-04-21 06:45' },
  { id: 3, productId: 6, productCode: 'BU12', productName: 'Fish Bun', section: 'Short-Eats 1', quantity: 50, stockDate: '2026-04-21', lastUpdated: '2026-04-21 06:50' },
  { id: 4, productId: 9, productCode: 'PZ8', productName: 'Chicken Pizza Large', section: 'Pastry Section', quantity: 8, stockDate: '2026-04-21', notes: 'Low stock alert', lastUpdated: '2026-04-21 07:00' },
];

export const productionSections: ProductionSection[] = [
  'Bakery 1',
  'Bakery 2',
  'Filling Section',
  'Short-Eats 1',
  'Short-Eats 2',
  'Rotty Section',
  'Plain Roll Section',
  'Pastry Section',
];
