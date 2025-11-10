import { CalendarCheckIcon } from 'lucide-react';
import { Button } from '../../ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '../../ui/empty';

export const TaskListEmpty = () => {
  return (
    <Empty className="from-muted/50 to-background h-full bg-linear-to-b from-30%">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CalendarCheckIcon />
        </EmptyMedia>
        <EmptyTitle>No Tasks!!</EmptyTitle>
        <EmptyDescription>
          You&apos;re all caught up. New tasks will appear here.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" size="sm">
          Add Task
        </Button>
      </EmptyContent>
    </Empty>
  );
};
