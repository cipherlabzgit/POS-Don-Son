'use client';

import React from 'react';
import { ProductionSection } from '@/lib/mock-data/enhanced-models';
import { getConsumablesBySection, calculateConsumableQty } from '@/lib/mock-data/section-consumables';

interface ConsumablesFooterProps {
  section: ProductionSection;
  totalProductionQty: number;
  batchSize?: number;
  className?: string;
}

export function ConsumablesFooter({ 
  section, 
  totalProductionQty, 
  batchSize = 100,
  className 
}: ConsumablesFooterProps) {
  const consumables = getConsumablesBySection(section);

  if (consumables.length === 0) {
    return null;
  }

  return (
    <div className={cn("mt-6 border-t-2 border-gray-300 pt-4", className)}>
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
        Section Consumables
      </h3>
      <div className="bg-gray-50 rounded-lg p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-600 uppercase">
              <th className="pb-2">Item</th>
              <th className="pb-2 text-right">Quantity</th>
              <th className="pb-2 text-right">UoM</th>
              <th className="pb-2 text-right">Calc Basis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {consumables.map((consumable) => {
              const qty = calculateConsumableQty(consumable, totalProductionQty, batchSize);
              return (
                <tr key={consumable.id} className="text-gray-800">
                  <td className="py-2">{consumable.name}</td>
                  <td className="py-2 text-right font-semibold">{qty.toFixed(2)}</td>
                  <td className="py-2 text-right">{consumable.uom}</td>
                  <td className="py-2 text-right text-xs text-gray-500">
                    {consumable.calcBasis}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {consumables.some(c => c.description) && (
          <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600 space-y-1">
            {consumables.filter(c => c.description).map((consumable) => (
              <div key={consumable.id}>
                <strong>{consumable.name}:</strong> {consumable.description}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
