export interface DailyProduction {
  id: number;
  productionNo: string;
  productionDate: string;
  productId: number;
  productCode: string;
  productName: string;
  plannedQty: number;
  producedQty: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  shift: 'Morning' | 'Evening' | 'Night';
  editUser: string;
  editDate: string;
  approvedBy?: string;
}

export interface CurrentStock {
  id: number;
  product: string;
  openBalance: number;
  todayProduction: number;
  todayProductionCancelled: number;
  todayDelivery: number;
  deliveryCancelled: number;
  deliveryReturned: number;
  todayBalance: number;
}

export interface StockAdjustment {
  id: number;
  adjustmentNo: string;
  adjustmentDate: string;
  productId: number;
  productCode: string;
  productName: string;
  adjustmentType: 'Increase' | 'Decrease';
  quantity: number;
  reason: string;
  status: 'Draft' | 'Pending' | 'Approved' | 'Rejected';
  editUser: string;
  editDate: string;
  approvedBy?: string;
}

export interface ProductionPlan {
  id: number;
  planNo: string;
  planDate: string;
  productId: number;
  productCode: string;
  productName: string;
  plannedQty: number;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Draft' | 'Approved' | 'In Progress' | 'Completed';
  notes?: string;
  editUser: string;
  editDate: string;
  reference: string;
  comment: string;
  approvedBy?: string;
}

export const mockDailyProduction: DailyProduction[] = [
  { id: 1, productionNo: 'PRO0002165', productionDate: '2026-01-10', productId: 1, productCode: 'BR2', productName: 'Sandwich Bread Large', plannedQty: 500, producedQty: 485, status: 'Pending', shift: 'Morning', editUser: 'Kavindu Murujika', editDate: '1/10/2026 4:35:41 PM', approvedBy: undefined },
  { id: 2, productionNo: 'PRO0002166', productionDate: '2026-01-10', productId: 6, productCode: 'BU12', productName: 'Fish Bun', plannedQty: 300, producedQty: 280, status: 'Pending', shift: 'Morning', editUser: 'Kavindu Diarangl', editDate: '1/10/2026 4:36:41 PM', approvedBy: undefined },
  { id: 3, productionNo: 'PRO0002167', productionDate: '2026-01-10', productId: 9, productCode: 'PZ8', productName: 'Chicken Pizza Large', plannedQty: 50, producedQty: 45, status: 'Pending', shift: 'Morning', editUser: 'Kavindu Diarangl', editDate: '1/10/2026 4:37:12 PM', approvedBy: undefined },
  { id: 4, productionNo: 'PRO0002168', productionDate: '2026-01-10', productId: 2, productCode: 'BR9', productName: 'Kurakkan Slice Pack', plannedQty: 200, producedQty: 195, status: 'Pending', shift: 'Morning', editUser: 'Kavindu Diarangl', editDate: '1/10/2026 4:33:30 PM', approvedBy: undefined },
  { id: 5, productionNo: 'PRO0002169', productionDate: '2026-01-10', productId: 7, productCode: 'BU15', productName: 'Chicken Bun', plannedQty: 400, producedQty: 390, status: 'Pending', shift: 'Morning', editUser: 'Kavindu Diarangl', editDate: '1/10/2026 4:33:35 PM', approvedBy: undefined },
  { id: 6, productionNo: 'PRO0002170', productionDate: '2026-01-10', productId: 3, productCode: 'BR3', productName: 'Whole Wheat Bread', plannedQty: 150, producedQty: 145, status: 'Pending', shift: 'Morning', editUser: 'Kavindu Diarangl', editDate: '1/10/2026 4:32:10 PM', approvedBy: undefined },
  { id: 7, productionNo: 'PRO0002171', productionDate: '2026-01-09', productId: 4, productCode: 'BR5', productName: 'Butter Cake', plannedQty: 100, producedQty: 98, status: 'Rejected', shift: 'Morning', editUser: 'Kavindu Murujika', editDate: '1/9/2026 4:04:50 PM', approvedBy: undefined },
  { id: 8, productionNo: 'PRO0002172', productionDate: '2026-01-08', productId: 8, productCode: 'PZ5', productName: 'Vegetable Pizza', plannedQty: 80, producedQty: 75, status: 'Approved', shift: 'Evening', editUser: 'Kavindu Murujika', editDate: '1/8/2026 8:48:18 PM', approvedBy: 'Vins - 1/10/2026' },
  { id: 9, productionNo: 'PRO0002173', productionDate: '2026-01-08', productId: 5, productCode: 'BU8', productName: 'Egg Bun', plannedQty: 350, producedQty: 340, status: 'Approved', shift: 'Morning', editUser: 'Kavindu Diarangl', editDate: '1/8/2026 11:19:22 AM', approvedBy: 'Vins - 1/10/2026' },
  { id: 10, productionNo: 'PRO0002174', productionDate: '2026-01-07', productId: 10, productCode: 'CK1', productName: 'Chocolate Cake', plannedQty: 60, producedQty: 58, status: 'Approved', shift: 'Morning', editUser: 'Kavindu Diarangl', editDate: '1/7/2026 11:18:27 AM', approvedBy: 'Vins - 1/10/2026' },
];

export const mockCurrentStock: CurrentStock[] = [
  { id: 1, product: 'ACT1-Chicken Rice', openBalance: 0, todayProduction: 0, todayProductionCancelled: 0, todayDelivery: 0, deliveryCancelled: 0, deliveryReturned: 0, todayBalance: 0 },
  { id: 2, product: 'ACT16-Seafood Noodles', openBalance: 0, todayProduction: 0, todayProductionCancelled: 0, todayDelivery: 0, deliveryCancelled: 0, deliveryReturned: 0, todayBalance: 0 },
  { id: 3, product: 'ACT17-Egg Noodles', openBalance: 0, todayProduction: 0, todayProductionCancelled: 0, todayDelivery: 0, deliveryCancelled: 0, deliveryReturned: 0, todayBalance: 0 },
  { id: 4, product: 'ACT21-Vegetable Fried Rice', openBalance: 0, todayProduction: 0, todayProductionCancelled: 0, todayDelivery: 0, deliveryCancelled: 0, deliveryReturned: 0, todayBalance: 0 },
  { id: 5, product: 'ACT3-White Hoppers', openBalance: 0, todayProduction: 0, todayProductionCancelled: 0, todayDelivery: 0, deliveryCancelled: 0, deliveryReturned: 0, todayBalance: 0 },
  { id: 6, product: 'ACT14-Egg Hoppers', openBalance: 0, todayProduction: 0, todayProductionCancelled: 0, todayDelivery: 0, deliveryCancelled: 0, deliveryReturned: 0, todayBalance: 0 },
  { id: 7, product: 'ACT15-BBQ Chicken Win Bun & BBQ Sauce', openBalance: 15, todayProduction: 0, todayProductionCancelled: 0, todayDelivery: 0, deliveryCancelled: 0, deliveryReturned: 0, todayBalance: 15 },
  { id: 8, product: 'ACT16-Pork Chop With Bun & BBQ Sauce', openBalance: 8, todayProduction: 0, todayProductionCancelled: 0, todayDelivery: 0, deliveryCancelled: 0, deliveryReturned: 0, todayBalance: 8 },
  { id: 9, product: 'ACT17-French Fries', openBalance: 0, todayProduction: 0, todayProductionCancelled: 0, todayDelivery: 0, deliveryCancelled: 0, deliveryReturned: 0, todayBalance: 0 },
  { id: 10, product: 'ACT18-Devilled Cutlefish', openBalance: 0, todayProduction: 0, todayProductionCancelled: 0, todayDelivery: 0, deliveryCancelled: 0, deliveryReturned: 0, todayBalance: 0 },
  { id: 11, product: 'ACT19-Devilled Pork', openBalance: 0, todayProduction: 0, todayProductionCancelled: 0, todayDelivery: 0, deliveryCancelled: 0, deliveryReturned: 0, todayBalance: 0 },
  { id: 12, product: 'ACT2-Seafood Rice', openBalance: 0, todayProduction: 0, todayProductionCancelled: 0, todayDelivery: 0, deliveryCancelled: 0, deliveryReturned: 0, todayBalance: 0 },
  { id: 13, product: 'ACT20-Crispy Chicken Burger', openBalance: 0, todayProduction: 0, todayProductionCancelled: 0, todayDelivery: 0, deliveryCancelled: 0, deliveryReturned: 0, todayBalance: 0 },
  { id: 14, product: 'ACT21-Crispy Chicken Burger with Cheese', openBalance: 0, todayProduction: 0, todayProductionCancelled: 0, todayDelivery: 0, deliveryCancelled: 0, deliveryReturned: 0, todayBalance: 0 },
  { id: 15, product: 'ACT22-Popcorn Chicken', openBalance: 0, todayProduction: 10, todayProductionCancelled: 0, todayDelivery: 10, deliveryCancelled: 0, deliveryReturned: 0, todayBalance: 0 },
  { id: 16, product: 'ACT23-Jumbo Hot Dog', openBalance: 0, todayProduction: 0, todayProductionCancelled: 0, todayDelivery: 0, deliveryCancelled: 0, deliveryReturned: 0, todayBalance: 0 },
  { id: 17, product: 'ACT24-Vegetable String Hopper Kottu', openBalance: 0, todayProduction: 0, todayProductionCancelled: 0, todayDelivery: 0, deliveryCancelled: 0, deliveryReturned: 0, todayBalance: 0 },
  { id: 18, product: 'ACT25-Chicken String Hopper Kottu', openBalance: 0, todayProduction: 0, todayProductionCancelled: 0, todayDelivery: 0, deliveryCancelled: 0, deliveryReturned: 0, todayBalance: 0 },
  { id: 19, product: 'ACT26-Seafood String Hopper Kottu', openBalance: 0, todayProduction: 0, todayProductionCancelled: 0, todayDelivery: 0, deliveryCancelled: 0, deliveryReturned: 0, todayBalance: 0 },
  { id: 20, product: 'ACT27-Egg String Hopper Kottu', openBalance: 0, todayProduction: 0, todayProductionCancelled: 0, todayDelivery: 0, deliveryCancelled: 0, deliveryReturned: 0, todayBalance: 0 },
  { id: 21, product: 'ACT28-Jumbo Hot Dog', openBalance: 0, todayProduction: 0, todayProductionCancelled: 0, todayDelivery: 0, deliveryCancelled: 0, deliveryReturned: 0, todayBalance: 0 },
  { id: 22, product: 'ACT29-Pol Rotty', openBalance: 17, todayProduction: 17, todayProductionCancelled: 0, todayDelivery: 17, deliveryCancelled: 0, deliveryReturned: 0, todayBalance: 17 },
  { id: 23, product: 'ACT3-Egg Rice', openBalance: 0, todayProduction: 0, todayProductionCancelled: 0, todayDelivery: 0, deliveryCancelled: 0, deliveryReturned: 0, todayBalance: 0 },
];

export const mockStockAdjustments: StockAdjustment[] = [
  { id: 1, adjustmentNo: 'PSA0001874', adjustmentDate: '2026-01-09', productId: 1, productCode: 'BR2', productName: 'Sandwich Bread Large', adjustmentType: 'Decrease', quantity: 15, reason: 'Damaged during transportation', status: 'Approved', editUser: 'Chamila Saranag', editDate: '1/9/2026 2:52:00 PM', approvedBy: 'Vins - 1/10/2026' },
  { id: 2, adjustmentNo: 'PSA0001873', adjustmentDate: '2026-01-09', productId: 7, productCode: 'BU15', productName: 'Chicken Bun', adjustmentType: 'Increase', quantity: 10, reason: 'Stock count correction', status: 'Approved', editUser: 'Harendra Sachin', editDate: '1/9/2026 6:02:40 PM', approvedBy: 'Vins - 1/10/2026' },
  { id: 3, adjustmentNo: 'PSA0001872', adjustmentDate: '2026-01-09', productId: 9, productCode: 'PZ8', productName: 'Chicken Pizza Large', adjustmentType: 'Decrease', quantity: 5, reason: 'Quality control rejection', status: 'Approved', editUser: 'Kalum Dhammika', editDate: '1/9/2026 5:31:25 PM', approvedBy: 'Vins - 1/10/2026' },
  { id: 4, adjustmentNo: 'PSA0001871', adjustmentDate: '2026-01-08', productId: 2, productCode: 'BR9', productName: 'Kurakkan Slice Pack', adjustmentType: 'Increase', quantity: 20, reason: 'Additional stock', status: 'Approved', editUser: 'Thushan Damena', editDate: '1/9/2026 3:16:58 PM', approvedBy: 'Vins - 1/10/2026' },
  { id: 5, adjustmentNo: 'PSA0001870', adjustmentDate: '2026-01-09', productId: 3, productCode: 'BR3', productName: 'Whole Wheat Bread', adjustmentType: 'Decrease', quantity: 8, reason: 'Expired stock', status: 'Approved', editUser: 'Kalum Dhammika', editDate: '1/8/2026 4:40:26 PM', approvedBy: 'Vins - 1/10/2026' },
  { id: 6, adjustmentNo: 'PSA0001869', adjustmentDate: '2026-01-08', productId: 4, productCode: 'BR5', productName: 'Butter Cake', adjustmentType: 'Increase', quantity: 12, reason: 'Production surplus', status: 'Approved', editUser: 'Chamila Saranag', editDate: '1/8/2026 6:16:25 PM', approvedBy: 'Vins - 1/8/2026' },
  { id: 7, adjustmentNo: 'PSA0001868', adjustmentDate: '2026-01-08', productId: 5, productCode: 'BU8', productName: 'Egg Bun', adjustmentType: 'Decrease', quantity: 6, reason: 'Quality issue', status: 'Approved', editUser: 'Harendra Sachin', editDate: '1/8/2026 7:07:42 PM', approvedBy: 'Vins - 1/9/2026' },
  { id: 8, adjustmentNo: 'PSA0001867', adjustmentDate: '2026-01-08', productId: 6, productCode: 'BU12', productName: 'Fish Bun', adjustmentType: 'Increase', quantity: 18, reason: 'Stock correction', status: 'Approved', editUser: 'Samitha Sadhawan', editDate: '1/8/2026 6:36:53 PM', approvedBy: 'Vins - 1/9/2026' },
  { id: 9, adjustmentNo: 'PSA0001866', adjustmentDate: '2026-01-07', productId: 8, productCode: 'PZ5', productName: 'Vegetable Pizza', adjustmentType: 'Decrease', quantity: 4, reason: 'Damaged', status: 'Approved', editUser: 'Thushan Damena', editDate: '1/8/2026 5:51:47 PM', approvedBy: 'Vins - 1/9/2026' },
  { id: 10, adjustmentNo: 'PSA0001865', adjustmentDate: '2026-01-07', productId: 10, productCode: 'CK1', productName: 'Chocolate Cake', adjustmentType: 'Increase', quantity: 14, reason: 'Stock replenishment', status: 'Approved', editUser: 'Samitha Sadhawan', editDate: '1/7/2026 6:46:58 PM', approvedBy: 'Vins - 1/8/2026' },
];

export const mockProductionPlans: ProductionPlan[] = [
  { id: 1, planNo: 'PRJ0012661', planDate: '2026-01-11', productId: 1, productCode: 'BR2', productName: 'Sandwich Bread Large', plannedQty: 600, priority: 'High', status: 'Approved', notes: '', editUser: 'Kavindu Diarangl', editDate: '1/11/2026 12:32:01 PM', reference: '3:00 am', comment: '-', approvedBy: '-' },
  { id: 2, planNo: 'PRJ0012660', planDate: '2026-01-10', productId: 6, productCode: 'BU12', productName: 'Fish Bun', plannedQty: 400, priority: 'High', status: 'Approved', notes: '', editUser: 'Haridas', editDate: '1/10/2026 8:12:09 AM', reference: '1/9/0026 11:00am-nc12789', comment: '-', approvedBy: '-' },
  { id: 3, planNo: 'PRJ0012659', planDate: '2026-01-09', productId: 9, productCode: 'PZ8', productName: 'Chicken Pizza Large', plannedQty: 80, priority: 'Medium', status: 'Approved', notes: '', editUser: 'Kavindu Diarangl', editDate: '1/9/2026 1:49:09 PM', reference: 'Saturday 3:00 am', comment: '-', approvedBy: '-' },
  { id: 4, planNo: 'PRJ0012658', planDate: '2026-01-09', productId: 2, productCode: 'BR9', productName: 'Kurakkan Slice Pack', plannedQty: 300, priority: 'Medium', status: 'Approved', notes: '', editUser: 'Kavindu Diarangl', editDate: '1/9/2026 12:37:58 PM', reference: 'Thursday Friday 3:00 am', comment: '-', approvedBy: '-' },
  { id: 5, planNo: 'PRJ0012657', planDate: '2026-01-09', productId: 3, productCode: 'BR3', productName: 'Whole Wheat Bread', plannedQty: 250, priority: 'High', status: 'Approved', notes: '', editUser: 'Haridas', editDate: '1/9/2026 12:41 AM', reference: '2/26/0158-nc12789 10:00am', comment: '-', approvedBy: '-' },
  { id: 6, planNo: 'PRJ0012656', planDate: '2026-01-09', productId: 4, productCode: 'BR5', productName: 'Butter Cake', plannedQty: 150, priority: 'Medium', status: 'Approved', notes: '', editUser: 'Kavindu Diarangl', editDate: '1/7/2026 11:45:31 PM', reference: 'Thursday Friday 3:00 am', comment: '-', approvedBy: '-' },
  { id: 7, planNo: 'PRJ0012655', planDate: '2026-01-07', productId: 5, productCode: 'BU8', productName: 'Egg Bun', plannedQty: 350, priority: 'High', status: 'Approved', notes: '', editUser: 'Kavindu Diarangl', editDate: '1/6/2026 12:31:52 PM', reference: 'Monday Tuesday Wednesday 3:00 am', comment: '-', approvedBy: '-' },
  { id: 8, planNo: 'PRJ0012654', planDate: '2026-01-05', productId: 7, productCode: 'BU15', productName: 'Chicken Bun', plannedQty: 400, priority: 'High', status: 'Approved', notes: '', editUser: 'Haridas', editDate: '1/5/2026 9:10:38 AM', reference: 'Monday Tuesday Wednesday 3:00 am', comment: '-', approvedBy: '-' },
  { id: 9, planNo: 'PRJ0012653', planDate: '2026-01-05', productId: 8, productCode: 'PZ5', productName: 'Vegetable Pizza', plannedQty: 100, priority: 'Medium', status: 'Approved', notes: '', editUser: 'Priyani Nishwani', editDate: '1/5/2026 1:20:05 PM', reference: 'Monday Tuesday Wednesday 5:00 am', comment: '-', approvedBy: '-' },
  { id: 10, planNo: 'PRJ0012652', planDate: '2026-01-04', productId: 10, productCode: 'CK1', productName: 'Chocolate Cake', plannedQty: 80, priority: 'Low', status: 'Approved', notes: '', editUser: 'Kavindu Diarangl', editDate: '1/4/2026 11:07:10 AM', reference: 'Monday Tuesday Wednesday 5:00 am', comment: '-', approvedBy: '-' },
];
