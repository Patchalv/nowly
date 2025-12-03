'use client';

import { Button } from '@/src/presentation/components/ui/button';
import { useOverdueTasks } from '@/src/presentation/hooks/tasks/useOverdueTasks';
import { AlertCircle } from 'lucide-react';

interface OverdueTasksBannerProps {
  isToday: boolean;
}

export function OverdueTasksBanner({ isToday }: OverdueTasksBannerProps) {
  const { overdueCount, isLoading, rolloverAll, isRollingOver } =
    useOverdueTasks();

  // Only show when viewing today and there are overdue tasks
  if (!isToday || isLoading || overdueCount === 0) {
    return null;
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
        <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
          {overdueCount} overdue {overdueCount === 1 ? 'task' : 'tasks'}
        </span>
      </div>
      <Button onClick={rolloverAll} disabled={isRollingOver} size="sm">
        {isRollingOver ? 'Moving...' : 'Rollover to Today'}
      </Button>
    </div>
  );
}
