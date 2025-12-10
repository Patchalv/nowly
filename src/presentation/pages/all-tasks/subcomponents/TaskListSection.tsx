import { Category } from '@/src/domain/model/Category';
import { Task } from '@/src/domain/model/Task';
import { InfiniteList } from '@/src/presentation/components/lists/InfiniteList';
import { TaskListItemContent } from '@/src/presentation/components/lists/task-list/TaskListItem';
import { useCategories } from '@/src/presentation/hooks/categories/useCategories';
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

  const { data: categories } = useCategories();

  const allTasks = useMemo(() => {
    return data?.pages.flatMap((page) => page?.tasks ?? []) ?? [];
  }, [data]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories?.forEach((cat) => map.set(cat.id, cat));
    return map;
  }, [categories]);

  const renderTaskListItem = (task: Task) => {
    const category = task.categoryId ? categoryMap.get(task.categoryId) : null;
    return (
      <TaskListItemContent
        key={task.id}
        task={task}
        category={category}
        showCategoryBackground
      />
    );
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
