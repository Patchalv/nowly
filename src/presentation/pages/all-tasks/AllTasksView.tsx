'use client';

import { useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

import { UI } from '@/src/config/constants';
import { TaskFilters } from '@/src/presentation/hooks/tasks/types';
import { Filters } from '@/src/presentation/pages/all-tasks/subcomponents/Filters';
import { TaskListSection } from '@/src/presentation/pages/all-tasks/subcomponents/TaskListSection';

export function AllTasksView() {
  const [filters, setFilters] = useState<TaskFilters>({
    categoryId: undefined,
    showCompleted: 'IsNotCompleted',
    showScheduled: 'IsNotScheduled',
    search: '',
  });

  const handleFiltersChangeDebounced = useDebouncedCallback(
    (filters: TaskFilters) => {
      setFilters((prevFilters) => ({ ...prevFilters, ...filters }));
    },
    UI.SEARCH_DEBOUNCE_MS,
    { leading: false, trailing: true }
  );

  return (
    <main className="flex flex-col w-full h-full p-4 gap-8">
      <h1 className="text-2xl font-bold text-center">All Tasks</h1>
      <Filters
        filters={filters}
        handleFiltersChange={handleFiltersChangeDebounced}
      />
      <TaskListSection filters={filters} />
    </main>
  );
}
