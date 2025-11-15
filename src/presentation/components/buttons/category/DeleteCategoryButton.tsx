import { useDeleteCategory } from '@/src/presentation/hooks/categories/useCategories';
import { TrashIcon } from 'lucide-react';
import { ConfirmationDialog } from '../../dialog/ConfirmationDialog';
import { TooltipButton } from '../TooltipButton';

interface DeleteCategoryButtonProps {
  categoryId: string;
}

export const DeleteCategoryButton = ({
  categoryId,
}: DeleteCategoryButtonProps) => {
  const { mutateAsync: deleteCategoryMutation, isPending } =
    useDeleteCategory();

  const handleDelete = async () => {
    await deleteCategoryMutation(categoryId);
  };

  return (
    <ConfirmationDialog
      triggerElement={
        <TooltipButton
          tooltip="Delete category"
          btnContent={<TrashIcon className="size-4" />}
          btnVariant="ghost"
          btnSize="icon-sm"
        />
      }
      title="Delete Category"
      description="Are you sure you want to delete this category?"
      confirmText="Delete"
      isLoading={isPending}
      onConfirm={handleDelete}
    />
  );
};
