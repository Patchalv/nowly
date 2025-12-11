'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  BONUS_SECTION_CONFIG,
  DAILY_SECTION_CONFIG,
} from '@/src/config/constants';
import type { RecurringTaskItem } from '@/src/domain/types/recurring';
import type { UpdateRecurringTaskItemInput } from '@/src/domain/validation/recurring/recurringTaskItem.schema';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/presentation/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/src/presentation/components/ui/form';
import { Input } from '@/src/presentation/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/presentation/components/ui/select';
import { Textarea } from '@/src/presentation/components/ui/textarea';
import { useUpdateRecurringTaskItem } from '@/src/presentation/hooks/recurring/useUpdateRecurringTaskItem';

/**
 * Form schema for editing a recurring task item
 * Uses z.date() instead of z.coerce.date() since we're working with Date objects in the form
 */
const editFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title too long')
    .optional(),
  description: z
    .string()
    .max(1000, 'Description too long')
    .nullable()
    .optional(),
  categoryId: z.string().uuid('Invalid category ID').nullable().optional(),
  priority: taskPrioritySchema.nullable().optional(),
  dailySection: dailySectionSchema.nullable().optional(),
  bonusSection: bonusSectionSchema.nullable().optional(),
  endDate: z.date().nullable().optional(),
});

type EditFormData = z.infer<typeof editFormSchema>;

interface EditRecurringTaskItemDialogProps {
  item: RecurringTaskItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditRecurringTaskItemDialog({
  item,
  open,
  onOpenChange,
}: EditRecurringTaskItemDialogProps) {
  const { mutate: updateRecurringItem, isPending } =
    useUpdateRecurringTaskItem();

  const form = useForm<EditFormData>({
    resolver: zodResolver(editFormSchema),
    mode: 'onBlur',
    defaultValues: {
      title: item.title,
      description: item.description ?? undefined,
      categoryId: item.categoryId ?? undefined,
      priority: item.priority ?? undefined,
      dailySection: item.dailySection ?? undefined,
      bonusSection: item.bonusSection ?? undefined,
      endDate: item.endDate ?? undefined,
    },
  });

  const onSubmit = (data: EditFormData) => {
    // Build updates object with only changed fields
    const updates: UpdateRecurringTaskItemInput = {};

    if (data.title !== item.title) {
      updates.title = data.title;
    }
    if (data.description !== (item.description ?? undefined)) {
      updates.description = data.description ?? null;
    }
    if (data.categoryId !== (item.categoryId ?? undefined)) {
      updates.categoryId = data.categoryId ?? null;
    }
    if (data.priority !== (item.priority ?? undefined)) {
      updates.priority = data.priority ?? null;
    }
    if (data.dailySection !== (item.dailySection ?? undefined)) {
      updates.dailySection = data.dailySection ?? null;
    }
    if (data.bonusSection !== (item.bonusSection ?? undefined)) {
      updates.bonusSection = data.bonusSection ?? null;
    }
    // Compare endDate - handle null/undefined properly
    const dataEndDate = data.endDate ?? null;
    const itemEndDate = item.endDate ?? null;
    if (dataEndDate?.getTime() !== itemEndDate?.getTime()) {
      updates.endDate = dataEndDate;
    }

    // Only submit if there are changes
    if (Object.keys(updates).length === 0) {
      onOpenChange(false);
      return;
    }

    updateRecurringItem(
      {
        recurringItemId: item.id,
        updates,
      },
      {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Recurring Task</DialogTitle>
          <DialogDescription>
            Update the recurring task. Changes will be applied to all
            uncompleted task instances.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id="edit-recurring-task-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
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
                  <FormItem className="flex-1">
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
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Daily Section */}
            <FormField
              control={form.control}
              name="dailySection"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Daily Section</FormLabel>
                  <Select
                    value={field.value ?? ''}
                    onValueChange={(value) =>
                      field.onChange(value === '' ? null : value)
                    }
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="No section" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">No section</SelectItem>
                      {Object.entries(DAILY_SECTION_CONFIG).map(
                        ([value, config]) => (
                          <SelectItem key={value} value={value}>
                            {config.icon} {config.label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Bonus Section */}
            <FormField
              control={form.control}
              name="bonusSection"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bonus Section</FormLabel>
                  <Select
                    value={field.value ?? ''}
                    onValueChange={(value) =>
                      field.onChange(value === '' ? null : value)
                    }
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="No section" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">No section</SelectItem>
                      {Object.entries(BONUS_SECTION_CONFIG).map(
                        ([value, config]) => (
                          <SelectItem key={value} value={value}>
                            {config.icon} {config.label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
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
                  <FormLabel>End Date (optional)</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <DatePickerButton
                        date={field.value ?? undefined}
                        setDate={(date) => field.onChange(date ?? null)}
                      />
                      {field.value && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => field.onChange(null)}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending || !form.formState.isDirty}
                form="edit-recurring-task-form"
              >
                {isPending ? 'Updating...' : 'Update'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
