import {
  CreateTaskInput,
  createTaskSchema,
} from '@/src/domain/validation/task/task.schema';
import { useCreateTask } from '@/src/presentation/hooks/tasks/useTasks';
import { cn } from '@/src/shared/utils/cn';
import { zodResolver } from '@hookform/resolvers/zod';
import { SendHorizontalIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '../ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { DatePickerInput } from './DatePickerInput';

interface CreateTaskFormProps {
  defaultScheduledDate?: Date | null | undefined;
  isInline?: boolean;
  className?: string;
  onSuccess?: () => void;
}

export const CreateTaskForm = ({
  defaultScheduledDate,
  isInline = false,
  className,
  onSuccess,
}: CreateTaskFormProps) => {
  const { mutate: createTask, isPending } = useCreateTask();

  const form = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: '',
      scheduledDate: defaultScheduledDate ?? undefined,
    },
  });

  const onSubmit = (data: CreateTaskInput) => {
    // Convert CreateTaskInput to FormData
    const formData = new FormData();
    formData.append('title', data.title);
    if (data.scheduledDate) {
      formData.append('scheduledDate', data.scheduledDate.toISOString());
    }
    createTask(formData, {
      onSuccess: (response) => {
        if (response.success) {
          form.reset();
          onSuccess?.();
        }
      },
    });
  };

  return (
    <Form {...form}>
      <form
        id="create-task-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('space-y-4', className)}
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
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
        {isInline ? (
          <div className="flex items-center justify-between gap-3">
            <FormField
              control={form.control}
              name="scheduledDate"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <DatePickerInput
                      label="Scheduled"
                      date={field.value}
                      setDate={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              size="icon"
              form="create-task-form"
              disabled={isPending}
            >
              <SendHorizontalIcon className="size-4" />
            </Button>
          </div>
        ) : (
          <FormField
            control={form.control}
            name="scheduledDate"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <DatePickerInput
                    label="Scheduled"
                    date={field.value}
                    setDate={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <Button
          variant="secondary"
          type="submit"
          size="default"
          className="w-full"
          form="create-task-form"
          disabled={isPending}
        >
          {isPending ? 'Creating...' : 'Create Task'}
        </Button>
      </form>
    </Form>
  );
};
