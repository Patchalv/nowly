import { MutateCategoryResponse } from '@/src/application/categories/types';

/**
 * Input type for create category mutation
 */
export type CreateCategoryMutationInput = FormData;

/**
 * Input type for update category mutation
 */
export interface UpdateCategoryMutationInput {
  categoryId: string;
  updates: {
    name?: string;
    color?: string;
    icon?: string;
  };
}

/**
 * Input type for delete category mutation
 */
export type DeleteCategoryMutationInput = string;

/**
 * Server action response type for create category
 * Extends the use case response to include validation errors
 */
export interface CreateCategoryActionResponse extends MutateCategoryResponse {
  errors?: Record<string, string[]>;
}

/**
 * Server action response type for update category
 * Extends the use case response to include validation errors
 */
export interface UpdateCategoryActionResponse extends MutateCategoryResponse {
  errors?: Record<string, string[]>;
}

/**
 * Server action response type for delete category
 * Extends the use case response to include validation errors
 */
export interface DeleteCategoryActionResponse extends MutateCategoryResponse {
  errors?: Record<string, string[]>;
}
