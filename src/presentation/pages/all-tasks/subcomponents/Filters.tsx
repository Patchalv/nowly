import { TaskFilters } from '@/src/presentation/hooks/tasks/types';
import { CategoryFilters } from './CategoryFilters';
import { ScheduledSelectFilter } from './ScheduledSelectFilter';
import { ShowCompletedFilters } from './ShowCompletedFilter';
import { TaskSearch } from './TaskSearch';

interface FiltersProps {
  filters: TaskFilters;
  handleFiltersChange: (filters: TaskFilters) => void;
}

export const Filters = ({ filters, handleFiltersChange }: FiltersProps) => {
  return (
    <div className="flex flex-col gap-4 justify-center items-center">
      <TaskSearch filters={filters} handleFiltersChange={handleFiltersChange} />

      <div className="w-full flex gap-4 justify-center items-center">
        <ShowCompletedFilters
          filters={filters}
          handleFiltersChange={handleFiltersChange}
        />
        <ScheduledSelectFilter
          filters={filters}
          handleFiltersChange={handleFiltersChange}
        />
      </div>
      <CategoryFilters
        selectedCategoryId={filters.categoryId}
        onCategorySelect={(categoryId) =>
          handleFiltersChange({ ...filters, categoryId })
        }
      />
    </div>
  );
};
