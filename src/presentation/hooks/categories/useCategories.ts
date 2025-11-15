import { createCategoryAction } from '@/app/actions/categories/createCategoryAction';
import { deleteCategoryAction } from '@/app/actions/categories/deleteCategoryAction';
import { getCategoriesAction } from '@/app/actions/categories/getCategoriesAction';
import { updateCategoryAction } from '@/app/actions/categories/updateCategoryAction';
import { CACHE } from '@/src/config/constants';
import { queryKeys } from '@/src/config/query-keys';
import { handleError } from '@/src/shared/errors';
import {
  useMutation,
  UseMutationResult,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { handleActionResponse, ServerActionError } from '../tasks/utils';
import {
  CreateCategoryActionResponse,
  CreateCategoryMutationInput,
  DeleteCategoryActionResponse,
  DeleteCategoryMutationInput,
  UpdateCategoryActionResponse,
  UpdateCategoryMutationInput,
} from './types';

/**
 * Fetch the categories for the current user
 */
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: async () => {
      const response = await getCategoriesAction();
      if (!response.success) {
        handleError.throw(response.error);
      }
      return response.categories;
    },
    staleTime: CACHE.CATEGORIES_STALE_TIME_MS,
  });
}

export function useCreateCategory(): UseMutationResult<
  CreateCategoryActionResponse,
  ServerActionError,
  CreateCategoryMutationInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await createCategoryAction(formData);
      return handleActionResponse<CreateCategoryActionResponse>(response);
    },
    onError: (error) => {
      handleError.toast(error, 'Failed to create category');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

export function useUpdateCategory(): UseMutationResult<
  UpdateCategoryActionResponse,
  ServerActionError,
  UpdateCategoryMutationInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      categoryId,
      updates,
    }: UpdateCategoryMutationInput) => {
      const response = await updateCategoryAction(categoryId, updates);
      return handleActionResponse<UpdateCategoryActionResponse>(response);
    },
    onError: (error) => {
      handleError.toast(error, 'Failed to update category');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

export function useDeleteCategory(): UseMutationResult<
  DeleteCategoryActionResponse,
  ServerActionError,
  DeleteCategoryMutationInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryId: string) => {
      const response = await deleteCategoryAction(categoryId);
      return handleActionResponse<DeleteCategoryActionResponse>(response);
    },
    onError: (error) => {
      handleError.toast(error, 'Failed to delete category');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
}
