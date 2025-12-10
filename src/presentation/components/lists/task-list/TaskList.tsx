'use client';

import type { Category } from '@/src/domain/model/Category';
import type { Task } from '@/src/domain/model/Task';
import { ItemGroup } from '@/src/presentation/components/ui/item';
import { Skeleton } from '@/src/presentation/components/ui/skeleton';
import { useCategories } from '@/src/presentation/hooks/categories/useCategories';
import { useTaskDragAndDrop } from '@/src/presentation/hooks/tasks/useTaskDragAndDrop';
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useMemo } from 'react';
import { TaskListEmpty } from './TaskListEmpty';
import { SortableTaskListItem, TaskListItemContent } from './TaskListItem';

interface TaskListProps {
  tasks: Task[];
  isLoading?: boolean;
  showCategoryBackground?: boolean;
  currentDate?: Date;
}

export const TaskList = ({
  tasks,
  isLoading,
  showCategoryBackground = false,
  currentDate,
}: TaskListProps) => {
  const { sensors, handleDragStart, handleDragEnd, activeTask } =
    useTaskDragAndDrop(tasks);
  const { data: categories } = useCategories();

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories?.forEach((cat) => map.set(cat.id, cat));
    return map;
  }, [categories]);

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
      <section className="py-4">
        <TaskListEmpty currentDate={currentDate} />
      </section>
    );
  }

  // Sort tasks by position for consistent rendering
  const sortedTasks = [...tasks].sort((a, b) =>
    a.position.localeCompare(b.position)
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sortedTasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <ItemGroup className="flex flex-col gap-3 overflow-y-auto">
          {sortedTasks.map((task) => {
            const category = task.categoryId
              ? (categoryMap.get(task.categoryId) ?? null)
              : null;
            return (
              <SortableTaskListItem
                key={task.id}
                task={task}
                category={category}
                showCategoryBackground={showCategoryBackground}
              />
            );
          })}
        </ItemGroup>
      </SortableContext>

      <DragOverlay>
        {activeTask ? (
          <div className="opacity-80">
            <TaskListItemContent
              task={activeTask}
              category={
                activeTask.categoryId
                  ? (categoryMap.get(activeTask.categoryId) ?? null)
                  : null
              }
              showCategoryBackground={showCategoryBackground}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
