'use client';

import { Suspense, useState } from 'react';
import { FallbackView } from '../../components/loader/FallbackView';
import { TaskFilters } from '../../hooks/tasks/types';
import { Filters } from './subcomponents/Filters';
import { TaskListSection } from './subcomponents/TaskListSection';

function AllTasksViewContent() {
  const [filters, setFilters] = useState<TaskFilters>({
    categoryId: undefined,
    showCompleted: 'IsNotCompleted',
    showScheduled: 'All',
    search: '',
  });

  return (
    <main className="flex flex-col w-full h-full p-4 gap-8">
      <h1 className="text-2xl font-bold text-center">All Tasks</h1>
      <Filters filters={filters} setFilters={setFilters} />
      <TaskListSection filters={filters} />
    </main>
  );
}

export function AllTasksView() {
  return (
    <Suspense fallback={<FallbackView />}>
      <AllTasksViewContent />
    </Suspense>
  );
}
