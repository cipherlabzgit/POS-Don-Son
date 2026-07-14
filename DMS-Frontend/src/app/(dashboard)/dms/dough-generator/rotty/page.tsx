'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { ChefHat, Printer } from 'lucide-react';

interface RottyQty {
  ro1: number; // Egg Plain Rotty
  ro2: number; // Vegetable Rotty
  ro3: number; // Fish Rotty
  ro4: number; // Chicken Rotty
  ro5_ro6: number; // Beef Rotty
}

export default function RottyDoughGeneratorPage() {
  const [quantities, setQuantities] = useState<RottyQty>({
    ro1: 0,
    ro2: 0,
    ro3: 0,
    ro4: 0,
    ro5_ro6: 0
  });

  const updateQty = (key: keyof RottyQty, value: number) => {
    setQuantities(prev => ({ ...prev, [key]: Math.max(0, value) }));
  };

  // Mock ingredient calculation (simplified)
  const totalFlour = (quantities.ro1 + quantities.ro2 + quantities.ro3 + quantities.ro4 + quantities.ro5_ro6) * 0.15;
  const totalOil = (quantities.ro1 + quantities.ro2 + quantities.ro3 + quantities.ro4 + quantities.ro5_ro6) * 0.02;
  const totalSalt = (quantities.ro1 + quantities.ro2 + quantities.ro3 + quantities.ro4 + quantities.ro5_ro6) * 0.005;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <ChefHat className="w-8 h-8 text-amber-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rotty Dough Generator</h1>
            <p className="text-gray-600 mt-1">
              Calculate dough ingredients for all rotty variants
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Card */}
        <Card>
          <CardHeader>
            <CardTitle>Rotty Quantities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { key: 'ro1' as const, label: 'RO1 - Egg Plain Rotty' },
                { key: 'ro2' as const, label: 'RO2 - Vegetable Rotty' },
                { key: 'ro3' as const, label: 'RO3 - Fish Rotty' },
                { key: 'ro4' as const, label: 'RO4 - Chicken Rotty' },
                { key: 'ro5_ro6' as const, label: 'RO5/RO6 - Beef Rotty' }
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1">{label}</label>
                  <input
                    type="number"
                    value={quantities[key]}
                    onChange={(e) => updateQty(key, parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-lg"
                    min="0"
                  />
                </div>
              ))}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                <div className="text-sm font-semibold text-blue-900 mb-1">Total Rotties</div>
                <div className="text-2xl font-bold text-blue-800">
                  {Object.values(quantities).reduce((a, b) => a + b, 0)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Result Card */}
        <Card className="border-2 border-amber-500">
          <CardHeader className="bg-amber-50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-amber-900">Total Ingredients</CardTitle>
              <Button size="sm" variant="outline" onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-1" />
                Print
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center py-3 border-b-2">
                  <span className="font-medium">Flour</span>
                  <span className="text-2xl font-bold text-amber-700">
                    {totalFlour.toFixed(2)} <span className="text-base">kg</span>
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b-2">
                  <span className="font-medium">Coconut Oil</span>
                  <span className="text-2xl font-bold text-amber-700">
                    {totalOil.toFixed(2)} <span className="text-base">L</span>
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b-2">
                  <span className="font-medium">Salt</span>
                  <span className="text-2xl font-bold text-amber-700">
                    {totalSalt.toFixed(3)} <span className="text-base">kg</span>
                  </span>
                </div>
              </div>

              <Button className="w-full mt-4" variant="primary">
                Generate Stores Issue Note
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
