'use client';

import { CATEGORY_COLOR_OPTIONS } from '@/src/config/constants';
import { cn } from '@/src/shared/utils/cn';
import { PaletteIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';

interface ColorPickerProps {
  icon?: React.ReactNode;
  value: string | undefined;
  onChange: (value: string) => void;
}

const NEUTRAL_COLOR = '#6B7280';

export const ColorPicker = ({
  icon = <PaletteIcon className="size-4" />,
  value,
  onChange,
}: ColorPickerProps) => {
  const [open, setOpen] = useState(false);
  const iconColor = value || NEUTRAL_COLOR;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon">
          <span
            style={{
              color: iconColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
          {CATEGORY_COLOR_OPTIONS.map((color) => (
            <button
              key={color}
              onClick={() => {
                onChange(color);
                setOpen(false);
              }}
              className={cn(
                'w-8 h-8 rounded-md cursor-pointer border-2 transition-all',
                value === color
                  ? 'border-foreground ring-2 ring-offset-1'
                  : 'border-transparent hover:scale-110'
              )}
              style={{ backgroundColor: color }}
              aria-label={`Select color ${color}`}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
