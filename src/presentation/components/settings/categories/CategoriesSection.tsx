import { CategoryList } from './CategoryList';
import { CreateCategoryDrawer } from './CreateCategoryDrawer';

export const CategoriesSection = () => {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-bold">Categories</h2>
      <CategoryList />
      <div className="flex flex-col gap-4">
        <div className="flex">
          <CreateCategoryDrawer />
        </div>
      </div>
    </section>
  );
};
