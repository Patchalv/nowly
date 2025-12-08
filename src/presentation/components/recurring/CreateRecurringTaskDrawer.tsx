'use client';

import { Button } from '@/src/presentation/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/src/presentation/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/src/presentation/components/ui/drawer';
import { useMediaQuery } from '@/src/presentation/hooks/useMediaQuery';
import { CreateRecurringTaskForm } from './CreateRecurringTaskForm';

const DIALOG_TITLE = 'Create Recurring Task';
const CANCEL_BUTTON_TEXT = 'Cancel';

export interface CreateRecurringTaskDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateRecurringTaskDrawer({
  open,
  onOpenChange,
}: CreateRecurringTaskDrawerProps) {
  const { isDesktop } = useMediaQuery();

  const handleSuccess = () => {
    onOpenChange(false);
  };

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{DIALOG_TITLE}</DialogTitle>
          </DialogHeader>
          <CreateRecurringTaskForm onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{DIALOG_TITLE}</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto max-h-[70vh]">
          <CreateRecurringTaskForm className="px-4" onSuccess={handleSuccess} />
        </div>
        <DrawerFooter className="mt-0">
          <DrawerClose asChild>
            <Button variant="outline">{CANCEL_BUTTON_TEXT}</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
