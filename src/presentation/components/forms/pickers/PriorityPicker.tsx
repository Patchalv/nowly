import { PRIORITY_CONFIG } from '@/src/config/constants';
import { TaskPriority } from '@/src/domain/types/tasks';
import { FlagIcon, FlagOffIcon } from 'lucide-react';
import { useState } from 'react';
import { TooltipButton } from '../../buttons/TooltipButton';
import { Button } from '../../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';

interface PriorityPickerProps {
  value?: TaskPriority | null;
  onChange: (value: TaskPriority | null) => void;
}

export const PriorityPicker = ({ value, onChange }: PriorityPickerProps) => {
  const [open, setOpen] = useState(false);

  const PRIORITIES: TaskPriority[] = ['high', 'medium', 'low'];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <TooltipButton
          tooltip="Priority"
          btnVariant="ghost"
          btnSize="icon"
          btnContent={
            value !== undefined ? (
              <FlagIcon
                className="size-4"
                style={{ color: PRIORITY_CONFIG[value as TaskPriority].color }}
              />
            ) : (
              <FlagOffIcon className="size-4" />
            )
          }
        />
      </PopoverTrigger>
      <PopoverContent>
        <div className="flex flex-col gap-2">
          {PRIORITIES.map((priority) => (
            <Button
              key={priority}
              variant="outline"
              onClick={() => onChange(priority)}
            >
              <FlagIcon
                className="size-4"
                style={{ color: PRIORITY_CONFIG[priority].color }}
              />
              {priority}
            </Button>
          ))}
          <Button variant="outline" onClick={() => onChange(null)}>
            <FlagOffIcon className="size-4" />
            None
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
