'use client';

import { Label } from '../ui/label';
import { Input } from '../ui/input';

interface DueOffsetInputProps {
  value: number;
  onChange: (days: number) => void;
}

export function DueOffsetInput({ value, onChange }: DueOffsetInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Allow empty input (will be treated as 0)
    if (inputValue === '') {
      onChange(0);
      return;
    }

    const numValue = parseInt(inputValue, 10);

    // Only accept valid numbers within range
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(0, Math.min(365, numValue));
      onChange(clampedValue);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="due-offset">Due after (days)</Label>
      <Input
        id="due-offset"
        type="number"
        min={0}
        max={365}
        value={value}
        onChange={handleChange}
        className="w-full"
      />
      <p className="text-muted-foreground text-xs">
        Days after the scheduled date when the task is due
      </p>
    </div>
  );
}
