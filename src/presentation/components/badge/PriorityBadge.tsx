import { PRIORITY_CONFIG } from '@/src/config/constants';
import { TaskPriority } from '@/src/domain/types/tasks';
import { FlagIcon } from 'lucide-react';

export const PriorityBadge = ({ priority }: { priority: TaskPriority }) => {
  return (
    <span className="flex flex-row gap-2 items-center">
      <FlagIcon
        className="size-4"
        style={{ color: PRIORITY_CONFIG[priority].color }}
      />
      {priority}
    </span>
  );
};
