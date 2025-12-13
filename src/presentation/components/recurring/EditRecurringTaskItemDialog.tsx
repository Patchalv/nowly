'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import type { RecurringTaskItem } from '@/src/domain/types/recurring';
import {
  updateRecurringTaskItemSchema,
  type UpdateRecurringTaskItemInput,
} from '@/src/domain/validation/recurring/recurringTaskItem.schema';
import { DatePickerButton } from '@/src/presentation/components/date-picker/DatePickerButton';
import { BonusSectionPicker } from '@/src/presentation/components/forms/pickers/BonusSectionPicker';
import { CategoryPicker } from '@/src/presentation/components/forms/pickers/CategoryPicker';
import { DailySectionPicker } from '@/src/presentation/components/forms/pickers/DailySectionPicker';
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
import { Textarea } from '@/src/presentation/components/ui/textarea';
import { useUpdateRecurringTaskItem } from '@/src/presentation/hooks/recurring/useUpdateRecurringTaskItem';

/**
 * Form schema for editing a recurring task item
 */
const editFormSchema = updateRecurringTaskItemSchema.extend({
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
      description: item.description ?? null,
      categoryId: item.categoryId ?? null,
      priority: item.priority ?? null,
      dailySection: item.dailySection ?? null,
      bonusSection: item.bonusSection ?? null,
      endDate: item.endDate ?? null,
    },
  });

  const normalizeDescription = (value: string | null | undefined) =>
    value == null || value.trim() === '' ? null : value.trim();

  const onSubmit = (data: EditFormData) => {
    // Build updates object with only changed fields
    const updates: UpdateRecurringTaskItemInput = {};

    if (data.title !== item.title) {
      updates.title = data.title;
    }
    if (
      normalizeDescription(data.description) !==
      normalizeDescription(item.description)
    ) {
      updates.description = normalizeDescription(data.description);
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
      form.reset();
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

            {/* Category, Priority, Daily Section, and Bonus Section Row */}
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
              <FormField
                control={form.control}
                name="dailySection"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <DailySectionPicker
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
                name="bonusSection"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <BonusSectionPicker
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                onClick={() => {
                  form.reset();
                  onOpenChange(false);
                }}
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
