import { DAILY_SECTION_CONFIG } from '@/src/config/constants';
import type { DailySection } from '@/src/domain/types/tasks';
import { SunIcon, SunriseIcon, SunsetIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
import { TooltipButton } from '../../buttons/TooltipButton';
import { Button } from '../../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';

interface DailySectionPickerProps {
  value: DailySection | null | undefined;
  onChange: (value: DailySection | null) => void;
}

export function DailySectionPicker({
  value,
  onChange,
}: DailySectionPickerProps) {
  const [open, setOpen] = useState(false);

  const SECTIONS: DailySection[] = ['morning', 'afternoon', 'evening'];

  // Get icon based on value
  const getIcon = () => {
    if (value === 'morning') return <SunriseIcon className="size-4" />;
    if (value === 'afternoon') return <SunIcon className="size-4" />;
    if (value === 'evening') return <SunsetIcon className="size-4" />;
    return <XIcon className="size-4" />;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <TooltipButton
          tooltip="Daily Section"
          btnVariant="ghost"
          btnSize="icon"
          btnContent={getIcon()}
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
