'use client';

import * as React from 'react';

import { useMediaQuery } from '@/src/presentation/hooks/useMediaQuery';
import { CreateCategoryForm } from '../../forms/category/CreateCategoryForm';
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

const DIALOG_TITLE = 'Create Category';
const ADD_CATEGORY_BUTTON_TEXT = 'Add Category';
const CANCEL_BUTTON_TEXT = 'Cancel';

export function CreateCategoryDrawer() {
  const [open, setOpen] = React.useState(false);
  const { isDesktop } = useMediaQuery();

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>{ADD_CATEGORY_BUTTON_TEXT}</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{DIALOG_TITLE}</DialogTitle>
          </DialogHeader>
          <CreateCategoryForm onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button>{ADD_CATEGORY_BUTTON_TEXT}</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{DIALOG_TITLE}</DrawerTitle>
        </DrawerHeader>
        <CreateCategoryForm className="px-4" onSuccess={() => setOpen(false)} />
        <DrawerFooter className="mt-0">
          <DrawerClose asChild>
            <Button variant="outline">{CANCEL_BUTTON_TEXT}</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
