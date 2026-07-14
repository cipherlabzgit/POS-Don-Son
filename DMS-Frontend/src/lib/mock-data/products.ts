export interface Product {
  id: number;
  code: string;
  description: string;
  categoryId: number;
  category: string;
  uomId: number;
  uom: string;
  unitPrice: number;
  requireOpenStock: boolean;
  enableLabelPrint: boolean;
  /**
   * 4.vii Label Printing - if TRUE, this product is allowed to be label-printed
   * for Today or future dates (Today+). When such an item is selected, the
   * Date textbox should turn Yellow.
   */
  allowFutureLabelPrint?: boolean;
  active: boolean;
}

export const mockProducts: Product[] = [
  { id: 1, code: 'ACT33', description: 'Chicken Shawarma', categoryId: 1, category: 'Action', uomId: 3, uom: 'Nos', unitPrice: 750.00, requireOpenStock: true, enableLabelPrint: true, active: true },
  { id: 2, code: 'ACT22', description: 'Popcorn Chicken', categoryId: 1, category: 'Action', uomId: 3, uom: 'Nos', unitPrice: 120.00, requireOpenStock: true, enableLabelPrint: true, active: true },
  { id: 3, code: 'ACT32', description: 'String Hoppers Pack', categoryId: 1, category: 'Action', uomId: 3, uom: 'Nos', unitPrice: 30.00, requireOpenStock: false, enableLabelPrint: false, active: true },
  { id: 4, code: 'BR2', description: 'Sandwich Bread Large', categoryId: 3, category: 'Bread', uomId: 3, uom: 'Nos', unitPrice: 280.00, requireOpenStock: true, enableLabelPrint: true, active: true },
  { id: 5, code: 'BR9', description: 'Kurakkan Slice Pack', categoryId: 3, category: 'Bread', uomId: 3, uom: 'Nos', unitPrice: 150.00, requireOpenStock: true, enableLabelPrint: true, active: true },
  { id: 6, code: 'BU12', description: 'Fish Bun', categoryId: 4, category: 'Bun', uomId: 3, uom: 'Nos', unitPrice: 85.00, requireOpenStock: true, enableLabelPrint: true, active: true },
  { id: 7, code: 'BU15', description: 'Chicken Bun', categoryId: 4, category: 'Bun', uomId: 3, uom: 'Nos', unitPrice: 90.00, requireOpenStock: true, enableLabelPrint: true, active: true },
  { id: 8, code: 'SAN5', description: 'Club Sandwich', categoryId: 13, category: 'Sandwich', uomId: 3, uom: 'Nos', unitPrice: 450.00, requireOpenStock: true, enableLabelPrint: true, active: true },
  { id: 9, code: 'PZ8', description: 'Chicken Pizza Large', categoryId: 11, category: 'Pizza', uomId: 3, uom: 'Nos', unitPrice: 1850.00, requireOpenStock: true, enableLabelPrint: true, allowFutureLabelPrint: true, active: true },
  { id: 10, code: 'PS14', description: 'Fish Pastry', categoryId: 12, category: 'Pastry', uomId: 3, uom: 'Nos', unitPrice: 140.00, requireOpenStock: true, enableLabelPrint: true, active: true },
  { id: 11, code: 'RO3', description: 'Fish Rotty', categoryId: 14, category: 'Rotty', uomId: 3, uom: 'Nos', unitPrice: 85.00, requireOpenStock: true, enableLabelPrint: true, active: true },
  { id: 12, code: 'RO4', description: 'Chicken Rotty', categoryId: 14, category: 'Rotty', uomId: 3, uom: 'Nos', unitPrice: 95.00, requireOpenStock: true, enableLabelPrint: true, active: true },
  { id: 13, code: 'BI9', description: 'Doughnut', categoryId: 5, category: 'Biscuit', uomId: 3, uom: 'Nos', unitPrice: 65.00, requireOpenStock: true, enableLabelPrint: true, active: true },
  { id: 14, code: 'BI30', description: 'Coconut Cookie', categoryId: 5, category: 'Biscuit', uomId: 3, uom: 'Nos', unitPrice: 45.00, requireOpenStock: true, enableLabelPrint: true, active: true },
  { id: 15, code: 'BC16', description: 'Special Cake', categoryId: 6, category: 'Butter Cream', uomId: 3, uom: 'Nos', unitPrice: 3500.00, requireOpenStock: false, enableLabelPrint: true, allowFutureLabelPrint: true, active: true },
  { id: 16, code: 'IC7', description: 'Chocolate Cake A', categoryId: 10, category: 'Icing Cake', uomId: 3, uom: 'Nos', unitPrice: 2800.00, requireOpenStock: false, enableLabelPrint: true, allowFutureLabelPrint: true, active: true },
  { id: 17, code: 'PI2', description: 'Ribbon Cake Piece', categoryId: 12, category: 'Pastry', uomId: 3, uom: 'Nos', unitPrice: 180.00, requireOpenStock: true, enableLabelPrint: true, active: true },
  { id: 18, code: 'PI31', description: 'Cake Cuts', categoryId: 12, category: 'Pastry', uomId: 3, uom: 'Nos', unitPrice: 120.00, requireOpenStock: true, enableLabelPrint: true, active: true },
  { id: 19, code: 'DR5', description: 'Rice & Curry Pack', categoryId: 8, category: 'Rice & Curry', uomId: 3, uom: 'Nos', unitPrice: 550.00, requireOpenStock: true, enableLabelPrint: true, active: true },
  { id: 20, code: 'SE22', description: 'Fish Roll', categoryId: 15, category: 'Short Eat', uomId: 3, uom: 'Nos', unitPrice: 75.00, requireOpenStock: true, enableLabelPrint: true, active: true },
];

export const mockCategories = [
  { id: 1, code: 'ACT', name: 'Action', active: true },
  { id: 2, code: 'BAL', name: 'Balancing Malabe', active: true },
  { id: 3, code: 'BR', name: 'Bread', active: true },
  { id: 4, code: 'BU', name: 'Bun', active: true },
  { id: 5, code: 'BI', name: 'Biscuit', active: true },
  { id: 6, code: 'BC', name: 'Butter Cream', active: true },
  { id: 7, code: 'DR', name: 'Drinks', active: true },
  { id: 8, code: 'RC', name: 'Rice & Curry', active: true },
  { id: 9, code: 'PTY', name: 'Party', active: true },
  { id: 10, code: 'IC', name: 'Icing Cake', active: true },
  { id: 11, code: 'PZ', name: 'Pizza', active: true },
  { id: 12, code: 'PS', name: 'Pastry', active: true },
  { id: 13, code: 'SAN', name: 'Sandwich', active: true },
  { id: 14, code: 'RO', name: 'Rotty', active: true },
  { id: 15, code: 'SE', name: 'Short Eat', active: true },
];

export const mockUOMs = [
  { id: 1, code: 'G', description: 'Gram', active: true },
  { id: 2, code: 'ml', description: 'Millilitres', active: true },
  { id: 3, code: 'Nos', description: 'Nos', active: true },
  { id: 4, code: 'Kg', description: 'Kilogram', active: true },
  { id: 5, code: 'Ltr', description: 'Litre', active: true },
];

export interface Ingredient {
  id: number;
  code: string;
  description: string;
  uomId: number;
  uom: string;
  reorderLevel: number;
  active: boolean;
}

export const mockIngredients: Ingredient[] = [
  { id: 1, code: 'FLOUR', description: 'All Purpose Flour', uomId: 4, uom: 'Kg', reorderLevel: 500, active: true },
  { id: 2, code: 'SUGAR', description: 'White Sugar', uomId: 4, uom: 'Kg', reorderLevel: 300, active: true },
  { id: 3, code: 'SALT', description: 'Table Salt', uomId: 4, uom: 'Kg', reorderLevel: 50, active: true },
  { id: 4, code: 'YEAST', description: 'Instant Yeast', uomId: 1, uom: 'G', reorderLevel: 5000, active: true },
  { id: 5, code: 'BUTTER', description: 'Butter', uomId: 4, uom: 'Kg', reorderLevel: 100, active: true },
  { id: 6, code: 'MILK', description: 'Fresh Milk', uomId: 5, uom: 'Ltr', reorderLevel: 200, active: true },
  { id: 7, code: 'EGG', description: 'Eggs', uomId: 3, uom: 'Nos', reorderLevel: 500, active: true },
  { id: 8, code: 'CHOC', description: 'Chocolate Compound', uomId: 4, uom: 'Kg', reorderLevel: 50, active: true },
  { id: 9, code: 'VANILLA', description: 'Vanilla Extract', uomId: 2, uom: 'ml', reorderLevel: 2000, active: true },
  { id: 10, code: 'COCOA', description: 'Cocoa Powder', uomId: 4, uom: 'Kg', reorderLevel: 30, active: true },
  { id: 11, code: 'OILP', description: 'Palm Oil', uomId: 5, uom: 'Ltr', reorderLevel: 100, active: true },
  { id: 12, code: 'CREAM', description: 'Cream', uomId: 5, uom: 'Ltr', reorderLevel: 80, active: true },
  { id: 13, code: 'CHEESE', description: 'Mozzarella Cheese', uomId: 4, uom: 'Kg', reorderLevel: 50, active: true },
  { id: 14, code: 'CHICKEN', description: 'Chicken Meat', uomId: 4, uom: 'Kg', reorderLevel: 100, active: true },
  { id: 15, code: 'FISH', description: 'Fish', uomId: 4, uom: 'Kg', reorderLevel: 80, active: true },
];
