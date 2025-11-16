import { TaskFilters } from '@/src/presentation/hooks/tasks/types';
import { CategoryFilters } from './CategoryFilters';
import { ShowCompletedFilters } from './ShowCompletedFilter';
import { ShowUnscheduledFilters } from './ShowUnscheduledFilter';

interface FiltersProps {
  filters: TaskFilters;
  setFilters: (filters: TaskFilters) => void;
}

export const Filters = ({ filters, setFilters }: FiltersProps) => {
  return (
    <div className="flex gap-4 justify-center items-center">
      <ShowCompletedFilters filters={filters} setFilters={setFilters} />
      <ShowUnscheduledFilters filters={filters} setFilters={setFilters} />
      <CategoryFilters
        selectedCategoryId={filters.categoryId}
        onCategorySelect={(categoryId) =>
          setFilters({ ...filters, categoryId })
        }
      />
    </div>
  );
};
