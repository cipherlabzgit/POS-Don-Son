'use client';

interface Day {
  value: number;
  short: string;
  label: string;
}

const DAYS: Day[] = [
  { value: 1, short: 'Mon', label: 'Monday' },
  { value: 2, short: 'Tue', label: 'Tuesday' },
  { value: 3, short: 'Wed', label: 'Wednesday' },
  { value: 4, short: 'Thu', label: 'Thursday' },
  { value: 5, short: 'Fri', label: 'Friday' },
  { value: 6, short: 'Sat', label: 'Saturday' },
  { value: 0, short: 'Sun', label: 'Sunday' },
];

interface DaySelectorProps {
  selected: number[];
  onChange: (days: number[]) => void;
}

export default function DaySelector({ selected, onChange }: DaySelectorProps) {
  const toggle = (value: number) => {
    if (selected.includes(value)) {
      onChange(selected.filter(d => d !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const selectAll = () => onChange(DAYS.map(d => d.value));
  const clearAll = () => onChange([]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          Applicable Days
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={selectAll}
            className="text-xs font-medium transition-colors"
            style={{ color: '#C8102E' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Select All
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-medium transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {DAYS.map(day => {
          const isSelected = selected.includes(day.value);
          const isWeekend = day.value === 0 || day.value === 6;
          return (
            <button
              key={day.value}
              type="button"
              title={day.label}
              onClick={() => toggle(day.value)}
              className="w-12 h-12 rounded-lg text-sm font-semibold transition-all border-2 select-none"
              style={{
                backgroundColor: isSelected ? '#C8102E' : 'var(--background)',
                color: isSelected
                  ? '#ffffff'
                  : isWeekend
                  ? '#C8102E'
                  : 'var(--foreground)',
                borderColor: isSelected
                  ? '#C8102E'
                  : isWeekend
                  ? '#C8102E40'
                  : 'var(--border)',
              }}
            >
              {day.short}
            </button>
          );
        })}
      </div>

      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
        {selected.length === 0
          ? 'No specific days selected — day type applies manually.'
          : `${selected.length} day${selected.length !== 1 ? 's' : ''} selected: ${DAYS.filter(d => selected.includes(d.value))
              .map(d => d.label)
              .join(', ')}`}
      </p>
    </div>
  );
}
