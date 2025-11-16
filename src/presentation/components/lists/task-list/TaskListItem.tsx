'use client';

import type { Task } from '@/src/domain/model/Task';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
} from '@/src/presentation/components/ui/item';
import { cn } from '@/src/shared/utils/cn';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { forwardRef } from 'react';
import { UpdateDatePickerButton } from '../../date-picker/UpdateDatePickerButton';
import { TaskCheckbox } from './TaskCheckbox';
import { TaskListItemDrawer } from './TaskListItemDrawer';

interface TaskListItemContentProps
  extends React.ComponentPropsWithoutRef<'div'> {
  task: Task;
  className?: string;
}

/**
 * Pure presentational component for rendering a task list item.
 * Does not use any drag-and-drop hooks, making it safe for use in DragOverlay.
 * Accepts ref and drag handler props for use in sortable contexts.
 */
export const TaskListItemContent = forwardRef<
  HTMLDivElement,
  TaskListItemContentProps
>(({ task, className, ...props }, ref) => {
  return (
    <Item
      variant="outline"
      className={cn(
        'w-full hover:bg-accent/50 transition-colors duration-100',
        className
      )}
      ref={ref}
      {...props}
    >
      <ItemContent className="flex flex-row gap-4 items-center justify-between">
        <div className="flex flex-row gap-4 items-center">
          <ItemActions>
            <TaskCheckbox task={task} />
          </ItemActions>
          <ItemTitle
            className={cn(
              task.completed && 'line-through text-muted-foreground'
            )}
          >
            {task.title}
          </ItemTitle>
        </div>
        <ItemActions>
          <UpdateDatePickerButton task={task} />
          <TaskListItemDrawer task={task} />
        </ItemActions>
      </ItemContent>
    </Item>
  );
});

TaskListItemContent.displayName = 'TaskListItemContent';

interface SortableTaskListItemProps {
  task: Task;
}

/**
 * Sortable wrapper component that uses useSortable hook and renders TaskListItemContent.
 * Use this in sortable lists (e.g., within SortableContext).
 */
export const SortableTaskListItem = ({ task }: SortableTaskListItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TaskListItemContent
      task={task}
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && 'opacity-50 cursor-grabbing')}
      {...attributes}
      {...listeners}
    />
  );
};

/**
 * @deprecated Use SortableTaskListItem for sortable lists or TaskListItemContent for non-sortable contexts.
 * Kept for backward compatibility.
 */
export const TaskListItem = SortableTaskListItem;
