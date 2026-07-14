'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { Printer, FileDown } from 'lucide-react';
import { productionSections, mockIngredientTotals, type ProductionSection } from '@/lib/mock-data/dms-production';

export default function StoresIssueNotePage() {
  const [selectedSection, setSelectedSection] = useState<ProductionSection>('Bakery 1');
  const sectionIngredients = mockIngredientTotals;

  const handlePrint = () => {
    alert(`Printing Stores Issue Note for ${selectedSection}...`);
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    alert(`Exporting Stores Issue Note as ${format.toUpperCase()}...`);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Stores Issue Note</h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>Ingredient requirements with extra quantities for stores</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="secondary" size="md" onClick={() => handleExport('excel')}><FileDown className="w-4 h-4 mr-2" />Export Excel</Button>
          <Button variant="secondary" size="md" onClick={() => handleExport('pdf')}><FileDown className="w-4 h-4 mr-2" />Export PDF</Button>
          <Button variant="primary" size="md" onClick={handlePrint}><Printer className="w-4 h-4 mr-2" />Print</Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {productionSections.map((section) => (
          <button key={section} type="button" onClick={() => setSelectedSection(section)} className="px-4 py-2 rounded-lg text-sm font-medium transition-colors" style={{ backgroundColor: selectedSection === section ? 'var(--brand-primary)' : 'var(--dms-pill-off-bg)', color: selectedSection === section ? '#ffffff' : 'var(--dms-pill-off-fg)', border: `2px solid ${selectedSection === section ? 'var(--brand-primary)' : 'var(--dms-pill-off-border)'}` }}>
            {section}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>{selectedSection} - Stores Issue Note</CardTitle>
            <div className="flex items-center space-x-4 mt-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
              <span>Production Start Time: <strong>03:00 AM</strong></span>
              <span>•</span>
              <span>Effective Delivery Time: <strong>05:00 AM</strong></span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y" style={{ borderColor: 'var(--border)' }}>
                <thead style={{ backgroundColor: 'var(--muted)' }}>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Ingredient Code</th>
                    <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Ingredient Name</th>
                    <th className="px-4 py-3 text-center text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Unit</th>
                    <th className="px-4 py-3 text-center text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Recipe Qty</th>
                    <th className="px-4 py-3 text-center text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Extra Qty</th>
                    <th className="px-4 py-3 text-center text-xs font-medium" style={{ color: 'var(--muted-foreground)', backgroundColor: 'var(--dms-amber)' }}>Stores Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                  {sectionIngredients.map((ingredient) => (
                    <tr key={ingredient.ingredientId}>
                      <td className="px-4 py-3 text-sm font-mono" style={{ color: 'var(--muted-foreground)' }}>{ingredient.ingredientCode}</td>
                      <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--foreground)' }}>{ingredient.ingredientName}</td>
                      <td className="px-4 py-3 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>{ingredient.unit}</td>
                      <td className="px-4 py-3 text-center text-sm font-semibold" style={{ color: '#3B82F6' }}>{ingredient.totalQty}</td>
                      <td className="px-4 py-3 text-center text-sm font-semibold" style={{ color: '#F59E0B' }}>{ingredient.extraQty}</td>
                      <td className="px-4 py-3 text-center text-sm font-bold" style={{ color: 'var(--dms-amber-fg)', backgroundColor: 'var(--dms-amber)' }}>{ingredient.storesQty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {(selectedSection === 'Bakery 1' || selectedSection === 'Bakery 2') && (
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--dms-notes)', border: '1px solid var(--dms-notes-border)' }}>
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--dms-notes-title)' }}>Viyana Roll Flour Note:</p>
                <ul className="text-sm space-y-1" style={{ color: 'var(--dms-notes-fg)' }}>
                  <li>• Viyana Roll Flour (Full): 2,850 g</li>
                  <li>• Viyana Roll Mini Flour: 1,900 g</li>
                  <li>• Dusting Flour: 1,900 g</li>
                </ul>
              </div>
            )}

            <div className="border-t pt-6" style={{ borderColor: 'var(--border)' }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Sign-off Section</h3>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: 'var(--muted-foreground)' }}>Printed By:</p>
                  <div className="border-b-2" style={{ borderColor: 'var(--input)', height: '40px' }}></div>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Name & Signature</p>
                </div>
                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: 'var(--muted-foreground)' }}>Issued By:</p>
                  <div className="border-b-2" style={{ borderColor: 'var(--input)', height: '40px' }}></div>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Name & Signature</p>
                </div>
                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: 'var(--muted-foreground)' }}>Checked By:</p>
                  <div className="border-b-2" style={{ borderColor: 'var(--input)', height: '40px' }}></div>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Name & Signature</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--dms-success-callout)', border: '1px solid var(--dms-success-border)' }}>
        <p className="text-sm font-medium mb-2" style={{ color: 'var(--dms-success-text)' }}>Key Differences from Production Planner:</p>
        <ul className="text-sm space-y-1" style={{ color: 'var(--dms-success-text)' }}>
          <li>• <strong>Stores Qty = Recipe Qty + Extra Qty</strong> (for wastage, spillage, etc.)</li>
          <li>• Extra quantities are shown here but NOT on the Production Planner</li>
          <li>• If "Use Freezer Stock" is enabled in Delivery Summary, available balance is shown per product</li>
          <li>• This document is used by stores personnel to issue ingredients</li>
        </ul>
      </div>
    </div>
  );
}
