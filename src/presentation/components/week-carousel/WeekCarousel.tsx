'use client';

import type { DayInfo, WeekDay } from '@/src/domain/types/date';
import { Button } from '@/src/presentation/components/ui/button';
import {
  addWeeks,
  getISOWeek,
  getWeekDates,
  isSameDay,
} from '@/src/shared/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

interface WeekCarouselProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const weekDayLabels: WeekDay[] = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function WeekCarousel({
  selectedDate,
  onDateChange,
}: WeekCarouselProps) {
  // Track which week is currently visible (separate from selected date)
  const [visibleWeekStart, setVisibleWeekStart] = useState(() => {
    const weekDates = getWeekDates(selectedDate);
    return weekDates[0]; // Monday of the week containing selectedDate
  });

  // Optimistic selected date for instant UI feedback
  const [optimisticDate, setOptimisticDate] = useState<Date | null>(null);

  const today = new Date();
  const weekNumber = getISOWeek(visibleWeekStart);
  const weekDates = getWeekDates(visibleWeekStart);

  // Use optimistic date if set, otherwise use the actual selected date
  const displayedSelectedDate = optimisticDate || selectedDate;

  // Sync visible week when selected date changes to a different week
  // Only depends on selectedDate, not visibleWeekStart (to allow arrow navigation)
  useEffect(() => {
    const selectedWeekDates = getWeekDates(selectedDate);
    const selectedWeekMonday = selectedWeekDates[0];

    // Don't sync visible week if we're in the middle of an optimistic update
    // This prevents flickering when clicking a date in a different week
    if (!optimisticDate) {
      // Only update visible week if it actually changed (prevents re-render loop)
      // selectedDate is recreated on every render, so we compare by value not reference
      setVisibleWeekStart((current) =>
        isSameDay(current, selectedWeekMonday) ? current : selectedWeekMonday
      );
    }

    // Clear optimistic state only if it matches the actual selected date
    // This prevents flickering when URL is still updating
    setOptimisticDate((current) => {
      if (!current) return null;
      return isSameDay(current, selectedDate) ? null : current;
    });
  }, [selectedDate, optimisticDate]);

  const handlePreviousWeek = () => {
    // Navigate to the previous week (just changes what's visible)
    const previousWeekMonday = addWeeks(visibleWeekStart, -1);
    setVisibleWeekStart(previousWeekMonday);
    // Clear optimistic date when navigating weeks
    setOptimisticDate(null);
  };

  const handleNextWeek = () => {
    // Navigate to the next week (just changes what's visible)
    const nextWeekMonday = addWeeks(visibleWeekStart, 1);
    setVisibleWeekStart(nextWeekMonday);
    // Clear optimistic date when navigating weeks
    setOptimisticDate(null);
  };

  const handleDateClick = (date: Date) => {
    // Set optimistic date immediately for instant UI feedback
    setOptimisticDate(date);
    // Update the selected date (which updates URL)
    onDateChange(date);
  };

  const days: DayInfo[] = weekDates.map((date, index) => ({
    date,
    dayOfWeek: weekDayLabels[index],
    dayOfMonth: date.getDate(),
    isSelected: isSameDay(date, displayedSelectedDate),
    isToday: isSameDay(date, today),
  }));

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Previous week button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePreviousWeek}
          className="h-8 w-8 shrink-0 sm:h-10 sm:w-10"
          aria-label="Previous week"
        >
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>

        {/* Week display */}
        <div className="flex flex-1 items-center gap-1 overflow-hidden rounded-lg p-1.5 sm:gap-2 sm:p-2">
          {/* Week number */}
          <div className="flex shrink-0 flex-col items-center justify-center px-1 sm:px-2">
            <span className="text-xs font-medium text-muted-foreground">W</span>
            <span className="text-sm font-bold text-teal-600">
              {weekNumber}
            </span>
          </div>

          {/* Separator */}
          <div className="h-10 w-px bg-border sm:h-12" />

          {/* Days grid */}
          <div className="flex flex-1 items-center justify-around gap-0.5 sm:gap-1">
            {days.map((day, index) => {
              const isSelected = day.isSelected;
              const isToday = day.isToday;

              return (
                <button
                  key={index}
                  onClick={() => handleDateClick(day.date)}
                  className={`
                    flex min-w-[2rem] flex-col items-center justify-center
                    rounded-lg px-1 py-1 transition-colors
                    sm:min-w-[2.5rem] sm:px-2 sm:py-1.5
                    ${
                      isSelected
                        ? 'bg-teal-600 text-white'
                        : isToday
                          ? 'ring-2 ring-teal-600 hover:bg-muted'
                          : 'hover:bg-muted'
                    }
                  `}
                  aria-label={`${day.dayOfWeek}, ${day.date.getFullYear()}-${String(day.date.getMonth() + 1).padStart(2, '0')}-${String(day.date.getDate()).padStart(2, '0')}`}
                  aria-current={isSelected ? 'date' : undefined}
                >
                  <span
                    className={`
                      text-xs font-medium
                      ${isSelected ? 'text-white' : 'text-muted-foreground'}
                    `}
                  >
                    {day.dayOfWeek}
                  </span>
                  <span
                    className={`
                      text-sm font-semibold
                      ${isSelected ? 'text-white' : 'text-foreground'}
                    `}
                  >
                    {day.dayOfMonth}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Next week button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextWeek}
          className="h-8 w-8 shrink-0 sm:h-10 sm:w-10"
          aria-label="Next week"
        >
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </div>
    </div>
  );
}
