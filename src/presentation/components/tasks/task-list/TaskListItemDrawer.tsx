'use client';

import * as React from 'react';

import { Task } from '@/src/domain/model/Task';
import { useMediaQuery } from '@/src/presentation/hooks/useMediaQuery';
import { SettingsIcon } from 'lucide-react';
import { TooltipButton } from '../../buttons/TooltipButton';
import { UpdateTaskForm } from '../../forms/UpdateTaskForm';
import { Button } from '../../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerTrigger,
} from '../../ui/drawer';

interface TaskListItemDrawerProps {
  task: Task;
}

export function TaskListItemDrawer({ task }: TaskListItemDrawerProps) {
  const [open, setOpen] = React.useState(false);
  const { isDesktop } = useMediaQuery();

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <TooltipButton
            tooltip="Update"
            btnContent={<SettingsIcon className="size-4" />}
            btnVariant="ghost"
            btnSize="icon"
          />
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
          </DialogHeader>
          <UpdateTaskForm task={task} onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <TooltipButton
          tooltip="Update"
          btnContent={<SettingsIcon className="size-4" />}
          btnVariant="ghost"
          btnSize="icon"
        />
      </DrawerTrigger>
      <DrawerContent className="p-4">
        <UpdateTaskForm task={task} onSuccess={() => setOpen(false)} />
        <DrawerFooter className="mt-0">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
