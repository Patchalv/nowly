'use client';

import {
  CATEGORY_ICON_OPTIONS,
  DEFAULT_CATEGORY_ICON,
} from '@/src/config/constants';
import { cn } from '@/src/shared/utils/cn';
import { getIconComponent } from '@/src/shared/utils/icons';
import { useState } from 'react';
import { Button } from '../../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';

interface IconPickerProps {
  icon?: React.ReactNode;
  value: string | undefined;
  onChange: (value: string) => void;
}

export const IconPicker = ({ icon, value, onChange }: IconPickerProps) => {
  const [open, setOpen] = useState(false);
  const selectedIconName = value || DEFAULT_CATEGORY_ICON;
  const SelectedIcon = getIconComponent(selectedIconName);
  const displayIcon = icon || <SelectedIcon className="size-4" />;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon">
          {displayIcon}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
          {CATEGORY_ICON_OPTIONS.map((iconName) => {
            const IconComponent = getIconComponent(iconName);
            const isSelected = value === iconName;

            return (
              <button
                key={iconName}
                onClick={() => {
                  onChange(iconName);
                  setOpen(false);
                }}
                className={cn(
                  'w-8 h-8 rounded-md cursor-pointer border-2 transition-all flex items-center justify-center',
                  isSelected
                    ? 'border-foreground ring-2 ring-offset-1'
                    : 'border-transparent hover:scale-110 hover:bg-accent'
                )}
                aria-label={`Select icon ${iconName}`}
              >
                <IconComponent className="size-4" />
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};
