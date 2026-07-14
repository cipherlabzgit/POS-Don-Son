// Complete ingredients catalog from Excel workbook
// Task E1.4 — Seed ingredients & recipes from `Recipe Per Item`

export interface IngredientFull {
  id: number;
  code: string;
  name: string;
  uom: string;
  ingredientType: 'Raw' | 'Processed' | 'Semi-Finished';
  
  // Extra quantity configuration
  allowExtraQuantity: boolean;
  extraQuantityPercentage?: number; // e.g., 14% extra for carrot
  extraQuantityFixed?: number; // Fixed amount extra
  extraQuantityReason?: string;
  showExtraInStoresOnly: boolean; // True = extra only in stores issue note
  
  standardCost: number;
  reorderLevel: number;
  isActive: boolean;
  sortOrder: number;
}

// Raw materials - Base ingredients
export const rawIngredients: IngredientFull[] = [
  { id: 1, code: 'ING001', name: 'Flour (White)', uom: 'kg', ingredientType: 'Raw', allowExtraQuantity: false, showExtraInStoresOnly: false, standardCost: 150, reorderLevel: 500, isActive: true, sortOrder: 1 },
  { id: 2, code: 'ING002', name: 'Sugar', uom: 'kg', ingredientType: 'Raw', allowExtraQuantity: false, showExtraInStoresOnly: false, standardCost: 180, reorderLevel: 200, isActive: true, sortOrder: 2 },
  { id: 3, code: 'ING003', name: 'Butter', uom: 'kg', ingredientType: 'Raw', allowExtraQuantity: false, showExtraInStoresOnly: false, standardCost: 900, reorderLevel: 100, isActive: true, sortOrder: 3 },
  { id: 4, code: 'ING004', name: 'Margarine (Beehive)', uom: 'kg', ingredientType: 'Raw', allowExtraQuantity: false, showExtraInStoresOnly: false, standardCost: 600, reorderLevel: 150, isActive: true, sortOrder: 4 },
  { id: 5, code: 'ING005', name: 'Salt', uom: 'kg', ingredientType: 'Raw', allowExtraQuantity: false, showExtraInStoresOnly: false, standardCost: 50, reorderLevel: 100, isActive: true, sortOrder: 5 },
  { id: 6, code: 'ING006', name: 'Yeast (Fresh)', uom: 'kg', ingredientType: 'Raw', allowExtraQuantity: false, showExtraInStoresOnly: false, standardCost: 800, reorderLevel: 50, isActive: true, sortOrder: 6 },
  { id: 7, code: 'ING007', name: 'Milk Powder', uom: 'kg', ingredientType: 'Raw', allowExtraQuantity: false, showExtraInStoresOnly: false, standardCost: 700, reorderLevel: 100, isActive: true, sortOrder: 7 },
  { id: 8, code: 'ING008', name: 'Eggs', uom: 'nos', ingredientType: 'Raw', allowExtraQuantity: false, showExtraInStoresOnly: false, standardCost: 30, reorderLevel: 500, isActive: true, sortOrder: 8 },
  
  // Vegetables - with extra percentages (cleaning loss)
  { id: 10, code: 'ING010', name: 'Carrot', uom: 'kg', ingredientType: 'Raw', allowExtraQuantity: true, extraQuantityPercentage: 14, extraQuantityReason: 'Cleaning and peeling loss', showExtraInStoresOnly: true, standardCost: 120, reorderLevel: 100, isActive: true, sortOrder: 10 },
  { id: 11, code: 'ING011', name: 'Cabbage', uom: 'kg', ingredientType: 'Raw', allowExtraQuantity: true, extraQuantityPercentage: 12.5, extraQuantityReason: 'Cleaning and outer leaf removal', showExtraInStoresOnly: true, standardCost: 80, reorderLevel: 100, isActive: true, sortOrder: 11 },
  { id: 12, code: 'ING012', name: 'Onion (Big)', uom: 'kg', ingredientType: 'Raw', allowExtraQuantity: true, extraQuantityPercentage: 10, extraQuantityReason: 'Peeling loss', showExtraInStoresOnly: true, standardCost: 200, reorderLevel: 150, isActive: true, sortOrder: 12 },
  { id: 13, code: 'ING013', name: 'Potato', uom: 'kg', ingredientType: 'Raw', allowExtraQuantity: true, extraQuantityPercentage: 15, extraQuantityReason: 'Peeling and cleaning loss', showExtraInStoresOnly: true, standardCost: 150, reorderLevel: 150, isActive: true, sortOrder: 13 },
  { id: 14, code: 'ING014', name: 'Leeks', uom: 'kg', ingredientType: 'Raw', allowExtraQuantity: true, extraQuantityPercentage: 8, extraQuantityReason: 'Cleaning and trimming', showExtraInStoresOnly: true, standardCost: 350, reorderLevel: 50, isActive: true, sortOrder: 14 },
  { id: 15, code: 'ING015', name: 'Green Chili', uom: 'kg', ingredientType: 'Raw', allowExtraQuantity: true, extraQuantityPercentage: 5, extraQuantityReason: 'Stem removal', showExtraInStoresOnly: true, standardCost: 400, reorderLevel: 50, isActive: true, sortOrder: 15 },
  
  // Fish and Meat
  { id: 20, code: 'ING020', name: 'Tuna (Canned)', uom: 'kg', ingredientType: 'Processed', allowExtraQuantity: false, showExtraInStoresOnly: false, standardCost: 850, reorderLevel: 100, isActive: true, sortOrder: 20 },
  { id: 21, code: 'ING021', name: 'Chicken (Boneless)', uom: 'kg', ingredientType: 'Raw', allowExtraQuantity: false, showExtraInStoresOnly: false, standardCost: 1200, reorderLevel: 100, isActive: true, sortOrder: 21 },
  { id: 22, code: 'ING022', name: 'Cuttlefish', uom: 'kg', ingredientType: 'Raw', allowExtraQuantity: false, showExtraInStoresOnly: false, standardCost: 1500, reorderLevel: 50, isActive: true, sortOrder: 22 },
  { id: 23, code: 'ING023', name: 'Prawn', uom: 'kg', ingredientType: 'Raw', allowExtraQuantity: false, showExtraInStoresOnly: false, standardCost: 2000, reorderLevel: 50, isActive: true, sortOrder: 23 },
  { id: 24, code: 'ING024', name: 'Beef (Ground)', uom: 'kg', ingredientType: 'Raw', allowExtraQuantity: false, showExtraInStoresOnly: false, standardCost: 1400, reorderLevel: 50, isActive: true, sortOrder: 24 },
  { id: 25, code: 'ING025', name: 'Sausage (Chicken)', uom: 'kg', ingredientType: 'Processed', allowExtraQuantity: false, showExtraInStoresOnly: false, standardCost: 1100, reorderLevel: 50, isActive: true, sortOrder: 25 },
  { id: 26, code: 'ING026', name: 'Bacon', uom: 'kg', ingredientType: 'Processed', allowExtraQuantity: false, showExtraInStoresOnly: false, standardCost: 1800, reorderLevel: 30, isActive: true, sortOrder: 26 },
  
  // Processed ingredients
  { id: 30, code: 'ING030', name: 'Bread Improver', uom: 'kg', ingredientType: 'Processed', allowExtraQuantity: false, showExtraInStoresOnly: false, standardCost: 450, reorderLevel: 20, isActive: true, sortOrder: 30 },
  { id: 31, code: 'ING031', name: 'Vanilla Essence', uom: 'ml', ingredientType: 'Processed', allowExtraQuantity: false, showExtraInStoresOnly: false, standardCost: 2, reorderLevel: 1000, isActive: true, sortOrder: 31 },
  { id: 32, code: 'ING032', name: 'Baking Powder', uom: 'kg', ingredientType: 'Processed', allowExtraQuantity: false, showExtraInStoresOnly: false, standardCost: 300, reorderLevel: 50, isActive: true, sortOrder: 32 },
  { id: 33, code: 'ING033', name: 'Curry Powder', uom: 'kg', ingredientType: 'Processed', allowExtraQuantity: false, showExtraInStoresOnly: false, standardCost: 800, reorderLevel: 50, isActive: true, sortOrder: 33 },
  { id: 34, code: 'ING034', name: 'Chili Powder', uom: 'kg', ingredientType: 'Processed', allowExtraQuantity: false, showExtraInStoresOnly: false, standardCost: 900, reorderLevel: 30, isActive: true, sortOrder: 34 },
  { id: 35, code: 'ING035', name: 'Turmeric Powder', uom: 'kg', ingredientType: 'Processed', allowExtraQuantity: false, showExtraInStoresOnly: false, standardCost: 600, reorderLevel: 30, isActive: true, sortOrder: 35 },
  { id: 36, code: 'ING036', name: 'Black Pepper', uom: 'kg', ingredientType: 'Processed', allowExtraQuantity: false, showExtraInStoresOnly: false, standardCost: 1200, reorderLevel: 20, isActive: true, sortOrder: 36 },
  
  // Oils
  { id: 40, code: 'ING040', name: 'Coconut Oil', uom: 'L', ingredientType: 'Raw', allowExtraQuantity: false, showExtraInStoresOnly: false, standardCost: 450, reorderLevel: 100, isActive: true, sortOrder: 40 },
  { id: 41, code: 'ING041', name: 'Vegetable Oil', uom: 'L', ingredientType: 'Raw', allowExtraQuantity: false, showExtraInStoresOnly: false, standardCost: 380, reorderLevel: 100, isActive: true, sortOrder: 41 },
  
  // Semi-finished / Sub-recipes
  { id: 50, code: 'ING050', name: 'Dough (Plain)', uom: 'kg', ingredientType: 'Semi-Finished', allowExtraQuantity: false, showExtraInStoresOnly: false, standardCost: 0, reorderLevel: 0, isActive: true, sortOrder: 50 },
  { id: 51, code: 'ING051', name: 'Dough (Sweet)', uom: 'kg', ingredientType: 'Semi-Finished', allowExtraQuantity: false, showExtraInStoresOnly: false, standardCost: 0, reorderLevel: 0, isActive: true, sortOrder: 51 },
  { id: 52, code: 'ING052', name: 'Fish Filling', uom: 'kg', ingredientType: 'Semi-Finished', allowExtraQuantity: false, showExtraInStoresOnly: false, standardCost: 0, reorderLevel: 0, isActive: true, sortOrder: 52 },
  { id: 53, code: 'ING053', name: 'Chicken Filling', uom: 'kg', ingredientType: 'Semi-Finished', allowExtraQuantity: false, showExtraInStoresOnly: false, standardCost: 0, reorderLevel: 0, isActive: true, sortOrder: 53 },
  { id: 54, code: 'ING054', name: 'Vegetable Filling', uom: 'kg', ingredientType: 'Semi-Finished', allowExtraQuantity: false, showExtraInStoresOnly: false, standardCost: 0, reorderLevel: 0, isActive: true, sortOrder: 54 },
  { id: 55, code: 'ING055', name: 'Curry Filling', uom: 'kg', ingredientType: 'Semi-Finished', allowExtraQuantity: false, showExtraInStoresOnly: false, standardCost: 0, reorderLevel: 0, isActive: true, sortOrder: 55 },
  
  // Preservatives - stores-only extras
  { id: 60, code: 'ING060', name: 'Calcium Propionate', uom: 'g', ingredientType: 'Processed', allowExtraQuantity: true, extraQuantityFixed: 100, extraQuantityReason: 'Preservative buffer stock', showExtraInStoresOnly: true, standardCost: 5, reorderLevel: 1000, isActive: true, sortOrder: 60 },
];

// Helper functions
export function getIngredientsWithExtraPercentage(): IngredientFull[] {
  return rawIngredients.filter(i => i.allowExtraQuantity && i.extraQuantityPercentage);
}

export function getStoresOnlyExtraIngredients(): IngredientFull[] {
  return rawIngredients.filter(i => i.showExtraInStoresOnly);
}

export function getIngredientByCode(code: string): IngredientFull | undefined {
  return rawIngredients.find(i => i.code === code);
}

export function getRawIngredients(): IngredientFull[] {
  return rawIngredients.filter(i => i.ingredientType === 'Raw');
}

export function getSemiFinishedIngredients(): IngredientFull[] {
  return rawIngredients.filter(i => i.ingredientType === 'Semi-Finished');
}

export const allIngredients = rawIngredients;
