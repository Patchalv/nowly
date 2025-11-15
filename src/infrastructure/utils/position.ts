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
