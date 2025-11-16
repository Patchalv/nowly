import {
  CreateCategoryInput,
  createCategorySchema,
} from '@/src/domain/validation/category/category.schema';
import { useCreateCategory } from '@/src/presentation/hooks/categories/useCategories';
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

export interface CreateCategoryFormProps {
  className?: string;
  onSuccess?: () => void;
}

export const CreateCategoryForm = ({
  className,
  onSuccess,
}: CreateCategoryFormProps) => {
  const { mutate: createCategory, isPending } = useCreateCategory();

  const form = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: '',
      color: undefined,
      icon: undefined,
    },
  });

  const onSubmit = (data: CreateCategoryInput) => {
    // Convert CreateCategoryInput to FormData
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('color', data.color);
    formData.append('icon', data.icon ?? '');
    createCategory(formData, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
    });
  };

  return (
    <Form {...form}>
      <form
        id="create-category-form"
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
          {isPending ? 'Creating...' : 'Create Category'}
        </Button>
      </form>
    </Form>
  );
};
