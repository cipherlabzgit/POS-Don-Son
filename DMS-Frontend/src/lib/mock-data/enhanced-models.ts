// Enhanced data models for comprehensive DMS requirements

// ============ ENUMS & TYPES ============

export type ProductType = 'Raw Material' | 'Semi-Finished' | 'Finished' | 'Section';

export type ProductionSection = 
  | 'Bakery 1' 
  | 'Bakery 2' 
  | 'Filling Section' 
  | 'Short-Eats 1' 
  | 'Short-Eats 2' 
  | 'Rotty Section' 
  | 'Plain Roll Section' 
  | 'Pastry Section'
  | 'Garnish Section'
  | 'Packing Section';

export type DeliveryTurn = '5:00 AM' | '10:30 AM' | '3:30 PM' | 'Custom';

export type DayType = 'Weekday' | 'Saturday' | 'Sunday' | 'Public Holiday';

// ============ SECTION CONFIGURATION ============

export interface SectionConfiguration {
  id: number;
  name: ProductionSection;
  productionStartTime: string; // e.g., "23:00" for 11 PM
  effectiveDeliveryDate: 'Same Day' | 'Next Day';
  effectiveDeliveryTime: string; // e.g., "05:00"
  active: boolean;
  sortOrder: number;
}

// ============ DELIVERY TURN CONFIGURATION ============

export interface DeliveryTurnConfiguration {
  id: number;
  name: string; // e.g., "5AM Turn", "10:30AM Turn"
  time: string; // e.g., "05:00", "10:30"
  sections: ProductionSection[]; // Which sections produce for this turn
  active: boolean;
  sortOrder: number;
  dayTypes: DayType[]; // Available on which day types
}

// ============ ENHANCED PRODUCT ============

export interface EnhancedProduct {
  id: number;
  code: string;
  description: string;
  categoryId: number;
  category: string;
  productType: ProductType;
  
  // Size variants
  hasFull: boolean;
  hasMini: boolean;
  allowDecimal: boolean; // NEW: For products like 4.75
  decimalPlaces: number; // NEW: How many decimal places (default 2)
  
  // Multi-turn support
  hasMultiTurn: boolean;
  deliveryTurns: number[]; // IDs of DeliveryTurnConfiguration
  
  // Section assignment
  sections: {
    sectionId: number;
    sectionName: ProductionSection;
    componentName?: string; // e.g., "Dough", "Filling", "Garnish", "Packing"
    isMainSection: boolean;
  }[];
  
  // Round-off configuration
  roundOffValue?: number; // NEW: e.g., 0.25 for rounding to nearest 0.25
  standardValue?: string; // NEW: e.g., "4 patties = 1 egg"
  
  // Variants & weights
  fullWeight?: number; // NEW: Weight for full size
  miniWeight?: number; // NEW: Weight for mini size
  
  // Recipe & Template
  hasRecipe: boolean;
  defaultRecipeTemplateId?: number;
  
  // Inventory
  requireOpenStock: boolean;
  enableLabelPrint: boolean;
  uomId: number;
  uom: string;
  unitPrice: number;
  active: boolean;
}

// ============ ENHANCED INGREDIENT ============

export interface EnhancedIngredient {
  id: number;
  code: string;
  description: string;
  uomId: number;
  uom: string;
  
  // Extra quantity configuration (NEW)
  allowExtraQuantity: boolean;
  extraQuantityPercentage?: number; // e.g., 15% extra for carrot due to cleaning loss
  extraQuantityReason?: string; // e.g., "Weight loss after cleaning"
  
  // Display rules (NEW)
  showInStoresIssueNote: boolean;
  showInProduction: boolean;
  showExtraInStoresOnly: boolean; // Extra qty only in stores, not production
  
  // Section-specific (NEW)
  availableInSections: ProductionSection[];
  
  // Ingredient type (NEW)
  ingredientType: 'Raw' | 'Processed' | 'Semi-Finished'; // e.g., raw eggs vs boiled eggs
  processingMethod?: string; // e.g., "Boiled", "Fried", "Cleaned"
  
  reorderLevel: number;
  active: boolean;
}

// ============ RECIPE WITH SUB-RECIPES ============

export interface RecipeComponent {
  id: number;
  productId: number;
  sectionId: number;
  sectionName: ProductionSection;
  componentName: string; // e.g., "Dough", "Filling", "Topping"
  sortOrder: number;
  ingredients: RecipeIngredient[];
  
  // Percentage-based recipe support (NEW)
  isPercentageBased: boolean;
  baseRecipeId?: number; // Reference to another recipe
  percentageOfBase?: number; // e.g., 50% of base recipe
  additionalIngredients: RecipeIngredient[]; // Extra ingredients added to percentage
}

export interface RecipeIngredient {
  id: number;
  ingredientId: number;
  ingredientCode: string;
  ingredientName: string;
  ingredientType: 'Raw' | 'Processed' | 'Semi-Finished';
  
  // Quantity configuration
  qtyPerUnit: number;
  extraQtyPerUnit: number; // Extra for stores
  unit: string;
  
  // Display & calculation rules
  storesOnly: boolean; // Only for stores issue note
  showExtraInStores: boolean; // Show extra qty in stores but not production
  
  // Percentage-based
  isPercentage: boolean;
  percentageSourceProductId?: number;
  percentageValue?: number; // e.g., 10% of source product
  
  sortOrder: number;
}

export interface EnhancedRecipe {
  id: number;
  productId: number;
  productCode: string;
  productName: string;
  
  // Multi-component recipe
  components: RecipeComponent[];
  
  // Template & versioning
  templateId?: number;
  version: number;
  effectiveFrom: string;
  effectiveTo?: string;
  isActive: boolean;
  
  // Round-off
  applyRoundOff: boolean;
  roundOffValue?: number;
  roundOffNotes?: string;
}

// ============ ORDER ENTRY CONFIGURATION ============

export interface OrderEntryProduct {
  id: number;
  code: string;
  name: string;
  
  // Size & decimal support
  hasFull: boolean;
  hasMini: boolean;
  allowDecimal: boolean;
  decimalPlaces: number;
  
  // Multi-turn
  hasMultiTurn: boolean;
  deliveryTurns: DeliveryTurnConfiguration[];
  
  // Inventory
  freezerBalance: number;
  
  // Status
  isIncluded: boolean; // Y/N toggle per delivery plan
  isCustomized: boolean; // Is this a customized order?
  customizationNotes?: string;
  
  // Section info for display
  primarySection: ProductionSection;
  allSections: ProductionSection[];
}

// ============ DELIVERY PLAN ============

export interface DeliveryPlanConfiguration {
  id: number;
  planNo: string;
  planDate: string;
  planTime: string;
  dayType: DayType;
  
  // Delivery turn
  deliveryTurnId: number;
  deliveryTurn: DeliveryTurnConfiguration;
  
  // Section-wise production times
  sectionSchedules: {
    sectionId: number;
    sectionName: ProductionSection;
    productionStartTime: string;
    productionStartDate: string;
    effectiveDeliveryDate: string;
    effectiveDeliveryTime: string;
  }[];
  
  // Outlet & Product exclusions
  excludedOutlets: number[]; // Outlet IDs not working this delivery
  excludedProducts: number[]; // Product IDs not producing this delivery
  
  // Freezer stock option
  useFreezerStock: boolean; // Toggle to reduce freezer stock from production qty
  
  status: 'Draft' | 'InProduction' | 'Completed' | 'Delivered';
  createdBy: string;
  createdAt: string;
}

// ============ ORDER ENTRY DATA ============

export interface OrderEntryData {
  deliveryPlanId: number;
  productId: number;
  outletId: number;
  
  // Multi-turn quantities
  quantities: {
    turnId: number;
    turnName: string;
    fullQty: number;
    miniQty: number;
  }[];
  
  // Totals
  totalFull: number;
  totalMini: number;
  
  // Customization
  isCustomized: boolean;
  customizationNotes?: string;
  
  // Metadata
  lastUpdated: string;
  updatedBy: string;
}

// ============ STORES ISSUE NOTE ============

export interface StoresIssueNote {
  id: number;
  issueNoteNo: string;
  deliveryPlanId: number;
  deliveryPlan: DeliveryPlanConfiguration;
  
  // Section-specific
  sectionId: number;
  sectionName: ProductionSection;
  
  // Ingredients with extra quantities
  ingredients: {
    ingredientId: number;
    ingredientCode: string;
    ingredientName: string;
    productionQty: number; // Actual recipe qty
    extraQty: number; // Extra for stores
    storesQty: number; // Production + Extra
    unit: string;
    notes?: string;
  }[];
  
  // Product breakdown
  productBreakdown: {
    productId: number;
    productCode: string;
    productName: string;
    fullQty: number;
    miniQty: number;
    customizedQty: number; // Show separately
    totalQty: number;
  }[];
  
  // Freezer stock calculation
  useFreezerStock: boolean;
  freezerStockReduction: {
    productId: number;
    productCode: string;
    totalQty: number;
    freezerStock: number;
    availableBalance: number; // Total - Freezer
  }[];
  
  issueDate: string;
  issuedBy: string;
  status: 'Draft' | 'Issued' | 'Received';
}

// ============ PRODUCTION PLANNER ============

export interface ProductionPlannerView {
  deliveryPlanId: number;
  deliveryPlan: DeliveryPlanConfiguration;
  
  // Section-wise production
  sections: {
    sectionId: number;
    sectionName: ProductionSection;
    startTime: string;
    startDate: string;
    
    products: {
      productId: number;
      productCode: string;
      productName: string;
      
      // Quantities
      regularFullQty: number;
      regularMiniQty: number;
      customizedFullQty: number; // Show separately
      customizedMiniQty: number; // Show separately
      totalFullQty: number; // Regular + Customized
      totalMiniQty: number;
      grandTotal: number;
      
      // Freezer consideration
      freezerStock: number;
      produceQty: number; // Total or (Total - Freezer) based on toggle
      
      // Recipe components for this section
      recipeComponent?: RecipeComponent;
      
      isExcluded: boolean; // Checkbox to exclude
    }[];
  }[];
  
  // Customized orders detail
  customizedOrders: {
    orderNo: string;
    productId: number;
    productCode: string;
    productName: string;
    fullQty: number;
    miniQty: number;
    customizationNotes: string;
    outletId: number;
    outletName: string;
  }[];
}

// ============ ADMIN GRID CONFIGURATION ============

export interface GridColumnConfiguration {
  id: number;
  columnKey: string; // Unique identifier
  columnName: string; // Display name
  columnType: 'Text' | 'Number' | 'Decimal' | 'Checkbox' | 'Dropdown' | 'Custom';
  
  // Hierarchy
  parentColumnId?: number; // For sub-columns
  hasSubColumns: boolean;
  subColumns: GridColumnConfiguration[];
  
  // Properties
  isEditable: boolean;
  isRequired: boolean;
  width?: number;
  sortOrder: number;
  
  // For dropdowns
  dropdownValues?: string[];
  
  // Conditional display
  showCondition?: string; // e.g., "product.hasMultiTurn"
  
  active: boolean;
}

export interface GridConfiguration {
  id: number;
  name: string; // e.g., "Order Entry Grid", "Production Planner Grid"
  description: string;
  
  // Columns
  columns: GridColumnConfiguration[];
  
  // Settings
  allowAddColumns: boolean;
  allowAddRows: boolean;
  allowDeleteColumns: boolean;
  allowDeleteRows: boolean;
  
  version: number;
  lastModified: string;
  modifiedBy: string;
}

// ============ MOCK DATA EXPORTS ============

export const mockSectionConfigurations: SectionConfiguration[] = [
  { id: 1, name: 'Bakery 1', productionStartTime: '23:00', effectiveDeliveryDate: 'Next Day', effectiveDeliveryTime: '05:00', active: true, sortOrder: 1 },
  { id: 2, name: 'Bakery 2', productionStartTime: '23:00', effectiveDeliveryDate: 'Next Day', effectiveDeliveryTime: '05:00', active: true, sortOrder: 2 },
  { id: 3, name: 'Short-Eats 1', productionStartTime: '02:00', effectiveDeliveryDate: 'Same Day', effectiveDeliveryTime: '05:00', active: true, sortOrder: 3 },
  { id: 4, name: 'Short-Eats 2', productionStartTime: '02:00', effectiveDeliveryDate: 'Same Day', effectiveDeliveryTime: '05:00', active: true, sortOrder: 4 },
  { id: 5, name: 'Filling Section', productionStartTime: '01:00', effectiveDeliveryDate: 'Same Day', effectiveDeliveryTime: '05:00', active: true, sortOrder: 5 },
  { id: 6, name: 'Rotty Section', productionStartTime: '03:00', effectiveDeliveryDate: 'Same Day', effectiveDeliveryTime: '05:00', active: true, sortOrder: 6 },
  { id: 7, name: 'Pastry Section', productionStartTime: '00:00', effectiveDeliveryDate: 'Same Day', effectiveDeliveryTime: '05:00', active: true, sortOrder: 7 },
  { id: 8, name: 'Garnish Section', productionStartTime: '03:00', effectiveDeliveryDate: 'Same Day', effectiveDeliveryTime: '05:00', active: true, sortOrder: 8 },
  { id: 9, name: 'Packing Section', productionStartTime: '04:00', effectiveDeliveryDate: 'Same Day', effectiveDeliveryTime: '05:00', active: true, sortOrder: 9 },
];

export const mockDeliveryTurnConfigurations: DeliveryTurnConfiguration[] = [
  {
    id: 1,
    name: '5:00 AM Turn',
    time: '05:00',
    sections: ['Bakery 1', 'Bakery 2', 'Short-Eats 1', 'Short-Eats 2', 'Filling Section', 'Rotty Section', 'Pastry Section'],
    active: true,
    sortOrder: 1,
    dayTypes: ['Weekday', 'Saturday', 'Sunday', 'Public Holiday'],
  },
  {
    id: 2,
    name: '10:30 AM Turn',
    time: '10:30',
    sections: ['Short-Eats 1', 'Short-Eats 2', 'Filling Section'],
    active: true,
    sortOrder: 2,
    dayTypes: ['Weekday', 'Saturday', 'Sunday'],
  },
  {
    id: 3,
    name: '3:30 PM Turn',
    time: '15:30',
    sections: ['Short-Eats 1', 'Short-Eats 2'],
    active: true,
    sortOrder: 3,
    dayTypes: ['Weekday', 'Saturday'],
  },
];
