import { Checkbox } from '@/src/presentation/components/ui/checkbox';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
} from '@/src/presentation/components/ui/item';
import { TaskFilters } from '@/src/presentation/hooks/tasks/types';
import { CategoryFilters } from './CategoryFilters';

interface FiltersProps {
  filters: TaskFilters;
  setFilters: (filters: TaskFilters) => void;
}

export const Filters = ({ filters, setFilters }: FiltersProps) => {
  const ShowCompletedFilters = () => {
    const handleShowCompletedChange = (checked: boolean) => {
      setFilters({
        ...filters,
        showCompleted: checked ? 'All' : 'IsNotCompleted',
      });
    };

    return (
      <Item variant="outline" size="sm" className="px-4 py-2">
        <ItemActions>
          <Checkbox
            checked={filters.showCompleted === 'All'}
            onCheckedChange={handleShowCompletedChange}
          />
        </ItemActions>
        <ItemContent>
          <ItemTitle>Show Completed</ItemTitle>
        </ItemContent>
      </Item>
    );
  };

  const ShowUnscheduledFilters = () => {
    const handleShowUnscheduledChange = (checked: boolean) => {
      setFilters({
        ...filters,
        showScheduled: checked ? 'All' : 'IsScheduled',
      });
    };

    return (
      <Item variant="outline" size="sm" className="px-4 py-2">
        <ItemActions>
          <Checkbox
            checked={filters.showScheduled === 'All'}
            onCheckedChange={handleShowUnscheduledChange}
          />
        </ItemActions>
        <ItemContent>
          <ItemTitle>Show Unscheduled</ItemTitle>
        </ItemContent>
      </Item>
    );
  };

  return (
    <div className="flex gap-4 justify-center items-center ">
      <ShowCompletedFilters />
      <ShowUnscheduledFilters />
      <CategoryFilters
        selectedCategoryId={filters.categoryId}
        onCategorySelect={(categoryId) =>
          setFilters({ ...filters, categoryId })
        }
      />
    </div>
  );
};
