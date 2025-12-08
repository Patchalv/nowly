'use client';

import { Suspense, useState } from 'react';

import { FallbackView } from '@/src/presentation/components/loader/FallbackView';
import { CreateRecurringTaskButton } from '@/src/presentation/components/recurring/CreateRecurringTaskButton';
import { RecurringTaskItemsList } from '@/src/presentation/components/recurring/RecurringTaskItemsList';
import { Toggle } from '@/src/presentation/components/ui/toggle';
import { useRecurringTaskItems } from '@/src/presentation/hooks/recurring/useRecurringTaskItems';

function RecurringTasksPageContent() {
  const [showInactive, setShowInactive] = useState(false);
  const { data: items, isLoading } = useRecurringTaskItems(!showInactive);

  return (
    <main className="flex flex-col w-full h-full p-4 gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Recurring Tasks</h1>
        <CreateRecurringTaskButton />
      </div>

      {/* Toggle for showing inactive items */}
      <div className="flex items-center gap-2">
        <Toggle
          pressed={showInactive}
          onPressedChange={setShowInactive}
          aria-label="Show inactive recurring tasks"
        >
          <span className="text-sm">Show inactive</span>
        </Toggle>
      </div>

      {/* List */}
      <RecurringTaskItemsList items={items || []} isLoading={isLoading} />
    </main>
  );
}

export function RecurringTasksPage() {
  return (
    <Suspense fallback={<FallbackView />}>
      <RecurringTasksPageContent />
    </Suspense>
  );
}
