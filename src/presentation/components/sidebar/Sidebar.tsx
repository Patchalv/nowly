'use client';

import { ROUTES } from '@/src/config/constants';
import {
  CalendarCheckIcon,
  CalendarSyncIcon,
  ClipboardListIcon,
  ListTodoIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const Sidebar = () => {
  const pathname = usePathname();
  const sideBarItemStrokeWidth = 1.5;

  const isActive = (route: string) => pathname === route;

  const getIconClasses = (route: string) => {
    const baseClasses = 'size-10 p-1 rounded-md';
    const activeClasses = 'text-accent-foreground bg-primary-foreground';
    const inactiveClasses =
      'text-primary-foreground hover:text-accent-foreground hover:bg-primary-foreground';

    return `${baseClasses} ${isActive(route) ? activeClasses : inactiveClasses}`;
  };

  return (
    <div className="h-screen w-full max-w-16 bg-accent-foreground flex flex-col justify-between py-4 gap-4">
      <div className="flex flex-col items-center gap-4">
        <Link href={ROUTES.DAILY}>
          <CalendarCheckIcon
            strokeWidth={sideBarItemStrokeWidth}
            className={getIconClasses(ROUTES.DAILY)}
          />
        </Link>
        <Link href={ROUTES.ALL_TASKS}>
          <ClipboardListIcon
            strokeWidth={sideBarItemStrokeWidth}
            className={getIconClasses(ROUTES.ALL_TASKS)}
          />
        </Link>
        <Link href={ROUTES.RECURRING}>
          <CalendarSyncIcon
            strokeWidth={sideBarItemStrokeWidth}
            className={getIconClasses(ROUTES.RECURRING)}
          />
        </Link>
      </div>
      <div className="flex flex-col items-center gap-4">
        <Link href={ROUTES.SETTINGS}>
          <ListTodoIcon
            strokeWidth={sideBarItemStrokeWidth}
            className={getIconClasses(ROUTES.SETTINGS)}
          />
        </Link>
      </div>
    </div>
  );
};
