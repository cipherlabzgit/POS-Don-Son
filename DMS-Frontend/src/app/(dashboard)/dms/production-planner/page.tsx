'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { Printer, ChevronDown, ChevronRight } from 'lucide-react';
import { productionSections, mockProductionItems, mockIngredientTotals, type ProductionSection } from '@/lib/mock-data/dms-production';

export default function ProductionPlannerPage() {
  const [selectedSection, setSelectedSection] = useState<ProductionSection>('Bakery 1');
  const [expandedSubTables, setExpandedSubTables] = useState<{ [key: string]: boolean }>({
    'viyana-roll': true,
    'sugar-candy-dough': false,
    'sugar-candy-bun': false,
    'egg-wash': false,
    'summary-totals': true,
    'pattie-dough': false,
    'chinese-roll-batter': false,
    'crumb-batter': false,
    'egg-wash-patties': false,
    'sheet-counts': false,
    'rotty-egg-wrap': false,
    'rotty-vege-oil': false,
    'prawn-bun-batter': false,
  });

  const sectionItems = mockProductionItems.filter(item => item.section === selectedSection);
  const sectionIngredients = mockIngredientTotals;

  const toggleSubTable = (key: string) => {
    setExpandedSubTables(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePrint = () => {
    console.log('Printing production planner for:', selectedSection);
    alert(`Printing ${selectedSection} production planner...`);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Production Planner</h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>Section-wise production planning with ingredient calculations</p>
        </div>
        <Button variant="primary" size="md" onClick={handlePrint}><Printer className="w-4 h-4 mr-2" />Print Section</Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {productionSections.map((section) => (
          <button
            key={section}
            onClick={() => setSelectedSection(section)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: selectedSection === section ? 'var(--brand-primary)' : 'var(--dms-pill-off-bg)',
              color: selectedSection === section ? '#ffffff' : 'var(--dms-pill-off-fg)',
              border: `2px solid ${selectedSection === section ? 'var(--brand-primary)' : 'var(--dms-pill-off-border)'}`,
            }}
          >
            {section}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{selectedSection} - Production Details</CardTitle>
              <div className="flex items-center space-x-4 mt-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                <span>Production Start Time: <strong>03:00 AM</strong></span>
                <span>•</span>
                <span>Effective Delivery Time: <strong>05:00 AM</strong></span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Production Items */}
            <div>
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--foreground)' }}>Production Items</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y" style={{ borderColor: 'var(--border)' }}>
                  <thead style={{ backgroundColor: 'var(--muted)' }}>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Product Code</th>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Product Name</th>
                      <th className="px-4 py-3 text-center text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Qty Full</th>
                      <th className="px-4 py-3 text-center text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Qty Mini</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                    {sectionItems.map((item) => (
                      <tr key={item.productId}>
                        <td className="px-4 py-3 text-sm font-mono" style={{ color: 'var(--muted-foreground)' }}>{item.productCode}</td>
                        <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--foreground)' }}>{item.productName}</td>
                        <td className="px-4 py-3 text-center text-sm font-semibold" style={{ color: 'var(--brand-primary)' }}>{item.qtyFull}</td>
                        <td className="px-4 py-3 text-center text-sm font-semibold" style={{ color: 'var(--brand-primary)' }}>{item.qtyMini}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Ingredient Totals */}
            <div>
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--foreground)' }}>Ingredient Requirements</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y" style={{ borderColor: 'var(--border)' }}>
                  <thead style={{ backgroundColor: 'var(--muted)' }}>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Ingredient Code</th>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Ingredient Name</th>
                      <th className="px-4 py-3 text-center text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Unit</th>
                      <th className="px-4 py-3 text-center text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Total Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                    {sectionIngredients.map((ingredient) => (
                      <tr key={ingredient.ingredientId}>
                        <td className="px-4 py-3 text-sm font-mono" style={{ color: 'var(--muted-foreground)' }}>{ingredient.ingredientCode}</td>
                        <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--foreground)' }}>{ingredient.ingredientName}</td>
                        <td className="px-4 py-3 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>{ingredient.unit}</td>
                        <td className="px-4 py-3 text-center text-sm font-bold" style={{ color: 'var(--status-success)' }}>{ingredient.totalQty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Collapsible Sub-Tables for Bakery sections */}
            {(selectedSection === 'Bakery 1' || selectedSection === 'Bakery 2') && (
              <div className="space-y-4">
                {/* Viyana Roll Sub-table */}
                <div className="border rounded-lg" style={{ borderColor: 'var(--border)' }}>
                  <button onClick={() => toggleSubTable('viyana-roll')} className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-left transition-colors hover:!bg-[color:var(--muted)]" style={{ color: 'var(--foreground)' }}>
                    <span>▼ Viyana Roll Sub-Recipe (Full + Mini)</span>
                    {expandedSubTables['viyana-roll'] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  {expandedSubTables['viyana-roll'] && (
                    <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--dms-amber-tint)' }}>
                      <table className="min-w-full text-sm">
                        <thead><tr><th className="text-left py-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>Item</th><th className="text-center py-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>Full Qty</th><th className="text-center py-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>Mini Qty</th><th className="text-center py-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>Flour (g)</th></tr></thead>
                        <tbody>
                          <tr><td className="py-1" style={{ color: 'var(--foreground)' }}>Viyana Roll Full</td><td className="text-center font-semibold" style={{ color: 'var(--brand-primary)' }}>45</td><td className="text-center" style={{ color: 'var(--muted-foreground)' }}>-</td><td className="text-center" style={{ color: 'var(--foreground)' }}>2,850</td></tr>
                          <tr><td className="py-1" style={{ color: 'var(--foreground)' }}>Viyana Roll Mini</td><td className="text-center" style={{ color: 'var(--muted-foreground)' }}>-</td><td className="text-center font-semibold" style={{ color: 'var(--brand-primary)' }}>35</td><td className="text-center" style={{ color: 'var(--foreground)' }}>1,900</td></tr>
                          <tr><td className="py-1" style={{ color: 'var(--foreground)' }}>Dusting Flour</td><td colSpan={2} className="text-center" style={{ color: 'var(--muted-foreground)' }}>-</td><td className="text-center font-semibold" style={{ color: 'var(--brand-primary)' }}>1,900</td></tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Sugar Candy Bun Dough */}
                <div className="border rounded-lg" style={{ borderColor: 'var(--border)' }}>
                  <button onClick={() => toggleSubTable('sugar-candy-dough')} className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-left transition-colors hover:!bg-[color:var(--muted)]" style={{ color: 'var(--foreground)' }}>
                    <span>▼ Sugar Candy Bun "Dough" Sub-Recipe</span>
                    {expandedSubTables['sugar-candy-dough'] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  {expandedSubTables['sugar-candy-dough'] && (
                    <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--dms-amber-tint)' }}>
                      <table className="min-w-full text-sm"><tbody>
                        <tr><td className="py-1" style={{ color: 'var(--foreground)' }}>Flour</td><td className="text-right font-semibold" style={{ color: 'var(--brand-primary)' }}>12 kg</td></tr>
                        <tr><td className="py-1" style={{ color: 'var(--foreground)' }}>Sugar</td><td className="text-right font-semibold" style={{ color: 'var(--brand-primary)' }}>2 kg</td></tr>
                        <tr><td className="py-1" style={{ color: 'var(--foreground)' }}>Yeast</td><td className="text-right font-semibold" style={{ color: 'var(--brand-primary)' }}>400 g</td></tr>
                        <tr><td className="py-1" style={{ color: 'var(--foreground)' }}>Beehive</td><td className="text-right font-semibold" style={{ color: 'var(--brand-primary)' }}>1.5 kg</td></tr>
                      </tbody></table>
                    </div>
                  )}
                </div>

                {/* Sugar Candy Bun "Bun" */}
                <div className="border rounded-lg" style={{ borderColor: 'var(--border)' }}>
                  <button onClick={() => toggleSubTable('sugar-candy-bun')} className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-left transition-colors hover:!bg-[color:var(--muted)]" style={{ color: 'var(--foreground)' }}>
                    <span>▼ Sugar Candy Bun "Bun" Sub-Recipe</span>
                    {expandedSubTables['sugar-candy-bun'] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  {expandedSubTables['sugar-candy-bun'] && (
                    <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--dms-amber-tint)' }}>
                      <table className="min-w-full text-sm"><tbody>
                        <tr><td className="py-1" style={{ color: 'var(--foreground)' }}>Sugar Coating</td><td className="text-right font-semibold" style={{ color: 'var(--brand-primary)' }}>800 g</td></tr>
                        <tr><td className="py-1" style={{ color: 'var(--foreground)' }}>Candy Filling</td><td className="text-right font-semibold" style={{ color: 'var(--brand-primary)' }}>1.2 kg</td></tr>
                      </tbody></table>
                    </div>
                  )}
                </div>

                {/* Egg Wash */}
                <div className="border rounded-lg" style={{ borderColor: 'var(--border)' }}>
                  <button onClick={() => toggleSubTable('egg-wash')} className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-left transition-colors hover:!bg-[color:var(--muted)]" style={{ color: 'var(--foreground)' }}>
                    <span>▼ Egg Wash (Eggs × coefficient)</span>
                    {expandedSubTables['egg-wash'] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  {expandedSubTables['egg-wash'] && (
                    <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--dms-amber-tint)' }}>
                      <table className="min-w-full text-sm"><tbody>
                        <tr><td className="py-1" style={{ color: 'var(--foreground)' }}>Eggs</td><td className="text-right font-semibold" style={{ color: 'var(--brand-primary)' }}>25 Nos</td></tr>
                        <tr><td className="py-1 text-xs italic" style={{ color: 'var(--muted-foreground)' }}>Coefficient: 1 egg per 10 units</td><td></td></tr>
                      </tbody></table>
                    </div>
                  )}
                </div>

                {/* Summary Totals */}
                <div className="border rounded-lg" style={{ borderColor: 'var(--brand-primary)', backgroundColor: 'var(--dms-amber)' }}>
                  <button onClick={() => toggleSubTable('summary-totals')} className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-left transition-colors" style={{ color: 'var(--brand-primary)' }}>
                    <span>▼ Summary Totals (Plain Bun, Yeast, Sugar, Beehive, Salt, Sesame)</span>
                    {expandedSubTables['summary-totals'] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  {expandedSubTables['summary-totals'] && (
                    <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--brand-primary)', backgroundColor: 'var(--card)' }}>
                      <table className="min-w-full text-sm"><tbody>
                        <tr><td className="py-1 font-semibold" style={{ color: 'var(--foreground)' }}>Plain Bun Total</td><td className="text-right font-bold" style={{ color: 'var(--brand-primary)' }}>450 kg</td></tr>
                        <tr><td className="py-1 font-semibold" style={{ color: 'var(--foreground)' }}>Yeast Total</td><td className="text-right font-bold" style={{ color: 'var(--brand-primary)' }}>2,500 g</td></tr>
                        <tr><td className="py-1 font-semibold" style={{ color: 'var(--foreground)' }}>Sugar Total</td><td className="text-right font-bold" style={{ color: 'var(--brand-primary)' }}>85 kg</td></tr>
                        <tr><td className="py-1 font-semibold" style={{ color: 'var(--foreground)' }}>Beehive Total</td><td className="text-right font-bold" style={{ color: 'var(--brand-primary)' }}>65 kg</td></tr>
                        <tr><td className="py-1 font-semibold" style={{ color: 'var(--foreground)' }}>Salt Total</td><td className="text-right font-bold" style={{ color: 'var(--brand-primary)' }}>12 kg</td></tr>
                        <tr><td className="py-1 font-semibold" style={{ color: 'var(--foreground)' }}>Sesame Seeds</td><td className="text-right font-bold" style={{ color: 'var(--brand-primary)' }}>800 g</td></tr>
                        <tr><td colSpan={2} className="py-2 text-xs italic border-t" style={{ color: 'var(--muted-foreground)', borderColor: 'var(--border)' }}>Note: Beehive equivalence = SUM × 30g (Egg = Butter)</td></tr>
                      </tbody></table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Short-Eats 1 Sub-Tables */}
            {selectedSection === 'Short-Eats 1' && (
              <div className="space-y-4">
                <div className="border rounded-lg" style={{ borderColor: 'var(--border)' }}>
                  <button onClick={() => toggleSubTable('pattie-dough')} className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-left transition-colors hover:!bg-[color:var(--muted)]" style={{ color: 'var(--foreground)' }}>
                    <span>▼ Pattie Dough Sub-table</span>
                    {expandedSubTables['pattie-dough'] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  {expandedSubTables['pattie-dough'] && (
                    <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--dms-amber-tint)' }}>
                      <table className="min-w-full text-sm"><tbody>
                        <tr><td className="py-1" style={{ color: 'var(--foreground)' }}>Flour</td><td className="text-right font-semibold" style={{ color: 'var(--brand-primary)' }}>18 kg</td></tr>
                        <tr><td className="py-1" style={{ color: 'var(--foreground)' }}>Beehive</td><td className="text-right font-semibold" style={{ color: 'var(--brand-primary)' }}>4 kg</td></tr>
                        <tr><td className="py-1" style={{ color: 'var(--foreground)' }}>Salt</td><td className="text-right font-semibold" style={{ color: 'var(--brand-primary)' }}>300 g</td></tr>
                        <tr><td className="py-1" style={{ color: 'var(--foreground)' }}>Eggs</td><td className="text-right font-semibold" style={{ color: 'var(--brand-primary)' }}>12 Nos</td></tr>
                      </tbody></table>
                    </div>
                  )}
                </div>

                <div className="border rounded-lg" style={{ borderColor: 'var(--border)' }}>
                  <button onClick={() => toggleSubTable('chinese-roll-batter')} className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-left transition-colors hover:!bg-[color:var(--muted)]" style={{ color: 'var(--foreground)' }}>
                    <span>▼ Chinese Roll Batter (Base 12kg Flour)</span>
                    {expandedSubTables['chinese-roll-batter'] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  {expandedSubTables['chinese-roll-batter'] && (
                    <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--dms-amber-tint)' }}>
                      <table className="min-w-full text-sm"><tbody>
                        <tr><td className="py-1" style={{ color: 'var(--foreground)' }}>Flour (Base)</td><td className="text-right font-semibold" style={{ color: 'var(--brand-primary)' }}>12 kg</td></tr>
                        <tr><td className="py-1" style={{ color: 'var(--foreground)' }}>Salt</td><td className="text-right font-semibold" style={{ color: 'var(--brand-primary)' }}>150 g</td></tr>
                        <tr><td className="py-1" style={{ color: 'var(--foreground)' }}>Corn Flour</td><td className="text-right font-semibold" style={{ color: 'var(--brand-primary)' }}>1.5 kg</td></tr>
                        <tr><td className="py-1" style={{ color: 'var(--foreground)' }}>Eggs</td><td className="text-right font-semibold" style={{ color: 'var(--brand-primary)' }}>8 Nos</td></tr>
                        <tr><td className="py-1" style={{ color: 'var(--foreground)' }}>Oil</td><td className="text-right font-semibold" style={{ color: 'var(--brand-primary)' }}>500 ml</td></tr>
                      </tbody></table>
                    </div>
                  )}
                </div>

                <div className="border rounded-lg" style={{ borderColor: 'var(--border)' }}>
                  <button onClick={() => toggleSubTable('crumb-batter')} className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-left transition-colors hover:!bg-[color:var(--muted)]" style={{ color: 'var(--foreground)' }}>
                    <span>▼ Crumb Batter</span>
                    {expandedSubTables['crumb-batter'] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  {expandedSubTables['crumb-batter'] && (
                    <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--dms-amber-tint)' }}>
                      <table className="min-w-full text-sm"><tbody>
                        <tr><td className="py-1" style={{ color: 'var(--foreground)' }}>Flour</td><td className="text-right font-semibold" style={{ color: 'var(--brand-primary)' }}>5 kg</td></tr>
                      </tbody></table>
                    </div>
                  )}
                </div>

                <div className="border rounded-lg" style={{ borderColor: 'var(--border)' }}>
                  <button onClick={() => toggleSubTable('egg-wash-patties')} className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-left transition-colors hover:!bg-[color:var(--muted)]" style={{ color: 'var(--foreground)' }}>
                    <span>▼ Egg Wash for Patties</span>
                    {expandedSubTables['egg-wash-patties'] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  {expandedSubTables['egg-wash-patties'] && (
                    <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--dms-amber-tint)' }}>
                      <table className="min-w-full text-sm"><tbody>
                        <tr><td className="py-1" style={{ color: 'var(--foreground)' }}>Eggs</td><td className="text-right font-semibold" style={{ color: 'var(--brand-primary)' }}>15 Nos</td></tr>
                      </tbody></table>
                    </div>
                  )}
                </div>

                <div className="border rounded-lg" style={{ borderColor: 'var(--brand-primary)', backgroundColor: 'var(--dms-amber)' }}>
                  <button onClick={() => toggleSubTable('sheet-counts')} className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-left transition-colors" style={{ color: 'var(--brand-primary)' }}>
                    <span>▼ Sheet Counts (Pastry / Pattie / Spring Roll)</span>
                    {expandedSubTables['sheet-counts'] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  {expandedSubTables['sheet-counts'] && (
                    <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--brand-primary)', backgroundColor: 'var(--card)' }}>
                      <table className="min-w-full text-sm"><tbody>
                        <tr><td className="py-1 font-semibold" style={{ color: 'var(--foreground)' }}>Pastry Sheet</td><td className="text-right font-bold" style={{ color: 'var(--brand-primary)' }}>120 sheets</td></tr>
                        <tr><td className="py-1 font-semibold" style={{ color: 'var(--foreground)' }}>Pattie Sheet</td><td className="text-right font-bold" style={{ color: 'var(--brand-primary)' }}>95 sheets</td></tr>
                        <tr><td className="py-1 font-semibold" style={{ color: 'var(--foreground)' }}>Spring Roll Sheet</td><td className="text-right font-bold" style={{ color: 'var(--brand-primary)' }}>80 sheets</td></tr>
                      </tbody></table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Rotty Section Sub-Tables */}
            {selectedSection === 'Rotty Section' && (
              <div className="space-y-4">
                <div className="border rounded-lg" style={{ borderColor: 'var(--border)' }}>
                  <button onClick={() => toggleSubTable('rotty-egg-wrap')} className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-left transition-colors hover:!bg-[color:var(--muted)]" style={{ color: 'var(--foreground)' }}>
                    <span>▼ Chicken Rotty Egg Wrap</span>
                    {expandedSubTables['rotty-egg-wrap'] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  {expandedSubTables['rotty-egg-wrap'] && (
                    <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--dms-amber-tint)' }}>
                      <table className="min-w-full text-sm"><tbody>
                        <tr><td className="py-1" style={{ color: 'var(--foreground)' }}>Flour</td><td className="text-right font-semibold" style={{ color: 'var(--brand-primary)' }}>8 kg</td></tr>
                        <tr><td className="py-1" style={{ color: 'var(--foreground)' }}>Salt</td><td className="text-right font-semibold" style={{ color: 'var(--brand-primary)' }}>120 g</td></tr>
                        <tr><td className="py-1" style={{ color: 'var(--foreground)' }}>Eggs</td><td className="text-right font-semibold" style={{ color: 'var(--brand-primary)' }}>18 Nos</td></tr>
                      </tbody></table>
                    </div>
                  )}
                </div>

                <div className="border rounded-lg" style={{ borderColor: 'var(--border)' }}>
                  <button onClick={() => toggleSubTable('rotty-vege-oil')} className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-left transition-colors hover:!bg-[color:var(--muted)]" style={{ color: 'var(--foreground)' }}>
                    <span>▼ Vege Oil for Rotty Dough</span>
                    {expandedSubTables['rotty-vege-oil'] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  {expandedSubTables['rotty-vege-oil'] && (
                    <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--dms-amber-tint)' }}>
                      <table className="min-w-full text-sm"><tbody>
                        <tr><td className="py-1" style={{ color: 'var(--foreground)' }}>Vegetable Oil</td><td className="text-right font-semibold" style={{ color: 'var(--brand-primary)' }}>2.5 L</td></tr>
                      </tbody></table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Plain Roll Section Sub-Tables */}
            {selectedSection === 'Plain Roll Section' && (
              <div className="space-y-4">
                <div className="border rounded-lg" style={{ borderColor: 'var(--border)' }}>
                  <button onClick={() => toggleSubTable('prawn-bun-batter')} className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-left transition-colors hover:!bg-[color:var(--muted)]" style={{ color: 'var(--foreground)' }}>
                    <span>▼ Prawn Bun Batter</span>
                    {expandedSubTables['prawn-bun-batter'] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  {expandedSubTables['prawn-bun-batter'] && (
                    <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--dms-amber-tint)' }}>
                      <table className="min-w-full text-sm"><tbody>
                        <tr><td className="py-1" style={{ color: 'var(--foreground)' }}>Corn Flour</td><td className="text-right font-semibold" style={{ color: 'var(--brand-primary)' }}>3 kg</td></tr>
                        <tr><td className="py-1" style={{ color: 'var(--foreground)' }}>Baking Powder</td><td className="text-right font-semibold" style={{ color: 'var(--brand-primary)' }}>200 g</td></tr>
                        <tr><td className="py-1" style={{ color: 'var(--foreground)' }}>Eggs</td><td className="text-right font-semibold" style={{ color: 'var(--brand-primary)' }}>10 Nos</td></tr>
                        <tr><td className="py-1" style={{ color: 'var(--foreground)' }}>Flour</td><td className="text-right font-semibold" style={{ color: 'var(--brand-primary)' }}>2 kg</td></tr>
                      </tbody></table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Summary Note for Bakery */}
            {(selectedSection === 'Bakery 1' || selectedSection === 'Bakery 2') && (
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--dms-success-callout)', border: '1px solid var(--dms-success-border)' }}>
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--dms-success-text)' }}>Summary Totals:</p>
                <ul className="text-sm space-y-1" style={{ color: 'var(--dms-success-text)' }}>
                  <li>• Plain Bun Total: 450 kg</li>
                  <li>• Yeast Total: 2,500 g</li>
                  <li>• Sugar Total: 85 kg</li>
                  <li>• Beehive Total: 65 kg (Note: Egg = Butter equivalence at 30g)</li>
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--dms-notes)', border: '1px solid var(--dms-notes-border)' }}>
        <p className="text-sm font-medium mb-2" style={{ color: 'var(--dms-notes-title)' }}>Important Notes:</p>
        <ul className="text-sm space-y-1" style={{ color: 'var(--dms-notes-fg)' }}>
          <li>• <strong>Production Planner</strong> shows recipe quantities ONLY (no extra quantities)</li>
          <li>• <strong>Stores Issue Note</strong> includes both recipe quantities AND extra quantities</li>
          <li>• Each section has its own Production Start Time and Effective Delivery Time</li>
          <li>• Collapsible sub-tables show detailed breakdowns for multi-recipe products</li>
        </ul>
      </div>
    </div>
  );
}
