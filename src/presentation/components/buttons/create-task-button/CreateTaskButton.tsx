import { VariantProps } from 'class-variance-authority';
import { PlusIcon } from 'lucide-react';
import { Button, buttonVariants } from '../../ui/button';

interface CreateTaskButtonProps {
  text?: string;
  variant?: VariantProps<typeof buttonVariants>['variant'];
  onClick?: () => void;
}

export const CreateTaskButton = ({
  text = 'Add Task',
  variant = 'ghost',
  onClick,
}: CreateTaskButtonProps) => {
  return (
    <Button variant={variant} size="default" onClick={onClick ?? undefined}>
      {variant === 'ghost' ? <PlusIcon className="size-4" /> : null}
      <p className="text-sm font-medium">{text}</p>
    </Button>
  );
};
