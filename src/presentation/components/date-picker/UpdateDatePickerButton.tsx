'use client';

import { Task } from '@/src/domain/model/Task';
import { CalendarPlusIcon } from 'lucide-react';

import { handleError } from '@/src/shared/errors';
import { cn } from '@/src/shared/utils';
import { useId, useState } from 'react';
import { useUpdateTask } from '../../hooks/tasks/useTasks';
import { TooltipButton } from '../buttons/TooltipButton';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

interface UpdateDatePickerButtonProps {
  task: Task;
}

export const UpdateDatePickerButton = ({
  task,
}: UpdateDatePickerButtonProps) => {
  const [open, setOpen] = useState<boolean>(false);
  const [date, setDate] = useState<Date | null>(task.scheduledDate);

  const { mutateAsync: updateTask, isPending } = useUpdateTask();

  const generatedId = useId();

  const handleChange = async (date: Date | null | undefined) => {
    setDate(date ?? null);
    try {
      await updateTask({
        taskId: task.id,
        updates: {
          scheduledDate: date,
        },
      });
    } catch (error) {
      handleError.toast(error, 'Failed to update task');
      return;
    }
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-3 w-full justify-between">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <TooltipButton
            tooltip="Change scheduled date"
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
            props={{ id: generatedId, disabled: isPending }}
          />
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={date ?? undefined}
            captionLayout="dropdown"
            onSelect={(date) => {
              handleChange(date);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
