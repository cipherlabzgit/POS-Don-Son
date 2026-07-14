export interface Delivery {
  id: number;
  deliveryNo: string;
  deliveryDate: string;
  showroomId: number;
  showroom: string;
  status: 'Draft' | 'Pending' | 'Approved' | 'Rejected';
  totalItems: number;
  totalValue: number;
  editUser: string;
  editDate: string;
  approvedBy?: string;
  approvedDate?: string;
  notes?: string;
}

export interface DeliveryItem {
  id: number;
  deliveryId: number;
  productId: number;
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Disposal {
  id: number;
  disposalNo: string;
  disposalDate: string;
  showroomId: number;
  showroom: string;
  deliveredDate: string;
  status: 'Draft' | 'Pending' | 'Approved' | 'Rejected';
  totalItems: number;
  editUser: string;
  editDate: string;
  approvedBy?: string;
  notes?: string;
}

export interface Transfer {
  id: number;
  transferNo: string;
  transferDate: string;
  fromShowroomId: number;
  fromShowroom: string;
  toShowroomId: number;
  toShowroom: string;
  status: 'Draft' | 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  totalItems: number;
  editUser: string;
  editDate: string;
  approvedBy?: string;
  notes?: string;
}

export const mockDeliveries: Delivery[] = [
  { id: 1, deliveryNo: 'DN-2026-001', deliveryDate: '2026-04-21', showroomId: 1, showroom: 'Dalmeny', status: 'Approved', totalItems: 45, totalValue: 125000, editUser: 'admin', editDate: '2026-04-21 08:30', approvedBy: 'Manager', approvedDate: '2026-04-21 09:00' },
  { id: 2, deliveryNo: 'DN-2026-002', deliveryDate: '2026-04-21', showroomId: 2, showroom: 'Ragama', status: 'Approved', totalItems: 38, totalValue: 98000, editUser: 'admin', editDate: '2026-04-21 08:45', approvedBy: 'Manager', approvedDate: '2026-04-21 09:15' },
  { id: 3, deliveryNo: 'DN-2026-003', deliveryDate: '2026-04-21', showroomId: 3, showroom: 'Ranala', status: 'Pending', totalItems: 42, totalValue: 110000, editUser: 'operator1', editDate: '2026-04-21 09:00' },
  { id: 4, deliveryNo: 'DN-2026-004', deliveryDate: '2026-04-21', showroomId: 4, showroom: 'Dehiwala', status: 'Draft', totalItems: 35, totalValue: 95000, editUser: 'operator1', editDate: '2026-04-21 09:20' },
  { id: 5, deliveryNo: 'DN-2026-005', deliveryDate: '2026-04-20', showroomId: 5, showroom: 'Kaduwela', status: 'Approved', totalItems: 40, totalValue: 105000, editUser: 'admin', editDate: '2026-04-20 08:30', approvedBy: 'Manager', approvedDate: '2026-04-20 09:00' },
];

export const mockDisposals: Disposal[] = [
  { id: 1, disposalNo: 'DS-2026-001', disposalDate: '2026-04-21', showroomId: 1, showroom: 'Dalmeny', deliveredDate: '2026-04-20', status: 'Approved', totalItems: 15, editUser: 'cashier1', editDate: '2026-04-21 07:00', approvedBy: 'Manager' },
  { id: 2, disposalNo: 'DS-2026-002', disposalDate: '2026-04-21', showroomId: 2, showroom: 'Ragama', deliveredDate: '2026-04-20', status: 'Pending', totalItems: 12, editUser: 'cashier1', editDate: '2026-04-21 07:15' },
  { id: 3, disposalNo: 'DS-2026-003', disposalDate: '2026-04-20', showroomId: 3, showroom: 'Ranala', deliveredDate: '2026-04-19', status: 'Approved', totalItems: 18, editUser: 'cashier1', editDate: '2026-04-20 07:00', approvedBy: 'Manager' },
];

export const mockTransfers: Transfer[] = [
  { id: 1, transferNo: 'TR-2026-001', transferDate: '2026-04-21', fromShowroomId: 1, fromShowroom: 'Dalmeny', toShowroomId: 2, toShowroom: 'Ragama', status: 'Completed', totalItems: 20, editUser: 'admin', editDate: '2026-04-21 10:00', approvedBy: 'Manager' },
  { id: 2, transferNo: 'TR-2026-002', transferDate: '2026-04-21', fromShowroomId: 3, fromShowroom: 'Ranala', toShowroomId: 4, toShowroom: 'Dehiwala', status: 'Pending', totalItems: 15, editUser: 'operator1', editDate: '2026-04-21 10:30' },
  { id: 3, transferNo: 'TR-2026-003', transferDate: '2026-04-21', fromShowroomId: 2, fromShowroom: 'Ragama', toShowroomId: 1, toShowroom: 'Dalmeny', status: 'Draft', totalItems: 10, editUser: 'operator1', editDate: '2026-04-21 11:00' },
];
