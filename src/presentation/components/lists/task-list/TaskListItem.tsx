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
import { UpdateDatePickerButton } from '../../date-picker/UpdateDatePickerButton';
import { TaskCheckbox } from './TaskCheckbox';
import { TaskListItemDrawer } from './TaskListItemDrawer';

interface TaskListItemProps {
  task: Task;
}

export const TaskListItem = ({ task }: TaskListItemProps) => {
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
    <Item
      variant="outline"
      className={cn(
        'w-full hover:bg-accent/50 transition-colors duration-100',
        isDragging && 'opacity-50 cursor-grabbing'
      )}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
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
};
