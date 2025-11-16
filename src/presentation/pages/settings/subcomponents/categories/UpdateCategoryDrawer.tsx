'use client';

import * as React from 'react';

import { Category } from '@/src/domain/model/Category';
import { TooltipButton } from '@/src/presentation/components/buttons/TooltipButton';
import { UpdateCategoryForm } from '@/src/presentation/components/forms/category/UpdateCategoryForm';
import { Button } from '@/src/presentation/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/src/presentation/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/src/presentation/components/ui/drawer';
import { useMediaQuery } from '@/src/presentation/hooks/useMediaQuery';
import { SettingsIcon } from 'lucide-react';

const UPDATE_CATEGORY_TOOLTIP = 'Update category';
const DIALOG_TITLE = 'Category Details';
const CANCEL_BUTTON_TEXT = 'Cancel';

interface UpdateCategoryDrawerProps {
  category: Category;
}

export function UpdateCategoryDrawer({ category }: UpdateCategoryDrawerProps) {
  const [open, setOpen] = React.useState(false);
  const { isDesktop } = useMediaQuery();

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <TooltipButton
            tooltip={UPDATE_CATEGORY_TOOLTIP}
            btnContent={<SettingsIcon className="size-4" />}
            btnVariant="ghost"
            btnSize="icon"
          />
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{DIALOG_TITLE}</DialogTitle>
          </DialogHeader>
          <UpdateCategoryForm
            category={category}
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <TooltipButton
          tooltip={UPDATE_CATEGORY_TOOLTIP}
          btnContent={<SettingsIcon className="size-4" />}
          btnVariant="ghost"
          btnSize="icon"
        />
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{DIALOG_TITLE}</DrawerTitle>
        </DrawerHeader>
        <UpdateCategoryForm
          category={category}
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
