'use client';

import React from 'react';
import { mockDeliveryTurns } from '@/lib/mock-data/delivery-turns';
import { Clock } from 'lucide-react';
import { formatSlDate } from '@/lib/sri-lanka-time';

interface CrossMidnightChipProps {
  turnId: number;
  deliveryDate: Date;
  className?: string;
}

export function CrossMidnightChip({ turnId, deliveryDate, className }: CrossMidnightChipProps) {
  const turn = mockDeliveryTurns.find(t => t.id === turnId);
  
  if (!turn || !turn.isPreviousDay) {
    return null;
  }

  const productionDate = new Date(deliveryDate);
  productionDate.setDate(productionDate.getDate() - 1);
  
  const formattedProductionDate = formatSlDate(productionDate, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const formattedDeliveryDate = formatSlDate(deliveryDate, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className={cn(
      "inline-flex items-center gap-2 px-3 py-1.5 rounded-full",
      "bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium",
      className
    )}>
      <Clock className="w-3.5 h-3.5" />
      <span>
        Production Start: <strong>{formattedProductionDate} {turn.productionStartTime}</strong>
        <span className="mx-1">→</span>
        Delivery: <strong>{formattedDeliveryDate} {turn.time}</strong>
      </span>
      <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 text-xs font-semibold">
        Previous Day
      </span>
    </div>
  );
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
