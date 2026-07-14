'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus } from 'lucide-react';
import { productionSectionsApi, type ProductionSection } from '@/lib/api/production-sections';
import type { DeliveryTurnSectionTiming } from '@/lib/api/delivery-turns';
import toast from 'react-hot-toast';

interface SectionTimingFormProps {
  sectionTimings: DeliveryTurnSectionTiming[];
  onTimingsChange: (timings: DeliveryTurnSectionTiming[]) => void;
}

export default function SectionTimingForm({ sectionTimings, onTimingsChange }: SectionTimingFormProps) {
  const [sections, setSections] = useState<ProductionSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSectionId, setSelectedSectionId] = useState('');

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      setLoading(true);
      const response = await productionSectionsApi.getAll(1, 100, undefined, true);
      setSections(response.productionSections);
    } catch (error: any) {
      toast.error('Failed to load production sections');
    } finally {
      setLoading(false);
    }
  };

  const getUsedSectionIds = () => {
    return sectionTimings.map(st => st.productionSectionId);
  };

  const getAvailableSections = () => {
    const usedIds = getUsedSectionIds();
    return sections.filter(s => !usedIds.includes(s.id));
  };

  const handleAddTiming = () => {
    if (!selectedSectionId) {
      toast.error('Please select a production section');
      return;
    }

    const section = sections.find(s => s.id === selectedSectionId);
    if (!section) return;

    const newTiming: DeliveryTurnSectionTiming = {
      productionSectionId: selectedSectionId,
      productionSectionName: section.name,
      productionStartTime: '08:00',
      effectiveDeliveryTime: '17:00',
      productionDayOffset: 0,
      deliveryDayOffset: 0,
    };

    onTimingsChange([...sectionTimings, newTiming]);
    setSelectedSectionId('');
  };

  const handleUpdateTiming = (index: number, field: keyof DeliveryTurnSectionTiming, value: any) => {
    const updated = [...sectionTimings];
    updated[index] = { ...updated[index], [field]: value };
    onTimingsChange(updated);
  };

  const handleRemoveTiming = (index: number) => {
    const updated = sectionTimings.filter((_, i) => i !== index);
    onTimingsChange(updated);
  };

  const getDayOffsetLabel = (offset: number) => {
    if (offset === -1) return 'Previous Day';
    if (offset === 0) return 'Same Day';
    if (offset === 1) return 'Next Day';
    return `Day +${offset}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Section-Specific Timing Configuration</CardTitle>
        <p className="text-sm mt-2" style={{ color: 'var(--muted-foreground)' }}>
          Configure production start times and delivery times for each production section
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Section Timing */}
        {loading ? (
          <div className="text-center py-4" style={{ color: 'var(--muted-foreground)' }}>
            Loading sections...
          </div>
        ) : (
          <div className="flex gap-3 pb-4 border-b">
            <Select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              placeholder="Select production section..."
              className="flex-1"
              options={getAvailableSections().map(s => ({ value: s.id, label: s.name }))}
            />
            <Button
              variant="primary"
              onClick={handleAddTiming}
              disabled={getAvailableSections().length === 0}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Section
            </Button>
          </div>
        )}

        {/* Section Timings List */}
        {sectionTimings.length === 0 ? (
          <div className="text-center py-8" style={{ color: 'var(--muted-foreground)' }}>
            <p>No section-specific timings configured yet</p>
            <p className="text-sm mt-2">Add a production section above to configure its production schedule</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sectionTimings.map((timing, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3" style={{ borderColor: 'var(--border)' }}>
                {/* Section Name Header */}
                <div className="flex items-center justify-between">
                  <div className="font-semibold" style={{ color: 'var(--foreground)' }}>
                    {timing.productionSectionName}
                  </div>
                  <button
                    onClick={() => handleRemoveTiming(index)}
                    className="p-1.5 rounded transition-colors"
                    style={{ color: '#DC2626' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    title="Remove section"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Timing Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                      Production Start Time
                    </label>
                    <Input
                      type="time"
                      value={timing.productionStartTime}
                      onChange={(e) => handleUpdateTiming(index, 'productionStartTime', e.target.value)}
                      className="mt-1"
                      fullWidth
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                      Production Day Offset
                    </label>
                    <Select
                      value={timing.productionDayOffset.toString()}
                      onChange={(e) => handleUpdateTiming(index, 'productionDayOffset', parseInt(e.target.value))}
                      className="mt-1"
                      options={[
                        { value: '-1', label: 'Previous Day' },
                        { value: '0', label: 'Same Day' },
                        { value: '1', label: 'Next Day' },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                      Effective Delivery Time
                    </label>
                    <Input
                      type="time"
                      value={timing.effectiveDeliveryTime}
                      onChange={(e) => handleUpdateTiming(index, 'effectiveDeliveryTime', e.target.value)}
                      className="mt-1"
                      fullWidth
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                      Delivery Day Offset
                    </label>
                    <Select
                      value={timing.deliveryDayOffset.toString()}
                      onChange={(e) => handleUpdateTiming(index, 'deliveryDayOffset', parseInt(e.target.value))}
                      className="mt-1"
                      options={[
                        { value: '-1', label: 'Previous Day' },
                        { value: '0', label: 'Same Day' },
                        { value: '1', label: 'Next Day' },
                      ]}
                    />
                  </div>
                </div>

                {/* Summary */}
                <div className="flex gap-2 pt-2">
                  <Badge variant="secondary" size="sm">
                    Production: {timing.productionStartTime} ({getDayOffsetLabel(timing.productionDayOffset)})
                  </Badge>
                  <Badge variant="secondary" size="sm">
                    Delivery: {timing.effectiveDeliveryTime} ({getDayOffsetLabel(timing.deliveryDayOffset)})
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
