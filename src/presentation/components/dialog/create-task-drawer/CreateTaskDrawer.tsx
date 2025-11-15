'use client';

import * as React from 'react';

import { useMediaQuery } from '@/src/presentation/hooks/useMediaQuery';
import { CreateTaskButton } from '../../buttons/create-task-button/CreateTaskButton';
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

export function CreateTaskDrawer() {
  const [open, setOpen] = React.useState(false);
  const { isDesktop } = useMediaQuery();

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <CreateTaskButton />
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
          </DialogHeader>
          <CreateTaskForm onSuccess={() => setOpen(false)} />
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
          <DrawerTitle>Create Task</DrawerTitle>
        </DrawerHeader>
        <CreateTaskForm className="px-4" onSuccess={() => setOpen(false)} />
        <DrawerFooter className="mt-0">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
