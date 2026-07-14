'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { ChefHat, Printer } from 'lucide-react';
import { PrintFooter } from '@/components/dms/print-footer';

export default function PattiesDoughGeneratorPage() {
  const [nosUnits, setNosUnits] = useState<number>(1);

  // Base recipe for "Nos 01" unit
  const baseRecipe = {
    flour: 18,
    beehive: 3.5,
    salt: 0.25,
    eggs: 0.017
  };

  const calculated = {
    flour: (baseRecipe.flour * nosUnits).toFixed(2),
    beehive: (baseRecipe.beehive * nosUnits).toFixed(2),
    salt: (baseRecipe.salt * nosUnits).toFixed(3),
    eggs: (baseRecipe.eggs * nosUnits).toFixed(3)
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <ChefHat className="w-8 h-8 text-orange-500" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Patties Dough Generator</h1>
            <p className="text-gray-600 mt-1">
              Calculate dough ingredients based on "Nos 01" multiplier
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Card */}
        <Card>
          <CardHeader>
            <CardTitle>Input Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nos 01 Units</label>
                <input
                  type="number"
                  value={nosUnits}
                  onChange={(e) => setNosUnits(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 border rounded-lg text-2xl font-bold text-center"
                  min="1"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <strong>Base Recipe (Nos 01 = 1):</strong>
                <ul className="mt-2 space-y-1">
                  <li>Flour: {baseRecipe.flour} kg</li>
                  <li>Beehive: {baseRecipe.beehive} kg</li>
                  <li>Salt: {baseRecipe.salt} kg</li>
                  <li>Eggs: {baseRecipe.eggs} nos</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Result Card */}
        <Card className="border-2 border-green-500">
          <CardHeader className="bg-green-50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-green-900">Calculated Ingredients</CardTitle>
              <Button size="sm" variant="outline" onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-1" />
                Print
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: 'var(--muted)' }}>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Multiplier</div>
                  <div className="text-4xl font-bold text-gray-900">
                    {nosUnits} × Nos 01
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-3 border-b-2">
                  <span className="font-medium">Flour</span>
                  <span className="text-2xl font-bold text-green-700">
                    {calculated.flour} <span className="text-base">kg</span>
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b-2">
                  <span className="font-medium">Beehive (Margarine)</span>
                  <span className="text-2xl font-bold text-green-700">
                    {calculated.beehive} <span className="text-base">kg</span>
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b-2">
                  <span className="font-medium">Salt</span>
                  <span className="text-2xl font-bold text-green-700">
                    {calculated.salt} <span className="text-base">kg</span>
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b-2">
                  <span className="font-medium">Eggs</span>
                  <span className="text-2xl font-bold text-green-700">
                    {calculated.eggs} <span className="text-base">nos</span>
                  </span>
                </div>
              </div>

              <Button className="w-full mt-4" variant="primary">
                Generate Stores Issue Note
              </Button>

              <PrintFooter preparedBy="Admin User" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
        <h3 className="font-semibold text-orange-900 mb-2">📊 Patties Dough Formula</h3>
        <p className="text-sm text-orange-800">
          This generator uses the standard patties dough formula from the Excel `Patties Doudgh` sheet. 
          The "Nos 01" unit represents one standard batch. Adjust the multiplier to scale ingredients 
          proportionally for your production needs.
        </p>
      </div>
    </div>
  );
}
