import { BONUS_SECTION_CONFIG } from '@/src/config/constants';
import type { BonusSection } from '@/src/domain/types/tasks';
import { CheckCircle2Icon, StarIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
import { TooltipButton } from '../../buttons/TooltipButton';
import { Button } from '../../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';

interface BonusSectionPickerProps {
  value: BonusSection | null | undefined;
  onChange: (value: BonusSection | null) => void;
}

export function BonusSectionPicker({
  value,
  onChange,
}: BonusSectionPickerProps) {
  const [open, setOpen] = useState(false);

  const SECTIONS: BonusSection[] = ['essential', 'bonus'];

  // Get icon based on value
  const getIcon = () => {
    if (value === 'essential') return <CheckCircle2Icon className="size-4" />;
    if (value === 'bonus') return <StarIcon className="size-4" />;
    return <XIcon className="size-4" />;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <TooltipButton
          tooltip="Bonus Section"
          btnVariant="ghost"
          btnSize="icon"
          btnContent={getIcon()}
        />
      </PopoverTrigger>
      <PopoverContent>
        <div className="flex flex-col gap-2">
          {SECTIONS.map((section) => {
            const config = BONUS_SECTION_CONFIG[section];
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
