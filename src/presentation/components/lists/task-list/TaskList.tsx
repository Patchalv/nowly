import { Task } from '@/src/domain/model/Task';
import { ItemGroup } from '@/src/presentation/components/ui/item';
import { Skeleton } from '@/src/presentation/components/ui/skeleton';
import { TaskListEmpty } from './TaskListEmpty';
import { TaskListItem } from './TaskListItem';

interface TaskListProps {
  tasks: Task[];
  isLoading?: boolean;
}

export const TaskList = ({ tasks, isLoading }: TaskListProps) => {
  if (isLoading) {
    return (
      <section className="space-y-2 p-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </section>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <section className="p-4">
        <TaskListEmpty />
      </section>
    );
  }

  return (
    <ItemGroup className="flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-10rem)]">
      {tasks.map((task) => (
        <TaskListItem key={task.id} task={task} />
      ))}
    </ItemGroup>
  );
};
