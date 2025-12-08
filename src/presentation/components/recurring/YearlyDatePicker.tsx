'use client';

import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface YearlyDatePickerProps {
  month: number | undefined;
  day: number | undefined;
  onMonthChange: (month: number) => void;
  onDayChange: (day: number) => void;
}

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export function YearlyDatePicker({
  month,
  day,
  onMonthChange,
  onDayChange,
}: YearlyDatePickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label>Date</Label>
      <div className="flex gap-2">
        <Select
          value={month?.toString()}
          onValueChange={(val) => onMonthChange(parseInt(val, 10))}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((m) => (
              <SelectItem key={m.value} value={m.value.toString()}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={day?.toString()}
          onValueChange={(val) => onDayChange(parseInt(val, 10))}
        >
          <SelectTrigger className="w-20">
            <SelectValue placeholder="Day" />
          </SelectTrigger>
          <SelectContent>
            {DAYS.map((d) => (
              <SelectItem key={d} value={d.toString()}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
