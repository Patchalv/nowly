'use client';

import { Label } from '../ui/label';
import { Toggle } from '../ui/toggle';

interface WeeklyDaysPickerProps {
  value: number[];
  onChange: (days: number[]) => void;
}

const DAYS = [
  { value: 0, label: 'S' }, // Sunday
  { value: 1, label: 'M' }, // Monday
  { value: 2, label: 'T' }, // Tuesday
  { value: 3, label: 'W' }, // Wednesday
  { value: 4, label: 'T' }, // Thursday
  { value: 5, label: 'F' }, // Friday
  { value: 6, label: 'S' }, // Saturday
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
            aria-label={`Toggle ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day.value]}`}
          >
            {day.label}
          </Toggle>
        ))}
      </div>
    </div>
  );
}
