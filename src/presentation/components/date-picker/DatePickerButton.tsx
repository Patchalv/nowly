'use client';

import { CalendarPlusIcon } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/src/shared/utils';
import { TooltipButton } from '../buttons/TooltipButton';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

interface DatePickerButtonProps {
  defaultScheduledDate?: Date | null | undefined;
  id?: string;
  date: Date | null | undefined;
  setDate: (date: Date | null | undefined) => void;
}

export function DatePickerButton({
  defaultScheduledDate,
  date,
  id,
  setDate,
}: DatePickerButtonProps) {
  const [open, setOpen] = React.useState(false);
  const generatedId = React.useId();
  const fieldId = id ?? generatedId;
  const selectedCalendarDate = date ?? defaultScheduledDate ?? undefined;

  return (
    <div className="flex items-center gap-3 w-full justify-between">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <TooltipButton
            tooltip="Select date"
            btnContent={
              <CalendarPlusIcon
                className={cn(
                  'size-4',
                  date ? 'text-teal-600' : 'text-muted-foreground'
                )}
              />
            }
            btnVariant="ghost"
            btnSize="icon-sm"
            id={fieldId}
          />
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
