import { Task } from '@/src/domain/model/Task';
import { InfiniteList } from '@/src/presentation/components/lists/InfiniteList';
import { TaskListItemContent } from '@/src/presentation/components/lists/task-list/TaskListItem';
import { TaskFilters } from '@/src/presentation/hooks/tasks/types';
import { useTasks } from '@/src/presentation/hooks/tasks/useTasks';
import { useMemo } from 'react';

interface TaskListSectionProps {
  filters: TaskFilters;
}

export const TaskListSection = ({ filters }: TaskListSectionProps) => {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetching,
    isFetchingNextPage,
  } = useTasks(filters);

  const allTasks = useMemo(() => {
    return data?.pages.flatMap((page) => page?.tasks ?? []) ?? [];
  }, [data]);

  const renderTaskListItem = (task: Task) => {
    return <TaskListItemContent key={task.id} task={task} />;
  };

  return (
    <section className="h-full overflow-y-auto">
      <InfiniteList
        data={allTasks}
        itemKey={(item) => item.id}
        listItemComponent={renderTaskListItem}
        error={error}
        isLoading={isLoading}
        isFetching={isFetching}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
      />
    </section>
  );
};
