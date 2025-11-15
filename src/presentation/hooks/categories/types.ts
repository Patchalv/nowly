import { MutateCategoryResponse } from '@/src/application/categories/types';

/**
 * Input type for create task mutation
 */
export type CreateCategoryMutationInput = FormData;

/**
 * Input type for update task mutation
 */
export interface UpdateCategoryMutationInput {
  categoryId: string;
  updates: {
    name?: string;
    color?: string;
    emoji?: string;
  };
}

/**
 * Input type for delete task mutation
 */
export type DeleteCategoryMutationInput = string;

/**
 * Server action response type for create task
 * Extends the use case response to include validation errors
 */
export interface CreateCategoryActionResponse extends MutateCategoryResponse {
  errors?: Record<string, string[]>;
}

/**
 * Server action response type for update task
 * Extends the use case response to include validation errors
 */
export interface UpdateCategoryActionResponse extends MutateCategoryResponse {
  errors?: Record<string, string[]>;
}

/**
 * Server action response type for delete task
 * Extends the use case response to include validation errors
 */
export interface DeleteCategoryActionResponse extends MutateCategoryResponse {
  errors?: Record<string, string[]>;
}
