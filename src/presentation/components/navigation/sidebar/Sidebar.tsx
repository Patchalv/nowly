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

export const Sidebar = () => {
  const { getIconClasses, iconStrokeWidth } = useNavigationStyles();

  return (
    <div className="h-full w-full max-w-16 bg-accent-foreground hidden sm:flex flex-col justify-between py-4 gap-4">
      <div className="flex flex-col items-center gap-4">
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
      </div>
      <div className="flex flex-col items-center gap-4">
        <Link href={ROUTES.SETTINGS}>
          <SettingsIcon
            strokeWidth={iconStrokeWidth}
            className={getIconClasses(ROUTES.SETTINGS)}
          />
        </Link>
      </div>
    </div>
  );
};
