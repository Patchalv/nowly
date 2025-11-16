// src/infrastructure/utils/position.ts
import { LexoRank } from 'lexorank';
import type { ITaskRepository } from '../repositories/task/ITaskRepository';

/**
 * Generate the next lexorank position from an array of existing positions.
 * If no positions exist, returns the minimum lexorank value.
 *
 * @param existingPositions - Array of existing position strings (lexorank values)
 * @returns Next position string to append to the end of the list
 */
export function generateNextPosition(existingPositions: string[]): string {
  if (existingPositions.length === 0) {
    return LexoRank.min().toString();
  }

  // Filter out invalid positions and parse valid ones
  const validRanks = existingPositions.reduce<
    Array<ReturnType<typeof LexoRank.parse>>
  >((acc, position) => {
    try {
      acc.push(LexoRank.parse(position));
    } catch {
      // Ignore invalid entries
    }
    return acc;
  }, []);

  // If no valid positions exist, return minimum
  if (validRanks.length === 0) {
    return LexoRank.min().toString();
  }

  // Sort valid ranks and find maximum
  validRanks.sort((a, b) => a.compareTo(b));

  // Generate next position after the maximum valid rank
  const maxRank = validRanks[validRanks.length - 1];
  if (!maxRank) {
    // This should never happen since we checked length > 0, but TypeScript needs it
    return LexoRank.min().toString();
  }
  return maxRank.genNext().toString();
}

/**
 * Generate a position between two existing positions for drag-and-drop reordering.
 * Handles edge cases like moving to start or end of the list.
 *
 * @param beforePosition - Position string of the task before the target position (empty string for start)
 * @param afterPosition - Position string of the task after the target position (empty string for end)
 * @returns New position string between the two positions
 */
export function generatePositionBetween(
  beforePosition: string,
  afterPosition: string
): string {
  // Moving to the start (before first task)
  if (!beforePosition && afterPosition) {
    try {
      const afterRank = LexoRank.parse(afterPosition);
      const minRank = LexoRank.min();

      // Check if the first task is already at min position
      // Lexorank cannot generate a position before min, so this is a special case
      // The caller will need to handle rebalancing
      if (afterRank.compareTo(minRank) === 0) {
        // Return a special marker that indicates rebalancing is needed
        // The caller should detect this and handle it appropriately
        return 'REBALANCE_NEEDED';
      }

      // Generate a position between min and the first task
      return minRank.between(afterRank).toString();
    } catch {
      // If parsing fails, return minimum
      return LexoRank.min().toString();
    }
  }

  // Moving to the end (after last task)
  if (beforePosition && !afterPosition) {
    try {
      const beforeRank = LexoRank.parse(beforePosition);
      return beforeRank.genNext().toString();
    } catch {
      // If parsing fails, return minimum
      return LexoRank.min().toString();
    }
  }

  // Moving between two tasks
  if (beforePosition && afterPosition) {
    try {
      const beforeRank = LexoRank.parse(beforePosition);
      const afterRank = LexoRank.parse(afterPosition);
      return beforeRank.between(afterRank).toString();
    } catch {
      // If parsing fails, return minimum
      return LexoRank.min().toString();
    }
  }

  // Fallback for edge case where both are empty (shouldn't happen)
  return LexoRank.min().toString();
}

/**
 * Rebalance positions for a list of tasks.
 * Generates evenly-spaced positions for all tasks in their current order.
 * Used when positions become too dense or when inserting before the minimum position.
 *
 * @param taskCount - Number of tasks to generate positions for
 * @returns Array of position strings, evenly spaced from min to max
 */
export function rebalancePositions(taskCount: number): string[] {
  if (taskCount === 0) return [];
  if (taskCount === 1) return [LexoRank.min().toString()];

  const positions: string[] = [];
  let currentRank = LexoRank.min();
  positions.push(currentRank.toString());

  // Generate evenly-spaced positions
  for (let i = 1; i < taskCount; i++) {
    currentRank = currentRank.genNext();
    positions.push(currentRank.toString());
  }

  return positions;
}

/**
 * Generate a position for a new task, scoped per user and date.
 * Fetches existing tasks for the user+date, extracts their positions,
 * and generates the next position to append to the end.
 *
 * @param userId - User ID to scope the position
 * @param date - Scheduled date to scope the position
 * @param repository - Task repository to fetch existing tasks
 * @returns Promise resolving to the generated position string
 */
export async function generatePositionForNewTask(
  userId: string,
  date: Date,
  repository: ITaskRepository
): Promise<string> {
  try {
    // Fetch existing tasks for this user+date (already ordered by position ascending)
    const existingTasks = await repository.findByUserIdAndDate(userId, date);

    // Extract positions from existing tasks
    const existingPositions = existingTasks.map((task) => task.position);

    // Generate next position
    return generateNextPosition(existingPositions);
  } catch {
    // If fetching fails, fall back to minimum position
    // This ensures task creation doesn't fail due to position generation
    return LexoRank.min().toString();
  }
}
