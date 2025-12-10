import { TaskListDropdownMenu } from '@/src/presentation/pages/daily/subcomponents/task-list/TaskListDropdownMenu';

interface TaskListHeadingProps {
  title?: string;
  showCompleted: boolean;
  setShowCompleted: (showCompleted: boolean) => void;
}

export const TaskListHeading = ({
  title,
  showCompleted,
  setShowCompleted,
}: TaskListHeadingProps) => {
  return (
    <div className="w-full flex items-center">
      {title && <h1 className="text-lg font-bold">{title}</h1>}
      <div className="ml-auto">
        <TaskListDropdownMenu
          showCompleted={showCompleted}
          setShowCompleted={setShowCompleted}
        />
      </div>
    </div>
  );
};
