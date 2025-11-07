'use client';

import { WeekCarousel } from '@/src/presentation/components/week-carousel/WeekCarousel';
import { formatDateForURL, parseDateFromURL } from '@/src/shared/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useTransition } from 'react';

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
    <div className="flex flex-col w-full h-full">
      {/* Week Carousel */}
      <div className="w-full max-w-4xl mx-auto mb-8">
        <WeekCarousel
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
        />
      </div>

      {/* Placeholder for task list */}
      <div className="flex-1">
        <div className="rounded-lg border border-dashed border-muted-foreground/25 p-8 text-center">
          <p className="text-muted-foreground">
            Tasks for{' '}
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}{' '}
            will appear here
          </p>
        </div>
      </div>
    </div>
  );
}

export function DailyView() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full flex-col items-center justify-center p-6">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <DailyViewContent />
    </Suspense>
  );
}
