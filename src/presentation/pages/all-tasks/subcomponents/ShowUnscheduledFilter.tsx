import { Checkbox } from '@/src/presentation/components/ui/checkbox';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
} from '@/src/presentation/components/ui/item';
import { TaskFilters } from '@/src/presentation/hooks/tasks/types';

interface ShowUnscheduledFiltersProps {
  filters: TaskFilters;
  setFilters: (filters: TaskFilters) => void;
}

export const ShowUnscheduledFilters = ({
  filters,
  setFilters,
}: ShowUnscheduledFiltersProps) => {
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
