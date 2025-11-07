'use client';

import { ROUTES } from '@/src/config/constants';
import { useNavigationStyles } from '@/src/presentation/hooks/useNavigationStyles';
import {
  CalendarCheckIcon,
  CalendarSyncIcon,
  ClipboardListIcon,
  SettingsIcon,
} from 'lucide-react';
import Link from 'next/link';

export const MobileBottomBar = () => {
  const { getIconClasses, iconStrokeWidth } = useNavigationStyles();

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
