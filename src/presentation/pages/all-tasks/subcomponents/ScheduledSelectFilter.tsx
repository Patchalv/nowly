import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/src/presentation/components/ui/select';
import { TaskFilters } from '@/src/presentation/hooks/tasks/types';

interface ScheduledSelectFilterProps {
  filters: TaskFilters;
  handleFiltersChange: (filters: TaskFilters) => void;
}

export const ScheduledSelectFilter = ({
  filters,
  handleFiltersChange,
}: ScheduledSelectFilterProps) => {
  const handleScheduledChange = (value: string) => {
    handleFiltersChange({
      ...filters,
      showScheduled: value as TaskFilters['showScheduled'],
    });
  };
  return (
    <Select value={filters.showScheduled} onValueChange={handleScheduledChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select scheduled tasks" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Scheduled</SelectLabel>
          <SelectItem value="IsNotScheduled">Unscheduled only</SelectItem>
          <SelectItem value="IsScheduled">Scheduled only</SelectItem>
          <SelectItem value="All">All</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
