'use client';

import { RecurringFrequency } from '@/src/domain/types/recurring';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface FrequencySelectorProps {
  value: RecurringFrequency;
  onChange: (value: RecurringFrequency) => void;
}

const FREQUENCY_OPTIONS: { value: RecurringFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekdays', label: 'Every Weekday (Mon-Fri)' },
  { value: 'weekends', label: 'Every Weekend (Sat-Sun)' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export function FrequencySelector({ value, onChange }: FrequencySelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="frequency">Repeat</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="frequency" className="w-full">
          <SelectValue placeholder="Select frequency" />
        </SelectTrigger>
        <SelectContent>
          {FREQUENCY_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
