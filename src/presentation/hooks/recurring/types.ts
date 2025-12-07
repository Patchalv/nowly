import type { MutateRecurringTaskItemResponse } from '@/src/application/recurring/types';
import type { UpdateRecurringTaskItemInput } from '@/src/domain/validation/recurring/recurringTaskItem.schema';

/**
 * Input type for create recurring item mutation
 */
export type CreateRecurringItemMutationInput = FormData;

/**
 * Input type for update recurring item mutation
 */
export interface UpdateRecurringItemMutationInput {
  recurringItemId: string;
  updates: UpdateRecurringTaskItemInput;
}

/**
 * Input type for delete recurring item mutation
 */
export interface DeleteRecurringItemMutationInput {
  recurringItemId: string;
}

/**
 * Input type for toggle recurring item active mutation
 */
export interface ToggleRecurringItemActiveMutationInput {
  recurringItemId: string;
  isActive: boolean;
}

/**
 * Server action response type for create recurring item
 * Extends the use case response to include validation errors
 */
export interface CreateRecurringItemActionResponse extends MutateRecurringTaskItemResponse {
  errors?: Record<string, string[]>;
}

/**
 * Server action response type for update recurring item
 * Extends the use case response to include validation errors
 */
export interface UpdateRecurringItemActionResponse extends MutateRecurringTaskItemResponse {
  errors?: Record<string, string[]>;
}

/**
 * Server action response type for delete recurring item
 */
export interface DeleteRecurringItemActionResponse {
  success: boolean;
  error?: string;
}

/**
 * Server action response type for toggle recurring item active
 * Extends the use case response to include validation errors
 */
export interface ToggleRecurringItemActiveActionResponse extends MutateRecurringTaskItemResponse {
  errors?: Record<string, string[]>;
}
