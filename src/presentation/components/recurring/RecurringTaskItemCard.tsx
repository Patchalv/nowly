'use client';

import {
  Calendar,
  CheckCircle2,
  MoreVertical,
  PauseCircle,
} from 'lucide-react';
import { useState, useTransition } from 'react';

import type { RecurringTaskItem } from '@/src/domain/types/recurring';
import { PriorityBadge } from '@/src/presentation/components/badge/PriorityBadge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/src/presentation/components/ui/alert-dialog';
import { Button } from '@/src/presentation/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/presentation/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/src/presentation/components/ui/popover';
import { useCategories } from '@/src/presentation/hooks/categories/useCategories';
import { useDeleteRecurringTaskItem } from '@/src/presentation/hooks/recurring/useDeleteRecurringTaskItem';
import { useToggleRecurringTaskItemActive } from '@/src/presentation/hooks/recurring/useToggleRecurringTaskItemActive';
import { cn } from '@/src/shared/utils/cn';
import { formatDisplayDate } from '@/src/shared/utils/date-formatting';
import { getIconComponent } from '@/src/shared/utils/icons';
import { getNextOccurrences } from '@/src/shared/utils/recurrence';
import { RecurrenceDescription } from './RecurrenceDescription';

interface RecurringTaskItemCardProps {
  item: RecurringTaskItem;
}

export function RecurringTaskItemCard({ item }: RecurringTaskItemCardProps) {
  const [_, startTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: categories } = useCategories();
  const toggleActive = useToggleRecurringTaskItemActive();
  const deleteItem = useDeleteRecurringTaskItem();

  // Find category if one is set
  const category = categories?.find((c) => c.id === item.categoryId);

  // Calculate next occurrence
  const nextOccurrence = getNextOccurrences(item.rruleString, new Date(), 1)[0];

  const handleToggleActive = () => {
    startTransition(() => {
      toggleActive.mutate({
        recurringItemId: item.id,
        isActive: !item.isActive,
      });
    });
    setMenuOpen(false);
  };

  const handleDelete = () => {
    deleteItem.mutate({ recurringItemId: item.id });
    setDeleteDialogOpen(false);
  };

  const handleDeleteClick = () => {
    setMenuOpen(false);
    setDeleteDialogOpen(true);
  };

  const CategoryIcon = category ? getIconComponent(category.icon) : null;

  const isPending = toggleActive.isPending || deleteItem.isPending;

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{item.title}</CardTitle>
          <CardAction>
            <Popover open={menuOpen} onOpenChange={setMenuOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <MoreVertical className="size-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-40 p-1">
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled
                    className="justify-start"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleActive}
                    className="justify-start"
                    disabled={isPending}
                  >
                    {item.isActive ? 'Pause' : 'Resume'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeleteClick}
                    className="justify-start text-destructive hover:text-destructive"
                    disabled={isPending}
                  >
                    Delete
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Recurrence description */}
          <RecurrenceDescription
            frequency={item.frequency}
            rruleString={item.rruleString}
          />

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category badge */}
            {CategoryIcon && category && (
              <span
                className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md"
                style={{ backgroundColor: category.color + '20' }}
              >
                <CategoryIcon className="size-3" />
                {category.name}
              </span>
            )}

            {/* Priority badge (only if not medium) */}
            {item.priority && item.priority !== 'medium' && (
              <span className="text-xs">
                <PriorityBadge priority={item.priority} />
              </span>
            )}

            {/* Status badge */}
            <span
              className={cn(
                'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md',
                item.isActive
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
              )}
            >
              {item.isActive ? (
                <>
                  <CheckCircle2 className="size-3" />
                  Active
                </>
              ) : (
                <>
                  <PauseCircle className="size-3" />
                  Paused
                </>
              )}
            </span>
          </div>

          {/* Next occurrence */}
          {nextOccurrence && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="size-4" />
              <span>Next: {formatDisplayDate(nextOccurrence)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete recurring task?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the recurring task and all future uncompleted
              instances. Completed tasks will remain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
