import type { Task } from '@/src/domain/model/Task';
import { cn } from '@/src/shared/utils/cn';
import { UpdateDatePickerButton } from '../../date-picker/UpdateDatePickerButton';
import { Item, ItemActions, ItemContent, ItemTitle } from '../../ui/item';
import { TaskCheckbox } from './TaskCheckbox';
import { TaskListItemDrawer } from './TaskListItemDrawer';

interface TaskListItemProps {
  task: Task;
}

export const TaskListItem = ({ task }: TaskListItemProps) => {
  return (
    <Item variant="outline" className="w-full hover:bg-accent/50">
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
