import { CalendarCheckIcon } from 'lucide-react';
import {
  CreateTaskDrawer,
  CreateTaskDrawerProps,
} from '../../dialog/create-task-drawer/CreateTaskDrawer';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '../../ui/empty';

interface TaskListEmptyProps {
  currentDate: CreateTaskDrawerProps['defaultScheduledDate'];
}

export const TaskListEmpty = ({ currentDate }: TaskListEmptyProps) => {
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
        <CreateTaskDrawer
          variant="outline"
          defaultScheduledDate={currentDate}
        />
      </EmptyContent>
    </Empty>
  );
};
