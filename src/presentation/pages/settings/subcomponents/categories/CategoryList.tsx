'use client';

import { useCategories } from '@/src/presentation/hooks/categories/useCategories';
import { ItemGroup } from '../../../../components/ui/item';
import { Skeleton } from '../../../../components/ui/skeleton';
import { CategoryListItem } from './CategoryListItem';

export const CategoryList = () => {
  const { data: categories, isLoading, error } = useCategories();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        <p>Failed to load tasks. Please try again.</p>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <ItemGroup className="flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-10rem)]">
        {categories.map((category) => (
          <CategoryListItem key={category.id} category={category} />
        ))}
      </ItemGroup>
    </div>
  );
};
