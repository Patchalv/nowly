import { Task } from '@/src/domain/model/Task';
import { useUpdateTask } from '@/src/presentation/hooks/tasks/useTasks';
import { Checkbox } from '../../ui/checkbox';

interface TaskCheckboxProps {
  task: Task;
}

export const TaskCheckbox = ({ task }: TaskCheckboxProps) => {
  const { mutate: updateTask, isPending } = useUpdateTask();
  const handleToggleComplete = () => {
    updateTask({
      taskId: task.id,
      updates: { completed: !task.completed },
    });
  };
  return (
    <Checkbox
      checked={task.completed}
      onCheckedChange={handleToggleComplete}
      disabled={isPending}
    />
  );
};
