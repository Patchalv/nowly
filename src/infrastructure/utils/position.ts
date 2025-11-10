// src/infrastructure/utils/position.ts
import { LexoRank } from 'lexorank';
import type { ITaskRepository } from '../repositories/ITaskRepository';

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

  // Find the maximum position (last item when sorted)
  const sortedPositions = [...existingPositions].sort((a, b) => {
    try {
      const rankA = LexoRank.parse(a);
      const rankB = LexoRank.parse(b);
      return rankA.compareTo(rankB);
    } catch {
      // If parsing fails, fall back to string comparison
      return a.localeCompare(b);
    }
  });

  const lastPosition = sortedPositions[sortedPositions.length - 1];

  try {
    const lastRank = LexoRank.parse(lastPosition);
    return lastRank.genNext().toString();
  } catch {
    // If parsing fails, generate a new position from min
    // This handles edge cases where position might be corrupted
    return LexoRank.min().genNext().toString();
  }
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
