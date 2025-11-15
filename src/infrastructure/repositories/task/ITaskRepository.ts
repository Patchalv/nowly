import { Task } from '@/src/domain/model/Task';

export interface ITaskRepository {
  /**
   * Create a new task
   */
  create(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task>;

  /**
   * Find a task by ID
   */
  findById(id: string): Promise<Task | null>;

  /**
   * Find all tasks for a user on a specific date
   */
  findByUserIdAndDate(userId: string, date: Date): Promise<Task[]>;

  /**
   * Find all tasks for a user for a specific date range
   */
  findByUserIdAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Task[]>;

  /**
   * Update a task
   */
  update(id: string, updates: Partial<Task>): Promise<Task>;

  /**
   * Delete a task
   */
  delete(id: string): Promise<void>;
}
