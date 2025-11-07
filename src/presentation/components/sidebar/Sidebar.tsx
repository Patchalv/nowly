import {
  CalendarCheckIcon,
  ClipboardListIcon,
  ListTodoIcon,
} from 'lucide-react';

export const Sidebar = () => {
  const sideBarItemStrokeWidth = 1.5;
  const sideBarItemClasses =
    'text-primary-foreground size-10 p-1 rounded-md hover:text-accent-foreground hover:bg-primary-foreground';

  return (
    <div className="h-screen w-full max-w-16 bg-accent-foreground flex flex-col justify-between py-4 gap-4">
      <div className="flex flex-col items-center gap-4">
        <CalendarCheckIcon
          strokeWidth={sideBarItemStrokeWidth}
          className={sideBarItemClasses}
        />
        <ClipboardListIcon
          strokeWidth={sideBarItemStrokeWidth}
          className={sideBarItemClasses}
        />
      </div>
      <div className="flex flex-col items-center gap-4">
        <ListTodoIcon
          strokeWidth={sideBarItemStrokeWidth}
          className={sideBarItemClasses}
        />
      </div>
    </div>
  );
};
