'use client';

import { ROUTES } from '@/src/config/constants';
import {
  CalendarCheckIcon,
  CalendarSyncIcon,
  ClipboardListIcon,
  SettingsIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const MobileBottomBar = () => {
  const pathname = usePathname();
  const iconStrokeWidth = 1.5;

  const isActive = (route: string) => pathname === route;

  const getIconClasses = (route: string) => {
    const baseClasses = 'size-10 p-1 rounded-md';
    const activeClasses = 'text-accent-foreground bg-primary-foreground';
    const inactiveClasses =
      'text-primary-foreground hover:text-accent-foreground hover:bg-primary-foreground';

    return `${baseClasses} ${isActive(route) ? activeClasses : inactiveClasses}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex sm:hidden items-center justify-around bg-accent-foreground border-t border-sidebar-border py-2">
      <Link href={ROUTES.DAILY}>
        <CalendarCheckIcon
          strokeWidth={iconStrokeWidth}
          className={getIconClasses(ROUTES.DAILY)}
        />
      </Link>
      <Link href={ROUTES.ALL_TASKS}>
        <ClipboardListIcon
          strokeWidth={iconStrokeWidth}
          className={getIconClasses(ROUTES.ALL_TASKS)}
        />
      </Link>
      <Link href={ROUTES.RECURRING}>
        <CalendarSyncIcon
          strokeWidth={iconStrokeWidth}
          className={getIconClasses(ROUTES.RECURRING)}
        />
      </Link>
      <Link href={ROUTES.SETTINGS}>
        <SettingsIcon
          strokeWidth={iconStrokeWidth}
          className={getIconClasses(ROUTES.SETTINGS)}
        />
      </Link>
    </div>
  );
};
