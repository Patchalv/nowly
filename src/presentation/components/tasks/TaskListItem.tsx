import { ExampleTask } from '../../pages/daily/DailyView';
import { Checkbox } from '../ui/checkbox';
import { Item, ItemActions, ItemContent, ItemTitle } from '../ui/item';

interface TaskListItemProps {
  task: ExampleTask;
}

export const TaskListItem = ({ task }: TaskListItemProps) => {
  return (
    <Item variant="outline" className="w-full">
      <ItemContent className="flex flex-row gap-4 items-center">
        <ItemActions>
          <Checkbox />
        </ItemActions>
        <ItemTitle>{task.title}</ItemTitle>
      </ItemContent>
    </Item>
  );
};
