import type { Category } from '@/src/domain/model/Category';
import { getIconComponent } from '@/src/shared/utils/icons';
import { PencilIcon, TrashIcon } from 'lucide-react';
import { Button } from '../../ui/button';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from '../../ui/item';

interface CategoryListItemProps {
  category: Category;
}

export const CategoryListItem = ({ category }: CategoryListItemProps) => {
  const color = category.color;
  const IconComponent = getIconComponent(category.icon);

  return (
    <Item variant="outline" className="p-0 w-full hover:bg-accent/50">
      <ItemMedia
        className="h-full py-2 px-4 border border-border rounded-l-md"
        style={{ backgroundColor: color }}
      >
        <IconComponent className="size-5" />
      </ItemMedia>

      <ItemContent className="flex flex-row gap-4 items-center justify-between transition-colors duration-100 p-4">
        <ItemTitle className="text-sm font-medium">{category.name}</ItemTitle>
      </ItemContent>
      <ItemActions className="flex flex-row gap-4 items-center justify-end transition-colors duration-100 p-4">
        <Button variant="ghost" size="icon">
          <PencilIcon className="size-4" />
        </Button>
        <Button variant="ghost" size="icon">
          <TrashIcon className="size-4" />
        </Button>
      </ItemActions>
    </Item>
  );
};
