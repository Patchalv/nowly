'use client';

import { Label } from '@/src/presentation/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/presentation/components/ui/select';

interface MonthlyDayPickerProps {
  value: number | undefined;
  onChange: (day: number) => void;
}

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export function MonthlyDayPicker({ value, onChange }: MonthlyDayPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="monthly-day">Day of month</Label>
      <Select
        value={value?.toString()}
        onValueChange={(val) => onChange(parseInt(val, 10))}
      >
        <SelectTrigger id="monthly-day" className="w-full">
          <SelectValue placeholder="Select day" />
        </SelectTrigger>
        <SelectContent>
          {DAYS.map((day) => (
            <SelectItem key={day} value={day.toString()}>
              {day}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
