'use client';

import { Label } from '@/src/presentation/components/ui/label';
import { Toggle } from '@/src/presentation/components/ui/toggle';

interface WeeklyDaysPickerProps {
  value: number[];
  onChange: (days: number[]) => void;
}

const DAYS = [
  { value: 0, label: 'M' }, // Monday
  { value: 1, label: 'T' }, // Tuesday
  { value: 2, label: 'W' }, // Wednesday
  { value: 3, label: 'T' }, // Thursday
  { value: 4, label: 'F' }, // Friday
  { value: 5, label: 'S' }, // Saturday
  { value: 6, label: 'S' }, // Sunday
];

const DAYS_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
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
            aria-label={`Toggle ${DAYS_NAMES[day.value]}`}
          >
            {day.label}
          </Toggle>
        ))}
      </div>
    </div>
  );
}
