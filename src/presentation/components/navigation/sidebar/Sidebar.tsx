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
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';

export const Sidebar = () => {
  const { getIconClasses, iconStrokeWidth } = useNavigationStyles();

  const renderNavigationItem = (
    route: string,
    icon: React.ReactNode,
    tooltip: string
  ) => {
    return (
      <Link key={route} href={route}>
        <Tooltip>
          <TooltipTrigger asChild>{icon}</TooltipTrigger>
          <TooltipContent side="right">
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </Link>
    );
  };

  const NAVIGATION_ITEMS = [
    {
      route: ROUTES.DAILY,
      icon: (
        <CalendarCheckIcon
          strokeWidth={iconStrokeWidth}
          className={getIconClasses(ROUTES.DAILY)}
        />
      ),
      tooltip: 'Daily',
    },
    {
      route: ROUTES.ALL_TASKS,
      icon: (
        <ClipboardListIcon
          strokeWidth={iconStrokeWidth}
          className={getIconClasses(ROUTES.ALL_TASKS)}
        />
      ),
      tooltip: 'All Tasks',
    },
    {
      route: ROUTES.RECURRING,
      icon: (
        <CalendarSyncIcon
          strokeWidth={iconStrokeWidth}
          className={getIconClasses(ROUTES.RECURRING)}
        />
      ),
      tooltip: 'Recurring',
    },
  ];

  return (
    <div className="h-full w-full max-w-16 bg-accent-foreground hidden sm:flex flex-col justify-between py-4 gap-4">
      <div className="flex flex-col items-center gap-4">
        {NAVIGATION_ITEMS.map((item) =>
          renderNavigationItem(item.route, item.icon, item.tooltip)
        )}
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
