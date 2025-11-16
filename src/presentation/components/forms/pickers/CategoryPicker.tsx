import { useCategories } from '@/src/presentation/hooks/categories/useCategories';
import { TagIcon } from 'lucide-react';
import { useState } from 'react';
import { TooltipButton } from '../../buttons/TooltipButton';
import { Button } from '../../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';

interface CategoryPickerProps {
  categoryId?: string | null;
  onChange: (categoryId: string | null) => void;
}

export const CategoryPicker = ({
  categoryId,
  onChange,
}: CategoryPickerProps) => {
  const [open, setOpen] = useState(false);
  const { data: categories, isLoading, error } = useCategories();
  const userCategories = categories && categories.length > 0 ? categories : [];

  if (isLoading) {
    return (
      <TooltipButton
        tooltip="Category"
        btnVariant="ghost"
        btnSize="icon"
        btnContent={<TagIcon className="size-4" />}
      />
    );
  }

  if (error) {
    return;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <TooltipButton
          tooltip="Category"
          btnVariant="ghost"
          btnSize="icon"
          style={{
            backgroundColor: categories?.find((c) => c.id === categoryId)
              ?.color,
          }}
          btnContent={<TagIcon className="size-4" />}
        />
      </PopoverTrigger>
      <PopoverContent>
        <div className="flex flex-col gap-2">
          {userCategories.map((category) => (
            <Button
              key={category.id}
              variant="outline"
              onClick={() => onChange(category.id)}
            >
              {category.name}
            </Button>
          ))}
          <Button variant="outline" onClick={() => onChange(null)}>
            None
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
