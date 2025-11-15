'use client';

import { TaskList } from '@/src/presentation/components/lists/task-list/TaskList';
import { useTasksByDate } from '@/src/presentation/hooks/tasks/useTasks';
import { CreateTaskDrawer } from '../../../../components/dialog/create-task-drawer/CreateTaskDrawer';

interface TaskListSectionProps {
  date: Date;
}

export const TaskListSection = ({ date }: TaskListSectionProps) => {
  const { data: tasks, isLoading, error } = useTasksByDate(date);

  // Error state
  if (error) {
    return (
      <section className="text-center py-8 text-destructive p-4">
        <p>Failed to load tasks. Please try again.</p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3 p-4">
      <TaskList tasks={tasks} isLoading={isLoading} />
      <div>
        <CreateTaskDrawer variant="ghost" defaultScheduledDate={date} />
      </div>
    </section>
  );
};
