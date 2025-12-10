import type { RecurringTaskItem } from '@/src/domain/types/recurring';
import { Skeleton } from '@/src/presentation/components/ui/skeleton';
import { RecurringTaskItemCard } from './RecurringTaskItemCard';

interface RecurringTaskItemsListProps {
  items: RecurringTaskItem[];
  isLoading?: boolean;
}

export function RecurringTaskItemsList({
  items,
  isLoading,
}: RecurringTaskItemsListProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  // Empty state
  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">No recurring tasks yet</h3>
          <p className="text-sm text-muted-foreground">
            Create a recurring task to see it here
          </p>
        </div>
      </div>
    );
  }

  // List of items
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <RecurringTaskItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
