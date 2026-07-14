'use client';

import React from 'react';
import { mockDeliveryTurns, DeliveryTurn } from '@/lib/mock-data/delivery-turns';
import { cn } from '@/lib/utils';

interface TurnSwitcherProps {
  selectedTurnId: number;
  onTurnChange: (turnId: number) => void;
  className?: string;
}

export function TurnSwitcher({ selectedTurnId, onTurnChange, className }: TurnSwitcherProps) {
  const turns = mockDeliveryTurns.filter(t => t.isActive);

  return (
    <div className={cn("flex gap-2 flex-wrap", className)}>
      {turns.map((turn) => (
        <button
          key={turn.id}
          onClick={() => onTurnChange(turn.id)}
          className={cn(
            "px-4 py-2 rounded-lg font-medium transition-all duration-200",
            "flex items-center gap-2 text-sm",
            selectedTurnId === turn.id
              ? "text-white shadow-md"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          )}
          style={{
            backgroundColor: selectedTurnId === turn.id ? turn.color : undefined
          }}
        >
          <span className="text-lg">{turn.icon}</span>
          <span>{turn.displayName}</span>
          {turn.isPreviousDay && (
            <span className="text-xs opacity-75">(Prev Day)</span>
          )}
        </button>
      ))}
    </div>
  );
}
