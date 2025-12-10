'use client';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Repeat } from 'lucide-react';
import { forwardRef, useState } from 'react';

import type { Category } from '@/src/domain/model/Category';
import type { Task } from '@/src/domain/model/Task';
import { PriorityBadge } from '@/src/presentation/components/badge/PriorityBadge';
import { UpdateDatePickerButton } from '@/src/presentation/components/date-picker/UpdateDatePickerButton';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@/src/presentation/components/ui/item';
import { cn } from '@/src/shared/utils/cn';
import { TaskCheckbox } from './TaskCheckbox';
import { TaskListItemDrawer } from './TaskListItemDrawer';

interface TaskListItemContentProps extends React.ComponentPropsWithoutRef<'div'> {
  task: Task;
  category?: Category | null;
  showCategoryBackground?: boolean;
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
>(
  (
    {
      task,
      category,
      showCategoryBackground = false,
      className,
      style,
      ...props
    },
    ref
  ) => {
    // Generate category styling: left border accent + subtle background
    const getCategoryStyles = () => {
      if (!showCategoryBackground || !category) {
        return undefined;
      }

      const hex = category.color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);

      // Adjust opacity based on completion state
      const bgOpacity = task.completed ? 0.04 : 0.08;
      const hoverBgOpacity = task.completed ? 0.06 : 0.12;
      const borderOpacity = task.completed ? 0.5 : 1;

      return {
        background: `rgba(${r}, ${g}, ${b}, ${bgOpacity})`,
        hoverBackground: `rgba(${r}, ${g}, ${b}, ${hoverBgOpacity})`,
        borderColor: `rgba(${r}, ${g}, ${b}, ${borderOpacity})`,
      };
    };

    const categoryStyles = getCategoryStyles();
    const hasCategory = showCategoryBackground && category;
    const [isHovered, setIsHovered] = useState(false);

    return (
      <Item
        variant={hasCategory ? 'default' : 'outline'}
        className={cn(
          'w-full transition-all duration-200',
          hasCategory && 'border-l-4',
          !hasCategory && 'hover:bg-accent/50',
          className
        )}
        style={{
          backgroundColor: hasCategory
            ? isHovered
              ? categoryStyles?.hoverBackground
              : categoryStyles?.background
            : undefined,
          borderLeftColor: categoryStyles?.borderColor,
          ...style, // Merge in any additional styles (e.g., drag transform)
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        ref={ref}
        {...props}
      >
        <ItemContent className="flex flex-row gap-4 items-center justify-between">
          <div className="flex flex-row gap-4 items-center">
            <ItemActions>
              <TaskCheckbox task={task} />
            </ItemActions>
            <div className="flex flex-col gap-1">
              <ItemTitle
                className={cn(
                  'font-semibold',
                  task.completed && 'line-through text-muted-foreground'
                )}
              >
                {task.title}
              </ItemTitle>
              <ItemDescription>
                <div className="flex items-center gap-2">
                  {category && (
                    <span className="text-xs text-muted-foreground">
                      # {category.name}
                    </span>
                  )}
                  {task.priority && <PriorityBadge priority={task.priority} />}
                  {task.recurringItemId && (
                    <Repeat className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
              </ItemDescription>
            </div>
          </div>
          <ItemActions>
            <UpdateDatePickerButton task={task} />
            <TaskListItemDrawer task={task} />
          </ItemActions>
        </ItemContent>
      </Item>
    );
  }
);

TaskListItemContent.displayName = 'TaskListItemContent';

interface SortableTaskListItemProps {
  task: Task;
  category?: Category | null;
  showCategoryBackground?: boolean;
}

/**
 * Sortable wrapper component that uses useSortable hook and renders TaskListItemContent.
 * Use this in sortable lists (e.g., within SortableContext).
 */
export const SortableTaskListItem = ({
  task,
  category,
  showCategoryBackground,
}: SortableTaskListItemProps) => {
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
      category={category}
      showCategoryBackground={showCategoryBackground}
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
