import { Checkbox } from '@/src/presentation/components/ui/checkbox';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
} from '@/src/presentation/components/ui/item';
import { TaskFilters } from '@/src/presentation/hooks/tasks/types';

interface ShowCompletedFiltersProps {
  filters: TaskFilters;
  handleFiltersChange: (filters: TaskFilters) => void;
}

export const ShowCompletedFilters = ({
  filters,
  handleFiltersChange,
}: ShowCompletedFiltersProps) => {
  const handleShowCompletedChange = (checked: boolean) => {
    handleFiltersChange({
      ...filters,
      showCompleted: checked ? 'All' : 'IsNotCompleted',
    });
  };

  return (
    <Item variant="outline" size="sm" className="px-4 py-2 w-[200px]">
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
