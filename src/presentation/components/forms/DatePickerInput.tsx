'use client';

import { ChevronDownIcon } from 'lucide-react';
import * as React from 'react';

import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import { Label } from '../ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

interface DatePickerInputProps {
  label?: string;
  defaultScheduledDate?: Date | null | undefined;
  date: Date | null | undefined;
  setDate: (date: Date | null | undefined) => void;
}

export function DatePickerInput({
  label = 'Scheduled',
  defaultScheduledDate,
  date,
  setDate,
}: DatePickerInputProps) {
  const [open, setOpen] = React.useState(false);
  const selectedCalendarDate = date ?? defaultScheduledDate ?? undefined;

  return (
    <div className="flex items-center gap-3 w-full justify-between">
      <Label htmlFor="date" className="px-1">
        {label}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id="date"
            className="w-48 justify-between font-normal"
          >
            {date ? date.toLocaleDateString() : 'Select date'}
            <ChevronDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedCalendarDate}
            captionLayout="dropdown"
            onSelect={(date) => {
              setDate(date);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
