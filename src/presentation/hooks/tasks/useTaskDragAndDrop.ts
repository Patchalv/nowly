'use client';

import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useState } from 'react';

import type { Task } from '@/src/domain/model/Task';
import {
  generatePositionBetween,
  rebalancePositions,
} from '@/src/infrastructure/utils/position';
import { useRebalanceTasks } from '@/src/presentation/hooks/tasks/useRebalanceTasks';
import { useReorderTask } from '@/src/presentation/hooks/tasks/useTasks';

/**
 * Hook for managing drag-and-drop functionality for tasks.
 * Handles drag start/end events, position calculation, and rebalancing.
 *
 * @param tasks - Array of tasks to enable drag-and-drop for
 * @returns Object containing sensors, event handlers, and active task state
 */
export function useTaskDragAndDrop(tasks: Task[]) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const reorderTask = useReorderTask();
  const rebalanceTasks = useRebalanceTasks();

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

  return {
    sensors,
    handleDragStart,
    handleDragEnd,
    activeTask,
  };
}
