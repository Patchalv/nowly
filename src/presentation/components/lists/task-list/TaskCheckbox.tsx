import { Task } from '@/src/domain/model/Task';
import { useToggleTaskCompleted } from '@/src/presentation/hooks/tasks/useTasks';
import { Checkbox } from '../../ui/checkbox';

interface TaskCheckboxProps {
  task: Task;
}

export const TaskCheckbox = ({ task }: TaskCheckboxProps) => {
  const { mutate: toggleTaskCompleted, isPending } = useToggleTaskCompleted();
  const handleToggleComplete = () => {
    toggleTaskCompleted(task.id);
  };
  return (
    <Checkbox
      checked={task.completed}
      onCheckedChange={handleToggleComplete}
      disabled={isPending}
    />
  );
};
