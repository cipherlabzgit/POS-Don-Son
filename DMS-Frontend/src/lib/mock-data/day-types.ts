// Day-Type master data for Excel parity
// Task E1.1 — User-managed Day-Type master

export interface DayType {
  id: number;
  code: string;
  displayName: string;
  appliesToMorning: boolean;
  appliesToEvening: boolean;
  isExtraVariant: boolean;
  sortOrder: number;
  isActive: boolean;
  description?: string;
}

export const mockDayTypes: DayType[] = [
  // Morning day-types
  {
    id: 1,
    code: 'WEEKDAY',
    displayName: 'Weekday',
    appliesToMorning: true,
    appliesToEvening: false,
    isExtraVariant: false,
    sortOrder: 1,
    isActive: true,
    description: 'Standard weekday production (Mon-Fri)'
  },
  {
    id: 2,
    code: 'SATURDAY',
    displayName: 'Saturday',
    appliesToMorning: true,
    appliesToEvening: false,
    isExtraVariant: false,
    sortOrder: 2,
    isActive: true
  },
  {
    id: 3,
    code: 'SUNDAY',
    displayName: 'Sunday',
    appliesToMorning: true,
    appliesToEvening: false,
    isExtraVariant: false,
    sortOrder: 3,
    isActive: true
  },
  {
    id: 4,
    code: 'POYA',
    displayName: 'Poya Day',
    appliesToMorning: true,
    appliesToEvening: false,
    isExtraVariant: false,
    sortOrder: 4,
    isActive: true,
    description: 'Full moon poya day production'
  },
  {
    id: 5,
    code: 'APR_NEW_YEAR',
    displayName: 'April New Year',
    appliesToMorning: true,
    appliesToEvening: false,
    isExtraVariant: false,
    sortOrder: 5,
    isActive: true,
    description: 'Sinhala/Tamil New Year celebration'
  },
  {
    id: 6,
    code: 'CURFEW',
    displayName: 'Curfew',
    appliesToMorning: true,
    appliesToEvening: false,
    isExtraVariant: false,
    sortOrder: 6,
    isActive: true,
    description: 'Emergency curfew production schedule'
  },
  
  // Afternoon day-types
  {
    id: 7,
    code: 'MON_WED',
    displayName: 'Mon-Wed',
    appliesToMorning: false,
    appliesToEvening: true,
    isExtraVariant: false,
    sortOrder: 7,
    isActive: true,
    description: 'Monday through Wednesday afternoon'
  },
  {
    id: 8,
    code: 'THU_FRI',
    displayName: 'Thu-Fri',
    appliesToMorning: false,
    appliesToEvening: true,
    isExtraVariant: false,
    sortOrder: 8,
    isActive: true,
    description: 'Thursday and Friday afternoon'
  },
  
  // Extra variants (afternoon)
  {
    id: 9,
    code: 'WEEKDAYS_EXTRA',
    displayName: 'Weekdays Extra',
    appliesToMorning: false,
    appliesToEvening: true,
    isExtraVariant: true,
    sortOrder: 9,
    isActive: true,
    description: 'Extra production for weekday afternoons'
  },
  {
    id: 10,
    code: 'SATURDAY_EXTRA',
    displayName: 'Saturday Extra',
    appliesToMorning: false,
    appliesToEvening: true,
    isExtraVariant: true,
    sortOrder: 10,
    isActive: true,
    description: 'Extra production for Saturday afternoon'
  },
  {
    id: 11,
    code: 'SUNDAY_EXTRA',
    displayName: 'Sunday Extra',
    appliesToMorning: false,
    appliesToEvening: true,
    isExtraVariant: true,
    sortOrder: 11,
    isActive: true,
    description: 'Extra production for Sunday afternoon'
  },
  
  // Generic holiday (can apply to both)
  {
    id: 12,
    code: 'HOLIDAY',
    displayName: 'Public Holiday',
    appliesToMorning: true,
    appliesToEvening: true,
    isExtraVariant: false,
    sortOrder: 12,
    isActive: true,
    description: 'Generic public holiday production schedule'
  },
  {
    id: 13,
    code: 'SPECIAL_EVENT',
    displayName: 'Special Event',
    appliesToMorning: true,
    appliesToEvening: true,
    isExtraVariant: false,
    sortOrder: 13,
    isActive: true,
    description: 'Special event or custom production schedule'
  }
];

// Helper functions
export function getDayTypesByTimeOfDay(isMorning: boolean): DayType[] {
  return mockDayTypes.filter(dt => 
    isMorning ? dt.appliesToMorning : dt.appliesToEvening
  );
}

export function getDayTypeByCode(code: string): DayType | undefined {
  return mockDayTypes.find(dt => dt.code === code);
}

export function getActiveDayTypes(): DayType[] {
  return mockDayTypes.filter(dt => dt.isActive);
}
