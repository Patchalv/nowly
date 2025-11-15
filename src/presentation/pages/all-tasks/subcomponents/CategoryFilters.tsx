import { Button } from '../../../components/ui/button';
import { Skeleton } from '../../../components/ui/skeleton';
import { useCategories } from '../../../hooks/categories/useCategories';

interface CategoryFiltersProps {
  selectedCategoryId?: string | null;
  onCategorySelect: (categoryId: string | null) => void;
}

export const CategoryFilters = ({
  selectedCategoryId = null,
  onCategorySelect,
}: CategoryFiltersProps) => {
  const { data: categories, isLoading, error } = useCategories();

  if (isLoading) {
    return (
      <div className="flex gap-4 justify-center">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-20" />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        <p>Failed to load categories. Please try again.</p>
      </div>
    );
  }

  return (
    <section className="flex gap-4 justify-center">
      <Button
        variant={selectedCategoryId === null ? 'default' : 'outline'}
        onClick={() => onCategorySelect(null)}
      >
        All
      </Button>
      {categories &&
        categories.length > 0 &&
        categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategoryId === category.id ? 'default' : 'outline'}
            onClick={() => onCategorySelect(category.id)}
          >
            {category.name}
          </Button>
        ))}
    </section>
  );
};
