// Production Mode configuration
// Task E2.1 — Plain Roll Production mode

export type ProductionMode = 'Standard' | 'PlainRoll' | 'AnytimeAdHoc';

export interface ProductionModeConfig {
  mode: ProductionMode;
  displayName: string;
  description: string;
  icon: string;
  color: string;
  filterToPlainRollItems: boolean;
  allowAdHocQuantities: boolean;
  requiresApproval: boolean;
}

export const productionModes: ProductionModeConfig[] = [
  {
    mode: 'Standard',
    displayName: 'Standard Production',
    description: 'Normal scheduled production based on delivery plan',
    icon: '📋',
    color: '#3B82F6',
    filterToPlainRollItems: false,
    allowAdHocQuantities: false,
    requiresApproval: false
  },
  {
    mode: 'PlainRoll',
    displayName: 'Plain Roll Mode',
    description: 'Production limited to plain roll items only (14 items)',
    icon: '🥖',
    color: '#F59E0B',
    filterToPlainRollItems: true,
    allowAdHocQuantities: false,
    requiresApproval: false
  },
  {
    mode: 'AnytimeAdHoc',
    displayName: 'Anytime / Ad-hoc',
    description: 'Single-product ad-hoc production outside regular schedule',
    icon: '⚡',
    color: '#10B981',
    filterToPlainRollItems: false,
    allowAdHocQuantities: true,
    requiresApproval: true
  }
];

export function getProductionModeConfig(mode: ProductionMode): ProductionModeConfig | undefined {
  return productionModes.find(m => m.mode === mode);
}
