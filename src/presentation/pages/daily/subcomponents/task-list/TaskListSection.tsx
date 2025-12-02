'use client';

import { CreateTaskDrawer } from '@/src/presentation/components/dialog/create-task-drawer/CreateTaskDrawer';
import { TaskList } from '@/src/presentation/components/lists/task-list/TaskList';
import { OverdueTasksBanner } from '@/src/presentation/components/overdue/OverdueTasksBanner';
import { useTasksByDate } from '@/src/presentation/hooks/tasks/useTasks';
import { isSameDay } from 'date-fns';

interface TaskListSectionProps {
  date: Date;
}

export const TaskListSection = ({ date }: TaskListSectionProps) => {
  const { data: tasks, isLoading, error } = useTasksByDate(date);
  const isToday = isSameDay(date, new Date());

  // Error state
  if (error) {
    return (
      <section className="text-center py-8 text-destructive p-4">
        <p>Failed to load tasks. Please try again.</p>
      </section>
    );
  }

  return (
    <section className="h-full flex flex-col gap-3 p-4 overflow-y-auto">
      {/* Overdue banner - only shows when viewing today with overdue tasks */}
      <OverdueTasksBanner isToday={isToday} />

      <TaskList tasks={tasks} isLoading={isLoading} />
      <div>
        <CreateTaskDrawer variant="ghost" defaultScheduledDate={date} />
      </div>
    </section>
  );
};
