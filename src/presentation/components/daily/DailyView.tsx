'use client';

import { WeekCarousel } from '@/src/presentation/components/week-carousel/WeekCarousel';
import { formatDateForURL, parseDateFromURL } from '@/src/shared/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function DailyViewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get date from URL or default to today
  const dateParam = searchParams.get('date');
  const selectedDate = parseDateFromURL(dateParam);

  const handleDateChange = (newDate: Date) => {
    const formattedDate = formatDateForURL(newDate);
    router.push(`/daily?date=${formattedDate}`);
  };

  return (
    <div className="flex min-h-screen flex-col w-full">
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
        <div className="flex min-h-screen flex-col items-center justify-center p-6">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <DailyViewContent />
    </Suspense>
  );
}
