import { TaskListDropdownMenu } from '@/src/presentation/pages/daily/subcomponents/task-list/TaskListDropdownMenu';

interface TaskListHeadingProps {
  title: string;
  showCompleted: boolean;
  setShowCompleted: (showCompleted: boolean) => void;
}

export const TaskListHeading = ({
  title,
  showCompleted,
  setShowCompleted,
}: TaskListHeadingProps) => {
  return (
    <div className="w-full flex items-center justify-between">
      <h1>{title}</h1>
      <TaskListDropdownMenu
        showCompleted={showCompleted}
        setShowCompleted={setShowCompleted}
      />
    </div>
  );
};
