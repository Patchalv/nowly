import type { Task } from '@/src/domain/model/Task';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
} from '@/src/presentation/components/ui/item';
import { cn } from '@/src/shared/utils/cn';
import { Ref } from 'react';
import { UpdateDatePickerButton } from '../../date-picker/UpdateDatePickerButton';
import { TaskCheckbox } from './TaskCheckbox';
import { TaskListItemDrawer } from './TaskListItemDrawer';

interface TaskListItemProps {
  task: Task;
  ref?: Ref<HTMLDivElement>;
}

export const TaskListItem = ({ task, ref }: TaskListItemProps) => {
  return (
    <Item variant="outline" className="w-full hover:bg-accent/50" ref={ref}>
      <ItemContent className="flex flex-row gap-4 items-center justify-between transition-colors duration-100">
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
