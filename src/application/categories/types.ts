import { Category } from '@/src/domain/model/Category';

export interface GetCategoriesResponse {
  success: boolean;
  categories?: Category[];
  error?: string;
}

export interface MutateCategoryResponse {
  success: boolean;
  category?: Category;
  error?: string;
}
