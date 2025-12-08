'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { RecurringFrequency } from '@/src/domain/types/recurring';
import { TaskPriority } from '@/src/domain/types/tasks';
import {
  bonusSectionSchema,
  dailySectionSchema,
  taskPrioritySchema,
} from '@/src/domain/validation/task/task.schema';
import { DatePickerButton } from '@/src/presentation/components/date-picker/DatePickerButton';
import { CategoryPicker } from '@/src/presentation/components/forms/pickers/CategoryPicker';
import { PriorityPicker } from '@/src/presentation/components/forms/pickers/PriorityPicker';
import { Button } from '@/src/presentation/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/src/presentation/components/ui/form';
import { Input } from '@/src/presentation/components/ui/input';
import { Label } from '@/src/presentation/components/ui/label';
import { Textarea } from '@/src/presentation/components/ui/textarea';
import { useCreateRecurringTaskItem } from '@/src/presentation/hooks/recurring/useCreateRecurringTaskItem';
import { cn } from '@/src/shared/utils/cn';
import { DueOffsetInput } from './DueOffsetInput';
import { FrequencySelector } from './FrequencySelector';
import { MonthlyDayPicker } from './MonthlyDayPicker';
import { WeeklyDaysPicker } from './WeeklyDaysPicker';
import { YearlyDatePicker } from './YearlyDatePicker';

/**
 * Form-specific schema that matches what the form collects
 * This is separate from the server-side validation schema
 */
const formSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
    description: z.string().max(1000, 'Description too long').optional(),
    categoryId: z.string().uuid('Invalid category ID').optional(),
    priority: taskPrioritySchema.optional(),
    dailySection: dailySectionSchema.optional(),
    bonusSection: bonusSectionSchema.optional(),
    frequency: z.enum([
      'daily',
      'weekly',
      'monthly',
      'yearly',
      'weekdays',
      'weekends',
    ]),
    startDate: z.date(),
    endDate: z.date().optional(),
    dueOffsetDays: z.number().int().min(0).max(365),
    weeklyDays: z.array(z.number().int().min(0).max(6)).optional(),
    monthlyDay: z.number().int().min(1).max(31).optional(),
    yearlyMonth: z.number().int().min(1).max(12).optional(),
    yearlyDay: z.number().int().min(1).max(31).optional(),
  })
  .refine(
    (data) => {
      if (data.endDate && data.startDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  )
  .refine(
    (data) => {
      if (data.frequency === 'weekly') {
        return data.weeklyDays && data.weeklyDays.length > 0;
      }
      return true;
    },
    {
      message: 'Weekly frequency requires at least one day selected',
      path: ['weeklyDays'],
    }
  )
  .refine(
    (data) => {
      if (data.frequency === 'monthly') {
        return data.monthlyDay !== undefined;
      }
      return true;
    },
    {
      message: 'Monthly frequency requires day of month',
      path: ['monthlyDay'],
    }
  )
  .refine(
    (data) => {
      if (data.frequency === 'yearly') {
        return data.yearlyMonth !== undefined && data.yearlyDay !== undefined;
      }
      return true;
    },
    {
      message: 'Yearly frequency requires month and day',
      path: ['yearlyMonth'],
    }
  );

type FormData = z.infer<typeof formSchema>;

export interface CreateRecurringTaskFormProps {
  className?: string;
  onSuccess?: () => void;
}

export function CreateRecurringTaskForm({
  className,
  onSuccess,
}: CreateRecurringTaskFormProps) {
  const { mutate: createRecurringTaskItem, isPending } =
    useCreateRecurringTaskItem();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: undefined,
      categoryId: undefined,
      priority: 'medium',
      dailySection: undefined,
      bonusSection: undefined,
      frequency: 'daily',
      startDate: new Date(),
      endDate: undefined,
      dueOffsetDays: 0,
      weeklyDays: [],
      monthlyDay: undefined,
      yearlyMonth: undefined,
      yearlyDay: undefined,
    },
  });

  const frequency = form.watch('frequency');

  const onSubmit = (data: FormData) => {
    const formData = new FormData();
    formData.append('title', data.title);
    if (data.description) {
      formData.append('description', data.description);
    }
    if (data.categoryId) {
      formData.append('categoryId', data.categoryId);
    }
    if (data.priority) {
      formData.append('priority', data.priority);
    }
    if (data.dailySection) {
      formData.append('dailySection', data.dailySection);
    }
    if (data.bonusSection) {
      formData.append('bonusSection', data.bonusSection);
    }
    formData.append('frequency', data.frequency);
    formData.append('startDate', data.startDate.toISOString());
    if (data.endDate) {
      formData.append('endDate', data.endDate.toISOString());
    }
    formData.append('dueOffsetDays', String(data.dueOffsetDays));
    if (data.weeklyDays && data.weeklyDays.length > 0) {
      formData.append('weeklyDays', JSON.stringify(data.weeklyDays));
    }
    if (data.monthlyDay !== undefined) {
      formData.append('monthlyDay', String(data.monthlyDay));
    }
    if (data.yearlyMonth !== undefined) {
      formData.append('yearlyMonth', String(data.yearlyMonth));
    }
    if (data.yearlyDay !== undefined) {
      formData.append('yearlyDay', String(data.yearlyDay));
    }

    createRecurringTaskItem(formData, {
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
        id="create-recurring-task-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('space-y-4', className)}
      >
        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Pay rent"
                  autoComplete="off"
                  autoFocus
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add more details (optional)"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category and Priority Row */}
        <div className="flex items-center gap-2">
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
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <PriorityPicker
                    value={field.value as TaskPriority | undefined}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Frequency Selector */}
        <FormField
          control={form.control}
          name="frequency"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <FrequencySelector
                  value={field.value as RecurringFrequency}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Weekly Days Picker */}
        {frequency === 'weekly' && (
          <FormField
            control={form.control}
            name="weeklyDays"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <WeeklyDaysPicker
                    value={field.value ?? []}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Monthly Day Picker */}
        {frequency === 'monthly' && (
          <FormField
            control={form.control}
            name="monthlyDay"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <MonthlyDayPicker
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Yearly Date Picker */}
        {frequency === 'yearly' && (
          <FormField
            control={form.control}
            name="yearlyMonth"
            render={({ field: monthField }) => (
              <FormField
                control={form.control}
                name="yearlyDay"
                render={({ field: dayField }) => (
                  <FormItem>
                    <FormControl>
                      <YearlyDatePicker
                        month={monthField.value}
                        day={dayField.value}
                        onMonthChange={monthField.onChange}
                        onDayChange={dayField.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          />
        )}

        {/* Start Date */}
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <Label htmlFor="start-date">Start Date</Label>
                <FormControl>
                  <DatePickerButton
                    id="start-date"
                    date={field.value}
                    setDate={(date) => field.onChange(date ?? new Date())}
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* End Date */}
        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <Label htmlFor="end-date">End Date</Label>
                <FormControl>
                  <DatePickerButton
                    id="end-date"
                    date={field.value}
                    setDate={field.onChange}
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Due Offset */}
        <FormField
          control={form.control}
          name="dueOffsetDays"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <DueOffsetInput
                  value={field.value ?? 0}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button
          variant="secondary"
          type="submit"
          size="default"
          className="w-full"
          form="create-recurring-task-form"
          disabled={isPending}
        >
          {isPending ? 'Creating...' : 'Create Recurring Task'}
        </Button>
      </form>
    </Form>
  );
}
