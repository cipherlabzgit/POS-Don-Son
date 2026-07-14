// Outlets master with variants (DAL-BBQ)
// Task E1.5 — Outlet master incl. SRP and DAL-BBQ variant

export interface OutletFull {
  id: number;
  code: string;
  name: string;
  parentOutletId?: number; // For variants like DAL-BBQ under DAL
  isVariant: boolean;
  variantName?: string;
  active: boolean;
  sortOrder: number;
  address?: string;
  phone?: string;
  managerName?: string;
}

export const mockOutletsFull: OutletFull[] = [
  // Primary outlets from Excel
  { id: 1, code: 'DBQ', name: 'Don & Sons - Bambalapitiya', parentOutletId: undefined, isVariant: false, active: true, sortOrder: 1, address: '123 Galle Road, Colombo 04', phone: '0112345678', managerName: 'Kamal Silva' },
  { id: 2, code: 'SJE', name: 'Don & Sons - Slave Island', parentOutletId: undefined, isVariant: false, active: true, sortOrder: 2, address: '45 D.R. Wijewardena Mawatha, Colombo 02', phone: '0112345679', managerName: 'Nimal Fernando' },
  { id: 3, code: 'YRK', name: 'Don & Sons - York Street', parentOutletId: undefined, isVariant: false, active: true, sortOrder: 3, address: '78 York Street, Colombo 01', phone: '0112345680', managerName: 'Sunil Perera' },
  { id: 4, code: 'KEL', name: 'Don & Sons - Kelaniya', parentOutletId: undefined, isVariant: false, active: true, sortOrder: 4, address: '12 Kandy Road, Kelaniya', phone: '0112345681', managerName: 'Rohan Wickrama' },
  { id: 5, code: 'BC', name: 'Don & Sons - Borella', parentOutletId: undefined, isVariant: false, active: true, sortOrder: 5, address: '56 Baseline Road, Borella', phone: '0112345682', managerName: 'Ajith Kumar' },
  { id: 6, code: 'SGK', name: 'Don & Sons - Nugegoda', parentOutletId: undefined, isVariant: false, active: true, sortOrder: 6, address: '89 High Level Road, Nugegoda', phone: '0112345683', managerName: 'Pradeep De Silva' },
  { id: 7, code: 'KML', name: 'Don & Sons - Kiribathgoda', parentOutletId: undefined, isVariant: false, active: true, sortOrder: 7, address: '23 Makola Road, Kiribathgoda', phone: '0112345684', managerName: 'Gamini Jayasuriya' },
  { id: 8, code: 'BWA', name: 'Don & Sons - Battaramulla', parentOutletId: undefined, isVariant: false, active: true, sortOrder: 8, address: '67 Pannipitiya Road, Battaramulla', phone: '0112345685', managerName: 'Chaminda Rathnayake' },
  { id: 9, code: 'RAG', name: 'Don & Sons - Ragama', parentOutletId: undefined, isVariant: false, active: true, sortOrder: 9, address: '34 Colombo Road, Ragama', phone: '0112345686', managerName: 'Lasith Malinga' },
  { id: 10, code: 'KDW', name: 'Don & Sons - Kaduwela', parentOutletId: undefined, isVariant: false, active: true, sortOrder: 10, address: '91 Avissawella Road, Kaduwela', phone: '0112345687', managerName: 'Dinesh Chandimal' },
  { id: 11, code: 'WED', name: 'Don & Sons - Wattala', parentOutletId: undefined, isVariant: false, active: true, sortOrder: 11, address: '45 Negombo Road, Wattala', phone: '0112345688', managerName: 'Upul Tharanga' },
  { id: 12, code: 'RAN', name: 'Don & Sons - Ranpokunagama', parentOutletId: undefined, isVariant: false, active: true, sortOrder: 12, address: '12 Main Street, Ranpokunagama', phone: '0112345689', managerName: 'Mahela Jayawardena' },
  
  // DAL primary outlet
  { id: 13, code: 'DAL', name: 'Don & Sons - Dalugama', parentOutletId: undefined, isVariant: false, active: true, sortOrder: 13, address: '78 Kandy Road, Dalugama', phone: '0112345690', managerName: 'Kumar Sangakkara' },
  
  // DAL-BBQ variant (nested under DAL)
  { id: 14, code: 'DAL-BBQ', name: 'Don & Sons - Dalugama BBQ Counter', parentOutletId: 13, isVariant: true, variantName: 'BBQ Counter', active: true, sortOrder: 14, address: '78 Kandy Road, Dalugama (BBQ)', phone: '0112345690', managerName: 'Kumar Sangakkara' },
  
  // SRP (Sripath) - mentioned in Excel
  { id: 15, code: 'SRP', name: 'Don & Sons - Sripath', parentOutletId: undefined, isVariant: false, active: true, sortOrder: 15, address: '23 Sripath Lane, Colombo 05', phone: '0112345691', managerName: 'Angelo Mathews' },
];

// Helper functions
export function getParentOutlets(): OutletFull[] {
  return mockOutletsFull.filter(o => !o.isVariant);
}

export function getOutletVariants(parentId: number): OutletFull[] {
  return mockOutletsFull.filter(o => o.parentOutletId === parentId);
}

export function getOutletByCode(code: string): OutletFull | undefined {
  return mockOutletsFull.find(o => o.code === code);
}

export function getAllActiveOutlets(): OutletFull[] {
  return mockOutletsFull.filter(o => o.active);
}

export function getOutletHierarchy(): { parent: OutletFull; variants: OutletFull[] }[] {
  const parents = getParentOutlets();
  return parents.map(parent => ({
    parent,
    variants: getOutletVariants(parent.id)
  }));
}

// Flatten for grid display (parent + variants as adjacent columns)
export function getFlattenedOutletsForGrid(): OutletFull[] {
  const hierarchy = getOutletHierarchy();
  const flattened: OutletFull[] = [];
  
  hierarchy.forEach(({ parent, variants }) => {
    flattened.push(parent);
    variants.forEach(variant => flattened.push(variant));
  });
  
  return flattened;
}
