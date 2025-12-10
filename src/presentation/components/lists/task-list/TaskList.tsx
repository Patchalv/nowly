'use client';

import type { Category } from '@/src/domain/model/Category';
import { Task } from '@/src/domain/model/Task';
import {
  generatePositionBetween,
  rebalancePositions,
} from '@/src/infrastructure/utils/position';
import { ItemGroup } from '@/src/presentation/components/ui/item';
import { Skeleton } from '@/src/presentation/components/ui/skeleton';
import { useCategories } from '@/src/presentation/hooks/categories/useCategories';
import { useRebalanceTasks } from '@/src/presentation/hooks/tasks/useRebalanceTasks';
import { useReorderTask } from '@/src/presentation/hooks/tasks/useTasks';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useMemo, useState } from 'react';
import { TaskListEmpty } from './TaskListEmpty';
import { SortableTaskListItem, TaskListItemContent } from './TaskListItem';

interface TaskListProps {
  tasks: Task[];
  isLoading?: boolean;
  showCategoryBackground?: boolean;
}

export const TaskList = ({
  tasks,
  isLoading,
  showCategoryBackground = false,
}: TaskListProps) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const reorderTask = useReorderTask();
  const rebalanceTasks = useRebalanceTasks();
  const { data: categories } = useCategories();

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories?.forEach((cat) => map.set(cat.id, cat));
    return map;
  }, [categories]);

  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before dragging starts
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || active.id === over.id) {
      return;
    }

    // Sort tasks by position before calculating new position
    const sortedTasks = [...tasks].sort((a, b) =>
      a.position.localeCompare(b.position)
    );

    const oldIndex = sortedTasks.findIndex((t) => t.id === active.id);
    const newIndex = sortedTasks.findIndex((t) => t.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Calculate new position based on neighbors
    let newPosition: string;

    // When moving up (to a lower index), we want to place BEFORE the target
    // When moving down (to a higher index), we want to place AFTER the target
    if (oldIndex < newIndex) {
      // Moving down - place AFTER the target item
      if (newIndex === sortedTasks.length - 1) {
        // Moving to the very end
        newPosition = generatePositionBetween(
          sortedTasks[sortedTasks.length - 1].position,
          ''
        );
      } else {
        // Moving between target and the item after it
        newPosition = generatePositionBetween(
          sortedTasks[newIndex].position,
          sortedTasks[newIndex + 1].position
        );
      }
    } else {
      // Moving up - place BEFORE the target item
      if (newIndex === 0) {
        // Moving to the very top
        newPosition = generatePositionBetween('', sortedTasks[0].position);
      } else {
        // Moving between the item before target and the target
        newPosition = generatePositionBetween(
          sortedTasks[newIndex - 1].position,
          sortedTasks[newIndex].position
        );
      }
    }

    // Check if rebalancing is needed (when first task is at min)
    if (newPosition === 'REBALANCE_NEEDED') {
      // Create the new order by moving the task to its new position
      const reorderedTasks = [...sortedTasks];
      const [movedTask] = reorderedTasks.splice(oldIndex, 1);
      reorderedTasks.splice(newIndex, 0, movedTask);

      // Generate new positions for all tasks
      const newPositions = rebalancePositions(reorderedTasks.length);

      // Prepare updates for all tasks
      const updates = reorderedTasks.map((task, index) => ({
        taskId: task.id,
        newPosition: newPositions[index],
      }));

      // Execute batch update with optimistic updates
      rebalanceTasks.mutate({ updates });

      return; // Don't proceed with single-task update
    }

    // Execute single-task reorder mutation
    reorderTask.mutate({
      taskId: active.id as string,
      newPosition,
    });
  };

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
