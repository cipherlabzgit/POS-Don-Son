// Delivery Turns master data for Excel parity
// Task E1.2 — Configurable Delivery Turns including 6:00 AM

export interface DeliveryTurn {
  id: number;
  code: string;
  displayName: string;
  time: string; // HH:mm format
  isSecondaryMorning: boolean; // 6 AM is secondary to 5 AM
  isPreviousDay: boolean; // Production starts previous day
  productionStartTime: string; // HH:mm format
  sortOrder: number;
  isActive: boolean;
  icon?: string;
  color?: string;
}

export const mockDeliveryTurns: DeliveryTurn[] = [
  {
    id: 1,
    code: '05_00_AM',
    displayName: '5:00 AM',
    time: '05:00',
    isSecondaryMorning: false,
    isPreviousDay: true,
    productionStartTime: '23:00', // Previous day 11 PM
    sortOrder: 1,
    isActive: true,
    icon: '🌅',
    color: '#FF6B6B'
  },
  {
    id: 2,
    code: '06_00_AM',
    displayName: '6:00 AM',
    time: '06:00',
    isSecondaryMorning: true,
    isPreviousDay: true,
    productionStartTime: '00:30', // Current day 12:30 AM
    sortOrder: 2,
    isActive: true,
    icon: '🌄',
    color: '#FF8C42'
  },
  {
    id: 3,
    code: '10_30_AM',
    displayName: '10:30 AM',
    time: '10:30',
    isSecondaryMorning: false,
    isPreviousDay: false,
    productionStartTime: '06:00', // Same day 6 AM
    sortOrder: 3,
    isActive: true,
    icon: '☀️',
    color: '#FFD93D'
  },
  {
    id: 4,
    code: '01_30_PM',
    displayName: '1:30 PM',
    time: '13:30',
    isSecondaryMorning: false,
    isPreviousDay: false,
    productionStartTime: '09:00', // Same day 9 AM
    sortOrder: 4,
    isActive: true,
    icon: '🌤️',
    color: '#6BCB77'
  },
  {
    id: 5,
    code: '02_30_PM',
    displayName: '2:30 PM',
    time: '14:30',
    isSecondaryMorning: false,
    isPreviousDay: false,
    productionStartTime: '09:30', // Same day 9:30 AM
    sortOrder: 5,
    isActive: true,
    icon: '☁️',
    color: '#4D96FF'
  },
  {
    id: 6,
    code: '03_30_PM',
    displayName: '3:30 PM',
    time: '15:30',
    isSecondaryMorning: false,
    isPreviousDay: false,
    productionStartTime: '10:30', // Same day 10:30 AM
    sortOrder: 6,
    isActive: true,
    icon: '🌆',
    color: '#9D84B7'
  }
];

// Helper functions
export function getMorningTurns(): DeliveryTurn[] {
  return mockDeliveryTurns.filter(t => 
    parseInt(t.time.split(':')[0]) < 12
  );
}

export function getAfternoonTurns(): DeliveryTurn[] {
  return mockDeliveryTurns.filter(t => 
    parseInt(t.time.split(':')[0]) >= 12
  );
}

export function getTurnByCode(code: string): DeliveryTurn | undefined {
  return mockDeliveryTurns.find(t => t.code === code);
}

export function getPreviousDayTurns(): DeliveryTurn[] {
  return mockDeliveryTurns.filter(t => t.isPreviousDay);
}

export function getActiveTurns(): DeliveryTurn[] {
  return mockDeliveryTurns.filter(t => t.isActive);
}

export function formatProductionStartTime(turn: DeliveryTurn, effectiveDate: Date): string {
  const deliveryDate = new Date(effectiveDate);
  const productionDate = turn.isPreviousDay 
    ? new Date(deliveryDate.getTime() - 24 * 60 * 60 * 1000)
    : deliveryDate;
    
  return `${productionDate.toLocaleDateString()} ${turn.productionStartTime}`;
}
