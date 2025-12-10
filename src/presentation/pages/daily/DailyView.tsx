'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useTransition } from 'react';

import { FallbackView } from '@/src/presentation/components/loader/FallbackView';
import { TaskListSection } from '@/src/presentation/pages/daily/subcomponents/task-list/TaskListSection';
import { WeekCarousel } from '@/src/presentation/pages/daily/subcomponents/week-carousel/WeekCarousel';
import { formatDateForURL, parseDateFromURL } from '@/src/shared/utils/date';

const DailyViewContent = () => {
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
      <TaskListSection date={selectedDate} />
    </main>
  );
};

export function DailyView() {
  return (
    <Suspense fallback={<FallbackView />}>
      <DailyViewContent />
    </Suspense>
  );
}
