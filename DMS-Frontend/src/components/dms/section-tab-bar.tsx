'use client';

import React from 'react';
import { ProductionSection } from '@/lib/mock-data/enhanced-models';
import { cn } from '@/lib/utils';
import { ChefHat } from 'lucide-react';

interface SectionTabBarProps {
  selectedSection: ProductionSection;
  onSectionChange: (section: ProductionSection) => void;
  availableSections: ProductionSection[];
  className?: string;
}

const sectionIcons: Record<ProductionSection, string> = {
  'Bakery 1': '🍞',
  'Bakery 2': '🥖',
  'Filling Section': '🥪',
  'Short-Eats 1': '🍔',
  'Short-Eats 2': '🌮',
  'Rotty Section': '🫓',
  'Plain Roll Section': '🥐',
  'Pastry Section': '🥐',
  'Garnish Section': '🌿',
  'Packing Section': '📦'
};

export function SectionTabBar({ 
  selectedSection, 
  onSectionChange, 
  availableSections,
  className 
}: SectionTabBarProps) {
  return (
    <div className={cn("border-b border-gray-200", className)}>
      <nav className="flex gap-1 overflow-x-auto pb-px" aria-label="Production Sections">
        {availableSections.map((section) => (
          <button
            key={section}
            onClick={() => onSectionChange(section)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap",
              "border-b-2 transition-all duration-200",
              selectedSection === section
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
            )}
          >
            <span className="text-lg">{sectionIcons[section] || <ChefHat className="w-4 h-4" />}</span>
            <span>{section}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
