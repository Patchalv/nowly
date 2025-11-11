import type { Task } from '@/src/domain/model/Task';
import { Checkbox } from '../../ui/checkbox';
import { Item, ItemActions, ItemContent, ItemTitle } from '../../ui/item';

interface TaskListItemProps {
  task: Task;
}

export const TaskListItem = ({ task }: TaskListItemProps) => {
  return (
    <Item variant="outline" className="w-full">
      <ItemContent className="flex flex-row gap-4 items-center">
        <ItemActions>
          <Checkbox checked={task.completed} onCheckedChange={() => {}} />
        </ItemActions>
        <ItemTitle>{task.title}</ItemTitle>
      </ItemContent>
    </Item>
  );
};
