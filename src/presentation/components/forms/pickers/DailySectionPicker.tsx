'use client';

import { SunIcon, SunriseIcon, SunsetIcon, XIcon } from 'lucide-react';
import { useState } from 'react';

import { DAILY_SECTION_CONFIG } from '@/src/config/constants';
import type { DailySection } from '@/src/domain/types/tasks';
import { TooltipButton } from '@/src/presentation/components/buttons/TooltipButton';
import { Button } from '@/src/presentation/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/src/presentation/components/ui/popover';

interface DailySectionPickerProps {
  value: DailySection | null | undefined;
  onChange: (value: DailySection | null) => void;
}

const SECTIONS: DailySection[] = ['morning', 'afternoon', 'evening'];

const SECTION_ICONS: Record<DailySection, React.ReactNode> = {
  morning: <SunriseIcon className="size-4" />,
  afternoon: <SunIcon className="size-4" />,
  evening: <SunsetIcon className="size-4" />,
};

export function DailySectionPicker({
  value,
  onChange,
}: DailySectionPickerProps) {
  const [open, setOpen] = useState(false);

  const icon = value ? SECTION_ICONS[value] : <XIcon className="size-4" />;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <TooltipButton
          tooltip="Daily Section"
          btnVariant="ghost"
          btnSize="icon"
          btnContent={icon}
        />
      </PopoverTrigger>
      <PopoverContent>
        <div className="flex flex-col gap-2">
          {SECTIONS.map((section) => {
            const config = DAILY_SECTION_CONFIG[section];
            return (
              <Button
                key={section}
                variant="outline"
                onClick={() => {
                  onChange(section);
                  setOpen(false);
                }}
              >
                {config.icon} {config.label}
              </Button>
            );
          })}
          <Button
            variant="outline"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
          >
            <XIcon className="size-4" />
            None
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
