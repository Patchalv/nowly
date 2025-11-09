import { Task } from '@/src/domain/model/Task';

// src/infrastructure/repositories/ITaskRepository.ts
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
   * Update a task
   */
  update(id: string, updates: Partial<Task>): Promise<Task>;

  /**
   * Delete a task
   */
  delete(id: string): Promise<void>;
}
