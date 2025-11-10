import type { CreateTaskResponse } from '@/src/application/tasks/createTask.usecase';
import type { DeleteTaskResponse } from '@/src/application/tasks/deleteTask.usecase';
import type { UpdateTaskResponse } from '@/src/application/tasks/updateTask.usecase';

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
export interface CreateTaskActionResponse extends CreateTaskResponse {
  errors?: Record<string, string[]>;
}

/**
 * Server action response type for update task
 * Extends the use case response to include validation errors
 */
export interface UpdateTaskActionResponse extends UpdateTaskResponse {
  errors?: Record<string, string[]>;
}

/**
 * Server action response type for delete task
 * Extends the use case response to include validation errors
 */
export interface DeleteTaskActionResponse extends DeleteTaskResponse {
  errors?: Record<string, string[]>;
}
