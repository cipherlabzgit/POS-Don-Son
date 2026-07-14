export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  roleId: number;
  role: string;
  phone: string;
  active: boolean;
}

export interface Role {
  id: number;
  code: string;
  name: string;
  description: string;
  active: boolean;
}

export interface Permission {
  id: number;
  module: string;
  action: string;
  description: string;
  active: boolean;
}

export const mockUsers: User[] = [
  { id: 1, username: 'admin', fullName: 'System Administrator', email: 'admin@donandson.com', roleId: 1, role: 'SuperAdmin', phone: '077-1234567', active: true },
  { id: 2, username: 'Dulan', fullName: 'Dulan', email: 'dulan@donandson.com', roleId: 1, role: 'SuperAdmin', phone: '077-2345678', active: true },
  { id: 3, username: 'Harry', fullName: 'Harry', email: 'harry@donandson.com', roleId: 1, role: 'SuperAdmin', phone: '077-3456789', active: true },
  { id: 4, username: 'admin1', fullName: 'Admin1', email: 'admin1@donandson.com', roleId: 1, role: 'SuperAdmin', phone: '077-4567890', active: true },
  { id: 5, username: 'prasadls', fullName: 'Prasad LS', email: 'prasadls@donandson.com', roleId: 1, role: 'SuperAdmin', phone: '077-5678901', active: true },
  { id: 6, username: 'Chamila Saranag', fullName: 'Chamila Saranag', email: 'chamila@donandson.com', roleId: 6, role: 'Block Adj Only', phone: '077-6789012', active: true },
  { id: 7, username: 'Vins', fullName: 'Vins', email: 'vins@donandson.com', roleId: 3, role: 'Sales Manager', phone: '077-7890123', active: true },
  { id: 8, username: 'Meeda', fullName: 'Meeda', email: 'meeda@donandson.com', roleId: 3, role: 'Sales Manager', phone: '077-8901234', active: true },
  { id: 9, username: 'Ubed Nanayakkara', fullName: 'Ubed Nanayakkara', email: 'ubed@donandson.com', roleId: 7, role: 'Production Manager', phone: '077-9012345', active: true },
  { id: 10, username: 'Hasindu', fullName: 'Hasindu', email: 'hasindu@donandson.com', roleId: 2, role: 'Production', phone: '077-0123456', active: true },
];

export const mockRoles: Role[] = [
  { id: 1, code: 'SUPERADMIN', name: 'SuperAdmin', description: 'Full system access', active: true },
  { id: 2, code: 'PRODUCTION', name: 'Production', description: 'Production operations', active: true },
  { id: 3, code: 'SALESMGR', name: 'Sales Manager', description: 'Sales management access', active: true },
  { id: 4, code: 'DELIVERIES', name: 'Deliveries', description: 'Delivery operations', active: true },
  { id: 5, code: 'POSSYSTEM', name: 'POS System', description: 'Point of sale access', active: true },
  { id: 6, code: 'BLOCKADJONLY', name: 'Block Adj Only', description: 'Block adjustment only', active: true },
  { id: 7, code: 'PRODMGR', name: 'Production Manager', description: 'Production management', active: true },
  { id: 8, code: 'AUTOSALESMGR', name: 'Auto Sales Manager', description: 'Automated sales management', active: true },
  { id: 9, code: 'FINANCE', name: 'Finance', description: 'Financial operations', active: true },
  { id: 10, code: 'DATAENTRY', name: 'Data Entry', description: 'Data entry operations', active: true },
  { id: 11, code: 'PROBIOADJ', name: 'Pro & Bio Adj Only', description: 'Production and bio adjustments', active: true },
  { id: 12, code: 'REPORTS', name: 'Reports', description: 'Report generation and viewing', active: true },
  { id: 13, code: 'STOCKADJONLY', name: 'Stock Adj Only', description: 'Stock adjustment only', active: true },
  { id: 14, code: 'DELIVERYONLY', name: 'Delivery Only', description: 'Delivery operations only', active: true },
];

export const mockPermissions: Permission[] = [
  { id: 1, module: 'Dashboard', action: 'VIEW', description: 'View dashboard', active: true },
  { id: 2, module: 'Products', action: 'CREATE', description: 'Create products', active: true },
  { id: 3, module: 'Products', action: 'EDIT', description: 'Edit products', active: true },
  { id: 4, module: 'Products', action: 'DELETE', description: 'Delete products', active: true },
  { id: 5, module: 'Products', action: 'VIEW', description: 'View products', active: true },
  { id: 6, module: 'Delivery', action: 'CREATE', description: 'Create delivery', active: true },
  { id: 7, module: 'Delivery', action: 'EDIT', description: 'Edit delivery', active: true },
  { id: 8, module: 'Delivery', action: 'APPROVE', description: 'Approve delivery', active: true },
  { id: 9, module: 'Reports', action: 'VIEW', description: 'View reports', active: true },
  { id: 10, module: 'Reports', action: 'EXPORT', description: 'Export reports', active: true },
  { id: 11, module: 'Settings', action: 'EDIT', description: 'Edit settings', active: true },
  { id: 12, module: 'Users', action: 'MANAGE', description: 'Manage users', active: true },
];
