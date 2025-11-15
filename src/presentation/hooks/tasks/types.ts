import { MutateTaskResponse } from '@/src/application/tasks/types';

/**
 * Input type for create task mutation
 */
export type CreateTaskMutationInput = FormData;

/**
 * Input type for update task mutation
 */
export interface UpdateTaskMutationInput {
  taskId: string;
  updates: {
    completed?: boolean;
    title?: string;
    scheduledDate?: Date | null;
  };
}

/**
 * Input type for delete task mutation
 */
export type DeleteTaskMutationInput = string;

/**
 * Server action response type for create task
 * Extends the use case response to include validation errors
 */
export interface CreateTaskActionResponse extends MutateTaskResponse {
  errors?: Record<string, string[]>;
}

/**
 * Server action response type for update task
 * Extends the use case response to include validation errors
 */
export interface UpdateTaskActionResponse extends MutateTaskResponse {
  errors?: Record<string, string[]>;
}

/**
 * Server action response type for delete task
 * Extends the use case response to include validation errors
 */
export interface DeleteTaskActionResponse extends MutateTaskResponse {
  errors?: Record<string, string[]>;
}

export interface TaskFilters {
  categoryId?: string | null;
  showCompleted: 'IsCompleted' | 'IsNotCompleted' | 'All';
  showScheduled: 'IsScheduled' | 'IsNotScheduled' | 'All';
  search?: string;
}
