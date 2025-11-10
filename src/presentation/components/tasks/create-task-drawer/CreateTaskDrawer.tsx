'use client';

import * as React from 'react';

import { CreateTaskInput } from '@/src/domain/validation/task/task.schema';
import { useMediaQuery } from '@/src/presentation/hooks/useMediaQuery';
import { CreateTaskForm } from '../../forms/CreateTaskForm';
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
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '../../ui/drawer';
import { CreateTaskButton } from '../create-task-button/CreateTaskButton';

export function CreateTaskDrawer() {
  const [open, setOpen] = React.useState(false);
  const { isDesktop } = useMediaQuery();

  const onSubmit = async (data: CreateTaskInput) => {
    console.log(data);
  };

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <CreateTaskButton />
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
          </DialogHeader>
          <CreateTaskForm onSubmit={onSubmit} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <CreateTaskButton />
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>New Task</DrawerTitle>
        </DrawerHeader>
        <CreateTaskForm className="px-4" onSubmit={onSubmit} />
        <DrawerFooter className="mt-0">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
