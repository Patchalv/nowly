'use client';

import { useTasksByDate } from '@/src/presentation/hooks/tasks/useTasks';
import { CreateTaskDrawer } from '../../dialog/create-task-drawer/CreateTaskDrawer';
import { ItemGroup } from '../../ui/item';
import { Skeleton } from '../../ui/skeleton';
import { TaskListEmpty } from './TaskListEmpty';
import { TaskListItem } from './TaskListItem';

interface TaskListProps {
  date: Date;
}

export const TaskList = ({ date }: TaskListProps) => {
  const { data: tasks, isLoading, error } = useTasksByDate(date);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        <p>Failed to load tasks. Please try again.</p>
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return <TaskListEmpty currentDate={date} />;
  }

  return (
    <div className="flex flex-col gap-3">
      <ItemGroup className="flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-10rem)]">
        {tasks.map((task) => (
          <TaskListItem key={task.id} task={task} />
        ))}
      </ItemGroup>
      <div>
        <CreateTaskDrawer variant="ghost" defaultScheduledDate={date} />
      </div>
    </div>
  );
};
