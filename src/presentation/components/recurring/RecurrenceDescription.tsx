import { RRule } from 'rrule';

import type { RecurringFrequency } from '@/src/domain/types/recurring';
import { handleError } from '@/src/shared/errors';

interface RecurrenceDescriptionProps {
  frequency: RecurringFrequency;
  rruleString?: string;
}

/**
 * Displays a human-readable description of a recurrence pattern.
 * Uses rrule library's toText() method for accurate descriptions.
 */
export function RecurrenceDescription({
  frequency,
  rruleString,
}: RecurrenceDescriptionProps) {
  // Try to parse rrule string for accurate description
  if (rruleString) {
    try {
      const rule = RRule.fromString(rruleString);
      const text = rule.toText();
      // Capitalize first letter
      return (
        <span className="text-sm text-muted-foreground">
          {text.charAt(0).toUpperCase() + text.slice(1)}
        </span>
      );
    } catch {
      // Fall through to simple frequency text if parsing fails
      handleError.silent(new Error('Failed to parse rrule string'));
    }
  }

  // Fallback to simple frequency descriptions
  const frequencyText: Record<RecurringFrequency, string> = {
    daily: 'Every day',
    weekly: 'Every week',
    monthly: 'Every month',
    yearly: 'Every year',
    weekdays: 'Every weekday',
    weekends: 'Every weekend',
  };

  return (
    <span className="text-sm text-muted-foreground">
      {frequencyText[frequency]}
    </span>
  );
}
