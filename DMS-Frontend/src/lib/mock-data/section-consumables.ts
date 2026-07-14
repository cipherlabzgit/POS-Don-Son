// Section consumables data
// Task E3.5 — Filling Section consumables (gloves, piping bag, oil paper, calcium propionate)

import { ProductionSection } from './enhanced-models';

export interface SectionConsumable {
  id: number;
  sectionId: number;
  sectionName: ProductionSection;
  name: string;
  uom: string;
  qtyPerBatch?: number; // For batch-based calculation
  qtyPerUnit?: number; // For per-unit calculation
  calcBasis: 'Batch' | 'PerUnit' | 'Fixed';
  fixedQty?: number; // For fixed quantity per day
  description?: string;
  sortOrder: number;
  isActive: boolean;
}

export const mockSectionConsumables: SectionConsumable[] = [
  // Bakery Section
  {
    id: 1,
    sectionId: 1,
    sectionName: 'Bakery 1',
    name: 'Oil Paper (Baking)',
    uom: 'sheets',
    qtyPerBatch: 50,
    calcBasis: 'Batch',
    description: 'Oil paper for baking trays',
    sortOrder: 1,
    isActive: true
  },
  {
    id: 2,
    sectionId: 1,
    sectionName: 'Bakery 1',
    name: 'Calcium Propionate',
    uom: 'g',
    qtyPerUnit: 0.5,
    calcBasis: 'PerUnit',
    description: 'Preservative per loaf',
    sortOrder: 2,
    isActive: true
  },
  
  // Filling Section
  {
    id: 10,
    sectionId: 3,
    sectionName: 'Filling Section',
    name: 'Gloves (Nitrile)',
    uom: 'pairs',
    qtyPerBatch: 10,
    calcBasis: 'Batch',
    description: 'Food-grade gloves for filling prep',
    sortOrder: 10,
    isActive: true
  },
  {
    id: 11,
    sectionId: 3,
    sectionName: 'Filling Section',
    name: 'Piping Bag',
    uom: 'nos',
    qtyPerBatch: 5,
    calcBasis: 'Batch',
    description: 'Disposable piping bags for filling',
    sortOrder: 11,
    isActive: true
  },
  {
    id: 12,
    sectionId: 3,
    sectionName: 'Filling Section',
    name: 'Oil Paper (Wrapping)',
    uom: 'sheets',
    qtyPerUnit: 1,
    calcBasis: 'PerUnit',
    description: 'Wrapping paper per filled item',
    sortOrder: 12,
    isActive: true
  },
  {
    id: 13,
    sectionId: 3,
    sectionName: 'Filling Section',
    name: 'Food Stickers',
    uom: 'nos',
    qtyPerUnit: 1,
    calcBasis: 'PerUnit',
    description: 'Product identification stickers',
    sortOrder: 13,
    isActive: true
  },
  
  // Pastry Section
  {
    id: 20,
    sectionId: 8,
    sectionName: 'Pastry Section',
    name: 'Puff Pastry Sheets',
    uom: 'kg',
    qtyPerBatch: 2,
    calcBasis: 'Batch',
    description: 'Pre-made puff pastry',
    sortOrder: 20,
    isActive: true
  },
  {
    id: 21,
    sectionId: 8,
    sectionName: 'Pastry Section',
    name: 'Egg Wash',
    uom: 'ml',
    qtyPerUnit: 5,
    calcBasis: 'PerUnit',
    description: 'Egg wash for pastry glaze',
    sortOrder: 21,
    isActive: true
  },
  {
    id: 22,
    sectionId: 8,
    sectionName: 'Pastry Section',
    name: 'Baking Paper',
    uom: 'sheets',
    qtyPerBatch: 30,
    calcBasis: 'Batch',
    description: 'Non-stick baking paper',
    sortOrder: 22,
    isActive: true
  },
  
  // Short-Eats Section
  {
    id: 30,
    sectionId: 4,
    sectionName: 'Short-Eats 1',
    name: 'Bread Crumbs',
    uom: 'kg',
    qtyPerBatch: 1.5,
    calcBasis: 'Batch',
    description: 'Coating for cutlets and patties',
    sortOrder: 30,
    isActive: true
  },
  {
    id: 31,
    sectionId: 4,
    sectionName: 'Short-Eats 1',
    name: 'Gloves (Vinyl)',
    uom: 'pairs',
    qtyPerBatch: 8,
    calcBasis: 'Batch',
    description: 'Food handling gloves',
    sortOrder: 31,
    isActive: true
  },
  {
    id: 32,
    sectionId: 4,
    sectionName: 'Short-Eats 1',
    name: 'Frying Oil (Disposal)',
    uom: 'L',
    fixedQty: 5,
    calcBasis: 'Fixed',
    description: 'Daily oil disposal estimate',
    sortOrder: 32,
    isActive: true
  },
  
  // Rotty Section
  {
    id: 40,
    sectionId: 6,
    sectionName: 'Rotty Section',
    name: 'Rolling Pin Oil',
    uom: 'ml',
    qtyPerBatch: 100,
    calcBasis: 'Batch',
    description: 'Oil for rotty rolling surface',
    sortOrder: 40,
    isActive: true
  },
  {
    id: 41,
    sectionId: 6,
    sectionName: 'Rotty Section',
    name: 'Gloves (Nitrile)',
    uom: 'pairs',
    qtyPerBatch: 6,
    calcBasis: 'Batch',
    description: 'Food-grade gloves',
    sortOrder: 41,
    isActive: true
  },
  
  // Packing Section
  {
    id: 50,
    sectionId: 10,
    sectionName: 'Packing Section',
    name: 'Plastic Wrap',
    uom: 'm',
    qtyPerUnit: 0.3,
    calcBasis: 'PerUnit',
    description: 'Plastic wrap per item',
    sortOrder: 50,
    isActive: true
  },
  {
    id: 51,
    sectionId: 10,
    sectionName: 'Packing Section',
    name: 'Product Labels',
    uom: 'nos',
    qtyPerUnit: 1,
    calcBasis: 'PerUnit',
    description: 'Printed product label',
    sortOrder: 51,
    isActive: true
  },
  {
    id: 52,
    sectionId: 10,
    sectionName: 'Packing Section',
    name: 'Cardboard Boxes',
    uom: 'nos',
    qtyPerBatch: 20,
    calcBasis: 'Batch',
    description: 'Packaging boxes for bulk',
    sortOrder: 52,
    isActive: true
  },
];

// Helper functions
export function getConsumablesBySection(sectionName: ProductionSection): SectionConsumable[] {
  return mockSectionConsumables.filter(c => c.sectionName === sectionName);
}

export function getActiveConsumables(): SectionConsumable[] {
  return mockSectionConsumables.filter(c => c.isActive);
}

export function calculateConsumableQty(
  consumable: SectionConsumable,
  productionQty: number,
  batchSize: number = 100
): number {
  switch (consumable.calcBasis) {
    case 'PerUnit':
      return productionQty * (consumable.qtyPerUnit || 0);
    case 'Batch':
      const batches = Math.ceil(productionQty / batchSize);
      return batches * (consumable.qtyPerBatch || 0);
    case 'Fixed':
      return consumable.fixedQty || 0;
    default:
      return 0;
  }
}
