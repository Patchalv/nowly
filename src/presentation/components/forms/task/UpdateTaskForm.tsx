import { Task } from '@/src/domain/model/Task';
import {
  UpdateTaskInput,
  updateTaskSchema,
} from '@/src/domain/validation/task/task.schema';
import { useUpdateTask } from '@/src/presentation/hooks/tasks/useTasks';
import { cn } from '@/src/shared/utils/cn';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarMinusIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { DeleteTaskButton } from '../../buttons/task/DeleteTaskButton';
import { TooltipButton } from '../../buttons/TooltipButton';
import { DatePickerButton } from '../../date-picker/DatePickerButton';
import { Button } from '../../ui/button';
import { Checkbox } from '../../ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '../../ui/form';
import { Input } from '../../ui/input';

interface UpdateTaskFormProps {
  task: Task;
  className?: string;
  onSuccess?: () => void;
}

export const UpdateTaskForm = ({
  task,
  className,
  onSuccess,
}: UpdateTaskFormProps) => {
  const { mutate: updateTask, isPending } = useUpdateTask();

  const form = useForm<UpdateTaskInput>({
    resolver: zodResolver(updateTaskSchema),
    defaultValues: {
      title: task.title,
      scheduledDate: task.scheduledDate,
      completed: task.completed,
    },
  });

  const onSubmit = (data: UpdateTaskInput) => {
    updateTask(
      {
        taskId: task.id,
        updates: {
          title: data.title,
          completed: data.completed,
          scheduledDate: data.scheduledDate,
        },
      },
      {
        onSuccess: (response) => {
          if (response.success) {
            form.reset({
              title: data.title ?? task.title,
              scheduledDate: data.scheduledDate ?? task.scheduledDate,
              completed: data.completed ?? task.completed,
            });
            onSuccess?.();
          }
        },
      }
    );
  };

  const UnscheduleTaskButton = ({
    onUnschedule,
  }: {
    onUnschedule: () => void;
  }) => (
    <TooltipButton
      tooltip="Unschedule task"
      btnContent={<CalendarMinusIcon className="size-4" />}
      btnVariant="ghost"
      btnSize="icon-sm"
      onClick={onUnschedule}
    />
  );

  return (
    <Form {...form}>
      <form
        id="update-task-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('space-y-4', className)}
      >
        <div className="w-full flex flex-row gap-2 items-center">
          <FormField
            control={form.control}
            name="completed"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Buy groceries"
                    autoComplete="off"
                    autoFocus
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="w-full flex flex-row gap-2 items-center">
          <FormField
            control={form.control}
            name="scheduledDate"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <DatePickerButton
                    date={field.value}
                    setDate={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {form.watch('scheduledDate') && (
            <FormField
              control={form.control}
              name="scheduledDate"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <UnscheduleTaskButton
                      onUnschedule={() => field.onChange(null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <DeleteTaskButton taskId={task.id} />
        </div>
        <Button
          type="submit"
          size="default"
          className="w-full"
          form="update-task-form"
          disabled={isPending || !form.formState.isDirty}
        >
          {isPending ? 'Updating...' : 'Update Task'}
        </Button>
      </form>
    </Form>
  );
};
