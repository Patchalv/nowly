import { Category } from '@/src/domain/model/Category';
import {
  UpdateCategoryInput,
  updateCategorySchema,
} from '@/src/domain/validation/category/category.schema';
import { useUpdateCategory } from '@/src/presentation/hooks/categories/useCategories';
import { cn } from '@/src/shared/utils/cn';
import { zodResolver } from '@hookform/resolvers/zod';
import { PaletteIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '../../ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '../../ui/form';
import { Input } from '../../ui/input';
import { ColorPicker } from '../pickers/ColorPicker';
import { IconPicker } from '../pickers/IconPicker';

interface UpdateCategoryFormProps {
  category: Category;
  className?: string;
  onSuccess?: () => void;
}

export const UpdateCategoryForm = ({
  category,
  className,
  onSuccess,
}: UpdateCategoryFormProps) => {
  const { mutate: updateCategory, isPending } = useUpdateCategory();

  const form = useForm<UpdateCategoryInput>({
    resolver: zodResolver(updateCategorySchema),
    defaultValues: {
      name: category.name,
      color: category.color,
      icon: category.icon,
      position: category.position,
    },
  });

  const onSubmit = (data: UpdateCategoryInput) => {
    updateCategory(
      {
        categoryId: category.id,
        updates: {
          name: data.name,
          color: data.color,
          icon: data.icon ?? undefined,
          position: data.position,
        },
      },
      {
        onSuccess: (response) => {
          if (response.success) {
            form.reset({
              name: data.name ?? category.name,
              color: data.color ?? category.color,
              icon: data.icon ?? category.icon,
              position: data.position ?? category.position,
            });
            onSuccess?.();
          }
        },
      }
    );
  };

  return (
    <Form {...form}>
      <form
        id="update-category-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('space-y-4', className)}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Work"
                  autoComplete="off"
                  autoFocus
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <ColorPicker
                  icon={<PaletteIcon className="size-4" />}
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <IconPicker
                  value={field.value ?? undefined}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          size="default"
          className="w-full"
          disabled={isPending}
        >
          {isPending ? 'Updating...' : 'Update Category'}
        </Button>
      </form>
    </Form>
  );
};
