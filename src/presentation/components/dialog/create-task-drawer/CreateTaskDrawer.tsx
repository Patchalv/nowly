'use client';

import * as React from 'react';

import { useMediaQuery } from '@/src/presentation/hooks/useMediaQuery';
import { VariantProps } from 'class-variance-authority';
import { CreateTaskButton } from '../../buttons/create-task-button/CreateTaskButton';
import {
  CreateTaskForm,
  CreateTaskFormProps,
} from '../../forms/task/CreateTaskForm';
import { Button, buttonVariants } from '../../ui/button';
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

const DIALOG_TITLE = 'Create Task';
const CANCEL_BUTTON_TEXT = 'Cancel';

export interface CreateTaskDrawerProps {
  variant?: VariantProps<typeof buttonVariants>['variant'];
  defaultScheduledDate?: CreateTaskFormProps['defaultScheduledDate'];
}

export function CreateTaskDrawer({
  variant = 'ghost',
  defaultScheduledDate,
}: CreateTaskDrawerProps) {
  const [open, setOpen] = React.useState(false);
  const { isDesktop } = useMediaQuery();

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <CreateTaskButton variant={variant} />
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{DIALOG_TITLE}</DialogTitle>
          </DialogHeader>
          <CreateTaskForm
            defaultScheduledDate={defaultScheduledDate}
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <CreateTaskButton variant={variant} />
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{DIALOG_TITLE}</DrawerTitle>
        </DrawerHeader>
        <CreateTaskForm
          defaultScheduledDate={defaultScheduledDate}
          className="px-4"
          onSuccess={() => setOpen(false)}
        />
        <DrawerFooter className="mt-0">
          <DrawerClose asChild>
            <Button variant="outline">{CANCEL_BUTTON_TEXT}</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
