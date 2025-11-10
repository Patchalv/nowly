'use client';

import { WeekCarousel } from '@/src/presentation/components/week-carousel/WeekCarousel';
import { formatDateForURL, parseDateFromURL } from '@/src/shared/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useTransition } from 'react';
import { FallbackView } from '../../components/loader/FallbackView';
import { CreateTaskDrawer } from '../../components/tasks/create-task-drawer/CreateTaskDrawer';
import { TaskList } from '../../components/tasks/task-list/TaskList';

// Example task type and example tasks list just for the purpose of developing the component.
// TODO: Remove this once the task list is implemented.
export type ExampleTask = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
};

const exampleTasks: ExampleTask[] = [
  {
    id: '1',
    title: 'Task 1',
    description: 'Description 1',
    completed: false,
  },
  {
    id: '2',
    title: 'Task 2',
    description: 'Description 2',
    completed: false,
  },
  {
    id: '3',
    title: 'Task 3',
    description: 'Description 3',
    completed: false,
  },
];

function DailyViewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Get date from URL or default to today
  const dateParam = searchParams.get('date');
  const selectedDate = parseDateFromURL(dateParam);

  const handleDateChange = (newDate: Date) => {
    const formattedDate = formatDateForURL(newDate);
    // Use startTransition to make the navigation non-blocking
    // This keeps the UI responsive while the URL updates
    startTransition(() => {
      router.push(`/daily?date=${formattedDate}`);
    });
  };

  return (
    <main className="flex flex-col w-full h-full">
      {/* Week Carousel */}
      <section className="w-full max-w-4xl mx-auto mb-8">
        <WeekCarousel
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
        />
      </section>

      {/* Task list */}
      <section className="p-4">
        <TaskList tasks={exampleTasks} />
      </section>

      <section className="p-4">
        <CreateTaskDrawer />
      </section>
    </main>
  );
}

export function DailyView() {
  return (
    <Suspense fallback={<FallbackView />}>
      <DailyViewContent />
    </Suspense>
  );
}
