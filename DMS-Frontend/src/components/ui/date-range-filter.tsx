'use client';

import Input from './input';
import Button from './button';
import { X } from 'lucide-react';

interface DateRangeFilterProps {
  fromDate: string;
  toDate: string;
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
  onClear: () => void;
  label?: string;
}

export function DateRangeFilter({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onClear,
  label = 'Filter by Date Range',
}: DateRangeFilterProps) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="w-full sm:w-auto">
        <Input
          label="From Date"
          type="date"
          value={fromDate}
          onChange={(e) => onFromDateChange(e.target.value)}
          className="w-full sm:w-[180px]"
        />
      </div>
      <div className="w-full sm:w-auto">
        <Input
          label="To Date"
          type="date"
          value={toDate}
          onChange={(e) => onToDateChange(e.target.value)}
          className="w-full sm:w-[180px]"
        />
      </div>
      {(fromDate || toDate) && (
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={onClear}
          title="Clear date filter"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

export default DateRangeFilter;
