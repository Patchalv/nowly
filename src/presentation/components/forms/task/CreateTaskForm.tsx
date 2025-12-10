import {
  CreateTaskInput,
  createTaskSchema,
} from '@/src/domain/validation/task/task.schema';
import { useCreateTask } from '@/src/presentation/hooks/tasks/useTasks';
import { cn } from '@/src/shared/utils/cn';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { DatePickerButton } from '../../date-picker/DatePickerButton';
import { Button } from '../../ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '../../ui/form';
import { Input } from '../../ui/input';
import { CategoryPicker } from '../pickers/CategoryPicker';
import { PriorityPicker } from '../pickers/PriorityPicker';

export interface CreateTaskFormProps {
  defaultScheduledDate?: Date | null | undefined;
  className?: string;
  onSuccess?: () => void;
}

export const CreateTaskForm = ({
  defaultScheduledDate,
  className,
  onSuccess,
}: CreateTaskFormProps) => {
  const { mutate: createTask, isPending } = useCreateTask();

  const form = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: '',
      scheduledDate: defaultScheduledDate ?? undefined,
      priority: undefined,
      categoryId: undefined,
    },
  });

  const onSubmit = (data: CreateTaskInput) => {
    // Convert CreateTaskInput to FormData
    const formData = new FormData();
    formData.append('title', data.title);
    if (data.scheduledDate) {
      formData.append('scheduledDate', data.scheduledDate.toISOString());
    }
    if (data.priority !== undefined) {
      formData.append('priority', data.priority);
    }
    if (data.categoryId !== undefined) {
      formData.append('categoryId', data.categoryId ?? '');
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
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <PriorityPicker
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <CategoryPicker
                    categoryId={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
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
