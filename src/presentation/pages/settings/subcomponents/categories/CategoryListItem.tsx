import type { Category } from '@/src/domain/model/Category';
import { DeleteCategoryButton } from '@/src/presentation/components/buttons/category/DeleteCategoryButton';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from '@/src/presentation/components/ui/item';
import { getIconComponent } from '@/src/shared/utils/icons';
import { UpdateCategoryDrawer } from './UpdateCategoryDrawer';

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
        <UpdateCategoryDrawer category={category} />
        <DeleteCategoryButton categoryId={category.id} />
      </ItemActions>
    </Item>
  );
};
