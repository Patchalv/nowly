'use client';

import { isSameDay } from 'date-fns';
import { useMemo } from 'react';

import { CreateTaskDrawer } from '@/src/presentation/components/dialog/create-task-drawer/CreateTaskDrawer';
import { TaskList } from '@/src/presentation/components/lists/task-list/TaskList';
import { TaskListItemContent } from '@/src/presentation/components/lists/task-list/TaskListItem';
import { OverdueTasksBanner } from '@/src/presentation/components/overdue/OverdueTasksBanner';
import { ItemGroup } from '@/src/presentation/components/ui/item';
import { useTasksByDate } from '@/src/presentation/hooks/tasks/useTasks';
import { useLocalStorage } from '@/src/presentation/hooks/useLocalStorage';
import { TaskListHeading } from '@/src/presentation/pages/daily/subcomponents/task-list/TaskListHeading';


interface TaskListSectionProps {
  date: Date;
}

export const TaskListSection = ({ date }: TaskListSectionProps) => {
  const [showCompleted, setShowCompleted] = useLocalStorage(
    'daily-show-completed',
    false
  );
  const { data: tasks, isLoading, error } = useTasksByDate(date);
  const isToday = isSameDay(date, new Date());

  // Filter tasks into active and completed
  const { activeTasks, completedTasks } = useMemo(() => {
    if (!tasks) return { activeTasks: [], completedTasks: [] };

    const active = tasks.filter((task) => !task.completed);
    const completed = tasks.filter((task) => task.completed);
    const completedSorted = completed.sort((a, b) =>
      a.position.localeCompare(b.position)
    );

    return { activeTasks: active, completedTasks: completedSorted };
  }, [tasks]);

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
      <TaskListHeading
        title="Tasks"
        showCompleted={showCompleted}
        setShowCompleted={setShowCompleted}
      />
      {/* Overdue banner - only shows when viewing today with overdue tasks */}
      <OverdueTasksBanner isToday={isToday} />

      {/* Active tasks - always shown with drag-and-drop */}
      <TaskList tasks={activeTasks} isLoading={isLoading} showCategoryBackground />

      {/* Completed tasks - static list (no drag-and-drop), only shown when showCompleted is true */}
      {showCompleted && completedTasks.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            Completed ({completedTasks.length})
          </h2>
          <ItemGroup className="flex flex-col gap-3">
            {completedTasks.map((task) => (
              <TaskListItemContent key={task.id} task={task} />
            ))}
          </ItemGroup>
        </div>
      )}

      <div>
        <CreateTaskDrawer variant="ghost" defaultScheduledDate={date} />
      </div>
    </section>
  );
};
