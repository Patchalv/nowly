import { ExampleTask } from '../../pages/daily/DailyView';
import { ItemGroup } from '../ui/item';
import { TaskListEmpty } from './TaskListEmpty';
import { TaskListItem } from './TaskListItem';

interface TaskListProps {
  tasks: ExampleTask[];
}

export const TaskList = ({ tasks }: TaskListProps) => {
  if (tasks.length === 0) {
    return <TaskListEmpty />;
  }

  return (
    <ItemGroup className="flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-10rem)]">
      {tasks.map((task) => (
        <TaskListItem key={task.id} task={task} />
      ))}
    </ItemGroup>
  );
};
