'use client';

import {
  Button,
  buttonVariants,
} from '@/src/presentation/components/ui/button';
import { VariantProps } from 'class-variance-authority';
import { PlusIcon, RepeatIcon } from 'lucide-react';
import { useState } from 'react';
import { CreateRecurringTaskDrawer } from './CreateRecurringTaskDrawer';

export interface CreateRecurringTaskButtonProps {
  text?: string;
  variant?: VariantProps<typeof buttonVariants>['variant'];
}

export function CreateRecurringTaskButton({
  text = 'Add Recurring Task',
  variant = 'ghost',
}: CreateRecurringTaskButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant={variant} size="default" onClick={() => setOpen(true)}>
        <div className="flex items-center gap-1">
          <RepeatIcon className="size-4" />
          <PlusIcon className="size-3" />
        </div>
        <span className="text-sm font-medium">{text}</span>
      </Button>
      <CreateRecurringTaskDrawer open={open} onOpenChange={setOpen} />
    </>
  );
}
