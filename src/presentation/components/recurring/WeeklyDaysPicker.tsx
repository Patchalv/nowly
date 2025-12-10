'use client';

import { Label } from '@/src/presentation/components/ui/label';
import { Toggle } from '@/src/presentation/components/ui/toggle';

interface WeeklyDaysPickerProps {
  value: number[];
  onChange: (days: number[]) => void;
}

/**
 * Days of the week for selection, displayed Monday-first
 * Values use JavaScript's native day numbers: 0=Sunday, 1=Monday, ..., 6=Saturday
 */
const DAYS = [
  { value: 1, label: 'M', name: 'Monday' }, // Monday (JS: 1)
  { value: 2, label: 'T', name: 'Tuesday' }, // Tuesday (JS: 2)
  { value: 3, label: 'W', name: 'Wednesday' }, // Wednesday (JS: 3)
  { value: 4, label: 'T', name: 'Thursday' }, // Thursday (JS: 4)
  { value: 5, label: 'F', name: 'Friday' }, // Friday (JS: 5)
  { value: 6, label: 'S', name: 'Saturday' }, // Saturday (JS: 6)
  { value: 0, label: 'S', name: 'Sunday' }, // Sunday (JS: 0)
];

export function WeeklyDaysPicker({ value, onChange }: WeeklyDaysPickerProps) {
  const handleDayToggle = (day: number) => {
    if (value.includes(day)) {
      onChange(value.filter((d) => d !== day));
    } else {
      onChange([...value, day].sort((a, b) => a - b));
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Label>Repeat on</Label>
      <div className="flex gap-1">
        {DAYS.map((day) => (
          <Toggle
            key={day.value}
            variant="outline"
            size="sm"
            pressed={value.includes(day.value)}
            onPressedChange={() => handleDayToggle(day.value)}
            aria-label={`Toggle ${day.name}`}
          >
            {day.label}
          </Toggle>
        ))}
      </div>
    </div>
  );
}
