'use client';

import React from 'react';
import { productionModes, ProductionMode, getProductionModeConfig } from '@/lib/mock-data/production-mode';
import { cn } from '@/lib/utils';

interface ProductionModeToggleProps {
  selectedMode: ProductionMode;
  onModeChange: (mode: ProductionMode) => void;
  className?: string;
}

export function ProductionModeToggle({ selectedMode, onModeChange, className }: ProductionModeToggleProps) {
  const currentConfig = getProductionModeConfig(selectedMode);

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium text-gray-700">Production Mode:</label>
      <div className="flex gap-2">
        {productionModes.map((modeConfig) => (
          <button
            key={modeConfig.mode}
            onClick={() => onModeChange(modeConfig.mode)}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all duration-200",
              "flex items-center gap-2 text-sm border-2",
              selectedMode === modeConfig.mode
                ? "text-white border-transparent shadow-md"
                : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"
            )}
            style={{
              backgroundColor: selectedMode === modeConfig.mode ? modeConfig.color : undefined
            }}
            title={modeConfig.description}
          >
            <span className="text-lg">{modeConfig.icon}</span>
            <span>{modeConfig.displayName}</span>
          </button>
        ))}
      </div>
      {currentConfig && (
        <p className="text-xs text-gray-600 italic mt-1">
          {currentConfig.description}
        </p>
      )}
    </div>
  );
}
