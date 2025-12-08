import { Input } from '@/src/presentation/components/ui/input';
import { TaskFilters } from '@/src/presentation/hooks/tasks/types';

interface TaskSearchProps {
  filters: TaskFilters;
  handleFiltersChange: (filters: TaskFilters) => void;
}

export const TaskSearch = ({
  filters,
  handleFiltersChange,
}: TaskSearchProps) => {
  return (
    <Input
      type="text"
      className="max-w-[400px]"
      placeholder="Search tasks"
      value={filters.search}
      onChange={(e) =>
        handleFiltersChange({ ...filters, search: e.target.value })
      }
    />
  );
};
