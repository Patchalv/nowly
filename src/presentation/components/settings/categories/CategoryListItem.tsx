import type { Category } from '@/src/domain/model/Category';
import { Item, ItemContent, ItemDescription, ItemTitle } from '../../ui/item';

interface CategoryListItemProps {
  category: Category;
}

export const CategoryListItem = ({ category }: CategoryListItemProps) => {
  const color = category.color;
  return (
    <Item
      variant="outline"
      className="w-full hover:bg-accent/50"
      style={{ backgroundColor: color }}
    >
      <ItemContent className="flex flex-row gap-4 items-center justify-between transition-colors duration-100">
        <div className="flex flex-row gap-4 items-center">
          <ItemTitle className="text-sm font-medium">{category.name}</ItemTitle>
          <ItemDescription className="text-sm text-muted-foreground">
            {category.emoji}
          </ItemDescription>
        </div>
      </ItemContent>
    </Item>
  );
};
