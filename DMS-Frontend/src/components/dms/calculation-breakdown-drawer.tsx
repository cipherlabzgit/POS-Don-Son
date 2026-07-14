'use client';

import React from 'react';
import { X, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalculationStep {
  label: string;
  value: number;
  unit: string;
  formula?: string;
}

interface CalculationBreakdownDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  ingredientName: string;
  calculations: CalculationStep[];
  finalTotal: number;
  finalUnit: string;
}

export function CalculationBreakdownDrawer({
  isOpen,
  onClose,
  productName,
  ingredientName,
  calculations,
  finalTotal,
  finalUnit
}: CalculationBreakdownDrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Calculation Breakdown
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Product & Ingredient Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-blue-600 font-medium">Product</div>
            <div className="text-lg font-semibold text-blue-900">{productName}</div>
            <div className="text-sm text-blue-600 font-medium mt-2">Ingredient</div>
            <div className="text-base font-medium text-blue-800">{ingredientName}</div>
          </div>

          {/* Calculation Steps */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Calculation Steps
            </h3>
            
            {calculations.map((step, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    {step.label}
                  </span>
                  <span className="text-base font-bold text-gray-900">
                    {step.value.toLocaleString()} {step.unit}
                  </span>
                </div>
                {step.formula && (
                  <div className="text-xs text-gray-500 font-mono mt-1">
                    {step.formula}
                  </div>
                )}
              </div>
            ))}

            {/* Arrow */}
            <div className="flex justify-center">
              <div className="text-gray-400 text-2xl">↓</div>
            </div>

            {/* Final Total */}
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-green-800 uppercase">
                  Stores Issue Total
                </span>
                <span className="text-xl font-bold text-green-900">
                  {finalTotal.toLocaleString()} {finalUnit}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-800">
            <strong>Note:</strong> Stores-only extras (like cleaning loss for vegetables or preservative buffer) 
            are included in the stores issue note but not in the production planner totals.
          </div>
        </div>
      </div>
    </>
  );
}
