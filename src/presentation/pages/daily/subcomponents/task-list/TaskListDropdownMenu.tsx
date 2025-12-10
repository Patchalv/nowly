'use client';

import { MoreVerticalIcon } from 'lucide-react';

import { Button } from '@/src/presentation/components/ui/button';
import { Checkbox } from '@/src/presentation/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/src/presentation/components/ui/dropdown-menu';
import { Label } from '@/src/presentation/components/ui/label';

interface TaskListDropdownMenuProps {
  showCompleted: boolean;
  setShowCompleted: (showCompleted: boolean) => void;
}

export function TaskListDropdownMenu({
  showCompleted,
  setShowCompleted,
}: TaskListDropdownMenuProps) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" aria-label="Open menu" size="icon-sm">
          <MoreVerticalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40" align="end">
        <DropdownMenuLabel>Display options</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem className="flex items-center gap-3">
            <Checkbox
              id="show-completed"
              checked={showCompleted}
              onCheckedChange={(checked) =>
                setShowCompleted(checked as boolean)
              }
            />
            <Label htmlFor="show-completed">Show completed</Label>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
