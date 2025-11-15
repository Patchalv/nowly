import { useDeleteTask } from '@/src/presentation/hooks/tasks/useTasks';
import { TrashIcon } from 'lucide-react';
import { ConfirmationDialog } from '../../dialog/ConfirmationDialog';
import { TooltipButton } from '../TooltipButton';

interface DeleteTaskButtonProps {
  taskId: string;
}

export const DeleteTaskButton = ({ taskId }: DeleteTaskButtonProps) => {
  const { mutateAsync: deleteTaskMutation, isPending } = useDeleteTask();

  const handleDelete = async () => {
    await deleteTaskMutation(taskId);
  };

  return (
    <ConfirmationDialog
      triggerElement={
        <TooltipButton
          tooltip="Delete task"
          btnContent={<TrashIcon className="size-4" />}
          btnVariant="ghost"
          btnSize="icon-sm"
        />
      }
      title="Delete Task"
      description="Are you sure you want to delete this task?"
      confirmText="Delete"
      isLoading={isPending}
      onConfirm={handleDelete}
    />
  );
};
