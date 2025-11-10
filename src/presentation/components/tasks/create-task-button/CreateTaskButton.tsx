import { PlusIcon } from 'lucide-react';
import { Button } from '../../ui/button';

interface CreateTaskButtonProps {
  onClick?: () => void;
}

export const CreateTaskButton = ({ onClick }: CreateTaskButtonProps) => {
  return (
    <Button variant="ghost" size="default" onClick={onClick ?? undefined}>
      <PlusIcon className="size-4" />
      <p className="text-sm font-medium">Create Task</p>
    </Button>
  );
};
