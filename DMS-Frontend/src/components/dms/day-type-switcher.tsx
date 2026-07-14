'use client';

import React from 'react';
import { mockDayTypes, DayType, getDayTypesByTimeOfDay } from '@/lib/mock-data/day-types';
import { mockDeliveryTurns } from '@/lib/mock-data/delivery-turns';

interface DayTypeSwitcherProps {
  selectedDayTypeId: number;
  selectedTurnId: number;
  onDayTypeChange: (dayTypeId: number) => void;
  className?: string;
}

export function DayTypeSwitcher({ 
  selectedDayTypeId, 
  selectedTurnId, 
  onDayTypeChange, 
  className 
}: DayTypeSwitcherProps) {
  // Filter day-types based on selected turn's time of day
  const selectedTurn = mockDeliveryTurns.find(t => t.id === selectedTurnId);
  const isMorningTurn = selectedTurn ? parseInt(selectedTurn.time.split(':')[0]) < 12 : true;
  
  const availableDayTypes = getDayTypesByTimeOfDay(isMorningTurn);
  const selectedDayType = mockDayTypes.find(dt => dt.id === selectedDayTypeId);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <label className="text-sm font-medium text-gray-700">Day Type:</label>
      <select
        value={selectedDayTypeId}
        onChange={(e) => onDayTypeChange(parseInt(e.target.value))}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {availableDayTypes.map((dayType) => (
          <option key={dayType.id} value={dayType.id}>
            {dayType.displayName}
            {dayType.isExtraVariant && ' (Extra)'}
          </option>
        ))}
      </select>
      {selectedDayType?.description && (
        <span className="text-xs text-gray-500 italic">
          {selectedDayType.description}
        </span>
      )}
    </div>
  );
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
